import { describe, expect, test } from "vitest";
import { computeDiff, formatReport } from "./diff";
import type { ElementSnapshot } from "./types";

function snap(overrides: Partial<ElementSnapshot> = {}): ElementSnapshot {
  return {
    key: "1",
    tagName: "div",
    classes: [],
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    visible: true,
    opacity: 1,
    inViewport: true,
    pointerEvents: "auto",
    disabled: false,
    ...overrides,
  };
}

describe("computeDiff", () => {
  test("empty snapshots produce empty report", () => {
    const r = computeDiff([], []);
    expect(r.entries).toHaveLength(0);
    expect(r.counts).toEqual({ added: 0, removed: 0, changed: 0, moved: 0 });
  });

  test("identical snapshots produce no entries", () => {
    const a = [snap({ key: "1" }), snap({ key: "2" })];
    const b = [snap({ key: "1" }), snap({ key: "2" })];
    const r = computeDiff(a, b);
    expect(r.entries).toHaveLength(0);
  });

  test("+ for keys only in after (when visible)", () => {
    const a = [snap({ key: "1" })];
    const b = [snap({ key: "1" }), snap({ key: "2", id: "new" })];
    const r = computeDiff(a, b);
    expect(r.counts.added).toBe(1);
    expect(r.entries[0]!.type).toBe("+");
    expect(r.entries[0]!.key).toBe("2");
  });

  test("+ is skipped when newly-added element is invisible", () => {
    const a: ElementSnapshot[] = [];
    const b = [snap({ key: "2", visible: false })];
    const r = computeDiff(a, b);
    expect(r.counts.added).toBe(0);
  });

  test("- for keys only in before (when visible)", () => {
    const a = [snap({ key: "1" }), snap({ key: "2" })];
    const b = [snap({ key: "1" })];
    const r = computeDiff(a, b);
    expect(r.counts.removed).toBe(1);
    expect(r.entries[0]!.type).toBe("-");
  });

  test("- when element becomes invisible in after", () => {
    const a = [snap({ key: "1", visible: true })];
    const b = [snap({ key: "1", visible: false })];
    const r = computeDiff(a, b);
    expect(r.counts.removed).toBe(1);
    expect(r.entries[0]!.type).toBe("-");
  });

  test("~ when opacity changes by >= 0.05", () => {
    const a = [snap({ key: "1", opacity: 1 })];
    const b = [snap({ key: "1", opacity: 0.95 })];
    const r = computeDiff(a, b);
    expect(r.counts.changed).toBe(1);
    expect(r.entries[0]!.type).toBe("~");
    expect(r.entries[0]!.changedFields).toContain("opacity");
  });

  test("no entry when opacity changes by < 0.05", () => {
    const a = [snap({ key: "1", opacity: 1 })];
    const b = [snap({ key: "1", opacity: 0.97 })];
    const r = computeDiff(a, b);
    expect(r.entries).toHaveLength(0);
  });

  test("→ when only x/y change by >= 4px", () => {
    const a = [snap({ key: "1", x: 0, y: 0 })];
    const b = [snap({ key: "1", x: 10, y: 20 })];
    const r = computeDiff(a, b);
    expect(r.counts.moved).toBe(1);
    expect(r.entries[0]!.type).toBe("→");
  });

  test("no entry when position changes by 3px (under threshold)", () => {
    const a = [snap({ key: "1", x: 0, y: 0 })];
    const b = [snap({ key: "1", x: 3, y: 3 })];
    const r = computeDiff(a, b);
    expect(r.entries).toHaveLength(0);
  });

  test("w/h: 2px delta triggers ~, 1px does not", () => {
    const r1 = computeDiff(
      [snap({ key: "1", width: 100 })],
      [snap({ key: "1", width: 102 })]
    );
    expect(r1.counts.changed).toBe(1);
    const r2 = computeDiff(
      [snap({ key: "1", width: 100 })],
      [snap({ key: "1", width: 101 })]
    );
    expect(r2.entries).toHaveLength(0);
  });

  test("mixed position + opacity change produces ~, not →", () => {
    const a = [snap({ key: "1", x: 0, opacity: 1 })];
    const b = [snap({ key: "1", x: 20, opacity: 0.5 })];
    const r = computeDiff(a, b);
    expect(r.counts.changed).toBe(1);
    expect(r.counts.moved).toBe(0);
    expect(r.entries[0]!.type).toBe("~");
    expect(r.entries[0]!.changedFields).toContain("x");
    expect(r.entries[0]!.changedFields).toContain("opacity");
  });

  test("text change is reported", () => {
    const a = [snap({ key: "1", text: "Submit" })];
    const b = [snap({ key: "1", text: "Submitting..." })];
    const r = computeDiff(a, b);
    expect(r.counts.changed).toBe(1);
    expect(r.entries[0]!.changedFields).toContain("text");
  });

  test("class addition is reported", () => {
    const a = [snap({ key: "1", classes: ["foo"] })];
    const b = [snap({ key: "1", classes: ["foo", "active"] })];
    const r = computeDiff(a, b);
    expect(r.counts.changed).toBe(1);
    expect(r.entries[0]!.changedFields).toContain("classes");
  });

  test("pointer-events change is reported", () => {
    const a = [snap({ key: "1", pointerEvents: "auto" })];
    const b = [snap({ key: "1", pointerEvents: "none" })];
    const r = computeDiff(a, b);
    expect(r.counts.changed).toBe(1);
    expect(r.entries[0]!.changedFields).toContain("pointerEvents");
  });
});

describe("formatReport", () => {
  test("no-changes report contains header and divider", () => {
    const out = formatReport([], { elapsedMs: 100, settle: "clean" });
    expect(out).toContain("Visual diff");
    expect(out).toContain("(no changes)");
  });

  test("summary line counts match entry types", () => {
    const a = [snap({ key: "1" }), snap({ key: "2" })];
    const b = [
      snap({ key: "1", x: 20 }),
      snap({ key: "3", id: "added" }),
    ];
    const r = computeDiff(a, b);
    expect(r.text).toContain("1 added");
    expect(r.text).toContain("1 removed");
    expect(r.text).toContain("1 moved");
  });
});
