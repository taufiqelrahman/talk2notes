import OpenAI from 'openai';
import pRetry from 'p-retry';
import type { AIConfig } from '@/types';

/** Error carrying HTTP status and optional Retry-After (ms) for rate-limit aware retries. */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfterMs?: number
  ) {
    super(message);
  }
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const secs = Number(value);
  if (!Number.isNaN(secs)) return Math.ceil(secs * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function retryOptions(label: string): Parameters<typeof pRetry>[1] {
  return {
    retries: 5,
    factor: 2,
    minTimeout: 2000,
    maxTimeout: 30000,
    randomize: true,
    // p-retry v7 passes a context object: { error, attemptNumber, retriesLeft }
    onFailedAttempt: async (ctx: any) => {
      const err = ctx?.error ?? ctx;
      console.log(
        `[${label}] Attempt ${ctx.attemptNumber} failed (${err?.status ?? 'n/a'}). ${ctx.retriesLeft} retries left.`
      );
      // Honor server-provided Retry-After on 429 (capped to 60s)
      if (err?.status === 429 && err?.retryAfterMs) await sleep(Math.min(err.retryAfterMs, 60000));
    },
  };
}

const PROVIDER_BASE_URLS: Partial<Record<AIConfig['provider'], string>> = {
  groq: 'https://api.groq.com/openai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
};

export function createOpenAIClient(
  config: AIConfig,
  extraOpts: ConstructorParameters<typeof OpenAI>[0] = {}
): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: PROVIDER_BASE_URLS[config.provider],
    ...extraOpts,
  });
}

export function cropToTokenLimit(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  const sentences = text.substring(0, maxChars).split(/[.!?]\s+/);
  sentences.pop();
  return sentences.join('. ') + '.';
}

export function addBasicParagraphs(transcript: string): string {
  const sentences = transcript.split(/([.!?]\s+)/);
  let result = '';
  let charCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    result += sentences[i];
    charCount += sentences[i].length;

    if (charCount > 500 && sentences[i].match(/[.!?]\s+/)) {
      result += '\n\n';
      charCount = 0;
    }
  }

  return result.trim();
}

/** Split text into chunks of at most ~maxTokens, breaking on paragraph/sentence boundaries. */
export function chunkText(text: string, maxTokens: number): string[] {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return [text];
  const pieces = text.split(/(?<=[.!?。])\s+|\n{2,}/);
  const chunks: string[] = [];
  let current = '';
  for (const piece of pieces) {
    if (current && current.length + piece.length + 1 > maxChars) {
      chunks.push(current.trim());
      current = '';
    }
    // Hard-split pathological pieces with no sentence breaks
    if (piece.length > maxChars) {
      for (let i = 0; i < piece.length; i += maxChars) chunks.push(piece.slice(i, i + maxChars));
      continue;
    }
    current += (current ? ' ' : '') + piece;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Sliding-window token pacer for per-minute token limits (e.g. Groq free tier 8000 TPM).
 * Waits just long enough so the estimated tokens in the last 60s stay under the budget.
 */
const tokenLog: { t: number; tokens: number }[] = [];
export async function paceTokens(tokens: number, budgetPerMinute = 6000): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (tokenLog.length && now - tokenLog[0].t > 60000) tokenLog.shift();
    const used = tokenLog.reduce((s, e) => s + e.tokens, 0);
    if (used + tokens <= budgetPerMinute || tokenLog.length === 0) {
      tokenLog.push({ t: now, tokens });
      return;
    }
    const wait = 60000 - (now - tokenLog[0].t) + 250;
    console.log(`[Pacer] Waiting ${Math.ceil(wait / 1000)}s to respect token-per-minute budget`);
    await sleep(wait);
  }
}
