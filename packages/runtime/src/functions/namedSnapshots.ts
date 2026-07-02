/**
 * Named snapshots persisted in localStorage.
 *
 * Default workflow remains style-focused:
 * takeSnapshot(selector, id) -> change code -> getSnapshotDiff(id).
 *
 * Passing getTree-style options (maxDepth/maxNodes/includeHidden/includeText)
 * stores a source-aware tree snapshot rooted at the same selector instead.
 */

import {
  readSnapshot,
  formatSnapshotDiff,
  StyleSnapshot,
} from "./extractComputedStyles";
import {
  buildSourceAwareTree,
  type AncestryResolver,
  type SourceAwareTreeNode,
  type SourceAwareTreeOptions,
  type SourceAwareTreeResult,
} from "./sourceAwareTree";

const STORAGE_KEY_PREFIX = "treelocator:snapshot:";
const POS_THRESHOLD = 4;
const SIZE_THRESHOLD = 2;

export interface StoredStyleSnapshot {
  kind: "style";
  snapshotId: string;
  selector: string;
  index: number;
  label?: string;
  takenAt: string;
  snapshot: StyleSnapshot;
}

export interface TreeSnapshotOptions extends SourceAwareTreeOptions {
  index?: number;
  label?: string;
}

export interface TreeSnapshotNode {
  key: string;
  path: string;
  tag: string;
  role?: string;
  name?: string;
  text?: string;
  id?: string;
  classes?: string[];
  rect: SourceAwareTreeNode["rect"];
  visible: boolean;
  component?: string;
  file?: string;
  line?: number;
  children: TreeSnapshotNode[];
}

export interface StoredTreeSnapshot {
  kind: "tree";
  snapshotId: string;
  selector: string;
  index: number;
  label?: string;
  takenAt: string;
  tree: TreeSnapshotNode;
  nodeCount: number;
  truncated: boolean;
  options: SourceAwareTreeResult["options"];
}

export type StoredSnapshot = StoredStyleSnapshot | StoredTreeSnapshot;

export interface TakeSnapshotResult {
  snapshotId: string;
  selector: string;
  index: number;
  takenAt: string;
  propertyCount: number;
  boundingRect: StyleSnapshot["boundingRect"];
}

export interface TakeTreeSnapshotResult {
  kind: "tree";
  snapshotId: string;
  selector: string;
  index: number;
  takenAt: string;
  nodeCount: number;
  truncated: boolean;
  options: SourceAwareTreeResult["options"];
}

export type AnyTakeSnapshotResult = TakeSnapshotResult | TakeTreeSnapshotResult;

export interface SnapshotDiffResult {
  snapshotId: string;
  selector: string;
  index: number;
  takenAt: string;
  formatted: string;
  changes: Array<{
    type: "added" | "removed" | "changed";
    property: string;
    before?: string;
    after?: string;
  }>;
  boundingRectChanges: Array<{
    key: "x" | "y" | "width" | "height";
    before: number;
    after: number;
  }>;
}

export type TreeSnapshotDiffEntryType =
  | "added"
  | "removed"
  | "changed"
  | "moved";

export interface TreeSnapshotDiffEntry {
  type: TreeSnapshotDiffEntryType;
  key: string;
  label: string;
  before?: TreeSnapshotNode;
  after?: TreeSnapshotNode;
  changedFields?: string[];
}

export interface TreeSnapshotDiffResult {
  kind: "tree";
  snapshotId: string;
  selector: string;
  index: number;
  takenAt: string;
  formatted: string;
  counts: {
    added: number;
    removed: number;
    changed: number;
    moved: number;
  };
  entries: TreeSnapshotDiffEntry[];
  beforeNodeCount: number;
  afterNodeCount: number;
  beforeTruncated: boolean;
  afterTruncated: boolean;
  options: SourceAwareTreeResult["options"];
}

export type AnySnapshotDiffResult =
  | SnapshotDiffResult
  | TreeSnapshotDiffResult;

