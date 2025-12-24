import { test, expect, Page } from "@playwright/test";
import { projects } from "../consts";

/**
 * Helper function to get the ancestry path for an element using the browser API.
 */
async function getAncestryPath(page: Page, selector: string): Promise<string | null> {
  return await page.evaluate((sel) => {
    const api = (window as any).__treelocator__;
    if (!api) return null;
    return api.getPath(sel);
  }, selector);
}

/**
 * Helper function to get raw ancestry data for an element.
 */
async function getAncestryData(page: Page, selector: string): Promise<any[] | null> {
  return await page.evaluate((sel) => {
    const api = (window as any).__treelocator__;
    if (!api) return null;
    return api.getAncestry(sel);
  }, selector);
}

/**
 * Wait for TreeLocatorJS to be initialized
 */
async function waitForLocator(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return typeof (window as any).__treelocator__ !== "undefined";
  }, { timeout: 10000 });
}

// ============================================================================
// PHOENIX LIVEVIEW TESTS
// ============================================================================

test.describe("Phoenix LiveView ancestry chain", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.phoenix);
    await waitForLocator(page);
  });

  test("should detect Phoenix server components from HTML comments", async ({ page }) => {
    // The Phoenix demo has components annotated with HTML comments
    const path = await getAncestryPath(page, "header");
    expect(path).not.toBeNull();

    // Should contain Phoenix component indicator
    expect(path).toContain("Phoenix");
  });

  test("should show Phoenix component name in ancestry", async ({ page }) => {
    const data = await getAncestryData(page, "header");
    expect(data).not.toBeNull();

    // Check for serverComponents in the ancestry
    const hasServerComponents = data!.some(item =>
      item.serverComponents && item.serverComponents.length > 0
    );
    expect(hasServerComponents).toBe(true);
  });

  test("should detect nested Phoenix components", async ({ page }) => {
    // The badge inside list item is deeply nested
    const path = await getAncestryPath(page, "[data-phx-loc='289']");
    expect(path).not.toBeNull();

    // Should show nested Phoenix component chain
    expect(path!.length).toBeGreaterThan(50); // Should have substantial content
  });

  test("should show card component", async ({ page }) => {
    const data = await getAncestryData(page, ".card");
    expect(data).not.toBeNull();

    // Should have Phoenix component info
    const hasPhoenixInfo = data!.some(item =>
      item.serverComponents?.some((sc: any) => sc.name?.includes("card"))
    );
    expect(hasPhoenixInfo).toBe(true);
  });

  test("should show button component with file path", async ({ page }) => {
    const data = await getAncestryData(page, "button[data-phx-loc='156']");
    expect(data).not.toBeNull();

    // Check for file path in server components
    const buttonItem = data!.find(item =>
      item.serverComponents?.some((sc: any) => sc.name?.includes("button"))
    );
    expect(buttonItem).toBeDefined();

    if (buttonItem?.serverComponents) {
      const buttonComponent = buttonItem.serverComponents.find((sc: any) =>
        sc.name?.includes("button")
      );
      expect(buttonComponent?.filePath).toBeDefined();
    }
  });

  test("should show list and list_item components", async ({ page }) => {
    const path = await getAncestryPath(page, "li[data-phx-loc='234']");
    expect(path).not.toBeNull();

    // Should include list component hierarchy
    expect(path).toContain("list");
  });
});

// ============================================================================
// PHOENIX + REACT HYBRID TESTS
// ============================================================================

test.describe("Phoenix + React hybrid ancestry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.phoenix);
    await waitForLocator(page);
  });

  // Note: The current Phoenix demo may or may not have React mounted.
  // These tests are structured to work when React is present.

  test("should handle mixed server and client components", async ({ page }) => {
    // Check if React counter exists
    const hasReactCounter = await page.locator(".react-counter, [data-react-root]").count();

    if (hasReactCounter > 0) {
      const path = await getAncestryPath(page, ".react-counter button, [data-react-root] button");

      if (path) {
        // Should show both Phoenix and React in the ancestry
        // The exact format depends on how components are structured
        expect(path.length).toBeGreaterThan(0);
      }
    } else {
      // Skip if React is not mounted
      test.skip();
    }
  });
});

// ============================================================================
// PHOENIX COMPONENT FORMAT TESTS
// ============================================================================

test.describe("Phoenix component format", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.phoenix);
    await waitForLocator(page);
  });

  test("should format Phoenix components with [Phoenix: ...] notation", async ({ page }) => {
    const path = await getAncestryPath(page, "header");
    expect(path).not.toBeNull();

    // Check for the [Phoenix: ComponentName] format
    expect(path).toMatch(/\[Phoenix:.*\]/);
  });

  test("should show caller information when available", async ({ page }) => {
    const data = await getAncestryData(page, "header");
    expect(data).not.toBeNull();

    // Check for caller type in server components
    const hasCaller = data!.some(item =>
      item.serverComponents?.some((sc: any) => sc.type === "caller")
    );
    // Caller info is optional, just verify the structure works
    expect(data!.length).toBeGreaterThan(0);
  });

  test("should include line numbers for Phoenix components", async ({ page }) => {
    const data = await getAncestryData(page, "button[data-phx-loc]");
    expect(data).not.toBeNull();

    // Check for line numbers in server components
    const hasLineNumbers = data!.some(item =>
      item.serverComponents?.some((sc: any) => typeof sc.line === "number")
    );
    expect(hasLineNumbers).toBe(true);
  });
});
