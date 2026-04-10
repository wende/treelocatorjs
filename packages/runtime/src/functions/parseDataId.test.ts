import { describe, expect, test } from "vitest";
import { parseDataId, parseDataPath, splitFullPath } from "./parseDataId";

describe("parseDataId", () => {
  test("happy path with valid dataId", () => {
    const result = parseDataId("path/file.tsx::0");
    expect(result).toEqual(["path/file.tsx", "0"]);
  });

  test("throws on missing double colon separator", () => {
    expect(() => parseDataId("path/file.tsx:0")).toThrow("locatorjsId is malformed");
  });

  test("throws on missing file path", () => {
    expect(() => parseDataId("::0")).toThrow("locatorjsId is malformed");
  });

  test("throws on missing id", () => {
    expect(() => parseDataId("path/file.tsx::")).toThrow("locatorjsId is malformed");
  });

  test("throws on empty string", () => {
    expect(() => parseDataId("")).toThrow("locatorjsId is malformed");
  });

  test("handles complex paths with multiple slashes", () => {
    const result = parseDataId("/home/user/projects/src/components/Button.tsx::abc123");
    expect(result).toEqual(["/home/user/projects/src/components/Button.tsx", "abc123"]);
  });
});

describe("parseDataPath", () => {
  test("standard unix path with line and column", () => {
    const result = parseDataPath("/path/file.tsx:12:3");
    expect(result).toEqual(["/path/file.tsx", 12, 3]);
  });

  test("Windows path with line and column", () => {
    const result = parseDataPath("C:\\path\\file.tsx:12:3");
    expect(result).toEqual(["C:\\path\\file.tsx", 12, 3]);
  });

  test("complex absolute path", () => {
    const result = parseDataPath("/home/user/projects/src/components/Button.tsx:42:15");
    expect(result).toEqual(["/home/user/projects/src/components/Button.tsx", 42, 15]);
  });

  test("returns null when missing colon", () => {
    const result = parseDataPath("/path/file.tsx12:3");
    expect(result).toBeNull();
  });

  test("returns null when only one colon", () => {
    const result = parseDataPath("/path/file.tsx:12");
    expect(result).toBeNull();
  });

  test("returns null when line is not numeric", () => {
    const result = parseDataPath("/path/file.tsx:abc:3");
    expect(result).toBeNull();
  });

  test("returns null when column is not numeric", () => {
    const result = parseDataPath("/path/file.tsx:12:xyz");
    expect(result).toBeNull();
  });

  test("returns null when no colons present", () => {
    const result = parseDataPath("/path/file.tsx");
    expect(result).toBeNull();
  });

  test("handles zero as valid line and column numbers", () => {
    const result = parseDataPath("/path/file.tsx:0:0");
    expect(result).toEqual(["/path/file.tsx", 0, 0]);
  });
});

describe("splitFullPath", () => {
  test("splits on /src/ indicator", () => {
    const result = splitFullPath("/home/user/project/src/components/Button.tsx");
    expect(result).toEqual(["/home/user/project", "/src/components/Button.tsx"]);
  });

  test("splits on /app/ indicator", () => {
    const result = splitFullPath("/workspace/myapp/app/page.tsx");
    expect(result).toEqual(["/workspace/myapp", "/app/page.tsx"]);
  });

  test("splits on /pages/ indicator", () => {
    const result = splitFullPath("/home/project/pages/index.tsx");
    expect(result).toEqual(["/home/project", "/pages/index.tsx"]);
  });

  test("splits on /components/ indicator", () => {
    const result = splitFullPath("/home/project/components/Header.tsx");
    expect(result).toEqual(["/home/project", "/components/Header.tsx"]);
  });

  test("uses first matching indicator when multiple present", () => {
    const result = splitFullPath("/home/project/src/pages/index.tsx");
    // /src/ comes first in the indicators array
    expect(result).toEqual(["/home/project", "/src/pages/index.tsx"]);
  });

  test("fallback to last slash when no indicator found", () => {
    const result = splitFullPath("/home/user/myfile.txt");
    expect(result).toEqual(["/home/user/", "myfile.txt"]);
  });

  test("handles path with no slashes", () => {
    const result = splitFullPath("filename.txt");
    expect(result).toEqual(["filename.txt", ""]);
  });

  test("handles empty path", () => {
    const result = splitFullPath("");
    expect(result).toEqual(["", ""]);
  });

  test("handles root path", () => {
    const result = splitFullPath("/");
    expect(result).toEqual(["/", ""]);
  });
});
