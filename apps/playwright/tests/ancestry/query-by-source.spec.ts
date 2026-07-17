import { test, expect, Page } from "@playwright/test";
import { projects } from "../consts";

async function waitForLocator(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return typeof (window as any).__treelocator__ !== "undefined";
  }, { timeout: 10000 });
}

/**
 * Reverse lookup should agree with the forward getAncestry direction:
 * extract the innermost file+line from ancestry, query by source, and verify
 * at least one returned selector resolves to the same element.
 */
async function assertQueryRoundTrip(
  page: Page,
  selector: string
): Promise<void> {
  const source = await page.evaluate(async (sel) => {
    const api = (window as any).__treelocator__;
    const ancestry = await api.getAncestry(sel);
    if (!ancestry?.length) return null;

    const top = ancestry[0];
    const owner = top.ownerComponents?.[top.ownerComponents.length - 1];
    if (owner?.filePath && owner.line) {
      return { file: owner.filePath as string, line: owner.line as number };
    }
    const sc =
      top.serverComponents?.find((c: any) => c.type === "component") ||
      top.serverComponents?.[0];
    if (sc?.filePath && sc.line) {
      return { file: sc.filePath as string, line: sc.line as number };
    }
    if (top.filePath && top.line) {
      return { file: top.filePath as string, line: top.line as number };
    }
    return null;
  }, selector);

  expect(source).not.toBeNull();

  const result = await page.evaluate(
    async ({ file, line, selector: sel }) => {
      const api = (window as any).__treelocator__;
      const queryResult = await api.queryBySource({ file, line, tolerance: 1 });
      const target = document.querySelector(sel);
      const hit = queryResult.matches.some(
        (m: { selector: string }) =>
          document.querySelector(m.selector) === target
      );
      return { ...queryResult, hit };
    },
    { ...source!, selector }
  );

  expect(result.found).toBe(true);
  expect(result.browserConnected).toBe(true);
  expect(result.rendered).toBe(true);
  expect(result.matches.length).toBeGreaterThan(0);
  expect(result.hit).toBe(true);
}

test.describe("queryBySource reverse lookup", () => {
  test("vite-react: query_by_source round-trips with getAncestry for #command-bar", async ({
    page,
  }) => {
    await page.goto(projects.react);
    await waitForLocator(page);
    await assertQueryRoundTrip(page, "#command-bar");
  });

  test("next-16: query_by_source round-trips with getAncestry for main", async ({
    page,
  }) => {
    await page.goto(projects.nextjs);
    await waitForLocator(page);
    await assertQueryRoundTrip(page, "main");
  });
});
