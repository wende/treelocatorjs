# LocatorJS

Alt+click on any UI component to copy its component ancestry chain to clipboard.

## Usage

Two ways to activate the locator:
1. **Alt+click** - Hold Alt and click any element
2. **Tree icon toggle** - Click the tree icon button (bottom-right corner), then click any element. Deactivates automatically after one use.

### Browser API (Programmatic Access)

LocatorJS exposes `window.__locatorjs__` for browser automation tools (Playwright, Puppeteer, Selenium, Cypress):

```js
// Get formatted ancestry path
const path = window.__locatorjs__.getPath('button.submit');

// Get raw ancestry data
const ancestry = window.__locatorjs__.getAncestry(element);
```

See [BROWSER-API.md](./BROWSER-API.md) for full API reference and examples.

## Quick Start

### Development Setup

```bash
pnpm install    # Install dependencies
pnpm dev        # Run all packages in dev mode
pnpm build      # Build all packages
pnpm test       # Run tests
```

### End-User Setup (CLI Wizard)

The `@treelocator/init` package provides an automated setup wizard for TreeLocatorJS:

```bash
npx treelocatorjs init  # or npx @treelocator/init
```

**What it does:**
1. Auto-detects project configuration (package manager, build tool, framework)
2. Installs required packages (`@treelocator/runtime`, babel/webpack plugins)
3. Configures build tools:
   - **Vite**: Adds `@treelocator/babel-jsx` plugin to `vite.config.js/ts`
   - **Next.js**: Adds `@treelocator/webpack-loader` to `next.config.js/ts`
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

See [CLAUDE-DEMO-APP.md](./CLAUDE-DEMO-APP.md) for how to set up new demo apps.

## Key Code Locations

- **Runtime entry**: `packages/runtime/src/index.ts` → `initRuntime.ts`
- **Browser API**: `packages/runtime/src/browserApi.ts` (window.__locatorjs__ for automation tools)
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

```bash
pnpm publishPackages  # Lerna publish (version 0.5.1)
```

## Supported Frameworks

- React (via React DevTools hook)
- Vue
- Svelte
- Preact
- Any JSX framework (with babel plugin)
