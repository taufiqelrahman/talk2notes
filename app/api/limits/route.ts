import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RATE_LIMITS, getClientId } from '@/lib/rate-limiter';

/**
 * API endpoint to check current rate limit status
 * GET /api/limits
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientId(request);

    // Get hourly status
    const hourlyStatus = rateLimiter.getStatus(`transcription:hourly:${clientId}`);
    const hourlyRemaining = hourlyStatus?.remaining ?? RATE_LIMITS.TRANSCRIPTION.MAX_REQUESTS;
    const hourlyResetTime = hourlyStatus?.resetTime ?? null;

    // Get daily status
    const dailyStatus = rateLimiter.getStatus(`transcription:daily:${clientId}`);
    const dailyRemaining = dailyStatus?.remaining ?? RATE_LIMITS.DAILY.MAX_TRANSCRIPTIONS;
    const dailyResetTime = dailyStatus?.resetTime ?? null;

    return NextResponse.json({
      success: true,
      limits: {
        hourly: {
          max: RATE_LIMITS.TRANSCRIPTION.MAX_REQUESTS,
          remaining: hourlyRemaining,
          resetTime: hourlyResetTime,
          resetIn: hourlyResetTime ? hourlyResetTime - Date.now() : null,
        },
        daily: {
          max: RATE_LIMITS.DAILY.MAX_TRANSCRIPTIONS,
          remaining: dailyRemaining,
          resetTime: dailyResetTime,
          resetIn: dailyResetTime ? dailyResetTime - Date.now() : null,
        },
        fileSize: {
          maxMB: RATE_LIMITS.FILE_SIZE.MAX_SIZE_MB,
          maxYoutubeMB: RATE_LIMITS.FILE_SIZE.MAX_YOUTUBE_MB,
        },
      },
    });
  } catch (error) {
    console.error('Error checking rate limits:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check rate limits',
      },
      { status: 500 }
    );
  }
}
