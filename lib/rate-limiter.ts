// Simple in-memory rate limiter
// Prevents abuse and helps stay within free tier limits

interface RateLimitEntry {
  count: number;
  resetTime: number;
  maxRequests: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Check if request is within rate limit
   * @param key - Unique identifier (IP address, user ID, etc.)
   * @param maxRequests - Maximum requests allowed in window
   * @param windowMs - Time window in milliseconds
   */
  check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No previous entry or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
        maxRequests: maxRequests,
      });
      return true;
    }

    // Within window, check count
    if (entry.count < maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get remaining requests and reset time
   */
  getStatus(key: string): { remaining: number; resetTime: number } | null {
    const entry = this.limits.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.resetTime) {
      return null;
    }

    return {
      remaining: Math.max(0, entry.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset limit for a key (for testing or admin override)
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Clear all limits and stop cleanup
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Rate limit configurations for different tiers
export const RATE_LIMITS = {
  // Transcription limits (most resource-intensive)
  TRANSCRIPTION: {
    MAX_REQUESTS: 5, // 5 transcriptions per hour (reduced for billing safety)
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },

  // File size limits (prevent memory issues)
  FILE_SIZE: {
    MAX_SIZE_MB: 50, // Reduce from 100MB to stay safe on 256MB RAM
    MAX_YOUTUBE_MB: 100, // YouTube can be larger (downloaded, not uploaded)
  },

  // Concurrent processing (prevent multiple heavy operations)
  CONCURRENT: {
    MAX_PROCESSING: 2, // Max 2 files processing at same time
  },

  // Daily limits (prevent monthly quota exhaustion)
  DAILY: {
    MAX_TRANSCRIPTIONS: 20, // 20 files per day (reduced for billing safety)
    WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

// Helper to get client identifier (IP address)
export function getClientId(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier if no IP available
  return 'unknown';
}

// Helper to format time remaining
export function formatTimeRemaining(resetTime: number): string {
  const now = Date.now();
  const diff = resetTime - now;

  if (diff <= 0) return 'now';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
