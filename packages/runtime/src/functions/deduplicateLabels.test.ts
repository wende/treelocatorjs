import { describe, expect, test } from "vitest";
import { deduplicateLabels } from "./deduplicateLabels";
import { LabelData } from "../types/LabelData";

describe("deduplicateLabels", () => {
  test("returns empty array for empty input", () => {
    const result = deduplicateLabels([]);
    expect(result).toEqual([]);
  });

  test("returns same array when no duplicates", () => {
    const labels: LabelData[] = [
      { label: "Button", link: null },
      { label: "Header", link: null },
    ];
    const result = deduplicateLabels(labels);
    expect(result).toEqual(labels);
  });

  test("removes duplicate labels with same link", () => {
    const label1: LabelData = { label: "Button", link: null };
    const label2: LabelData = { label: "Button", link: null };
    const labels = [label1, label2];
    const result = deduplicateLabels(labels);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(label1);
  });

  test("keeps labels with different link properties", () => {
    const link1 = { filePath: "Button.tsx", projectPath: "/src", line: 1, column: 1 };
    const link2 = { filePath: "Header.tsx", projectPath: "/src", line: 1, column: 1 };
    const labels: LabelData[] = [
      { label: "Button", link: link1 },
      { label: "Button", link: link2 },
    ];
    const result = deduplicateLabels(labels);
    expect(result).toHaveLength(2);
  });

  test("removes duplicate labels with same link object", () => {
    const link = { filePath: "Button.tsx", projectPath: "/src", line: 1, column: 1 };
    const labels: LabelData[] = [
      { label: "Button", link },
      { label: "Button", link },
    ];
    const result = deduplicateLabels(labels);
    expect(result).toHaveLength(1);
  });

  test("handles multiple duplicates", () => {
    const labels: LabelData[] = [
      { label: "Button", link: null },
      { label: "Button", link: null },
      { label: "Header", link: null },
      { label: "Header", link: null },
      { label: "Button", link: null },
    ];
    const result = deduplicateLabels(labels);
    expect(result).toHaveLength(2);
    expect(result.map((l) => l.label)).toEqual(["Button", "Header"]);
  });

  test("preserves order of first occurrence", () => {
    const labels: LabelData[] = [
      { label: "C", link: null },
      { label: "A", link: null },
      { label: "B", link: null },
      { label: "A", link: null },
      { label: "C", link: null },
    ];
    const result = deduplicateLabels(labels);
    expect(result.map((l) => l.label)).toEqual(["C", "A", "B"]);
  });

  test("handles complex link objects with same values", () => {
    const labels: LabelData[] = [
      {
        label: "Component",
        link: { filePath: "App.tsx", projectPath: "/src", line: 10, column: 5 },
      },
      {
        label: "Component",
        link: { filePath: "App.tsx", projectPath: "/src", line: 10, column: 5 },
      },
    ];
    const result = deduplicateLabels(labels);
    expect(result).toHaveLength(1);
  });

  test("distinguishes between link null and link with values", () => {
    const labels: LabelData[] = [
      { label: "Button", link: null },
      { label: "Button", link: { filePath: "Button.tsx", projectPath: "/src", line: 1, column: 1 } },
    ];
    const result = deduplicateLabels(labels);
    expect(result).toHaveLength(2);
  });

  test("handles single label", () => {
    const labels: LabelData[] = [{ label: "Button", link: null }];
    const result = deduplicateLabels(labels);
    expect(result).toEqual(labels);
  });

  test("returns correct instances", () => {
    const label1: LabelData = { label: "Button", link: null };
    const label2: LabelData = { label: "Header", link: null };
    const label3: LabelData = { label: "Button", link: null };
    const labels = [label1, label2, label3];
    const result = deduplicateLabels(labels);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(label1);
    expect(result[1]).toBe(label2);
  });
});
