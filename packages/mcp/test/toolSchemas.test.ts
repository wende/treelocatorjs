import { describe, expect, test } from "vitest";
import { getTreeSchema } from "../src/toolSchemas";

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
});
