# Treebrowser — Gaps & Missing Parts

> Working design note for evolving TreeLocatorJS from an alt-click devtool into **treebrowser**: the semantic layer AI coding agents call to reason about a running frontend.

This document catalogs what is **missing** relative to the current field (Cursor Browser, Codex in-app browser, Chrome DevTools MCP, Playwright MCP) and where TreeLocatorJS is already ahead. It is a gap analysis, not an implementation spec. For the shipped MCP surface, see [MCP.md](./MCP.md); for the underlying page API, see [BROWSER-API.md](./BROWSER-API.md).

## Premise

Coding agents are weak at frontend for one structural reason: they cannot see what their code renders, and cannot map a rendered element back to the line that produced it. Source code and the rendered DOM are two different topologies — a `Button` can sit five abstractions deep from where you'd go looking. Every frontend edit therefore starts with a *blind search*, burning thousands of tokens before a line changes.

The tools that win give the agent a cheap, **deterministic, semantic** map instead of pixels. Structured text beats vision on cost (≈10x fewer tokens) and reliability. TreeLocatorJS already produces exactly that primitive — a deterministic DOM→source ancestry chain across six frameworks. The gap is not the primitive; it is the surrounding toolset and its distribution.

## What already exists

The `@treelocator/mcp` package (v0.6.0) ships a stdio MCP server + local WSS broker with **17 tools**. These are done and should not be rebuilt:

| Area | Tools | Notes |
|------|-------|-------|
| Session | `treelocator_list_sessions`, `treelocator_connect_session` | Multi-tab session routing |
| Source mapping | `treelocator_get_path`, `treelocator_get_ancestry`, `treelocator_get_path_data`, `treelocator_get_tree` | **The moat** — deterministic, multi-framework |
| CSS | `treelocator_get_styles`, `treelocator_get_css_rules`, `treelocator_get_css_report` | Includes specificity/conflict reporting |
| Snapshot / verify | `treelocator_take_snapshot`, `treelocator_get_snapshot_diff`, `treelocator_clear_snapshot` | Style-level, survives reload |
| Interaction | `treelocator_click`, `treelocator_hover`, `treelocator_type` | |
| Page | `treelocator_execute_js`, `treelocator_get_console` | Console is page-wide |

Corresponding browser-side commands live in `packages/runtime/src/mcpBridge.ts` (`BridgeCommandName` union) and `packages/runtime/src/browserApi.ts`.

## Gaps & missing parts

Ordered by leverage. Each item names the gap, why it matters, and a proposed tool shape.

### 1. Reverse direction: source → live DOM

Today the map runs one way (element → source). There is no way for an agent to go from a component name or file location to the live nodes it produced. This is what eliminates the "blind filesystem search" — and the index needed to do it is already built for the forward direction.

Missing tools:

- `treelocator_find_source(componentName)` → `[{ file, line, column }]` — name → source locations.
- `treelocator_highlight_source(file, line)` → `[{ selector, rect, path }]` — source location → the live DOM nodes it renders. Lets an agent confirm *which* rendered elements a file owns before editing.

### 2. Component-attributed runtime signals

`get_console` is page-wide; there is no network capture at all, and nothing is attributed to the owning component. Raw logs are far less actionable than "this 500 fired from `<CheckoutForm>` at `Checkout.tsx:44`." This is the ancestry map applied to *behavior* instead of *structure*.

Missing tools:

- `treelocator_get_network()` → requests with method/status/timing, each tagged with the initiating component where resolvable.
- `treelocator_get_console` (extend) → attach the owning component + source location to each entry.
- `treelocator_get_renders(selector?)` → re-render / commit counts per component (React commit hook, Solid/Vue equivalents) to surface churn and wasted renders.

### 3. Source-aware page tree

The first slice now exists as `treelocator_get_tree`: a bounded source-aware page tree with semantic labels, bounds, component/source attribution, ancestry, and children. This is intentionally not a full Playwright-style accessibility tree; it is the agent-oriented page overview that TreeLocator can make source-aware.

Remaining gap:

- Keep improving `treelocator_get_tree(selector?)` toward a richer source-annotated semantic tree where every useful node carries `{ role, name, component, file, line }`.

### 4. Verification loop beyond styles

`get_snapshot_diff` diffs computed styles only. It cannot answer semantic questions like "did the button become the primary variant" or "did props/state change as intended." The primitive exists; it needs to extend past CSS.

Missing capability:

- Extend snapshot/diff to capture the **component subtree, props, and resolved state**, not just computed styles, so an agent can verify that an intended *semantic* change landed after HMR.

### 5. Confidence & graceful degradation

Every DOM→source tool degrades on heavily-wrapped design-system components. Emitting a wrong `file:line` is worse than admitting uncertainty.

Missing capability:

- Add a `confidence` field (and the abstraction depth / wrapper chain) to source-mapping results so agents can fall back rather than trust a bad guess.

### 6. Visual grounding (low priority)

No screenshot / pixel capture exists. Kept intentionally low priority: vision is the expensive, less-deterministic fallback that the structured-text approach is meant to avoid. Add only as an explicit fallback for canvas/SVG/custom-drawn UIs.

## Distribution gap (non-code)

The single most differentiating asset — the MCP — is effectively invisible. It is not featured at the top of the README and, until recently, was absent from `CLAUDE.md`'s package and publishing sections. The forward work here is positioning, not engineering: publish `@treelocator/mcp`, lead with "the MCP that maps any rendered element to its component source across 6 frameworks," and make it the headline product rather than a footnote to alt-click.

## Suggested sequencing

1. **Reposition + publish the MCP** (distribution; highest ROI, no new code).
2. **Reverse lookup** — `find_source` + `highlight_source` (inverts an existing index).
3. **Component-attributed signals** — network + component-tagged console.
4. **Improve source-aware page tree** — iterate on `get_tree`.
5. **Semantic verification** — extend snapshot/diff beyond styles.
6. **Confidence metadata**, then optional **visual fallback**.

## Non-goals / positioning

Do **not** try to out-breadth Chrome DevTools MCP (Lighthouse, performance traces, device emulation, full input automation). Treebrowser wins as the **component-semantic layer** that plugs *into* agents and other browser MCPs: they give agents eyes and hands on the rendered page; treebrowser gives them the deterministic map from the page back to the component graph and source — the part everyone else currently guesses at.

## References

- [MCP.md](./MCP.md) — shipped MCP architecture, tools, TLS, proxy mode
- [BROWSER-API.md](./BROWSER-API.md) — underlying `window.__treelocator__` API
- [PLAYWRIGHT-AND-AUTOMATION.md](./PLAYWRIGHT-AND-AUTOMATION.md) — automation & injection
- `packages/mcp/src/toolSchemas.ts` — current tool definitions
- `packages/runtime/src/mcpBridge.ts` — `BridgeCommandName` union of supported commands
