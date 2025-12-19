import { SimpleDOMRect, Source } from "./types";

export interface TreeNode {
  type: "component" | "element";
  name: string;
  uniqueId: string;
  getBox(): SimpleDOMRect | null;
  getParent(): TreeNode | null;
  getChildren(): TreeNode[];
  getSource(): Source | null;
  getComponent(): TreeNodeComponent | null;
  /**
   * Get all owner components in the ownership chain.
   * For React: traverses _debugOwner chain until hitting parent DOM element's owner.
   * Returns array from outermost (user's component like Sidebar) to innermost (wrapper like GlassPanel).
   */
  getOwnerComponents(): TreeNodeComponent[];
}

export type TreeNodeComponent = {
  label: string;
  callLink?: Source;
  definitionLink?: Source;
};

export interface TreeNodeElement extends TreeNode {
  getElement(): Element | Text;
}
