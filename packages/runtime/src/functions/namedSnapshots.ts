/**
 * Named element snapshots persisted in localStorage.
 *
 * Workflow: takeSnapshot(selector, id) → change code → getSnapshotDiff(id).
 * Stored snapshots are immutable — getSnapshotDiff never overwrites the
 * baseline, so iterating on a fix always diffs against the original state.
 */

import {
  readSnapshot,
  formatSnapshotDiff,
  StyleSnapshot,
} from "./extractComputedStyles";

const STORAGE_KEY_PREFIX = "treelocator:snapshot:";

export interface StoredSnapshot {
  snapshotId: string;
  selector: string;
  index: number;
  label?: string;
  takenAt: string;
  snapshot: StyleSnapshot;
}

export interface TakeSnapshotResult {
  snapshotId: string;
  selector: string;
  index: number;
  takenAt: string;
  propertyCount: number;
  boundingRect: StyleSnapshot["boundingRect"];
}

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

function resolveElement(selector: string, index: number): HTMLElement {
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
  return node as HTMLElement;
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
    return JSON.parse(raw) as StoredSnapshot;
  } catch (error) {
    throw new NamedSnapshotError(
      "snapshot_corrupt",
      error instanceof Error ? error.message : "Failed to parse stored snapshot"
    );
  }
}

export function takeNamedSnapshot(
  selector: string,
  snapshotId: string,
  options: { index?: number; label?: string } = {}
): TakeSnapshotResult {
  if (!selector) {
    throw new NamedSnapshotError("invalid_args", "selector is required");
  }
  if (!snapshotId) {
    throw new NamedSnapshotError("invalid_args", "snapshotId is required");
  }

  const index = options.index ?? 0;
  const element = resolveElement(selector, index);
  const snapshot = readSnapshot(element);
  const takenAt = new Date().toISOString();

  const stored: StoredSnapshot = {
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

export function getNamedSnapshotDiff(snapshotId: string): SnapshotDiffResult {
  if (!snapshotId) {
    throw new NamedSnapshotError("invalid_args", "snapshotId is required");
  }

  const stored = readStored(snapshotId);
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
