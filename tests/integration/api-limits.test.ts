import { describe, it, expect } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';
import * as limitsApi from '@/app/api/limits/route';

// Integration test for API route /api/limits

describe('API /api/limits', () => {
  it('should return rate limit status', async () => {
    const req = createRequest({ method: 'GET' });
    // Next.js API expects NextRequest, so mock minimal object
    req.url = '/api/limits';
    const response = await limitsApi.GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('limits');
    expect(data.limits).toHaveProperty('hourly');
    expect(data.limits).toHaveProperty('daily');
  });

  it('should include numeric limit values and fileSize limits', async () => {
    const req = createRequest({ method: 'GET' });
    req.url = '/api/limits';

    const response = await limitsApi.GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('limits');

    expect(data.limits.hourly).toEqual(
      expect.objectContaining({
        max: expect.any(Number),
        remaining: expect.any(Number),
      })
    );

    // resetTime/resetIn may be null when there's no active window, or a number (timestamp)
    expect(
      data.limits.hourly.resetTime === null || typeof data.limits.hourly.resetTime === 'number'
    ).toBe(true);
    expect(
      data.limits.hourly.resetIn === null || typeof data.limits.hourly.resetIn === 'number'
    ).toBe(true);

    expect(data.limits.daily).toEqual(
      expect.objectContaining({
        max: expect.any(Number),
        remaining: expect.any(Number),
      })
    );

    expect(
      data.limits.daily.resetTime === null || typeof data.limits.daily.resetTime === 'number'
    ).toBe(true);
    expect(
      data.limits.daily.resetIn === null || typeof data.limits.daily.resetIn === 'number'
    ).toBe(true);

    expect(data.limits.fileSize).toEqual(
      expect.objectContaining({
        maxMB: expect.any(Number),
        maxYoutubeMB: expect.any(Number),
      })
    );
  });

  // Tidak ada handler POST, Next.js API route hanya GET
});
