import { isLocatorsOwnElement } from "./isLocatorsOwnElement";

/** Walk up `level` DOM parents from `base`, clamping at <body>/<html> and the
 *  locator's own elements. Returns the highest reachable element. */
export function raiseElement(
  base: HTMLElement | null,
  level: number
): HTMLElement | null {
  if (!base) return null;
  const steps = Math.max(0, level);
  let el: HTMLElement = base;
  for (let i = 0; i < steps; i++) {
    const parent = el.parentElement;
    if (!parent) break;
    if (parent === document.body || parent === document.documentElement) break;
    if (isLocatorsOwnElement(parent)) break;
    el = parent;
  }
  return el;
}
