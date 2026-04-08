import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAIConfig, translateTranscript, formatTranscript, summarizeTranscript } from '@/lib/ai';
import {
  buildSummarizationPrompt,
  FORMAT_PROMPTS,
  TRANSLATE_TO_INDONESIAN_PROMPT,
} from '@/lib/ai-prompts';

const { mockCreate, mockTranscriptionsCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockTranscriptionsCreate: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } };
    audio = { transcriptions: { create: mockTranscriptionsCreate } };
  },
}));

const MOCK_SUMMARY_RESPONSE = {
  title: 'Test Lecture',
  summary: 'This is a test summary.',
  paragraphs: ['Paragraph one.', 'Paragraph two.'],
  bulletPoints: ['Point A', 'Point B'],
  keyConcepts: [{ concept: 'Concept A', explanation: 'Explanation', importance: 'high' }],
  definitions: [{ term: 'Term', definition: 'Definition', context: 'Context' }],
  exampleProblems: [],
  quizQuestions: [
    {
      question: 'Question?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Because A',
    },
  ],
  actionItems: ['Action 1'],
};

describe('AI prompts (ai-prompts.ts)', () => {
  describe('TRANSLATE_TO_INDONESIAN_PROMPT', () => {
    it('is a non-empty string', () => {
      expect(typeof TRANSLATE_TO_INDONESIAN_PROMPT).toBe('string');
      expect(TRANSLATE_TO_INDONESIAN_PROMPT.length).toBeGreaterThan(100);
    });

    it('contains key instructions for Islamic content', () => {
      expect(TRANSLATE_TO_INDONESIAN_PROMPT).toContain('QS.');
      expect(TRANSLATE_TO_INDONESIAN_PROMPT).toContain('HR.');
      expect(TRANSLATE_TO_INDONESIAN_PROMPT).toContain('Bahasa Indonesia');
    });
  });

  describe('FORMAT_PROMPTS', () => {
    it('has prompts for all three languages', () => {
      expect(FORMAT_PROMPTS.english).toBeTruthy();
      expect(FORMAT_PROMPTS.indonesian).toBeTruthy();
      expect(FORMAT_PROMPTS.arabic).toBeTruthy();
    });

    it('english prompt references Quran/Hadith formatting rules', () => {
      expect(FORMAT_PROMPTS.english).toContain('QS. Surah Name: Verse');
      expect(FORMAT_PROMPTS.english).toContain('HR. Narrator');
    });

    it('indonesian prompt is in Bahasa Indonesia', () => {
      expect(FORMAT_PROMPTS.indonesian).toContain('JANGAN PERNAH');
      expect(FORMAT_PROMPTS.indonesian).toContain('Quran/Hadits');
    });

    it('arabic prompt contains Arabic text', () => {
      expect(FORMAT_PROMPTS.arabic).toContain('QS.');
      expect(FORMAT_PROMPTS.arabic).toContain('HR.');
    });
  });

  describe('buildSummarizationPrompt', () => {
    it('contains correct language label for English', () => {
      const prompt = buildSummarizationPrompt({ language: 'english' });
      expect(prompt).toContain('English');
      expect(prompt).not.toContain('Bahasa Indonesia');
    });

    it('contains correct language label for Indonesian', () => {
      const prompt = buildSummarizationPrompt({ language: 'indonesian' });
      expect(prompt).toContain('Bahasa Indonesia');
    });

    it('contains correct language label for Arabic', () => {
      const prompt = buildSummarizationPrompt({ language: 'arabic' });
      expect(prompt).toContain('Arabic');
    });

    it('includes the detail level in the schema description', () => {
      const prompt = buildSummarizationPrompt({ detailLevel: 'concise' });
      expect(prompt).toContain('concise');
    });

    it('includes focus areas when specified', () => {
      const prompt = buildSummarizationPrompt({ focusAreas: ['history', 'ethics'] });
      expect(prompt).toContain('history, ethics');
    });

    it('uses sane defaults when no options provided', () => {
      const prompt = buildSummarizationPrompt({});
      expect(prompt).toContain('detailed');
      expect(prompt).toContain('all topics');
      expect(prompt).toContain('English');
    });

    it('returns a valid JSON schema structure description', () => {
      const prompt = buildSummarizationPrompt({});
      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"summary"');
      expect(prompt).toContain('"quizQuestions"');
      expect(prompt).toContain('"keyConcepts"');
    });
  });
});

describe('getAIConfig', () => {
  it('returns groq config from test environment', () => {
    const config = getAIConfig();
    expect(config.provider).toBe('groq');
    expect(config.transcriptionModel).toBe('whisper-large-v3');
    expect(config.summarizationModel).toBe('llama-3.3-70b-versatile');
    expect(config.apiKey).toBe('test-api-key');
  });

  it('has all required fields', () => {
    const config = getAIConfig();
    expect(config).toMatchObject({
      provider: expect.any(String),
      transcriptionModel: expect.any(String),
      summarizationModel: expect.any(String),
      apiKey: expect.any(String),
    });
  });
});

