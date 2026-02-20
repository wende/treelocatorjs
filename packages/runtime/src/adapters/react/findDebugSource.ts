import { Fiber, Source } from "@locator/shared";
import {
  resolveSourceFromDebugStack,
  parseDebugStack,
} from "./resolveSourceMap";

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

/**
 * Async version of findDebugSource that supports React 19's _debugStack.
 * Falls back to synchronous _debugSource check first (React 18).
 * If that fails, parses _debugStack and resolves via source maps.
 */
export async function findDebugSourceAsync(
  fiber: Fiber
): Promise<{ fiber: Fiber; source: Source } | null> {
  // Try synchronous path first (React 18)
  const syncResult = findDebugSource(fiber);
  if (syncResult) return syncResult;

  // React 19: try resolving via _debugStack + source maps
  let current: Fiber | null = fiber;
  while (current) {
    const debugStack = (current as any)._debugStack;
    if (debugStack?.stack) {
      const source = await resolveSourceFromDebugStack(debugStack);
      if (source) {
        return { fiber: current, source };
      }
    }
    current = current._debugOwner || null;
  }

  return null;
}

/**
 * Check if this is a React 19+ environment (has _debugStack but not _debugSource).
 */
export function isReact19Fiber(fiber: Fiber): boolean {
  return !fiber._debugSource && !!(fiber as any)._debugStack;
}
