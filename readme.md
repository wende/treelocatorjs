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

- **Zero Configuration** - Just import and it works
- **Framework Agnostic** - React, Vue, Svelte, Preact, Solid, and more
- **Non-Intrusive** - No visual clutter, only a subtle tree icon toggle
- **Browser Automation Ready** - Programmatic API for Playwright, Puppeteer, Cypress
- **AI/MCP Ready** - Built-in Model Context Protocol bridge so AI agents can inspect your running app
- **Style-Aware** - Computed styles, matched CSS rules, specificity scoring, and snapshot diffs
- **Lightweight** - Minimal runtime overhead
- **Developer First** - Built by developers, for developers

## Quick Start

### Installation

```bash
npm install @treelocator/runtime
```

Or use the automated setup wizard (recommended):

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

The wizard will:
- Auto-detect your project (package manager, build tool, framework)
- Install required packages
- Configure your build tool (Vite, Next.js, etc.)
- Add the runtime import to your entry file

### Basic Usage

Add one line to your app's entry point:

```js
import "@treelocator/runtime";
```

That's it! Now you can:
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

Perfect for E2E tests with Playwright, Puppeteer, Selenium, or Cypress. See [BROWSER-API.md](./docs/BROWSER-API.md) for complete API documentation.

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

See [docs/MCP.md](./docs/MCP.md) for architecture and the full tool reference.

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

Write more maintainable E2E tests:
```javascript
// In your Playwright test
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
| `@treelocator/init` | CLI setup wizard for easy project configuration |
| `@treelocator/mcp` | Local WSS broker + stdio MCP server for AI agent integration |

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
