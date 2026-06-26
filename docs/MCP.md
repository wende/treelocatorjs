# TreeLocator MCP Bridge

TreeLocator exposes its **live browser runtime** to AI agents through the [Model Context Protocol](https://modelcontextprotocol.io/). An MCP client (Cursor, Claude Code, etc.) can list open dev sessions, pick one, and call tools that map to `window.__treelocator__` methods — get component paths, read styles, click elements, run JS, and more.

> **Prerequisite:** TreeLocator runtime must already be running in a browser tab (via `@treelocator/init`, `@treelocator/vite`, or the Chrome extension). MCP **connects to** that session; it does **not** inject runtime onto a page. See [PLAYWRIGHT-AND-AUTOMATION.md](./PLAYWRIGHT-AND-AUTOMATION.md) for how runtime gets loaded.

## Architecture

```
┌─────────────────┐     wss://127.0.0.1:7463/treelocator     ┌──────────────────┐
│  Browser tab    │ ────────────────────────────────────────▶ │  @treelocator/mcp │
│  (runtime +     │                                           │  WSS broker       │
│   mcpBridge)    │ ◀──────────────────────────────────────── │  + stdio MCP      │
└─────────────────┘              tool responses               └────────┬─────────┘
                                                                         │ stdio
                                                                         ▼
                                                                ┌──────────────────┐
                                                                │  AI client       │
                                                                │  (Cursor, etc.)  │
                                                                └──────────────────┘
```

1. `@treelocator/runtime` opens a browser-side bridge to `wss://127.0.0.1:7463/treelocator` (fallback: `wss://localhost:7463/treelocator`). **Enabled by default.**
2. `@treelocator/mcp` hosts the WSS broker and a stdio MCP server.
3. MCP tool calls are routed to the selected browser session.

## Quick start

### 1. Ensure runtime is in your app

```bash
npx @treelocator/init
```

Or use `@treelocator/vite` in dev. Open the app in a browser so a session appears.

### 2. Build the MCP package (monorepo dev)

```bash
pnpm --filter @treelocator/mcp build
```

Published installs can use the `treelocator-mcp` bin from `@treelocator/mcp` after `npm install -g @treelocator/mcp` or via `npx`.

### 3. Register the MCP server

**Cursor / Claude Code** — add to `.mcp.json` in your project (or global MCP config):

```json
{
  "mcpServers": {
    "treelocator": {
      "command": "node",
      "args": ["./packages/mcp/dist/index.js"]
    }
  }
}
```

Adjust the path to your checkout or use `npx @treelocator/mcp` if installed from npm.

Restart the editor so it picks up the server.

### 4. Use MCP tools

Typical agent workflow:

1. `treelocator_list_sessions` — see connected browser tabs
2. `treelocator_connect_session` — pick `{ "sessionId": "..." }`
3. `treelocator_get_path` — `{ "selector": "button.submit" }`
4. Optional: `treelocator_click`, `treelocator_get_styles`, `treelocator_execute_js`, etc.

`sessionId` can be omitted on later calls after `connect_session`.

## Runtime configuration

`setup()` accepts an `mcp` block (all optional; bridge is on by default):

```ts
import setup from "@treelocator/runtime";

setup({
  mcp: {
    enabled: true,                      // default: true
    bridgeUrl: "wss://127.0.0.1:7463/treelocator",
    reconnectMs: 1000,                  // base delay; exponential backoff, cap 5 min
  },
});
```

If the MCP broker is not running, the runtime retries quietly (no console spam after a few failures).

Disable the bridge:

```ts
setup({ mcp: { enabled: false } });
```

## MCP tools

| Tool | Description |
|------|-------------|
| `treelocator_list_sessions` | List browser tabs connected to the broker |
| `treelocator_connect_session` | Select active session for subsequent calls |
| `treelocator_get_path` | `window.__treelocator__.getPath(selector)` |
| `treelocator_get_ancestry` | `window.__treelocator__.getAncestry(selector)` |
| `treelocator_get_path_data` | Path + raw ancestry in one call |
| `treelocator_get_styles` | Computed styles summary + snapshot |
| `treelocator_get_css_rules` | Matched CSS rules with specificity |
| `treelocator_get_css_report` | Human-readable CSS conflict report |
| `treelocator_take_snapshot` | Persist element styles under `snapshotId` (survives reload) |
| `treelocator_get_snapshot_diff` | Diff current element against saved snapshot |
| `treelocator_clear_snapshot` | Remove a saved snapshot |
| `treelocator_click` | Click element matching selector |
| `treelocator_hover` | Hover element |
| `treelocator_type` | Type text into an input |
| `treelocator_execute_js` | Run async JS in page context (`await` allowed) |
| `treelocator_get_console` | Captured console log/warn/error from the page |

### Element tool arguments

Most element tools accept:

```json
{
  "sessionId": "optional-if-already-connected",
  "selector": "button.submit",
  "index": 0
}
```

`index` disambiguates when multiple nodes match.

### Examples

**Get component path**

```json
{ "selector": ".hero h1" }
```

**Execute JS in the page**

```json
{ "code": "return window.__treelocator__.getPath(document.activeElement)" }
```

**Take a named snapshot before a change**

```json
{ "selector": ".hero", "snapshotId": "hero-layout" }
```

Later, after edits/reload:

```json
{ "snapshotId": "hero-layout", "selector": ".hero" }
```

via `treelocator_get_snapshot_diff`.

## Local TLS certificates

The broker uses WSS. Certs load from:

- `$TREELOCATOR_MCP_CERT_PATH` / `$TREELOCATOR_MCP_KEY_PATH`, or
- `~/.treelocator/certs/localhost.pem` and `~/.treelocator/certs/localhost-key.pem`

Startup order:

1. Reuse existing cert/key if present
2. Try `mkcert` if available
3. Fall back to self-signed certs (trust diagnostics printed if needed)

Set `TREELOCATOR_MCP_LOG=1` for broker startup logs on stderr.

## Multiple MCP clients / port in use

If port `7463` is already bound (another editor or `treelocator-mcp` instance), a second MCP process starts in **proxy mode** and forwards tool calls to the existing broker leader — no duplicate broker.

## Playwright vs MCP

| | Playwright `page.evaluate()` | MCP |
|--|------------------------------|-----|
| **Who calls it** | Your test code | AI agent / MCP client |
| **Requires** | Runtime in page + test harness | Runtime in page + MCP server running |
| **Inject runtime** | No (app or extension must load it) | No |
| **Best for** | CI E2E assertions | Interactive debugging with an AI assistant |

See [PLAYWRIGHT-AND-AUTOMATION.md](./PLAYWRIGHT-AND-AUTOMATION.md) for Playwright fixtures, extension loading, and what is **not** supported (console bootstrap, etc.).

## Why WebSocket instead of HTTP

Bridge traffic uses WebSockets, not `fetch`/XHR, so there are no CORS preflight issues. Relevant constraints:

- Server-side origin checks on the broker
- Mixed content: HTTPS pages need `wss://` (broker uses local TLS)

## Related

- [BROWSER-API.md](./BROWSER-API.md) — underlying `window.__treelocator__` API
- [PLAYWRIGHT-AND-AUTOMATION.md](./PLAYWRIGHT-AND-AUTOMATION.md) — Playwright, extension injection, automation FAQ
- `packages/runtime/src/mcpBridge.ts` — browser-side bridge client
- `packages/mcp/src/` — broker + MCP server implementation
