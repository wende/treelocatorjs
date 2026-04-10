import { describe, expect, test } from "vitest";
import { collectNextjsServerComponents, parseNextjsServerComponents } from "./parseNextjsDataAttributes";

describe("collectNextjsServerComponents", () => {
  test("extracts component name from layout.tsx", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/apps/next-16/app/layout.tsx:27:4");

    const result = collectNextjsServerComponents(element);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "RootLayout",
      filePath: "app/layout.tsx",
      line: 27,
      type: "component",
    });
  });

  test("extracts component name from page.tsx", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/apps/next-16/app/page.tsx:5:4");

    const result = collectNextjsServerComponents(element);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Page",
      filePath: "app/page.tsx",
      line: 5,
      type: "component",
    });
  });

  test("extracts custom component name from Header.tsx", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/apps/next-16/app/components/Header.tsx:10:2");

    const result = collectNextjsServerComponents(element);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Header",
      filePath: "app/components/Header.tsx",
      line: 10,
      type: "component",
    });
  });

  test("extracts custom component name from Button.tsx", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/home/project/src/components/Button.tsx:15:5");

    const result = collectNextjsServerComponents(element);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Button",
      filePath: "src/components/Button.tsx",
      line: 15,
      type: "component",
    });
  });

  test("returns empty array when element has no data-locatorjs attribute", () => {
    const element = document.createElement("div");

    const result = collectNextjsServerComponents(element);

    expect(result).toEqual([]);
  });

  test("handles nested layout files", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/workspace/app/dashboard/layout.tsx:3:2");

    const result = collectNextjsServerComponents(element);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("RootLayout");
  });

  test("handles TypeScript file extension", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/home/project/app/layout.ts:10:1");

    const result = collectNextjsServerComponents(element);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "RootLayout",
      filePath: "app/layout.ts",
      line: 10,
      type: "component",
    });
  });

  test("handles JSX file extension", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/home/project/app/page.jsx:5:1");

    const result = collectNextjsServerComponents(element);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Page");
  });

  test("handles JavaScript file extension", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/home/project/app/layout.js:5:1");

    const result = collectNextjsServerComponents(element);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("RootLayout");
  });

  test("parses line and column numbers correctly", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/path/app/page.tsx:123:45");

    const result = collectNextjsServerComponents(element);

    expect(result[0]!.line).toBe(123);
  });

  test("handles empty data-locatorjs attribute", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "");

    const result = collectNextjsServerComponents(element);

    expect(result).toEqual([]);
  });

  test("handles malformed data-locatorjs attribute with missing colons", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/path/to/file.tsx");

    const result = collectNextjsServerComponents(element);

    expect(result).toEqual([]);
  });

  test("handles malformed data-locatorjs attribute with non-numeric line", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/path/to/file.tsx:abc:5");

    const result = collectNextjsServerComponents(element);

    // parseInt("abc", 10) returns NaN, but the function still returns a component
    // This test validates current behavior - the parser doesn't validate numeric values
    expect(result).toHaveLength(1);
    expect(Number.isNaN(result[0]!.line)).toBe(true);
  });
});

describe("parseNextjsServerComponents", () => {
  test("returns server component info when data-locatorjs present", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/apps/next-16/app/page.tsx:5:4");

    const result = parseNextjsServerComponents(element);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]!.name).toBe("Page");
  });

  test("returns null when element has no data-locatorjs attribute", () => {
    const element = document.createElement("div");

    const result = parseNextjsServerComponents(element);

    expect(result).toBeNull();
  });

  test("returns null when data-locatorjs is empty", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "");

    const result = parseNextjsServerComponents(element);

    expect(result).toBeNull();
  });

  test("returns null when data-locatorjs is malformed", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/path/to/file.tsx");

    const result = parseNextjsServerComponents(element);

    // Parser returns null for malformed attributes (less than 2 parts after split)
    expect(result).toBeNull();
  });

  test("returns correct server component info from parseNextjsServerComponents", () => {
    const element = document.createElement("div");
    element.setAttribute("data-locatorjs", "/workspace/app/dashboard/layout.tsx:42:10");

    const result = parseNextjsServerComponents(element);

    expect(result).toEqual([
      {
        name: "RootLayout",
        filePath: "app/dashboard/layout.tsx",
        line: 42,
        type: "component",
      },
    ]);
  });
});
