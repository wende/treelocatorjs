import { afterEach, describe, expect, test } from "vitest";
import { getElementInfo, JSXTreeNodeElement } from "./jsxAdapter";

function makeElement(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement("div");
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

afterEach(() => {
  delete (window as any).__LOCATOR_DATA__;
});

// ---------------------------------------------------------------------------
// getElementInfo
// ---------------------------------------------------------------------------

describe("getElementInfo", () => {
  test("returns null when element has no data-locatorjs attributes", () => {
    const el = makeElement({ class: "foo" });
    expect(getElementInfo(el)).toBeNull();
  });

  test("returns FullElementInfo from data-locatorjs path attribute (no __LOCATOR_DATA__)", () => {
    // Format: /project/src/Button.tsx:10:5
    const el = makeElement({ "data-locatorjs": "/project/src/Button.tsx:10:5" });
    document.body.appendChild(el);

    const info = getElementInfo(el);
    expect(info).not.toBeNull();

    // splitFullPath splits on /src/ → projectPath="/project", filePath="/src/Button.tsx"
    expect(info!.thisElement.link).toMatchObject({
      filePath: "/src/Button.tsx",
      projectPath: "/project",
      line: 10,
      column: 6, // column + 1
    });
    expect(info!.htmlElement).toBe(el);

    document.body.removeChild(el);
  });

  test("returns FullElementInfo using fileData from __LOCATOR_DATA__ when data-locatorjs-id is set", () => {
    const fileFullPath = "/project/src/Button.tsx";
    const fileData = {
      filePath: "/src/Button.tsx",
      projectPath: "/project",
      expressions: [
        {
          name: "Button",
          loc: { start: { line: 5, column: 2 }, end: { line: 5, column: 10 } },
          wrappingComponentId: null,
        },
      ],
      components: [],
      styledDefinitions: [],
    };
    (window as any).__LOCATOR_DATA__ = { [fileFullPath]: fileData };

    const el = makeElement({ "data-locatorjs-id": `${fileFullPath}::0` });
    document.body.appendChild(el);

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.link).toMatchObject({
      filePath: "/src/Button.tsx",
      projectPath: "/project",
      line: 5,
      column: 3,
    });
    expect(info!.thisElement.label).toBe("Button");

    document.body.removeChild(el);
  });

  test("finds attributes on nearest ancestor via closest()", () => {
    const parent = makeElement({
      "data-locatorjs": "/project/src/Layout.tsx:20:0",
    });
    const child = makeElement();
    parent.appendChild(child);
    document.body.appendChild(parent);

    const info = getElementInfo(child);
    expect(info).not.toBeNull();
    expect(info!.thisElement.link).toMatchObject({
      line: 20,
      column: 1,
    });
    expect(info!.htmlElement).toBe(parent);

    document.body.removeChild(parent);
  });

  test("returns null when data-locatorjs attribute has malformed path (only one colon)", () => {
    // parseDataPath returns null for a path with only one colon
    const el = makeElement({ "data-locatorjs": "/project/src/Button.tsx:10" });
    document.body.appendChild(el);
    const info = getElementInfo(el);
    expect(info).toBeNull();
    document.body.removeChild(el);
  });
});

// ---------------------------------------------------------------------------
// JSXTreeNodeElement.getSource
// ---------------------------------------------------------------------------

describe("JSXTreeNodeElement.getSource", () => {
  test("returns null when element has no data-locatorjs attributes", () => {
    const el = makeElement();
    const node = new JSXTreeNodeElement(el);
    expect(node.getSource()).toBeNull();
  });

  test("returns Source from data-locatorjs attribute without __LOCATOR_DATA__", () => {
    const el = makeElement({ "data-locatorjs": "/project/src/App.tsx:15:3" });
    const node = new JSXTreeNodeElement(el);

    const source = node.getSource();
    expect(source).not.toBeNull();
    expect(source).toMatchObject({
      fileName: "/src/App.tsx",
      projectPath: "/project",
      lineNumber: 15,
      columnNumber: 4, // column + 1
    });
  });

  test("returns Source using fileData from __LOCATOR_DATA__ when data-locatorjs-id is set", () => {
    const fileFullPath = "/project/src/App.tsx";
    const fileData = {
      filePath: "/src/App.tsx",
      projectPath: "/project",
      expressions: [
        {
          name: "App",
          loc: { start: { line: 8, column: 4 }, end: { line: 8, column: 12 } },
          wrappingComponentId: null,
        },
      ],
      components: [],
      styledDefinitions: [],
    };
    (window as any).__LOCATOR_DATA__ = { [fileFullPath]: fileData };

    const el = makeElement({ "data-locatorjs-id": `${fileFullPath}::0` });
    const node = new JSXTreeNodeElement(el);

    const source = node.getSource();
    expect(source).not.toBeNull();
    expect(source).toMatchObject({
      fileName: "/src/App.tsx",
      projectPath: "/project",
      lineNumber: 8,
      columnNumber: 5,
    });
  });
});

// ---------------------------------------------------------------------------
// JSXTreeNodeElement.getComponent
// ---------------------------------------------------------------------------

describe("JSXTreeNodeElement.getComponent", () => {
  test("returns null when element has no data-locatorjs attributes", () => {
    const el = makeElement();
    const node = new JSXTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });

  test("returns null when __LOCATOR_DATA__ is not set (no fileData)", () => {
    const el = makeElement({ "data-locatorjs": "/project/src/Card.tsx:5:0" });
    const node = new JSXTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });

  test("returns null when expression has no wrappingComponentId", () => {
    const fileFullPath = "/project/src/Card.tsx";
    (window as any).__LOCATOR_DATA__ = {
      [fileFullPath]: {
        filePath: "/src/Card.tsx",
        projectPath: "/project",
        expressions: [
          {
            name: "div",
            loc: { start: { line: 3, column: 0 }, end: { line: 3, column: 5 } },
            wrappingComponentId: null,
          },
        ],
        components: [],
        styledDefinitions: [],
      },
    };

    const el = makeElement({ "data-locatorjs-id": `${fileFullPath}::0` });
    const node = new JSXTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });

  test("returns TreeNodeComponent when fileData and wrappingComponentId are present", () => {
    const fileFullPath = "/project/src/Form.tsx";
    (window as any).__LOCATOR_DATA__ = {
      [fileFullPath]: {
        filePath: "/src/Form.tsx",
        projectPath: "/project",
        expressions: [
          {
            name: "input",
            loc: { start: { line: 12, column: 4 }, end: { line: 12, column: 12 } },
            wrappingComponentId: 0,
          },
        ],
        components: [
          {
            name: "Form",
            loc: { start: { line: 1, column: 0 }, end: { line: 20, column: 1 } },
          },
        ],
        styledDefinitions: [],
      },
    };

    const el = makeElement({ "data-locatorjs-id": `${fileFullPath}::0` });
    const node = new JSXTreeNodeElement(el);

    const component = node.getComponent();
    expect(component).not.toBeNull();
    expect(component!.label).toBe("Form");
    expect(component!.definitionLink).toMatchObject({
      fileName: "/src/Form.tsx",
      projectPath: "/project",
      lineNumber: 1,
      columnNumber: 1,
    });
  });
});