describe('translateTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the original transcript unchanged for English', async () => {
    const input = 'This is an English transcript.';
    const result = await translateTranscript(input, 'english');
    expect(result).toBe(input);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls the LLM API for Indonesian translation', async () => {
    const translated = 'Ini adalah transkrip yang diterjemahkan.';
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: translated } }],
    });

    const result = await translateTranscript('This is an English transcript.', 'indonesian');
    expect(result).toBe(translated);
    expect(mockCreate).toHaveBeenCalledOnce();

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].role).toBe('system');
    expect(callArgs.messages[0].content).toBe(TRANSLATE_TO_INDONESIAN_PROMPT);
    expect(callArgs.messages[1].content).toBe('This is an English transcript.');
  });

  it('falls back to original transcript when API call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'));
    const input = 'Original transcript.';
    const result = await translateTranscript(input, 'indonesian');
    expect(result).toBe(input);
  });
});

describe('formatTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns basic paragraphs when API key is empty', async () => {
    const originalKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = '';

    const longText = Array.from(
      { length: 10 },
      () => 'This is a sentence. It provides content for the test. Here is another sentence.'
    ).join(' ');

    const result = await formatTranscript(longText);
    expect(result).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();

    process.env.GROQ_API_KEY = originalKey;
  });

  it('calls the LLM API when API key is present', async () => {
    const formatted = '## Section 1\n\nFormatted text.';
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: formatted } }],
    });

    const result = await formatTranscript('Short transcript.', 'english');
    expect(result).toBe(formatted);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('passes the correct system prompt for each language', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'formatted' } }] });

    for (const lang of ['english', 'indonesian', 'arabic'] as const) {
      vi.clearAllMocks();
      await formatTranscript('transcript', lang);
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toBe(FORMAT_PROMPTS[lang]);
    }
  });

  it('falls back to basic paragraphs on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));
    const result = await formatTranscript('Sentence one. Sentence two.');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('summarizeTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when API key is not configured', async () => {
    const originalKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = '';

    await expect(summarizeTranscript('transcript', 'file.mp3')).rejects.toThrow(
      'API key not configured'
    );

    process.env.GROQ_API_KEY = originalKey;
  });

  it('parses and returns a valid LectureNotes object', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_SUMMARY_RESPONSE) } }],
    });

    const result = await summarizeTranscript('Lecture content goes here.', 'lecture.mp3');

    expect(result.title).toBe('Test Lecture');
    expect(result.summary).toBe('This is a test summary.');
    expect(result.paragraphs).toHaveLength(2);
    expect(result.quizQuestions).toHaveLength(1);
    expect(result.quizQuestions[0].correctAnswer).toBe(0);
    expect(result.metadata.originalFilename).toBe('lecture.mp3');
    expect(result.metadata.generatedAt).toBeTruthy();
  });

  it('adds crop warning for transcripts exceeding token limits', async () => {
    const longTranscript = 'word '.repeat(40000);
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_SUMMARY_RESPONSE) } }],
    });

    const result = await summarizeTranscript(longTranscript, 'long-lecture.mp3');

    expect(result.summary).toContain('⚠️');
    expect(result.summary).toContain('cropped');
    expect(result.metadata).toHaveProperty('note');
  });

  it('includes word count and model info in metadata', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_SUMMARY_RESPONSE) } }],
    });

    const result = await summarizeTranscript('one two three', 'test.mp3');
    expect(result.metadata.wordCount).toBe(3);
    expect(result.metadata.transcriptionModel).toBeTruthy();
    expect(result.metadata.summarizationModel).toBeTruthy();
  });

  it('respects custom summarization options', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_SUMMARY_RESPONSE) } }],
    });

    await summarizeTranscript('transcript', 'file.mp3', {
      language: 'indonesian',
      detailLevel: 'concise',
      focusAreas: ['ethics'],
    });

    const callArgs = mockCreate.mock.calls[0][0];
    const systemPrompt = callArgs.messages[0].content as string;
    expect(systemPrompt).toContain('Bahasa Indonesia');
    expect(systemPrompt).toContain('concise');
    expect(systemPrompt).toContain('ethics');
  });

  it('returns empty arrays for missing fields in the API response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ title: 'Minimal', summary: 'Short.' }) } }],
    });

    const result = await summarizeTranscript('transcript', 'file.mp3');
    expect(result.paragraphs).toEqual([]);
    expect(result.bulletPoints).toEqual([]);
    expect(result.keyConcepts).toEqual([]);
    expect(result.quizQuestions).toEqual([]);
    expect(result.actionItems).toEqual([]);
  });
});
