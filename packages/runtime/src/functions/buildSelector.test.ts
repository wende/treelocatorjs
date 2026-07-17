import { describe, expect, test } from "vitest";
import { buildSelector } from "./buildSelector";

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

describe("buildSelector", () => {
  test("uses #id when present and unique", () => {
    mount(`<div><button id="submit">x</button></div>`);
    const el = document.getElementById("submit")!;
    const sel = buildSelector(el);
    expect(sel).toBe("button#submit");
    expect(document.querySelector(sel)).toBe(el);
  });

  test("falls back to classes when there is no id", () => {
    mount(`<div><span class="badge primary">x</span></div>`);
    const el = document.querySelector(".badge") as HTMLElement;
    const sel = buildSelector(el);
    expect(sel).toBe("span.badge.primary");
    expect(document.querySelector(sel)).toBe(el);
  });

  test("pins with :nth-of-type for identical siblings", () => {
    mount(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
    const items = Array.from(document.querySelectorAll("li"));
    const second = items[1]!;
    const sel = buildSelector(second);
    expect(document.querySelector(sel)).toBe(second);
    // Each sibling must resolve to a distinct selector.
    const sels = items.map((li) => buildSelector(li as HTMLElement));
    expect(new Set(sels).size).toBe(items.length);
  });

  test("climbs ancestors until the selector is globally unique", () => {
    mount(`
      <div id="a"><p class="row">one</p></div>
      <div id="b"><p class="row">two</p></div>
    `);
    const target = document.querySelectorAll(".row")[1] as HTMLElement;
    const sel = buildSelector(target);
    expect(document.querySelector(sel)).toBe(target);
    // The selector must disambiguate from the first .row.
    expect(document.querySelectorAll(sel)).toHaveLength(1);
  });

  test("never returns a selector that matches a different element", () => {
    mount(`<section><article class="card">x</article></section>`);
    const el = document.querySelector(".card") as HTMLElement;
    const sel = buildSelector(el);
    expect(document.querySelector(sel)).toBe(el);
  });
});
