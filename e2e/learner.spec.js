import { test, expect } from '@playwright/test';

test.describe('Digitap Learning Portal Scaffold E2E', () => {
  test('should load the home page and verify heading', async ({ page }) => {
    // Navigate to the base URL
    await page.goto('/');

    // Check document title
    await expect(page).toHaveTitle(/Digitap Learning Portal/);

    // Verify main header text
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    await expect(header).toHaveText('Digitap Learning Portal');
  });
});
