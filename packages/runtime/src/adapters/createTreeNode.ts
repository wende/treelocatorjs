import { TreeNode } from "../types/TreeNode";
import { ReactTreeNodeElement } from "./react/reactAdapter";
import { JSXTreeNodeElement } from "./jsx/jsxAdapter";
import { SvelteTreeNodeElement } from "./svelte/svelteAdapter";
import { VueTreeNodeElement } from "./vue/vueAdapter";
import { DOMTreeNodeElement } from "./dom/domAdapter";
import { detectFramework, FrameworkId } from "./detectFramework";

type TreeNodeConstructor = new (element: HTMLElement) => TreeNode;

// Single source of truth mapping a framework to its TreeNode implementation.
const TREE_NODE_BY_FRAMEWORK: Record<
  NonNullable<FrameworkId>,
  TreeNodeConstructor
> = {
  react: ReactTreeNodeElement,
  svelte: SvelteTreeNodeElement,
  vue: VueTreeNodeElement,
  jsx: JSXTreeNodeElement,
};

export function createTreeNode(
  element: HTMLElement,
  adapterId?: string
): TreeNode | null {
  // Use the explicit adapter id when it names a known framework, otherwise
  // fall back to auto-detection (matching the original behavior).
  const explicit =
    adapterId && adapterId in TREE_NODE_BY_FRAMEWORK
      ? (adapterId as NonNullable<FrameworkId>)
      : undefined;
  const framework = explicit ?? detectFramework(element);
  const TreeNodeForFramework = framework
    ? TREE_NODE_BY_FRAMEWORK[framework]
    : undefined;

  // Fall back to the DOM adapter when the framework is unknown.
  return new (TreeNodeForFramework ?? DOMTreeNodeElement)(element);
}
