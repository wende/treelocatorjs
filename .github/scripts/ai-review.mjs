#!/usr/bin/env node
// Generic OpenAI-compatible PR reviewer.
// Reads config from env, sends the PR diff to a chat-completions endpoint,
// and posts the response back as a PR comment. Used by ai-pr-review.yml for
// both Kimi (Moonshot) and GLM (z.ai), which both expose OpenAI-compatible APIs.

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

let diff;
try {
  diff = execFileSync(
    "git",
    ["diff", `${BASE_SHA}...${HEAD_SHA}`, "--", ".", ...excludes],
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

const userContent =
  `Review this pull request diff.${truncated ? " (Diff truncated to fit the context limit.)" : ""}\n\n` +
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
  review = data?.choices?.[0]?.message?.content?.trim();
  if (!review) fail(`Empty response from API: ${JSON.stringify(data).slice(0, 500)}`);
} catch (e) {
  fail(`API call error: ${e.message}`);
}

// Post the review as a PR comment.
const [owner, repo] = GITHUB_REPOSITORY.split("/");
const marker = `<!-- ai-review:${PROVIDER_NAME} -->`;
const body =
  `${marker}\n## 🤖 ${PROVIDER_NAME} review — \`${MODEL}\`\n\n` +
  review +
  (truncated ? "\n\n> ⚠️ The diff was truncated; some changes were not reviewed." : "");

const apiBase = "https://api.github.com";
const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
};

// Update an existing comment from this reviewer if present, else create one.
const listRes = await fetch(
  `${apiBase}/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments?per_page=100`,
  { headers: ghHeaders }
);
const comments = listRes.ok ? await listRes.json() : [];
const existing = Array.isArray(comments)
  ? comments.find((c) => typeof c.body === "string" && c.body.includes(marker))
  : null;

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

console.log(`[${PROVIDER_NAME}] Review ${existing ? "updated" : "posted"} on PR #${PR_NUMBER}.`);
