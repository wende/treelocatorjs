import { Fiber } from "@locator/shared";

export function getUsableName(fiber: Fiber | null | undefined): string {
  if (!fiber) {
    return "Not found";
  }

  if (typeof fiber.elementType === "string") {
    return fiber.elementType;
  }
  if (!fiber.elementType) {
    return "Anonymous";
  }

  if (fiber.elementType.name) {
    return fiber.elementType.name;
  }
  if (fiber.elementType.displayName) {
    return fiber.elementType.displayName;
  }
  // Used in React.memo
  if (fiber.elementType.type?.name) {
    return fiber.elementType.type.name;
  }
  if (fiber.elementType.type?.displayName) {
    return fiber.elementType.type.displayName;
  }
  // React.forwardRef wraps the render function in .render
  if (fiber.elementType.render?.name) {
    return fiber.elementType.render.name;
  }
  if (fiber.elementType.render?.displayName) {
    return fiber.elementType.render.displayName;
  }
  // React lazy components store resolved module in _payload._result
  if (fiber.elementType._payload?._result?.name) {
    return fiber.elementType._payload._result.name;
  }
  if (fiber.elementType._payload?._result?.displayName) {
    return fiber.elementType._payload._result.displayName;
  }
  // fiber.type can differ from elementType in some React internals
  if (fiber.type && typeof fiber.type !== "string" && fiber.type !== fiber.elementType) {
    if (fiber.type.name) {
      return fiber.type.name;
    }
    if (fiber.type.displayName) {
      return fiber.type.displayName;
    }
  }

  return "Anonymous";
}
