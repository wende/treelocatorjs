import { Fiber, Renderer } from "@locator/shared";
import { findDebugSource } from "./findDebugSource";

/**
 * Find the React fiber key on a DOM element (e.g., "__reactFiber$abc123").
 * Works across all React versions that attach fibers to DOM nodes.
 */
function findFiberFromDOMElement(element: HTMLElement): Fiber | null {
  const fiberKey = Object.keys(element).find((k) =>
    k.startsWith("__reactFiber$")
  );
  if (fiberKey) {
    return (element as any)[fiberKey] as Fiber;
  }
  return null;
}

export function findFiberByHtmlElement(
  target: HTMLElement,
  shouldHaveDebugSource: boolean
): Fiber | null {
  // Try via DevTools renderers first (available when React DevTools extension is installed)
  const renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
  const renderersValues = renderers?.values();
  if (renderersValues) {
    for (const renderer of Array.from(renderersValues) as Renderer[]) {
      if (renderer.findFiberByHostInstance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const found = renderer.findFiberByHostInstance(target as any);
        if (found) {
          if (shouldHaveDebugSource) {
            return findDebugSource(found)?.fiber || null;
          } else {
            return found;
          }
        }
      }
    }
  }

  // Fallback: read fiber directly from DOM element's __reactFiber$ property.
  // This works without the React DevTools extension and across React 16-19.
  const fiber = findFiberFromDOMElement(target);
  if (fiber) {
    if (shouldHaveDebugSource) {
      return findDebugSource(fiber)?.fiber || null;
    }
    return fiber;
  }

  return null;
}
