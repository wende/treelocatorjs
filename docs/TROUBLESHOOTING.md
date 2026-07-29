# Troubleshooting

## `window.__treelocator__` exists but ancestry is empty

The runtime being live only means the Vite plugin injected it — it does **not**
mean JSX got tagged. The most common cause on Vite 7+ with React:

`@vitejs/plugin-react` v5 detects the rolldown engine and silently skips its
babel pipeline (`canSkipBabel`). Any `babel: { plugins: [...] }` passed to
`react()` is ignored, so `@locator/babel-jsx` never runs and no
`data-locatorjs-id` attributes are emitted.

Verify in 10 seconds — check the transformed source the dev server serves:

```bash
curl -s http://localhost:5173/src/main.tsx | grep -c data-locatorjs-id
```

- `> 0` → babel is tagging correctly; the problem is elsewhere.
- `0` → babel isn't running. Fixes, depending on your stack:
  - `@vitejs/plugin-react` v6+ → wire babel through
    `@rolldown/plugin-babel` as a separate plugin (see README).
  - `@vitejs/plugin-react` v5 on classic esbuild Vite → put the babel
    config inside `react({ babel: ... })`.
  - rolldown-vite + plugin-react v5 → this combination can't run babel
    through `react()`; upgrade to plugin-react v6+ and use
    `@rolldown/plugin-babel`.

`npx @treelocator/init --check` also flags common misconfigurations.

## "duplicate prop `__source`" / dev server crashes after adding a source plugin

Do **not** add `@babel/plugin-transform-react-jsx-source`.
`@vitejs/plugin-react` already emits `__source` (read by the runtime as
`fiber._debugSource`) as part of its own JSX transform in dev mode. Adding
the babel plugin on top makes two transforms emit the same prop and React
errors out.

If `_debugSource` is missing (e.g. SWC or rolldown-skip paths), that's fine:
the primary chain is built from `data-locatorjs-id` / `__LOCATOR_DATA__`
emitted by `@locator/babel-jsx`. `_debugSource` only enriches deep ancestry
for components the babel plugin didn't tag (e.g. library components), so the
locator still works without it — just with slightly shallower chains.
