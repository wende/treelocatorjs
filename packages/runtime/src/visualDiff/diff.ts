import type { DeltaEntry, DeltaReport, ElementSnapshot } from "./types";

export const POS_THRESHOLD = 4;
export const SIZE_THRESHOLD = 2;
export const OPACITY_THRESHOLD = 0.05;

function arrayEq(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  for (const v of a) if (!set.has(v)) return false;
  return true;
}

function labelFor(snap: ElementSnapshot): string {
  let label = snap.tagName;
  if (snap.id) label += "#" + snap.id;
  if (snap.classes.length > 0) label += "." + snap.classes[0];
  if (snap.text) {
    const t = snap.text.length > 30 ? snap.text.slice(0, 30) + "…" : snap.text;
    label += ` "${t}"`;
  }
  return label;
}

function comparePair(
  before: ElementSnapshot,
  after: ElementSnapshot
): { changed: string[] } {
  const changed: string[] = [];

  if (Math.abs(after.x - before.x) >= POS_THRESHOLD) changed.push("x");
  if (Math.abs(after.y - before.y) >= POS_THRESHOLD) changed.push("y");
  if (Math.abs(after.width - before.width) >= SIZE_THRESHOLD) {
    changed.push("width");
  }
  if (Math.abs(after.height - before.height) >= SIZE_THRESHOLD) {
    changed.push("height");
  }
  if (Math.abs(after.opacity - before.opacity) >= OPACITY_THRESHOLD) {
    changed.push("opacity");
  }
  if (after.text !== before.text) changed.push("text");
  if (after.disabled !== before.disabled) changed.push("disabled");
  if (after.pointerEvents !== before.pointerEvents) {
    changed.push("pointerEvents");
  }
  if (!arrayEq(after.classes, before.classes)) changed.push("classes");
  if (after.inViewport !== before.inViewport) changed.push("inViewport");

  return { changed };
}

export function computeDiff(
  before: ElementSnapshot[],
  after: ElementSnapshot[]
): DeltaReport {
  const beforeMap = new Map<string, ElementSnapshot>();
  const afterMap = new Map<string, ElementSnapshot>();
  for (const s of before) beforeMap.set(s.key, s);
  for (const s of after) afterMap.set(s.key, s);

  const entries: DeltaEntry[] = [];
  let added = 0;
  let removed = 0;
  let changed = 0;
  let moved = 0;

  for (const [key, afterSnap] of afterMap) {
    const beforeSnap = beforeMap.get(key);
    if (!beforeSnap) {
      if (afterSnap.visible) {
        entries.push({
          type: "+",
          key,
          label: labelFor(afterSnap),
          after: afterSnap,
        });
        added++;
      }
      continue;
    }

    if (beforeSnap.visible && !afterSnap.visible) {
      entries.push({
        type: "-",
        key,
        label: labelFor(beforeSnap),
        before: beforeSnap,
      });
      removed++;
      continue;
    }

    const { changed: changedFields } = comparePair(beforeSnap, afterSnap);
    if (changedFields.length === 0) continue;

    const onlyPosition =
      changedFields.length > 0 &&
      changedFields.every((f) => f === "x" || f === "y");

    if (onlyPosition) {
      entries.push({
        type: "→",
        key,
        label: labelFor(afterSnap),
        before: beforeSnap,
        after: afterSnap,
        changedFields,
      });
      moved++;
    } else {
      entries.push({
        type: "~",
        key,
        label: labelFor(afterSnap),
        before: beforeSnap,
        after: afterSnap,
        changedFields,
      });
      changed++;
    }
  }

  for (const [key, beforeSnap] of beforeMap) {
    if (afterMap.has(key)) continue;
    if (!beforeSnap.visible) continue;
    entries.push({
      type: "-",
      key,
      label: labelFor(beforeSnap),
      before: beforeSnap,
    });
    removed++;
  }

  const meta = { elapsedMs: 0, settle: "clean" as const };
  const text = formatReport(entries, meta);

  return {
    elapsedMs: 0,
    settle: "clean",
    counts: { added, removed, changed, moved },
    entries,
    text,
  };
}

function fmtNum(n: number): string {
  return Math.round(n).toString();
}

function fieldDelta(
  field: string,
  before: ElementSnapshot,
  after: ElementSnapshot
): string {
  switch (field) {
    case "x":
      return `x ${fmtNum(before.x)}→${fmtNum(after.x)}`;
    case "y":
      return `y ${fmtNum(before.y)}→${fmtNum(after.y)}`;
    case "width":
      return `w ${fmtNum(before.width)}→${fmtNum(after.width)}`;
    case "height":
      return `h ${fmtNum(before.height)}→${fmtNum(after.height)}`;
    case "opacity":
      return `opacity ${before.opacity.toFixed(2)}→${after.opacity.toFixed(2)}`;
    case "text":
      return `text "${before.text ?? ""}"→"${after.text ?? ""}"`;
    case "disabled":
      return `disabled ${before.disabled}→${after.disabled}`;
    case "pointerEvents":
      return `pointer-events ${before.pointerEvents}→${after.pointerEvents}`;
    case "classes":
      return `classes [${before.classes.join(" ")}]→[${after.classes.join(" ")}]`;
    case "inViewport":
      return `inViewport ${before.inViewport}→${after.inViewport}`;
    default:
      return field;
  }
}

export function formatReport(
  entries: DeltaEntry[],
  meta: { elapsedMs: number; settle: "clean" | "timeout" }
): string {
  const header = `Visual diff (${Math.round(meta.elapsedMs)}ms, settle: ${meta.settle})`;
  const divider = "────────────────────────────────";

  if (entries.length === 0) {
    return `${header}\n${divider}\n(no changes)\n${divider}`;
  }

  const lines: string[] = [header, divider];

  let added = 0;
  let removed = 0;
  let changed = 0;
  let moved = 0;

  for (const entry of entries) {
    switch (entry.type) {
      case "+": {
        added++;
        const s = entry.after!;
        lines.push(
          `+ ${entry.label}  (${fmtNum(s.x)},${fmtNum(s.y)}) ${fmtNum(s.width)}×${fmtNum(s.height)}`
        );
        break;
      }
      case "-": {
        removed++;
        lines.push(`- ${entry.label}`);
        break;
      }
      case "~": {
        changed++;
        const deltas = (entry.changedFields ?? [])
          .map((f) => fieldDelta(f, entry.before!, entry.after!))
          .join(", ");
        lines.push(`~ ${entry.label}: ${deltas}`);
        break;
      }
      case "→": {
        moved++;
        const b = entry.before!;
        const a = entry.after!;
        lines.push(
          `→ ${entry.label}: (${fmtNum(b.x)},${fmtNum(b.y)})→(${fmtNum(a.x)},${fmtNum(a.y)})`
        );
        break;
      }
    }
  }

  lines.push(divider);
  lines.push(
    `${entries.length} changes: ${added} added, ${removed} removed, ${changed} changed, ${moved} moved`
  );

  return lines.join("\n");
}
