# Next.js Setup Guide

This guide explains how to enable TreeLocatorJS server component tracking for Next.js applications.

## Prerequisites

- Next.js 13+ (App Router)
- Node.js 18+

## Installation

### 1. Install Required Packages

```bash
npm install @treelocator/runtime @locator/webpack-loader
# or
pnpm add @treelocator/runtime @locator/webpack-loader
# or
yarn add @treelocator/runtime @locator/webpack-loader
```

### 2. Configure Next.js

Add the webpack loader to your `next.config.ts` (or `next.config.js`):

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      // Apply to TSX and JSX files only
      "**/*.{tsx,jsx}": {
        loaders: [
          {
            loader: "@locator/webpack-loader",
            options: {
              env: "development",
            },
          },
        ],
      },
    },
  },
};

export default nextConfig;
```

**For JavaScript config:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "**/*.{tsx,jsx}": {
        loaders: [
          {
            loader: "@locator/webpack-loader",
            options: {
              env: "development",
            },
          },
        ],
      },
    },
  },
};

module.exports = nextConfig;
```

### 3. Import Runtime

Add the TreeLocatorJS runtime to your root layout or entry point:

**In `app/layout.tsx`:**

```typescript
import "@treelocator/runtime";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## What It Does

The `@locator/webpack-loader` adds `data-locatorjs` attributes to your JSX elements during build:

```html
<!-- Before -->
<div className="page">
  <main>
    <Counter />
  </main>
</div>

<!-- After (in development) -->
<div className="page" data-locatorjs="app/page.tsx:6:4">
  <main data-locatorjs="app/page.tsx:7:6">
    <div data-locatorjs="app/components/Counter.tsx:9:4">
      <!-- Counter component content -->
    </div>
  </main>
</div>
```

These attributes contain:
- File path (relative)
- Line number
- Column number

TreeLocatorJS uses these attributes to show you the complete component hierarchy from server components down to client components.

## Usage

Once configured, you can:

1. **Alt+Click** any element to copy its component ancestry
2. **Click the tree icon** (bottom-right) to enable selection mode
3. **Use the browser API** for automation:

```javascript
// Get formatted ancestry path
window.__treelocator__.getPath('button');

// Get raw ancestry data
window.__treelocator__.getAncestry(document.querySelector('button'));
```

## Example Output

For a button inside a client component inside a server component:

```
div:nth-child(2) [Next.js: Page] at app/page.tsx:6
    └─ main [Next.js: Page] at app/page.tsx:7
        └─ Counter:nth-child(1) [Next.js: Counter] at app/components/Counter.tsx:9
            └─ button [Next.js: Counter] at app/components/Counter.tsx:12
```

## Troubleshooting

### Data attributes not appearing

1. Make sure you're in development mode (`next dev`)
2. Check that the webpack loader is configured for `.tsx` and `.jsx` files
3. Clear the Next.js cache: `rm -rf .next`
4. Restart the dev server

### Runtime not loading

1. Verify `@treelocator/runtime` is imported in your root layout
2. Check browser console for errors
3. Ensure the import is at the top of your layout file

### Turbopack vs Webpack

Next.js 13+ uses Turbopack by default in development. The configuration above works for Turbopack. If you're using webpack mode (`next dev --webpack`), the configuration is slightly different:

```typescript
const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.(tsx|jsx)$/,
        use: [
          {
            loader: "@locator/webpack-loader",
            options: {
              env: "development",
            },
          },
        ],
      });
    }
    return config;
  },
};
```

## Production

The loader only runs in development mode (`env: "development"`). No data attributes will be added in production builds.

## Browser API Reference

See [BROWSER-API.md](./BROWSER-API.md) for full API documentation and automation examples.
