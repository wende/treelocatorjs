import { describe, expect, test } from "vitest";
import { normalizeFilePath } from "./normalizeFilePath";

describe("normalizeFilePath", () => {
  test("relative path unchanged", () => {
    const result = normalizeFilePath("src/App.tsx");
    expect(result).toBe("src/App.tsx");
  });

  test("relative path with components unchanged", () => {
    const result = normalizeFilePath("components/Button.tsx");
    expect(result).toBe("components/Button.tsx");
  });

  test("absolute path with /src/ indicator", () => {
    const result = normalizeFilePath("/Users/name/project/src/App.tsx");
    expect(result).toBe("src/App.tsx");
  });

  test("absolute path with /app/ indicator", () => {
    const result = normalizeFilePath("/workspace/apps/next-16/app/page.tsx");
    expect(result).toBe("app/page.tsx");
  });

  test("absolute path with /pages/ indicator", () => {
    const result = normalizeFilePath("/home/project/pages/index.tsx");
    expect(result).toBe("pages/index.tsx");
  });

  test("absolute path with /components/ indicator", () => {
    const result = normalizeFilePath("/home/project/components/Header.tsx");
    expect(result).toBe("components/Header.tsx");
  });

  test("absolute path with /lib/ indicator", () => {
    const result = normalizeFilePath("/home/project/lib/utils.ts");
    expect(result).toBe("lib/utils.ts");
  });

  test("absolute path without indicator uses last 4 segments", () => {
    const result = normalizeFilePath("/a/b/c/d/e/f/g.ts");
    // Parts: ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g.ts']
    // Last 4: ['d', 'e', 'f', 'g.ts']
    expect(result).toBe("d/e/f/g.ts");
  });

  test("absolute path with only 3 segments returns as-is", () => {
    const result = normalizeFilePath("/home/project/file.ts");
    expect(result).toBe("/home/project/file.ts");
  });

  test("absolute path with 2 segments returns as-is", () => {
    const result = normalizeFilePath("/home/file.ts");
    expect(result).toBe("/home/file.ts");
  });

  test("single segment path returns as-is", () => {
    const result = normalizeFilePath("/file.ts");
    expect(result).toBe("/file.ts");
  });

  test("deep nested path without indicator gets last 4 segments", () => {
    const result = normalizeFilePath("/home/user/projects/nomarker/src/components/Button/index.tsx");
    // Parts: ['', 'home', 'user', 'projects', 'nomarker', 'src', 'components', 'Button', 'index.tsx']
    // But /src/ is in indicators, so it matches and returns from /src/ onwards
    expect(result).toBe("src/components/Button/index.tsx");
  });

  test("uses first matching indicator when multiple present", () => {
    const result = normalizeFilePath("/home/project/src/app/components/Header.tsx");
    // /app/ comes before /src/ in the indicators array, and both are present
    // /app/ is found first, so it returns from /app/ onwards
    expect(result).toBe("app/components/Header.tsx");
  });

  test("empty string unchanged", () => {
    const result = normalizeFilePath("");
    expect(result).toBe("");
  });
});
