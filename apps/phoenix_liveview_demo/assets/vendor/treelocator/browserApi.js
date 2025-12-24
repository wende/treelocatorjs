import { createTreeNode } from "./adapters/createTreeNode";
import { collectAncestry, formatAncestryChain } from "./functions/formatAncestryChain";
let adapterId;
function resolveElement(elementOrSelector) {
  if (typeof elementOrSelector === "string") {
    const element = document.querySelector(elementOrSelector);
    return element instanceof HTMLElement ? element : null;
  }
  return elementOrSelector;
}
function getAncestryForElement(element) {
  const treeNode = createTreeNode(element, adapterId);
  if (!treeNode) {
    return null;
  }
  return collectAncestry(treeNode);
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
export function createBrowserAPI(adapterIdParam) {
  adapterId = adapterIdParam;
  return {
    getPath(elementOrSelector) {
      const element = resolveElement(elementOrSelector);
      if (!element) {
        return null;
      }
      const ancestry = getAncestryForElement(element);
      if (!ancestry) {
        return null;
      }
      return formatAncestryChain(ancestry);
    },
    getAncestry(elementOrSelector) {
      const element = resolveElement(elementOrSelector);
      if (!element) {
        return null;
      }
      return getAncestryForElement(element);
    },
    getPathData(elementOrSelector) {
      const element = resolveElement(elementOrSelector);
      if (!element) {
        return null;
      }
      const ancestry = getAncestryForElement(element);
      if (!ancestry) {
        return null;
      }
      return {
        path: formatAncestryChain(ancestry),
        ancestry
      };
    },
    help() {
      return HELP_TEXT;
    }
  };
}
export function installBrowserAPI(adapterIdParam) {
  if (typeof window !== "undefined") {
    window.__treelocator__ = createBrowserAPI(adapterIdParam);
  }
}