# ReScript source-map support — implementation review

**Date:** 2026-05-16
**Branch reviewed:** `claude/rescript-source-maps-Sa86N`
**Commit:** `7e572e1` — `feat(rescript): add ReScript source location tracking`
**Reviewed from:** worktree `.claude/worktrees/rescript-review`

## Scope

Verify the ReScript support feature against the spec: source-location
tracking for `rescript-react` so that Alt+click resolves to `.res` files
and lines instead of compiled `.res.js` intermediates, and that the
React fiber reports the module name (`Button`) instead of the literal
`make`.

## What ships

- `packages/vite-plugin-rescript/` — new published package
  (`@treelocator/vite-plugin-rescript`, `0.6.0`, MIT, peer-dep `vite>=3`).
  Builds dual ESM/CJS + `.d.ts` via tsup.
- `packages/runtime/src/adapters/rescript.ts` — no-op re-export of the
  React adapter (ReScript compiles to React fibers, so the React adapter
  handles ancestry natively once `__source` is injected).
- `apps/vite-rescript/` — demo on port 3353 with pre-built `.res.js` +
  `.res.js.map` fixtures (so CI doesn't need a `rescript` binary).
  `vite.config.js` wires the plugin + `@vitejs/plugin-react` with
  `jsxRuntime: 'classic'` and an esbuild JSX loader for `.res.js`.
- `apps/playwright/tests/ancestry/rescript.spec.ts` — 4 ancestry
  assertions (module name, wrapping component, `.res` file path,
  line in range).
- `apps/playwright/scripts/run-ancestry-tests.sh` — starts the new
  demo and waits for port 3353.

## Plugin behavior (`packages/vite-plugin-rescript/src/index.ts`)

- Triggers on `.res.js` (strips query strings before checking suffix).
- Parses with `@babel/parser` (`sourceType: "module"`, plugin `"jsx"`),
  traverses, and for each `JSXOpeningElement` injects
  `__source={{fileName, lineNumber, columnNumber}}`.
- `fileName` is resolved via
  `path.resolve(dirname(jsFile), original.source)` and normalized to
  forward slashes — covers spec pain point #6 (relative source-map paths).
- Skips elements that already carry `__source` (idempotent).
- For top-level `let make = …` declarations, appends
  `make.displayName = "<basename>"` so the React component name is the
  module name (spec pain point #2). Inner `make` bindings inside other
  functions are correctly ignored via a Program-grandparent check.
- Skips displayName injection when one already exists.
- `SourceMapConsumer` instances are cached per `.res.js` path; the
  `handleHotUpdate` hook invalidates entries on `.res`, `.res.js`, or
  `.res.js.map` changes (spec pain points #3).
- Dev gating: `configResolved` sets `isDev = command === "serve"`;
  explicit `injectSource` option overrides (spec pain point #7).
- Missing source map: warns once via `this.warn(...)` and returns `null`;
  malformed JSON in the `.map` is swallowed (still returns `null`).
- Babel CJS/ESM interop is handled defensively for `@babel/traverse` and
  `@babel/generator` (`.default` fallback) — necessary in pnpm.

## Test coverage

`packages/vite-plugin-rescript/src/index.test.ts` — 17 tests, all
passing locally:

- **File filtering** — no-op for `.tsx`, `.jsx`, `.vue`; query strings
  stripped before checking the suffix.
- **Missing source map** — warns exactly once across repeated transforms;
  malformed `.map` JSON does not throw.
- **`__source` injection** — correct `lineNumber` from remap; absolute
  path emitted even when the source-map `source` entry is relative
  (`./Button.res`); existing `__source` is not duplicated.
- **`displayName` injection** — appended after `let make = …`; uses file
  basename (`GlassPanel.res.js` → `"GlassPanel"`); skipped when no
  top-level `make` exists; not double-assigned if one is already present;
  inner-scope `make` does not trigger injection.
- **Dev gating** — `injectSource: false` is a no-op; default behavior
  follows `command: "serve"` vs `"build"`.
- **HMR cache invalidation** — replacing the `.map` file and calling
  `handleHotUpdate({ file: <.res> })` produces a fresh remap on the
  next transform.

Runtime suite: 22 files / 407 tests still pass — no regression from
the new adapter file.

## Verified locally

- `pnpm install` (worktree)
- `pnpm test` in `packages/vite-plugin-rescript` → 17/17 pass
- `pnpm ts` in `packages/vite-plugin-rescript` → no TS errors
- `pnpm build` in `packages/vite-plugin-rescript` → ESM/CJS/DTS build
  clean
- `pnpm test` in `packages/runtime` → 407/407 pass

## Not verified in this session

- **End-to-end Playwright spec** — the workspace rule against
  backgrounded long-running tasks blocked starting `vite-rescript`'s
  dev server, so `rescript.spec.ts` was not executed here. The spec
  itself reads correctly and runs against pre-built fixtures, so it
  should be deterministic when the runner script picks it up.
- **Real `rescript build` output** — fixtures are hand-crafted in
  `apps/vite-rescript/scripts/build-fixtures.mjs` rather than emitted
  by the ReScript compiler. The manual smoke checklist from the spec
  (real `rescript-react` + Vite, monorepo subdir, VS Code / WebStorm
  editor-open links) is the right place to validate that the
  ReScript-emitted source-map column conventions match what the plugin
  assumes.

## Things to follow up on

1. **Docs missing.** No README in `packages/vite-plugin-rescript/`, no
   mention in the root `README.md` or `CLAUDE.md`, and no description
   anywhere of the required `esbuild.loader: 'jsx'` +
   `optimizeDeps.esbuildOptions.loader: { '.res.js': 'jsx' }` config
   from the demo's `vite.config.js`. Users will hit dev-server parse
   errors without that. Should be documented before the package is
   advertised.
2. **Real-compiler fixture step.** Consider an optional `pnpm fixtures`
   variant that shells out to `rescript build` when available, so the
   demo can be regenerated from real ReScript output rather than from
   the hand-written mappings in `build-fixtures.mjs`.
3. **No webpack/Next path.** Explicitly out of scope per the design
   doc; revisit when there's user demand.
4. **Column precision** is statement-level per the design doc — fine
   for now since TreeLocatorJS displays file+line, but worth a
   follow-up issue if column accuracy ever becomes user-visible.

## Verdict

Implementation matches the spec. The plugin is small, well-tested at
the unit level, and the integration surface (demo app + Playwright
spec + runner script) is wired correctly. Outstanding work is
documentation and a real end-to-end smoke run against the actual
ReScript compiler — neither blocks the code review, but both should
land before the package is recommended publicly.
