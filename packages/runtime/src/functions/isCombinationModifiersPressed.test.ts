import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { isCombinationModifiersPressed, getMouseModifiers } from "./isCombinationModifiersPressed";

describe("getMouseModifiers", () => {
  afterEach(() => {
    delete document.documentElement.dataset.locatorMouseModifiers;
  });

  test("returns default alt modifier when not set", () => {
    const modifiers = getMouseModifiers();
    expect(modifiers).toEqual({ alt: true });
  });

  test("parses single modifier from dataset", () => {
    document.documentElement.dataset.locatorMouseModifiers = "ctrl";
    const modifiers = getMouseModifiers();
    expect(modifiers).toEqual({ ctrl: true });
  });

  test("parses multiple modifiers separated by +", () => {
    document.documentElement.dataset.locatorMouseModifiers = "ctrl+shift";
    const modifiers = getMouseModifiers();
    expect(modifiers).toEqual({ ctrl: true, shift: true });
  });

  test("parses three modifiers", () => {
    document.documentElement.dataset.locatorMouseModifiers = "ctrl+alt+shift";
    const modifiers = getMouseModifiers();
    expect(modifiers).toEqual({ ctrl: true, alt: true, shift: true });
  });

  test("parses meta modifier", () => {
    document.documentElement.dataset.locatorMouseModifiers = "meta";
    const modifiers = getMouseModifiers();
    expect(modifiers).toEqual({ meta: true });
  });
});

describe("isCombinationModifiersPressed", () => {
  afterEach(() => {
    delete document.documentElement.dataset.locatorMouseModifiers;
  });

  describe("default alt modifier", () => {
    test("returns true when altKey is true", () => {
      const event = new KeyboardEvent("keydown", { altKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(true);
    });

    test("returns false when altKey is false", () => {
      const event = new KeyboardEvent("keydown", { altKey: false });
      expect(isCombinationModifiersPressed(event)).toBe(false);
    });

    test("returns false when ctrlKey is true", () => {
      const event = new KeyboardEvent("keydown", { altKey: true, ctrlKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(false);
    });

    test("returns false when ctrlKey is true but altKey is false", () => {
      const event = new KeyboardEvent("keydown", { altKey: false, ctrlKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(false);
    });

    test("returns false when metaKey is true but altKey is false", () => {
      const event = new KeyboardEvent("keydown", { altKey: false, metaKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(false);
    });
  });

  describe("custom ctrl+alt modifier", () => {
    beforeEach(() => {
      document.documentElement.dataset.locatorMouseModifiers = "ctrl+alt";
    });

    test("returns true when both ctrl and alt are true", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true, altKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(true);
    });

    test("returns false when only ctrl is true", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true, altKey: false });
      expect(isCombinationModifiersPressed(event)).toBe(false);
    });

    test("returns false when only alt is true", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: false, altKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(false);
    });

    test("returns false when neither ctrl nor alt are true", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: false, altKey: false });
      expect(isCombinationModifiersPressed(event)).toBe(false);
    });
  });

  describe("shift modifier handling", () => {
    test("shift not configured allows shift to be pressed without affecting result", () => {
      document.documentElement.dataset.locatorMouseModifiers = "alt";
      const event = new KeyboardEvent("keydown", { altKey: true, shiftKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(true);
    });

    test("shift configured requires shift to be pressed", () => {
      document.documentElement.dataset.locatorMouseModifiers = "alt+shift";
      const event = new KeyboardEvent("keydown", { altKey: true, shiftKey: false });
      expect(isCombinationModifiersPressed(event)).toBe(false);
    });

    test("shift configured returns true when shift is pressed", () => {
      document.documentElement.dataset.locatorMouseModifiers = "alt+shift";
      const event = new KeyboardEvent("keydown", { altKey: true, shiftKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(true);
    });
  });

  describe("rightClick parameter", () => {
    beforeEach(() => {
      document.documentElement.dataset.locatorMouseModifiers = "alt";
    });

    test("rightClick=true ignores ctrlKey requirement", () => {
      const event = new KeyboardEvent("keydown", { altKey: true, ctrlKey: false });
      expect(isCombinationModifiersPressed(event, true)).toBe(true);
    });

    test("rightClick=true still requires alt", () => {
      const event = new KeyboardEvent("keydown", { altKey: false, metaKey: false });
      expect(isCombinationModifiersPressed(event, true)).toBe(false);
    });

    test("rightClick=true checks metaKey", () => {
      const event = new KeyboardEvent("keydown", { altKey: true, metaKey: true });
      expect(isCombinationModifiersPressed(event, true)).toBe(false);
    });

    test("rightClick=true with meta modifier configured", () => {
      document.documentElement.dataset.locatorMouseModifiers = "meta";
      const event = new KeyboardEvent("keydown", { altKey: false, metaKey: true });
      expect(isCombinationModifiersPressed(event, true)).toBe(true);
    });
  });

  describe("MouseEvent support", () => {
    test("works with MouseEvent", () => {
      const event = new MouseEvent("click", { altKey: true });
      expect(isCombinationModifiersPressed(event)).toBe(true);
    });

    test("rightClick parameter works with MouseEvent", () => {
      document.documentElement.dataset.locatorMouseModifiers = "alt";
      const event = new MouseEvent("click", { altKey: true });
      expect(isCombinationModifiersPressed(event, true)).toBe(true);
    });
  });
});
