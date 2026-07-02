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
      expect(api).toHaveProperty("getTree");
      expect(api).toHaveProperty("help");
      expect(api).toHaveProperty("replay");
      expect(api).toHaveProperty("replayWithRecord");
      expect(api).toHaveProperty("diff");
    });

    test("all methods are functions", () => {
      const api = createBrowserAPI();
      expect(typeof api.getPath).toBe("function");
      expect(typeof api.getAncestry).toBe("function");
      expect(typeof api.getPathData).toBe("function");
      expect(typeof api.getTree).toBe("function");
      expect(typeof api.help).toBe("function");
      expect(typeof api.replay).toBe("function");
      expect(typeof api.replayWithRecord).toBe("function");
      expect(typeof api.diff.snapshot).toBe("function");
      expect(typeof api.diff.computeDiff).toBe("function");
      expect(typeof api.diff.captureDiff).toBe("function");
    });
  });

  describe("diff namespace", () => {
    beforeEach(() => {
      if (typeof (document as any).getAnimations !== "function") {
        (document as any).getAnimations = () => [];
      }
    });

    test("snapshot() returns an array", () => {
      const api = createBrowserAPI();
      const snaps = api.diff.snapshot();
      expect(Array.isArray(snaps)).toBe(true);
    });

    test("computeDiff of identical snapshots has empty entries", () => {
      const api = createBrowserAPI();
      const snaps = api.diff.snapshot();
      const report = api.diff.computeDiff(snaps, snaps);
      expect(report.entries).toHaveLength(0);
      expect(report.counts.added).toBe(0);
    });

    test("captureDiff returns a DeltaReport with settle and text populated", async () => {
      const api = createBrowserAPI();
      const report = await api.diff.captureDiff(() => {
        // no-op action
      }, { settleTimeoutMs: 200 });
      expect(report).toHaveProperty("entries");
      expect(report).toHaveProperty("counts");
      expect(report).toHaveProperty("text");
      expect(typeof report.text).toBe("string");
      expect(["clean", "timeout"]).toContain(report.settle);
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

  describe("getTree()", () => {
    test("returns source-aware tree result rooted at document.body by default", async () => {
      document.body.innerHTML = `<main><button aria-label="Save changes">Save</button></main>`;

      const api = createBrowserAPI();
      const result = await api.getTree({ includeHidden: true });

      expect(result).not.toBeNull();
      expect(result?.root.tag).toBe("body");
      expect(result?.root.children[0]?.tag).toBe("main");
      expect(result?.root.children[0]?.children[0]?.role).toBe("button");
      expect(result?.root.children[0]?.children[0]?.name).toBe("Save changes");
      expect(result?.nodeCount).toBe(3);
    });

    test("returns null when selector is invalid", async () => {
      const api = createBrowserAPI();
      const result = await api.getTree("div > > div");
      expect(result).toBeNull();
    });

    test("uses label/placeholder for inputs and never leaks typed values", async () => {
      document.body.innerHTML = `
        <main>
          <label for="email">Email address</label>
          <input id="email" type="email" value="secret@example.com" />
          <input type="search" placeholder="Search products" value="running shoes" />
          <input type="submit" value="Place order" />
          <input type="password" value="hunter2" />
        </main>
      `;

      const api = createBrowserAPI();
      const result = await api.getTree({ includeHidden: true });
      const inputs = result?.root.children[0]?.children.filter(
        (child) => child.tag === "input"
      );

      expect(inputs?.[0]?.name).toBe("Email address");
      expect(inputs?.[1]?.name).toBe("Search products");
      expect(inputs?.[2]?.name).toBe("Place order");
      // A bare password field has no label/placeholder and must expose no name.
      expect(inputs?.[3]?.name).toBeUndefined();
      // The typed-in values must never surface as accessible names.
      expect(JSON.stringify(result)).not.toContain("secret@example.com");
      expect(JSON.stringify(result)).not.toContain("running shoes");
      expect(JSON.stringify(result)).not.toContain("hunter2");
    });

    test("includeText: false omits text snippets", async () => {
      document.body.innerHTML = `<main><p>Hello world</p></main>`;

      const api = createBrowserAPI();
      const withText = await api.getTree({ includeHidden: true });
      const withoutText = await api.getTree({
        includeHidden: true,
        includeText: false,
      });

      const paragraphWith = withText?.root.children[0]?.children[0];
      const paragraphWithout = withoutText?.root.children[0]?.children[0];
      expect(paragraphWith?.text).toBe("Hello world");
      expect(paragraphWithout?.text).toBeUndefined();
    });

    test("respects maxDepth", async () => {
      document.body.innerHTML = `<main><section><button>Save</button></section></main>`;

      const api = createBrowserAPI();
      const result = await api.getTree({
        includeHidden: true,
        maxDepth: 1,
      });

      expect(result?.root.children[0]?.tag).toBe("main");
      expect(result?.root.children[0]?.children).toHaveLength(0);
      expect(result?.truncated).toBe(true);
    });

    test("respects maxNodes", async () => {
      document.body.innerHTML = `<main><section></section><aside></aside></main>`;

      const api = createBrowserAPI();
      const result = await api.getTree({
        includeHidden: true,
        maxNodes: 2,
      });

      expect(result?.nodeCount).toBe(2);
      expect(result?.truncated).toBe(true);
    });

    test("includeHidden controls hidden descendants", async () => {
      document.body.innerHTML = `<main><button style="display: none">Hidden</button></main>`;

      const api = createBrowserAPI();
      const visibleOnly = await api.getTree();
      const withHidden = await api.getTree({ includeHidden: true });

      expect(visibleOnly?.root.children).toHaveLength(0);
      expect(withHidden?.root.children[0]?.children[0]?.text).toBe("Hidden");
    });

    test("skips TreeLocator-owned elements", async () => {
      document.body.innerHTML = `
        <div id="locatorjs-wrapper"><button>TreeLocator UI</button></div>
        <main><button>App UI</button></main>
      `;

      const api = createBrowserAPI();
      const result = await api.getTree({ includeHidden: true });

      expect(result?.root.children.map((child) => child.id)).not.toContain(
        "locatorjs-wrapper"
      );
      expect(result?.root.children[0]?.tag).toBe("main");
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
      expect(api).toHaveProperty("getTree");
      expect(api).toHaveProperty("help");
      expect(api).toHaveProperty("replay");
      expect(api).toHaveProperty("replayWithRecord");
      expect(api).toHaveProperty("diff");
      expect(typeof api.diff.snapshot).toBe("function");
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
