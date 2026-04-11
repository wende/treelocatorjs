import { describe, expect, test, vi } from "vitest";
import { executeBridgeCommand } from "./mcpBridge";

function createApiMock() {
  return {
    getPath: vi.fn().mockResolvedValue("path"),
    getAncestry: vi.fn().mockResolvedValue([{ elementName: "button" }]),
    getPathData: vi
      .fn()
      .mockResolvedValue({ path: "path", ancestry: [{ elementName: "button" }] }),
    getStyles: vi.fn().mockReturnValue({ formatted: "styles", snapshot: {} }),
    getCSSRules: vi.fn().mockReturnValue({ properties: [] }),
    getCSSReport: vi.fn().mockReturnValue("report"),
    takeSnapshot: vi.fn().mockReturnValue({
      snapshotId: "baseline",
      selector: "#b",
      index: 0,
      takenAt: "now",
      propertyCount: 42,
      boundingRect: {},
    }),
    getSnapshotDiff: vi.fn().mockReturnValue({
      snapshotId: "baseline",
      selector: "#b",
      index: 0,
      takenAt: "now",
      formatted: "diff",
      changes: [],
      boundingRectChanges: [],
    }),
    clearSnapshot: vi.fn(),
    help: vi.fn().mockReturnValue("help"),
    replay: vi.fn(),
    replayWithRecord: vi.fn().mockResolvedValue(null),
    diff: {
      snapshot: vi.fn().mockReturnValue([]),
      computeDiff: vi.fn(),
      captureDiff: vi.fn(),
    },
  } as any;
}

describe("mcpBridge executeBridgeCommand", () => {
  test("dispatches get_path to browser API", async () => {
    const api = createApiMock();
    const result = await executeBridgeCommand(api, "get_path", {
      selector: "#target",
    });

    expect(api.getPath).toHaveBeenCalledWith("#target");
    expect(result).toBe("path");
  });

  test("click uses selector + index", async () => {
    document.body.innerHTML = `
      <button class="target">one</button>
      <button class="target">two</button>
    `;

    const buttons = Array.from(document.querySelectorAll(".target"));
    const clickSpy = vi.fn();
    buttons[1]?.addEventListener("click", clickSpy);

    const api = createApiMock();
    const result = await executeBridgeCommand(api, "click", {
      selector: ".target",
      index: 1,
    });

    expect(result).toEqual({ ok: true });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test("hover dispatches mouse events", async () => {
    document.body.innerHTML = `<div id="hover-me"></div>`;
    const element = document.getElementById("hover-me");
    expect(element).not.toBeNull();

    const events: string[] = [];
    element?.addEventListener("mouseenter", () => events.push("mouseenter"));
    element?.addEventListener("mouseover", () => events.push("mouseover"));
    element?.addEventListener("mousemove", () => events.push("mousemove"));

    const api = createApiMock();
    await executeBridgeCommand(api, "hover", { selector: "#hover-me" });

    expect(events).toEqual(["mouseenter", "mouseover", "mousemove"]);
  });

  test("type updates input value and dispatches input event", async () => {
    document.body.innerHTML = `<input id="field" />`;
    const input = document.getElementById("field") as HTMLInputElement;
    const inputEventSpy = vi.fn();
    input.addEventListener("input", inputEventSpy);

    const api = createApiMock();
    const result = await executeBridgeCommand(api, "type", {
      selector: "#field",
      text: "hello",
    });

    expect(input.value).toBe("hello");
    expect(result).toEqual({ value: "hello" });
    expect(inputEventSpy).toHaveBeenCalledTimes(1);
  });

  test("take_snapshot forwards selector + snapshotId to browser API", async () => {
    const api = createApiMock();
    const result = await executeBridgeCommand(api, "take_snapshot", {
      selector: "#b",
      snapshotId: "baseline",
      index: 2,
      label: "before fix",
    });

    expect(api.takeSnapshot).toHaveBeenCalledWith("#b", "baseline", {
      index: 2,
      label: "before fix",
    });
    expect(result).toMatchObject({ snapshotId: "baseline" });
  });

  test("take_snapshot rejects missing snapshotId", async () => {
    const api = createApiMock();
    await expect(
      executeBridgeCommand(api, "take_snapshot", { selector: "#b" })
    ).rejects.toThrow("snapshotId is required");
  });

  test("get_snapshot_diff forwards snapshotId to browser API", async () => {
    const api = createApiMock();
    const result = await executeBridgeCommand(api, "get_snapshot_diff", {
      snapshotId: "baseline",
    });
    expect(api.getSnapshotDiff).toHaveBeenCalledWith("baseline");
    expect(result).toMatchObject({ snapshotId: "baseline", formatted: "diff" });
  });

  test("clear_snapshot forwards snapshotId to browser API", async () => {
    const api = createApiMock();
    const result = await executeBridgeCommand(api, "clear_snapshot", {
      snapshotId: "baseline",
    });
    expect(api.clearSnapshot).toHaveBeenCalledWith("baseline");
    expect(result).toEqual({ ok: true });
  });

  test("type rejects unsupported elements", async () => {
    document.body.innerHTML = `<div id="not-input"></div>`;
    const api = createApiMock();

    await expect(
      executeBridgeCommand(api, "type", {
        selector: "#not-input",
        text: "hello",
      })
    ).rejects.toThrow("type target must be input, textarea, or contenteditable");
  });
});
