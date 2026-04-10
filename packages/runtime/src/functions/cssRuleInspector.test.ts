/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import {
  calculateSpecificity,
  compareSpecificity,
  formatSpecificity,
  describeElement,
  formatCSSInspection,
  SpecificityTuple,
  CSSInspectionResult,
} from "./cssRuleInspector";

describe("calculateSpecificity", () => {
  it("counts element selectors", () => {
    expect(calculateSpecificity("div")).toEqual([0, 0, 1]);
    expect(calculateSpecificity("div span")).toEqual([0, 0, 2]);
    expect(calculateSpecificity("ul li a")).toEqual([0, 0, 3]);
  });

  it("counts class selectors", () => {
    expect(calculateSpecificity(".button")).toEqual([0, 1, 0]);
    expect(calculateSpecificity(".button.primary")).toEqual([0, 2, 0]);
  });

  it("counts ID selectors", () => {
    expect(calculateSpecificity("#main")).toEqual([1, 0, 0]);
    expect(calculateSpecificity("#main #sidebar")).toEqual([2, 0, 0]);
  });

  it("counts mixed selectors", () => {
    expect(calculateSpecificity("div.button")).toEqual([0, 1, 1]);
    expect(calculateSpecificity("#main .button")).toEqual([1, 1, 0]);
    expect(calculateSpecificity("#main div.button")).toEqual([1, 1, 1]);
  });

  it("counts attribute selectors as class-level", () => {
    expect(calculateSpecificity("[type=submit]")).toEqual([0, 1, 0]);
    expect(calculateSpecificity("input[type=submit]")).toEqual([0, 1, 1]);
  });

  it("counts pseudo-classes as class-level", () => {
    expect(calculateSpecificity(":hover")).toEqual([0, 1, 0]);
    expect(calculateSpecificity("a:hover")).toEqual([0, 1, 1]);
    expect(calculateSpecificity("a:first-child")).toEqual([0, 1, 1]);
  });

  it("counts pseudo-elements as element-level", () => {
    expect(calculateSpecificity("::before")).toEqual([0, 0, 1]);
    expect(calculateSpecificity("p::first-line")).toEqual([0, 0, 2]);
  });

  it("handles child and sibling combinators", () => {
    expect(calculateSpecificity("div > span")).toEqual([0, 0, 2]);
    expect(calculateSpecificity("div + span")).toEqual([0, 0, 2]);
    expect(calculateSpecificity("div ~ span")).toEqual([0, 0, 2]);
  });

  it("ignores universal selector", () => {
    expect(calculateSpecificity("*")).toEqual([0, 0, 0]);
    expect(calculateSpecificity("*.button")).toEqual([0, 1, 0]);
  });

  it("handles comma-separated selectors by returning max", () => {
    // .a has specificity (0,1,0), #b has (1,0,0) — should return (1,0,0)
    expect(calculateSpecificity(".a, #b")).toEqual([1, 0, 0]);
    expect(calculateSpecificity("div, .button, #main")).toEqual([1, 0, 0]);
  });

  it("handles :not() by counting its argument", () => {
    // :not(.disabled) = (0,1,0) + the :not itself is not counted
    expect(calculateSpecificity(":not(.disabled)")).toEqual([0, 1, 0]);
    expect(calculateSpecificity("div:not(.hidden)")).toEqual([0, 1, 1]);
  });

  it("handles :is() by counting its argument", () => {
    expect(calculateSpecificity(":is(.a, .b)")).toEqual([0, 1, 0]);
  });

  it("handles :where() as zero specificity", () => {
    expect(calculateSpecificity(":where(.a, .b)")).toEqual([0, 0, 0]);
    expect(calculateSpecificity("div:where(.a)")).toEqual([0, 0, 1]);
  });

  it("handles complex real-world selectors", () => {
    // Bootstrap-style: .btn-group > .btn:not(:first-child)
    // .btn-group = (0,1,0), .btn = (0,1,0), :not(:first-child) -> :first-child = (0,1,0)
    // Total: (0,3,0) ... but we also don't count > combinator
    // Actually let me recalculate: .btn-group > .btn:not(:first-child)
    // .btn-group = class (0,1,0)
    // .btn = class (0,1,0)
    // :not(:first-child) = argument :first-child = pseudo-class (0,1,0)
    // Total = (0,3,0)
    expect(calculateSpecificity(".btn-group > .btn:not(:first-child)")).toEqual([0, 3, 0]);
  });
});

