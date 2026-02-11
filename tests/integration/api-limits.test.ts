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

  // Tidak ada handler POST, Next.js API route hanya GET
});
