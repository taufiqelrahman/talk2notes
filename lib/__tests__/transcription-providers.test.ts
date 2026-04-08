import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  transcribeWithOpenAI,
  transcribeWithGroq,
  transcribeWithDeepgram,
} from '@/lib/transcription-providers';
import type { AIConfig } from '@/types';

const { mockTranscriptionsCreate, mockStat, mockReadFile } = vi.hoisted(() => ({
  mockTranscriptionsCreate: vi.fn(),
  mockStat: vi.fn().mockResolvedValue({ size: 5 * 1024 * 1024 }),
  mockReadFile: vi.fn().mockResolvedValue(Buffer.from('audio')),
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    audio = { transcriptions: { create: mockTranscriptionsCreate } };
  },
}));

vi.mock('@/lib/ai-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai-utils')>();
  return {
    ...actual,
    retryOptions: () => ({ retries: 0 }),
  };
});

vi.mock('fs', () => ({
  default: { promises: { stat: mockStat, readFile: mockReadFile } },
  promises: { stat: mockStat, readFile: mockReadFile },
}));

const config: AIConfig = {
  provider: 'openai',
  transcriptionModel: 'whisper-1',
  summarizationModel: 'gpt-4-turbo-preview',
  apiKey: 'test-key',
};

const groqConfig: AIConfig = { ...config, provider: 'groq' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('transcribeWithOpenAI', () => {
  it('returns TranscriptionResult on success', async () => {
    mockTranscriptionsCreate.mockResolvedValueOnce({
      text: 'Hello world',
      duration: 10,
      language: 'en',
      segments: [{ start: 0, end: 5, text: 'Hello' }],
    });

    const result = await transcribeWithOpenAI('audio.mp3', config, {});
    expect(result.text).toBe('Hello world');
    expect(result.duration).toBe(10);
    expect(result.language).toBe('en');
    expect(result.segments).toHaveLength(1);
    expect(result.segments![0]).toMatchObject({ id: 0, start: 0, end: 5, text: 'Hello' });
  });

  it('throws when file exceeds 25MB', async () => {
    mockStat.mockResolvedValueOnce({ size: 26 * 1024 * 1024 } as any);

    await expect(transcribeWithOpenAI('big.mp3', config, {})).rejects.toThrow('25MB limit');
  });

  it('propagates AbortError on 401 without retrying', async () => {
    const err = Object.assign(new Error('Unauthorized'), { status: 401 });
    mockTranscriptionsCreate.mockRejectedValueOnce(err);

    await expect(transcribeWithOpenAI('audio.mp3', config, {})).rejects.toThrow();
  });

  it('passes language and temperature options', async () => {
    mockTranscriptionsCreate.mockResolvedValueOnce({
      text: 'Bonjour',
      duration: 2,
      language: 'fr',
      segments: [],
    });

    await transcribeWithOpenAI('audio.mp3', config, { language: 'fr', temperature: 0.5 });
    expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'fr', temperature: 0.5 })
    );
  });
});

describe('transcribeWithGroq', () => {
  it('returns TranscriptionResult on success', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Groq result', duration: 5, language: 'id' }),
    } as any);

    const result = await transcribeWithGroq('audio.mp3', groqConfig, {});
    expect(result.text).toBe('Groq result');
    expect(result.duration).toBe(5);
    expect(result.language).toBe('id');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'server error',
    } as any);

    await expect(transcribeWithGroq('audio.mp3', groqConfig, {})).rejects.toThrow(
      'Groq transcription failed'
    );
  });

  it('throws AbortError on 401', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'invalid key',
    } as any);

    await expect(transcribeWithGroq('audio.mp3', groqConfig, {})).rejects.toThrow();
  });

  it('appends language and temperature to form data when provided', async () => {
    const appendSpy = vi.spyOn(FormData.prototype, 'append');
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '', duration: 0, language: 'en' }),
    } as any);

    await transcribeWithGroq('audio.mp3', groqConfig, { language: 'en', temperature: 0.2 });
    expect(appendSpy).toHaveBeenCalledWith('language', 'en');
    expect(appendSpy).toHaveBeenCalledWith('temperature', '0.2');
  });
});

describe('transcribeWithDeepgram', () => {
  const deepgramConfig: AIConfig = {
    ...config,
    provider: 'deepgram',
    transcriptionModel: 'nova-2',
  };

  it('returns TranscriptionResult on success', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: {
          channels: [
            { alternatives: [{ transcript: 'Deepgram result' }], detected_language: 'en' },
          ],
        },
        metadata: { duration: 8 },
      }),
    } as any);

    const result = await transcribeWithDeepgram('audio.mp3', deepgramConfig, {});
    expect(result.text).toBe('Deepgram result');
    expect(result.duration).toBe(8);
    expect(result.language).toBe('en');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'error',
    } as any);

    await expect(transcribeWithDeepgram('audio.mp3', deepgramConfig, {})).rejects.toThrow(
      'Deepgram transcription failed'
    );
  });

  it('sends correct Authorization header', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: { channels: [{ alternatives: [{ transcript: '' }], detected_language: 'en' }] },
        metadata: { duration: 0 },
      }),
    } as any);

    await transcribeWithDeepgram('audio.mp3', deepgramConfig, {});
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('deepgram.com'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Token test-key' }),
      })
    );
  });
});
