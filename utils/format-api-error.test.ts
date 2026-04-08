import { describe, it, expect } from 'vitest';
import { formatApiError } from './format-api-error';

describe('formatApiError', () => {
  it('returns raw message for non-429 errors', () => {
    const err = new Error('Network failure');
    expect(formatApiError(err)).toBe('Network failure');
  });

  it('formats 429 message with retry seconds and limit type', () => {
    const raw =
      `429 Rate limit reached for model ` +
      '`llama-3.3-70b-versatile` in organization `org_01kafdyzzne4gv81psx7m6tx28` service tier `on_demand` on tokens per minute (TPM): Limit 12000, Used 7174, Requested 7540. Please try again in 13.569999999s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing';

    const out = formatApiError(new Error(raw));
    expect(out).toBe(
      'Rate limit reached (429) — tokens per minute limit exceeded. Please try again in 14 seconds.'
    );
  });

  it('handles objects with status 429 but no retry info', () => {
    const obj: any = { status: 429, message: 'Too Many Requests' };
    const out = formatApiError(obj);
    expect(out).toBe('Rate limit reached (429). Please wait a moment before trying again.');
  });
});
