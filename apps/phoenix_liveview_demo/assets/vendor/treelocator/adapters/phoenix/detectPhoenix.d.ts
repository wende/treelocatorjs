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
export declare function detectPhoenix(): boolean;
