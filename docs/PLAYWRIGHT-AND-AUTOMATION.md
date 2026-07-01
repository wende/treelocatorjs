# Playwright & Browser Automation

This guide answers the most common automation questions up front: **how to get TreeLocator onto a page**, **how to use it from Playwright**, and **how that relates to the MCP bridge**.

## Quick reference

| I want to… | Use this | Docs |
|------------|----------|------|
| Call `window.__treelocator__` from Playwright tests | Wire runtime into the app (init wizard or Vite plugin), then `page.evaluate()` | [Browser API](./BROWSER-API.md) |
| Use TreeLocator on a localhost app **without** changing app code | Load the Chrome extension in Playwright | [Extension + Playwright](#chrome-extension--playwright) below |
| Let an AI agent inspect / click / query the live app | MCP bridge (`@treelocator/mcp`) | [MCP.md](./MCP.md) |
| Paste a one-liner in Playwright’s console to bootstrap any page | **Not supported** | [What does not exist](#what-does-not-exist) |

**Important:** Every approach assumes the TreeLocator **runtime is already running in the browser tab**. There is no bookmarklet, CDN bundle, or console snippet that injects TreeLocator onto an arbitrary third-party page.

---

## How runtime gets on the page

TreeLocator must initialize before `window.__treelocator__` exists. Pick one:

### 1. App import (recommended for E2E)

Run the setup wizard from your project root:

```bash
npx @treelocator/init
```

Or, for Vite projects, add the dev plugin so runtime auto-injects without editing `main.tsx`:

```ts
import treelocator from "@treelocator/vite";

export default defineConfig({
  plugins: [react(), treelocator()],
});
```

See the main [README](../readme.md) for framework-specific details.

### 2. Chrome extension (no app code changes)

The headless MV3 extension injects runtime on **local dev hosts only** (`localhost`, `127.0.0.1`, etc.). See [apps/extension/README.md](../apps/extension/README.md).

Build it:

```bash
pnpm --filter @treelocator/extension build
```

Load unpacked in Chrome, or use Playwright (next section).

### 3. MCP bridge (AI agents — does not inject runtime)

MCP connects to a browser session **after** runtime is already loaded via (1) or (2). It does not bootstrap TreeLocator by itself. See [MCP.md](./MCP.md).

---

## Using the Browser API from Playwright

Once runtime is loaded, use `page.evaluate()` to call the same API as the browser console:

```javascript
// Wait for API (useful right after navigation)
await page.waitForFunction(() => typeof window.__treelocator__ !== "undefined");

// Formatted component path
const path = await page.evaluate(() => {
  return window.__treelocator__.getPath("button.submit");
});

// Raw ancestry + styles
const ancestry = await page.evaluate(() => {
  return window.__treelocator__.getAncestry(".my-component");
});
```

Reusable helper:

```javascript
async function getComponentPath(page, selector) {
  return page.evaluate((sel) => window.__treelocator__.getPath(sel), selector);
}
```

In-browser help (when runtime is present):

```javascript
await page.evaluate(() => window.__treelocator__.help());
```

Full method list: [BROWSER-API.md](./BROWSER-API.md).

---

## Chrome extension + Playwright

Use this when you want Alt+click / `window.__treelocator__` on a localhost app that does **not** import `@treelocator/runtime`.

1. Build the extension (see above).
2. Launch Chromium with the extension loaded.

Example fixture (from `apps/playwright/tests/extensions/extension.spec.ts`):

```typescript
import { test as base, chromium, type BrowserContext } from "@playwright/test";
import * as path from "path";

export const test = base.extend<{ context: BrowserContext }>({
  context: async ({}, use) => {
    const pathToExtension = path.join(
      __dirname,
      "../../../extension/build/production_chrome"
    );

    const context = await chromium.launchPersistentContext("", {
      headless: false, // extensions require headed Chromium
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    await use(context);
    await context.close();
  },
});
```

**Limits:**

- Extension injects only on localhost / loopback hosts (see extension manifest).
- Headed mode is required (`headless: false`).
- React/JSX apps still need `@locator/babel-jsx` (or the webpack loader for Next.js) for source locations — the extension provides runtime UI/API, not build-time `data-locatorjs-id` injection.

---

## Simulating Alt+click in tests

TreeLocator’s overlay responds to Alt+click. Demo tests use a small helper:

```typescript
// apps/playwright/tests/locateElement.ts
export async function locateElement(page: Page, selector: string) {
  await page.keyboard.down("Alt");
  const target = page.locator(selector);
  await target.hover();
  await target.click();
}
```

Ancestry API tests live under `apps/playwright/tests/ancestry/` and assume demo apps with runtime pre-wired.

---

## MCP bridge (AI agents)

TreeLocator ships `@treelocator/mcp`: a local WebSocket broker + stdio MCP server so Cursor, Claude Code, or any MCP client can inspect and interact with a **running** dev session.

```
browser runtime  ──wss──▶  @treelocator/mcp broker  ◀──stdio──  AI client
```

Typical flow:

1. Start your dev app (runtime loads automatically if configured).
2. Register the MCP server in your editor (see [MCP.md](./MCP.md)).
3. Call `treelocator_list_sessions` → `treelocator_connect_session` → `treelocator_get_path`, etc.

MCP tools include source-aware tree, path/ancestry/styles/CSS inspection, snapshots, click/hover/type, `treelocator_execute_js`, and `treelocator_get_console`.

**MCP does not replace Playwright injection** — it is a separate channel for AI tooling once runtime is already in the browser.

---

## What does not exist

These are common misconceptions; documenting them explicitly saves time:

| Expectation | Reality |
|-------------|---------|
| Paste a snippet in Playwright’s inspector console to load TreeLocator on any URL | No supported bootstrap. Runtime is ESM (`@treelocator/runtime`); there is no documented CDN/bookmarklet/IIFE inject bundle. |
| MCP injects TreeLocator into a page | No. MCP talks to an existing browser session where runtime is already initialized. |
| Extension works on production / arbitrary domains | No. v1 extension is scoped to local dev hosts only. |
| `page.evaluate()` alone loads TreeLocator | No. It only calls `window.__treelocator__` **after** runtime is present. |

---

## Related documentation

- [BROWSER-API.md](./BROWSER-API.md) — `window.__treelocator__` reference
- [MCP.md](./MCP.md) — MCP setup, tools, certificates
- [apps/extension/README.md](../apps/extension/README.md) — Chrome extension build & scope
- [apps/playwright/tests/](../apps/playwright/tests/) — E2E examples in this repo
