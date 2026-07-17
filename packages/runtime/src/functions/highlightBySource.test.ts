import { describe, expect, test, vi } from "vitest";
import { highlightMatches } from "./highlightBySource";
import type { SourceMatch } from "./queryBySource";

const STUB_RECT = { x: 10, y: 10, width: 100, height: 30 };

function makeMatch(selector: string): SourceMatch {
  return {
    selector,
    tagName: "div",
    rect: STUB_RECT,
    path: null,
    ancestry: null,
    confidence: "high",
    matchStrategy: "path-attr",
  };
}

describe("highlightMatches", () => {
  test("draws an outline per matched element", () => {
    document.body.innerHTML = `<div id="a"></div><div id="b"></div>`;
    const before = document.querySelectorAll(".highlight-test-shadow-host, [data-treelocator-highlight]").length;

    const { count } = highlightMatches(
      [makeMatch("#a"), makeMatch("#b"), makeMatch("#does-not-exist")],
      60_000
    );

    expect(count).toBe(2);
    const host = document.querySelector('[data-treelocator-highlight="true"]');
    expect(host).not.toBeNull();
    expect(document.querySelectorAll(".outline").length).toBeGreaterThanOrEqual(before);
    document.body.removeChild(host!);
  });

  test("auto-removes the overlay after durationMs", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="x"></div>`;
    highlightMatches([makeMatch("#x")], 1000);
    expect(document.querySelector('[data-treelocator-highlight="true"]')).not.toBeNull();
    vi.advanceTimersByTime(1100);
    expect(document.querySelector('[data-treelocator-highlight="true"]')).toBeNull();
    vi.useRealTimers();
  });

  test("cancel() removes the overlay immediately", () => {
    document.body.innerHTML = `<div id="y"></div>`;
    const handle = highlightMatches([makeMatch("#y")], 60_000);
    handle.cancel();
    expect(document.querySelector('[data-treelocator-highlight="true"]')).toBeNull();
  });

  test("returns count:0 when no matches resolve", () => {
    const { count } = highlightMatches([makeMatch("#nope")], 1000);
    expect(count).toBe(0);
    expect(document.querySelector('[data-treelocator-highlight="true"]')).toBeNull();
  });
});