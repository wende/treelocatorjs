# LocatorJS

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
npx @treelocator/init
```

The `@treelocator/init` package provides an automated setup wizard:

**What it does:**
1. Auto-detects project configuration (package manager, build tool, framework)
2. Installs required packages (varies by framework - see below)
3. Configures build tools (for JSX frameworks only)
4. Injects runtime import into entry file (`src/main.tsx`, `src/index.tsx`, etc.)

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
| `@treelocator/runtime` | Core runtime - Alt+click handler, overlay UI (SolidJS), ancestry tree builder |
| `@treelocator/init` | CLI setup wizard - auto-configures TreeLocatorJS in existing projects |

**Uses from original LocatorJS:**
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
- **Overlay UI**: `packages/runtime/src/components/Runtime.tsx` (SolidJS)
- **Tree icon toggle**: `packages/runtime/src/components/Runtime.tsx` (lines 25, 67-98, 170-201)
- **Tree icon asset**: `packages/runtime/src/assets/tree-icon.png` + `scripts/wrapImage.js`
- **Framework adapters**: `packages/runtime/src/adapters/` (react/, vue/, svelte/, jsx/)
- **Ancestry formatting**: `packages/runtime/src/functions/formatAncestryChain.ts`
- **CLI setup wizard**: `packages/init/src/index.ts`

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

TreeLocatorJS publishes 2 packages to npm:
- `@treelocator/runtime@0.1.0` - Core runtime
- `@treelocator/init@0.1.0` - CLI setup wizard

Reuses from original LocatorJS:
- `@locator/shared@^0.5.0`
- `@locator/babel-jsx@^0.5.1`
- `@locator/webpack-loader@^0.5.1`

To publish a new version:
```bash
# 1. Update version in lerna.json and package.json files
# 2. Build and publish:
pnpm build
pnpm lerna publish from-package --yes
```

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
