# TreeLocatorJS Browser API

TreeLocatorJS exposes a global API (`window.__treelocator__`) that allows browser automation tools to programmatically access component ancestry information for any element on the page.

## Before you call the API

`window.__treelocator__` exists only **after** the TreeLocator runtime has initialized in that tab. It is not available on arbitrary pages by default.

| How runtime loads | When to use |
|-------------------|-------------|
| `npx @treelocator/init` or `@treelocator/vite` in dev | Your own app / E2E tests against it |
| Chrome extension on localhost | Apps without a runtime import |
| MCP tools (`@treelocator/mcp`) | AI agents inspecting a tab where runtime is already running |

There is **no** console one-liner or CDN script to inject TreeLocator onto any URL. See [PLAYWRIGHT-AND-AUTOMATION.md](./PLAYWRIGHT-AND-AUTOMATION.md) for Playwright fixtures, extension loading, MCP vs Playwright, and common misconceptions.

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

### `getTree(selectorOrOptions?: string | GetTreeOptions, options?: GetTreeOptions): Promise<SourceAwareTreeResult | null>`

Returns a bounded source-aware page tree for AI agents. This is not a full browser accessibility tree; it is a compact DOM-derived tree annotated with semantic labels and TreeLocator source/component ancestry.

Note: `name` is computed heuristically (aria-label → aria-labelledby → alt → title → labels → placeholder → direct text) and not a spec-compliant accessible-name computation. Typed values for password / text / email / search inputs are never surfaced as the accessible name; their associated `<label>` or placeholder is used instead.

**Parameters:**
- `selectorOrOptions` - Optional CSS selector root, or an options object
- `options.selector` - Optional CSS selector root when calling with an options object
- `options.maxDepth` - Optional depth bound. Default `8`
- `options.maxNodes` - Optional node bound. Default `500`
- `options.includeHidden` - Include hidden or zero-size nodes. Default `false`
- `options.includeText` - Include compact text snippets. Default `true`

**Returns:**
- Object with `root`, `nodeCount`, `truncated`, and resolved `options`, or `null` if selector/root is not found

**Example:**
```javascript
const tree = await window.__treelocator__.getTree("main", {
  maxDepth: 4,
  maxNodes: 100,
});
console.log(tree.root.children);
```

### `queryBySource(options: QueryBySourceOptions): Promise<QueryBySourceResult>`

Reverse lookup: given a source `file:line`, find the live DOM element(s) rendered from that location. The inverse of `getPath` — if `getPath(selector)` reports `file:line`, then `queryBySource({ file, line })` should find that element.

**Parameters:**
- `options.file` - Source file path (absolute or relative; normalized in the response)
- `options.line` - Line number in the source file
- `options.column` - Optional column (not strictly enforced; line + tolerance is primary)
- `options.tolerance` - Lines of slack when the cursor isn't on the exact JSX opening tag (default `0`)
- `options.includeHidden` - Include `display:none` / `visibility:hidden` nodes (default `false`)
- `options.includeStyles` - Run `getStyles()` for each match (default `false`)
- `options.includeCssReport` - Run `getCSSReport()` for each match (default `false`)
- `options.maxMatches` - Cap returned matches; extras set `truncated` (default `10`)

**Returns:**
```typescript
interface QueryBySourceResult {
  found: boolean;
  rendered: boolean;           // at least one match selector resolves in the live DOM
  browserConnected: boolean;   // always true in-browser; MCP sets false when no tab connected
  normalizedFile: string;
  query: { file: string; line: number; column?: number; tolerance: number };
  matches: SourceMatch[];
  truncated: boolean;
}
```

Each `SourceMatch` includes `selector`, `path`, `ancestry`, `confidence` (`high` | `medium` | `low`), and `matchStrategy` (`path-attr`, `locator-data`, `fiber`, `svelte-meta`, `vue-meta`, `server-component`, `tree-scan`).

**Example:**
```javascript
const result = await window.__treelocator__.queryBySource({
  file: "src/components/Button.tsx",
  line: 23,
  tolerance: 1,
});
if (result.found && result.rendered) {
  console.log(result.matches[0].selector, result.matches[0].path);
}
```

### `findBySource(options: FindBySourceOptions): Promise<FindBySourceResult>`

Reverse lookup by component name and/or file. Answers "where does `<SaveButton />` render?" or "what did `src/Sidebar.tsx` produce?" Uses the source-aware tree (`getTree`) as its index.

**Parameters:**
- `options.component` - Component name to search for
- `options.file` - File path to search for (at least one of `component` or `file` required)
- `options.includeHidden` - Include hidden nodes (default `true`)
- `options.maxMatches` - Cap results (default `25`)

**Returns:** `{ found, matches[], truncated }` where each match has `selector`, `path`, `file`, `line`, and `confidence: "low"`.

**Example:**
```javascript
const { matches } = await window.__treelocator__.findBySource({
  component: "CommandBar",
});
```

### `highlightBySource(options: QueryBySourceOptions, durationMs?: number): Promise<{ count: number; cancel: () => void }>`

