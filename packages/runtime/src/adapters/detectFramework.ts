import { detectJSX, detectReact, detectSvelte, detectVue } from "@locator/shared";
import { detectPhoenix } from "./phoenix/detectPhoenix";

export type FrameworkId = "svelte" | "vue" | "react" | "jsx" | null;

/**
 * Check if a DOM element has __reactFiber$ keys.
 * Works without React DevTools extension.
 */
function hasReactFiberKeys(element?: HTMLElement): boolean {
  if (!element) return false;
  return Object.keys(element).some((k) => k.startsWith("__reactFiber$"));
}

/**
 * Detect the active framework, optionally considering element-level hints.
 *
 * Priority order: Svelte > Vue > React > JSX > Phoenix (uses JSX adapter)
 * JSX must be last because global data can leak from the LocatorJS extension.
 */
export function detectFramework(element?: HTMLElement): FrameworkId {
  if (detectSvelte()) return "svelte";
  if (detectVue()) return "vue";
  if (detectReact() || hasReactFiberKeys(element)) return "react";
  if (detectJSX() || (element && element.dataset.locatorjsId)) return "jsx";
  if (detectPhoenix()) return "jsx";
  return null;
}
