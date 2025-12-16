# Component Ancestry Clipboard

Alt+click on any UI component to copy its ancestry chain to clipboard.

## What it does

Hold Alt (or Option on Mac) and click on any element in your app. The component ancestry tree is copied to your clipboard in a readable format:

```
div in App at src/App.tsx:5
    └─ main in Layout at src/components/Layout.tsx:12
        └─ section in Content at src/components/Content.tsx:8
            └─ button in Button at src/components/Button.tsx:15
```

## Installation

```bash
npm install @locator/runtime
```

## Usage

```js
import "@locator/runtime";
```

Or with options:

```js
import { setup } from "@locator/runtime";

setup({
  adapter: "react", // or "vue", "svelte", "jsx"
});
```

## Supported Frameworks

- React (via React DevTools)
- Vue
- Svelte
- Preact
- Any JSX framework (with babel plugin)

## Development

```bash
pnpm install
pnpm dev
```
