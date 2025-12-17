# Setting Up a Demo App with @locator/runtime

This document captures everything learned while setting up the `wende-demo` app.

## Required Dependencies

```json
{
  "dependencies": {
    "@locator/babel-jsx": "workspace:*",
    "@locator/runtime": "workspace:*"
  }
}
```

## Vite Configuration

The key is adding the `@locator/babel-jsx` babel plugin in development mode:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  return {
    plugins: [
      react({
        babel: {
          plugins: isDev ? [
            ['@locator/babel-jsx/dist', { env: 'development' }],
          ] : [],
        },
      }),
    ],
  };
});
```

## Entry Point Setup

In your main entry file (e.g., `index.tsx`):

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { setup } from '@locator/runtime';
import App from './App';

setup();  // Must call setup() to initialize the runtime

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## How It Works

1. **`@locator/babel-jsx`** - Babel plugin that adds `data-locatorjs-id` attributes to JSX elements during compilation. This embeds source location info (file path, line, column) directly in the DOM.

2. **`@locator/runtime`** - The runtime that:
   - Listens for Alt+click events
   - Shows outline UI when holding Alt and hovering
   - Collects component ancestry from the clicked element
   - Copies the ancestry chain to clipboard

## Key Learnings

### The runtime does NOT auto-initialize
```tsx
// Wrong - just importing doesn't start the runtime
import '@locator/runtime';

// Correct - must call setup()
import { setup } from '@locator/runtime';
setup();
```

### Two ways to get React component info

1. **JSX Adapter (babel-jsx plugin)** - Recommended for most setups
   - Adds `data-locatorjs-id` to elements at build time
   - Works without browser extensions
   - Used by vite-react-project demo

2. **React DevTools Adapter** - Alternative approach
   - Uses `window.__REACT_DEVTOOLS_GLOBAL_HOOK__`
   - Requires either React DevTools browser extension OR `@locator/react-devtools-hook` package
   - More complex setup

### Monorepo integration

When adding a new app to the monorepo:

1. Remove `.git`, `node_modules`, lock files from copied project
2. Update `package.json` name to avoid conflicts
3. Add workspace dependencies: `"@locator/runtime": "workspace:*"`
4. Run `pnpm install` from root
5. Ensure dependent packages are built: `pnpm build --filter @locator/babel-jsx`

### Build order matters

The `@locator/babel-jsx` package must be built before the demo app can use it:
```bash
pnpm build --filter @locator/babel-jsx
```

## Troubleshooting

### "No source found" on Alt+click
- Missing `@locator/babel-jsx` plugin in vite config
- Plugin not in development mode (`isDev` check)
- Package not built (`pnpm build --filter @locator/babel-jsx`)

### Outline shows but Alt+click doesn't copy
- `setup()` not called
- Click handler had old code checking for `elInfo.thisElement.link` (removed in cleanup)

### Package resolution errors
- Workspace package not built (run `pnpm build --filter <package>`)
- Missing `dist/` folder in package
