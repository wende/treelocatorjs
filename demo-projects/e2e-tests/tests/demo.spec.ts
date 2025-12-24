import { test, expect } from '@playwright/test';

test.describe('Phoenix LiveView Demo', () => {
  test.skip('should load and interact with counter', async ({ page }) => {
    // Skipped: Phoenix LiveView requires proper Erlang/OTP version for asset compilation
    // The server runs but JavaScript assets (esbuild) fail to compile with current Elixir/OTP version
    await page.goto('http://localhost:4000');

    await expect(page.locator('h1')).toContainText('Phoenix LiveView Demo');

    const countElement = page.locator('text=Count:').locator('..').locator('span');
    await expect(countElement).toContainText('0');

    await page.click('button:has-text("Increment")');
    await page.waitForTimeout(500);
    await expect(countElement).toContainText('1');

    await page.click('button:has-text("Increment")');
    await page.waitForTimeout(500);
    await expect(countElement).toContainText('2');

    await page.click('button:has-text("Decrement")');
    await page.waitForTimeout(500);
    await expect(countElement).toContainText('1');

    await page.click('button:has-text("Reset")');
    await page.waitForTimeout(500);
    await expect(countElement).toContainText('0');
  });
});

test.describe('Next.js Demo', () => {
  test('should load and interact with counter', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await expect(page.locator('h1')).toContainText('Next.js Demo');

    const countElement = page.locator('text=Count:').locator('..').locator('span');
    await expect(countElement).toContainText('0');

    await page.click('button:has-text("Increment")');
    await expect(countElement).toContainText('1');

    await page.click('button:has-text("Increment")');
    await expect(countElement).toContainText('2');

    await page.click('button:has-text("Decrement")');
    await expect(countElement).toContainText('1');

    await page.click('button:has-text("Reset")');
    await expect(countElement).toContainText('0');
  });
});

test.describe('Ruby on Rails Demo', () => {
  test('should load and interact with counter', async ({ page }) => {
    await page.goto('http://localhost:3001');

    await expect(page.locator('h1')).toContainText('Ruby on Rails Demo');

    const countElement = page.locator('#counter');
    await expect(countElement).toContainText('0');

    await page.click('button:has-text("Increment")');
    await expect(countElement).toContainText('1');

    await page.click('button:has-text("Increment")');
    await expect(countElement).toContainText('2');

    await page.click('button:has-text("Decrement")');
    await expect(countElement).toContainText('1');

    await page.click('button:has-text("Reset")');
    await expect(countElement).toContainText('0');
  });
});
