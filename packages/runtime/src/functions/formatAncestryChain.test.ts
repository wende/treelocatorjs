import { describe, it, expect } from "vitest";
import {
  AncestryItem,
  formatAncestryChain,
  truncateAtFirstFile,
} from "./formatAncestryChain";

describe("formatAncestryChain", () => {
  it("uses component name only at component boundaries", () => {
    const items: AncestryItem[] = [
      { elementName: "button", componentName: "Button" },
      { elementName: "div", componentName: "App" },
    ];

    const result = formatAncestryChain(items);
    // App is root (component boundary), Button is different component (boundary)
    expect(result).toBe(
      `App
    └─ Button`
    );
  });

  it("shows element name when same component as parent", () => {
    const items: AncestryItem[] = [
      { elementName: "button", componentName: "App", id: "submit-btn" },
      { elementName: "div", componentName: "App" },
    ];

    const result = formatAncestryChain(items);
    // Both are in App, so second item shows element name not component name
    expect(result).toBe(
      `App
    └─ button#submit-btn`
    );
  });

  it("includes nth-child with component name at boundary", () => {
    const items: AncestryItem[] = [
      { elementName: "li", componentName: "ListItem", nthChild: 3 },
      { elementName: "ul", componentName: "List" },
    ];

    const result = formatAncestryChain(items);
    // Different components = boundaries
    expect(result).toBe(
      `List
    └─ ListItem:nth-child(3)`
    );
  });

  it("includes both nth-child and ID at component boundary", () => {
    const items: AncestryItem[] = [
      {
        elementName: "li",
        componentName: "ListItem",
        nthChild: 2,
        id: "special-item",
      },
      { elementName: "ul", componentName: "List" },
    ];

    const result = formatAncestryChain(items);
    expect(result).toBe(
      `List
    └─ ListItem:nth-child(2)#special-item`
    );
  });

  it("includes file location at component boundary", () => {
    const items: AncestryItem[] = [
      {
        elementName: "button",
        componentName: "Button",
        id: "save",
        filePath: "src/Button.tsx",
        line: 42,
      },
    ];

    const result = formatAncestryChain(items);
    // First item is always a boundary (no previous item)
    expect(result).toBe("Button#save at src/Button.tsx:42");
  });

  it("formats element without component name", () => {
    const items: AncestryItem[] = [
      { elementName: "div", id: "main", filePath: "src/App.tsx", line: 10 },
    ];

    const result = formatAncestryChain(items);
    expect(result).toBe("div#main at src/App.tsx:10");
  });

  it("returns empty string for empty items", () => {
    const result = formatAncestryChain([]);
    expect(result).toBe("");
  });

  it("uses innermost component as display name with outer components in chain", () => {
    const items: AncestryItem[] = [
      {
        elementName: "div",
        id: "sidebar-panel",
        componentName: "Sidebar",
        filePath: "src/components/game/Sidebar.jsx",
        line: 78,
        ownerComponents: [
          {
            name: "Sidebar",
            filePath: "src/components/game/Sidebar.jsx",
            line: 78,
          },
          {
            name: "GlassPanel",
            filePath: "src/components/common/GlassPanel.jsx",
            line: 39,
          },
        ],
      },
      { elementName: "div", componentName: "App", filePath: "src/App.jsx", line: 104 },
    ];

    const result = formatAncestryChain(items);
    // GlassPanel (innermost) is the display name, Sidebar (outer) shown in "in"
    expect(result).toBe(
      `App at src/App.jsx:104
    └─ GlassPanel#sidebar-panel in Sidebar at src/components/game/Sidebar.jsx:78`
    );
  });

  it("uses component name as display name when only one in chain", () => {
    const items: AncestryItem[] = [
      {
        elementName: "button",
        componentName: "Button",
        ownerComponents: [{ name: "Button", filePath: "src/Button.tsx", line: 10 }],
        filePath: "src/Button.tsx",
        line: 10,
      },
    ];

    const result = formatAncestryChain(items);
    // Single component becomes the display name, no "in X" needed
    expect(result).toBe("Button at src/Button.tsx:10");
  });

  describe("Anonymous component filtering", () => {
    it("filters Anonymous from outer components in 'in X > Y' display", () => {
      const items: AncestryItem[] = [
        {
          elementName: "div",
          nthChild: 2,
          componentName: "Anonymous",
          filePath: "app/page.tsx",
          line: 82,
          ownerComponents: [
            { name: "Anonymous" },
            { name: "Home", filePath: "app/page.tsx", line: 82 },
          ],
        },
        { elementName: "div", componentName: "App", filePath: "src/App.tsx", line: 1 },
      ];

      const result = formatAncestryChain(items);
      // "Anonymous" should be filtered out — just "Home" as display name, no "in Anonymous"
      expect(result).toBe(
        `App at src/App.tsx:1
    └─ Home:nth-child(2) at app/page.tsx:82`
      );
    });

    it("filters Anonymous from component boundary detection", () => {
      // When prev item's innermost component is Anonymous, it shouldn't count
      // as a different component from the current item
      const items: AncestryItem[] = [
        {
          elementName: "p",
          componentName: "Home",
          filePath: "app/page.tsx",
          line: 100,
        },
        {
          elementName: "div",
          componentName: "Anonymous",
          filePath: "app/page.tsx",
          line: 82,
          ownerComponents: [
            { name: "Anonymous" },
            { name: "Home", filePath: "app/page.tsx", line: 82 },
          ],
        },
      ];

      const result = formatAncestryChain(items);
      // Both items resolve to "Home" — no boundary crossing, so element name for child
      expect(result).toBe(
        `Home at app/page.tsx:82
    └─ p at app/page.tsx:100`
      );
    });

    it("handles all-Anonymous owner chain gracefully", () => {
      const items: AncestryItem[] = [
        {
          elementName: "div",
          componentName: "Anonymous",
          filePath: "app/layout.tsx",
          line: 10,
          ownerComponents: [
            { name: "Anonymous" },
            { name: "Anonymous" },
          ],
        },
      ];

      const result = formatAncestryChain(items);
      // All components are Anonymous — falls back to element name
      expect(result).toBe("div at app/layout.tsx:10");
    });

    it("skips Anonymous-only componentName without ownerComponents", () => {
      const items: AncestryItem[] = [
        {
          elementName: "main",
          componentName: "Anonymous",
          filePath: "app/page.tsx",
          line: 50,
        },
        {
          elementName: "div",
          componentName: "App",
          filePath: "src/App.tsx",
          line: 1,
        },
      ];

      const result = formatAncestryChain(items);
      // "Anonymous" componentName should not be used as display name
      expect(result).toBe(
        `App at src/App.tsx:1
    └─ main at app/page.tsx:50`
      );
    });

    it("preserves named components when mixed with Anonymous", () => {
      const items: AncestryItem[] = [
        {
          elementName: "div",
          componentName: "Sidebar",
          filePath: "src/Sidebar.tsx",
          line: 20,
          ownerComponents: [
            { name: "Sidebar", filePath: "src/Sidebar.tsx", line: 20 },
            { name: "Anonymous" },
            { name: "GlassPanel", filePath: "src/GlassPanel.tsx", line: 5 },
          ],
        },
        { elementName: "div", componentName: "App", filePath: "src/App.tsx", line: 1 },
      ];

      const result = formatAncestryChain(items);
      // Anonymous in the middle is filtered, Sidebar (outer) and GlassPanel (inner) remain
      expect(result).toBe(
        `App at src/App.tsx:1
    └─ GlassPanel in Sidebar at src/Sidebar.tsx:20`
      );
    });
  });

  describe("truncateAtFirstFile", () => {
    it("keeps from clicked element up to first ancestor with filePath", () => {
      // Bottom-up: clicked element first, root last
      const items: AncestryItem[] = [
        { elementName: "span", componentName: "Button" },
        { elementName: "div", componentName: "Card" },
        { elementName: "div", componentName: "Layout", filePath: "src/Layout.tsx", line: 10 },
        { elementName: "div", componentName: "App", filePath: "src/App.tsx", line: 1 },
      ];

      const result = truncateAtFirstFile(items);
      expect(result).toEqual([
        { elementName: "span", componentName: "Button" },
        { elementName: "div", componentName: "Card" },
        { elementName: "div", componentName: "Layout", filePath: "src/Layout.tsx", line: 10 },
      ]);
    });

    it("when clicked element has filePath, keeps up to first different file", () => {
      const items: AncestryItem[] = [
        { elementName: "button", componentName: "Button", filePath: "src/Button.tsx", line: 5 },
        { elementName: "div", componentName: "Layout", filePath: "src/Layout.tsx", line: 10 },
        { elementName: "div", componentName: "App", filePath: "src/App.tsx", line: 1 },
      ];

      const result = truncateAtFirstFile(items);
      expect(result).toEqual([
        { elementName: "button", componentName: "Button", filePath: "src/Button.tsx", line: 5 },
        { elementName: "div", componentName: "Layout", filePath: "src/Layout.tsx", line: 10 },
      ]);
    });

    it("keeps all items in the same file plus first different-file ancestor", () => {
      const items: AncestryItem[] = [
        { elementName: "span", componentName: "Label", filePath: "src/Button.tsx", line: 20 },
        { elementName: "button", componentName: "Button", filePath: "src/Button.tsx", line: 5 },
        { elementName: "div", componentName: "Layout", filePath: "src/Layout.tsx", line: 10 },
        { elementName: "div", componentName: "App", filePath: "src/App.tsx", line: 1 },
      ];

      const result = truncateAtFirstFile(items);
      expect(result).toEqual([
        { elementName: "span", componentName: "Label", filePath: "src/Button.tsx", line: 20 },
        { elementName: "button", componentName: "Button", filePath: "src/Button.tsx", line: 5 },
        { elementName: "div", componentName: "Layout", filePath: "src/Layout.tsx", line: 10 },
      ]);
    });

    it("returns all items when all share the same file", () => {
      const items: AncestryItem[] = [
        { elementName: "span", filePath: "src/App.tsx", line: 10 },
        { elementName: "div", filePath: "src/App.tsx", line: 5 },
      ];

      const result = truncateAtFirstFile(items);
      expect(result).toEqual(items);
    });

    it("returns all items when none have a filePath", () => {
      const items: AncestryItem[] = [
        { elementName: "span", componentName: "A" },
        { elementName: "div", componentName: "B" },
      ];

      const result = truncateAtFirstFile(items);
      expect(result).toEqual(items);
    });

    it("uses serverComponents file path when filePath is missing", () => {
      const items: AncestryItem[] = [
        { elementName: "div", componentName: "TurnActivityBox", serverComponents: [{ name: "TurnActivityBox", filePath: "components/MessageRow.tsx", line: 921, type: "component" }] },
        { elementName: "div", componentName: "MessageRow", serverComponents: [{ name: "MessageRow", filePath: "components/chat/ChatViewport.tsx", line: 917, type: "component" }] },
        { elementName: "main", componentName: "Home", serverComponents: [{ name: "Home", filePath: "app/page.tsx", line: 817, type: "component" }] },
      ];

      const result = truncateAtFirstFile(items);
      expect(result).toEqual([
        items[0],
        items[1],
      ]);
    });

    it("uses serverComponents when clicked element has no filePath but has serverComponents", () => {
      const items: AncestryItem[] = [
        { elementName: "span", componentName: "Button" },
        { elementName: "div", componentName: "Card", serverComponents: [{ name: "Card", filePath: "src/Card.tsx", line: 10, type: "component" }] },
        { elementName: "div", componentName: "App", serverComponents: [{ name: "App", filePath: "src/App.tsx", line: 1, type: "component" }] },
      ];

      const result = truncateAtFirstFile(items);
      expect(result).toEqual([
        items[0],
        items[1],
      ]);
    });

    it("returns empty array for empty input", () => {
      expect(truncateAtFirstFile([])).toEqual([]);
    });
  });
});
