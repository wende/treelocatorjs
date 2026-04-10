import { AdapterId } from "./consts";
import { createTreeNode } from "./adapters/createTreeNode";
import {
  collectAncestry,
  formatAncestryChain,
  AncestryItem,
} from "./functions/formatAncestryChain";
import { enrichAncestryWithSourceMaps } from "./functions/enrichAncestrySourceMaps";
import { extractComputedStyles, ComputedStylesResult } from "./functions/extractComputedStyles";
import type { DejitterFinding, DejitterSummary } from "./dejitter/recorder";
import type { InteractionEvent } from "./components/RecordingResults";

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
  getPath(elementOrSelector: HTMLElement | string): Promise<string | null>;

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
  getAncestry(elementOrSelector: HTMLElement | string): Promise<AncestryItem[] | null>;

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
  getPathData(
    elementOrSelector: HTMLElement | string
  ): Promise<{ path: string; ancestry: AncestryItem[] } | null>;

  /**
   * Get computed styles for an element, formatted for AI consumption.
   * Extracts layout, visual, typography, and interaction styles filtered against browser defaults.
   * Clicking the same element twice within 30s returns a diff of changed properties.
   *
   * @param elementOrSelector - HTMLElement or CSS selector string
   * @returns Object with formatted string and raw snapshot, or null if element not found
   *
   * @example
   * // Get formatted computed styles
   * const result = window.__treelocator__.getStyles('button.submit');
   * console.log(result.formatted);
   * // [ComputedStyles] Button at src/Button.tsx:23
   * // ─────────────────────────────────────────
   * // Layout
   * //   display: flex
   * //   padding: 8px 16px
   * // ...
   *
   * @example
   * // In Playwright
   * const styles = await page.evaluate(() => {
   *   return window.__treelocator__.getStyles('.my-element');
   * });
   * console.log(styles?.formatted);
   */
  getStyles(elementOrSelector: HTMLElement | string): ComputedStylesResult | null;

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

  /**
   * Replay the last recorded interaction sequence.
   * Dispatches the recorded clicks at the original positions and timing.
   * Must have a completed recording with interactions to replay.
   *
   * @example
   * // In browser console
   * window.__treelocator__.replay();
   *
   * @example
   * // In Playwright
   * await page.evaluate(() => window.__treelocator__.replay());
   */
  replay(): void;

  /**
   * Replay the last recorded interaction sequence while recording an element's property changes.
   * Combines replay and dejitter recording: plays back stored clicks at original timing while
   * tracking visual changes (opacity, transform, position, size) on the target element.
   * Returns the dejitter analysis results when replay completes.
   *
   * @param elementOrSelector - HTMLElement or CSS selector for the element to record during replay
   * @returns Promise resolving to recording results with findings, summary, and interaction log
   *
   * @example
   * // Record the sliding panel while replaying user clicks
   * const results = await window.__treelocator__.replayWithRecord('[data-locatorjs-id="SlidingPanel"]');
   * console.log(results.findings); // anomaly analysis
   * console.log(results.path);     // component ancestry
   *
   * @example
   * // In Playwright - automated regression test
   * const results = await page.evaluate(async () => {
   *   return await window.__treelocator__.replayWithRecord('.my-panel');
   * });
   * expect(results.findings.filter(f => f.severity === 'high')).toHaveLength(0);
   */
  replayWithRecord(
    elementOrSelector: HTMLElement | string
  ): Promise<{
    path: string;
    findings: DejitterFinding[];
    summary: DejitterSummary | null;
    data: any;
    interactions: InteractionEvent[];
  } | null>;
}

function resolveElement(
  elementOrSelector: HTMLElement | string
): HTMLElement | null {
  if (typeof elementOrSelector === "string") {
    const element = document.querySelector(elementOrSelector);
    return element instanceof HTMLElement ? element : null;
  }
  return elementOrSelector;
}

function getAncestryForElement(element: HTMLElement, adapterId?: AdapterId): AncestryItem[] | null {
  const treeNode = createTreeNode(element, adapterId);
  if (!treeNode) {
    return null;
  }
  return collectAncestry(treeNode);
}

async function getEnrichedAncestryForElement(
  element: HTMLElement,
  adapterId?: AdapterId
): Promise<AncestryItem[] | null> {
  const ancestry = getAncestryForElement(element, adapterId);
  if (!ancestry) return null;
  return enrichAncestryWithSourceMaps(ancestry, element);
}

const HELP_TEXT = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                        TreeLocatorJS Browser API                          ║
║                  Programmatic Component Ancestry Access                   ║
╚═══════════════════════════════════════════════════════════════════════════╝

METHODS:
--------

1. getPath(elementOrSelector)
   Returns a formatted string showing the component hierarchy.

   Usage:
     window.__treelocator__.getPath('button.submit')
     window.__treelocator__.getPath(document.querySelector('.my-button'))

   Returns:
     "div in App at src/App.tsx:15
      └─ button in SubmitButton at src/components/SubmitButton.tsx:12"

