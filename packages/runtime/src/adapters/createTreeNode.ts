import { TreeNode } from "../types/TreeNode";
import { ReactTreeNodeElement } from "./react/reactAdapter";
import { JSXTreeNodeElement } from "./jsx/jsxAdapter";
import { SvelteTreeNodeElement } from "./svelte/svelteAdapter";
import { VueTreeNodeElement } from "./vue/vueAdapter";
import {
  detectJSX,
  detectReact,
  detectSvelte,
  detectVue,
} from "@locator/shared";
import { detectPhoenix } from "./phoenix/detectPhoenix";

export function createTreeNode(
  element: HTMLElement,
  adapterId?: string
): TreeNode | null {
  // Check for explicit adapter ID first
  if (adapterId === "react") {
    return new ReactTreeNodeElement(element);
  }
  if (adapterId === "svelte") {
    return new SvelteTreeNodeElement(element);
  }
  if (adapterId === "vue") {
    return new VueTreeNodeElement(element);
  }
  if (adapterId === "jsx") {
    return new JSXTreeNodeElement(element);
  }

  // Auto-detect framework
  if (detectSvelte()) {
    return new SvelteTreeNodeElement(element);
  }

  if (detectVue()) {
    return new VueTreeNodeElement(element);
  }

  if (detectReact()) {
    return new ReactTreeNodeElement(element);
  }

  // Check for JSX adapter (babel plugin) - check if element has data-locatorjs-id
  if (detectJSX() || element.dataset.locatorjsId) {
    return new JSXTreeNodeElement(element);
  }

  // Check for Phoenix LiveView (uses JSX adapter as fallback for pure Phoenix apps)
  if (detectPhoenix()) {
    return new JSXTreeNodeElement(element);
  }

  // Fallback - return null for unsupported frameworks
  return null;
}
