import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";

vi.mock("fs");
vi.mock("child_process");

import {
  getInstallCommand,
  readPackageJson,
  injectBabelPluginIntoVitePlugin,
  detectPackageManager,
} from "./index.js";

// After mocking, restore mocks between tests
beforeEach(() => {
  vi.resetAllMocks();
});

// ─── getInstallCommand ────────────────────────────────────────────────────────

describe("getInstallCommand", () => {
  test("npm produces correct install command", () => {
    expect(getInstallCommand("npm", ["pkg1", "pkg2"])).toBe("npm install -D pkg1 pkg2");
  });

  test("yarn produces correct install command", () => {
    expect(getInstallCommand("yarn", ["pkg1", "pkg2"])).toBe("yarn add -D pkg1 pkg2");
  });

  test("pnpm produces correct install command", () => {
    expect(getInstallCommand("pnpm", ["pkg1", "pkg2"])).toBe("pnpm add -D pkg1 pkg2");
  });

  test("bun produces correct install command", () => {
    expect(getInstallCommand("bun", ["pkg1", "pkg2"])).toBe("bun add -D pkg1 pkg2");
  });

  test("single package produces no trailing space issues", () => {
    expect(getInstallCommand("npm", ["@treelocator/runtime"])).toBe(
      "npm install -D @treelocator/runtime"
    );
  });
});

// ─── readPackageJson ──────────────────────────────────────────────────────────

describe("readPackageJson", () => {
  test("returns parsed object for valid JSON", () => {
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ name: "my-app", version: "1.0.0" }) as any
    );
    const result = readPackageJson("/some/dir");
    expect(result).toEqual({ name: "my-app", version: "1.0.0" });
  });

  test("returns null for invalid JSON", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("not valid json {{{" as any);
    const result = readPackageJson("/some/dir");
    expect(result).toBeNull();
  });

  test("returns null when file does not exist (readFileSync throws)", () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("ENOENT: no such file");
    });
    const result = readPackageJson("/nonexistent/dir");
    expect(result).toBeNull();
  });
});

// ─── injectBabelPluginIntoVitePlugin ─────────────────────────────────────────

describe("injectBabelPluginIntoVitePlugin", () => {
  const babelConfig = "babel: { plugins: [] }";

  test("injects into empty plugin call", () => {
    const input = "plugins: [react()]";
    const result = injectBabelPluginIntoVitePlugin(input, ["react"], babelConfig);
    expect(result).toBe(`plugins: [react({\n      ${babelConfig},\n    })]`);
  });

  test("injects into plugin call with existing options", () => {
    const input = "plugins: [react({ jsxRuntime: 'automatic' })]";
    const result = injectBabelPluginIntoVitePlugin(input, ["react"], babelConfig);
    expect(result).toBe(`plugins: [react({\n      ${babelConfig}, jsxRuntime: 'automatic' })]`);
  });

  test("matches solidPlugin when provided as second name option", () => {
    const input = "plugins: [solidPlugin()]";
    const result = injectBabelPluginIntoVitePlugin(input, ["solid", "solidPlugin"], babelConfig);
    expect(result).toBe(`plugins: [solidPlugin({\n      ${babelConfig},\n    })]`);
  });

  test("matches solid() when solid is in the list", () => {
    const input = "plugins: [solid()]";
    const result = injectBabelPluginIntoVitePlugin(input, ["solid", "solidPlugin"], babelConfig);
    expect(result).toBe(`plugins: [solid({\n      ${babelConfig},\n    })]`);
  });

  test("returns content unchanged when no plugin name matches", () => {
    const input = "plugins: [vue()]";
    const result = injectBabelPluginIntoVitePlugin(input, ["react"], babelConfig);
    expect(result).toBe(input);
  });

  test("returns content unchanged when content has no plugin calls at all", () => {
    const input = "export default defineConfig({ plugins: [] })";
    const result = injectBabelPluginIntoVitePlugin(input, ["react", "preact"], babelConfig);
    expect(result).toBe(input);
  });

  test("handles preact() empty call correctly", () => {
    const input = "plugins: [preact()]";
    const result = injectBabelPluginIntoVitePlugin(input, ["preact"], babelConfig);
    expect(result).toBe(`plugins: [preact({\n      ${babelConfig},\n    })]`);
  });
});

// ─── detectPackageManager ─────────────────────────────────────────────────────

describe("detectPackageManager", () => {
  const cwd = process.cwd();

  test("returns 'bun' when bun.lockb exists in cwd", () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === `${cwd}/bun.lockb`;
    });
    expect(detectPackageManager()).toBe("bun");
  });

  test("returns 'pnpm' when pnpm-lock.yaml exists in cwd", () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === `${cwd}/pnpm-lock.yaml`;
    });
    expect(detectPackageManager()).toBe("pnpm");
  });

  test("returns 'yarn' when yarn.lock exists in cwd", () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === `${cwd}/yarn.lock`;
    });
    expect(detectPackageManager()).toBe("yarn");
  });

  test("returns 'npm' when package-lock.json exists in cwd", () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === `${cwd}/package-lock.json`;
    });
    expect(detectPackageManager()).toBe("npm");
  });

  test("defaults to 'npm' when no lockfile is found anywhere", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(detectPackageManager()).toBe("npm");
  });
});
