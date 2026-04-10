import { describe, expect, test } from "vitest";
import { getElementInfo, SvelteTreeNodeElement } from "./svelteAdapter";

function createMockSvelteElement(
  metadata?: { char: number; column: number; file: string; line: number } | null
): HTMLElement & { __svelte_meta?: { loc: any } } {
  const el = document.createElement("div") as any;
  el.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    top: 0,
    left: 0,
    right: 100,
    bottom: 50,
    toJSON: () => ({}),
  });

  if (metadata) {
    el.__svelte_meta = {
      loc: metadata,
    };
  }

  return el;
}

describe("Svelte Adapter - getElementInfo", () => {
  test("returns null when element has no __svelte_meta", () => {
    const el = createMockSvelteElement(null);
    expect(getElementInfo(el)).toBeNull();
  });

  test("returns FullElementInfo with correct filePath from __svelte_meta.loc.file", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 5,
      file: "src/App.svelte",
      line: 10,
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.link!.filePath).toBe("src/App.svelte");
  });

  test("returns FullElementInfo with line number incremented by 1 from __svelte_meta.loc.line", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 5,
      file: "src/App.svelte",
      line: 10,
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.link!.line).toBe(11); // 10 + 1
  });

  test("returns FullElementInfo with column number incremented by 1 from __svelte_meta.loc.column", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 5,
      file: "src/App.svelte",
      line: 10,
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.link!.column).toBe(6); // 5 + 1
  });

  test("returns FullElementInfo with empty componentsLabels array", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/Button.svelte",
      line: 5,
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.componentsLabels).toEqual([]);
  });

  test("returns FullElementInfo with htmlElement pointing to the correct element", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/Card.svelte",
      line: 15,
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.htmlElement).toBe(el);
  });

  test("returns FullElementInfo with element label as lowercase nodeName", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/Button.svelte",
      line: 5,
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.label).toBe("div"); // createElement creates a div
  });

  test("returns FullElementInfo with parentElements as empty array", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/Layout.svelte",
      line: 20,
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.parentElements).toEqual([]);
  });

  test("handles different line and column values correctly", () => {
    const el1 = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/File1.svelte",
      line: 0,
    });
    const el2 = createMockSvelteElement({
      char: 100,
      column: 20,
      file: "src/File2.svelte",
      line: 99,
    });

    const info1 = getElementInfo(el1);
    const info2 = getElementInfo(el2);

    expect(info1!.thisElement.link!.line).toBe(1); // 0 + 1
    expect(info1!.thisElement.link!.column).toBe(1); // 0 + 1
    expect(info2!.thisElement.link!.line).toBe(100); // 99 + 1
    expect(info2!.thisElement.link!.column).toBe(21); // 20 + 1
  });

  test("returns FullElementInfo with projectPath as empty string", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/App.svelte",
      line: 10,
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.link!.projectPath).toBe("");
  });
});

describe("SvelteTreeNodeElement.getSource", () => {
  test("returns null when element has no __svelte_meta", () => {
    const el = createMockSvelteElement(null);
    const node = new SvelteTreeNodeElement(el);
    expect(node.getSource()).toBeNull();
  });

  test("returns Source with correct fileName from __svelte_meta.loc.file", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 5,
      file: "src/App.svelte",
      line: 10,
    });

    const node = new SvelteTreeNodeElement(el);
    const source = node.getSource();

    expect(source).not.toBeNull();
    expect(source!.fileName).toBe("src/App.svelte");
  });

  test("returns Source with lineNumber incremented by 1 from __svelte_meta.loc.line", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 5,
      file: "src/App.svelte",
      line: 10,
    });

    const node = new SvelteTreeNodeElement(el);
    const source = node.getSource();

    expect(source).not.toBeNull();
    expect(source!.lineNumber).toBe(11); // 10 + 1
  });

  test("returns Source with columnNumber incremented by 1 from __svelte_meta.loc.column", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 5,
      file: "src/App.svelte",
      line: 10,
    });

    const node = new SvelteTreeNodeElement(el);
    const source = node.getSource();

    expect(source).not.toBeNull();
    expect(source!.columnNumber).toBe(6); // 5 + 1
  });

  test("returns Source from different Svelte components", () => {
    const el1 = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/Header.svelte",
      line: 5,
    });
    const el2 = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/Footer.svelte",
      line: 20,
    });

    const node1 = new SvelteTreeNodeElement(el1);
    const node2 = new SvelteTreeNodeElement(el2);

    const source1 = node1.getSource();
    const source2 = node2.getSource();

    expect(source1!.fileName).toBe("src/Header.svelte");
    expect(source2!.fileName).toBe("src/Footer.svelte");
    expect(source1!.lineNumber).toBe(6); // 5 + 1
    expect(source2!.lineNumber).toBe(21); // 20 + 1
  });

  test("handles line and column value of 0 correctly (increments to 1)", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/App.svelte",
      line: 0,
    });

    const node = new SvelteTreeNodeElement(el);
    const source = node.getSource();

    expect(source).not.toBeNull();
    expect(source!.lineNumber).toBe(1);
    expect(source!.columnNumber).toBe(1);
  });
});

describe("SvelteTreeNodeElement.getComponent", () => {
  test("always returns null", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 5,
      file: "src/App.svelte",
      line: 10,
    });

    const node = new SvelteTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });

  test("returns null even when __svelte_meta is present", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/Button.svelte",
      line: 5,
    });

    const node = new SvelteTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });

  test("returns null when element has no __svelte_meta", () => {
    const el = createMockSvelteElement(null);
    const node = new SvelteTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });
});

describe("SvelteTreeNodeElement inheritance and structure", () => {
  test("extends HtmlElementTreeNode with custom getSource and getComponent", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/App.svelte",
      line: 10,
    });

    const node = new SvelteTreeNodeElement(el);

    // Should inherit from HtmlElementTreeNode
    expect(node.type).toBe("element");
    expect(node.name).toBe("div");
    expect(node.element).toBe(el);
  });

  test("getBox returns element's bounding client rect", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/App.svelte",
      line: 10,
    });

    const node = new SvelteTreeNodeElement(el);
    const box = node.getBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBe(100);
    expect(box!.height).toBe(50);
  });

  test("getElement returns the underlying HTMLElement", () => {
    const el = createMockSvelteElement({
      char: 0,
      column: 0,
      file: "src/App.svelte",
      line: 10,
    });

    const node = new SvelteTreeNodeElement(el);
    expect(node.getElement()).toBe(el);
  });
});