Same lookup as `queryBySource`, plus a transient outline around each match (default 3 seconds). Returns `{ count, cancel }` where `cancel()` removes the overlay early.

**Example:**
```javascript
const { count } = await window.__treelocator__.highlightBySource({
  file: "src/Button.tsx",
  line: 23,
}, 5000);
```

See [SOURCE-TO-DOM.md](./SOURCE-TO-DOM.md) for match strategies, verify-after-edit workflow, and design rationale.

### `takeSnapshot(selector: string, snapshotId: string, options?: SnapshotOptions): SnapshotResult | Promise<SnapshotResult>`

Persists a reload-safe baseline under `snapshotId`.

With no tree options, this keeps the existing behavior: it snapshots the selected element's computed styles and bounding rect.

When `options` includes a `getTree` option such as `maxDepth`, it snapshots the source-aware tree rooted at the selected element instead.

**Tree snapshot options:**
- `options.maxDepth` - Depth bound. `0` captures only the selected root, `1` includes direct children
- `options.maxNodes` - Node bound
- `options.includeHidden` - Include hidden or zero-size nodes
- `options.includeText` - Include compact text snippets
- `options.index` - Pick among multiple selector matches
- `options.label` - Optional label for formatted reports

**Examples:**
```javascript
// Computed-style snapshot, unchanged behavior
window.__treelocator__.takeSnapshot(".hero", "hero-style");

// Source-aware tree snapshot rooted at .hero
await window.__treelocator__.takeSnapshot(".hero", "hero-tree", {
  maxDepth: 3,
  maxNodes: 500,
  includeHidden: false,
  includeText: true,
});
```

### `getSnapshotDiff(snapshotId: string): SnapshotDiff | Promise<SnapshotDiff>`

Diffs the current page against the stored baseline. The stored snapshot decides which diff engine runs: style snapshots compare computed styles, while tree snapshots compare structure, semantic labels, source/component metadata, visibility, and rect changes.

```javascript
const diff = await window.__treelocator__.getSnapshotDiff("hero-tree");
console.log(diff.formatted);
```

### `getStyles(elementOrSelector: HTMLElement | string, options?: { includeDefaults?: boolean }): { formatted: string; snapshot: object } | null`

Returns a formatted computed-style summary for the element plus a raw snapshot object.

**Parameters:**
- `elementOrSelector` - Either an HTMLElement or a CSS selector string
- `options.includeDefaults` - Optional. When `true`, includes curated properties even if they match browser defaults for that tag

**Returns:**
- Object with `formatted` (human-readable string) and `snapshot` (raw property values + bounding rect), or `null` if element not found

**Example output:**
```text
[ComputedStyles] App heading at src/app.jsx:72
────────────────────────────────────────

Layout
  display: block
  margin: 34.304px 0px

Typography
  font-size: 51.2px
  font-weight: 700
  line-height: 56.32px
```

## Usage Examples

### Playwright

```javascript
// Get path for a specific element
const path = await page.evaluate(() => {
  return window.__treelocator__.getPath('button.submit');
});
console.log(path);

// Get ancestry data
const ancestry = await page.evaluate(() => {
  const element = document.querySelector('button.submit');
  return window.__treelocator__.getAncestry(element);
});
console.log(ancestry);

// Use in a test helper
async function getComponentPath(page, selector) {
  return await page.evaluate((sel) => {
    return window.__treelocator__.getPath(sel);
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
  return window.__treelocator__.getPath('.my-button');
});
console.log(path);

// Get full data
const data = await page.evaluate(() => {
  return window.__treelocator__.getPathData('.my-button');
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
  return window.__treelocator__.getPath('button.submit');
});
console.log(path);

// Get ancestry array
const ancestry = await driver.executeScript(() => {
  return window.__treelocator__.getAncestry('button.submit');
});
console.log(ancestry);
```

### Cypress

```javascript
// In your Cypress test
cy.visit('http://localhost:3000');

cy.window().then((win) => {
  const path = win.__treelocator__.getPath('button.submit');
  cy.log(path);
  expect(path).to.include('SubmitButton');
});

// Or as a custom command
Cypress.Commands.add('getComponentPath', (selector) => {
  return cy.window().then((win) => {
    return win.__treelocator__.getPath(selector);
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
      return window.__treelocator__.getPath(body);
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
    return window.__treelocator__.getAncestry(sel);
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
      return window.__treelocator__.getPath(sel);
    }, '.widget');

    console.error('Visual regression failed for:', path);
    throw error;
  }
});
```

## Notes

- The API is automatically available when TreeLocatorJS runtime is initialized
- Works with all frameworks supported by TreeLocatorJS (React, Vue, Svelte, Preact, etc.)
- Returns `null` if the element is not found or the framework adapter doesn't support it
- The API uses the same underlying logic as the Alt+click feature
- There is no standalone console snippet to inject runtime on arbitrary pages — see [PLAYWRIGHT-AND-AUTOMATION.md](./PLAYWRIGHT-AND-AUTOMATION.md)
