import { describe, expect, test } from "vitest";
import { getElementInfo, VueTreeNodeElement } from "./vueAdapter";
import type { ComponentInternalInstance } from "vue";

function createMockVueElement(
  props?: { file?: string; name?: string } | null
): HTMLElement & { __vueParentComponent?: ComponentInternalInstance } {
  const el = document.createElement("div") as any;
  el.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    top: 0,
    left: 0,
    right: 100,
    bottom: 50,
    toJSON: () => ({}),
  });

  if (props) {
    el.__vueParentComponent = {
      type: {
        __file: props.file,
        __name: props.name,
      },
    } as ComponentInternalInstance;
  }

  return el;
}

describe("Vue Adapter - getElementInfo", () => {
  test("returns null when element has no __vueParentComponent", () => {
    const el = createMockVueElement(null);
    expect(getElementInfo(el)).toBeNull();
  });

  test("returns FullElementInfo with correct filePath when __vueParentComponent has type.__file", () => {
    const el = createMockVueElement({
      file: "/src/MyComponent.vue",
      name: "MyComponent",
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.link!.filePath).toBe("/src/MyComponent.vue");
  });

  test("returns FullElementInfo with correct component name when __vueParentComponent has type.__name", () => {
    const el = createMockVueElement({
      file: "/src/Button.vue",
      name: "Button",
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.componentsLabels[0]!.label).toBe("Button");
  });

  test("returns null when __vueParentComponent.type is missing", () => {
    const el = createMockVueElement(null);
    el.__vueParentComponent = {} as ComponentInternalInstance;
    expect(getElementInfo(el)).toBeNull();
  });

  test("returns null when __vueParentComponent.type.__file is missing", () => {
    const el = createMockVueElement(null);
    el.__vueParentComponent = {
      type: { __name: "MyComponent" },
    } as ComponentInternalInstance;
    expect(getElementInfo(el)).toBeNull();
  });

  test("returns null when __vueParentComponent.type.__name is missing", () => {
    const el = createMockVueElement(null);
    el.__vueParentComponent = {
      type: { __file: "/src/MyComponent.vue" },
    } as ComponentInternalInstance;
    expect(getElementInfo(el)).toBeNull();
  });

  test("returns FullElementInfo with htmlElement pointing to the correct element", () => {
    const el = createMockVueElement({
      file: "/src/Card.vue",
      name: "Card",
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.htmlElement).toBe(el);
  });

  test("returns FullElementInfo with element label as lowercase nodeName", () => {
    const el = createMockVueElement({
      file: "/src/Button.vue",
      name: "Button",
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.label).toBe("div"); // createElement creates a div
  });

  test("returns FullElementInfo with default line and column of 1", () => {
    const el = createMockVueElement({
      file: "/src/App.vue",
      name: "App",
    });

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.thisElement.link!.line).toBe(1);
    expect(info!.thisElement.link!.column).toBe(1);
  });

  test("handles nested Vue component structure with subTree", () => {
    const el = createMockVueElement({
      file: "/src/Layout.vue",
      name: "Layout",
    });

    // Add a mock subTree (though getElementInfo doesn't use it in the basic case)
    (el.__vueParentComponent as any).subTree = { el };

    const info = getElementInfo(el);
    expect(info).not.toBeNull();
    expect(info!.componentsLabels[0]!.label).toBe("Layout");
  });
});

describe("VueTreeNodeElement.getSource", () => {
  test("returns null when element has no __vueParentComponent", () => {
    const el = createMockVueElement(null);
    const node = new VueTreeNodeElement(el);
    expect(node.getSource()).toBeNull();
  });

  test("returns Source with correct fileName from __vueParentComponent.type.__file", () => {
    const el = createMockVueElement({
      file: "/src/MyComponent.vue",
      name: "MyComponent",
    });

    const node = new VueTreeNodeElement(el);
    const source = node.getSource();

    expect(source).not.toBeNull();
    expect(source!.fileName).toBe("/src/MyComponent.vue");
  });

  test("returns Source with lineNumber and columnNumber of 1", () => {
    const el = createMockVueElement({
      file: "/src/Button.vue",
      name: "Button",
    });

    const node = new VueTreeNodeElement(el);
    const source = node.getSource();

    expect(source).not.toBeNull();
    expect(source!.lineNumber).toBe(1);
    expect(source!.columnNumber).toBe(1);
  });

  test("returns null when __vueParentComponent.type is missing", () => {
    const el = createMockVueElement(null);
    el.__vueParentComponent = {} as ComponentInternalInstance;
    const node = new VueTreeNodeElement(el);
    expect(node.getSource()).toBeNull();
  });

  test("returns null when __vueParentComponent.type.__file is missing", () => {
    const el = createMockVueElement(null);
    el.__vueParentComponent = {
      type: { __name: "MyComponent" },
    } as ComponentInternalInstance;
    const node = new VueTreeNodeElement(el);
    expect(node.getSource()).toBeNull();
  });

  test("returns Source from different Vue components", () => {
    const el1 = createMockVueElement({
      file: "/src/Header.vue",
      name: "Header",
    });
    const el2 = createMockVueElement({
      file: "/src/Footer.vue",
      name: "Footer",
    });

    const node1 = new VueTreeNodeElement(el1);
    const node2 = new VueTreeNodeElement(el2);

    const source1 = node1.getSource();
    const source2 = node2.getSource();

    expect(source1!.fileName).toBe("/src/Header.vue");
    expect(source2!.fileName).toBe("/src/Footer.vue");
  });
});

describe("VueTreeNodeElement.getComponent", () => {
  test("always returns null", () => {
    const el = createMockVueElement({
      file: "/src/MyComponent.vue",
      name: "MyComponent",
    });

    const node = new VueTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });

  test("returns null even when __vueParentComponent is present", () => {
    const el = createMockVueElement({
      file: "/src/Button.vue",
      name: "Button",
    });

    const node = new VueTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });

  test("returns null when element has no __vueParentComponent", () => {
    const el = createMockVueElement(null);
    const node = new VueTreeNodeElement(el);
    expect(node.getComponent()).toBeNull();
  });
});

describe("VueTreeNodeElement inheritance and structure", () => {
  test("extends HtmlElementTreeNode with custom getSource and getComponent", () => {
    const el = createMockVueElement({
      file: "/src/App.vue",
      name: "App",
    });

    const node = new VueTreeNodeElement(el);

    // Should inherit from HtmlElementTreeNode
    expect(node.type).toBe("element");
    expect(node.name).toBe("div");
    expect(node.element).toBe(el);
  });

  test("getBox returns element's bounding client rect", () => {
    const el = createMockVueElement({
      file: "/src/App.vue",
      name: "App",
    });

    const node = new VueTreeNodeElement(el);
    const box = node.getBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBe(100);
    expect(box!.height).toBe(50);
  });
});
