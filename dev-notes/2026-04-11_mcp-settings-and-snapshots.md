# Dev Notes: MCP Bridge, Settings Panel, and Named Snapshots

**Date:** April 11, 2026

## Summary

Four feature areas landed in the runtime today, plus a small build fix and a
handful of cleanups:

1. **MCP bridge** — expose the runtime to AI MCP clients through a local WSS
   session broker and stdio MCP server.
2. **Named snapshot API** — persistent baseline-style snapshots diffable
   across reloads, exposed on `window.__treelocator__` and as MCP tools.
3. **Computed-styles polish** — shadow-DOM probe for default extraction,
   `includeDefaults` option, removal of the 30s diff time window.
4. **Settings panel** — persisted in-page toggles and threshold inputs for
   the runtime's tracking features.

Plus: CSS classes now appear in ancestry selectors, the missing `visualDiff`
module finally got committed, solid-js bumped to 1.9.11, and phoenix-demo
stopped tracking its build output.

---

## 1. MCP Bridge (`feat(runtime): MCP bridge and named snapshot API`)

**Commit:** `d15aa79`

### Architecture

```
browser runtime  ──wss──▶  @treelocator/mcp broker  ◀──stdio──  AI client
```

1. `@treelocator/runtime` opens a browser-side bridge to
   `wss://127.0.0.1:7463/treelocator` (fallback: `wss://localhost:7463/treelocator`).
2. `@treelocator/mcp` hosts:
   - a stdio MCP server that AI clients connect to, and
   - a local WSS broker that accepts browser sessions.
3. Tool calls from the MCP client are routed to the currently selected
   browser session.

### Runtime config

`setup()` now accepts an `mcp` block:

```ts
setup({
  mcp: {
    enabled: true,                                 // default: true
    bridgeUrl: "wss://127.0.0.1:7463/treelocator",
    reconnectMs: 1000,                             // base, exponential backoff
  },
});
```

`reconnectMs` is the base for exponential backoff capped at 5 minutes. After
a couple of consecutive connection failures we fall into a quieter 5-minute
retry cadence so offline dev machines don't spam the console.

### MCP tools

- `treelocator_list_sessions`
- `treelocator_connect_session`
- `treelocator_get_path`
- `treelocator_get_ancestry`
- `treelocator_get_path_data`
- `treelocator_get_styles`
- `treelocator_get_css_rules`
- `treelocator_get_css_report`
- `treelocator_take_snapshot` / `treelocator_get_snapshot_diff` / `treelocator_clear_snapshot`
- `treelocator_click`, `treelocator_hover`, `treelocator_type`

All element tools take `{ sessionId?, selector, index? }`. `sessionId` is
optional once a session has been selected with `connect_session`.

### New files

- `packages/mcp/` — new workspace package (broker, stdio server, tool
  schemas, cert helper, protocol types, vitest config).
- `packages/runtime/src/mcpBridge.ts` + tests — browser-side bridge client,
  heartbeats, reconnect strategy, command dispatcher that maps bridge
  commands to `window.__treelocator__` methods.
- `docs/MCP.md` — architecture + tool list.
- `.mcp.json` — registers the broker as a Claude Code MCP server for local
  development.

---

## 2. Named Snapshot API

Persistent element-style baselines that survive reloads, exposed both on
`window.__treelocator__` and as MCP tools.

```ts
// Before making a change
window.__treelocator__.takeSnapshot(".hero", "hero-layout");

// ...edit code, reload, tweak, whatever...

// Later (as many times as you like)
const diff = window.__treelocator__.getSnapshotDiff("hero-layout");
console.log(diff.formatted);
```

### Design choices

- **Baselines are immutable.** `getSnapshotDiff` never overwrites the stored
  baseline — you can diff against the same origin state repeatedly while
  iterating on a fix. To reset, call `takeSnapshot` again or
  `clearSnapshot(id)`.
- **localStorage persistence.** Stored under `treelocator:snapshot:<id>` so
  multiple snapshots coexist and survive reloads. SSR-safe via the shared
  `getStorage()` helper.
- **Backed by `readSnapshot` / `formatSnapshotDiff`** extracted from
  `extractComputedStyles.ts` — no duplication of the style-reader logic.

### New files

- `packages/runtime/src/functions/namedSnapshots.ts` + tests (8 tests).
- Three new methods on `LocatorJSAPI` in `browserApi.ts`.

---

## 3. Computed Styles Polish (`refactor(runtime): computed styles probe and includeDefaults option`)

**Commit:** `6328c09`

Three independent tweaks to `extractComputedStyles.ts`:

### Shadow-DOM probe for browser defaults

Previously the default-styles probe was a hidden element appended to
`document.body`. Problem: page CSS (universal selectors, `all:` resets,
typography rules) suppressed the "natural" browser defaults, so when we
later filtered "non-default" properties we accidentally filtered out
inherited typography that the user *did* care about on their element.

Fix: mount the probe inside a fresh `div` host with `all:initial !important`
and attach an open Shadow DOM. Page CSS can't cross that boundary, so the
computed style of the probe reflects the genuine browser defaults.

Falls back to the old hidden-element approach when `attachShadow` is
unavailable.

