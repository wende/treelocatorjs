import { TreeNode } from "../types/TreeNode";
import { ReactTreeNodeElement } from "./react/reactAdapter";
import { JSXTreeNodeElement } from "./jsx/jsxAdapter";
import { SvelteTreeNodeElement } from "./svelte/svelteAdapter";
import { VueTreeNodeElement } from "./vue/vueAdapter";
import { detectFramework } from "./detectFramework";

export function createTreeNode(
  element: HTMLElement,
  adapterId?: string
): TreeNode | null {
  // Check for explicit adapter ID first
  if (adapterId === "react") return new ReactTreeNodeElement(element);
  if (adapterId === "svelte") return new SvelteTreeNodeElement(element);
  if (adapterId === "vue") return new VueTreeNodeElement(element);
  if (adapterId === "jsx") return new JSXTreeNodeElement(element);

  // Auto-detect framework
  const framework = detectFramework(element);
  switch (framework) {
    case "svelte": return new SvelteTreeNodeElement(element);
    case "vue": return new VueTreeNodeElement(element);
    case "react": return new ReactTreeNodeElement(element);
    case "jsx": return new JSXTreeNodeElement(element);
    default: return null;
  }
}
