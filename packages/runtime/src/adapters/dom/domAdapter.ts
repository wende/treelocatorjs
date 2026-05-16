import { HtmlElementTreeNode } from "../HtmlElementTreeNode";
import { Source } from "../../types/types";
import { TreeNodeComponent } from "../../types/TreeNode";

/**
 * Fallback adapter for vanilla HTML/DOM elements when no framework is detected.
 * Provides basic DOM tree traversal without component or source information.
 */
export class DOMTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    return null;
  }

  getComponent(): TreeNodeComponent | null {
    return null;
  }

  getOwnerComponents(): TreeNodeComponent[] {
    return [];
  }
}
