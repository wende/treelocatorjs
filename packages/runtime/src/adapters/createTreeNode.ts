import { TreeNode } from "../types/TreeNode";
import { ReactTreeNodeElement } from "./react/reactAdapter";
import { JSXTreeNodeElement } from "./jsx/jsxAdapter";
import {
  detectJSX,
  detectReact,
} from "@locator/shared";

export function createTreeNode(
  element: HTMLElement,
  adapterId?: string
): TreeNode | null {
  // Check for React adapter
  if (adapterId === "react" || detectReact()) {
    return new ReactTreeNodeElement(element);
  }

  // Check for JSX adapter (babel plugin) - check if element has data-locatorjs-id
  if (adapterId === "jsx" || detectJSX() || element.dataset.locatorjsId) {
    return new JSXTreeNodeElement(element);
  }

  // Fallback - return null for unsupported frameworks
  return null;
}
