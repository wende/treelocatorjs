import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { waitForSettle } from "./settle";

describe("waitForSettle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    if (typeof (document as any).getAnimations !== "function") {
      (document as any).getAnimations = () => [];
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns 'clean' when no mutations and no animations", async () => {
    const result = await waitForSettle(500);
    expect(result).toBe("clean");
  });

  test("returns 'timeout' when mutations keep firing past the deadline", async () => {
    const interval = setInterval(() => {
      const d = document.createElement("div");
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 0);
    }, 20);

    const result = await waitForSettle(400);
    clearInterval(interval);
    expect(result).toBe("timeout");
  });

  test("settles after mutations stop", async () => {
    const start = performance.now();
    let mutationCount = 0;
    const interval = setInterval(() => {
      if (mutationCount >= 3) {
        clearInterval(interval);
        return;
      }
      const d = document.createElement("div");
      document.body.appendChild(d);
      mutationCount++;
    }, 30);

    const result = await waitForSettle(2000);
    const elapsed = performance.now() - start;
    expect(result).toBe("clean");
    expect(elapsed).toBeLessThan(2000);
  });

  test("ignores mutations outside the provided root", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    const interval = setInterval(() => {
      const d = document.createElement("div");
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 0);
    }, 20);

    const result = await waitForSettle(500, root);
    clearInterval(interval);
    expect(result).toBe("clean");
  });

  test("treats animations as non-idle", async () => {
    const fakeAnim = { playState: "running" } as unknown as Animation;
    const spy = vi
      .spyOn(document, "getAnimations")
      .mockReturnValue([fakeAnim]);

    const result = await waitForSettle(300);
    expect(result).toBe("timeout");
    spy.mockRestore();
  });
});
