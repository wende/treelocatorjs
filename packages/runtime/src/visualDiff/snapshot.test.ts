import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { takeSnapshot, MAX_SNAPSHOT_ELEMENTS } from "./snapshot";

function stubRect(el: Element, rect: Partial<DOMRect>): void {
  const full: DOMRect = {
    x: rect.x ?? 0,
    y: rect.y ?? 0,
    width: rect.width ?? 100,
    height: rect.height ?? 100,
    top: rect.y ?? 0,
    left: rect.x ?? 0,
    right: (rect.x ?? 0) + (rect.width ?? 100),
    bottom: (rect.y ?? 0) + (rect.height ?? 100),
    toJSON() {
      return this;
    },
  };
  el.getBoundingClientRect = () => full;
}

describe("takeSnapshot", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 720,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("returns ElementSnapshot array with expected fields", () => {
    const div = document.createElement("div");
    div.id = "hello";
    div.className = "foo bar";
    div.textContent = "Hi there";
    document.body.appendChild(div);
    stubRect(div, { x: 10, y: 20, width: 100, height: 50 });

    const snaps = takeSnapshot();
    const found = snaps.find((s) => s.id === "hello");
    expect(found).toBeDefined();
    expect(found!.tagName).toBe("div");
    expect(found!.classes).toEqual(["foo", "bar"]);
    expect(found!.x).toBe(10);
    expect(found!.y).toBe(20);
    expect(found!.width).toBe(100);
    expect(found!.height).toBe(50);
    expect(found!.text).toBe("Hi there");
    expect(found!.visible).toBe(true);
    expect(found!.inViewport).toBe(true);
    expect(typeof found!.key).toBe("string");
  });

  test("excludes elements inside #locatorjs-wrapper", () => {
    const wrapper = document.createElement("div");
    wrapper.id = "locatorjs-wrapper";
    const child = document.createElement("span");
    child.id = "overlay-child";
    wrapper.appendChild(child);
    document.body.appendChild(wrapper);
    stubRect(child, { x: 0, y: 0, width: 50, height: 50 });

    const snaps = takeSnapshot();
    expect(snaps.find((s) => s.id === "overlay-child")).toBeUndefined();
    expect(snaps.find((s) => s.id === "locatorjs-wrapper")).toBeUndefined();
  });

  test("elements outside viewport have inViewport: false and are skipped", () => {
    const div = document.createElement("div");
    div.id = "off-screen";
    document.body.appendChild(div);
    stubRect(div, { x: 5000, y: 5000, width: 100, height: 100 });

    const snaps = takeSnapshot();
    expect(snaps.find((s) => s.id === "off-screen")).toBeUndefined();
  });

  test("text is trimmed and capped at 80 chars", () => {
    const div = document.createElement("div");
    div.id = "long-text";
    div.textContent = "   " + "x".repeat(200) + "   ";
    document.body.appendChild(div);
    stubRect(div, { x: 0, y: 0, width: 100, height: 100 });

    const snaps = takeSnapshot();
    const found = snaps.find((s) => s.id === "long-text");
    expect(found).toBeDefined();
    expect(found!.text!.length).toBe(80);
    expect(found!.text!.startsWith("x")).toBe(true);
  });

  test("display:none elements have visible: false", () => {
    const div = document.createElement("div");
    div.id = "hidden";
    div.style.display = "none";
    document.body.appendChild(div);
    stubRect(div, { x: 0, y: 0, width: 100, height: 100 });

    const snaps = takeSnapshot();
    const found = snaps.find((s) => s.id === "hidden");
    expect(found?.visible).toBe(false);
  });

  test("disabled form elements have disabled: true", () => {
    const btn = document.createElement("button");
    btn.id = "btn";
    btn.disabled = true;
    document.body.appendChild(btn);
    stubRect(btn, { x: 0, y: 0, width: 80, height: 30 });

    const snaps = takeSnapshot();
    const found = snaps.find((s) => s.id === "btn");
    expect(found?.disabled).toBe(true);
  });

  test("caps at MAX_SNAPSHOT_ELEMENTS", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    for (let i = 0; i < MAX_SNAPSHOT_ELEMENTS + 200; i++) {
      const d = document.createElement("div");
      document.body.appendChild(d);
      stubRect(d, { x: 0, y: 0, width: 10, height: 10 });
    }
    const snaps = takeSnapshot();
    expect(snaps.length).toBeLessThanOrEqual(MAX_SNAPSHOT_ELEMENTS);
  });

  test("text is only captured for leaf elements (no element children)", () => {
    const parent = document.createElement("div");
    parent.id = "parent";
    const child = document.createElement("span");
    child.id = "child";
    child.textContent = "leaf text";
    parent.appendChild(child);
    document.body.appendChild(parent);
    stubRect(parent, { x: 0, y: 0, width: 100, height: 100 });
    stubRect(child, { x: 0, y: 0, width: 50, height: 20 });

    const snaps = takeSnapshot();
    const parentSnap = snaps.find((s) => s.id === "parent");
    const childSnap = snaps.find((s) => s.id === "child");
    expect(parentSnap?.text).toBeUndefined();
    expect(childSnap?.text).toBe("leaf text");
  });

  test("scoped snapshot only includes root + descendants", () => {
    const outside = document.createElement("div");
    outside.id = "outside";
    document.body.appendChild(outside);
    stubRect(outside, { x: 0, y: 0, width: 100, height: 100 });

    const root = document.createElement("div");
    root.id = "root";
    const child = document.createElement("span");
    child.id = "inside-child";
    root.appendChild(child);
    document.body.appendChild(root);
    stubRect(root, { x: 10, y: 10, width: 100, height: 100 });
    stubRect(child, { x: 10, y: 10, width: 50, height: 20 });

    const snaps = takeSnapshot(root);
    const ids = snaps.map((s) => s.id).filter(Boolean);
    expect(ids).toContain("root");
    expect(ids).toContain("inside-child");
    expect(ids).not.toContain("outside");
  });

  test("strips locatorjs-* classes from the classes array", () => {
    const div = document.createElement("div");
    div.id = "with-locator-class";
    div.className = "foo locatorjs-active-pointer bar";
    document.body.appendChild(div);
    stubRect(div, { x: 0, y: 0, width: 50, height: 50 });

    const snaps = takeSnapshot();
    const found = snaps.find((s) => s.id === "with-locator-class");
    expect(found?.classes).toEqual(["foo", "bar"]);
  });

  test("assigns stable keys for the same element across snapshots", () => {
    const div = document.createElement("div");
    div.id = "stable";
    document.body.appendChild(div);
    stubRect(div, { x: 0, y: 0, width: 50, height: 50 });

    const a = takeSnapshot();
    const b = takeSnapshot();
    const aKey = a.find((s) => s.id === "stable")!.key;
    const bKey = b.find((s) => s.id === "stable")!.key;
    expect(aKey).toBe(bKey);
  });
});
