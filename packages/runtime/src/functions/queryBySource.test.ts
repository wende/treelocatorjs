import { describe, expect, test } from "vitest";
import {
  confidenceForStrategy,
  matchSourceLocation,
  queryBySource,
} from "./queryBySource";

const baseQuery = {
  normalizedFile: "src/App.tsx",
  line: 42,
  tolerance: 0,
};

describe("matchSourceLocation (pure)", () => {
  test("matches when normalized file and line are exact", () => {
    expect(
      matchSourceLocation(
        baseQuery,
        { filePath: "src/App.tsx", line: 42 },
        "line"
      )
    ).toBe(true);
  });

  test("matches absolute query against relative candidate via normalization", () => {
    expect(
      matchSourceLocation(
        { ...baseQuery, normalizedFile: "src/App.tsx" },
        { filePath: "/Users/me/project/src/App.tsx", line: 42 },
        "line"
      )
    ).toBe(true);
  });

  test("tolerance band catches nearby lines", () => {
    expect(
      matchSourceLocation(
        { ...baseQuery, tolerance: 2 },
        { filePath: "src/App.tsx", line: 44 },
        "line"
      )
    ).toBe(true);
    expect(
      matchSourceLocation(
        { ...baseQuery, tolerance: 2 },
        { filePath: "src/App.tsx", line: 45 },
        "line"
      )
    ).toBe(false);
  });

  test("rejects different files even when line matches", () => {
    expect(
      matchSourceLocation(
        baseQuery,
        { filePath: "src/Other.tsx", line: 42 },
        "line"
      )
    ).toBe(false);
  });

  test("file-only mode (Vue) matches across any line within the same file", () => {
    const query = { ...baseQuery, normalizedFile: "src/App.vue" };
    expect(
      matchSourceLocation(query, { filePath: "src/App.vue", line: 9999 }, "file-only")
    ).toBe(true);
    expect(
      matchSourceLocation(query, { filePath: "src/Other.vue", line: 42 }, "file-only")
    ).toBe(false);
  });
});

describe("queryBySource (strategy A — path attrs)", () => {
  test("finds an element with matching data-locatorjs path", async () => {
    document.body.innerHTML = `<div><button data-locatorjs="/src/App.tsx:12:4">x</button></div>`;
    const result = await queryBySource({ file: "src/App.tsx", line: 12 });
    expect(result.found).toBe(true);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]!.matchStrategy).toBe("path-attr");
    expect(result.matches[0]!.tagName).toBe("button");
    expect(document.querySelector(result.matches[0]!.selector)).toBe(
      document.querySelector("button")
    );
  });

  test("normalizes an absolute agent path against a relative attr path", async () => {
    document.body.innerHTML = `<p data-locatorjs="/workspace/apps/vite-react/src/App.tsx:7:0">x</p>`;
    const result = await queryBySource({
      file: "/Users/me/workspace/apps/vite-react/src/App.tsx",
      line: 7,
    });
    expect(result.found).toBe(true);
  });

  test("respects tolerance for imprecise line numbers", async () => {
    document.body.innerHTML = `<span data-locatorjs="/src/App.tsx:10:0">x</span>`;
    const result = await queryBySource({
      file: "src/App.tsx",
      line: 11,
      tolerance: 1,
    });
    expect(result.found).toBe(true);
  });

  test("returns found=false with no matches for a missing source location", async () => {
    document.body.innerHTML = `<div data-locatorjs="/src/App.tsx:12:0">x</div>`;
    const result = await queryBySource({ file: "src/Other.tsx", line: 12 });
    expect(result.found).toBe(false);
    expect(result.rendered).toBe(false);
    expect(result.browserConnected).toBe(true);
    expect(result.matches).toEqual([]);
    expect(result.normalizedFile).toBe("src/Other.tsx");
  });

  test("returns multiple matches when the same source line maps to many nodes", async () => {
    document.body.innerHTML = `
      <ul>
        <li data-locatorjs="/src/List.tsx:5:0">a</li>
        <li data-locatorjs="/src/List.tsx:5:0">b</li>
        <li data-locatorjs="/src/List.tsx:5:0">c</li>
      </ul>
    `;
    const result = await queryBySource({ file: "src/List.tsx", line: 5 });
    expect(result.matches).toHaveLength(3);
  });

  test("honors maxMatches and sets truncated", async () => {
    document.body.innerHTML = `
      <a data-locatorjs="/src/L.tsx:1:0">1</a>
      <a data-locatorjs="/src/L.tsx:1:0">2</a>
      <a data-locatorjs="/src/L.tsx:1:0">3</a>
    `;
    const result = await queryBySource({
      file: "src/L.tsx",
      line: 1,
      maxMatches: 2,
    });
    expect(result.matches).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });
});

describe("queryBySource (Strategy F — server components)", () => {
  test("matches Phoenix HEEx comment attribution on element", async () => {
    document.body.innerHTML = `
      <!-- <AppWeb.CoreComponents.button> lib/app_web/core_components.ex:456 -->
      <button id="phoenix-btn">Click</button>
    `;
    const result = await queryBySource({
      file: "lib/app_web/core_components.ex",
      line: 456,
    });
    expect(result.found).toBe(true);
    expect(result.rendered).toBe(true);
    expect(result.matches[0]!.matchStrategy).toBe("server-component");
    expect(result.matches[0]!.confidence).toBe("medium");
    expect(document.querySelector(result.matches[0]!.selector)?.id).toBe(
      "phoenix-btn"
    );
  });

  test("matches Next.js RSC data-locatorjs on ancestor via server-component strategy", async () => {
    document.body.innerHTML = `
      <div data-locatorjs="/apps/next-16/app/page.tsx:5:4">
        <button id="rsc-child">Go</button>
      </div>
    `;
    const result = await queryBySource({
      file: "app/page.tsx",
      line: 5,
    });
    expect(result.found).toBe(true);
    const childMatch = result.matches.find((m) => m.tagName === "button");
    expect(childMatch?.matchStrategy).toBe("server-component");
  });
});

describe("confidenceForStrategy", () => {
  test("assigns high/medium/low per strategy tier", () => {
    expect(confidenceForStrategy("path-attr")).toBe("high");
    expect(confidenceForStrategy("fiber")).toBe("medium");
    expect(confidenceForStrategy("tree-scan")).toBe("low");
  });
});