export class NamedSnapshotError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "NamedSnapshotError";
    this.code = code;
  }
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

function storageKey(snapshotId: string): string {
  return `${STORAGE_KEY_PREFIX}${snapshotId}`;
}

function resolveElement(
  selector: string,
  index: number
): HTMLElement | SVGElement {
  let nodes: NodeListOf<Element>;
  try {
    nodes = document.querySelectorAll(selector);
  } catch {
    throw new NamedSnapshotError(
      "invalid_selector",
      `Invalid selector: ${selector}`
    );
  }
  const node = nodes.item(index);
  if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) {
    throw new NamedSnapshotError(
      "element_not_found",
      `No element found for selector "${selector}" at index ${index}`
    );
  }
  return node;
}

function writeStored(stored: StoredSnapshot): void {
  const storage = getStorage();
  if (!storage) {
    throw new NamedSnapshotError(
      "storage_unavailable",
      "localStorage is not available in this environment"
    );
  }
  try {
    storage.setItem(storageKey(stored.snapshotId), JSON.stringify(stored));
  } catch (error) {
    throw new NamedSnapshotError(
      "storage_write_failed",
      error instanceof Error ? error.message : "Failed to write snapshot"
    );
  }
}

function readStored(snapshotId: string): StoredSnapshot {
  const storage = getStorage();
  if (!storage) {
    throw new NamedSnapshotError(
      "storage_unavailable",
      "localStorage is not available in this environment"
    );
  }
  const raw = storage.getItem(storageKey(snapshotId));
  if (!raw) {
    throw new NamedSnapshotError(
      "snapshot_not_found",
      `No snapshot stored under id "${snapshotId}"`
    );
  }
  try {
    const parsed = JSON.parse(raw) as
      | StoredSnapshot
      | Omit<StoredStyleSnapshot, "kind">;
    if (!("kind" in parsed)) {
      return { ...parsed, kind: "style" };
    }
    return parsed;
  } catch (error) {
    throw new NamedSnapshotError(
      "snapshot_corrupt",
      error instanceof Error ? error.message : "Failed to parse stored snapshot"
    );
  }
}

const TREE_OPTION_KEYS = [
  "maxDepth",
  "maxNodes",
  "includeHidden",
  "includeText",
] as const;

function hasTreeOptions(options?: TreeSnapshotOptions): boolean {
  if (!options) return false;
  return TREE_OPTION_KEYS.some((key) =>
    Object.prototype.hasOwnProperty.call(options, key)
  );
}

function getTreeOptions(
  selector: string,
  options: TreeSnapshotOptions
): SourceAwareTreeOptions {
  return {
    selector,
    maxDepth: options.maxDepth,
    maxNodes: options.maxNodes,
    includeHidden: options.includeHidden,
    includeText: options.includeText,
  };
}

function classKey(classes?: string[]): string {
  return (classes || []).slice().sort().join(".");
}

function textKey(value?: string): string {
  return value ? value.replace(/\s+/g, " ").trim() : "";
}

function sourceKey(node: SourceAwareTreeNode): string | undefined {
  if (!node.file && node.line === undefined && !node.component) {
    return undefined;
  }
  return [
    "source",
    node.file || "",
    node.line === undefined ? "" : String(node.line),
    node.component || "",
    node.tag,
  ].join(":");
}

function semanticKey(node: SourceAwareTreeNode | TreeSnapshotNode): string {
  return [
    "semantic",
    node.tag,
    node.role || "",
    node.name || "",
    node.text || "",
    classKey(node.classes),
  ].join(":");
}

function nodeCandidates(node: TreeSnapshotNode): string[] {
  const out: string[] = [];
  if (node.id) out.push(`id:${node.id}`);
  if (node.file || node.line !== undefined || node.component) {
    out.push(
      [
        "source",
        node.file || "",
        node.line === undefined ? "" : String(node.line),
        node.component || "",
        node.tag,
      ].join(":")
    );
  }
  out.push(semanticKey(node));
  out.push(`path:${node.path}:${node.tag}`);
  return out;
}

