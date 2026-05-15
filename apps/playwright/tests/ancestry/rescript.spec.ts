import { test, expect, Page } from "@playwright/test";
import { projects } from "../consts";

async function getAncestryPath(page: Page, selector: string): Promise<string | null> {
  return await page.evaluate((sel) => {
    const api = (window as any).__treelocator__;
    if (!api) return null;
    return api.getPath(sel);
  }, selector);
}

async function getAncestryData(page: Page, selector: string): Promise<any[] | null> {
  return await page.evaluate((sel) => {
    const api = (window as any).__treelocator__;
    if (!api) return null;
    return api.getAncestry(sel);
  }, selector);
}

async function waitForLocator(page: Page): Promise<void> {
  await page.waitForFunction(
    () => typeof (window as any).__treelocator__ !== "undefined",
    { timeout: 10000 }
  );
}

test.describe("ReScript ancestry chain", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projects.rescript);
    await waitForLocator(page);
  });

  test("reports the module name (Button), not the literal `make`", async ({ page }) => {
    const path = await getAncestryPath(page, ".submit-button");
    expect(path).not.toBeNull();
    expect(path).toContain("Button");
    expect(path).not.toMatch(/\bmake\b/);
  });

  test("reports the wrapping Card module", async ({ page }) => {
    const path = await getAncestryPath(page, ".submit-button");
    expect(path).not.toBeNull();
    expect(path).toContain("Card");
  });

  test("file paths point at .res files, not .res.js", async ({ page }) => {
    const data = await getAncestryData(page, ".submit-button");
    expect(data).not.toBeNull();

    const buttonItem = data!.find(
      (item) =>
        item.componentName === "Button" ||
        item.ownerComponents?.some((c: any) => c.name === "Button")
    );
    expect(buttonItem).toBeDefined();

    const filePath: string | undefined = buttonItem?.filePath;
    expect(filePath).toBeTruthy();
    // Must end in .res, not .res.js
    expect(filePath).toMatch(/Button\.res$/);
  });

  test("line numbers are inside the .res file (not the JS output)", async ({ page }) => {
    const data = await getAncestryData(page, ".submit-button");
    expect(data).not.toBeNull();

    const buttonEntry = data!.find((item) =>
      item.filePath?.endsWith("Button.res")
    );
    expect(buttonEntry).toBeDefined();
    // The fixture's only mapping for the JSX is original line 3 (the <button>).
    // The exact line is allowed to drift, but it must be a positive number
    // within the .res file (which is only 6 lines long).
    expect(typeof buttonEntry?.line).toBe("number");
    expect(buttonEntry!.line).toBeGreaterThan(0);
    expect(buttonEntry!.line).toBeLessThanOrEqual(6);
  });
});
