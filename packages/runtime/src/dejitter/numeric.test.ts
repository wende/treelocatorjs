import { describe, expect, test } from "vitest";
import {
  countReversals,
  detectBounce,
  extractNumeric,
  toNumericTimeline,
} from "./numeric";
import { analyzeFindings, detectJumpFindings } from "./detectors";
import { DEFAULT_CONFIG, type AnalysisContext, type TimelinePoint } from "./types";

describe("extractNumeric", () => {
  test("treats resting keywords as 0", () => {
    expect(extractNumeric("none")).toBe(0);
    expect(extractNumeric("")).toBe(0);
    expect(extractNumeric("auto")).toBe(0);
  });

  test("parses plain numeric values with units", () => {
    expect(extractNumeric("12.5px")).toBe(12.5);
    expect(extractNumeric("0.75")).toBe(0.75);
    expect(extractNumeric(-3)).toBe(-3);
  });

  test("extracts the dominant translation axis from matrix transforms", () => {
    expect(extractNumeric("matrix(1, 0, 0, 1, 40, 10)")).toBe(40);
    expect(extractNumeric("matrix(1, 0, 0, 1, 5, -30)")).toBe(-30);
  });

  test("returns null for unparsable values", () => {
    expect(extractNumeric("rgba(0,0,0,1)")).toBeNull();
    expect(extractNumeric("visible")).toBeNull();
  });
});

describe("toNumericTimeline", () => {
  test("drops unparsable points and keeps timestamps", () => {
    const timeline: TimelinePoint[] = [
      { t: 0, value: "0px" },
      { t: 16, value: "visible" },
      { t: 32, value: "10px" },
    ];
    expect(toNumericTimeline(timeline)).toEqual([
      { t: 0, val: 0 },
      { t: 32, val: 10 },
    ]);
  });
});

describe("detectBounce", () => {
  test("detects an out-and-back motion", () => {
    const bounce = detectBounce([
      { t: 0, value: "0px" },
      { t: 100, value: "20px" },
      { t: 200, value: "0px" },
    ]);
    expect(bounce).not.toBeNull();
    expect(bounce!.peakDeviation).toBe(20);
    expect(bounce!.duration).toBe(200);
  });

  test("returns null when start and end differ", () => {
    expect(
      detectBounce([
        { t: 0, value: "0px" },
        { t: 100, value: "20px" },
        { t: 200, value: "20px" },
      ])
    ).toBeNull();
  });

  test("returns null when the value never deviates", () => {
    expect(
      detectBounce([
        { t: 0, value: "5px" },
        { t: 100, value: "5px" },
        { t: 200, value: "5px" },
      ])
    ).toBeNull();
  });
});

describe("countReversals", () => {
  test("monotonic motion has zero reversals", () => {
    const numeric = [0, 1, 2, 3, 4].map((val, i) => ({ t: i * 16, val }));
    expect(countReversals(numeric, 0.01)).toBe(0);
  });

  test("zigzag motion counts each direction change", () => {
    const numeric = [0, 5, 0, 5, 0].map((val, i) => ({ t: i * 16, val }));
    expect(countReversals(numeric, 0.01)).toBe(3);
  });

  test("movements below minDelta are ignored", () => {
    const numeric = [0, 0.005, 0, 0.005, 0].map((val, i) => ({ t: i * 16, val }));
    expect(countReversals(numeric, 0.01)).toBe(0);
  });
});

describe("detectors", () => {
  function contextFor(
    timelines: Record<string, TimelinePoint[]>
  ): AnalysisContext {
    const props = Object.keys(timelines).map((key) => {
      const [elem, prop] = key.split("|") as [string, string];
      return { elem, prop, raw: timelines[key]!.length };
    });
    return {
      thresholds: DEFAULT_CONFIG.thresholds,
      propStats: { targetFrames: 10, props },
      elements: { e0: { tag: "div", cls: "", text: "" } },
      interactions: [],
      rawFrames: [],
      getTimeline: (elem, prop) => timelines[`${elem}|${prop}`] ?? [],
    };
  }

  test("detectJumpFindings flags a discontinuity against the typical step", () => {
    // Smooth 2px steps with one 400px teleport in the middle.
    const timeline: TimelinePoint[] = [];
    let val = 0;
    for (let i = 0; i < 20; i++) {
      val += i === 10 ? 400 : 2;
      timeline.push({ t: i * 16, value: `${val}px` });
    }
    const findings = detectJumpFindings(contextFor({ "e0|rect.x": timeline }), []);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.type).toBe("jump");
    expect(findings[0]!.jump.magnitude).toBe(400);
  });

  test("analyzeFindings reports smooth motion as clean", () => {
    const timeline: TimelinePoint[] = [];
    for (let i = 0; i < 20; i++) {
      timeline.push({ t: i * 16, value: `${i * 2}px` });
    }
    const findings = analyzeFindings(contextFor({ "e0|rect.x": timeline }));
    expect(findings).toHaveLength(0);
  });

  test("analyzeFindings sorts findings by severity", () => {
    // A shiver (oscillation) and a clean prop on the same element.
    const shiver: TimelinePoint[] = [];
    for (let i = 0; i < 30; i++) {
      shiver.push({ t: i * 16, value: `${i % 2 === 0 ? 0 : 8}px` });
    }
    const findings = analyzeFindings(contextFor({ "e0|rect.y": shiver }));
    expect(findings.length).toBeGreaterThan(0);
    const severities = findings.map((f) => f.severity);
    const order = { high: 0, medium: 1, low: 2, info: 3 } as const;
    const sorted = [...severities].sort((a, b) => order[a] - order[b]);
    expect(severities).toEqual(sorted);
  });
});
