import { ReactTreeNodeElement } from "./react/reactAdapter";
import { JSXTreeNodeElement } from "./jsx/jsxAdapter";
import { detectJSX, detectReact } from "@locator/shared";
import { detectPhoenix } from "./phoenix/detectPhoenix";
export function createTreeNode(element, adapterId) {
  // Check for React adapter
  if (adapterId === "react" || detectReact()) {
    return new ReactTreeNodeElement(element);
  }

  // Check for JSX adapter (babel plugin) - check if element has data-locatorjs-id
  if (adapterId === "jsx" || detectJSX() || element.dataset.locatorjsId) {
    return new JSXTreeNodeElement(element);
  }

  // Check for Phoenix LiveView (uses JSX adapter as fallback for pure Phoenix apps)
  if (detectPhoenix()) {
    return new JSXTreeNodeElement(element);
  }

  // Fallback - return null for unsupported frameworks
  return null;
}