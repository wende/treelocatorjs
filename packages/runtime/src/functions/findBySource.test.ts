import { describe, expect, test } from "vitest";
import { findBySource } from "./findBySource";
import type {
  SourceAwareTreeNode,
  SourceAwareTreeResult,
  SourceAwareTreeRect,
} from "./sourceAwareTree";

/**
 * Build a deterministic SourceAwareTreeResult fixture — bypasses the real
 * ancestry pipeline so the test focuses on the filtering / snapping logic.
 */
function makeTree(nodes: SourceAwareTreeNode[]): SourceAwareTreeResult {
  return {
    root: {
      tag: "body",
      rect: makeRect(0, 0, 1000, 800),
      visible: true,
      ancestry: [],
      children: nodes,
    },
    nodeCount: nodes.length,
    truncated: false,
    options: {
      maxDepth: 8,
      maxNodes: 500,
      includeHidden: true,
      includeText: false,
    },
  };
}

function makeRect(x: number, y: number, width: number, height: number): SourceAwareTreeRect {
  return { x, y, width, height, top: y, right: x + width, bottom: y + height, left: x };
}

function node(partial: Partial<SourceAwareTreeNode>): SourceAwareTreeNode {
  return {
    tag: "div",
    rect: makeRect(0, 0, 100, 30),
    visible: true,
    ancestry: [],
    children: [],
    ...partial,
  };
}

describe("findBySource", () => {
  test("filters by component name", async () => {
    document.body.innerHTML = `<div></div>`;
    const tree = makeTree([
      node({ tag: "button", component: "SaveButton", file: "src/Save.tsx", line: 12 }),
      node({ tag: "a", component: "HeaderLink", file: "src/Header.tsx", line: 5 }),
      node({ tag: "span", component: "SaveButton", file: "src/Save.tsx", line: 24 }),
    ]);

    const result = await findBySource({ component: "SaveButton" }, tree);
    expect(result.found).toBe(true);
    expect(result.matches).toHaveLength(2);
    expect(result.matches.every((m) => m.component === "SaveButton")).toBe(true);
  });

  test("filters by file path (normalized)", async () => {
    document.body.innerHTML = `<div></div>`;
    const tree = makeTree([
      node({ tag: "button", component: "SaveButton", file: "src/Save.tsx", line: 12 }),
      node({ tag: "a", component: "HeaderLink", file: "src/Header.tsx", line: 5 }),
      node({ tag: "span", component: "Helper", file: "/abs/proj/src/Save.tsx", line: 33 }),
    ]);

    const result = await findBySource({ file: "src/Save.tsx" }, tree);
    expect(result.found).toBe(true);
    expect(result.matches).toHaveLength(2);
    expect(result.matches.every((m) => m.file.includes("Save.tsx"))).toBe(true);
  });

  test("honors maxMatches and sets truncated", async () => {
    document.body.innerHTML = `<div></div>`;
    const tree = makeTree([
      node({ tag: "button", component: "Btn", file: "x.tsx", line: 1 }),
      node({ tag: "button", component: "Btn", file: "x.tsx", line: 2 }),
      node({ tag: "button", component: "Btn", file: "x.tsx", line: 3 }),
      node({ tag: "button", component: "Btn", file: "x.tsx", line: 4 }),
    ]);

    const result = await findBySource({ component: "Btn", maxMatches: 2 }, tree);
    expect(result.matches).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });

  test("returns found:false when no nodes match", async () => {
    document.body.innerHTML = `<div></div>`;
    const tree = makeTree([
      node({ tag: "div", component: "Foo", file: "a.tsx", line: 1 }),
    ]);

    const result = await findBySource({ component: "Bar" }, tree);
    expect(result.found).toBe(false);
    expect(result.matches).toEqual([]);
    expect(result.truncated).toBe(false);
  });

  test("handles null tree gracefully", async () => {
    const result = await findBySource({ component: "Foo" }, null);
    expect(result.found).toBe(false);
    expect(result.matches).toEqual([]);
  });

  test("matches owner components in ancestry", async () => {
    document.body.innerHTML = `<div></div>`;
    const tree = makeTree([
      node({
        tag: "span",
        file: "src/Save.tsx",
        line: 12,
        ancestry: [
          {
            elementName: "span",
            ownerComponents: [
              { name: "Anonymous" },
              { name: "SaveButton", filePath: "src/Save.tsx", line: 12 },
            ],
          } as never,
        ],
      }),
    ]);

    const result = await findBySource({ component: "SaveButton" }, tree);
    expect(result.found).toBe(true);
    expect(result.matches).toHaveLength(1);
  });
});