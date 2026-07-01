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

// Secrets are unavailable on fork PRs — skip cleanly instead of failing the run.
if (!API_KEY) {
  console.log(`[${PROVIDER_NAME}] No API key present (fork PR?); skipping review.`);
  process.exit(0);
}
if (!API_BASE || !MODEL) fail("API_BASE and MODEL are required.");
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER) fail("Missing GitHub context env vars.");

// Build the diff, excluding lockfiles and generated bundles.
const excludes = [
  ":(exclude)**/pnpm-lock.yaml",
  ":(exclude)**/package-lock.json",
  ":(exclude)**/yarn.lock",
  ":(exclude)**/*.lock",
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
    ["diff", `${rangeBase}...${HEAD_SHA}`, "--", ".", ...excludes],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 50 }
  );
} catch (e) {
  fail(`git diff failed: ${e.message}`);
}

if (!diff.trim()) {
  console.log(`[${PROVIDER_NAME}] Empty diff after exclusions; nothing to review.`);
  process.exit(0);
}

const max = parseInt(MAX_DIFF_CHARS, 10);
let truncated = false;
if (diff.length > max) {
  diff = diff.slice(0, max);
  truncated = true;
}

const scopeNote = incremental
  ? "This is an UPDATE to a pull request you have already reviewed. Below is only " +
    "the diff of the new commits pushed since your last review. Focus on these " +
    "changes. If they are trivial (docs, comments, formatting, minor tweaks) and " +
    "introduce no issues, reply with exactly: No notable changes. Otherwise review " +
    "them concisely, and note if a change appears to affect other parts of the PR."
  : "Review this pull request diff.";

const userContent =
  `${scopeNote}${truncated ? " (Diff truncated to fit the context limit.)" : ""}\n\n` +
  "```diff\n" +
  diff +
  "\n```";

// Call the OpenAI-compatible chat-completions endpoint.
const url = `${API_BASE.replace(/\/$/, "")}/chat/completions`;
let review;
try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: parseInt(MAX_TOKENS, 10),
      ...(TEMPERATURE !== "" ? { temperature: parseFloat(TEMPERATURE) } : {}),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    fail(`API request failed (${res.status}): ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  review = choice?.message?.content?.trim();
  if (!review) {
    // Reasoning models spend tokens on reasoning_content; if they hit the cap
    // first, content comes back empty. Skip cleanly with actionable guidance.
    if (choice?.finish_reason === "length") {
      console.log(
        `[${PROVIDER_NAME}] Output hit the token cap before producing a review; raise MAX_TOKENS. Skipping.`
      );
      process.exit(0);
    }
    fail(`Empty response from API: ${JSON.stringify(data).slice(0, 500)}`);
  }
} catch (e) {
  fail(`API call error: ${e.message}`);
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

// Find an existing comment from this reviewer, if any.
const listRes = await fetch(
  `${apiBase}/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments?per_page=100`,
  { headers: ghHeaders }
);
const comments = listRes.ok ? await listRes.json() : [];
const existing = Array.isArray(comments)
  ? comments.find((c) => typeof c.body === "string" && c.body.includes(marker))
  : null;

// Keep the comment under GitHub's 65536-char cap by dropping the oldest
// "### Update" sections first (the base review and newest updates are kept).
function trimToLimit(text, limit = 62000) {
  if (text.length <= limit) return text;
  const parts = text.split("\n### Update ");
  if (parts.length <= 1) return text.slice(0, limit);
  const head = parts[0];
  const kept = parts.slice(1);
  const trimmed =
    "\n\n> _Older review updates were trimmed to fit GitHub's comment size limit._";
  const rebuild = () =>
    head + trimmed + kept.map((s) => "\n### Update " + s).join("");
  while (kept.length > 1 && rebuild().length > limit) kept.shift();
  return rebuild();
}

let body;
if (incremental && existing) {
  // Append a dated section for this push, preserving prior review history.
  const date = new Date().toISOString().slice(0, 10);
  const section = `\n\n### Update ${HEAD_SHA.slice(0, 7)} — ${date}\n\n${review}${truncNote}`;
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

const postRes = await fetch(target, {
  method: existing ? "PATCH" : "POST",
  headers: ghHeaders,
  body: JSON.stringify({ body }),
});

if (!postRes.ok) {
  fail(`Failed to post comment (${postRes.status}): ${(await postRes.text()).slice(0, 500)}`);
}

const verb = existing ? (incremental ? "appended update to" : "reset") : "posted";
console.log(
  `[${PROVIDER_NAME}] Review ${verb} on PR #${PR_NUMBER} (${incremental ? "incremental" : "full"}).`
);
