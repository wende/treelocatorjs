import { describe, expect, test, afterEach } from "vitest";
import { raiseElement } from "./raiseElement";

describe("raiseElement", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("null base returns null", () => {
    expect(raiseElement(null, 0)).toBe(null);
    expect(raiseElement(null, 3)).toBe(null);
  });

  test("level 0 returns base", () => {
    document.body.innerHTML = `<div id="wrap"><span id="inner">x</span></div>`;
    const inner = document.getElementById("inner") as HTMLElement;
    expect(raiseElement(inner, 0)).toBe(inner);
  });

  test("level N walks up N parents", () => {
    document.body.innerHTML = `
      <section id="a"><div id="b"><p id="c"><span id="d">x</span></p></div></section>
    `;
    const d = document.getElementById("d") as HTMLElement;
    expect(raiseElement(d, 1)).toBe(document.getElementById("c"));
    expect(raiseElement(d, 2)).toBe(document.getElementById("b"));
    expect(raiseElement(d, 3)).toBe(document.getElementById("a"));
  });

  test("clamps at <body> when the tree is shorter than the requested level", () => {
    document.body.innerHTML = `<div id="a"><span id="b">x</span></div>`;
    const b = document.getElementById("b") as HTMLElement;
    const a = document.getElementById("a") as HTMLElement;
    // Walking past <a> would reach <body>, so it clamps at <a>.
    expect(raiseElement(b, 5)).toBe(a);
  });

  test("a <body>-child base stays put (never climbs into <body>)", () => {
    document.body.innerHTML = `<div id="top">x</div>`;
    const top = document.getElementById("top") as HTMLElement;
    expect(raiseElement(top, 1)).toBe(top);
    expect(raiseElement(top, 10)).toBe(top);
  });

  test("stops before climbing into the locator's own elements", () => {
    document.body.innerHTML = `<div id="locatorjs-wrapper"><span id="child">x</span></div>`;
    const child = document.getElementById("child") as HTMLElement;
    // The parent (#locatorjs-wrapper) is the locator's own DOM, so the walk
    // refuses to step into it and returns the base unchanged.
    expect(raiseElement(child, 5)).toBe(child);
  });
});
