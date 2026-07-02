import { describe, expect, test } from "vitest";
import { getTreeSchema, takeSnapshotSchema } from "../src/toolSchemas";

describe("toolSchemas", () => {
  describe("getTreeSchema", () => {
    test("accepts optional selector and tree bounds", () => {
      const result = getTreeSchema.safeParse({
        sessionId: "session-1",
        selector: "main",
        maxDepth: 4,
        maxNodes: 100,
        includeHidden: true,
        includeText: false,
      });

      expect(result.success).toBe(true);
    });

    test("rejects invalid tree bounds", () => {
      expect(
        getTreeSchema.safeParse({ maxDepth: -1 }).success
      ).toBe(false);
      expect(
        getTreeSchema.safeParse({ maxNodes: 0 }).success
      ).toBe(false);
      expect(
        getTreeSchema.safeParse({ includeHidden: "yes" }).success
      ).toBe(false);
    });
  });

  describe("takeSnapshotSchema", () => {
    test("accepts tree snapshot options", () => {
      const result = takeSnapshotSchema.safeParse({
        sessionId: "session-1",
        selector: "main",
        snapshotId: "baseline",
        maxDepth: 2,
        maxNodes: 100,
        includeHidden: true,
        includeText: false,
      });

      expect(result.success).toBe(true);
    });

    test("rejects invalid tree snapshot bounds", () => {
      expect(takeSnapshotSchema.safeParse({
        selector: "main",
        snapshotId: "baseline",
        maxDepth: -1,
      }).success).toBe(false);
      expect(takeSnapshotSchema.safeParse({
        selector: "main",
        snapshotId: "baseline",
        maxNodes: 0,
      }).success).toBe(false);
    });
  });
});
