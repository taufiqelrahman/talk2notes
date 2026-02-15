import { describe, it, expect } from 'vitest';
import { rateLimiter, RATE_LIMITS, formatTimeRemaining } from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  describe('check', () => {
    it('should allow requests within limit', () => {
      const key = 'test-user-1';
      const allowed = rateLimiter.check(key, 5, 60000); // 5 requests per minute
      expect(allowed).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const key = 'test-user-2';

      // Make 5 requests (should all pass)
      for (let i = 0; i < 5; i++) {
        const allowed = rateLimiter.check(key, 5, 60000);
        expect(allowed).toBe(true);
      }

      // 6th request should be blocked
      const blocked = rateLimiter.check(key, 5, 60000);
      expect(blocked).toBe(false);
    });

    it('should reset after window expires', async () => {
      const key = 'test-user-3';

      // Make max requests
      for (let i = 0; i < 3; i++) {
        rateLimiter.check(key, 3, 100); // 100ms window
      }

      // Should be blocked
      expect(rateLimiter.check(key, 3, 100)).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      expect(rateLimiter.check(key, 3, 100)).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return correct remaining count', () => {
      const key = 'test-user-4';

      rateLimiter.check(key, 10, 60000);
      rateLimiter.check(key, 10, 60000);
      rateLimiter.check(key, 10, 60000);

      const status = rateLimiter.getStatus(key);
      expect(status).toBeDefined();
      expect(status?.remaining).toBe(7); // 10 - 3 = 7
    });

    it('should return null for non-existent key', () => {
      const status = rateLimiter.getStatus('non-existent-key');
      expect(status).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset limits for a key', () => {
      const key = 'test-user-5';

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(key, 5, 60000);
      }

      expect(rateLimiter.check(key, 5, 60000)).toBe(false);

      // Reset
      rateLimiter.reset(key);

      // Should be allowed again
      expect(rateLimiter.check(key, 5, 60000)).toBe(true);
    });
  });

  describe('RATE_LIMITS configuration', () => {
    it('should have correct transcription limits', () => {
      expect(RATE_LIMITS.TRANSCRIPTION.MAX_REQUESTS).toBe(5);
      expect(RATE_LIMITS.TRANSCRIPTION.WINDOW_MS).toBe(60 * 60 * 1000);
    });

    it('should have correct daily limits', () => {
      expect(RATE_LIMITS.DAILY.MAX_TRANSCRIPTIONS).toBe(20);
      expect(RATE_LIMITS.DAILY.WINDOW_MS).toBe(24 * 60 * 60 * 1000);
    });

    it('should have correct file size limits', () => {
      expect(RATE_LIMITS.FILE_SIZE.MAX_SIZE_MB).toBe(50);
      expect(RATE_LIMITS.FILE_SIZE.MAX_YOUTUBE_MB).toBe(100);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format hours correctly', () => {
      const now = Date.now();
      // Add extra buffer to avoid timing issues
      const twoHours = now + 2 * 60 * 60 * 1000 + 1000;
      const result = formatTimeRemaining(twoHours);
      expect(result).toMatch(/^[12] hours?$/); // Accept "1 hour" or "2 hours" due to timing
    });

    it('should format minutes correctly', () => {
      const now = Date.now();
      const thirtyMinutes = now + 30 * 60 * 1000 + 500;
      const result = formatTimeRemaining(thirtyMinutes);
      expect(result).toMatch(/^(29|30) minutes$/); // Allow small variance
    });

    it('should handle singular hour', () => {
      const now = Date.now();
      const oneHour = now + 60 * 60 * 1000 + 1000;
      expect(formatTimeRemaining(oneHour)).toBe('1 hour');
    });

    it('should return "now" for past times', () => {
      const past = Date.now() - 1000;
      expect(formatTimeRemaining(past)).toBe('now');
    });
  });
});
