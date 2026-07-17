/**
 * Component-name / file → live DOM reverse lookup.
 *
 * `queryBySource` answers "which elements did this file:line produce?"; this
 * answers "where does the component named X live?" and "which elements did
 * this file produce?" Both are the kind of question an agent asks before
 * editing — and both consume the same ancestry index built for the forward
 * direction.
 *
 * Strategy: walk the source-aware tree produced by `buildSourceAwareTree`,
 * which already resolves ancestry per node. Filter by `component` (when
 * supplied) or by `file` (when only file is supplied). For each match,
 * synthesize a CSS selector from the node's tag / id / classes, then snap
 * it to the live DOM. Multi-match nodes (loops) are returned as separate
 * results, mirroring `queryBySource`.
 *
 * Per-match selectors are best-effort — the source-aware tree doesn't carry
 * element identity, so we can't reuse `buildSelector` (which round-trips via
 * querySelector). Instead we build a short tag#id.class selector and prefer
 * the closest match by `getBoundingClientRect` coordinates. Confidence is
 * `low` to reflect this — a precise `queryBySource` is the recommended
 * follow-up call.
 */

import { collectAncestry, formatAncestryChain, type AncestryItem } from "./formatAncestryChain";
import { normalizeFilePath } from "./normalizeFilePath";
import { buildSelector } from "./buildSelector";
import { createTreeNode } from "../adapters/createTreeNode";
import type { SourceAwareTreeResult } from "./sourceAwareTree";

export interface FindBySourceOptions {
  /** Component name to look for (matches against `component` and `ownerComponents`). */
  component?: string;
  /** File path to look for (matches against `file`). When set without `component`, returns every node in that file. */
  file?: string;
  /** Include display:none / visibility:hidden nodes. Default true (find_source is exhaustive). */
  includeHidden?: boolean;
  /** Cap on returned matches; extras set `truncated`. Default 25. */
  maxMatches?: number;
}

export interface FindBySourceMatch {
  component: string;
  file: string;
  line: number;
  column?: number;
  selector: string;
  rect: { x: number; y: number; width: number; height: number };
  path: string | null;
  ancestry: AncestryItem[] | null;
  confidence: "low";
}

export interface FindBySourceResult {
  found: boolean;
  matches: FindBySourceMatch[];
  truncated: boolean;
}

export interface SourceAwareTreeNode {
  tag: string;
  id?: string;
  classes?: string[];
  component?: string;
  file?: string;
  line?: number;
  rect: { x: number; y: number; width: number; height: number };
  ancestry: AncestryItem[];
  children: SourceAwareTreeNode[];
}

/**
 * Build a tag#id.class selector for a source-aware tree node. Returns null
 * if the node has no class/id information that would distinguish it.
 */
function selectorForNode(node: SourceAwareTreeNode): string | null {
  const parts: string[] = [node.tag];
  if (node.id) parts.push(`#${cssEscape(node.id)}`);
  if (node.classes && node.classes.length > 0) {
    for (const cls of node.classes) {
      parts.push(`.${cssEscape(cls)}`);
    }
  }
  return parts.join("");
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/([^\w-])/g, "\\$1");
}

function nodeMatches(
  node: SourceAwareTreeNode,
  component: string | undefined,
  normalizedFile: string | undefined
): boolean {
  if (normalizedFile) {
    // A file filter must exclude nodes that lack a file or whose file differs —
    // otherwise a component-less node in another file would slip through.
    if (!node.file || normalizeFilePath(node.file) !== normalizedFile) {
      return false;
    }
  }
  if (component) {
    if (node.component === component) return true;
    // Walk owner components in ancestry[0].ownerComponents
    const top = node.ancestry[0];
    if (top?.ownerComponents) {
      return top.ownerComponents.some((c) => c.name === component);
    }
    return false;
  }
  // File-only filter and component empty: any node with a file/component
  // counts (caller probably wants the page's source-attributed nodes).
  return Boolean(node.file || node.component);
}

