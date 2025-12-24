import { AdapterId } from "./consts";
import { AncestryItem } from "./functions/formatAncestryChain";
export interface LocatorJSAPI {
    /**
     * Get formatted ancestry path for an element.
     * Returns a human-readable string showing the component hierarchy from root to target element.
     *
     * @param elementOrSelector - HTMLElement or CSS selector string (e.g., 'button.submit', '#login-form')
     * @returns Formatted ancestry chain as string, or null if element not found/unsupported
     *
     * @example
     * // Basic usage with CSS selector
     * window.__treelocator__.getPath('button.submit');
     * // Returns:
     * // "div in App at src/App.tsx:15
     * //  └─ button in SubmitButton at src/components/SubmitButton.tsx:12"
     *
     * @example
     * // Usage with HTMLElement
     * const button = document.querySelector('button.submit');
     * window.__treelocator__.getPath(button);
     *
     * @example
     * // In Playwright
     * const path = await page.evaluate(() => {
     *   return window.__treelocator__.getPath('button.submit');
     * });
     * console.log(path);
     */
    getPath(elementOrSelector: HTMLElement | string): string | null;
    /**
     * Get raw ancestry data for an element.
     * Returns an array of objects containing component names, file paths, and line numbers.
     *
     * @param elementOrSelector - HTMLElement or CSS selector string
     * @returns Array of ancestry items with structure:
     *   - elementName: HTML element tag (e.g., 'div', 'button')
     *   - componentName: Component name (e.g., 'LoginButton')
     *   - filePath: Source file path (e.g., 'src/components/LoginButton.tsx')
     *   - line: Line number in source file
     *
     * @example
     * // Get structured ancestry data
     * const ancestry = window.__treelocator__.getAncestry('button.submit');
     * // Returns: [
     * //   { elementName: 'div', componentName: 'App', filePath: 'src/App.tsx', line: 15 },
     * //   { elementName: 'button', componentName: 'SubmitButton', filePath: 'src/components/SubmitButton.tsx', line: 12 }
     * // ]
     *
     * @example
     * // In Playwright - extract just component names
     * const components = await page.evaluate(() => {
     *   const ancestry = window.__treelocator__.getAncestry('.my-element');
     *   return ancestry?.map(item => item.componentName).filter(Boolean);
     * });
     */
    getAncestry(elementOrSelector: HTMLElement | string): AncestryItem[] | null;
    /**
     * Get both formatted path and raw ancestry data in a single call.
     * Convenience method that combines getPath() and getAncestry().
     *
     * @param elementOrSelector - HTMLElement or CSS selector string
     * @returns Object with { path: string, ancestry: AncestryItem[] }, or null
     *
     * @example
     * // Get both formats at once
     * const data = window.__treelocator__.getPathData('button.submit');
     * console.log(data.path);      // Human-readable string
     * console.log(data.ancestry);  // Structured array
     *
     * @example
     * // In Playwright - useful for comprehensive debugging
     * const data = await page.evaluate(() => {
     *   return window.__treelocator__.getPathData('.error-message');
     * });
     * if (data) {
     *   console.log('Component tree:', data.path);
     *   console.log('Source files:', data.ancestry.map(a => a.filePath));
     * }
     */
    getPathData(elementOrSelector: HTMLElement | string): {
        path: string;
        ancestry: AncestryItem[];
    } | null;
    /**
     * Display help information about the LocatorJS API.
     * Shows usage examples and method descriptions for browser automation tools.
     *
     * @returns Help text as a string
     *
     * @example
     * // View help in browser console
     * console.log(window.__treelocator__.help());
     *
     * @example
     * // In Playwright - view help
     * const help = await page.evaluate(() => window.__treelocator__.help());
     * console.log(help);
     */
    help(): string;
}
export declare function createBrowserAPI(adapterIdParam?: AdapterId): LocatorJSAPI;
export declare function installBrowserAPI(adapterIdParam?: AdapterId): void;