2. getAncestry(elementOrSelector)
   Returns raw ancestry data as an array of objects.

   Usage:
     window.__treelocator__.getAncestry('button.submit')

   Returns:
     [
       { elementName: 'div', componentName: 'App',
         filePath: 'src/App.tsx', line: 15 },
       { elementName: 'button', componentName: 'SubmitButton',
         filePath: 'src/components/SubmitButton.tsx', line: 12 }
     ]

3. getPathData(elementOrSelector)
   Returns both formatted path and raw ancestry in one call.

   Usage:
     const data = window.__treelocator__.getPathData('button.submit')
     console.log(data.path)      // formatted string
     console.log(data.ancestry)  // structured array

4. getStyles(elementOrSelector)
   Returns computed styles for an element, optimized for AI consumption.
   Filters out browser defaults and groups by category (Layout, Visual, Typography).
   Calling twice on the same element within 30s returns a diff of changes.

   Usage:
     const result = window.__treelocator__.getStyles('button.submit')
     console.log(result.formatted)  // formatted styles string
     console.log(result.snapshot)   // raw property values + bounding rect

5. replay()
   Replays the last recorded interaction sequence as a macro.

   Usage:
     window.__treelocator__.replay()

6. replayWithRecord(elementOrSelector)
   Replays stored interactions while recording element changes.
   Returns dejitter analysis when replay completes.

   Usage:
     const results = await window.__treelocator__.replayWithRecord('[data-locatorjs-id="SlidingPanel"]')
     console.log(results.findings)  // anomaly analysis
     console.log(results.path)      // component ancestry

7. help()
   Displays this help message.

PLAYWRIGHT EXAMPLES:
-------------------

// Get component path for debugging
const path = await page.evaluate(() => {
  return window.__treelocator__.getPath('button.submit');
});
console.log(path);

// Extract component names
const components = await page.evaluate(() => {
  const ancestry = window.__treelocator__.getAncestry('.error-message');
  return ancestry?.map(item => item.componentName).filter(Boolean);
});

// Create a test helper
async function getComponentPath(page, selector) {
  return await page.evaluate((sel) => {
    return window.__treelocator__.getPath(sel);
  }, selector);
}

PUPPETEER EXAMPLES:
------------------

const path = await page.evaluate(() => {
  return window.__treelocator__.getPath('.my-button');
});

SELENIUM EXAMPLES:
-----------------

const path = await driver.executeScript(() => {
  return window.__treelocator__.getPath('button.submit');
});

CYPRESS EXAMPLES:
----------------

cy.window().then((win) => {
  const path = win.__treelocator__.getPath('button.submit');
  cy.log(path);
});

NOTES:
------
• Accepts CSS selectors or HTMLElement objects
• Returns null if element not found or framework not supported
• Works with React, Vue, Svelte, Preact, and any JSX framework
• Automatically installed when TreeLocatorJS runtime initializes

Documentation: https://github.com/wende/treelocatorjs
`;

export function createBrowserAPI(
  adapterId?: AdapterId
): LocatorJSAPI {
  return {
    getPath(elementOrSelector: HTMLElement | string): Promise<string | null> {
      const element = resolveElement(elementOrSelector);
      if (!element) {
        return Promise.resolve(null);
      }

      return getEnrichedAncestryForElement(element, adapterId).then((ancestry) =>
        ancestry ? formatAncestryChain(ancestry) : null
      );
    },

    getAncestry(
      elementOrSelector: HTMLElement | string
    ): Promise<AncestryItem[] | null> {
      const element = resolveElement(elementOrSelector);
      if (!element) {
        return Promise.resolve(null);
      }

      return getEnrichedAncestryForElement(element, adapterId);
    },

    getPathData(
      elementOrSelector: HTMLElement | string
    ): Promise<{ path: string; ancestry: AncestryItem[] } | null> {
      const element = resolveElement(elementOrSelector);
      if (!element) {
        return Promise.resolve(null);
      }

      return getEnrichedAncestryForElement(element, adapterId).then((ancestry) =>
        ancestry ? { path: formatAncestryChain(ancestry), ancestry } : null
      );
    },

    getStyles(elementOrSelector: HTMLElement | string): ComputedStylesResult | null {
      const element = resolveElement(elementOrSelector);
      if (!element) return null;

      // Build label from ancestry if available
      let label: string | undefined;
      const ancestry = getAncestryForElement(element, adapterId);
      if (ancestry && ancestry.length > 0) {
        const item = ancestry[0]!;
        const name = item.componentName || item.elementName;
        const location = item.filePath ? ` at ${item.filePath}:${item.line}` : "";
        label = `${name}${location}`;
      }

      return extractComputedStyles(element, label);
    },

    help(): string {
      return HELP_TEXT;
    },

    replay() {
      // Replaced by Runtime component once mounted
    },

    replayWithRecord() {
      // Replaced by Runtime component once mounted
      return Promise.resolve(null);
    },
  };
}

export function installBrowserAPI(adapterIdParam?: AdapterId): void {
  if (typeof window !== "undefined") {
    (window as any).__treelocator__ = createBrowserAPI(adapterIdParam);
  }
}
