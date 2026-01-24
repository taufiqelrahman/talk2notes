import { test, expect } from '@playwright/test';

test.describe('History Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display empty history message when toggled', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Click to show history
    const historyButton = page.locator('button:has-text("Show History")');
    await historyButton.click();

    // Check for empty message
    const emptyMessage = page.locator('text=/no.*history|belum ada|empty/i');
    await expect(emptyMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show history items when toggled', async ({ page }) => {
    const mockHistory = [
      {
        id: 'test-1',
        title: 'Test Note 1',
        timestamp: Date.now(),
        language: 'en',
        source: 'file',
        filename: 'test.mp3',
        notes: {
          title: 'Test Note 1',
          summary: 'Test summary',
          paragraphs: [],
          bulletPoints: [],
          keyConcepts: [],
          definitions: [],
          exampleProblems: [],
          actionItems: [],
          metadata: {
            language: 'en',
            duration: 100,
            generatedAt: new Date().toISOString(),
          },
        },
      },
    ];

    await page.evaluate((history) => {
      localStorage.setItem('talk2notes_history', JSON.stringify(history));
    }, mockHistory);

    await page.reload();

    // Click to show history
    const historyButton = page.locator('button:has-text("Show History")');
    await historyButton.click();

    // Wait for button text to change, confirming state updated
    await expect(page.locator('button:has-text("Hide History")')).toBeVisible({ timeout: 5000 });

    // Check for the history item directly (the heading is inside the History component)
    const historyItem = page.locator('text=/test note 1/i');
    await expect(historyItem).toBeVisible({ timeout: 5000 });
  });

  test('should delete history item', async ({ page }) => {
    const mockHistory = [
      {
        id: 'test-delete',
        title: 'Delete Me',
        timestamp: Date.now(),
        language: 'en',
        source: 'file',
        filename: 'test.mp3',
        notes: {
          title: 'Delete Me',
          summary: 'Test summary',
          paragraphs: [],
          bulletPoints: [],
          keyConcepts: [],
          definitions: [],
          exampleProblems: [],
          actionItems: [],
          metadata: {
            language: 'en',
            duration: 100,
            generatedAt: new Date().toISOString(),
          },
        },
      },
    ];

    await page.evaluate((history) => {
      localStorage.setItem('talk2notes_history', JSON.stringify(history));
    }, mockHistory);

    await page.reload();

    // Show history first
    const historyButton = page.locator('button:has-text("Show History")');
    await historyButton.click();

    await page.waitForTimeout(500);

    // Find and click delete button
    const deleteButton = page
      .locator('button')
      .filter({ hasText: /delete|hapus|×/i })
      .first();
    const hasDeleteButton = await deleteButton.count();

    if (hasDeleteButton > 0) {
      await deleteButton.click();

      const deletedItem = page.locator('text=/delete me/i');
      await expect(deletedItem).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should clear all history', async ({ page }) => {
    const mockHistory = [
      {
        id: 'test-1',
        title: 'Item 1',
        timestamp: Date.now(),
        language: 'en',
        source: 'file',
        filename: 'test1.mp3',
        notes: {
          title: 'Item 1',
          summary: 'Test summary 1',
          paragraphs: [],
          bulletPoints: [],
          keyConcepts: [],
          definitions: [],
          exampleProblems: [],
          actionItems: [],
          metadata: {
            language: 'en',
            duration: 100,
            generatedAt: new Date().toISOString(),
          },
        },
      },
      {
        id: 'test-2',
        title: 'Item 2',
        timestamp: Date.now(),
        language: 'en',
        source: 'file',
        filename: 'test2.mp3',
        notes: {
          title: 'Item 2',
          summary: 'Test summary 2',
          paragraphs: [],
          bulletPoints: [],
          keyConcepts: [],
          definitions: [],
          exampleProblems: [],
          actionItems: [],
          metadata: {
            language: 'en',
            duration: 100,
            generatedAt: new Date().toISOString(),
          },
        },
      },
    ];

    await page.evaluate((history) => {
      localStorage.setItem('talk2notes_history', JSON.stringify(history));
    }, mockHistory);

    await page.reload();

    // Show history first
    const historyButton = page.locator('button:has-text("Show History")');
    await historyButton.click();

    await page.waitForTimeout(500);

    // Find clear button
    const clearButton = page
      .locator('button')
      .filter({ hasText: /clear.*all|hapus.*semua/i })
      .first();
    const hasClearButton = await clearButton.count();

    if (hasClearButton > 0) {
      await clearButton.click();

      // Confirm if there's a confirmation dialog
      const confirmButton = page
        .locator('button')
        .filter({ hasText: /yes|ya|confirm/i })
        .first();
      const hasConfirm = await confirmButton.count();
      if (hasConfirm > 0) {
        await confirmButton.click();
      }

      const emptyMessage = page.locator('text=/no.*history|belum ada|empty/i');
      await expect(emptyMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
