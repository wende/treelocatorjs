#!/usr/bin/env node
// Generic OpenAI-compatible PR reviewer.
// Reads config from env, sends the PR diff to a chat-completions endpoint,
// and posts the response back as a PR comment. Used by ai-pr-review.yml for
// both Kimi (Moonshot) and GLM (z.ai), which both expose OpenAI-compatible APIs.
//
// Scope: on the first run (PR opened/reopened) it reviews the full base..head
// diff. On later pushes (synchronize) it reviews only the new commits
// (before..head) and lets the model reply "No notable changes" for trivial
// updates, appending each incremental review as a dated section to the comment.
// Force-pushes/rebases (before not an ancestor of head) fall back to a full review.

import { execFileSync } from "node:child_process";

const {
  PROVIDER_NAME = "AI",
  API_BASE,
  API_KEY,
  MODEL,
  SYSTEM_PROMPT = "You are an experienced code reviewer. Review the pull request diff for bugs, security issues, and correctness problems. Be concise; skip style nitpicks. Use markdown.",
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  PR_NUMBER,
  BASE_SHA,
  HEAD_SHA,
  ACTION = "", // pull_request action: opened | synchronize | reopened | ...
  BEFORE_SHA = "", // prior head SHA (present on synchronize)
  MAX_DIFF_CHARS = "60000",
  MAX_TOKENS = "2000",
  TEMPERATURE = "", // omit unless set; some models (e.g. kimi-for-coding) only accept 1
} = process.env;

function fail(msg) {
  console.error(`[${PROVIDER_NAME}] ${msg}`);
  process.exit(1);
}

// Parse and validate a numeric env var; fall back to the default if invalid.
function parseIntSafe(raw, fallback, label) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.warn(`[${PROVIDER_NAME}] Invalid ${label} "${raw}", using default ${fallback}.`);
    return fallback;
  }
  return n;
}

// Secrets are unavailable on fork PRs — skip cleanly instead of failing the run.
if (!API_KEY) {
  console.log(`[${PROVIDER_NAME}] No API key present (fork PR?); skipping review.`);
  process.exit(0);
}
if (!API_BASE || !MODEL) fail("API_BASE and MODEL are required.");
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER) fail("Missing GitHub context env vars.");
if (!BASE_SHA || !HEAD_SHA) fail("Missing BASE_SHA or HEAD_SHA env vars.");

// Validate numeric env vars up front to avoid NaN propagating to the API.
const maxDiffChars = parseIntSafe(MAX_DIFF_CHARS, 60000, "MAX_DIFF_CHARS");
const maxTokens = parseIntSafe(MAX_TOKENS, 2000, "MAX_TOKENS");
const temperature =
  TEMPERATURE !== "" && Number.isFinite(parseFloat(TEMPERATURE))
    ? parseFloat(TEMPERATURE)
    : undefined;

// Build the diff, excluding lockfiles and generated bundles.
// Narrowed to specific lockfile names rather than a blanket *.lock glob so
// that non-dependency lock files are still reviewed.
const excludes = [
  ":(exclude)**/pnpm-lock.yaml",
  ":(exclude)**/package-lock.json",
  ":(exclude)**/yarn.lock",
  ":(exclude)**/dist/**",
  ":(exclude)**/*.min.*",
  ":(exclude)**/_generated_*",
];

// Decide scope: incremental (only new commits) on synchronize when BEFORE_SHA
// is a real ancestor of HEAD; otherwise a full base..head review.
let incremental = false;
let rangeBase = BASE_SHA;
if (
  ACTION === "synchronize" &&
  /^[0-9a-f]{40}$/.test(BEFORE_SHA) &&
  !/^0+$/.test(BEFORE_SHA)
) {
  try {
    // Non-zero exit (rebase/force-push, or object missing) throws → full review.
    execFileSync("git", ["merge-base", "--is-ancestor", BEFORE_SHA, HEAD_SHA], {
      stdio: "ignore",
    });
    rangeBase = BEFORE_SHA;
    incremental = true;
  } catch {
    incremental = false;
  }
}

let diff;
try {
  diff = execFileSync(
    "git",
    // Double-dot (BEFORE_SHA..HEAD_SHA) makes the incremental intent explicit;
    // triple-dot would rely on merge-base semantics that could change if the
    // ancestry check above ever changes.
    ["diff", `${rangeBase}..${HEAD_SHA}`, "--", ".", ...excludes],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 50 }
  );
} catch (e) {
  fail(`git diff failed: ${e.message}`);
}

