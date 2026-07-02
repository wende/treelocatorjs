# Source → DOM — Design Plan

> How to add **code → live UI** lookup to TreeLocatorJS, what [Domscribe](https://github.com/patchorbit/domscribe) does today, what we can borrow, and where we can beat them given existing capabilities.

Related docs: [Treebrowser.md](./Treebrowser.md) (gap analysis), [BROWSER-API.md](./BROWSER-API.md), [MCP.md](./MCP.md).

---

## Problem

TreeLocatorJS today is strong at **DOM → source**: Alt+click or `getPath()` walks from a rendered element to its component ancestry and file locations. Agents editing frontend code still start blind — they know *which file* they changed but not *what it looks like live*, *which DOM nodes it owns*, or *whether HMR applied correctly*.

The missing direction is **source → DOM**:

```
file:line (or component name)  →  live element(s) + context on the running page
```

Domscribe's `domscribe.query.bySource` is the reference implementation. This document describes that system, proposes a TreeLocator-shaped version, and calls out places we can do better without copying their architecture wholesale.

---

## What Domscribe actually does (from code, not README)

Domscribe splits source→DOM across **three layers**:

### 1. Build-time manifest (server-side index)

During dev transforms, `@domscribe/transform` injects `data-ds="<8-char-id>"` on JSX/Vue host elements and appends entries to `.domscribe/manifest.jsonl`.

Each entry stores:

- Stable element ID (`data-ds` value)
- Source file path + start/end position (line/column)
- Tag name, component name

`ManifestReader` (`packages/domscribe-manifest/src/reader/manifest-reader.ts`) maintains in-memory indexes:

- `entries`: ID → entry (O(1))
- `fileIndex`: file → set of IDs
- `componentIndex`: component name → set of IDs

**Position lookup** (`getEntryByPosition(file, line, column?, tolerance?)`):

1. Load all entries for the file via `fileIndex`
2. Filter to entries within `tolerance` lines of the target
3. Pick closest by line distance, then column distance

This is how `query.bySource` resolves a cursor position to a manifest entry **without the browser**.

### 2. Relay server (MCP + HTTP + WebSocket)

The relay (`packages/domscribe-relay/`) is the hub:

| Surface | Role |
|---------|------|
| HTTP REST | Annotation CRUD, manifest resolve, `POST /api/v1/manifest/resolve-by-source` |
| WebSocket `/ws` | Push annotation updates; **request live runtime context from browser** |
| MCP stdio | 12 tools including `domscribe.query.bySource`, `domscribe.resolve`, annotation workflow |

**`query.bySource` flow** (`query-by-source.route.ts`):

```
Agent calls domscribe.query.bySource({ file, line, column?, tolerance?, includeRuntime? })
  │
  ├─► ManifestReader.getEntryByPosition(file, line, …)  →  entryId + sourceLocation
  │
  └─► if includeRuntime && browser connected:
        wsServer.requestContext(entryId)  →  browser
          │
          └─► overlay/runtime: document.querySelector(`[data-ds="${entryId}"]`)
                → capture props, state, optional styles, DOM snapshot
```

Default runtime timeout: ~3s. Returns `browserConnected: false` when no tab is open.

### 3. Browser runtime (live capture)

When the relay sends `context:request` with an `entryId`:

1. Find element: `document.querySelector('[data-ds="…"]')` (`overlay-store.ts`)
2. `BridgeDispatch.captureContextForEntry(entryId)` runs framework adapters
3. React/Vue extractors serialize **props** and **state** (hooks, class state)
4. Optional `StyleCapturer` (off by default) adds computed-style allowlist
5. PII redaction applied before data leaves the browser (`@domscribe/core/privacy/redaction.ts`)
6. Response sent back over WebSocket

**Key constraint:** Domscribe's reverse lookup depends on `data-ds` being present on the live DOM. No attribute → `rendered: false` even if source exists in manifest.

### What Domscribe returns

```ts
{
  found: boolean;
  entryId?: string;
  sourceLocation?: { file, start, end, tagName, componentName };
  browserConnected?: boolean;
  runtime?: {
    rendered: boolean;
    componentProps?: unknown;
    componentState?: unknown;
    componentStyles?: { computed?, customProperties? };  // captureStyles: true only
    domSnapshot?: { tagName, attributes, … };
  };
}
```

### What Domscribe does *not* do (despite positioning)

- No component **ancestry chain** in reverse lookup — single element only
- No CSS cascade / rule inspection — thin computed-style allowlist when enabled
- No multi-framework reverse lookup beyond React + Vue adapters (Svelte/Solid/Preact/Phoenix unsupported)
- No browser automation tools (click/hover/type) on MCP
- `verify_after_edit` MCP tool referenced in types/RFC but **not registered**
- Cursor plugin auto-install is manual only ("coming soon" in init wizard code)

---

## What TreeLocator already has (relevant building blocks)

We are not starting from zero. Several primitives invert or compose into source→DOM:

| Existing capability | Location | Relevance |
|--------------------|----------|-----------|
| Forward ancestry map | `formatAncestryChain.ts`, adapters | Inverse index design reference |
| Path-encoded DOM attrs | `data-locatorjs="/file.tsx:line:col"` | **Direct source→element mapping without manifest** |
| ID-encoded DOM attrs | `data-locatorjs-id="path::exprId"` + `__LOCATOR_DATA__` | Reverse via runtime store |
| React fiber source walk | `reactAdapter.ts`, `findDebugSource.ts` | Match fibers by `_debugSource` file:line |
| Vue/Svelte built-in meta | `vueAdapter.ts`, `svelteAdapter.ts` | Scan DOM for elements whose framework meta matches position |
| Phoenix HEEx comments | `parsePhoenixComments.ts` | Server-side attribution already parsed forward |
| React 19 source maps | `resolveSourceMap.ts`, `enrichAncestrySourceMaps.ts` | Improve file path normalization for lookup |
| Source-aware page tree | `sourceAwareTree.ts`, `getTree()` | Page-wide scan with `{ file, line, component }` per node |
| CSS inspection | `cssRuleInspector.ts`, `getCSSRules/Report` | Richer than Domscribe's style allowlist |
| Named snapshots + diff | `namedSnapshots.ts` | Verify post-edit without PNG screenshots |
| Visual diff engine | `visualDiff/` | Structural DOM change detection |
| MCP bridge + 17 tools | `mcpBridge.ts`, `@treelocator/mcp` | Transport layer exists; add new bridge commands |
| Dejitter / recording | `dejitter/recorder.ts` | Detect animation regressions after edits |

**Important:** TreeLocator's MCP architecture is **browser-centric** — the MCP server sends commands to the runtime over WebSocket, and the runtime executes them in-page. Domscribe's MCP is **relay-centric** — manifest lookup runs on the Node server, then optionally asks the browser for live context.

We can keep our browser-centric model and still add source→DOM without a full relay rewrite.

---

## Lessons from Domscribe (worth adopting)

### 1. Two-phase lookup is the right shape

Separate **"does this source location exist?"** from **"what does it look like live?"**

- Phase A (index): file:line → candidate element key(s) — can work offline from manifest or in-browser scan
- Phase B (runtime): element key → live DOM + context — requires connected browser

Agents benefit from `{ found, rendered, browserConnected }` rather than a single opaque failure.

### 2. Tolerance for imprecise line numbers

Agents rarely hit the exact JSX opening tag line. Domscribe's `tolerance` parameter (default 0, configurable) picks the nearest manifest entry within N lines. We should support the same — especially for component-level edits where the cursor sits on a prop line, not the element node.

### 3. Explicit `browserConnected` flag

When the dev server is running but no tab is open, Domscribe returns manifest data with `browserConnected: false`. This is better than failing silently. TreeLocator should mirror this.

### 4. Structured response schema

Domscribe uses Zod schemas end-to-end (MCP tool, HTTP route, WS messages). We should define a single `QueryBySourceResult` type shared by `window.__treelocator__`, MCP bridge, and docs.

### 5. File path normalization is a real problem

Manifest lookups fail when agent paths don't match indexed paths (`/Users/.../src/Button.tsx` vs `src/Button.tsx`). Domscribe documents using `manifest.query` to discover canonical paths. We already have `normalizeFilePath.ts` — reverse lookup must use the same normalization everywhere.

---

## Where TreeLocator can do better (given current capabilities)

Domscribe optimizes for **annotation handoff** (props/state + intent). TreeLocator optimizes for **semantic understanding** (ancestry, CSS, structure). Source→DOM on our stack should lean into that.

| Area | Domscribe | TreeLocator opportunity |
|------|-----------|-------------------------|
| **Match strategy** | Requires `data-ds` on DOM | Multi-strategy: path attrs, fiber walk, framework meta, DOM scan via `getTree` |
| **Framework coverage** | React + Vue only | Also Svelte, Solid, Preact, Phoenix LiveView, Next.js RSC |
| **Context returned** | Props + state + thin styles | Ancestry chain, owner components, server components, full CSS cascade report |
| **Multiple matches** | Picks single closest entry | Return **all** rendered candidates when one source line maps to multiple DOM nodes (lists, loops) |
| **Verification** | PNG comparator exists but unwired | `take_snapshot` / `get_snapshot_diff` + visual diff already in MCP |
| **Agent tooling** | Read/query only | Also click/hover/highlight via existing MCP interaction tools |
| **Manifest requirement** | Requires `.domscribe/manifest.jsonl` | Optional — path-based `data-locatorjs` attrs already encode file:line on element |
| **Production safety** | CI strip tests for `data-ds` | Already dev-only runtime; document parity expectations |

### Our moat: ancestry-aware reverse lookup

Domscribe answers: *"What props does this button have?"*

TreeLocator should answer: *"What props/CSS/ancestry/context does this button have, and where does it sit in the component tree?"*

Example enriched response:

```ts
{
  found: true,
  matches: [{
    selector: '[data-locatorjs="/src/Button.tsx:12:4"]',
    rect: DOMRect,
    path: "div in App → button in SubmitButton",   // formatted ancestry
    ancestry: AncestryItem[],
    styles?: ComputedStylesResult,
    cssReport?: string,                             // optional, on request
  }],
  browserConnected: true,
  confidence: "high" | "medium" | "low",
  matchStrategy: "path-attr" | "fiber" | "framework-meta" | "scan",
}
```

### Optional props/state (Phase 2, not blocking)

Domscribe's props/state capture is valuable for agent edits ("button label is still `'Save'`"). We don't have this today. Recommendation:

- **Phase 1:** source→element(s) + ancestry + styles/CSS (reuse existing extractors)
- **Phase 2:** add opt-in props/state capture per framework (borrow Domscribe's extractor pattern, not their manifest dependency)

This keeps Phase 1 shippable without re-architecting adapters.

---

## Proposed TreeLocator API

### Browser API (`window.__treelocator__`)

```ts
interface QueryBySourceOptions {
  file: string;
  line: number;
  column?: number;
  tolerance?: number;           // default 0
  includeHidden?: boolean;      // include display:none nodes
  includeStyles?: boolean;      // getStyles() for each match
  includeCssReport?: boolean;   // getCSSReport() for each match (heavier)
  maxMatches?: number;          // default 10
}

interface SourceMatch {
  element: HTMLElement;         // not serialized in MCP; use selector
  selector: string;             // stable selector for agent follow-up calls
  rect: DOMRectJSON;
  path: string | null;
  ancestry: AncestryItem[] | null;
  styles?: ComputedStylesResult;
  cssReport?: string;
  confidence: "high" | "medium" | "low";
  matchStrategy: MatchStrategy;
  // Phase 2:
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

interface QueryBySourceResult {
  found: boolean;
  normalizedFile: string;
  query: { file: string; line: number; column?: number; tolerance: number };
  matches: SourceMatch[];
  truncated: boolean;
}

queryBySource(options: QueryBySourceOptions): Promise<QueryBySourceResult>;
highlightSource(options: QueryBySourceOptions): Promise<QueryBySourceResult>;
// highlightSource = queryBySource + temporary overlay outlines (dev UX)
```

### MCP tools

| Tool | Purpose |
|------|---------|
| `treelocator_query_by_source` | Primary code→UI lookup |
| `treelocator_highlight_source` | Same + visual highlight in browser (agent confirms target before edit) |
| `treelocator_find_source` | Component name → `[{ file, line }]` (supporting tool; partially overlaps `get_tree` filtering) |

Bridge commands to add in `mcpBridge.ts`:

```ts
| "query_by_source"
| "highlight_source"
| "find_source"   // optional Phase 1.5
```

### Relationship to existing tools

| After `query_by_source` returns a selector… | Agent calls… |
|---------------------------------------------|--------------|
| Need full ancestry string | `treelocator_get_path` (should agree) |
| Need CSS cascade detail | `treelocator_get_css_report` |
| Need to verify an edit landed | `treelocator_take_snapshot` → edit → `treelocator_get_snapshot_diff` |
| Need to interact | `treelocator_click` / `_hover` |
| Need page overview | `treelocator_get_tree` with selector |

---

## Implementation strategy — match resolution per framework

Priority order (first match wins within strategy, all strategies combined):

### Strategy A: Path attribute (high confidence)

For elements with `data-locatorjs="/path/to/file.tsx:line:column"` (Next.js RSC, webpack loader, path-format babel output):

```
scan document.querySelectorAll('[data-locatorjs]')
filter where parsed path matches normalizedFile + line (± tolerance)
```

Already have `parseDataPath()` in `parseDataId.ts`. No manifest file needed.

### Strategy B: Locator ID + `__LOCATOR_DATA__` (high confidence)

For `data-locatorjs-id="fullPath::exprIndex"`:

```
look up __LOCATOR_DATA__[fullPath].expressions where loc.start.line ≈ target line
map to DOM nodes with matching data-locatorjs-id
```

Reverse of `runtimeStore.getDataForDataId()`.

### Strategy C: React fiber scan (medium–high confidence)

Walk React fiber tree (reuse `findFiberByHtmlElement` patterns in reverse):

```
for each fiber with resolvable _debugSource / _debugStack:
  if normalize(source.file) == normalizedFile && source.line within tolerance:
    collect host DOM nodes from fiber
```

Handles React apps **without** babel-injected attributes (DevTools hook path). Slower — cache results, run on demand not on every keystroke.

### Strategy D: Vue / Svelte framework meta (medium–high confidence)

```
scan DOM (or subtree from getTree)
Vue: element.__vueParentComponent?.type.__file + line from dev metadata
Svelte: element.__svelte_meta?.loc
match against query position
```

### Strategy E: Source-aware tree scan (medium confidence, broad fallback)

Use existing `buildSourceAwareTree()`:

```
build tree → filter nodes where node.file/node.line match query
return nodes with selectors derived from tag/id/classes/nth-child
```

Already implemented for forward `getTree`; reverse is a filter pass. Good fallback when attrs missing.

### Strategy F: Phoenix / server components (medium confidence)

Match server component attribution already collected in `formatAncestryChain` — filter elements whose parsed Phoenix comments or Next.js RSC attrs reference the target file:line.

---

## Architecture choice: no relay rewrite

Domscribe needs a Node-side manifest because MCP tools resolve file:line **before** talking to the browser.

**TreeLocator recommendation:** implement source→DOM **entirely in the browser runtime** first.

```
Agent → MCP broker → bridge command "query_by_source"
  → runtime.queryBySource({ file, line, … })
    → multi-strategy match in-page
    → return matches with selectors + ancestry + optional styles
```

**Why this fits us:**

- Our MCP already executes commands in the connected tab
- We have multiple ways to resolve source→DOM without a build-time manifest
- Avoids new Node services, file watchers, and `.treelocator/manifest.jsonl` maintenance — at least for v1

**Optional v2 — manifest index on disk:**

If fiber scanning proves too slow on large pages, add an optional dev-only manifest (similar to Domscribe) written by `@locator/babel-jsx` or `@treelocator/vite`. Not required for initial ship if Strategies A–E cover demo apps.

---

## Phased delivery plan

### Phase 0 — Spec + types (1–2 days)

- [ ] Define `QueryBySourceOptions`, `SourceMatch`, `QueryBySourceResult` in `packages/runtime/src/types/`
- [ ] Add `queryBySource` stub to `browserApi.ts` + `global.d.ts`
- [ ] Document in `BROWSER-API.md` and `MCP.md`
- [ ] Unit tests for path matching logic (no DOM): normalization, tolerance, column tie-break

### Phase 1 — Core reverse lookup (MVP)

**Goal:** Agent passes `file + line` → gets selectors + ancestry for live matches.

- [ ] Implement `normalizeSourceQuery()` shared helper (reuse `normalizeFilePath`)
- [ ] Implement Strategy A (path attrs) + Strategy B (`__LOCATOR_DATA__`)
- [ ] Implement Strategy E (source-aware tree filter) as fallback
- [ ] Add `queryBySource()` to `browserApi.ts`
- [ ] Wire `query_by_source` bridge command + `treelocator_query_by_source` MCP tool
- [ ] Return `{ found, matches[], confidence, matchStrategy, browserConnected: true }`
- [ ] Playwright e2e: edit file line → query → assert selector matches clicked element

**Success criteria:** Works on vite-react and next-16 demo apps without new build plugins.

### Phase 1.5 — Framework-specific scans

- [ ] Strategy C: React fiber reverse scan
- [ ] Strategy D: Vue + Svelte meta scan
- [ ] Strategy F: Phoenix / Next RSC server attrs
- [ ] `treelocator_find_source(componentName)` — filter `getTree` or scan by component label
- [ ] `highlightSource()` — reuse `Outline.tsx` to flash matched elements for 3s

### Phase 2 — Enriched context

- [ ] `includeStyles` / `includeCssReport` options on query
- [ ] `confidence` scoring (attr match = high, fiber scan = medium, tree scan = low)
- [ ] Multiple match handling + `maxMatches` truncation flag
- [ ] Extend `take_snapshot` / `get_snapshot_diff` docs for verify-after-edit workflow

### Phase 3 — Props/state capture (optional parity with Domscribe)

- [ ] React props extractor (fiber `memoizedProps`, filter internals)
- [ ] Vue props/state from VNode inspection
- [ ] Opt-in via `includeProps: true` (default false — privacy + payload size)
- [ ] Consider lightweight PII redaction for serialized values

### Phase 4 — Manifest index (only if needed)

- [ ] Evaluate perf on large apps (React fiber scan > 100ms?)
- [ ] If needed: dev-only `.treelocator/manifest.jsonl` from babel plugin
- [ ] Node-side pre-resolution for agents without connected browser (lower priority)

---

## Verify-after-edit workflow (our answer to Domscribe's unwired `verify_after_edit`)

Domscribe has `@domscribe/verify` (PNG pixel diff) but no MCP tool. We already have a better structural primitive:

```
1. treelocator_query_by_source({ file, line })     → selector
2. treelocator_take_snapshot({ selector, id: "fix-1" })
3. [agent edits source, HMR reloads]
4. treelocator_get_snapshot_diff({ snapshotId: "fix-1" })
5. Optionally treelocator replay / dejitter for animation regressions
```

Document this as the recommended agent loop in MCP.md. No new code required for basic verification — only source→DOM to seed step 1 without manual selector guessing.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Path mismatch (`src/X` vs `/abs/path/X`) | Aggressive normalization; return `normalizedFile` in response; document canonical path discovery via `get_tree` |
| One source line → many DOM nodes | Return array of matches; don't silently pick one |
| No matches when page hasn't rendered component | `found: false` with hint: `rendered: false`; suggest navigation or `get_tree` |
| Fiber scan performance | Cache per query; limit scan depth; optional manifest in Phase 4 |
| Stale line numbers after edit | `tolerance` param; agent re-queries after edit |
| Props capture leaks secrets | Phase 3 opt-in + redaction; never default on |

---

## Non-goals (for this feature)

- **Annotation queue / agent respond workflow** — Domscribe's core product; separate effort if ever desired
- **Replacing Playwright MCP** — we add semantic source mapping, not full browser automation
- **Production runtime** — source→DOM stays dev-only like everything else
- **Screenshot pixel diff as primary verify** — structural/style diff first; vision last

---

## Comparison summary

| | Domscribe `query.bySource` | TreeLocator `queryBySource` (proposed) |
|---|---|---|
| Index location | Node manifest file | In-browser multi-strategy |
| Requires `data-*` on DOM | Yes (`data-ds`) | No (fiber/meta/scan fallbacks) |
| Frameworks | React, Vue | React, Vue, Svelte, Solid, Preact, Phoenix, Next RSC |
| Returns ancestry | No | Yes (core differentiator) |
| CSS detail | Optional allowlist | Full cascade via existing tools |
| Props/state | Yes (default capture) | Phase 3, opt-in |
| PII redaction | Yes | Phase 3 if props added |
| MCP interaction tools | No | Yes (click/hover/snapshot chain) |
| Offline lookup (no browser) | Yes (manifest only) | Phase 4 optional |

---

## Suggested agent prompt pattern

Once shipped, document this for agents (similar to Domscribe's README tip):

> Before editing UI code, call `treelocator_query_by_source` with the target file and line. Use the returned selector and ancestry to confirm you are editing the right element. After HMR, call `treelocator_get_snapshot_diff` to verify the change.

---

## Open questions

1. **Should `highlight_source` auto-scroll matched elements into view?** Likely yes for multi-match disambiguation.
2. **Should we expose query results in the overlay UI** (not just MCP)? Useful for manual dev; lower priority than agent API.
3. **Column matching strictness** — default to line-only with optional column tie-break, matching Domscribe?
4. **Cache invalidation** — clear fiber scan cache on HMR / `vite:beforeUpdate` if we hook it?

---

## References

**Domscribe (cloned for analysis):**

- `packages/domscribe-relay/src/server/routes/v1/query-by-source.route.ts`
- `packages/domscribe-relay/src/mcp/tools/query-by-source.tool.ts`
- `packages/domscribe-manifest/src/reader/manifest-reader.ts` — `getEntryByPosition`
- `packages/domscribe-overlay/src/services/relay-service.ts` — WS `context:request`
- `packages/domscribe-runtime/src/core/context-capturer.ts`

**TreeLocator:**

- `docs/Treebrowser.md` — gap #1 (reverse lookup)
- `packages/runtime/src/functions/parseDataId.ts` — path/id parsing
- `packages/runtime/src/functions/sourceAwareTree.ts` — scan fallback
- `packages/runtime/src/functions/normalizeFilePath.ts` — path normalization
- `packages/runtime/src/mcpBridge.ts` — bridge command union
- `packages/mcp/src/mcpServer.ts` — MCP tool registration
