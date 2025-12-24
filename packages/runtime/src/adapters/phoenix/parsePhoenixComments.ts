import { ServerComponentInfo } from "../../types/ServerComponentInfo";
import { PhoenixCommentMatch } from "./types";

/**
 * Regex patterns for Phoenix LiveView debug annotations.
 *
 * These comments are added by Phoenix LiveView when configured with:
 * config :phoenix_live_view, debug_heex_annotations: true
 *
 * Pattern 1 (Caller): <!-- @caller lib/app_web/home_live.ex:20 -->
 * Pattern 2 (Component): <!-- <AppWeb.CoreComponents.header> lib/app_web/core_components.ex:123 -->
 * Pattern 3 (Closing): <!-- </AppWeb.CoreComponents.header> -->
 */
const PHOENIX_CALLER_PATTERN = /^@caller\s+(.+):(\d+)$/;
const PHOENIX_COMPONENT_PATTERN = /^<([^>]+)>\s+(.+):(\d+)$/;
const PHOENIX_CLOSING_PATTERN = /^<\/([^>]+)>$/;

/**
 * Parse a single HTML comment node for Phoenix debug annotations.
 * Returns null if the comment doesn't match Phoenix patterns.
 */
function parseCommentNode(commentNode: Comment): PhoenixCommentMatch | null {
  const text = commentNode.textContent?.trim();
  if (!text) return null;

  // Check for @caller pattern: <!-- @caller lib/app_web/home_live.ex:20 -->
  const callerMatch = text.match(PHOENIX_CALLER_PATTERN);
  if (callerMatch && callerMatch[1] && callerMatch[2]) {
    return {
      commentNode,
      name: "@caller",
      filePath: callerMatch[1],
      line: parseInt(callerMatch[2], 10),
      type: "caller",
    };
  }

  // Check for component opening pattern: <!-- <AppWeb.CoreComponents.header> lib/app_web/core_components.ex:123 -->
  const componentMatch = text.match(PHOENIX_COMPONENT_PATTERN);
  if (componentMatch && componentMatch[1] && componentMatch[2] && componentMatch[3]) {
    return {
      commentNode,
      name: componentMatch[1],
      filePath: componentMatch[2],
      line: parseInt(componentMatch[3], 10),
      type: "component",
    };
  }

  // Closing tags are ignored (we only care about opening tags)
  // Example: <!-- </AppWeb.CoreComponents.header> -->
  if (text.match(PHOENIX_CLOSING_PATTERN)) {
    return null;
  }

  // Not a Phoenix comment
  return null;
}

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
export function findPrecedingPhoenixComments(
  element: Element
): PhoenixCommentMatch[] {
  const matches: PhoenixCommentMatch[] = [];
  let node: Node | null = element.previousSibling;

  // Walk backward through siblings, collecting comment nodes
  while (node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const match = parseCommentNode(node as Comment);
      if (match) {
        matches.push(match);
      }
      // Continue even if this comment didn't match - keep looking for more Phoenix comments
    } else if (node.nodeType === Node.TEXT_NODE) {
      // Skip whitespace text nodes
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        // Hit non-whitespace text, stop searching
        break;
      }
    } else {
      // Hit another element, stop searching
      break;
    }
    node = node.previousSibling;
  }

  // Reverse so outermost comes first (matches Phoenix nesting order)
  // This makes the array order match the visual hierarchy: [@caller, Component]
  return matches.reverse();
}

/**
 * Convert PhoenixCommentMatch[] to ServerComponentInfo[].
 * Filters and transforms matches into the format expected by AncestryItem.
 */
export function phoenixMatchesToServerComponents(
  matches: PhoenixCommentMatch[]
): ServerComponentInfo[] {
  return matches.map((match) => ({
    name: match.name,
    filePath: match.filePath,
    line: match.line,
    type: match.type,
  }));
}

/**
 * Main entry point: extract server component info from element.
 * Returns null if no Phoenix annotations found.
 *
 * This function is called during ancestry collection to enrich each AncestryItem
 * with server-side component information.
 */
export function parsePhoenixServerComponents(
  element: Element
): ServerComponentInfo[] | null {
  const matches = findPrecedingPhoenixComments(element);
  if (matches.length === 0) return null;
  return phoenixMatchesToServerComponents(matches);
}
