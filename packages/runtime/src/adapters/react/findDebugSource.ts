import { Fiber, Source } from "@locator/shared";

export function findDebugSource(
  fiber: Fiber
): { fiber: Fiber; source: Source } | null {
  let current: Fiber | null = fiber;
  while (current) {
    // React 18 and earlier: _debugSource is a structured object
    if (current._debugSource) {
      return { fiber: current, source: current._debugSource };
    }
    current = current._debugOwner || null;
  }

  return null;
}
