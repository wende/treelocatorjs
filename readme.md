<div align="center">
  <img src="tree-icon.png" alt="TreeLocatorJS" width="120" height="120">

  # TreeLocatorJS

  **Instant Component Ancestry in Your Clipboard**

  *Alt+click any UI element to copy its complete component tree*

  [![npm version](https://badge.fury.io/js/%40treelocator%2Fruntime.svg)](https://www.npmjs.com/package/@treelocator/runtime)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Live Demo](https://img.shields.io/badge/Live_Demo-Try_it!-brightgreen)](https://wende.github.io/treelocatorjs)

</div>

---

## What is TreeLocatorJS?

TreeLocatorJS is a streamlined fork of [LocatorJS](https://github.com/infi-pc/locatorjs), focused on one powerful feature: **copying component ancestry trees to your clipboard**. Simply hold Alt (or Option on Mac) and click any element in your web application to instantly copy its complete component hierarchy.

Perfect for debugging, documentation, code navigation, and understanding complex component structures.

```
div in App at src/App.tsx:5
    └─ main in Layout at src/components/Layout.tsx:12
        └─ section:nth-child(2) in Content at src/components/Content.tsx:8
            └─ button#submit-btn.btn.btn-primary in Button at src/components/Button.tsx:15
```

## Why TreeLocatorJS?

- **One-Command Setup** - `npx @treelocator/init` auto-configures your project
- **Framework Agnostic** - React, Vue, Svelte, Preact, Solid, and more
- **Non-Intrusive** - No visual clutter, only a subtle tree icon toggle
- **Browser Automation Ready** - Programmatic API for Playwright, Puppeteer, Cypress ([guide](./docs/PLAYWRIGHT-AND-AUTOMATION.md))
- **AI/MCP Ready** - Built-in Model Context Protocol bridge so AI agents can inspect your running app ([MCP setup](./docs/MCP.md))
- **Style-Aware** - Computed styles, matched CSS rules, specificity scoring, and snapshot diffs
- **Lightweight** - Minimal runtime overhead
- **Developer First** - Built by developers, for developers

## Quick Start

### Installation (recommended)

Run the setup wizard from your project root — it detects your stack and configures everything:

```bash
npx @treelocator/init
```

Non-interactive (CI, scripts):

```bash
npx @treelocator/init --yes
# or the shorter alias:
npx treelocatorjs --yes
```

Verify an existing setup:

```bash
npx @treelocator/init --check
```

**What the wizard does:**

| Step | Vite (React, Vue, Svelte, etc.) | Next.js |
|------|----------------------------------|---------|
| Installs packages | `@treelocator/runtime`, `@treelocator/vite`, + babel deps for JSX | `@treelocator/runtime`, `@locator/webpack-loader` |
| Configures build tool | Adds `treelocator()` to `vite.config` (+ babel for JSX frameworks) | Adds webpack loader to `next.config` |
| Wires up runtime | Auto-injected in dev via Vite plugin — **no entry file edit** | Creates `LocatorProvider` and wraps `app/layout` |

Then start your dev server and Alt+click any element.

### Manual installation

If you prefer to set things up yourself:

```bash
npm install -D @treelocator/runtime @treelocator/vite
# JSX frameworks (React, Solid, Preact) also need:
npm install -D @locator/babel-jsx @rolldown/plugin-babel @babel/core
```

**Vite** — add to `vite.config.js`:

```js
import treelocator from "@treelocator/vite";
import babel from "@rolldown/plugin-babel"; // React/Solid/Preact only

export default defineConfig({
  plugins: [
    react(),
    babel({
      plugins: [["@locator/babel-jsx/dist", { env: "development" }]],
    }),
    treelocator(), // auto-injects runtime in dev — no main.tsx edit needed
  ],
});
```

Vue and Svelte skip the babel plugin — they only need `treelocator()`.

**Next.js** — see [NEXTJS-SETUP.md](./docs/NEXTJS-SETUP.md).

Or add the runtime manually to your entry file:

```js
import { setup } from "@treelocator/runtime";
if (import.meta.env.DEV) setup();
```

### Usage

1. Hold **Alt** (or **Option** on Mac) and click any element
2. Or click the **tree icon** in the bottom-right corner, then click an element

The component ancestry is instantly copied to your clipboard.

### Advanced Configuration

Customize the behavior with options:

```js
import { setup } from "@treelocator/runtime";

setup({
  adapter: "react",     // Framework: "react" | "vue" | "svelte" | "jsx"
  hotkey: "alt",        // Trigger key: "alt" | "ctrl" | "meta"
  enabled: true,        // Enable/disable at runtime
});
```

## Features

### 🎯 Alt+Click Component Discovery

Hold Alt and click any element to instantly copy its ancestry tree. The format is clean and readable:

```
div in ParentName at src/path/to/Component.tsx:42
    └─ ul:nth-child(2) in ListContainer at src/path/to/List.tsx:8
        └─ li:nth-child(3)#item-active.row.is-selected in ListItem at src/path/to/Child.tsx:15
```

Each selector segment carries enough fidelity to round-trip back to the DOM:
- **`:nth-child(n)`** - Position among siblings of the same type (only when ambiguous)
- **`#id`** - Element ID when present
- **`.class1.class2`** - All classes from `classList`
- **`in Component`** - The innermost named owner from the component tree (anonymous framework wrappers are filtered out automatically, so Next.js App Router internals don't pollute the chain)

### 🌳 Tree Icon Toggle & Settings Panel

A subtle tree icon sits in the bottom-right corner. Click it to activate single-click pick mode, or open the adjacent cog to reach the **in-page settings panel**:

- Toggle anomaly tracking, visual-diff snapshots, and computed-styles capture on/off
- Tune dejitter sample rate, max recording length, jump/lag thresholds
- Opt into `includeDefaults` for fuller computed-styles dumps
- All settings persist in `localStorage` under `__treelocator_settings__` and take effect on the next recording — no reload needed

### 🎨 Computed Styles Extraction

Every Alt+click capture also returns the element's computed styles, grouped by category (layout, typography, colors, etc.) and filtered down to the ~50 properties a human actually cares about. Two noteworthy details:

- **Shadow-DOM default probe** - Browser defaults are measured inside an isolated Shadow DOM so page CSS (universal selectors, `all:` resets) can't poison the baseline.
- **`includeDefaults` option** - Ask for a full DevTools-style dump when you want every property, not just the non-default ones.

```js
const styles = window.__treelocator__.getStyles(".hero", { includeDefaults: true });
```

### 🔬 CSS Rule Inspector

Debug specificity conflicts without opening DevTools. For any element the runtime can list every matched CSS rule along with:

- Selector specificity scores (a, b, c)
- Source location (`file:line:column`) when the browser exposes it
- Origin — inline, `<style>`, or external stylesheet
- Cross-browser safe parsing (Chrome and Firefox handle `CSSStyleRule` differently)

```js
const rules = window.__treelocator__.getCSSRules(".my-class");
```

### 📸 Named Snapshot API

Persistent baselines that survive reloads. Take a snapshot before a change, iterate on your fix, then diff against the same origin state as many times as you like:

```js
window.__treelocator__.takeSnapshot(".hero", "hero-layout");
// ...edit, reload, tweak...
const diff = window.__treelocator__.getSnapshotDiff("hero-layout");
console.log(diff.formatted);
```

Baselines are immutable — `getSnapshotDiff` never overwrites them. Stored in `localStorage` under `treelocator:snapshot:<id>`, so multiple snapshots coexist across sessions. Also exposed as MCP tools.

### 🤖 Browser Automation API

TreeLocatorJS exposes a programmatic API for testing frameworks:

```javascript
// Get formatted ancestry path for any selector
const path = window.__treelocator__.getPath('button.submit');
// "button#submit-btn.btn.btn-primary in LoginForm at src/components/LoginForm.tsx:23"

// Get raw ancestry data with styles and matched CSS rules
const ancestry = window.__treelocator__.getAncestry(document.querySelector('.my-component'));
// ancestry.computedStyles, ancestry.cssRules
```

Perfect for E2E tests with Playwright, Puppeteer, Selenium, or Cypress.

- **API reference:** [BROWSER-API.md](./docs/BROWSER-API.md)
- **Playwright, extension injection, MCP FAQ:** [PLAYWRIGHT-AND-AUTOMATION.md](./docs/PLAYWRIGHT-AND-AUTOMATION.md) — start here if you are looking for a console inject snippet or wondering how automation fits together

### 🧠 MCP Bridge for AI Agents

TreeLocatorJS ships with a built-in **Model Context Protocol** integration so AI agents (Claude Code, Cursor, any MCP client) can drive and inspect your running app:

```
browser runtime  ──wss──▶  @treelocator/mcp broker  ◀──stdio──  AI client
```

- Runtime opens a session to a local WSS broker (`wss://127.0.0.1:7463/treelocator`) with exponential backoff + quiet fallback so offline dev machines don't spam the console.
- `@treelocator/mcp` hosts both the broker and a stdio MCP server.
- AI clients can list live browser sessions, pick one, and call tools against it.

**MCP tools exposed:**

| Category | Tools |
|---|---|
| Session | `treelocator_list_sessions`, `treelocator_connect_session` |
| Inspect | `treelocator_get_path`, `treelocator_get_ancestry`, `treelocator_get_path_data`, `treelocator_get_styles`, `treelocator_get_css_rules`, `treelocator_get_css_report` |
| Snapshot | `treelocator_take_snapshot`, `treelocator_get_snapshot_diff`, `treelocator_clear_snapshot` |
| Interact | `treelocator_click`, `treelocator_hover`, `treelocator_type` |
| Debug | `treelocator_execute_js`, `treelocator_get_console` |

MCP connects to a browser tab where runtime is **already running** — it does not inject TreeLocator by itself.

Configure the bridge via `setup()`:

```ts
setup({
  mcp: {
    enabled: true,
    bridgeUrl: "wss://127.0.0.1:7463/treelocator",
    reconnectMs: 1000, // base for exponential backoff, capped at 5 min
  },
});
```

See [docs/MCP.md](./docs/MCP.md) for setup, architecture, and the full tool reference.

### 📹 Dejitter Recording

Record a short interaction window and automatically surface visual anomalies — jumps, lag, jitter, flicker, layout shifts. Thresholds, sample rate, and max duration are all configurable from the settings panel, and visual-diff snapshots can be toggled independently from the core anomaly tracker.

### 🎨 Framework Support

TreeLocatorJS works seamlessly with modern frameworks:

| Framework | Support | Detection Method |
|-----------|---------|------------------|
| **React** | ✅ Full | React DevTools Hook |
| **Vue** | ✅ Full | Vue DevTools Hook |
| **Svelte** | ✅ Full | Svelte Component Data |
| **Preact** | ✅ Full | Preact DevTools Hook |
| **Solid** | ✅ Full | JSX Source Tracking |
| **Next.js** | ✅ Full | Webpack Loader (App Router & Pages Router) |
| **Other JSX** | ✅ Full | Babel Plugin |

## Use Cases

### 🐛 Debugging

Quickly identify which component is rendering unexpected output:
```bash
# Alt+click on the problematic element
# Paste in your code editor to jump to the source
```

### 📚 Documentation

Generate component hierarchy documentation:
```bash
# Click through your UI
# Paste the trees into your docs
```

### 🔍 Code Navigation

Navigate large codebases with ease:
```bash
# Alt+click any element
# Command+P (or Ctrl+P) in your editor
# Paste the file path
```

### 🧪 Testing

Write more maintainable E2E tests (runtime must be loaded in the app first — see [PLAYWRIGHT-AND-AUTOMATION.md](./docs/PLAYWRIGHT-AND-AUTOMATION.md)):

```javascript
await page.waitForFunction(() => typeof window.__treelocator__ !== "undefined");

const path = await page.evaluate(() => {
  return window.__treelocator__.getPath('button.submit');
});
```

## Architecture

TreeLocatorJS is a **monorepo** using:
- **pnpm workspaces** for package management
- **Turborepo** for coordinated builds
- **Lerna** for publishing

**Requirements:**
- Node.js ≥ 22.0.0
- pnpm 8.7.5+

### Package Structure

| Package | Description |
|---------|-------------|
| `@treelocator/runtime` | Core runtime with Alt+click handler, overlay UI, settings panel, and MCP bridge client |
| `@treelocator/vite` | Vite plugin — auto-injects runtime in dev (no entry file edit) |
| `@treelocator/init` | CLI setup wizard (`npx @treelocator/init`) |
| `@treelocator/mcp` | Local WSS broker + stdio MCP server for AI agent integration ([docs](./docs/MCP.md)) |

**Dependencies (from original LocatorJS):**
- `@locator/shared` - Shared TypeScript types and utilities
- `@locator/babel-jsx` - Babel plugin for JSX source location tracking
- `@locator/webpack-loader` - Webpack loader integration
- `@locator/react-devtools-hook` - React DevTools integration

### Demo Applications

Test apps for all supported frameworks live in `apps/`:
- `next-14`, `next-16` - Next.js apps
- `vite-react-*` - React with Vite
- `vite-preact-*` - Preact with Vite
- `vite-svelte-*` - Svelte with Vite
- `vite-vue-*` - Vue with Vite
- `vite-solid-*` - SolidJS with Vite

E2E tests are in `apps/playwright/`.

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run all packages in development mode
pnpm dev

# Build all packages
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Watch mode for runtime tests
cd packages/runtime && pnpm test:dev

# E2E tests
cd apps/playwright && pnpm test
```

### Key Code Locations

- **Runtime entry:** `packages/runtime/src/index.ts` → `initRuntime.ts`
- **Browser API:** `packages/runtime/src/browserApi.ts`
- **Overlay UI:** `packages/runtime/src/components/Runtime.tsx` (SolidJS)
- **Tree icon:** `packages/runtime/src/assets/tree-icon.png`
- **Framework adapters:** `packages/runtime/src/adapters/`
- **Ancestry formatting:** `packages/runtime/src/functions/formatAncestryChain.ts`
- **Shared types:** `packages/shared/src/types.ts`
- **Babel plugin:** `packages/babel-jsx/src/`

### Technical Details

- **Shadow DOM** for style isolation
- **SolidJS** for reactive overlay UI
- **TailwindCSS** for styling (compiled to `_generated_styles.ts`)
- **Dynamic imports** handle SSR vs browser extension contexts
- **Tree icon** embedded as data URL in `_generated_tree_icon.ts`

## Publishing

TreeLocatorJS is published to npm under the `@treelocator` scope:
- **@treelocator/runtime** - Core functionality
- **@treelocator/vite** - Vite plugin for dev-only runtime injection
- **@treelocator/init** - CLI setup wizard

Reuses the following packages from the original LocatorJS:
- **@locator/shared** - Shared types and utilities
- **@locator/babel-jsx** - Babel plugin for JSX tracking
- **@locator/webpack-loader** - Webpack integration

Current version: **0.6.0**

To publish a new version:
```bash
# Update version in lerna.json and package.json files
# Then run:
pnpm build
pnpm lerna publish from-package --yes
```

## Contributing

TreeLocatorJS is a focused fork emphasizing simplicity and the core ancestry feature. Contributions that align with this philosophy are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

TreeLocatorJS is a fork of [LocatorJS](https://github.com/infi-pc/locatorjs) by [Infi-PC](https://github.com/infi-pc). This fork streamlines the original concept to focus on the essential feature: copying component ancestry to clipboard.

## Support

- **Issues:** [GitHub Issues](https://github.com/wende/treelocatorjs/issues)
- **Discussions:** [GitHub Discussions](https://github.com/wende/treelocatorjs/discussions)
- **Documentation:** [Full Documentation](./CLAUDE.md)

---

<div align="center">
  <img src="tree-icon.png" alt="TreeLocatorJS" width="60" height="60">

  **Made with 🌳 by developers, for developers**
</div>
