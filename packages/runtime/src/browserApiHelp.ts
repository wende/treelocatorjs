/**
 * Help text shown by window.__treelocator__.help().
 * Kept in its own module so the API implementation stays readable.
 */

export const HELP_TEXT = `
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

4. getStyles(elementOrSelector, options?)
   Returns computed styles for an element, optimized for AI consumption.
   Filters out browser defaults and groups by category (Layout, Visual, Typography).
   Pass { includeDefaults: true } for a fuller dump closer to DevTools.
   Calling twice on the same element within 30s returns a diff of changes.

   Usage:
     const result = window.__treelocator__.getStyles('button.submit')
     console.log(result.formatted)  // formatted styles string
     console.log(result.snapshot)   // raw property values + bounding rect
     const full = window.__treelocator__.getStyles('h1', { includeDefaults: true })

5. getCSSRules(elementOrSelector)
   Returns structured CSS rule data for the element.
   Shows all matching rules grouped by property with specificity and source.

   Usage:
     const result = window.__treelocator__.getCSSRules('button.primary')
     result.properties.forEach(p => {
       console.log(p.property + ': ' + p.value)
       p.rules.forEach(r => console.log('  ' + (r.winning ? 'WIN' : '   ') + ' ' + r.selector))
     })

6. getCSSReport(elementOrSelector, options?)
   Returns a formatted string showing all CSS rules and which wins per property.
   Pass { properties: ['color', 'font-size'] } to filter to specific properties.

   Usage:
     console.log(window.__treelocator__.getCSSReport('button.primary'))
     console.log(window.__treelocator__.getCSSReport('.card', { properties: ['color'] }))

   Returns:
     "CSS Rules for button.primary
      ════════════════════════════
      color: #333
        ✓ .button.primary  (0,2,0) — components.css
        ✗ .button          (0,1,0) — base.css
        ✗ button           (0,0,1) — reset.css"

7. replay()
   Replays the last recorded interaction sequence as a macro.

   Usage:
     window.__treelocator__.replay()

8. replayWithRecord(elementOrSelector)
   Replays stored interactions while recording element changes.
   Returns dejitter analysis when replay completes.

   Usage:
     const results = await window.__treelocator__.replayWithRecord('[data-locatorjs-id="SlidingPanel"]')
     console.log(results.findings)  // anomaly analysis
     console.log(results.path)      // component ancestry

9. diff.snapshot() / diff.computeDiff(before, after) / diff.captureDiff(action)
   Visual diff engine. Captures viewport element state and returns a compact
   delta showing what appeared, disappeared, moved, or changed.

   Usage:
     const report = await window.__treelocator__.diff.captureDiff(() => {
       document.querySelector('button.submit').click();
     });
     console.log(report.text);

10. help()
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

// Debug CSS specificity conflicts
const report = await page.evaluate(() => {
  return window.__treelocator__.getCSSReport('.my-button', { properties: ['color', 'background'] });
});
console.log(report);

// Get structured CSS data for assertions
const css = await page.evaluate(() => {
  return window.__treelocator__.getCSSRules('.my-button');
});
const colorRules = css?.properties.find(p => p.property === 'color');
console.log('Winning rule:', colorRules?.rules.find(r => r.winning));

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
