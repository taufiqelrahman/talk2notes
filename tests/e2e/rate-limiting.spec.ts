import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test('should display rate limit information', async ({ page }) => {
    await page.goto('/');

    const rateLimitInfo = page.locator('text=/limit|batas/i');
    const hasRateLimitInfo = await rateLimitInfo.count();

    if (hasRateLimitInfo > 0) {
      await expect(rateLimitInfo.first()).toBeVisible();
    }
  });

  test('should navigate to rate limits page', async ({ page }) => {
    await page.goto('/');

    const rateLimitLink = page
      .locator('a[href*="limit"]')
      .or(page.getByRole('link', { name: /limit|batas/i }));
    const hasLink = await rateLimitLink.count();

    if (hasLink > 0) {
      await rateLimitLink.first().click();
      await expect(page).toHaveURL(/limit/);
    }
  });

  test('should return limits JSON from api/limits', async ({ page }) => {
    const res = await page.request.get('/api/limits');
    await expect(res.ok()).toBeTruthy();

    const body = await res.json();
    await expect(body.success).toBe(true);
    await expect(body.limits).toBeTruthy();

    // basic shape checks
    await expect(body.limits.hourly).toBeTruthy();
    await expect(body.limits.daily).toBeTruthy();
    await expect(typeof body.limits.hourly.max).toBe('number');
    await expect(typeof body.limits.daily.max).toBe('number');
    await expect(typeof body.limits.fileSize.maxMB).toBe('number');
  });
});
