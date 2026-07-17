/**
 * Source → DOM reverse lookup.
 *
 * The forward direction (`getPath`) walks a rendered element back to its
 * source location. This is the inverse: given a `file:line`, find the live
 * DOM element(s) rendered from that source, with ancestry and optional styles.
 *
 * Matching reuses the runtime's canonical element→source readers so the two
 * directions agree: if `getPath` reports element X at `file:line`, then
 * `queryBySource(file, line)` finds X. Strategies run cheapest-first:
 *
 *   A. path-format attrs  — `[data-locatorjs="/file.tsx:line:col"]` parsed directly
 *   B. id-format attrs    — `[data-locatorjs-id="path::idx"]` resolved via __LOCATOR_DATA__
 *   C/D. framework scan   — `createTreeNode(el).getSource()` for the remaining DOM
 *      (React fiber `_debugSource`, Svelte `__svelte_meta`, Vue `__vueParentComponent`)
 *   F. server-component   — Phoenix HEEx comments + Next.js RSC attrs on element/ancestors
 *   E. tree-scan          — filter `buildSourceAwareTree` nodes by file:line (fallback)
 */

import { createTreeNode } from "../adapters/createTreeNode";
import { detectFramework } from "../adapters/detectFramework";
import { parseNextjsServerComponents } from "../adapters/nextjs/parseNextjsDataAttributes";
import { parsePhoenixServerComponents } from "../adapters/phoenix/parsePhoenixComments";
import { getDataForDataId } from "../adapters/jsx/runtimeStore";
import type { ServerComponentInfo } from "../types/ServerComponentInfo";
import {
  inspectCSSRules,
  formatCSSInspection,
} from "./cssRuleInspector";
import {
  extractComputedStyles,
  type ComputedStylesResult,
} from "./extractComputedStyles";
import {
  collectAncestry,
  formatAncestryChain,
  getElementLabel,
  type AncestryItem,
} from "./formatAncestryChain";
import { normalizeFilePath } from "./normalizeFilePath";
import { parseDataPath } from "./parseDataId";
import { buildSelector } from "./buildSelector";
import {
  buildSourceAwareTree,
  type AncestryResolver,
  type SourceAwareTreeNode,
} from "./sourceAwareTree";

export interface QueryBySourceOptions {
  file: string;
  line: number;
  column?: number;
  /** Lines of slack when the agent's cursor isn't on the exact opening tag. Default 0. */
  tolerance?: number;
  /** Include elements that are display:none / visibility:hidden. Default false. */
  includeHidden?: boolean;
  /** Run getStyles() for each match. Default false. */
  includeStyles?: boolean;
  /** Run getCSSReport() for each match (heavier). Default false. */
  includeCssReport?: boolean;
  /** Cap on returned matches; extras set `truncated`. Default 10. */
  maxMatches?: number;
}

export type MatchStrategy =
  | "path-attr"
  | "locator-data"
  | "fiber"
  | "svelte-meta"
  | "vue-meta"
  | "server-component"
  | "tree-scan";

export type MatchConfidence = "high" | "medium" | "low";

export interface SourceMatch {
  /** Round-trip stable selector; pass to get_path / click / take_snapshot. */
  selector: string;
  tagName: string;
  rect: { x: number; y: number; width: number; height: number };
  path: string | null;
  ancestry: AncestryItem[] | null;
  styles?: ComputedStylesResult;
  cssReport?: string;
  confidence: MatchConfidence;
  matchStrategy: MatchStrategy;
}

export interface QueryBySourceResult {
  found: boolean;
  /** At least one match selector resolves to a connected DOM node. */
  rendered: boolean;
  /** Always true when called in-browser; MCP sets false when no tab is connected. */
  browserConnected: boolean;
  normalizedFile: string;
  query: { file: string; line: number; column?: number; tolerance: number };
  matches: SourceMatch[];
  truncated: boolean;
}

interface SourceQuery {
  normalizedFile: string;
  line: number;
  column?: number;
  tolerance: number;
}

/**
 * Pure (DOM-free) check: does `candidate` resolve to the queried source?
 *
 * `mode: "file-only"` is used for Vue, which exposes `__file` but no line
 * (line is always 1 — see vueAdapter.ts), so only the file can be matched.
 * Column is intentionally not enforced: we return all matches within the
 * tolerance band rather than picking a single closest entry.
 */
export function matchSourceLocation(
  query: SourceQuery,
  candidate: { filePath: string; line: number; column?: number },
  mode: "line" | "file-only"
): boolean {
  if (normalizeFilePath(candidate.filePath) !== query.normalizedFile) {
    return false;
  }
  if (mode === "file-only") {
    return true;
  }
  return Math.abs(candidate.line - query.line) <= query.tolerance;
}

