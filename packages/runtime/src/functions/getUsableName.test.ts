import { describe, expect, test } from "vitest";
import { getUsableName } from "./getUsableName";
import { Fiber } from "@locator/shared";

describe("getUsableName", () => {
  test("returns 'Not found' when fiber is null", () => {
    expect(getUsableName(null)).toBe("Not found");
  });

  test("returns 'Not found' when fiber is undefined", () => {
    expect(getUsableName(undefined)).toBe("Not found");
  });

  test("returns string elementType directly", () => {
    const fiber = {
      elementType: "div",
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("div");
  });

  test("returns 'Anonymous' when elementType is null", () => {
    const fiber = {
      elementType: null,
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("Anonymous");
  });

  test("returns elementType.name when available", () => {
    const fiber = {
      elementType: {
        name: "MyComponent",
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("MyComponent");
  });

  test("returns elementType.displayName when name unavailable", () => {
    const fiber = {
      elementType: {
        displayName: "MyComponent",
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("MyComponent");
  });

  test("prefers name over displayName", () => {
    const fiber = {
      elementType: {
        name: "FromName",
        displayName: "FromDisplayName",
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("FromName");
  });

  test("handles React.memo with type.name", () => {
    const fiber = {
      elementType: {
        type: {
          name: "MemoizedComponent",
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("MemoizedComponent");
  });

  test("handles React.memo with type.displayName", () => {
    const fiber = {
      elementType: {
        type: {
          displayName: "MemoizedComponent",
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("MemoizedComponent");
  });

  test("prefers type.name over type.displayName", () => {
    const fiber = {
      elementType: {
        type: {
          name: "FromName",
          displayName: "FromDisplayName",
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("FromName");
  });

  test("handles React.forwardRef with render.name", () => {
    const fiber = {
      elementType: {
        render: {
          name: "ForwardRefComponent",
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("ForwardRefComponent");
  });

  test("handles React.forwardRef with render.displayName", () => {
    const fiber = {
      elementType: {
        render: {
          displayName: "ForwardRefComponent",
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("ForwardRefComponent");
  });

  test("prefers render.name over render.displayName", () => {
    const fiber = {
      elementType: {
        render: {
          name: "FromName",
          displayName: "FromDisplayName",
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("FromName");
  });

  test("handles React.lazy with _payload._result.name", () => {
    const fiber = {
      elementType: {
        _payload: {
          _result: {
            name: "LazyComponent",
          },
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("LazyComponent");
  });

  test("handles React.lazy with _payload._result.displayName", () => {
    const fiber = {
      elementType: {
        _payload: {
          _result: {
            displayName: "LazyComponent",
          },
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("LazyComponent");
  });

  test("prefers _payload._result.name over displayName", () => {
    const fiber = {
      elementType: {
        _payload: {
          _result: {
            name: "FromName",
            displayName: "FromDisplayName",
          },
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("FromName");
  });

  test("falls back to fiber.type.name when elementType doesn't have name", () => {
    const fiber = {
      elementType: {},
      type: {
        name: "TypeComponent",
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("TypeComponent");
  });

  test("ignores fiber.type when it equals elementType", () => {
    const elementType = { name: "Component" };
    const fiber = {
      elementType,
      type: elementType,
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("Component");
  });

  test("ignores fiber.type when it is a string", () => {
    const fiber = {
      elementType: {},
      type: "div",
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("Anonymous");
  });

  test("returns 'Anonymous' when all fallbacks fail", () => {
    const fiber = {
      elementType: {},
      type: {},
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("Anonymous");
  });

  test("follows priority order correctly", () => {
    // elementType.name should be used before type.name
    const fiber = {
      elementType: {
        name: "ElementTypeComponent",
      },
      type: {
        name: "TypeComponent",
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("ElementTypeComponent");
  });

  test("handles deeply nested fiber with multiple name sources", () => {
    const fiber = {
      elementType: {
        render: {
          name: "VeryNested",
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("VeryNested");
  });

  test("handles missing _payload gracefully", () => {
    const fiber = {
      elementType: {
        _payload: null,
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("Anonymous");
  });

  test("handles missing _result in _payload gracefully", () => {
    const fiber = {
      elementType: {
        _payload: {
          _result: null,
        },
      },
    } as any as Fiber;
    expect(getUsableName(fiber)).toBe("Anonymous");
  });
});
