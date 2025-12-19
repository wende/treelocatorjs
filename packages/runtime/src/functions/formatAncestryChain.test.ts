import { describe, it, expect } from "vitest";
import {
  AncestryItem,
  formatAncestryChain,
  collectAncestry,
} from "./formatAncestryChain";

describe("formatAncestryChain", () => {
  it("formats basic ancestry without ID or nth-child", () => {
    const items: AncestryItem[] = [
      { elementName: "button", componentName: "Button" },
      { elementName: "div", componentName: "App" },
    ];

    const result = formatAncestryChain(items);
    expect(result).toBe(
      `div in App
    └─ button in Button`
    );
  });

  it("includes ID when present", () => {
    const items: AncestryItem[] = [
      { elementName: "button", componentName: "Button", id: "submit-btn" },
      { elementName: "div", componentName: "App" },
    ];

    const result = formatAncestryChain(items);
    expect(result).toBe(
      `div in App
    └─ button#submit-btn in Button`
    );
  });

  it("includes nth-child when present", () => {
    const items: AncestryItem[] = [
      { elementName: "li", componentName: "ListItem", nthChild: 3 },
      { elementName: "ul", componentName: "List" },
    ];

    const result = formatAncestryChain(items);
    expect(result).toBe(
      `ul in List
    └─ li:nth-child(3) in ListItem`
    );
  });

  it("includes both nth-child and ID when present", () => {
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
      `ul in List
    └─ li:nth-child(2)#special-item in ListItem`
    );
  });

  it("includes file location when present", () => {
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
    expect(result).toBe("button#save in Button at src/Button.tsx:42");
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

  it("shows all owner components when ownerComponents is provided", () => {
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
    expect(result).toBe(
      `div in App at src/App.jsx:104
    └─ div#sidebar-panel in Sidebar > GlassPanel at src/components/game/Sidebar.jsx:78`
    );
  });

  it("shows single owner component without arrow when only one in chain", () => {
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
    expect(result).toBe("button in Button at src/Button.tsx:10");
  });
});
