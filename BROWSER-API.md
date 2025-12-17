# LocatorJS Browser API

LocatorJS exposes a global API (`window.__locatorjs__`) that allows browser automation tools to programmatically access component ancestry information for any element on the page.

## API Reference

### `getPath(elementOrSelector: HTMLElement | string): string | null`

Returns a formatted ancestry chain as a string, showing the component hierarchy from root to the clicked element.

**Parameters:**
- `elementOrSelector` - Either an HTMLElement or a CSS selector string

**Returns:**
- Formatted ancestry string with file paths and line numbers, or `null` if element not found/unsupported

**Example output:**
```
div in App at src/App.tsx:15
└─ header in Header at src/components/Header.tsx:8
    └─ button in LoginButton at src/components/LoginButton.tsx:12
```

### `getAncestry(elementOrSelector: HTMLElement | string): AncestryItem[] | null`

Returns raw ancestry data as an array of objects, useful for programmatic processing.

**Parameters:**
- `elementOrSelector` - Either an HTMLElement or a CSS selector string

**Returns:**
- Array of ancestry items, or `null` if element not found/unsupported

**AncestryItem structure:**
```typescript
interface AncestryItem {
  elementName: string;        // HTML element name (e.g., 'div', 'button')
  componentName?: string;     // Component name (e.g., 'LoginButton')
  filePath?: string;          // File path (e.g., 'src/components/LoginButton.tsx')
  line?: number;              // Line number in file
}
```

### `getPathData(elementOrSelector: HTMLElement | string): { path: string; ancestry: AncestryItem[] } | null`

Returns both formatted path and raw ancestry data in a single call.

**Parameters:**
- `elementOrSelector` - Either an HTMLElement or a CSS selector string

**Returns:**
- Object with `path` (string) and `ancestry` (array), or `null` if element not found/unsupported

## Usage Examples

### Playwright

```javascript
// Get path for a specific element
const path = await page.evaluate(() => {
  return window.__locatorjs__.getPath('button.submit');
});
console.log(path);

// Get ancestry data
const ancestry = await page.evaluate(() => {
  const element = document.querySelector('button.submit');
  return window.__locatorjs__.getAncestry(element);
});
console.log(ancestry);

// Use in a test helper
async function getComponentPath(page, selector) {
  return await page.evaluate((sel) => {
    return window.__locatorjs__.getPath(sel);
  }, selector);
}

test('should render login button in header', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const path = await getComponentPath(page, 'button.login');
  expect(path).toContain('LoginButton');
  expect(path).toContain('Header');
});
```

### Puppeteer

```javascript
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000');

// Get component path
const path = await page.evaluate(() => {
  return window.__locatorjs__.getPath('.my-button');
});
console.log(path);

// Get full data
const data = await page.evaluate(() => {
  return window.__locatorjs__.getPathData('.my-button');
});
console.log('Path:', data.path);
console.log('Ancestry:', data.ancestry);
```

### Selenium (WebDriver)

```javascript
const { Builder } = require('selenium-webdriver');

const driver = await new Builder().forBrowser('chrome').build();
await driver.get('http://localhost:3000');

// Get component path
const path = await driver.executeScript(() => {
  return window.__locatorjs__.getPath('button.submit');
});
console.log(path);

// Get ancestry array
const ancestry = await driver.executeScript(() => {
  return window.__locatorjs__.getAncestry('button.submit');
});
console.log(ancestry);
```

### Cypress

```javascript
// In your Cypress test
cy.visit('http://localhost:3000');

cy.window().then((win) => {
  const path = win.__locatorjs__.getPath('button.submit');
  cy.log(path);
  expect(path).to.include('SubmitButton');
});

// Or as a custom command
Cypress.Commands.add('getComponentPath', (selector) => {
  return cy.window().then((win) => {
    return win.__locatorjs__.getPath(selector);
  });
});

// Usage
cy.getComponentPath('button.submit').should('include', 'SubmitButton');
```

## Use Cases

### 1. Enhanced Test Debugging

When a test fails, automatically log the component ancestry to understand what was actually rendered:

```javascript
test('should display error message', async ({ page }) => {
  await page.goto('/login');

  const errorElement = page.locator('.error-message');

  if (await errorElement.count() === 0) {
    // Log the actual component tree for debugging
    const path = await page.evaluate(() => {
      const body = document.querySelector('body');
      return window.__locatorjs__.getPath(body);
    });
    console.log('Current component tree:', path);
  }

  await expect(errorElement).toBeVisible();
});
```

### 2. Component-Based Assertions

Assert that elements are rendered within specific components:

```javascript
async function assertComponentAncestry(page, selector, expectedComponents) {
  const ancestry = await page.evaluate((sel) => {
    return window.__locatorjs__.getAncestry(sel);
  }, selector);

  const componentNames = ancestry
    .filter(item => item.componentName)
    .map(item => item.componentName);

  for (const expected of expectedComponents) {
    if (!componentNames.includes(expected)) {
      throw new Error(
        `Expected ${selector} to be inside ${expected}, but found: ${componentNames.join(' > ')}`
      );
    }
  }
}

test('button should be in correct component', async ({ page }) => {
  await page.goto('/');
  await assertComponentAncestry(page, 'button.submit', ['Form', 'LoginPage']);
});
```

### 3. Visual Regression Context

Add component information to visual regression test failures:

```javascript
test('should match screenshot', async ({ page }) => {
  await page.goto('/dashboard');

  const element = page.locator('.widget');
  const screenshot = await element.screenshot();

  try {
    expect(screenshot).toMatchSnapshot('widget.png');
  } catch (error) {
    // Add component context to the error
    const path = await page.evaluate((sel) => {
      return window.__locatorjs__.getPath(sel);
    }, '.widget');

    console.error('Visual regression failed for:', path);
    throw error;
  }
});
```

## Notes

- The API is automatically available when LocatorJS runtime is initialized
- Works with all frameworks supported by LocatorJS (React, Vue, Svelte, Preact, etc.)
- Returns `null` if the element is not found or the framework adapter doesn't support it
- The API uses the same underlying logic as the Alt+click feature
