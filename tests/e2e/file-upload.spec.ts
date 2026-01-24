import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload', () => {
  test('should show error for invalid file type', async ({ page }) => {
    await page.goto('/');

    // File input is hidden, but still functional
    const fileInput = page.locator('input[type="file"]');

    const testFilePath = path.join(__dirname, '../fixtures/test.txt');
    await fileInput.setInputFiles(testFilePath);

    // Wait for validation error
    const errorMessage = page.locator('.text-red-800, .text-red-600, [class*="error"]');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display upload area', async ({ page }) => {
    await page.goto('/');

    // Check for upload area with text
    const uploadArea = page.locator('text=/pilih.*file|choose.*file|drop.*file/i');
    await expect(uploadArea.first()).toBeVisible();
  });

  test('should have file input available', async ({ page }) => {
    await page.goto('/');

    // Input exists even if hidden
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);
  });
});
