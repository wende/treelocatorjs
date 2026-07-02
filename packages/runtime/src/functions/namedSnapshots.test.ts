// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  takeNamedSnapshot,
  getNamedSnapshotDiff,
  clearNamedSnapshot,
  NamedSnapshotError,
} from "./namedSnapshots";
import type { AncestryResolver } from "./sourceAwareTree";
import type { TreeSnapshotDiffResult } from "./namedSnapshots";

describe("namedSnapshots", () => {
  let restoreRect: (() => void) | null = null;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    restoreRect?.();
    restoreRect = null;
    vi.restoreAllMocks();
  });

  function mockRects(
    rectForElement: (element: Element) => Partial<DOMRect>
  ): void {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      const rect = rectForElement(this);
      const x = rect.x ?? 0;
      const y = rect.y ?? 0;
      const width = rect.width ?? 100;
      const height = rect.height ?? 20;
      return {
        x,
        y,
        width,
        height,
        top: rect.top ?? y,
        right: rect.right ?? x + width,
        bottom: rect.bottom ?? y + height,
        left: rect.left ?? x,
        toJSON: () => ({}),
      } as DOMRect;
    };
    restoreRect = () => {
      Element.prototype.getBoundingClientRect = original;
    };
  }

  function emptyResolver(): AncestryResolver {
    return vi.fn().mockResolvedValue([]);
  }

  async function getTreeDiff(
    snapshotId: string,
    resolver: AncestryResolver
  ): Promise<TreeSnapshotDiffResult> {
    return (await getNamedSnapshotDiff(
      snapshotId,
      resolver
    )) as TreeSnapshotDiffResult;
  }

  it("persists a snapshot under the given id and reports property count", () => {
    document.body.innerHTML = `<button id="b">hi</button>`;
    const result = takeNamedSnapshot("#b", "baseline");

    expect(result.snapshotId).toBe("baseline");
    expect(result.selector).toBe("#b");
    expect(result.index).toBe(0);
    expect(result.propertyCount).toBeGreaterThan(0);
    expect(localStorage.getItem("treelocator:snapshot:baseline")).not.toBeNull();
  });

  it("keeps style snapshot behavior when no tree options are present", () => {
    document.body.innerHTML = `<button id="b" style="color: red">hi</button>`;
    const result = takeNamedSnapshot("#b", "baseline", { label: "style" });
    const raw = JSON.parse(localStorage.getItem("treelocator:snapshot:baseline")!);

    expect(result).toHaveProperty("propertyCount");
    expect(raw.kind).toBe("style");
    expect(raw.snapshot.properties).toBeDefined();
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

  it("stores a tree snapshot when maxDepth is present", async () => {
    mockRects(() => ({ width: 100, height: 20 }));
    document.body.innerHTML = `
      <section id="root">
        <button id="save">Save</button>
        <p>Body</p>
      </section>
    `;

    const result = await takeNamedSnapshot(
      "#root",
      "tree",
      { maxDepth: 0, includeHidden: true },
      emptyResolver()
    );
    const raw = JSON.parse(localStorage.getItem("treelocator:snapshot:tree")!);

    expect(result.kind).toBe("tree");
    expect(result.nodeCount).toBe(1);
    expect(raw.kind).toBe("tree");
    expect(raw.tree.tag).toBe("section");
    expect(raw.tree.children).toHaveLength(0);
  });

  it("uses maxDepth 1 for root plus direct children", async () => {
    mockRects(() => ({ width: 100, height: 20 }));
    document.body.innerHTML = `
      <section id="root">
        <button id="save">Save</button>
        <p>Body</p>
      </section>
    `;

    const result = await takeNamedSnapshot(
      "#root",
      "tree",
      { maxDepth: 1, includeHidden: true },
      emptyResolver()
    );
    const raw = JSON.parse(localStorage.getItem("treelocator:snapshot:tree")!);

    expect(result.nodeCount).toBe(3);
    expect(
      (raw.tree.children as Array<{ tag: string }>).map((child) => child.tag)
    ).toEqual([
      "button",
      "p",
    ]);
  });

  it("returns a no-op tree diff when the tree is unchanged", async () => {
    mockRects(() => ({ width: 100, height: 20 }));
    document.body.innerHTML = `<section id="root"><button id="save">Save</button></section>`;
    const resolver = emptyResolver();

    await takeNamedSnapshot(
      "#root",
      "tree",
      { maxDepth: 1, includeHidden: true },
      resolver
    );

    const diff = await getTreeDiff("tree", resolver);
    expect(diff.kind).toBe("tree");
    expect(diff.counts).toEqual({ added: 0, removed: 0, changed: 0, moved: 0 });
    expect(diff.entries).toEqual([]);
    expect(diff.formatted).toContain("(no changes)");
  });

  it("reports added and removed tree nodes", async () => {
    mockRects(() => ({ width: 100, height: 20 }));
    document.body.innerHTML = `
      <section id="root">
        <button id="save">Save</button>
        <p id="old">Old</p>
      </section>
    `;
    const resolver = emptyResolver();

    await takeNamedSnapshot(
      "#root",
      "tree",
      { maxDepth: 1, includeHidden: true },
      resolver
    );

    document.body.innerHTML = `
      <section id="root">
        <button id="save">Save</button>
        <span id="new">New</span>
      </section>
    `;

    const diff = await getTreeDiff("tree", resolver);
    expect(diff.counts.added).toBe(1);
    expect(diff.counts.removed).toBe(1);
    expect(diff.entries.some((entry) => entry.label.includes("#new"))).toBe(true);
    expect(diff.entries.some((entry) => entry.label.includes("#old"))).toBe(true);
  });

  it("reports semantic tree node changes", async () => {
    mockRects(() => ({ width: 100, height: 20 }));
    document.body.innerHTML = `<section id="root"><button id="save">Save</button></section>`;
    const resolver = emptyResolver();

    await takeNamedSnapshot(
      "#root",
      "tree",
      { maxDepth: 1, includeHidden: true },
      resolver
    );

    document.getElementById("save")!.textContent = "Save now";
    const diff = await getTreeDiff("tree", resolver);
    const changed = diff.entries.find((entry) => entry.type === "changed");

    expect(diff.counts.changed).toBe(1);
    expect(changed?.changedFields).toContain("name");
    expect(changed?.changedFields).toContain("text");
  });

  it("reports moved tree nodes when stable nodes change path", async () => {
    mockRects(() => ({ width: 100, height: 20 }));
    document.body.innerHTML = `
      <section id="root">
        <button id="save">Save</button>
        <p id="body">Body</p>
      </section>
    `;
    const resolver = emptyResolver();

    await takeNamedSnapshot(
      "#root",
      "tree",
      { maxDepth: 1, includeHidden: true },
      resolver
    );

    document.body.innerHTML = `
      <section id="root">
        <p id="body">Body</p>
        <button id="save">Save</button>
      </section>
    `;

    const diff = await getTreeDiff("tree", resolver);
    expect(diff.counts.moved).toBe(2);
    expect(diff.entries.every((entry) => entry.type === "moved")).toBe(true);
  });

  it("reports visibility and rect changes for tree nodes", async () => {
    let wide = false;
    mockRects((element) => ({
      width: element.id === "save" && wide ? 130 : 100,
      height: 20,
    }));
    document.body.innerHTML = `<section id="root"><button id="save">Save</button></section>`;
    const resolver = emptyResolver();

    await takeNamedSnapshot(
      "#root",
      "tree",
      { maxDepth: 1, includeHidden: true },
      resolver
    );

    wide = true;
    document.getElementById("save")!.setAttribute("hidden", "");

    const diff = await getTreeDiff("tree", resolver);
    const changed = diff.entries.find((entry) => entry.type === "changed");

    expect(diff.counts.changed).toBe(1);
    expect(changed?.changedFields).toContain("visible");
    expect(changed?.changedFields).toContain("width");
  });
});
