# Rate Limiting & Free Tier Protection

## Overview

To ensure the application stays within Fly.io's free tier limits and provide fair usage, we've implemented comprehensive rate limiting and resource management.

## Rate Limits

### Hourly Limit

- **10 transcriptions per hour per user/IP**
- Prevents excessive API usage and keeps within Groq free tier
- Resets automatically after 1 hour

### Daily Limit

- **50 transcriptions per day per user/IP**
- Ensures monthly quotas aren't exhausted
- Resets at midnight (rolling 24-hour window)

### File Size Limits

- **50MB maximum for uploaded files** (reduced from 100MB)
- **100MB maximum for YouTube downloads**
- Prevents memory issues on 256MB RAM instances

## How It Works

### Client Identification

Rate limits are applied per IP address using:

1. `x-forwarded-for` header (if behind proxy)
2. `x-real-ip` header (if available)
3. Fallback to "unknown" for local development

### Storage

- In-memory rate limiting (no database required)
- Automatic cleanup of expired entries every 5 minutes
- Persists only for current server session

### Error Messages

Users receive clear feedback when limits are exceeded:

- "Rate limit exceeded. You can only transcribe 10 files per hour on the free tier. Please try again in 45 minutes."
- "Daily limit exceeded. You can transcribe up to 50 files per day on the free tier. Resets in 8 hours."

## User Interface

### Rate Limit Display

A blue info box shows current usage:

```
Free Tier Limits
7 / 10 files this hour    42 / 50 files today
Max file size: 50MB • Limits reset automatically
```

### API Endpoint

Check current limits programmatically:

```bash
GET /api/limits
```

Response:

```json
{
  "success": true,
  "limits": {
    "hourly": {
      "max": 10,
      "remaining": 7,
      "resetTime": 1700000000000,
      "resetIn": 2400000
    },
    "daily": {
      "max": 50,
      "remaining": 42,
      "resetTime": 1700100000000,
      "resetIn": 28800000
    },
    "fileSize": {
      "maxMB": 50,
      "maxYoutubeMB": 100
    }
  }
}
```

## Configuration

All limits are centralized in `lib/rate-limiter.ts`:

```typescript
export const RATE_LIMITS = {
  TRANSCRIPTION: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
  DAILY: {
    MAX_TRANSCRIPTIONS: 50,
    WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
  },
  FILE_SIZE: {
    MAX_SIZE_MB: 50,
    MAX_YOUTUBE_MB: 100,
  },
};
```

### Adjusting Limits

To modify limits, edit `lib/rate-limiter.ts` and redeploy:

```typescript
// Example: Increase hourly limit to 20
TRANSCRIPTION: {
  MAX_REQUESTS: 20, // Changed from 10
  WINDOW_MS: 60 * 60 * 1000,
}
```

## Free Tier Safety

These limits ensure we stay within:

### Fly.io Free Tier

- 256MB RAM per instance
- 3 shared-cpu-1x VMs
- 160GB bandwidth/month
- **With limits**: ~50 files/day × 30 days = 1,500 files/month ✅

### Groq Free Tier

- Rate limits: Varies by model
- Daily limits: Generous for individual use
- **With limits**: 10 files/hour prevents API exhaustion ✅

### Storage Considerations

- Temporary files cleaned up after processing
- No persistent file storage (reduces disk usage)
- History stored in browser localStorage (no server storage)

## Bypass Options

### For Development

To bypass rate limits during testing:

```typescript
// In lib/rate-limiter.ts, temporarily modify:
check(key: string, maxRequests: number, windowMs: number): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true; // Always allow in development
  }
  // ... rest of code
}
```

### For Self-Hosting

If you're running on your own infrastructure with higher resources:

1. Increase limits in `lib/rate-limiter.ts`
2. Increase `MAX_FILE_SIZE_MB` in environment variables
3. Upgrade Fly.io instance size if needed

## Monitoring

Check application health:

```bash
flyctl status
flyctl logs --app talk2notes
flyctl scale show
```

Monitor memory usage:

```bash
flyctl vm status
```

If you see high memory usage approaching 256MB, consider:

- Reducing file size limits
- Reducing concurrent processing
- Upgrading instance size

## Best Practices

1. **Keep limits reasonable**: Too restrictive = bad UX, too loose = abuse risk
2. **Monitor usage**: Check logs regularly for patterns
3. **Communicate clearly**: Show users their remaining quota
4. **Automatic reset**: No manual intervention needed
5. **Fail gracefully**: Clear error messages with reset times

## Troubleshooting

### "Rate limit exceeded" too frequently

- Check if IP detection is working correctly
- Consider increasing hourly limit
- Check for bots or automated access

### Memory issues despite limits

- Verify file size limits are enforced
- Check for memory leaks in processing
- Monitor `flyctl vm status`

### Limits not resetting

- Check system time is correct
- Verify cleanup interval is running
- Restart application if needed

## Future Enhancements

Potential improvements:

- [ ] Redis-based rate limiting (for multi-instance deployments)
- [ ] User authentication with per-user quotas
- [ ] Premium tier with higher limits
- [ ] Usage analytics dashboard
- [ ] Automatic scaling based on usage patterns
