import { describe, expect, test, vi, beforeEach } from "vitest";
import { detectFramework } from "./detectFramework";

vi.mock("@locator/shared", () => ({
  detectSvelte: vi.fn(() => false),
  detectVue: vi.fn(() => false),
  detectReact: vi.fn(() => false),
  detectJSX: vi.fn(() => false),
}));

vi.mock("./phoenix/detectPhoenix", () => ({
  detectPhoenix: vi.fn(() => false),
}));

import { detectSvelte, detectVue, detectReact, detectJSX } from "@locator/shared";
import { detectPhoenix } from "./phoenix/detectPhoenix";

beforeEach(() => {
  vi.mocked(detectSvelte).mockReturnValue(false);
  vi.mocked(detectVue).mockReturnValue(false);
  vi.mocked(detectReact).mockReturnValue(false);
  vi.mocked(detectJSX).mockReturnValue(false);
  vi.mocked(detectPhoenix).mockReturnValue(false);
});

describe("detectFramework", () => {
  test("returns null when all detect functions return false and no element", () => {
    expect(detectFramework()).toBe(null);
  });

  test("returns 'svelte' when detectSvelte returns true", () => {
    vi.mocked(detectSvelte).mockReturnValue(true);
    expect(detectFramework()).toBe("svelte");
  });

  test("returns 'vue' when detectVue returns true", () => {
    vi.mocked(detectVue).mockReturnValue(true);
    expect(detectFramework()).toBe("vue");
  });

  test("returns 'react' when detectReact returns true", () => {
    vi.mocked(detectReact).mockReturnValue(true);
    expect(detectFramework()).toBe("react");
  });

  test("returns 'jsx' when detectJSX returns true", () => {
    vi.mocked(detectJSX).mockReturnValue(true);
    expect(detectFramework()).toBe("jsx");
  });

  test("returns 'jsx' when detectPhoenix returns true", () => {
    vi.mocked(detectPhoenix).mockReturnValue(true);
    expect(detectFramework()).toBe("jsx");
  });

  test("returns 'react' when element has __reactFiber$ key even when detectReact returns false", () => {
    const element = document.createElement("div");
    (element as any)["__reactFiber$abc123"] = {};
    expect(detectFramework(element)).toBe("react");
  });

  test("returns 'jsx' when element has dataset.locatorjsId", () => {
    const element = document.createElement("div");
    element.dataset.locatorjsId = "some-id";
    expect(detectFramework(element)).toBe("jsx");
  });

  test("returns 'svelte' over 'react' when both detectSvelte and detectReact return true", () => {
    vi.mocked(detectSvelte).mockReturnValue(true);
    vi.mocked(detectReact).mockReturnValue(true);
    expect(detectFramework()).toBe("svelte");
  });
});
