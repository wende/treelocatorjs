import { mergeRects } from "./mergeRects";
import { SimpleDOMRect } from "../types/types";
import { describe, expect, test } from "vitest";

describe("mergeRects", () => {
  test("basic overlapping rects", () => {
    const a: SimpleDOMRect = { x: 0, y: 0, width: 10, height: 10 };
    const b: SimpleDOMRect = { x: 5, y: 5, width: 10, height: 10 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(0);
    expect(res.y).toEqual(0);
    expect(res.width).toEqual(15);
    expect(res.height).toEqual(15);
  });

  test("non-overlapping rects side by side", () => {
    const a: SimpleDOMRect = { x: 0, y: 0, width: 10, height: 10 };
    const b: SimpleDOMRect = { x: 10, y: 0, width: 10, height: 10 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(0);
    expect(res.y).toEqual(0);
    expect(res.width).toEqual(20);
    expect(res.height).toEqual(10);
  });

  test("non-overlapping rects vertically separated", () => {
    const a: SimpleDOMRect = { x: 0, y: 0, width: 10, height: 10 };
    const b: SimpleDOMRect = { x: 0, y: 10, width: 10, height: 10 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(0);
    expect(res.y).toEqual(0);
    expect(res.width).toEqual(10);
    expect(res.height).toEqual(20);
  });

  test("identical rects", () => {
    const a: SimpleDOMRect = { x: 5, y: 5, width: 10, height: 10 };
    const b: SimpleDOMRect = { x: 5, y: 5, width: 10, height: 10 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(5);
    expect(res.y).toEqual(5);
    expect(res.width).toEqual(10);
    expect(res.height).toEqual(10);
  });

  test("one rect fully contains another", () => {
    const a: SimpleDOMRect = { x: 0, y: 0, width: 20, height: 20 };
    const b: SimpleDOMRect = { x: 5, y: 5, width: 10, height: 10 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(0);
    expect(res.y).toEqual(0);
    expect(res.width).toEqual(20);
    expect(res.height).toEqual(20);
  });

  test("small rect contains large rect", () => {
    const a: SimpleDOMRect = { x: 5, y: 5, width: 10, height: 10 };
    const b: SimpleDOMRect = { x: 0, y: 0, width: 20, height: 20 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(0);
    expect(res.y).toEqual(0);
    expect(res.width).toEqual(20);
    expect(res.height).toEqual(20);
  });

  test("zero-area rect (point)", () => {
    const a: SimpleDOMRect = { x: 5, y: 5, width: 0, height: 0 };
    const b: SimpleDOMRect = { x: 10, y: 10, width: 10, height: 10 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(5);
    expect(res.y).toEqual(5);
    expect(res.width).toEqual(15);
    expect(res.height).toEqual(15);
  });

  test("both rects have zero area", () => {
    const a: SimpleDOMRect = { x: 5, y: 5, width: 0, height: 0 };
    const b: SimpleDOMRect = { x: 10, y: 10, width: 0, height: 0 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(5);
    expect(res.y).toEqual(5);
    expect(res.width).toEqual(5);
    expect(res.height).toEqual(5);
  });

  test("negative coordinates", () => {
    const a: SimpleDOMRect = { x: -10, y: -10, width: 20, height: 20 };
    const b: SimpleDOMRect = { x: 5, y: 5, width: 10, height: 10 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(-10);
    expect(res.y).toEqual(-10);
    expect(res.width).toEqual(25);
    expect(res.height).toEqual(25);
  });

  test("both rects with negative coordinates", () => {
    const a: SimpleDOMRect = { x: -20, y: -20, width: 10, height: 10 };
    const b: SimpleDOMRect = { x: -15, y: -15, width: 10, height: 10 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(-20);
    expect(res.y).toEqual(-20);
    expect(res.width).toEqual(15);
    expect(res.height).toEqual(15);
  });

  test("rects with large coordinates", () => {
    const a: SimpleDOMRect = { x: 1000, y: 1000, width: 100, height: 100 };
    const b: SimpleDOMRect = { x: 1050, y: 1050, width: 100, height: 100 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(1000);
    expect(res.y).toEqual(1000);
    expect(res.width).toEqual(150);
    expect(res.height).toEqual(150);
  });

  test("rects with fractional coordinates and dimensions", () => {
    const a: SimpleDOMRect = { x: 1.5, y: 2.5, width: 3.5, height: 4.5 };
    const b: SimpleDOMRect = { x: 4, y: 5, width: 2, height: 2 };
    const res = mergeRects(a, b);
    expect(res.x).toEqual(1.5);
    expect(res.y).toEqual(2.5);
    expect(res.width).toEqual(4.5);
    expect(res.height).toEqual(4.5);
  });
});