function firstCandidate(node: TreeSnapshotNode): string {
  return nodeCandidates(node)[0] || node.key;
}

function makeTreeNode(
  node: SourceAwareTreeNode,
  path: string
): TreeSnapshotNode {
  const key =
    (node.id ? `id:${node.id}` : undefined) ||
    sourceKey(node) ||
    semanticKey(node) ||
    `path:${path}:${node.tag}`;

  return {
    key,
    path,
    tag: node.tag,
    role: node.role,
    name: node.name,
    text: node.text,
    id: node.id,
    classes: node.classes,
    rect: node.rect,
    visible: node.visible,
    component: node.component,
    file: node.file,
    line: node.line,
    children: node.children.map((child, index) =>
      makeTreeNode(child, path ? `${path}.${index}` : String(index))
    ),
  };
}

function flattenTree(node: TreeSnapshotNode): TreeSnapshotNode[] {
  const out: TreeSnapshotNode[] = [];
  const visit = (item: TreeSnapshotNode) => {
    out.push(item);
    for (const child of item.children) visit(child);
  };
  visit(node);
  return out;
}

function mapUniqueCandidates(
  nodes: TreeSnapshotNode[],
  candidateIndex: number
): Map<string, TreeSnapshotNode> {
  const buckets = new Map<string, TreeSnapshotNode[]>();
  for (const node of nodes) {
    const key = nodeCandidates(node)[candidateIndex];
    if (!key) continue;
    const bucket = buckets.get(key) || [];
    bucket.push(node);
    buckets.set(key, bucket);
  }

  const unique = new Map<string, TreeSnapshotNode>();
  for (const [key, bucket] of buckets) {
    if (bucket.length === 1) {
      unique.set(key, bucket[0]!);
    }
  }
  return unique;
}

function pairTreeNodes(
  before: TreeSnapshotNode[],
  after: TreeSnapshotNode[]
): Array<{ key: string; before: TreeSnapshotNode; after: TreeSnapshotNode }> {
  const pairs: Array<{
    key: string;
    before: TreeSnapshotNode;
    after: TreeSnapshotNode;
  }> = [];
  const unmatchedBefore = new Set(before);
  const unmatchedAfter = new Set(after);

  for (let candidateIndex = 0; candidateIndex < 4; candidateIndex++) {
    const beforeUnique = mapUniqueCandidates(
      Array.from(unmatchedBefore),
      candidateIndex
    );
    const afterUnique = mapUniqueCandidates(
      Array.from(unmatchedAfter),
      candidateIndex
    );

    for (const [key, beforeNode] of beforeUnique) {
      const afterNode = afterUnique.get(key);
      if (!afterNode) continue;
      if (!unmatchedBefore.has(beforeNode) || !unmatchedAfter.has(afterNode)) {
        continue;
      }
      pairs.push({ key, before: beforeNode, after: afterNode });
      unmatchedBefore.delete(beforeNode);
      unmatchedAfter.delete(afterNode);
    }
  }

  return pairs;
}

function nodeLabel(node: TreeSnapshotNode): string {
  let label = node.tag;
  if (node.id) label += `#${node.id}`;
  if (node.classes && node.classes.length > 0) {
    label += `.${node.classes[0]}`;
  }
  if (node.name) {
    label += ` "${node.name}"`;
  } else if (node.text) {
    const text =
      node.text.length > 30 ? `${node.text.slice(0, 30)}...` : node.text;
    label += ` "${text}"`;
  }
  if (node.component) label += ` in ${node.component}`;
  return label;
}

function pushIfChanged<T>(
  fields: string[],
  field: string,
  before: T,
  after: T
): void {
  if (before !== after) fields.push(field);
}

function compareClasses(before?: string[], after?: string[]): boolean {
  return classKey(before) === classKey(after);
}

