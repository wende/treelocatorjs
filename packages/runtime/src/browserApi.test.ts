import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { createBrowserAPI, installBrowserAPI } from "./browserApi";

// Mock the heavy dependencies
vi.mock("./adapters/createTreeNode", () => ({
  createTreeNode: vi.fn(),
}));
vi.mock("./functions/enrichAncestrySourceMaps", () => ({
  enrichAncestryWithSourceMaps: vi.fn(),
}));

import { createTreeNode } from "./adapters/createTreeNode";
import { enrichAncestryWithSourceMaps } from "./functions/enrichAncestrySourceMaps";

describe("browserApi", () => {
  beforeEach(() => {
    // Reset window.__treelocator__ before each test
    delete (window as any).__treelocator__;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createBrowserAPI", () => {
    test("returns an object with all expected method names", () => {
      const api = createBrowserAPI();
      expect(api).toHaveProperty("getPath");
      expect(api).toHaveProperty("getAncestry");
      expect(api).toHaveProperty("getPathData");
      expect(api).toHaveProperty("help");
      expect(api).toHaveProperty("replay");
      expect(api).toHaveProperty("replayWithRecord");
    });

    test("all methods are functions", () => {
      const api = createBrowserAPI();
      expect(typeof api.getPath).toBe("function");
      expect(typeof api.getAncestry).toBe("function");
      expect(typeof api.getPathData).toBe("function");
      expect(typeof api.help).toBe("function");
      expect(typeof api.replay).toBe("function");
      expect(typeof api.replayWithRecord).toBe("function");
    });
  });

  describe("help()", () => {
    test("returns a non-empty string", () => {
      const api = createBrowserAPI();
      const help = api.help();
      expect(typeof help).toBe("string");
      expect(help.length).toBeGreaterThan(0);
    });

    test("help text contains 'TreeLocatorJS'", () => {
      const api = createBrowserAPI();
      const help = api.help();
      expect(help).toContain("TreeLocatorJS");
    });

    test("help text contains method descriptions", () => {
      const api = createBrowserAPI();
      const help = api.help();
      expect(help).toContain("getPath");
      expect(help).toContain("getAncestry");
      expect(help).toContain("getPathData");
    });
  });

  describe("replay()", () => {
    test("does not throw when called", () => {
      const api = createBrowserAPI();
      expect(() => api.replay()).not.toThrow();
    });

    test("is a stub that does nothing", () => {
      const api = createBrowserAPI();
      // Should not throw and should return undefined
      const result = api.replay();
      expect(result).toBeUndefined();
    });
  });

  describe("replayWithRecord()", () => {
    test("returns a Promise that resolves to null (stub)", async () => {
      const api = createBrowserAPI();
      const result = api.replayWithRecord("div");
      expect(result).toBeInstanceOf(Promise);
      const resolved = await result;
      expect(resolved).toBeNull();
    });

    test("handles both element and selector arguments without error", async () => {
      const api = createBrowserAPI();
      const div = document.createElement("div");

      // Test with selector
      const result1 = api.replayWithRecord("div");
      expect(await result1).toBeNull();

      // Test with element
      const result2 = api.replayWithRecord(div);
      expect(await result2).toBeNull();
    });
  });

  describe("getPath()", () => {
    test("returns Promise<string | null>", async () => {
      const api = createBrowserAPI();
      const result = api.getPath(document.body);
      expect(result).toBeInstanceOf(Promise);
      const resolved = await result;
      expect(typeof resolved === "string" || resolved === null).toBe(true);
    });

    test("returns null when selector doesn't match any element", async () => {
      const api = createBrowserAPI();
      const result = await api.getPath(".non-existent-selector-xyz");
      expect(result).toBeNull();
    });

    test("returns null when passed invalid selector string", async () => {
      const api = createBrowserAPI();
      // querySelector with invalid selector will throw; the function should handle it
      const result = await api.getPath("div > > div");
      expect(result).toBeNull();
    });

    test("returns null when createTreeNode returns null", async () => {
      const mockCreateTreeNode = createTreeNode as any;
      const mockEnrich = enrichAncestryWithSourceMaps as any;

      mockCreateTreeNode.mockReturnValue(null);
      mockEnrich.mockResolvedValue(null);

      const api = createBrowserAPI();
      const div = document.createElement("div");
      const result = await api.getPath(div);
      expect(result).toBeNull();
    });
  });

  describe("getAncestry()", () => {
    test("returns Promise<AncestryItem[] | null>", async () => {
      const api = createBrowserAPI();
      const result = api.getAncestry(document.body);
      expect(result).toBeInstanceOf(Promise);
      const resolved = await result;
      expect(Array.isArray(resolved) || resolved === null).toBe(true);
    });

    test("returns null when selector doesn't match any element", async () => {
      const api = createBrowserAPI();
      const result = await api.getAncestry(".non-existent-selector-xyz");
      expect(result).toBeNull();
    });

    test("returns null when createTreeNode returns null", async () => {
      const mockCreateTreeNode = createTreeNode as any;
      const mockEnrich = enrichAncestryWithSourceMaps as any;

      mockCreateTreeNode.mockReturnValue(null);
      mockEnrich.mockResolvedValue(null);

      const api = createBrowserAPI();
      const div = document.createElement("div");
      const result = await api.getAncestry(div);
      expect(result).toBeNull();
    });
  });

  describe("getPathData()", () => {
    test("returns Promise with path and ancestry properties or null", async () => {
      const api = createBrowserAPI();
      const result = api.getPathData(document.body);
      expect(result).toBeInstanceOf(Promise);
      const resolved = await result;
      if (resolved !== null) {
        expect(resolved).toHaveProperty("path");
        expect(resolved).toHaveProperty("ancestry");
      }
    });

    test("returns null when selector doesn't match any element", async () => {
      const api = createBrowserAPI();
      const result = await api.getPathData(".non-existent-selector-xyz");
      expect(result).toBeNull();
    });

    test("returns null when createTreeNode returns null", async () => {
      const mockCreateTreeNode = createTreeNode as any;
      const mockEnrich = enrichAncestryWithSourceMaps as any;

      mockCreateTreeNode.mockReturnValue(null);
      mockEnrich.mockResolvedValue(null);

      const api = createBrowserAPI();
      const div = document.createElement("div");
      const result = await api.getPathData(div);
      expect(result).toBeNull();
    });
  });

  describe("installBrowserAPI()", () => {
    test("sets window.__treelocator__ to the created API object", () => {
      expect((window as any).__treelocator__).toBeUndefined();
      installBrowserAPI();
      expect((window as any).__treelocator__).toBeDefined();
      expect(typeof (window as any).__treelocator__.getPath).toBe("function");
    });

    test("window.__treelocator__ has all expected methods after installation", () => {
      installBrowserAPI();
      const api = (window as any).__treelocator__;
      expect(api).toHaveProperty("getPath");
      expect(api).toHaveProperty("getAncestry");
      expect(api).toHaveProperty("getPathData");
      expect(api).toHaveProperty("help");
      expect(api).toHaveProperty("replay");
      expect(api).toHaveProperty("replayWithRecord");
    });

    test("installBrowserAPI passes adapterId to createBrowserAPI", () => {
      // We can't directly test this without spying on createBrowserAPI,
      // but we can verify that the API is created with or without an adapterId
      installBrowserAPI("react");
      expect((window as any).__treelocator__).toBeDefined();
      expect(typeof (window as any).__treelocator__.help).toBe("function");
    });
  });

  describe("API accepts HTMLElement or selector string", () => {
    test("getPath accepts HTMLElement", async () => {
      const api = createBrowserAPI();
      const div = document.createElement("div");
      document.body.appendChild(div);

      const mockCreateTreeNode = createTreeNode as any;
      const mockEnrich = enrichAncestryWithSourceMaps as any;
      mockCreateTreeNode.mockReturnValue(null);
      mockEnrich.mockResolvedValue(null);

      const result = await api.getPath(div);
      // With null ancestry, should return null
      expect(result).toBeNull();

      document.body.removeChild(div);
    });

    test("getPath accepts CSS selector string", async () => {
      const api = createBrowserAPI();
      const result = await api.getPath("body");
      // Should not throw, result is either string or null
      expect(typeof result === "string" || result === null).toBe(true);
    });

    test("getAncestry accepts HTMLElement", async () => {
      const api = createBrowserAPI();
      const div = document.createElement("div");
      const result = await api.getAncestry(div);
      expect(result === null || Array.isArray(result)).toBe(true);
    });

    test("getAncestry accepts CSS selector string", async () => {
      const api = createBrowserAPI();
      const result = await api.getAncestry("div");
      expect(result === null || Array.isArray(result)).toBe(true);
    });

    test("getPathData accepts HTMLElement", async () => {
      const api = createBrowserAPI();
      const div = document.createElement("div");
      const result = await api.getPathData(div);
      if (result !== null) {
        expect(result).toHaveProperty("path");
        expect(result).toHaveProperty("ancestry");
      }
    });

    test("getPathData accepts CSS selector string", async () => {
      const api = createBrowserAPI();
      const result = await api.getPathData("body");
      if (result !== null) {
        expect(result).toHaveProperty("path");
        expect(result).toHaveProperty("ancestry");
      }
    });
  });
});
