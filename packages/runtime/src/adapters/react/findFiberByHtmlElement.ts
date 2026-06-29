import { Fiber, Renderer } from "@locator/shared";
import { findDebugSource } from "./findDebugSource";
import { getReactFiberFromElement } from "./reactFiberUtils";

export function findFiberByHtmlElement(
  target: HTMLElement | SVGElement,
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
  const fiber = getReactFiberFromElement(target);
  if (fiber) {
    if (shouldHaveDebugSource) {
      return findDebugSource(fiber)?.fiber || null;
    }
    return fiber;
  }

  return null;
}