function compareTreePair(
  before: TreeSnapshotNode,
  after: TreeSnapshotNode
): string[] {
  const fields: string[] = [];

  pushIfChanged(fields, "path", before.path, after.path);
  pushIfChanged(fields, "tag", before.tag, after.tag);
  pushIfChanged(fields, "role", before.role, after.role);
  pushIfChanged(fields, "name", before.name, after.name);
  pushIfChanged(fields, "text", textKey(before.text), textKey(after.text));
  pushIfChanged(fields, "id", before.id, after.id);
  if (!compareClasses(before.classes, after.classes)) fields.push("classes");
  pushIfChanged(fields, "visible", before.visible, after.visible);
  pushIfChanged(fields, "component", before.component, after.component);
  pushIfChanged(fields, "file", before.file, after.file);
  pushIfChanged(fields, "line", before.line, after.line);

  if (Math.abs(after.rect.x - before.rect.x) >= POS_THRESHOLD) {
    fields.push("x");
  }
  if (Math.abs(after.rect.y - before.rect.y) >= POS_THRESHOLD) {
    fields.push("y");
  }
  if (Math.abs(after.rect.width - before.rect.width) >= SIZE_THRESHOLD) {
    fields.push("width");
  }
  if (Math.abs(after.rect.height - before.rect.height) >= SIZE_THRESHOLD) {
    fields.push("height");
  }

  return fields;
}

function isMoveOnly(fields: string[]): boolean {
  return (
    fields.length > 0 &&
    fields.every((field) => field === "path" || field === "x" || field === "y")
  );
}

function fieldValue(node: TreeSnapshotNode, field: string): unknown {
  if (field === "x" || field === "y" || field === "width" || field === "height") {
    return node.rect[field];
  }
  return (node as unknown as Record<string, unknown>)[field];
}

function formatTreeFieldDelta(
  field: string,
  before: TreeSnapshotNode,
  after: TreeSnapshotNode
): string {
  switch (field) {
    case "path":
      return `path ${before.path || "root"} -> ${after.path || "root"}`;
    case "x":
      return `x ${Math.round(before.rect.x)} -> ${Math.round(after.rect.x)}`;
    case "y":
      return `y ${Math.round(before.rect.y)} -> ${Math.round(after.rect.y)}`;
    case "width":
      return `w ${Math.round(before.rect.width)} -> ${Math.round(after.rect.width)}`;
    case "height":
      return `h ${Math.round(before.rect.height)} -> ${Math.round(after.rect.height)}`;
    case "classes":
      return `classes [${(before.classes || []).join(" ")}] -> [${(after.classes || []).join(" ")}]`;
    default:
      return `${field} ${String(fieldValue(before, field) ?? "")} -> ${String(fieldValue(after, field) ?? "")}`;
  }
}

function formatTreeDiff(
  stored: StoredTreeSnapshot,
  current: StoredTreeSnapshot,
  entries: TreeSnapshotDiffEntry[]
): string {
  const label = stored.label ? ` ${stored.label}` : "";
  const header = `Tree snapshot diff${label}`;
  const divider = "────────────────────────────────";

  if (entries.length === 0) {
    return `${header}\n${divider}\n(no changes)\n${divider}`;
  }

  const lines = [header, divider];
  let added = 0;
  let removed = 0;
  let changed = 0;
  let moved = 0;

  for (const entry of entries) {
    if (entry.type === "added") {
      added++;
      lines.push(`+ ${entry.label} at ${entry.after?.path || "root"}`);
    } else if (entry.type === "removed") {
      removed++;
      lines.push(`- ${entry.label} from ${entry.before?.path || "root"}`);
    } else if (entry.type === "moved") {
      moved++;
      const before = entry.before!;
      const after = entry.after!;
      const fields = (entry.changedFields || [])
        .map((field) => formatTreeFieldDelta(field, before, after))
        .join(", ");
      lines.push(`-> ${entry.label}: ${fields}`);
    } else {
      changed++;
      const before = entry.before!;
      const after = entry.after!;
      const fields = (entry.changedFields || [])
        .map((field) => formatTreeFieldDelta(field, before, after))
        .join(", ");
      lines.push(`~ ${entry.label}: ${fields}`);
    }
  }

  lines.push(divider);
  lines.push(
    `${entries.length} changes: ${added} added, ${removed} removed, ${changed} changed, ${moved} moved`
  );
  lines.push(
    `nodes: ${stored.nodeCount} -> ${current.nodeCount}${stored.truncated || current.truncated ? " (truncated)" : ""}`
  );
  return lines.join("\n");
}