describe("compareSpecificity", () => {
  it("returns positive when first is higher", () => {
    expect(compareSpecificity([1, 0, 0], [0, 10, 10])).toBeGreaterThan(0);
    expect(compareSpecificity([0, 2, 0], [0, 1, 5])).toBeGreaterThan(0);
    expect(compareSpecificity([0, 0, 3], [0, 0, 2])).toBeGreaterThan(0);
  });

  it("returns negative when first is lower", () => {
    expect(compareSpecificity([0, 0, 1], [0, 1, 0])).toBeLessThan(0);
    expect(compareSpecificity([0, 1, 0], [1, 0, 0])).toBeLessThan(0);
  });

  it("returns zero when equal", () => {
    expect(compareSpecificity([0, 1, 1], [0, 1, 1])).toBe(0);
    expect(compareSpecificity([1, 0, 0], [1, 0, 0])).toBe(0);
  });
});

describe("formatSpecificity", () => {
  it("formats tuple as readable string", () => {
    expect(formatSpecificity([0, 1, 2])).toBe("(0,1,2)");
    expect(formatSpecificity([1, 0, 0])).toBe("(1,0,0)");
    expect(formatSpecificity([0, 0, 0])).toBe("(0,0,0)");
  });
});

describe("describeElement", () => {
  it("describes a plain element", () => {
    const el = document.createElement("div");
    expect(describeElement(el)).toBe("div");
  });

  it("includes id", () => {
    const el = document.createElement("div");
    el.id = "main";
    expect(describeElement(el)).toBe("div#main");
  });

  it("includes classes", () => {
    const el = document.createElement("button");
    el.classList.add("btn", "primary");
    expect(describeElement(el)).toBe("button.btn.primary");
  });

  it("includes both id and classes", () => {
    const el = document.createElement("button");
    el.id = "submit";
    el.classList.add("btn", "primary");
    expect(describeElement(el)).toBe("button#submit.btn.primary");
  });
});

describe("formatCSSInspection", () => {
  it("formats empty result", () => {
    const result: CSSInspectionResult = {
      element: "div",
      properties: [],
      unreachableSheets: [],
    };
    const formatted = formatCSSInspection(result);
    expect(formatted).toContain("CSS Rules for div");
    expect(formatted).toContain("No matching CSS rules found.");
  });

  it("formats properties with winning/losing rules", () => {
    const result: CSSInspectionResult = {
      element: "button.primary",
      properties: [
        {
          property: "color",
          value: "rgb(51, 51, 51)",
          rules: [
            {
              selector: ".button.primary",
              value: "#333",
              specificity: [0, 2, 0] as SpecificityTuple,
              important: false,
              source: "components.css",
              winning: true,
            },
            {
              selector: ".button",
              value: "#666",
              specificity: [0, 1, 0] as SpecificityTuple,
              important: false,
              source: "base.css",
              winning: false,
            },
          ],
        },
      ],
      unreachableSheets: [],
    };

    const formatted = formatCSSInspection(result);
    expect(formatted).toContain("CSS Rules for button.primary");
    expect(formatted).toContain("color: rgb(51, 51, 51)");
    expect(formatted).toContain("✓ .button.primary");
    expect(formatted).toContain("(0,2,0)");
    expect(formatted).toContain("✗ .button");
    expect(formatted).toContain("(0,1,0)");
    expect(formatted).toContain("[#666]"); // losing rule shows its value
  });

  it("shows !important flag", () => {
    const result: CSSInspectionResult = {
      element: "div",
      properties: [
        {
          property: "display",
          value: "none",
          rules: [
            {
              selector: ".hidden",
              value: "none",
              specificity: [0, 1, 0] as SpecificityTuple,
              important: true,
              source: "utils.css",
              winning: true,
            },
          ],
        },
      ],
      unreachableSheets: [],
    };

    const formatted = formatCSSInspection(result);
    expect(formatted).toContain("!important");
  });

  it("shows cross-origin warning", () => {
    const result: CSSInspectionResult = {
      element: "div",
      properties: [],
      unreachableSheets: ["cdn-styles.css", "external.css"],
    };

    const formatted = formatCSSInspection(result);
    expect(formatted).toContain("Cross-origin");
    expect(formatted).toContain("cdn-styles.css");
    expect(formatted).toContain("external.css");
  });

  it("shows inline source for inline rules", () => {
    const result: CSSInspectionResult = {
      element: "div",
      properties: [
        {
          property: "color",
          value: "red",
          rules: [
            {
              selector: "element.style",
              value: "red",
              specificity: [1, 0, 0] as SpecificityTuple,
              important: false,
              source: "inline",
              winning: true,
            },
          ],
        },
      ],
      unreachableSheets: [],
    };

    const formatted = formatCSSInspection(result);
    expect(formatted).toContain("(inline)");
    expect(formatted).toContain("— inline");
  });
});