if (!diff.trim()) {
  console.log(`[${PROVIDER_NAME}] Empty diff after exclusions; nothing to review.`);
  process.exit(0);
}

let truncated = false;
let diffStat = "";
if (diff.length > maxDiffChars) {
  // Truncate at the last newline within the limit so we never split a line
  // mid-character or mid-hunk, which would produce a malformed diff.
  let sliced = diff.slice(0, maxDiffChars);
  const lastNewline = sliced.lastIndexOf("\n");
  if (lastNewline > 0) sliced = sliced.slice(0, lastNewline);
  diff = sliced;
  truncated = true;
  // Include a file-level summary so the model knows what was omitted.
  try {
    diffStat = execFileSync(
      "git",
      ["diff", `${rangeBase}..${HEAD_SHA}`, "--stat", "--", ".", ...excludes],
      { encoding: "utf8", maxBuffer: 1024 * 1024 * 5 }
    );
  } catch {
    diffStat = "";
  }
}

const scopeNote = incremental
  ? "This is an UPDATE to a pull request you have already reviewed. Below is only " +
    "the diff of the new commits pushed since your last review. Focus on these " +
    "changes. If they are trivial (docs, comments, formatting, minor tweaks) and " +
    "introduce no issues, reply with exactly: No notable changes. Otherwise review " +
    "them concisely, and note if a change appears to affect other parts of the PR."
  : "Review this pull request diff.";

const truncationNote = truncated
  ? ` (Diff was truncated to fit the context limit. Below is a summary of all changed files for context, followed by the truncated diff.)\n\n**Changed files:**\n\`\`\`\n${diffStat.trim()}\n\`\`\``
  : "";

const userContent =
  `${scopeNote}${truncationNote}\n\n` +
  "```diff\n" +
  diff +
  "\n```";

// --- Fetch helpers -------------------------------------------------------

const FETCH_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;

// Wrap fetch with a timeout and retry-on-transient-failure logic.
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      // Retry on rate-limit (429) or server errors (5xx).
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const wait = 2000 * (attempt + 1) + Math.random() * 1000; // jitter
        console.warn(
          `[${PROVIDER_NAME}] ${res.status} from ${url}, retrying in ${Math.round(wait)}ms (attempt ${attempt + 1}/${retries})…`
        );
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (e) {
      if (attempt < retries) {
        const wait = 2000 * (attempt + 1) + Math.random() * 1000;
        console.warn(
          `[${PROVIDER_NAME}] Fetch error from ${url}, retrying in ${Math.round(wait)}ms (attempt ${attempt + 1}/${retries}): ${e.message}`
        );
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
}

// Call the OpenAI-compatible chat-completions endpoint.
const endpoint = `${API_BASE.replace(/\/$/, "")}/chat/completions`;
let review;
try {
  const res = await fetchWithRetry(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      ...(temperature !== undefined ? { temperature } : {}),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    // Only log the status, not the body — some providers echo the request
    // (including the diff) on validation errors, which would leak into logs.
    fail(`API request to ${endpoint} failed with status ${res.status} (${res.statusText}).`);
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    fail(
      `API response JSON parse error from provider "${PROVIDER_NAME}" at ${endpoint}: ` +
      `${e.name || "Error"}: ${e.message}`
    );
  }

  const choice = data?.choices?.[0];
  review = choice?.message?.content?.trim();
  if (!review) {
    // Reasoning models spend tokens on reasoning_content; if they hit the cap
    // first, content comes back empty. Skip cleanly with actionable guidance.
    // Some providers return finish_reason "stop" with empty content when
    // reasoning_content absorbs all output — treat that the same way.
    if (choice?.finish_reason === "length" || choice?.finish_reason === "stop") {
      console.log(
        `[${PROVIDER_NAME}] No review content produced (finish_reason: ${choice?.finish_reason}). ` +
        `If this persists, raise MAX_TOKENS. Skipping.`
      );
      process.exit(0);
    }
    fail(`Empty response from API: ${JSON.stringify(data).slice(0, 500)}`);
  }
} catch (e) {
  fail(
    `API call error (likely during fetch) from provider "${PROVIDER_NAME}" at ${endpoint}: ` +
    `${e.name || "Error"}: ${e.message}`
  );
}

// Post the review as a PR comment.
const [owner, repo] = GITHUB_REPOSITORY.split("/");
const marker = `<!-- ai-review:${PROVIDER_NAME} -->`;
const header = `${marker}\n## 🤖 ${PROVIDER_NAME} review — \`${MODEL}\``;
const truncNote = truncated
  ? "\n\n> ⚠️ The diff was truncated; some changes were not reviewed."
  : "";

const apiBase = "https://api.github.com";
const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
};