function diffTreeSnapshots(
  stored: StoredTreeSnapshot,
  current: StoredTreeSnapshot
): TreeSnapshotDiffResult {
  const beforeNodes = flattenTree(stored.tree);
  const afterNodes = flattenTree(current.tree);
  const pairs = pairTreeNodes(beforeNodes, afterNodes);
  const pairedBefore = new Set(pairs.map((pair) => pair.before));
  const pairedAfter = new Set(pairs.map((pair) => pair.after));

  const entries: TreeSnapshotDiffEntry[] = [];
  const counts = { added: 0, removed: 0, changed: 0, moved: 0 };

  for (const pair of pairs) {
    const changedFields = compareTreePair(pair.before, pair.after);
    if (changedFields.length === 0) continue;

    if (isMoveOnly(changedFields)) {
      counts.moved++;
      entries.push({
        type: "moved",
        key: pair.key,
        label: nodeLabel(pair.after),
        before: pair.before,
        after: pair.after,
        changedFields,
      });
    } else {
      counts.changed++;
      entries.push({
        type: "changed",
        key: pair.key,
        label: nodeLabel(pair.after),
        before: pair.before,
        after: pair.after,
        changedFields,
      });
    }
  }

  for (const node of afterNodes) {
    if (pairedAfter.has(node)) continue;
    counts.added++;
    entries.push({
      type: "added",
      key: firstCandidate(node),
      label: nodeLabel(node),
      after: node,
    });
  }

  for (const node of beforeNodes) {
    if (pairedBefore.has(node)) continue;
    counts.removed++;
    entries.push({
      type: "removed",
      key: firstCandidate(node),
      label: nodeLabel(node),
      before: node,
    });
  }

  return {
    kind: "tree",
    snapshotId: stored.snapshotId,
    selector: stored.selector,
    index: stored.index,
    takenAt: stored.takenAt,
    formatted: formatTreeDiff(stored, current, entries),
    counts,
    entries,
    beforeNodeCount: stored.nodeCount,
    afterNodeCount: current.nodeCount,
    beforeTruncated: stored.truncated,
    afterTruncated: current.truncated,
    options: stored.options,
  };
}

async function buildStoredTreeSnapshot(
  selector: string,
  snapshotId: string,
  options: TreeSnapshotOptions,
  resolveAncestry: AncestryResolver
): Promise<StoredTreeSnapshot> {
  const index = options.index ?? 0;
  const root = resolveElement(selector, index);
  const treeOptions = getTreeOptions(selector, options);
  const result = await buildSourceAwareTree(root, treeOptions, resolveAncestry);
  if (!result) {
    throw new NamedSnapshotError(
      "tree_snapshot_failed",
      `Failed to build tree snapshot for selector "${selector}"`
    );
  }

  return {
    kind: "tree",
    snapshotId,
    selector,
    index,
    label: options.label,
    takenAt: new Date().toISOString(),
    tree: makeTreeNode(result.root, ""),
    nodeCount: result.nodeCount,
    truncated: result.truncated,
    options: result.options,
  };
}

