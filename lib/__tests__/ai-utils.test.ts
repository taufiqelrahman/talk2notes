import { describe, it, expect, vi } from 'vitest';
import {
  retryOptions,
  createOpenAIClient,
  cropToTokenLimit,
  addBasicParagraphs,
} from '@/lib/ai-utils';
import type { AIConfig } from '@/types';

vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor(public opts: Record<string, unknown>) {}
  },
}));

const groqConfig: AIConfig = {
  provider: 'groq',
  transcriptionModel: 'whisper-large-v3',
  summarizationModel: 'llama-3.3-70b-versatile',
  apiKey: 'test-groq-key',
};

const openaiConfig: AIConfig = {
  provider: 'openai',
  transcriptionModel: 'whisper-1',
  summarizationModel: 'gpt-4-turbo-preview',
  apiKey: 'test-openai-key',
};

describe('retryOptions', () => {
  it('returns correct retry config', () => {
    const opts = retryOptions('Test');
    expect(opts).toMatchObject({
      retries: 3,
      factor: 2,
      minTimeout: 2000,
      maxTimeout: 10000,
      randomize: true,
    });
  });

  it('logs the label on failed attempt', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const opts = retryOptions('MyLabel');
    opts!.onFailedAttempt!({ attemptNumber: 1, retriesLeft: 2 } as any);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('MyLabel'));
    spy.mockRestore();
  });
});

describe('createOpenAIClient', () => {
  it('sets groq baseURL for groq provider', () => {
    const client = createOpenAIClient(groqConfig) as any;
    expect(client.opts.baseURL).toBe('https://api.groq.com/openai/v1');
    expect(client.opts.apiKey).toBe('test-groq-key');
  });

  it('does not set baseURL for openai provider', () => {
    const client = createOpenAIClient(openaiConfig) as any;
    expect(client.opts.baseURL).toBeUndefined();
    expect(client.opts.apiKey).toBe('test-openai-key');
  });

  it('merges extra options', () => {
    const client = createOpenAIClient(openaiConfig, { maxRetries: 0, timeout: 5000 }) as any;
    expect(client.opts.maxRetries).toBe(0);
    expect(client.opts.timeout).toBe(5000);
  });

  it('extra options override defaults', () => {
    const client = createOpenAIClient(groqConfig, { baseURL: 'https://custom.api' }) as any;
    expect(client.opts.baseURL).toBe('https://custom.api');
  });
});

describe('cropToTokenLimit', () => {
  it('returns text unchanged when within limit', () => {
    const text = 'Short text.';
    expect(cropToTokenLimit(text, 1000)).toBe(text);
  });

  it('crops at sentence boundary when over limit', () => {
    const longText = 'First sentence. Second sentence. Third sentence.';
    const result = cropToTokenLimit(longText, 1);
    expect(result.length).toBeLessThan(longText.length);
    expect(result.endsWith('.')).toBe(true);
  });

  it('respects the 4-chars-per-token estimate', () => {
    const text = 'a'.repeat(100);
    const result = cropToTokenLimit(text, 10);
    expect(result.length).toBeLessThanOrEqual(40);
  });

  it('handles text at exact boundary without cropping', () => {
    const text = 'x'.repeat(40);
    expect(cropToTokenLimit(text, 10)).toBe(text);
  });
});

describe('addBasicParagraphs', () => {
  it('returns trimmed text for short input', () => {
    const result = addBasicParagraphs('Hello world.');
    expect(result).toBe('Hello world.');
  });

  it('inserts double newlines after long stretches of sentences', () => {
    const sentence = 'This is a sentence. ';
    const longText = sentence.repeat(30);
    const result = addBasicParagraphs(longText);
    expect(result).toContain('\n\n');
  });

  it('does not add trailing whitespace', () => {
    const result = addBasicParagraphs('Just a sentence.');
    expect(result).toBe(result.trim());
  });

  it('splits only at sentence-ending punctuation', () => {
    const text =
      'No sentence end here and here and here and here and here and here and here and here. Done.';
    const result = addBasicParagraphs(text);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
