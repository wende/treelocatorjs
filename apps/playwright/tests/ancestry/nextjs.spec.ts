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
// NEXT.JS SERVER COMPONENTS TESTS
// ============================================================================

test.describe("Next.js Server Components ancestry chain", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.nextjs);
    await waitForLocator(page);
  });

  test("should detect Next.js server components from data-locatorjs attributes", async ({ page }) => {
    // The Next.js demo has components with data-locatorjs attributes
    const path = await getAncestryPath(page, "main");
    expect(path).not.toBeNull();

    // Should contain Next.js component indicator
    expect(path).toContain("[Next.js:");
  });

  test("should show Next.js component name in ancestry", async ({ page }) => {
    const data = await getAncestryData(page, "main");
    expect(data).not.toBeNull();

    // Check for serverComponents in the ancestry
    const hasServerComponents = data!.some(item =>
      item.serverComponents && item.serverComponents.length > 0
    );
    expect(hasServerComponents).toBe(true);
  });

  test("should detect Page component", async ({ page }) => {
    const path = await getAncestryPath(page, "main");
    expect(path).not.toBeNull();

    // Should show Page component from page.tsx
    expect(path).toContain("Page");
  });

  test("should show relative file paths", async ({ page }) => {
    const path = await getAncestryPath(page, "main");
    expect(path).not.toBeNull();

    // Should have relative paths like app/page.tsx, not absolute paths
    expect(path).toContain("app/page.tsx");
    expect(path).not.toContain("/Users/");
    expect(path).not.toContain("/home/");
  });

  test("should show line numbers for Next.js components", async ({ page }) => {
    const data = await getAncestryData(page, "main");
    expect(data).not.toBeNull();

    // Check for line numbers in server components
    const hasLineNumbers = data!.some(item =>
      item.serverComponents?.some((sc: any) => typeof sc.line === "number")
    );
    expect(hasLineNumbers).toBe(true);
  });

  test("should show component file paths", async ({ page }) => {
    const data = await getAncestryData(page, "main");
    expect(data).not.toBeNull();

    // Check for file paths in server components
    const hasFilePaths = data!.some(item =>
      item.serverComponents?.some((sc: any) => sc.filePath && sc.filePath.length > 0)
    );
    expect(hasFilePaths).toBe(true);
  });
});

// ============================================================================
// NEXT.JS SERVER + CLIENT COMPONENT HYBRID TESTS
// ============================================================================

test.describe("Next.js Server + Client component ancestry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.nextjs);
    await waitForLocator(page);
  });

  test("should detect client Counter component within server components", async ({ page }) => {
    // The Counter is a client component ("use client")
    const path = await getAncestryPath(page, "button");
    expect(path).not.toBeNull();

    // Should show Counter component
    expect(path).toContain("Counter");
  });

  test("should show hierarchy from server to client components", async ({ page }) => {
    const path = await getAncestryPath(page, "button");
    expect(path).not.toBeNull();

    // Should show the full hierarchy: Page (server) -> Counter (client) -> button
    expect(path).toContain("Page");
    expect(path).toContain("Counter");
  });

  test("should show client component file path", async ({ page }) => {
    const path = await getAncestryPath(page, "button");
    expect(path).not.toBeNull();

    // Should include the Counter component file
    expect(path).toContain("app/components/Counter.tsx");
  });

  test("should not accumulate duplicate component names", async ({ page }) => {
    const path = await getAncestryPath(page, "button");
    expect(path).not.toBeNull();

    // Should not have repetitive patterns like "Page > Page > Page"
    // Each line should show only the component at that level
    const lines = path!.split('\n');
    lines.forEach(line => {
      // Count occurrences of "Page >" in each line
      const pageOccurrences = (line.match(/Page\s*>/g) || []).length;
      // Should have at most 1 occurrence per line
      expect(pageOccurrences).toBeLessThanOrEqual(1);
    });
  });

  test("should not have duplicate file paths on same line", async ({ page }) => {
    const path = await getAncestryPath(page, "button");
    expect(path).not.toBeNull();

    // Check that no line has duplicate "at path:line" entries
    const lines = path!.split('\n');
    lines.forEach(line => {
      const atMatches = line.match(/at ([^,]+:\d+)/g);
      if (atMatches && atMatches.length > 1) {
        // Check for exact duplicates
        const seen = new Set();
        atMatches.forEach(match => {
          expect(seen.has(match)).toBe(false);
          seen.add(match);
        });
      }
    });
  });
});

// ============================================================================
// NEXT.JS COMPONENT FORMAT TESTS
// ============================================================================

test.describe("Next.js component format", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.nextjs);
    await waitForLocator(page);
  });

  test("should format Next.js components with [Next.js: ...] notation", async ({ page }) => {
    const path = await getAncestryPath(page, "main");
    expect(path).not.toBeNull();

    // Check for the [Next.js: ComponentName] format
    expect(path).toMatch(/\[Next\.js:.*\]/);
  });

  test("should show tree structure with proper indentation", async ({ page }) => {
    const path = await getAncestryPath(page, "button");
    expect(path).not.toBeNull();

    // Should have multiple levels with tree characters
    expect(path).toContain("└─");

    // Should have indentation (multiple lines)
    const lines = path!.split('\n');
    expect(lines.length).toBeGreaterThan(2);
  });

  test("should handle component naming conventions", async ({ page }) => {
    const data = await getAncestryData(page, "main");
    expect(data).not.toBeNull();

    // Check that page.tsx becomes "Page" and layout.tsx becomes "RootLayout"
    const componentNames = data!
      .flatMap(item => item.serverComponents || [])
      .map((sc: any) => sc.name);

    // Should have Page component (not "page")
    const hasPage = componentNames.some(name => name === "Page");
    expect(hasPage).toBe(true);
  });

  test("should show each element with its own server component only", async ({ page }) => {
    const data = await getAncestryData(page, "button");
    expect(data).not.toBeNull();

    // Each item should have at most 1 server component
    // (not accumulated from all ancestors)
    data!.forEach(item => {
      if (item.serverComponents) {
        expect(item.serverComponents.length).toBeLessThanOrEqual(1);
      }
    });
  });
});
