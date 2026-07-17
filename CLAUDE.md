# TreeLocatorJS

Alt+click on any UI component to copy its component ancestry chain to clipboard.

## Usage

Two ways to activate the locator:
1. **Alt+click** - Hold Alt and click any element
2. **Tree icon toggle** - Click the tree icon button (bottom-right corner), then click any element. Deactivates automatically after one use.

### Browser API (Programmatic Access)

TreeLocatorJS exposes `window.__treelocator__` for browser automation tools (Playwright, Puppeteer, Selenium, Cypress):

```js
// Get formatted ancestry path
const path = window.__treelocator__.getPath('button.submit');

// Get raw ancestry data
const ancestry = window.__treelocator__.getAncestry(element);
```

See [BROWSER-API.md](./docs/BROWSER-API.md) for full API reference and examples.

### MCP Server (AI Coding Agents)

`@treelocator/mcp` exposes the live browser runtime to AI agents (Cursor, Claude Code, etc.) over the [Model Context Protocol](https://modelcontextprotocol.io/). A stdio MCP server + local WSS broker (`wss://127.0.0.1:7463/treelocator`) relays tool calls to the runtime running in a browser tab. The runtime's browser-side bridge (`packages/runtime/src/mcpBridge.ts`) is **enabled by default**; the MCP server *connects to* an existing session — it does **not** inject runtime onto a page.

Register it in `.mcp.json`:

```json
{ "mcpServers": { "treelocator": { "command": "npx", "args": ["@treelocator/mcp"] } } }
```

Tools (19): session (`treelocator_list_sessions`, `treelocator_connect_session`); source mapping (`treelocator_get_path`, `treelocator_get_ancestry`, `treelocator_get_path_data`, `treelocator_get_tree`, `treelocator_query_by_source`, `treelocator_find_source`, `treelocator_highlight_source`); CSS (`treelocator_get_styles`, `treelocator_get_css_rules`, `treelocator_get_css_report`); snapshot/verify (`treelocator_take_snapshot`, `treelocator_get_snapshot_diff`, `treelocator_clear_snapshot`); interaction (`treelocator_click`, `treelocator_hover`, `treelocator_type`); page (`treelocator_execute_js`, `treelocator_get_console`).

See [MCP.md](./docs/MCP.md) for architecture, TLS certs, and proxy mode.

For Playwright usage, Chrome extension injection, MCP setup, and what is **not** supported (e.g. console bootstrap on arbitrary pages), see [PLAYWRIGHT-AND-AUTOMATION.md](./docs/PLAYWRIGHT-AND-AUTOMATION.md) and [MCP.md](./docs/MCP.md).

## Quick Start

### Development Setup

```bash
pnpm install    # Install dependencies
pnpm dev        # Run all packages in dev mode
pnpm build      # Build all packages
pnpm test       # Run tests
```

### End-User Setup

**Install directly:**
```bash
npm install @treelocator/runtime
```

**Or use the CLI wizard:**
```bash
# Interactive mode (default)
npx @treelocator/init

# Non-interactive mode (CI/CD, automation)
npx @treelocator/init --yes
# or
TREELOCATOR_AUTO_CONFIRM=1 npx @treelocator/init

# Check existing configuration
npx @treelocator/init --check
```

The `@treelocator/init` package provides an automated setup wizard:

**What it does:**
1. Auto-detects project configuration (package manager, build tool, framework)
2. Installs required packages (varies by framework - see below)
3. Configures build tools (for JSX frameworks only)
4. Injects runtime import into entry file (`src/main.tsx`, `src/index.tsx`, etc.)

**CLI Options:**
- `--yes` / `-y` - Skip confirmation prompt (non-interactive mode, useful for CI/CD)
- `TREELOCATOR_AUTO_CONFIRM=1` - Environment variable to skip confirmation
- `--check` / `-c` - Verify configuration without making changes (exits with code 0 if OK, 1 if errors)
- `--help` / `-h` - Show help message

**Supported:**
- Package managers: npm, yarn, pnpm, bun
- Build tools: Vite, Next.js (Pages Router & App Router)
- Frameworks: React, Vue, Svelte, Preact, Solid

## Architecture

**Monorepo** using pnpm workspaces + Turborepo for builds + Lerna for publishing.

Requires: Node.js >=22.0.0, pnpm 8.7.5

### Packages

**TreeLocatorJS publishes:**
| Package | Description |
|---------|-------------|
| `@treelocator/runtime` | Core runtime - Alt+click handler, overlay UI (SolidJS), ancestry tree builder, MCP browser bridge |
| `@treelocator/init` | CLI setup wizard - auto-configures TreeLocatorJS in existing projects |
| `@treelocator/mcp` | MCP server + WSS broker - exposes the live runtime to AI coding agents (see [MCP.md](./docs/MCP.md)) |
| `@treelocator/vite` | Vite plugin - auto-injects runtime in dev mode |

**Internal packages (not published):**
- `@treelocator/dev-config` - shared build/TS config (private)
- `browser-extension`, `vite-plugin-rescript` - unpublished workspace packages

**Build-time dependencies:**
- `@locator/shared` - Shared types (React Fiber, messages) and utilities
- `@locator/babel-jsx` - Babel plugin for JSX source location tracking
- `@locator/webpack-loader` - Webpack loader integration
- `@locator/react-devtools-hook` - React DevTools integration hook

### Demo Apps (`apps/`)

Test apps for different frameworks: `next-14`, `next-16`, `vite-react-*`, `vite-preact-*`, `vite-svelte-*`, `vite-vue-*`, `vite-solid-*`. E2E tests in `playwright/`.

See [CLAUDE-DEMO-APP.md](./docs/CLAUDE-DEMO-APP.md) for how to set up new demo apps.

## Key Code Locations

- **Runtime entry**: `packages/runtime/src/index.ts` → `initRuntime.ts`
- **Browser API**: `packages/runtime/src/browserApi.ts` (window.__treelocator__ for automation tools)
- **Automation docs**: `docs/PLAYWRIGHT-AND-AUTOMATION.md`, `docs/MCP.md`, `docs/BROWSER-API.md`
- **Overlay UI**: `packages/runtime/src/components/Runtime.tsx` (SolidJS)
- **Tree icon toggle**: `packages/runtime/src/components/Runtime.tsx` (lines 25, 67-98, 170-201)
- **Tree icon asset**: `packages/runtime/src/assets/tree-icon.png` + `scripts/wrapImage.js`
- **Framework adapters**: `packages/runtime/src/adapters/` (react/, vue/, svelte/, jsx/)
- **Ancestry formatting**: `packages/runtime/src/functions/formatAncestryChain.ts`
- **CLI setup wizard**: `packages/init/src/index.ts`
- **MCP server**: `packages/mcp/src/mcpServer.ts` (tool registration), `packages/mcp/src/toolSchemas.ts` (tool defs), `packages/mcp/src/sessionBroker.ts` (WSS broker), `packages/mcp/src/index.ts` (entry)
- **MCP browser bridge**: `packages/runtime/src/mcpBridge.ts` (runtime-side WSS client; `BridgeCommandName` union lists supported tools)

**From @locator packages:**
- Shared types: `@locator/shared` types.ts (Fiber types, messages)
- Babel plugin: `@locator/babel-jsx`
- Webpack loader: `@locator/webpack-loader`

## Technical Notes

- Runtime uses **Shadow DOM** for style isolation
- **SolidJS** for overlay UI (compiled with babel-preset-solid)
- Dynamic imports handle SSR (Next.js) vs browser extension differences:
  ```ts
  if (typeof require !== "undefined") {
    require("./components/Runtime");  // Vite/webpack
  } else {
    import("./components/Runtime");   // Browser extension
  }
  ```
- TailwindCSS styles are generated into `_generated_styles.ts`
- **Tree icon**: High-res PNG at `packages/runtime/src/assets/tree-icon.png`, encoded to data URL via `scripts/wrapImage.js` → `_generated_tree_icon.ts` (same pattern as CSS generation)
- **Tree icon UI**: Fixed position bottom-right (20px), 54x54px circle with shadow, scales to 125% on hover, blue ring when toggle is active

## Testing

- **Unit tests**: Vitest (`packages/runtime/`) and Jest (`packages/babel-jsx/`)
- **E2E tests**: Playwright (`apps/playwright/`)

```bash
pnpm test           # Run all tests
cd packages/runtime && pnpm test:dev  # Watch mode
```

## Publishing

TreeLocatorJS publishes 4 packages to npm (versioned together at the `lerna.json` version, currently `0.6.0`):
- `@treelocator/runtime` - Core runtime
- `@treelocator/init` - CLI setup wizard
- `@treelocator/mcp` - MCP server for AI agents
- `@treelocator/vite` - Vite dev plugin

### How to publish a new version

1. Update version in `lerna.json` and each published package's `package.json` (`runtime`, `init`, `mcp`, `vite`)
2. Build: `pnpm build` (ignore demo app failures — only the published packages need to build)
3. Commit the version bump and tag: `git tag vX.Y.Z`
4. Publish each package individually (lerna publish doesn't work with our 2FA setup):
```bash
cd packages/runtime && npm publish --access public
cd packages/init && npm publish --access public
cd packages/mcp && npm publish --access public
cd packages/vite && npm publish --access public
```

### npm auth

- The npm account has 2FA enabled. Do NOT use `--otp` with npm tokens — it only accepts 6-digit TOTP codes.
- Use a **Classic Automation token** (created at npmjs.com > Access Tokens > Generate New Token > Classic > Automation). This token type bypasses 2FA for publish.
- Set the token in `~/.npmrc`: `//registry.npmjs.org/:_authToken=<token>`
- If `npm config set` fails with ENOWORKSPACES, write directly to `~/.npmrc`.

## Supported Frameworks

Each framework uses different mechanisms for source location tracking:

| Framework | Source Tracking | Packages Needed | Config Update |
|-----------|-----------------|-----------------|---------------|
| **Vue** | Built-in (`__vueParentComponent`) | `@treelocator/runtime` only | None |
| **Svelte** | Built-in (`__svelte_meta` in dev) | `@treelocator/runtime` only | None |
| **React** | Babel plugin (`data-locatorjs-id`) | `@treelocator/runtime` + `@locator/babel-jsx` | vite.config babel |
| **Solid** | Babel plugin (`data-locatorjs-id`) | `@treelocator/runtime` + `@locator/babel-jsx` | vite.config babel |
| **Preact** | Babel plugin (`data-locatorjs-id`) | `@treelocator/runtime` + `@locator/babel-jsx` | vite.config babel |
| **Next.js** | Webpack loader | `@treelocator/runtime` + `@locator/webpack-loader` | next.config webpack |

### How Source Tracking Works

- **Vue/Svelte**: These frameworks include source location metadata in development mode automatically. No build tool configuration needed.
  - Vue 3: Elements have `__vueParentComponent` with component info
  - Svelte: Elements have `__svelte_meta` with file/line/column in dev mode

- **JSX Frameworks (React/Solid/Preact)**: Require `@locator/babel-jsx` to inject `data-locatorjs-id` attributes into JSX elements during compilation. The init script adds babel config to the framework's Vite plugin.

- **Next.js**: Uses `@locator/webpack-loader` instead of babel plugin to inject source locations.

### Framework Auto-Detection

The runtime auto-detects frameworks in this order (see `packages/runtime/src/adapters/createTreeNode.ts`):
1. Svelte (`detectSvelte()`)
2. Vue (`detectVue()`)
3. React (`detectReact()`)
4. JSX/babel plugin (`detectJSX()` or `data-locatorjs-id` present)
5. Phoenix LiveView (`detectPhoenix()`)

<cicada>
  **ALWAYS use cicada-mcp tools for Elixir and Python code searches. NEVER use Grep/Find for these tasks.**

  ### Use cicada tools for:
  - YOUR PRIMARY TOOL - Start here for ALL code exploration and discovery. `mcp__cicada__query`
  - DEEP-DIVE TOOL: View a module's complete API and dependencies after discovering it with query. `mcp__cicada__search_module`
  - DEEP-DIVE TOOL: Find function definitions and call sites after discovering with query. `mcp__cicada__search_function`
  - UNIFIED HISTORY TOOL: One tool for all git history queries - replaces get_blame, get_commit_history, find_pr_for_line, and get_file_pr_history. `mcp__cicada__git_history`
  - DRILL-DOWN TOOL: Expand a query result to see complete details. `mcp__cicada__expand_result`
  - Force refresh the code index to pick up recent file changes. `mcp__cicada__refresh_index`
  - ADVANCED: Execute jq queries directly against the Cicada index for custom analysis and data exploration. `mcp__cicada__query_jq`

  ### DO NOT use Grep for:
  - ❌ Searching for module structure
  - ❌ Searching for function definitions
  - ❌ Searching for module imports/usage

  ### You can still use Grep for:
  - ✓ Non-code files (markdown, JSON, config)
  - ✓ String literal searches
  - ✓ Pattern matching in single line comments
</cicada>

