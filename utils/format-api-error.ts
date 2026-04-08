/**
 * Extracts the raw text from an error, handling OpenAI SDK errors,
 * fetch-based errors with embedded JSON bodies, and plain Error objects.
 */
function extractRawMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Parses a retry-after duration (in seconds) from a 429 error message.
 * Handles formats like "try again in 13.569999999s" or "try again in 1.5 minutes".
 */
function parseRetryAfter(message: string): number | null {
  const secondsMatch = message.match(/try again in\s+([\d.]+)\s*s(?:econds?)?/i);
  if (secondsMatch) {
    return Math.ceil(parseFloat(secondsMatch[1]));
  }
  const minutesMatch = message.match(/try again in\s+([\d.]+)\s*m(?:inutes?)?/i);
  if (minutesMatch) {
    return Math.ceil(parseFloat(minutesMatch[1]) * 60);
  }
  return null;
}

/**
 * Extracts a human-readable rate limit type from a 429 error message.
 */
function parseLimitType(message: string): string | null {
  if (/tokens?\s+per\s+minute|TPM/i.test(message)) return 'tokens per minute';
  if (/requests?\s+per\s+minute|RPM/i.test(message)) return 'requests per minute';
  if (/tokens?\s+per\s+day|TPD/i.test(message)) return 'tokens per day';
  if (/requests?\s+per\s+day|RPD/i.test(message)) return 'requests per day';
  return null;
}

/**
 * Returns a user-friendly error message.
 * For 429 rate limit errors, the verbose provider message is replaced with
 * a concise message that still conveys status code and retry timing.
 * All other errors are returned as-is.
 */
export function formatApiError(error: unknown): string {
  const raw = extractRawMessage(error);

  const is429 =
    (error as any)?.status === 429 ||
    (error as any)?.statusCode === 429 ||
    /\b429\b/.test(raw) ||
    /rate\s+limit\s+reached/i.test(raw) ||
    /too\s+many\s+requests/i.test(raw);

  if (!is429) {
    return raw || 'An unexpected error occurred.';
  }

  const retrySeconds = parseRetryAfter(raw);
  const limitType = parseLimitType(raw);

  const parts: string[] = ['Rate limit reached (429)'];

  if (limitType) {
    parts[0] += ` — ${limitType} limit exceeded`;
  }

  parts.push(
    retrySeconds != null
      ? `Please try again in ${retrySeconds} second${retrySeconds !== 1 ? 's' : ''}.`
      : 'Please wait a moment before trying again.'
  );

  return parts.join('. ');
}