// Find an existing comment from this reviewer, paginating through all pages
// so the marker is found even on PRs with >100 comments.
async function findExistingComment() {
  let page = 1;
  while (true) {
    const listRes = await fetchWithRetry(
      `${apiBase}/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments?per_page=100&page=${page}`,
      { headers: ghHeaders }
    );
    if (!listRes.ok) {
      // Log the status so permission/rate-limit issues are discoverable, but
      // don't fail — fall through to creating a new comment.
      console.error(
        `[${PROVIDER_NAME}] Failed to list PR comments (page ${page}): ` +
        `${listRes.status} ${listRes.statusText}. Will create a new comment.`
      );
      return null;
    }
    const comments = await listRes.json();
    if (!Array.isArray(comments) || comments.length === 0) return null;
    const found = comments.find(
      (c) => typeof c.body === "string" && c.body.includes(marker)
    );
    if (found) return found;
    if (comments.length < 100) return null; // last page
    page++;
  }
}

const existing = await findExistingComment();

// Keep the comment under GitHub's 65536-char cap by dropping the oldest
// update sections first (the base review and newest updates are kept).
// Uses a unique HTML-comment sentinel so model-generated "### Update " text
// in the review body can't corrupt the split.
const SECTION_SENTINEL = "\n<!-- ai-review-section -->\n";

function trimToLimit(text, limit = 62000) {
  if (text.length <= limit) return text;

  // Split on the sentinel; if there are no sections, hard-slice the base.
  const parts = text.split(SECTION_SENTINEL);
  if (parts.length <= 1) return text.slice(0, limit);

  const head = parts[0];
  const kept = parts.slice(1); // each is an update section
  let dropped = 0;

  const trimmedNotice =
    "\n\n> _Older review updates were trimmed to fit GitHub's comment size limit._";

  // Drop oldest sections until we fit or only one section remains.
  while (
    kept.length > 1 &&
    (head + trimmedNotice + SECTION_SENTINEL + kept.join(SECTION_SENTINEL)).length > limit
  ) {
    kept.shift();
    dropped++;
  }

  let result = head + trimmedNotice + kept.map((s) => SECTION_SENTINEL + s).join("");

  // Only include the notice if we actually dropped something.
  if (dropped === 0) {
    result = head + kept.map((s) => SECTION_SENTINEL + s).join("");
  }

  // If the base review itself is oversized (even with all sections dropped),
  // or if we still exceed the limit, hard-slice as a last resort.
  if (result.length > limit) {
    result = result.slice(0, limit);
  }

  return result;
}

let body;
if (incremental && existing) {
  // Append a dated section for this push, preserving prior review history.
  const date = new Date().toISOString().slice(0, 16).replace("T", " ");
  const section = `${SECTION_SENTINEL}### Update ${HEAD_SHA.slice(0, 7)} — ${date} UTC\n\n${review}${truncNote}`;
  body = trimToLimit(existing.body + section);
} else {
  // First run (or incremental with no prior comment): a full review sets the base.
  const opener = incremental
    ? `\n\n> _Base review unavailable; showing this push only._\n\n${review}${truncNote}`
    : `\n\n${review}${truncNote}`;
  body = `${header}${opener}`;
}

const target = existing
  ? `${apiBase}/repos/${owner}/${repo}/issues/comments/${existing.id}`
  : `${apiBase}/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`;

const postRes = await fetchWithRetry(target, {
  method: existing ? "PATCH" : "POST",
  headers: ghHeaders,
  body: JSON.stringify({ body }),
});

if (!postRes.ok) {
  fail(`Failed to post comment: ${postRes.status} ${postRes.statusText}`);
}

const verb = existing ? (incremental ? "appended update to" : "reset") : "posted";
console.log(
  `[${PROVIDER_NAME}] Review ${verb} on PR #${PR_NUMBER} (${incremental ? "incremental" : "full"}).`
);
