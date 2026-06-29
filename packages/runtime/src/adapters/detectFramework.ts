import { detectJSX, detectReact, detectSvelte, detectVue } from "@locator/shared";
import { detectPhoenix } from "./phoenix/detectPhoenix";
import { hasReactFiber } from "./react/reactFiberUtils";

export type FrameworkId = "svelte" | "vue" | "react" | "jsx" | null;

/**
 * Detect the active framework, optionally considering element-level hints.
 *
 * Priority order: Svelte > Vue > React > JSX > Phoenix (uses JSX adapter)
 * JSX must be last because global data can leak from the LocatorJS extension.
 */
export function detectFramework(element?: HTMLElement): FrameworkId {
  if (detectSvelte()) return "svelte";
  if (detectVue()) return "vue";
  if (detectReact() || hasReactFiber(element)) return "react";
  if (detectJSX() || (element && element.dataset.locatorjsId)) return "jsx";
  if (detectPhoenix()) return "jsx";
  return null;
}
