import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Talk2Notes/i);

    await expect(page.getByRole('heading', { name: /talk2notes/i })).toBeVisible();
  });

  test('should display upload component', async ({ page }) => {
    await page.goto('/');

    // Check for visible upload button/label instead of hidden input
    const uploadButton = page.locator('text=/pilih.*file|choose.*file|upload|drop/i');
    await expect(uploadButton.first()).toBeVisible();
  });

  test('should display history button', async ({ page }) => {
    await page.goto('/');

    // History is behind a toggle button
    const historyButton = page.locator(
      'button:has-text("Show History"), button:has-text("Hide History")'
    );
    await expect(historyButton.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /talk2notes/i })).toBeVisible();
  });
});
