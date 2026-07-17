/**
 * End-to-end smoke test of queryBySource against a DOM shape that matches
 * the vite-react-clean demo (Strategy B: data-locatorjs-id + __LOCATOR_DATA__)
 * plus Strategy A (path-format attr) and tolerance / maxMatches behavior.
 *
 * The runtime build (`pnpm build`) just succeeded; this file exercises the
 * same source that ships in dist/, in a jsdom environment.
 */
import { describe, expect, test, beforeEach } from "vitest";
import { queryBySource, matchSourceLocation } from "./queryBySource";
import { highlightMatches } from "./highlightBySource";

const appPath =
  "/Users/wende/projects/treelocatorjs/apps/vite-react-clean-project/src/App.jsx";

interface DemoNode {
  tag: string;
  id?: string;
  className?: string;
  text?: string;
  dataLocatorjsId?: string;
  dataLocatorjsPath?: string;
  children?: DemoNode[];
}

function buildDom(host: HTMLElement, nodes: DemoNode[]): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const n of nodes) {
    const el = document.createElement(n.tag);
    if (n.id) el.id = n.id;
    if (n.className) el.className = n.className;
    if (n.text) el.textContent = n.text;
    if (n.dataLocatorjsId) el.setAttribute("data-locatorjs-id", n.dataLocatorjsId);
    if (n.dataLocatorjsPath) el.setAttribute("data-locatorjs", n.dataLocatorjsPath);
    if (n.children) buildDom(el, n.children);
    host.appendChild(el);
    out.push(el);
  }
  return out;
}

function seedLocatorData(): void {
  (window as unknown as { __LOCATOR_DATA__: Record<string, unknown> }).__LOCATOR_DATA__ = {
    [appPath]: {
      filePath: "/src/App.jsx",
      projectPath:
        "/Users/wende/projects/treelocatorjs/apps/vite-react-clean-project",
      expressions: [
        { name: "div",    loc: { start: { line: 9,  column: 10 } }, wrappingComponentId: null },
        { name: "div",    loc: { start: { line: 10, column: 7  } }, wrappingComponentId: null },
        { name: "a",      loc: { start: { line: 11, column: 9  } }, wrappingComponentId: null },
        { name: "img",    loc: { start: { line: 12, column: 11 } }, wrappingComponentId: null },
        { name: "a",      loc: { start: { line: 14, column: 9  } }, wrappingComponentId: null },
        { name: "img",    loc: { start: { line: 15, column: 11 } }, wrappingComponentId: null },
        { name: "h1",     loc: { start: { line: 18, column: 7  } }, wrappingComponentId: null },
        { name: "div",    loc: { start: { line: 20, column: 7  } }, wrappingComponentId: null },
        { name: "button", loc: { start: { line: 21, column: 9  } }, wrappingComponentId: null },
        { name: "p",      loc: { start: { line: 24, column: 9  } }, wrappingComponentId: null },
      ],
    },
  };
}

beforeEach(() => {
  document.body.innerHTML = "<div id='root'></div>";
  seedLocatorData();
  buildDom(document.getElementById("root")!, [
    { tag: "h1", dataLocatorjsId: `${appPath}::6`, text: "Vite + React" },
    {
      tag: "div",
      className: "card",
      dataLocatorjsId: `${appPath}::7`,
      children: [
        { tag: "button", dataLocatorjsId: `${appPath}::8`, text: "count is 0" },
      ],
    },
    { tag: "div", id: "path-attr-test", dataLocatorjsPath: "/src/App.tsx:42:0" },
  ]);
});

describe("queryBySource against vite-react-clean demo shape", () => {
  test("Strategy A — path-format attr resolves and round-trips", async () => {
    const result = await queryBySource({ file: "src/App.tsx", line: 42 });
    expect(result.found).toBe(true);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]!.matchStrategy).toBe("path-attr");
    expect(result.matches[0]!.tagName).toBe("div");
    const found = document.querySelector(result.matches[0]!.selector);
    expect(found?.id).toBe("path-attr-test");
  });

  test("Strategy B — id-format attr resolves via __LOCATOR_DATA__", async () => {
    const result = await queryBySource({ file: appPath, line: 21 });
    expect(result.found).toBe(true);
    const button = result.matches.find((m) => m.tagName === "button");
    expect(button).toBeDefined();
    expect(button!.matchStrategy).toBe("locator-data");
    const el = document.querySelector(button!.selector);
    expect(el?.tagName.toLowerCase()).toBe("button");
  });

  test("Tolerance band catches nearby lines", async () => {
    const result = await queryBySource({ file: appPath, line: 20, tolerance: 2 });
    expect(result.found).toBe(true);
    // <h1> at line 18 and .card div at line 20 both fall inside ±2 of 20.
    const tags = result.matches.map((m) => m.tagName);
    expect(tags).toContain("h1");
    expect(tags).toContain("div");
  });

  test("Negative path returns found:false cleanly", async () => {
    const result = await queryBySource({ file: "src/Nowhere.tsx", line: 999 });
    expect(result.found).toBe(false);
    expect(result.matches).toEqual([]);
    expect(result.normalizedFile).toBe("src/Nowhere.tsx");
  });

  test("maxMatches caps results and sets truncated", async () => {
    for (let i = 0; i < 4; i++) {
      const dup = document.createElement("button");
      dup.setAttribute("data-locatorjs-id", `${appPath}::8`);
      document.getElementById("root")!.appendChild(dup);
    }
    const result = await queryBySource({ file: appPath, line: 21, maxMatches: 2 });
    expect(result.matches).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });

  test("matchSourceLocation: absolute path normalizes to relative", () => {
    const q = { normalizedFile: "src/App.tsx", line: 42, tolerance: 0 };
    expect(
      matchSourceLocation(
        q,
        { filePath: "/Users/me/proj/src/App.tsx", line: 42 },
        "line"
      )
    ).toBe(true);
  });

  test("matchSourceLocation: file-only mode (Vue) ignores line", () => {
    const q = { normalizedFile: "src/App.vue", line: 1, tolerance: 0 };
    expect(
      matchSourceLocation(q, { filePath: "src/App.vue", line: 9999 }, "file-only")
    ).toBe(true);
    expect(
      matchSourceLocation(q, { filePath: "src/Other.vue", line: 1 }, "file-only")
    ).toBe(false);
  });

  test("highlightMatches renders and auto-removes outline around matched elements", async () => {
    const button = document.querySelector("button");
    expect(button).not.toBeNull();
    // Stretch the button so its rect is non-zero in jsdom (jsdom reports 0x0).
    Object.defineProperty(button!, "getBoundingClientRect", {
      value: () => ({ x: 10, y: 10, width: 100, height: 30, top: 10, right: 110, bottom: 40, left: 10 }),
    });

    const handle = highlightMatches(
      [
        {
          selector: "button",
          tagName: "button",
          rect: { x: 10, y: 10, width: 100, height: 30 },
          path: null,
          ancestry: null,
          confidence: "high",
          matchStrategy: "locator-data",
        },
      ],
      60_000
    );

    expect(handle.count).toBe(1);
    expect(document.querySelector('[data-treelocator-highlight="true"]')).not.toBeNull();

    handle.cancel();
    expect(document.querySelector('[data-treelocator-highlight="true"]')).toBeNull();
  });
});