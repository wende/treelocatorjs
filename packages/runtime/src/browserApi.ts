import { AdapterId } from "./consts";
import { createTreeNode } from "./adapters/createTreeNode";
import {
  collectAncestry,
  formatAncestryChain,
  AncestryItem,
} from "./functions/formatAncestryChain";
import { enrichAncestryWithSourceMaps } from "./functions/enrichAncestrySourceMaps";

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

let adapterId: AdapterId | undefined;

function resolveElement(
  elementOrSelector: HTMLElement | string
): HTMLElement | null {
  if (typeof elementOrSelector === "string") {
    const element = document.querySelector(elementOrSelector);
    return element instanceof HTMLElement ? element : null;
  }
  return elementOrSelector;
}

function getAncestryForElement(element: HTMLElement): AncestryItem[] | null {
  const treeNode = createTreeNode(element, adapterId);
  if (!treeNode) {
    return null;
  }
  return collectAncestry(treeNode);
}

async function getEnrichedAncestryForElement(
  element: HTMLElement
): Promise<AncestryItem[] | null> {
  const ancestry = getAncestryForElement(element);
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

4. help()
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
  const path = win.__locatorjs__.getPath('button.submit');
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
  adapterIdParam?: AdapterId
): LocatorJSAPI {
  adapterId = adapterIdParam;

  return {
    getPath(elementOrSelector: HTMLElement | string): Promise<string | null> {
      const element = resolveElement(elementOrSelector);
      if (!element) {
        return Promise.resolve(null);
      }

      return getEnrichedAncestryForElement(element).then((ancestry) =>
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

      return getEnrichedAncestryForElement(element);
    },

    getPathData(
      elementOrSelector: HTMLElement | string
    ): Promise<{ path: string; ancestry: AncestryItem[] } | null> {
      const element = resolveElement(elementOrSelector);
      if (!element) {
        return Promise.resolve(null);
      }

      return getEnrichedAncestryForElement(element).then((ancestry) =>
        ancestry ? { path: formatAncestryChain(ancestry), ancestry } : null
      );
    },

    help(): string {
      return HELP_TEXT;
    },
  };
}

export function installBrowserAPI(adapterIdParam?: AdapterId): void {
  if (typeof window !== "undefined") {
    (window as any).__treelocator__ = createBrowserAPI(adapterIdParam);
  }
}
