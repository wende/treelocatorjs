// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  takeNamedSnapshot,
  getNamedSnapshotDiff,
  clearNamedSnapshot,
  NamedSnapshotError,
} from "./namedSnapshots";

describe("namedSnapshots", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("persists a snapshot under the given id and reports property count", () => {
    document.body.innerHTML = `<button id="b">hi</button>`;
    const result = takeNamedSnapshot("#b", "baseline");

    expect(result.snapshotId).toBe("baseline");
    expect(result.selector).toBe("#b");
    expect(result.index).toBe(0);
    expect(result.propertyCount).toBeGreaterThan(0);
    expect(localStorage.getItem("treelocator:snapshot:baseline")).not.toBeNull();
  });

  it("returns no-op diff when nothing changed", () => {
    document.body.innerHTML = `<button id="b" style="color: red">hi</button>`;
    takeNamedSnapshot("#b", "baseline");

    const diff = getNamedSnapshotDiff("baseline");
    expect(diff.changes).toEqual([]);
    expect(diff.boundingRectChanges).toEqual([]);
    expect(diff.formatted).toContain("No changes detected");
  });

  it("reports property transitions without mutating the baseline", () => {
    document.body.innerHTML = `<button id="b" style="color: rgb(255, 0, 0)">hi</button>`;
    takeNamedSnapshot("#b", "baseline");

    const button = document.getElementById("b")!;
    button.style.color = "rgb(0, 128, 0)";

    const first = getNamedSnapshotDiff("baseline");
    const colorChange = first.changes.find((c) => c.property === "color");
    expect(colorChange).toBeDefined();
    expect(colorChange).toMatchObject({
      type: "changed",
      before: "rgb(255, 0, 0)",
      after: "rgb(0, 128, 0)",
    });

    // Revert and diff again — the baseline must still be the original red.
    button.style.color = "rgb(255, 0, 0)";
    const second = getNamedSnapshotDiff("baseline");
    expect(second.changes.find((c) => c.property === "color")).toBeUndefined();
  });

  it("overwrites baseline only when takeSnapshot is called again", () => {
    document.body.innerHTML = `<button id="b" style="opacity: 1">hi</button>`;
    takeNamedSnapshot("#b", "baseline");

    const button = document.getElementById("b")!;
    button.style.opacity = "0.5";

    // Re-taking replaces baseline with current state.
    takeNamedSnapshot("#b", "baseline");
    const diff = getNamedSnapshotDiff("baseline");
    expect(diff.changes.find((c) => c.property === "opacity")).toBeUndefined();
  });

  it("throws snapshot_not_found for unknown id", () => {
    expect(() => getNamedSnapshotDiff("nope")).toThrow(NamedSnapshotError);
  });

  it("throws element_not_found when baseline selector no longer resolves", () => {
    document.body.innerHTML = `<button id="b">hi</button>`;
    takeNamedSnapshot("#b", "baseline");
    document.body.innerHTML = "";

    expect(() => getNamedSnapshotDiff("baseline")).toThrow(
      /element_not_found|No element found/i
    );
  });

  it("clearNamedSnapshot removes the baseline", () => {
    document.body.innerHTML = `<button id="b">hi</button>`;
    takeNamedSnapshot("#b", "baseline");
    clearNamedSnapshot("baseline");
    expect(localStorage.getItem("treelocator:snapshot:baseline")).toBeNull();
    expect(() => getNamedSnapshotDiff("baseline")).toThrow(NamedSnapshotError);
  });

  it("respects `index` option when multiple elements match", () => {
    document.body.innerHTML = `
      <button class="t" style="color: rgb(255, 0, 0)">one</button>
      <button class="t" style="color: rgb(0, 0, 255)">two</button>
    `;
    takeNamedSnapshot(".t", "second", { index: 1 });

    const diff = getNamedSnapshotDiff("second");
    expect(diff.selector).toBe(".t");
    expect(diff.index).toBe(1);
    expect(diff.changes).toEqual([]);
  });
});
