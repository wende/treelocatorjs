import { describe, expect, test } from "vitest";
import treelocator from "./index.js";

describe("treelocator vite plugin", () => {
  test("only applies in serve mode", () => {
    const plugin = treelocator();
    expect(plugin.apply).toBe("serve");
    expect(plugin.name).toBe("treelocator");
  });

  test("resolves virtual module id", () => {
    const plugin = treelocator();
    expect(plugin.resolveId?.("virtual:treelocator-setup", "", {} as any)).toBe(
      "\0virtual:treelocator-setup"
    );
  });

  test("loads runtime setup for virtual module", () => {
    const plugin = treelocator();
    const code = plugin.load?.("\0virtual:treelocator-setup");
    expect(code).toContain('@treelocator/runtime');
    expect(code).toContain("import.meta.env.DEV");
  });

  test("injects setup script into html", () => {
    const plugin = treelocator();
    const handler = plugin.transformIndexHtml;
    expect(handler).toBeDefined();
    if (!handler || typeof handler === "function") return;

    const tags = handler.handler("<html></html>");
    expect(tags).toEqual([
      {
        tag: "script",
        attrs: { type: "module" },
        children: 'import "virtual:treelocator-setup";',
        injectTo: "head-prepend",
      },
    ]);
  });
});
