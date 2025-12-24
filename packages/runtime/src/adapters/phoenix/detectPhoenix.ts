/**
 * Detect if Phoenix LiveView is present on the page.
 *
 * Checks for multiple signals:
 * 1. window.liveSocket - Phoenix LiveView JS client
 * 2. data-phx-* attributes in the DOM
 * 3. Phoenix debug comment patterns
 *
 * Returns true if any signal indicates Phoenix LiveView is running.
 */
export function detectPhoenix(): boolean {
  // Check 1: Look for LiveView socket (most reliable)
  if (typeof window !== "undefined" && (window as any).liveSocket) {
    return true;
  }

  // Check 2: Look for Phoenix data attributes in the DOM
  if (typeof document !== "undefined") {
    // Phoenix LiveView adds data-phx-main or data-phx-session to the main LiveView container
    if (document.querySelector("[data-phx-main], [data-phx-session]")) {
      return true;
    }

    // Check 3: Quick scan for Phoenix debug comments (first 50 comments)
    // This is useful when debug_heex_annotations is enabled
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_COMMENT,
      null
    );

    let count = 0;
    while (walker.nextNode() && count < 50) {
      const text = walker.currentNode.textContent;
      // Look for Phoenix-specific comment patterns
      if (text?.includes("@caller") || text?.includes("<App")) {
        return true;
      }
      count++;
    }
  }

  return false;
}