export function confidenceForStrategy(strategy: MatchStrategy): MatchConfidence {
  switch (strategy) {
    case "path-attr":
    case "locator-data":
    case "svelte-meta":
      return "high";
    case "fiber":
    case "vue-meta":
    case "server-component":
      return "medium";
    case "tree-scan":
      return "low";
  }
}

function* eachHTMLElement(list: NodeListOf<Element>): Generator<HTMLElement> {
  for (const node of Array.from(list)) {
    if (node instanceof HTMLElement) {
      yield node;
    }
  }
}

function isVisible(element: HTMLElement): boolean {
  if (!element.isConnected) return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function strategyForFramework(
  framework: ReturnType<typeof detectFramework>
): MatchStrategy {
  switch (framework) {
    case "svelte":
      return "svelte-meta";
    case "vue":
      return "vue-meta";
    default:
      return "fiber";
  }
}

function buildMatch(
  element: HTMLElement,
  strategy: MatchStrategy,
  options: QueryBySourceOptions,
  adapterId?: string
): SourceMatch {
  const treeNode = createTreeNode(element, adapterId);
  const ancestry = treeNode ? collectAncestry(treeNode) : null;
  const rect = element.getBoundingClientRect();

  const match: SourceMatch = {
    selector: buildSelector(element),
    tagName: element.tagName.toLowerCase(),
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    path: ancestry ? formatAncestryChain(ancestry) : null,
    ancestry,
    confidence: confidenceForStrategy(strategy),
    matchStrategy: strategy,
  };

  if (options.includeStyles) {
    const label = ancestry ? getElementLabel(ancestry) : undefined;
    match.styles = extractComputedStyles(element, label, undefined);
  }
  if (options.includeCssReport) {
    match.cssReport = formatCSSInspection(inspectCSSRules(element));
  }

  return match;
}

/** Collect Phoenix + Next.js server-component attribution on element and ancestors. */
function collectServerComponents(element: Element): ServerComponentInfo[] {
  const seen = new Set<string>();
  const results: ServerComponentInfo[] = [];

  const add = (items: ServerComponentInfo[] | null | undefined) => {
    if (!items) return;
    for (const item of items) {
      const key = `${item.filePath}:${item.line}:${item.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(item);
    }
  };

  let current: Element | null = element;
  while (current) {
    add(parsePhoenixServerComponents(current));
    add(parseNextjsServerComponents(current));
    current = current.parentElement;
  }

  const treeNode =
    element instanceof HTMLElement ? createTreeNode(element) : null;
  if (treeNode) {
    for (const item of collectAncestry(treeNode)) {
      add(item.serverComponents);
    }
  }

  return results;
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/([^\w-])/g, "\\$1");
}

function selectorForTreeNode(node: SourceAwareTreeNode): string | null {
  const parts: string[] = [node.tag];
  if (node.id) parts.push(`#${cssEscape(node.id)}`);
  if (node.classes && node.classes.length > 0) {
    for (const cls of node.classes) {
      parts.push(`.${cssEscape(cls)}`);
    }
  }
  return parts.join("");
}

function rectDelta(
  a: DOMRect,
  b: { x: number; y: number; width: number; height: number }
): number {
  return (
    Math.abs(a.x - b.x) +
    Math.abs(a.y - b.y) +
    Math.abs(a.width - b.width) +
    Math.abs(a.height - b.height)
  );
}

function snapTreeNodeToElement(node: SourceAwareTreeNode): HTMLElement | null {
  const sel = selectorForTreeNode(node);
  if (!sel) return null;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(sel));
  if (candidates.length === 1) return candidates[0]!;
  if (candidates.length > 1) {
    let best = candidates[0]!;
    let bestDelta = rectDelta(best.getBoundingClientRect(), node.rect);
    for (let i = 1; i < candidates.length; i++) {
      const d = rectDelta(candidates[i]!.getBoundingClientRect(), node.rect);
      if (d < bestDelta) {
        best = candidates[i]!;
        bestDelta = d;
      }
    }
    return best;
  }
  return null;
}

function* walkTreeNodes(
  root: SourceAwareTreeNode
): Generator<SourceAwareTreeNode> {
  yield root;
  for (const child of root.children) yield* walkTreeNodes(child);
}

function isMatchRendered(matches: SourceMatch[]): boolean {
  return matches.some((match) => {
    const el = document.querySelector(match.selector);
    return el instanceof HTMLElement && el.isConnected;
  });
}

async function strategyTreeScan(
  query: SourceQuery,
  matched: Map<HTMLElement, MatchStrategy>,
  resolveAncestry: AncestryResolver,
  includeHidden: boolean,
  maxMatches: number
): Promise<void> {
  const tree = await buildSourceAwareTree(
    document.body,
    { includeHidden },
    resolveAncestry
  );
  if (!tree) return;

  for (const node of walkTreeNodes(tree.root)) {
    if (matched.size >= maxMatches) break;
    if (!node.file || node.line === undefined) continue;
    if (
      !matchSourceLocation(
        query,
        { filePath: node.file, line: node.line },
        "line"
      )
    ) {
      continue;
    }

    const element = snapTreeNodeToElement(node);
    if (element && !matched.has(element)) {
      matched.set(element, "tree-scan");
    }
  }
}

/**
 * Resolve a source location to its live DOM element(s).
 *
 * The full-DOM scan (strategy C/D/F) runs `createTreeNode` + `getSource` on
 * every element, so this is O(DOM) and meant for on-demand agent calls, not
 * per-keystroke. It is skipped entirely for elements already matched by the
 * cheaper attribute strategies.
 */
export async function queryBySource(
  options: QueryBySourceOptions,
  adapterId?: string,
  resolveAncestry?: AncestryResolver
): Promise<QueryBySourceResult> {
  const normalizedFile = normalizeFilePath(options.file);
  const tolerance = options.tolerance ?? 0;
  const maxMatches = options.maxMatches ?? 10;
  const includeHidden = options.includeHidden ?? false;

  const query: SourceQuery = {
    normalizedFile,
    line: options.line,
    column: options.column,
    tolerance,
  };

  // First match wins per element; ordering is cheapest/most-exact first.
  const matched = new Map<HTMLElement, MatchStrategy>();

  // Strategy A: path-format attrs carry file:line:column directly on the element.
  for (const element of eachHTMLElement(
    document.querySelectorAll("[data-locatorjs]")
  )) {
    const attr = element.getAttribute("data-locatorjs");
    if (!attr) continue;
    const parsed = parseDataPath(attr);
    if (!parsed) continue;
    const [fileFullPath, line, column] = parsed;
    if (
      matchSourceLocation(
        query,
        { filePath: fileFullPath, line, column },
        "line"
      )
    ) {
      matched.set(element, "path-attr");
    }
  }

  // Strategy B: id-format attrs resolve to a line via __LOCATOR_DATA__.
  for (const element of eachHTMLElement(
    document.querySelectorAll("[data-locatorjs-id]")
  )) {
    if (matched.has(element)) continue;
    const attr = element.getAttribute("data-locatorjs-id");
    if (!attr) continue;
    const data = getDataForDataId(attr);
    if (!data?.link) continue;
    if (
      matchSourceLocation(
        query,
        { filePath: data.link.filePath, line: data.link.line, column: data.link.column },
        "line"
      )
    ) {
      matched.set(element, "locator-data");
    }
  }

  // Strategy C/D: unified element→source via the framework adapters.
  for (const element of eachHTMLElement(document.querySelectorAll("*"))) {
    if (matched.has(element)) continue;
    if (!includeHidden && !isVisible(element)) continue;

    const treeNode = createTreeNode(element, adapterId);
    const source = treeNode?.getSource();
    if (!source) continue;

    const framework = detectFramework(element);
    const mode: "line" | "file-only" = framework === "vue" ? "file-only" : "line";
    if (
      matchSourceLocation(
        query,
        { filePath: source.fileName, line: source.lineNumber, column: source.columnNumber },
        mode
      )
    ) {
      matched.set(element, strategyForFramework(framework));
    }
  }

  // Strategy F: Phoenix HEEx comments + Next.js RSC attrs on element/ancestors.
  for (const element of eachHTMLElement(document.querySelectorAll("*"))) {
    if (matched.has(element)) continue;
    if (!includeHidden && !isVisible(element)) continue;

    for (const sc of collectServerComponents(element)) {
      if (
        matchSourceLocation(
          query,
          { filePath: sc.filePath, line: sc.line },
          "line"
        )
      ) {
        matched.set(element, "server-component");
        break;
      }
    }
  }

  // Strategy E: source-aware tree scan (broad fallback when resolveAncestry provided).
  if (resolveAncestry && matched.size < maxMatches) {
    await strategyTreeScan(
      query,
      matched,
      resolveAncestry,
      includeHidden,
      maxMatches
    );
  }

  const truncated = matched.size > maxMatches;
  const matches = Array.from(matched.entries())
    .slice(0, maxMatches)
    .map(([element, strategy]) =>
      buildMatch(element, strategy, options, adapterId)
    );

  return {
    found: matches.length > 0,
    rendered: isMatchRendered(matches),
    browserConnected: true,
    normalizedFile,
    query: {
      file: options.file,
      line: options.line,
      column: options.column,
      tolerance,
    },
    matches,
    truncated,
  };
}