function* walkNodes(
  root: SourceAwareTreeNode
): Generator<SourceAwareTreeNode> {
  yield root;
  for (const child of root.children) yield* walkNodes(child);
}

function pickLiveElement(
  node: SourceAwareTreeNode,
  component: string | undefined
): HTMLElement | null {
  // Prefer element-shape via getElementsBy* / querySelector — fall back to
  // the closest bounding rect match when the selector resolves to many.
  const sel = selectorForNode(node);
  if (sel) {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(sel)
    );
    if (candidates.length === 1) return candidates[0]!;
    if (candidates.length > 1) {
      return closestByRect(candidates, node.rect);
    }
  }
  // Last resort: scan document.body descendants for the same rect.
  if (component === undefined) {
    return null; // can't reliably snap without a selector
  }
  return null;
}

function closestByRect(
  candidates: HTMLElement[],
  rect: { x: number; y: number; width: number; height: number }
): HTMLElement {
  let best = candidates[0]!;
  let bestDelta = rectDelta(best.getBoundingClientRect(), rect);
  for (let i = 1; i < candidates.length; i++) {
    const d = rectDelta(candidates[i]!.getBoundingClientRect(), rect);
    if (d < bestDelta) {
      best = candidates[i]!;
      bestDelta = d;
    }
  }
  return best;
}

function rectDelta(a: DOMRect, b: { x: number; y: number; width: number; height: number }): number {
  return (
    Math.abs(a.x - b.x) +
    Math.abs(a.y - b.y) +
    Math.abs(a.width - b.width) +
    Math.abs(a.height - b.height)
  );
}

/**
 * Filter a source-aware tree by component name and/or file. Uses a thin
 * walker — no need to build a full tree when we only need matches.
 *
 * The caller passes a pre-built `SourceAwareTreeResult` (typically from
 * `buildSourceAwareTree(document.body, …, resolveAncestry)` in production).
 * Tests can supply a deterministic tree directly.
 */
export async function findBySource(
  options: FindBySourceOptions,
  tree: SourceAwareTreeResult | null
): Promise<FindBySourceResult> {
  const maxMatches = options.maxMatches ?? 25;
  const component = options.component?.trim() || undefined;
  const normalizedFile = options.file
    ? normalizeFilePath(options.file)
    : undefined;

  if (!tree) {
    return { found: false, matches: [], truncated: false };
  }

  const matches: FindBySourceMatch[] = [];
  let truncated = false;

  for (const node of walkNodes(tree.root)) {
    if (!nodeMatches(node, component, normalizedFile)) continue;
    // Only flag truncation when an *actual match* exceeds the cap — checking
    // the cap before the filter would report truncation for non-matching
    // trailing nodes that would never have been returned.
    if (matches.length >= maxMatches) {
      truncated = true;
      break;
    }

    const element = pickLiveElement(node, component);
    // Even without a live element, we can still emit a path-only match —
    // useful when an element is hidden / ephemeral but the user wants to
    // know it exists.
    const path = element
      ? formatAncestryChain(collectAncestryFromElement(element))
      : null;
    const ancestry = element
      ? collectAncestryFromElement(element)
      : null;
    const selector = element ? buildSelector(element) : selectorForNode(node);

    matches.push({
      component: node.component ?? component ?? "",
      file: node.file ?? "",
      line: node.line ?? 0,
      selector: selector ?? "",
      rect: node.rect,
      path,
      ancestry,
      confidence: "low",
    });
  }

  return { found: matches.length > 0, matches, truncated };
}

/**
 * Mirror the forward direction's ancestry builder so the reverse-direction
 * path returned for each match agrees with what `getPath` would report.
 */
function collectAncestryFromElement(element: HTMLElement): AncestryItem[] {
  const treeNode = createTreeNode(element);
  return treeNode ? collectAncestry(treeNode) : [];
}