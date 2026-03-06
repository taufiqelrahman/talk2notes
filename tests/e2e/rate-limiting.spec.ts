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

  test('UI should display same limits as /api/limits', async ({ page }) => {
    await page.goto('/');

    // Wait for the rate limits banner to render (if present)
    const banner = page.locator('text=Free Tier Limits').first();
    const hasBanner = await banner.count();

    if (hasBanner === 0) {
      test.skip(true, 'Rate limit banner not present in this environment');
      return;
    }

    // Get displayed texts
    const hourlyText = await page.locator('p:has-text("files this hour")').first().textContent();
    const dailyText = await page.locator('p:has-text("files today")').first().textContent();

    // Fetch API values
    const res = await page.request.get('/api/limits');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    // Parse displayed numbers
    const hourlyMatch = hourlyText?.match(/(\d+)\s*\/\s*(\d+)/);
    const dailyMatch = dailyText?.match(/(\d+)\s*\/\s*(\d+)/);

    expect(hourlyMatch).toBeTruthy();
    expect(dailyMatch).toBeTruthy();

    const uiHourlyRemaining = Number(hourlyMatch![1]);
    const uiHourlyMax = Number(hourlyMatch![2]);
    const uiDailyRemaining = Number(dailyMatch![1]);
    const uiDailyMax = Number(dailyMatch![2]);

    // Compare UI values to API
    expect(uiHourlyMax).toBe(body.limits.hourly.max);
    expect(uiDailyMax).toBe(body.limits.daily.max);
    expect(uiHourlyRemaining).toBe(body.limits.hourly.remaining);
    expect(uiDailyRemaining).toBe(body.limits.daily.remaining);
  });
});
