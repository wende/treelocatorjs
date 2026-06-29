import { Fiber } from "@locator/shared";

const REACT_FIBER_KEY_PREFIX = "__reactFiber$";

/**
 * React 19 fibers expose source location through `_debugStack` instead of the
 * structured `_debugSource` object used by React 16-18.
 */
export type React19Fiber = Fiber & { _debugStack?: { stack?: string } };

/**
 * Read the React fiber attached to a DOM element (e.g. `__reactFiber$abc123`).
 * Works without the React DevTools extension and across React 16-19.
 */
export function getReactFiberFromElement<T extends Fiber = Fiber>(
  element: Element
): T | null {
  const fiberKey = Object.keys(element).find((k) =>
    k.startsWith(REACT_FIBER_KEY_PREFIX)
  );
  if (!fiberKey) return null;
  return (element as unknown as Record<string, T>)[fiberKey] ?? null;
}

/**
 * Check whether a DOM element has a React fiber attached.
 */
export function hasReactFiber(element?: Element | null): boolean {
  if (!element) return false;
  return Object.keys(element).some((k) => k.startsWith(REACT_FIBER_KEY_PREFIX));
}
