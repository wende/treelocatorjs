import { AdapterObject, FullElementInfo } from "../adapterApi";
import { Source } from "@locator/shared";
import { TreeNodeComponent } from "../../types/TreeNode";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";
export declare function getElementInfo(found: HTMLElement): FullElementInfo | null;
export declare class ReactTreeNodeElement extends HtmlElementTreeNode {
    getSource(): Source | null;
    private fiberToTreeNodeComponent;
    getComponent(): TreeNodeComponent | null;
    /**
     * Traverse the _debugOwner chain to collect all owner components.
     * This finds wrapper components (like Sidebar) that don't render their own DOM elements
     * but wrap other components (like GlassPanel) that do.
     *
     * Returns array from outermost owner (Sidebar) to innermost (GlassPanel).
     */
    getOwnerComponents(): TreeNodeComponent[];
}
declare const reactAdapter: AdapterObject;
export default reactAdapter;
