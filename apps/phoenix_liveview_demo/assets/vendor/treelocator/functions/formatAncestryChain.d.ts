import { TreeNode } from "../types/TreeNode";
import { ServerComponentInfo } from "../types/ServerComponentInfo";
export interface OwnerComponentInfo {
    name: string;
    filePath?: string;
    line?: number;
}
export interface AncestryItem {
    elementName: string;
    componentName?: string;
    filePath?: string;
    line?: number;
    id?: string;
    nthChild?: number;
    /** All owner components from outermost (Sidebar) to innermost (GlassPanel) */
    ownerComponents?: OwnerComponentInfo[];
    /** Server-side components (Phoenix LiveView, Rails, Next.js RSC, etc.) */
    serverComponents?: ServerComponentInfo[];
}
export declare function collectAncestry(node: TreeNode): AncestryItem[];
export declare function formatAncestryChain(items: AncestryItem[]): string;