### `ExtractOptions.includeDefaults`

New option for callers that want a DevTools-style dump:

```ts
window.__treelocator__.getStyles("h1", { includeDefaults: true });
```

Skips default filtering entirely and returns the full curated property set.
Surfaced on `getStyles()` and documented in `docs/BROWSER-API.md`.

### Removed `DIFF_WINDOW_MS`

The previous behavior reset the "last snapshot" after 30 seconds, so a
repeat `getStyles()` call on the same element after an async wait would
return a full dump instead of a diff. That was surprising — especially for
Playwright flows where 30s often elapses between interactions. Now repeat
calls on the same element always diff. (The element ref is still held
via `WeakRef` so we don't prevent GC.)

---

## 4. Settings Panel (`feat(runtime): persisted settings panel`)

**Commit:** `1ae94cf`

An in-page panel for toggling tracking features and tuning dejitter
thresholds without reloading.

### What's configurable

| Setting | Default | Why it's here |
|---|---|---|
| `anomalyTracking` | `true` | Main dejitter pass; turn off for low-noise recordings |
| `visualDiff` | `true` | Before/after element-tree snapshot for the recording flow |
| `computedStyles` | `true` | Include styles in alt+click clipboard output |
| `computedStylesIncludeDefaults` | `false` | Fuller dump in alt+click (pairs with the new option in #3) |
| `sampleRate` | `15` | Dejitter sample rate (Hz) |
| `maxDurationMs` | `30000` | Max recording length |
| `jumpMinAbsolute` | `50` | Jump detection threshold (px) |
| `lagMinDelay` | `50` | Lag detection threshold (ms) |

### Implementation

- `useSettings.ts` — signal owned at module scope via `createRoot`, persisted
  under `__treelocator_settings__` in localStorage. Reads merge onto
  `DEFAULT_SETTINGS` so adding new keys never breaks stored state.
- `SettingsPanel.tsx` — renders toggles + numeric inputs inside the shadow
  DOM overlay. Dismisses on outside click via
  `data-treelocator-settings-panel` / `data-treelocator-settings-toggle`
  attribute markers checked in `Runtime.tsx`'s click handler.
- `useRecordingState.ts` reads thresholds/gates from `settings()` so toggles
  take effect on the next recording without a reload. Visual-diff snapshot
  gating and anomaly-tracking `findings()` calls are now settings-aware.
- `RecordingPillButton.tsx` redesign:
  - Wrapper repositioned from absolute bottom-right to `right:23/bottom:23`
    with a tighter 154x138 hover zone.
  - Adds a third circle on the arc (settings cog) that opens the panel.
  - New "puddle" pulse animation under the record circle while actively
    recording — two expanding rings at `0.38` and `0.4` alpha.
  - `RecordingResults` panel's `bottom` shifted from `84px` to `180px` to
    clear the new pill footprint.

### Shared storage helper

Extracted `getStorage.ts` so every consumer (settings, recording storage,
named snapshots) treats localStorage as optional and SSR-safe. The
`useLocatorStorage` test suite now stubs it with `vi.stubGlobal` instead of
depending on a real localStorage.

---

## 5. Smaller changes

### CSS classes in ancestry selectors (`4fe0d46`)

`formatAncestryChain` now collects `classList` into `AncestryItem.classes`
and renders it after the id as `.class1.class2`, e.g. `Button#save.btn.btn-primary`.
Gives clipboard output enough selector fidelity to round-trip back to the
DOM.

### visualDiff module committed (`7f648c8`)

`useRecordingState.ts` at HEAD already imported from `../visualDiff/snapshot`,
`/diff`, `/settle`, `/types` but those files had never been committed. The
runtime was literally unbuildable at main. Committed the snapshot/diff/settle
utilities plus their tests.

### phoenix-demo dist ignored (`f8de45f`)

Every other Vite demo app has a `.gitignore` excluding `dist/`. phoenix-demo
just never got one, so build output kept getting committed. Added the
standard ignore file and untracked the existing output.

### Chores

- `cac140a` — solid-js bump to ^1.9.11 across runtime and 3 demo apps. The
  lockfile in this commit also absorbs the new `@treelocator/mcp` deps
  (`@modelcontextprotocol/sdk`, `selfsigned`, `ws`, `zod`, `tsup`).
- `3096665` — regenerated `packages/init/dist/index.d.ts`.

---

## Stats

- **~5,400 lines added**, ~2,300 removed across 8 commits.
- **New workspace package** `@treelocator/mcp` (13 source files + 3 test files).
- **~40 new tests** — namedSnapshots (8), mcpBridge (9), broker (9), stdio
  transport + remote broker client (~20).

---

## Follow-ups

- The MCP broker runs on a fixed port (7463) with self-signed certs. Works
  fine for local dev; revisit if multiple projects start wanting to run
  brokers concurrently.
- Settings panel has no export/import — users on a fresh machine rebuild
  their preferred thresholds by hand.
- `takeSnapshot` baselines are keyed by caller-chosen `snapshotId` only.
  Consider namespacing by origin if snapshots from unrelated sites
  start colliding in a shared browser profile.
