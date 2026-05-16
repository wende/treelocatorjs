# Alt+Shift for Full Output, HTML-style Attribute Block, DOM Fallback

**Date**: 2026-05-16
**Files changed**:
- `packages/runtime/src/adapters/createTreeNode.ts`
- `packages/runtime/src/adapters/dom/domAdapter.ts` (new)
- `packages/runtime/src/components/Runtime.tsx`
- `packages/runtime/src/components/RecordingPillButton.tsx`
- `packages/runtime/src/functions/formatAncestryChain.ts`
- `packages/runtime/src/functions/formatAncestryChain.test.ts`
- `packages/runtime/src/hooks/useRecordingState.ts`
- `packages/runtime/src/visualDiff/snapshot.ts`
- `apps/wende-demo/components/TreeLocatorDemo.tsx`

## Summary

Several related changes to the runtime's copy output, the visual diff pipeline,
the pill button UX, and a DOM fallback adapter so the locator is usable on
pages with no JS framework. Plus a demo bugfix.

## 1. Alt+Shift now gates the "full" output

Previously, Alt+Shift truncated the ancestry to the first file. That was
backwards — the common case is "I clicked something, give me the local
context"; the long-chain + computed-styles dump is the exception.

Inverted the modifier:

- **Alt+click** (default) → truncated tree + HTML attrs only. No computed
  styles.
- **Alt+Shift+click** → full ancestry chain + computed styles (still respects
  the `computedStyles` setting).

The computed-styles extraction is the expensive, noisy part, so gating it on
Shift makes the default output usable as a quick locator selector without
flooding the clipboard.

`Runtime.tsx`:
```ts
if (!e.shiftKey) {
  ancestry = truncateAtFirstFile(ancestry);
}
const stylesEnabled = settings().computedStyles && e.shiftKey;
```

## 2. HTML-style attribute block under the tree

The old format inlined classes into each selector
(`Button#save.btn.btn-primary`), which becomes unreadable with Tailwind
class lists (10+ classes per element). A first pass moved classes to a
bulleted list below the tree:

```
Classes on Button:
  .btn
  .btn-primary
```

This iteration changes that block to read like an HTML opening tag — one line
per attribute, space-separated class values, and includes `id` too:

```
Button#save at src/Button.tsx:42

Button:
  id="save"
  class="btn btn-primary"
```

Implementation in `formatAncestryChain.ts`: the `#id` stays in the tree
selector for CSS-selector context, but `id` and `class` are also emitted as
attributes below for readability. The block is omitted entirely when the
clicked element has neither an id nor classes.

The `id` was previously only visible inline in the selector — now it's also
in the attribute block, which is useful when the selector line is long.

## 3. DOM fallback adapter

`createTreeNode.ts` used to return `null` when no framework was detected,
making the locator a no-op on plain HTML pages. It now falls back to a new
`DOMTreeNodeElement` (in `adapters/dom/domAdapter.ts`) — a thin extension of
`HtmlElementTreeNode` that returns `null` for source/component lookups but
still supports DOM-only ancestry traversal.

Net effect: Alt+click on a vanilla HTML page produces a tree of elements
with their id/class block, even though no component or source info is
available.

## 4. Recording pill button hover polish

Per-circle hover state in `RecordingPillButton.tsx`:

- Hovering a record/settings circle scales it to 1.12 and tints the
  background gray (`#e5e7eb`).
- The main tree button gets the same hover treatment, but only when no
  sub-circle is hovered (so the main button doesn't "pop" while you're
  reaching for a sub-action).
- New data attributes: `data-treelocator-pill` (on the root) and
  `data-treelocator-record-button` (on the record circle).

`Runtime.tsx` checks `data-treelocator-pill` in the click handler: while in
the `selecting` state, clicks on the pill itself are passed through to the
pill's own handlers instead of being interpreted as the user picking an
element to record. Without this, clicking the record/settings button while
in selection mode would silently target the button instead of the element
you actually wanted.

## 5. Visual diff: component labels + sync finalize

`useRecordingState.ts` + `snapshot.ts`:

- `takeSnapshot` now optionally fills an `elementMap: Map<string, Element>`
  so the diff can resolve snapshot entries back to live DOM nodes later.
- After a recording, diff entries are enriched with a component label
  (`getElementLabel(collectAncestry(...))`) so the report shows
  `Button at src/Button.tsx:23` instead of just `button.foo > div:nth-child(2)`.
- Removed the `await waitForSettle(1000, root)` from finalize. Settle is now
  hard-coded to `"clean"` and `finalizeVisualDiff` is synchronous.

  Reason: the settle wait at finalize time was double-counting — interactions
  already wait for settle before the recording stops. The extra 1s tail just
  added latency to the "Stop recording" feel without changing the diff
  contents in practice.

## 6. Demo fix: `await` the Promise-returning browser API

`apps/wende-demo/components/TreeLocatorDemo.tsx` was calling
`api.getPath(el)` / `api.getAncestry(el)` without `await`. The browser API
returns `Promise<string | null>` (it does an async source-map enrichment
pass), so the demo was passing a Promise to `setElementPath`, which then
got rendered as a React child and crashed the page:

```
Objects are not valid as a React child (found: [object Promise])
```

Added `await` at both call sites and updated the inline type annotations to
match the real `Promise<...>` signatures.

## Tests

`formatAncestryChain.test.ts`:
- New: `lists id and classes of the clicked element as html attributes below the tree`
- New: `shows id even when there are no classes`
- New: `only lists classes of the innermost (clicked) element, not ancestors`
- Updated: every test that had an `id` on the clicked element now also
  expects the trailing `<Name>:\n  id="..."` block.
- 26 tests passing.

## Notes for future-me

- The truncated/full split is now a hard policy: any new heavy extraction
  (CSS rules, bounding rects, etc.) should default to Shift-only.
- `DOMTreeNodeElement` is the cheapest possible adapter — if you want
  source location info on plain HTML, you'd need to inject it at build
  time, which means the JSX/babel path. Don't try to make the DOM adapter
  guess at component boundaries.
- Visual diff's `enrichEntryLabels` reuses `createTreeNode` — it'll go
  through the DOM fallback now too, so labels work on framework-less pages.