export function takeNamedSnapshot(
  selector: string,
  snapshotId: string,
  options?: { index?: number; label?: string }
): TakeSnapshotResult;
export function takeNamedSnapshot(
  selector: string,
  snapshotId: string,
  options: TreeSnapshotOptions,
  resolveAncestry: AncestryResolver
): Promise<TakeTreeSnapshotResult>;
export function takeNamedSnapshot(
  selector: string,
  snapshotId: string,
  options: TreeSnapshotOptions = {},
  resolveAncestry?: AncestryResolver
): AnyTakeSnapshotResult | Promise<TakeTreeSnapshotResult> {
  if (!selector) {
    throw new NamedSnapshotError("invalid_args", "selector is required");
  }
  if (!snapshotId) {
    throw new NamedSnapshotError("invalid_args", "snapshotId is required");
  }

  if (hasTreeOptions(options)) {
    if (!resolveAncestry) {
      throw new NamedSnapshotError(
        "tree_resolver_required",
        "Tree snapshots require an ancestry resolver"
      );
    }
    return buildStoredTreeSnapshot(
      selector,
      snapshotId,
      options,
      resolveAncestry
    ).then((stored) => {
      writeStored(stored);
      return {
        kind: "tree",
        snapshotId,
        selector,
        index: stored.index,
        takenAt: stored.takenAt,
        nodeCount: stored.nodeCount,
        truncated: stored.truncated,
        options: stored.options,
      };
    });
  }

  const index = options.index ?? 0;
  const element = resolveElement(selector, index);
  const snapshot = readSnapshot(element);
  const takenAt = new Date().toISOString();

  const stored: StoredSnapshot = {
    kind: "style",
    snapshotId,
    selector,
    index,
    label: options.label,
    takenAt,
    snapshot,
  };
  writeStored(stored);

  return {
    snapshotId,
    selector,
    index,
    takenAt,
    propertyCount: Object.keys(snapshot.properties).length,
    boundingRect: snapshot.boundingRect,
  };
}

export function getNamedSnapshotDiff(snapshotId: string): SnapshotDiffResult;
export function getNamedSnapshotDiff(
  snapshotId: string,
  resolveAncestry: AncestryResolver
): SnapshotDiffResult | Promise<TreeSnapshotDiffResult>;
export function getNamedSnapshotDiff(
  snapshotId: string,
  resolveAncestry?: AncestryResolver
): AnySnapshotDiffResult | Promise<TreeSnapshotDiffResult> {
  if (!snapshotId) {
    throw new NamedSnapshotError("invalid_args", "snapshotId is required");
  }

  const stored = readStored(snapshotId);

  if (stored.kind === "tree") {
    if (!resolveAncestry) {
      throw new NamedSnapshotError(
        "tree_resolver_required",
        "Tree snapshot diffs require an ancestry resolver"
      );
    }
    return buildStoredTreeSnapshot(
      stored.selector,
      stored.snapshotId,
      { ...stored.options, index: stored.index, label: stored.label },
      resolveAncestry
    ).then((current) => diffTreeSnapshots(stored, current));
  }

  const element = resolveElement(stored.selector, stored.index);
  const current = readSnapshot(element);

  const changes: SnapshotDiffResult["changes"] = [];
  const allProps = new Set([
    ...Object.keys(stored.snapshot.properties),
    ...Object.keys(current.properties),
  ]);
  for (const prop of allProps) {
    const before = stored.snapshot.properties[prop] || "";
    const after = current.properties[prop] || "";
    if (before === after) continue;
    if (!before) {
      changes.push({ type: "added", property: prop, after });
    } else if (!after) {
      changes.push({ type: "removed", property: prop, before });
    } else {
      changes.push({ type: "changed", property: prop, before, after });
    }
  }

  const boundingRectChanges: SnapshotDiffResult["boundingRectChanges"] = [];
  const rectKeys = ["x", "y", "width", "height"] as const;
  for (const key of rectKeys) {
    const b = stored.snapshot.boundingRect[key];
    const a = current.boundingRect[key];
    if (b !== a) {
      boundingRectChanges.push({ key, before: b, after: a });
    }
  }

  return {
    snapshotId,
    selector: stored.selector,
    index: stored.index,
    takenAt: stored.takenAt,
    formatted: formatSnapshotDiff(stored.snapshot, current, stored.label),
    changes,
    boundingRectChanges,
  };
}

export function clearNamedSnapshot(snapshotId: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey(snapshotId));
  } catch {
    // Swallow — same rationale as getStorage fallbacks.
  }
}
