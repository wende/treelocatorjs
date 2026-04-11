import { describe, expect, test, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  STORAGE_KEY,
  loadFromStorage,
  saveToStorage,
  clearStorage,
} from "./useLocatorStorage";

const mockStorage = new Map<string, string>();

const mockLocalStorage = {
  getItem(key: string): string | null {
    return mockStorage.has(key) ? mockStorage.get(key)! : null;
  },
  setItem(key: string, value: string): void {
    mockStorage.set(key, String(value));
  },
  removeItem(key: string): void {
    mockStorage.delete(key);
  },
  clear(): void {
    mockStorage.clear();
  },
};

describe("useLocatorStorage", () => {
  beforeAll(() => {
    vi.stubGlobal("localStorage", mockLocalStorage);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe("loadFromStorage", () => {
    test("returns defaults when storage is empty", () => {
      const result = loadFromStorage();
      expect(result).toEqual({ last: null, previous: null });
    });

    test("returns parsed data from localStorage", () => {
      const data = {
        last: {
          findings: [],
          summary: null,
          data: null,
          elementPath: "div > button",
          interactions: [],
        },
        previous: null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const result = loadFromStorage();
      expect(result).toEqual(data);
    });

    test("returns defaults on corrupt JSON", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
      const result = loadFromStorage();
      expect(result).toEqual({ last: null, previous: null });
    });
  });

  describe("saveToStorage", () => {
    test("saves recording and shifts previous", () => {
      const first = {
        findings: [],
        summary: null,
        data: "first",
        elementPath: "path1",
        interactions: [],
      };
      const second = {
        findings: [],
        summary: null,
        data: "second",
        elementPath: "path2",
        interactions: [],
      };

      saveToStorage(first as any);
      let stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.last.data).toBe("first");
      expect(stored.previous).toBeNull();

      saveToStorage(second as any);
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.last.data).toBe("second");
      expect(stored.previous.data).toBe("first");
    });
  });

  describe("clearStorage", () => {
    test("removes the storage key", () => {
      localStorage.setItem(STORAGE_KEY, "something");
      clearStorage();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    test("does not throw when key does not exist", () => {
      expect(() => clearStorage()).not.toThrow();
    });
  });

  describe("roundtrip", () => {
    test("save then load returns correct data", () => {
      const recording = {
        findings: [{ type: "jitter", severity: "low" }],
        summary: { totalFindings: 1 },
        data: { frames: 100 },
        elementPath: "App > Header > Button",
        interactions: [
          { t: 0, type: "click", target: "button", x: 100, y: 200 },
        ],
      };

      saveToStorage(recording as any);
      const loaded = loadFromStorage();
      expect(loaded.last).toEqual(recording);
      expect(loaded.previous).toBeNull();
    });
  });
});
