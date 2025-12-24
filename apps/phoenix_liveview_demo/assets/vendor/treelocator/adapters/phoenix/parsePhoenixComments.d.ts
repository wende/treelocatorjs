import { ServerComponentInfo } from "../../types/ServerComponentInfo";
import { PhoenixCommentMatch } from "./types";
/**
 * Find all Phoenix comment annotations immediately preceding an element.
 * Walks backward through previous siblings until hitting a non-comment node.
 *
 * Returns array ordered from outermost to innermost (matching Phoenix nesting order).
 * Example: [@caller, CoreComponents.button] where @caller is outermost.
 *
 * Example DOM structure:
 * ```html
 * <!-- @caller lib/app_web/home_live.ex:48 -->
 * <!-- <AppWeb.CoreComponents.button> lib/app_web/core_components.ex:456 -->
 * <button>Click Me</button>
 * ```
 *
 * Would return: [
 *   { name: "@caller", filePath: "lib/app_web/home_live.ex", line: 48, type: "caller" },
 *   { name: "AppWeb.CoreComponents.button", filePath: "lib/app_web/core_components.ex", line: 456, type: "component" }
 * ]
 */
export declare function findPrecedingPhoenixComments(element: Element): PhoenixCommentMatch[];
/**
 * Convert PhoenixCommentMatch[] to ServerComponentInfo[].
 * Filters and transforms matches into the format expected by AncestryItem.
 */
export declare function phoenixMatchesToServerComponents(matches: PhoenixCommentMatch[]): ServerComponentInfo[];
/**
 * Main entry point: extract server component info from element.
 * Returns null if no Phoenix annotations found.
 *
 * This function is called during ancestry collection to enrich each AncestryItem
 * with server-side component information.
 */
export declare function parsePhoenixServerComponents(element: Element): ServerComponentInfo[] | null;
