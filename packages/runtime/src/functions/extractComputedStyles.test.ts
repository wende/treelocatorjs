import { describe, it, expect } from "vitest";
import {
  _collapseFourValues,
  _processGroupEntries,
  _formatDiff,
  LAYOUT_PROPERTIES,
  VISUAL_PROPERTIES,
  TYPOGRAPHY_PROPERTIES,
  INTERACTION_PROPERTIES,
  SVG_PROPERTIES,
  StyleSnapshot,
} from "./extractComputedStyles";

describe("extractComputedStyles", () => {
  describe("collapseFourValues", () => {
    it("collapses when all four values are the same", () => {
      expect(_collapseFourValues("8px", "8px", "8px", "8px")).toBe("8px");
    });

    it("collapses to two values when top=bottom and left=right", () => {
      expect(_collapseFourValues("8px", "16px", "8px", "16px")).toBe(
        "8px 16px"
      );
    });

    it("collapses to three values when left=right", () => {
      expect(_collapseFourValues("8px", "16px", "4px", "16px")).toBe(
        "8px 16px 4px"
      );
    });

    it("outputs all four when all different", () => {
      expect(_collapseFourValues("1px", "2px", "3px", "4px")).toBe(
        "1px 2px 3px 4px"
      );
    });

    it("handles 0px values", () => {
      expect(_collapseFourValues("0px", "0px", "0px", "0px")).toBe("0px");
    });
  });

  describe("processGroupEntries", () => {
    const alwaysNonDefault = (_prop: string, value: string) =>
      value !== "" && value !== "default";

    it("collapses margin into shorthand when 2+ sides are non-default", () => {
      const values: Record<string, string> = {
        "margin-top": "10px",
        "margin-right": "20px",
        "margin-bottom": "10px",
        "margin-left": "20px",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        alwaysNonDefault
      );
      const marginEntry = entries.find((e) => e.name === "margin");
      expect(marginEntry).toBeDefined();
      expect(marginEntry!.value).toBe("10px 20px");
      // No individual margin-* entries
      expect(entries.find((e) => e.name === "margin-top")).toBeUndefined();
    });

    it("leaves single margin longhand when only one is non-default", () => {
      const isNonDefault = (prop: string, value: string) => {
        if (prop === "margin-top" && value === "10px") return true;
        return false;
      };
      const values: Record<string, string> = {
        "margin-top": "10px",
        "margin-right": "0px",
        "margin-bottom": "0px",
        "margin-left": "0px",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        isNonDefault
      );
      expect(entries.find((e) => e.name === "margin")).toBeUndefined();
      expect(entries.find((e) => e.name === "margin-top")).toBeDefined();
    });

    it("collapses padding into shorthand", () => {
      const values: Record<string, string> = {
        "padding-top": "8px",
        "padding-right": "16px",
        "padding-bottom": "8px",
        "padding-left": "16px",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        alwaysNonDefault
      );
      const paddingEntry = entries.find((e) => e.name === "padding");
      expect(paddingEntry).toBeDefined();
      expect(paddingEntry!.value).toBe("8px 16px");
    });

    it("collapses overflow when both axes are the same", () => {
      const values: Record<string, string> = {
        "overflow-x": "hidden",
        "overflow-y": "hidden",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        alwaysNonDefault
      );
      const overflowEntry = entries.find((e) => e.name === "overflow");
      expect(overflowEntry).toBeDefined();
      expect(overflowEntry!.value).toBe("hidden");
    });

    it("collapses overflow when axes differ", () => {
      const values: Record<string, string> = {
        "overflow-x": "hidden",
        "overflow-y": "scroll",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        alwaysNonDefault
      );
      const overflowEntry = entries.find((e) => e.name === "overflow");
      expect(overflowEntry).toBeDefined();
      expect(overflowEntry!.value).toBe("hidden scroll");
    });

    it("collapses flex shorthand when 2+ are non-default", () => {
      const values: Record<string, string> = {
        "flex-grow": "1",
        "flex-shrink": "0",
        "flex-basis": "auto",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        alwaysNonDefault
      );
      const flexEntry = entries.find((e) => e.name === "flex");
      expect(flexEntry).toBeDefined();
      expect(flexEntry!.value).toBe("1 0 auto");
    });

    it("collapses uniform border into shorthand", () => {
      const values: Record<string, string> = {
        "border-top-width": "1px",
        "border-right-width": "1px",
        "border-bottom-width": "1px",
        "border-left-width": "1px",
        "border-top-style": "solid",
        "border-right-style": "solid",
        "border-bottom-style": "solid",
        "border-left-style": "solid",
        "border-top-color": "rgb(0, 0, 0)",
        "border-right-color": "rgb(0, 0, 0)",
        "border-bottom-color": "rgb(0, 0, 0)",
        "border-left-color": "rgb(0, 0, 0)",
      };
      const entries = _processGroupEntries(
        VISUAL_PROPERTIES,
        values,
        alwaysNonDefault
      );
      const borderEntry = entries.find((e) => e.name === "border");
      expect(borderEntry).toBeDefined();
      expect(borderEntry!.value).toBe("1px solid rgb(0, 0, 0)");
    });

    it("uses per-side border shorthands for non-uniform borders", () => {
      const values: Record<string, string> = {
        "border-top-width": "1px",
        "border-right-width": "0px",
        "border-bottom-width": "2px",
        "border-left-width": "0px",
        "border-top-style": "solid",
        "border-right-style": "none",
        "border-bottom-style": "solid",
        "border-left-style": "none",
        "border-top-color": "rgb(0, 0, 0)",
        "border-right-color": "rgb(0, 0, 0)",
        "border-bottom-color": "rgb(255, 0, 0)",
        "border-left-color": "rgb(0, 0, 0)",
      };
      const entries = _processGroupEntries(
        VISUAL_PROPERTIES,
        values,
        alwaysNonDefault
      );
      expect(entries.find((e) => e.name === "border")).toBeUndefined();
      expect(entries.find((e) => e.name === "border-top")).toBeDefined();
      expect(entries.find((e) => e.name === "border-bottom")).toBeDefined();
      // Right and left have style: none, so they're skipped
      expect(entries.find((e) => e.name === "border-right")).toBeUndefined();
      expect(entries.find((e) => e.name === "border-left")).toBeUndefined();
    });

    it("collapses border-radius into shorthand", () => {
      const values: Record<string, string> = {
        "border-top-left-radius": "6px",
        "border-top-right-radius": "6px",
        "border-bottom-right-radius": "6px",
        "border-bottom-left-radius": "6px",
      };
      const entries = _processGroupEntries(
        VISUAL_PROPERTIES,
        values,
        alwaysNonDefault
      );
      const radiusEntry = entries.find((e) => e.name === "border-radius");
      expect(radiusEntry).toBeDefined();
      expect(radiusEntry!.value).toBe("6px");
    });

    it("collapses outline into shorthand", () => {
      const values: Record<string, string> = {
        "outline-width": "2px",
        "outline-style": "solid",
        "outline-color": "rgb(59, 130, 246)",
      };
      const entries = _processGroupEntries(
        VISUAL_PROPERTIES,
        values,
        alwaysNonDefault
      );
      const outlineEntry = entries.find((e) => e.name === "outline");
      expect(outlineEntry).toBeDefined();
      expect(outlineEntry!.value).toBe("2px solid rgb(59, 130, 246)");
    });

    it("skips outline when style is none", () => {
      const values: Record<string, string> = {
        "outline-width": "0px",
        "outline-style": "none",
        "outline-color": "rgb(0, 0, 0)",
      };
      const entries = _processGroupEntries(
        VISUAL_PROPERTIES,
        values,
        alwaysNonDefault
      );
      expect(entries.find((e) => e.name === "outline")).toBeUndefined();
      // Individual longhands should also be consumed
      expect(entries.find((e) => e.name === "outline-width")).toBeUndefined();
    });

    it("outputs individual properties that are not part of shorthands", () => {
      const values: Record<string, string> = {
        display: "flex",
        position: "relative",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        alwaysNonDefault
      );
      expect(entries.find((e) => e.name === "display")).toBeDefined();
      expect(entries.find((e) => e.name === "position")).toBeDefined();
    });

    it("skips properties where isNonDefault returns false", () => {
      const neverNonDefault = () => false;
      const values: Record<string, string> = {
        display: "block",
        position: "static",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        neverNonDefault
      );
      expect(entries).toEqual([]);
    });

    it("skips properties with empty values", () => {
      const values: Record<string, string> = {
        display: "",
        position: "",
      };
      const entries = _processGroupEntries(
        LAYOUT_PROPERTIES,
        values,
        alwaysNonDefault
      );
      expect(entries).toEqual([]);
    });
  });

  describe("formatDiff", () => {
    it("shows changed properties with arrow notation", () => {
      const prev: StyleSnapshot = {
        properties: { opacity: "1", "background-color": "transparent" },
        boundingRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          top: 0,
          right: 100,
          bottom: 40,
          left: 0,
        },
      };
      const curr: StyleSnapshot = {
        properties: { opacity: "0.8", "background-color": "rgb(59, 130, 246)" },
        boundingRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          top: 0,
          right: 100,
          bottom: 40,
          left: 0,
        },
      };

      const result = _formatDiff(prev, curr, "Button");
      expect(result).toContain("[ComputedStyles \u0394] Button");
      expect(result).toContain("~ opacity: 1 \u2192 0.8");
      expect(result).toContain(
        "~ background-color: transparent \u2192 rgb(59, 130, 246)"
      );
    });

    it("shows added properties with + prefix", () => {
      const prev: StyleSnapshot = {
        properties: { opacity: "1" },
        boundingRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          top: 0,
          right: 100,
          bottom: 40,
          left: 0,
        },
      };
      const curr: StyleSnapshot = {
        properties: {
          opacity: "1",
          "box-shadow": "0 2px 4px rgba(0,0,0,0.1)",
        },
        boundingRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          top: 0,
          right: 100,
          bottom: 40,
          left: 0,
        },
      };

      const result = _formatDiff(prev, curr, undefined);
      expect(result).toContain("+ box-shadow: 0 2px 4px rgba(0,0,0,0.1)");
    });

    it("shows removed properties with - prefix", () => {
      const prev: StyleSnapshot = {
        properties: { transform: "scale(1.05)" },
        boundingRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          top: 0,
          right: 100,
          bottom: 40,
          left: 0,
        },
      };
      const curr: StyleSnapshot = {
        properties: {},
        boundingRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          top: 0,
          right: 100,
          bottom: 40,
          left: 0,
        },
      };

      const result = _formatDiff(prev, curr, undefined);
      expect(result).toContain("- transform: scale(1.05)");
    });

    it("shows bounding rect changes", () => {
      const prev: StyleSnapshot = {
        properties: {},
        boundingRect: {
          x: 100,
          y: 200,
          width: 120,
          height: 40,
          top: 200,
          right: 220,
          bottom: 240,
          left: 100,
        },
      };
      const curr: StyleSnapshot = {
        properties: {},
        boundingRect: {
          x: 150,
          y: 200,
          width: 120,
          height: 50,
          top: 200,
          right: 270,
          bottom: 250,
          left: 150,
        },
      };

      const result = _formatDiff(prev, curr, undefined);
      expect(result).toContain("BoundingRect");
      expect(result).toContain("~ x: 100 \u2192 150");
      expect(result).toContain("~ height: 40 \u2192 50");
    });

    it("shows 'No changes detected' when nothing changed", () => {
      const snapshot: StyleSnapshot = {
        properties: { opacity: "1" },
        boundingRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          top: 0,
          right: 100,
          bottom: 40,
          left: 0,
        },
      };
      const result = _formatDiff(snapshot, snapshot, undefined);
      expect(result).toContain("No changes detected");
    });
  });

  describe("property group completeness", () => {
    it("has no duplicates within property groups", () => {
      const allProps = [
        ...LAYOUT_PROPERTIES,
        ...VISUAL_PROPERTIES,
        ...TYPOGRAPHY_PROPERTIES,
        ...INTERACTION_PROPERTIES,
        ...SVG_PROPERTIES,
      ];
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const prop of allProps) {
        if (seen.has(prop)) dupes.push(prop);
        seen.add(prop);
      }
      expect(dupes).toEqual([]);
    });

    it("includes key layout properties", () => {
      expect(LAYOUT_PROPERTIES).toContain("display");
      expect(LAYOUT_PROPERTIES).toContain("position");
      expect(LAYOUT_PROPERTIES).toContain("width");
      expect(LAYOUT_PROPERTIES).toContain("height");
      expect(LAYOUT_PROPERTIES).toContain("flex-direction");
      expect(LAYOUT_PROPERTIES).toContain("grid-template-columns");
    });

    it("includes key visual properties", () => {
      expect(VISUAL_PROPERTIES).toContain("background-color");
      expect(VISUAL_PROPERTIES).toContain("color");
      expect(VISUAL_PROPERTIES).toContain("opacity");
      expect(VISUAL_PROPERTIES).toContain("box-shadow");
      expect(VISUAL_PROPERTIES).toContain("transform");
    });

    it("includes key typography properties", () => {
      expect(TYPOGRAPHY_PROPERTIES).toContain("font-family");
      expect(TYPOGRAPHY_PROPERTIES).toContain("font-size");
      expect(TYPOGRAPHY_PROPERTIES).toContain("font-weight");
      expect(TYPOGRAPHY_PROPERTIES).toContain("line-height");
    });

    it("includes SVG-specific properties", () => {
      expect(SVG_PROPERTIES).toContain("fill");
      expect(SVG_PROPERTIES).toContain("stroke");
      expect(SVG_PROPERTIES).toContain("stroke-width");
    });
  });
});
