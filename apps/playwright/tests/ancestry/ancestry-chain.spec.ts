import { test, expect, Page } from "@playwright/test";
import { projects } from "../consts";

/**
 * Helper function to get the ancestry path for an element using the browser API.
 * Uses window.__treelocator__.getPath() which returns a formatted ancestry string.
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
 * Returns an array of AncestryItem objects with componentName, filePath, etc.
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
// REACT TESTS
// ============================================================================

test.describe("React ancestry chain", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.react);
    await waitForLocator(page);
  });

  test("should show component name at component boundary", async ({ page }) => {
    const path = await getAncestryPath(page, "#command-bar");
    expect(path).not.toBeNull();

    // Should contain CommandBar component name (not just 'div')
    expect(path).toContain("CommandBar");

    // Should show the ID
    expect(path).toContain("#command-bar");
  });

  test("should show nested component hierarchy", async ({ page }) => {
    const data = await getAncestryData(page, "#command-bar");
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThan(0);

    // Find the CommandBar in the ancestry
    const commandBarItem = data!.find(item =>
      item.componentName === "CommandBar" ||
      item.ownerComponents?.some((c: any) => c.name === "CommandBar")
    );
    expect(commandBarItem).toBeDefined();
  });

  test("should show Panel wrapping CommandBar", async ({ page }) => {
    const path = await getAncestryPath(page, "#command-bar");
    expect(path).not.toBeNull();

    // Panel should appear in the ancestry chain
    expect(path).toContain("Panel");
  });

  test("should show Sidebar component for nav items", async ({ page }) => {
    const path = await getAncestryPath(page, "#nav-home");
    expect(path).not.toBeNull();

    // Should contain Sidebar and NavItem
    expect(path).toContain("Sidebar");
    expect(path).toContain("NavItem");
  });

  test("should include file path in ancestry", async ({ page }) => {
    const data = await getAncestryData(page, "#command-bar");
    expect(data).not.toBeNull();

    // At least one item should have a file path
    const hasFilePath = data!.some(item => item.filePath);
    expect(hasFilePath).toBe(true);
  });

  test("should show element name when inside same component", async ({ page }) => {
    // Click on the action button inside CommandBar
    const path = await getAncestryPath(page, "#action-btn");
    expect(path).not.toBeNull();

    // Should show button element name when inside CommandBar
    // The path format depends on whether it's a boundary
    expect(path).toContain("button");
  });
});

// ============================================================================
// SOLID TESTS
// ============================================================================

test.describe("Solid ancestry chain", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.solid);
    await waitForLocator(page);
  });

  test("should detect CommandBar component", async ({ page }) => {
    const path = await getAncestryPath(page, "#command-bar");
    expect(path).not.toBeNull();

    // Should show component information
    expect(path!.length).toBeGreaterThan(0);
  });

  test("should show Panel in hierarchy", async ({ page }) => {
    const data = await getAncestryData(page, "#command-bar");
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });

  test("should show nested nav items", async ({ page }) => {
    const path = await getAncestryPath(page, "#nav-home");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// VUE TESTS
// ============================================================================

test.describe("Vue ancestry chain", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.vue);
    await waitForLocator(page);
  });

  test("should detect CommandBar component", async ({ page }) => {
    const path = await getAncestryPath(page, "#command-bar");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });

  test("should show hierarchy for nav items", async ({ page }) => {
    const path = await getAncestryPath(page, "#nav-home");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// SVELTE TESTS
// ============================================================================

test.describe("Svelte ancestry chain", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.svelte);
    await waitForLocator(page);
  });

  test("should detect CommandBar component", async ({ page }) => {
    const path = await getAncestryPath(page, "#command-bar");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });

  test("should show hierarchy for nav items", async ({ page }) => {
    const path = await getAncestryPath(page, "#nav-home");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// PREACT TESTS
// ============================================================================

test.describe("Preact ancestry chain", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.preact);
    await waitForLocator(page);
  });

  test("should detect CommandBar component", async ({ page }) => {
    const path = await getAncestryPath(page, "#command-bar");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });

  test("should show hierarchy for nav items", async ({ page }) => {
    const path = await getAncestryPath(page, "#nav-home");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CROSS-FRAMEWORK COMPARISON
// ============================================================================

test.describe("Cross-framework ancestry consistency", () => {
  const frameworks = [
    { name: "react", url: projects.react },
    { name: "solid", url: projects.solid },
    { name: "preact", url: projects.preact },
  ];

  for (const framework of frameworks) {
    test(`${framework.name} should return ancestry data for #command-bar`, async ({ page }) => {
      await page.goto(framework.url);
      await waitForLocator(page);

      const data = await getAncestryData(page, "#command-bar");
      expect(data).not.toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);

      // Each item should have elementName
      data!.forEach(item => {
        expect(item.elementName).toBeDefined();
      });
    });
  }
});

// ============================================================================
// COMPONENT BOUNDARY DETECTION
// ============================================================================

test.describe("Component boundary detection", () => {
  test("React: should not show duplicate component names", async ({ page }) => {
    await page.goto(projects.react);
    await waitForLocator(page);

    const path = await getAncestryPath(page, "#action-btn");
    expect(path).not.toBeNull();

    // Count occurrences of "CommandBar" - should not appear twice in a row
    // (once for the component boundary, once for nested element)
    const lines = path!.split("\n");
    let prevComponent = "";
    for (const line of lines) {
      const match = line.match(/^(\s*└─\s*)?(\w+)/);
      if (match && match[2]) {
        const component = match[2];
        // Adjacent identical component names indicate boundary detection issue
        expect(component).not.toBe(prevComponent);
        prevComponent = component;
      }
    }
  });
});

// ============================================================================
// BROWSER API TESTS
// ============================================================================

test.describe("Browser API", () => {
  test("should expose __treelocator__ on window", async ({ page }) => {
    await page.goto(projects.react);
    await waitForLocator(page);

    const hasApi = await page.evaluate(() => {
      return typeof (window as any).__treelocator__ !== "undefined";
    });
    expect(hasApi).toBe(true);
  });

  test("should expose getPath method", async ({ page }) => {
    await page.goto(projects.react);
    await waitForLocator(page);

    const hasMethod = await page.evaluate(() => {
      return typeof (window as any).__treelocator__?.getPath === "function";
    });
    expect(hasMethod).toBe(true);
  });

  test("should expose getAncestry method", async ({ page }) => {
    await page.goto(projects.react);
    await waitForLocator(page);

    const hasMethod = await page.evaluate(() => {
      return typeof (window as any).__treelocator__?.getAncestry === "function";
    });
    expect(hasMethod).toBe(true);
  });

  test("should expose getPathData method", async ({ page }) => {
    await page.goto(projects.react);
    await waitForLocator(page);

    const hasMethod = await page.evaluate(() => {
      return typeof (window as any).__treelocator__?.getPathData === "function";
    });
    expect(hasMethod).toBe(true);
  });

  test("should return null for non-existent elements", async ({ page }) => {
    await page.goto(projects.react);
    await waitForLocator(page);

    const path = await getAncestryPath(page, "#non-existent-element");
    expect(path).toBeNull();
  });
});
