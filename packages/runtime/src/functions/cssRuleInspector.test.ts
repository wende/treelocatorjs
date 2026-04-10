/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  calculateSpecificity,
  compareSpecificity,
  formatSpecificity,
  describeElement,
  formatCSSInspection,
  inspectCSSRules,
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

  it("normalizes legacy single-colon pseudo-elements to element-level", () => {
    // :before, :after, :first-line, :first-letter are legacy pseudo-elements
    // that should be treated as element-level (0,0,1), not pseudo-class (0,1,0)
    expect(calculateSpecificity(":before")).toEqual([0, 0, 1]);
    expect(calculateSpecificity(":after")).toEqual([0, 0, 1]);
    expect(calculateSpecificity("p:first-line")).toEqual([0, 0, 2]);
    expect(calculateSpecificity("p:first-letter")).toEqual([0, 0, 2]);
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

  describe("nested functional pseudos", () => {
    it("handles :not(:is(.a, .b))", () => {
      // :is(.a, .b) = max(.a, .b) = (0,1,0)
      // :not(:is(.a, .b)) = (0,1,0)
      expect(calculateSpecificity(":not(:is(.a, .b))")).toEqual([0, 1, 0]);
    });

    it("handles :not(:not(.a))", () => {
      // Inner :not(.a) = (0,1,0), outer :not(:not(.a)) = (0,1,0)
      expect(calculateSpecificity(":not(:not(.a))")).toEqual([0, 1, 0]);
    });

    it("handles deeply nested :is and :where", () => {
      // :is(:where(.a), .b) — :where(.a) = 0, .b = (0,1,0), max = (0,1,0)
      expect(calculateSpecificity(":is(:where(.a), .b)")).toEqual([0, 1, 0]);
    });

    it("handles :has(:is(.a, [data-x=\"a,b\"]))", () => {
      // .a = (0,1,0), [data-x="a,b"] = (0,1,0), max = (0,1,0)
      // :has() takes the spec of its argument
      expect(calculateSpecificity(':has(:is(.a, [data-x="a,b"]))')).toEqual([
        0, 1, 0,
      ]);
    });
  });

  describe("attribute selectors with embedded specials", () => {
    it("handles attribute value containing a comma", () => {
      // [data-value="a,b"] = single attribute selector = (0,1,0)
      expect(calculateSpecificity('[data-value="a,b"]')).toEqual([0, 1, 0]);
    });

    it("handles attribute value containing brackets and dots", () => {
      // [data-x=".a#b"] should still be one attribute selector = (0,1,0)
      // The dot and # inside the string must NOT be counted as class/id.
      expect(calculateSpecificity('[data-x=".a#b"]')).toEqual([0, 1, 0]);
    });

    it("handles multiple attribute selectors", () => {
      expect(calculateSpecificity('[type="submit"][disabled]')).toEqual([
        0, 2, 0,
      ]);
    });
  });

  describe("comma splitting with nested specials", () => {
    it("does not split inside parens", () => {
      // :is(.a, .b) is a single branch, not two
      expect(calculateSpecificity(":is(.a, .b), #c")).toEqual([1, 0, 0]);
    });

    it("does not split inside attribute brackets", () => {
      // [data-x="a,b"] is a single branch
      expect(calculateSpecificity('[data-x="a,b"], #c')).toEqual([1, 0, 0]);
    });
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

  it("formats with source-order tie breaking", () => {
    // Two rules with identical specificity — second should win because it
    // appears later in the source order.
    const result: CSSInspectionResult = {
      element: "div",
      properties: [
        {
          property: "color",
          value: "blue",
          rules: [
            // Already sorted by inspectCSSRules — winner first.
            {
              selector: ".later",
              value: "blue",
              specificity: [0, 1, 0] as SpecificityTuple,
              important: false,
              source: "later.css",
              winning: true,
            },
            {
              selector: ".earlier",
              value: "red",
              specificity: [0, 1, 0] as SpecificityTuple,
              important: false,
              source: "earlier.css",
              winning: false,
            },
          ],
        },
      ],
      unreachableSheets: [],
    };

    const formatted = formatCSSInspection(result);
    expect(formatted).toContain("✓ .later");
    expect(formatted).toContain("✗ .earlier");
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

describe("inspectCSSRules (integration)", () => {
  let styleEl: HTMLStyleElement | null = null;
  let testEl: HTMLElement | null = null;

  beforeEach(() => {
    styleEl = document.createElement("style");
    document.head.appendChild(styleEl);
  });

  afterEach(() => {
    if (styleEl?.parentNode) styleEl.parentNode.removeChild(styleEl);
    if (testEl?.parentNode) testEl.parentNode.removeChild(testEl);
    styleEl = null;
    testEl = null;
  });

  function setStyles(css: string) {
    styleEl!.textContent = css;
  }

  /**
   * Build a DOM element using createElement + setAttribute (no innerHTML).
   * Avoids the XSS-pattern lint warning while keeping tests readable.
   */
  function make(
    tag: string,
    attrs: Record<string, string> = {},
    ...children: HTMLElement[]
  ): HTMLElement {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, v);
    }
    for (const child of children) {
      node.appendChild(child);
    }
    return node;
  }

  function mount(node: HTMLElement): HTMLElement {
    document.body.appendChild(node);
    testEl = node;
    return node;
  }

  it("source-order tie breaks: later rule wins on equal specificity", () => {
    setStyles(`
      .btn { color: red; }
      .btn { color: blue; }
    `);
    const el = mount(make("button", { class: "btn" }));

    const result = inspectCSSRules(el);
    const colorProp = result.properties.find((p) => p.property === "color")!;
    expect(colorProp).toBeDefined();
    // The winning rule should be the LATER one (blue), not the earlier one (red).
    const winning = colorProp.rules.find((r) => r.winning)!;
    expect(winning.value).toBe("blue");
  });

  it("uses matched-branch specificity for selector lists", () => {
    // Element matches `.btn` (specificity 0,1,0), but the rule's selector
    // text is `.btn, #unrelated`. Specificity must be 0,1,0 (the matching
    // branch), not 1,0,0 (the max of all branches). So a `#main .btn`
    // selector (1,1,0) should still win.
    setStyles(`
      .btn, #unrelated { color: red; }
      #main .btn { color: blue; }
    `);
    const btn = make("button", { class: "btn" });
    mount(make("div", { id: "main" }, btn));

    const result = inspectCSSRules(btn);
    const colorProp = result.properties.find((p) => p.property === "color")!;
    const winning = colorProp.rules.find((r) => r.winning)!;
    expect(winning.value).toBe("blue");
    expect(winning.selector).toContain("#main");
  });

  it("higher specificity beats lower regardless of source order", () => {
    setStyles(`
      #main { color: blue; }
      .btn { color: red; }
    `);
    const el = mount(make("div", { id: "main", class: "btn" }));

    const result = inspectCSSRules(el);
    const colorProp = result.properties.find((p) => p.property === "color")!;
    const winning = colorProp.rules.find((r) => r.winning)!;
    expect(winning.value).toBe("blue"); // #main has higher specificity
  });

  it("!important beats higher specificity without !important", () => {
    setStyles(`
      #main { color: blue; }
      .btn { color: red !important; }
    `);
    const el = mount(make("div", { id: "main", class: "btn" }));

    const result = inspectCSSRules(el);
    const colorProp = result.properties.find((p) => p.property === "color")!;
    const winning = colorProp.rules.find((r) => r.winning)!;
    expect(winning.value).toBe("red");
    expect(winning.important).toBe(true);
  });

  it("inline styles beat stylesheet rules of same importance", () => {
    setStyles(`
      #main { color: blue; }
    `);
    const el = mount(make("div", { id: "main", style: "color: green;" }));

    const result = inspectCSSRules(el);
    const colorProp = result.properties.find((p) => p.property === "color")!;
    const winning = colorProp.rules.find((r) => r.winning)!;
    expect(winning.source).toBe("inline");
  });

  it("returns empty properties when no rules match", () => {
    setStyles(`.unrelated { color: red; }`);
    const el = mount(make("div"));

    const result = inspectCSSRules(el);
    expect(result.properties).toEqual([]);
  });

  it("does not crash when getComputedStyle is unavailable", () => {
    setStyles(`.btn { color: red; }`);
    const el = mount(make("button", { class: "btn" }));

    // Temporarily clobber getComputedStyle to simulate an environment without it
    const original = window.getComputedStyle;
    (window as any).getComputedStyle = undefined;
    try {
      const result = inspectCSSRules(el);
      const colorProp = result.properties.find((p) => p.property === "color")!;
      expect(colorProp).toBeDefined();
      expect(colorProp.value).toBe("red"); // falls back to winning rule's value
    } finally {
      window.getComputedStyle = original;
    }
  });
});
