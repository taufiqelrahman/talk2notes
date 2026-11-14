import pRetry, { AbortError } from 'p-retry';
import type {
  TranscriptionResult,
  LectureNotes,
  AIConfig,
  TranscriptionOptions,
  SummarizationOptions,
} from '@/types';
import {
  TRANSLATE_TO_INDONESIAN_PROMPT,
  FORMAT_PROMPTS,
  buildSummarizationPrompt,
} from '@/lib/ai-prompts';
import {
  retryOptions,
  createOpenAIClient,
  cropToTokenLimit,
  addBasicParagraphs,
  chunkText,
  paceTokens,
} from '@/lib/ai-utils';
import { prepareAudioChunks } from '@/lib/ffmpeg';
import { promises as fsp } from 'fs';
import {
  transcribeWithOpenAI,
  transcribeWithGroq,
  transcribeWithDeepgram,
} from '@/lib/transcription-providers';

export { buildSummarizationPrompt } from '@/lib/ai-prompts';

// Groq's free tier caps at 8000 tokens/minute (TPM), shared across input + output.
const GROQ_MAX_INPUT_TOKENS = 4000;
const GROQ_MAX_OUTPUT_TOKENS = 1500;
const GROQ_MAX_SUMMARY_OUTPUT_TOKENS = 2000;
// Per-chunk input size for translate/format/condense so each call fits in the TPM budget.
const GROQ_CHUNK_TOKENS = 2500;

// Controls transcription (audio -> text). Independent from getSummarizationConfig(),
// since transcription (Whisper) and text generation (translate/format/summarize) can run
// on different providers/rate limits.
export function getAIConfig(): AIConfig {
  const AI_PROVIDER =
    (process.env.AI_PROVIDER as 'openai' | 'groq' | 'deepgram' | 'anthropic') || 'openai';

  switch (AI_PROVIDER) {
    case 'openai':
      return {
        provider: 'openai',
        transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
        summarizationModel: process.env.OPENAI_SUMMARIZATION_MODEL || 'gpt-4-turbo-preview',
        apiKey: process.env.OPENAI_API_KEY || '',
      };
    case 'groq':
      return {
        provider: 'groq',
        transcriptionModel: process.env.GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3',
        summarizationModel: process.env.GROQ_SUMMARIZATION_MODEL || 'openai/gpt-oss-20b',
        apiKey: process.env.GROQ_API_KEY || '',
      };
    case 'deepgram':
      return {
        provider: 'deepgram',
        transcriptionModel: 'nova-2',
        summarizationModel: process.env.OPENAI_SUMMARIZATION_MODEL || 'gpt-4-turbo-preview',
        apiKey: process.env.DEEPGRAM_API_KEY || '',
      };
    case 'anthropic':
      return {
        provider: 'anthropic',
        transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
        summarizationModel: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      };
    default:
      throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
  }
}

/**
 * Config for translate/format/summarize calls. Separate from getAIConfig()
 * (transcription) so text generation can run on a different provider, e.g.
 * Gemini for summarization while transcription stays on Groq Whisper.
 */
export function getSummarizationConfig(): AIConfig {
  const SUMMARIZATION_PROVIDER =
    (process.env.AI_SUMMARIZATION_PROVIDER as 'openai' | 'groq' | 'anthropic' | 'gemini') ||
    (process.env.AI_PROVIDER as 'openai' | 'groq' | 'deepgram' | 'anthropic') ||
    'openai';

  if (SUMMARIZATION_PROVIDER === 'gemini') {
    return {
      provider: 'gemini',
      transcriptionModel: '',
      summarizationModel: process.env.GEMINI_SUMMARIZATION_MODEL || 'gemini-3.6-flash',
      apiKey: process.env.GEMINI_API_KEY || '',
    };
  }
  return getAIConfig();
}

export async function transcribeAudio(
  audioPath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }

  switch (config.provider) {
    case 'openai':
    case 'anthropic':
      return transcribeWithOpenAI(audioPath, config, options);
    case 'groq':
      return transcribeWithGroq(audioPath, config, options);
    case 'deepgram':
      return transcribeWithDeepgram(audioPath, config, options);
    default:
      throw new Error(`Transcription not supported for provider: ${config.provider}`);
  }
}

/**
 * Free-tier friendly transcription: chunked audio sent sequentially
 * (1 request at a time keeps us under RPM limits). The tail of the previous chunk is passed
 * as the prompt so names/terms and sentence flow stay consistent across boundaries.
 */
export async function transcribeAudioChunked(
  audioPath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const { chunks, dir } = await prepareAudioChunks(audioPath, 600);
  console.log(`[Transcription] Split into ${chunks.length} chunk(s)`);
  try {
    const texts: string[] = [];
    const segments: NonNullable<TranscriptionResult['segments']> = [];
    let duration = 0;
    let language: string | undefined;
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[Transcription] Chunk ${i + 1}/${chunks.length}`);
      const tail = texts.length ? texts[texts.length - 1].slice(-200) : '';
      const result = await transcribeAudio(chunks[i].path, {
        ...options,
        prompt: [options.prompt, tail].filter(Boolean).join(' ').slice(-800) || undefined,
      });
      texts.push(result.text.trim());
      duration += result.duration || 0;
      language = language || result.language;
      result.segments?.forEach((seg) =>
        segments.push({
          id: segments.length,
          start: seg.start + chunks[i].offsetSeconds,
          end: seg.end + chunks[i].offsetSeconds,
          text: seg.text,
        })
      );
    }
    return {
      text: texts.join('\n\n'),
      duration,
      language,
      ...(segments.length && { segments }),
    } as TranscriptionResult;
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function translateTranscript(
  transcript: string,
  targetLanguage: 'english' | 'indonesian'
): Promise<string> {
  if (targetLanguage === 'english') {
    return transcript; // No translation needed for English
  }

  const config = getSummarizationConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }

  console.log(`[Translation] Translating transcript to Indonesian...`);

  try {
    if (
      config.provider === 'openai' ||
      config.provider === 'groq' ||
      config.provider === 'gemini'
    ) {
      const openai = createOpenAIClient(config);
      const isGroq = config.provider === 'groq';
      const parts = isGroq ? chunkText(transcript, GROQ_CHUNK_TOKENS) : [transcript];
      const out: string[] = [];
      for (const part of parts) {
        if (isGroq) await paceTokens(Math.ceil(part.length / 4) + GROQ_MAX_OUTPUT_TOKENS);
        const response = await openai.chat.completions.create({
          model: config.summarizationModel,
          messages: [
            { role: 'system', content: TRANSLATE_TO_INDONESIAN_PROMPT },
            { role: 'user', content: part },
          ],
          temperature: 0.3,
          ...(isGroq && { max_tokens: GROQ_MAX_OUTPUT_TOKENS }),
        });
        out.push(response.choices[0].message.content || part);
      }
      console.log(`[Translation] ✓ Translation complete (${parts.length} part(s))`);
      return out.join('\n\n');
    } else {
      // For other providers, return original transcript
      console.log(`[Translation] Translation not supported for provider: ${config.provider}`);
      return transcript;
    }
  } catch (error) {
    console.error('[Translation] Translation failed:', error);
    // Return original transcript if translation fails
    return transcript;
  }
}

/**
 * Format transcript with paragraphs and sections for better readability
 */
export async function formatTranscript(
  transcript: string,
  language: 'english' | 'indonesian' | 'arabic' = 'english'
): Promise<string> {
  const config = getSummarizationConfig();

  if (!config.apiKey) return addBasicParagraphs(transcript);

  try {
    const langKey =
      language === 'arabic' ? 'arabic' : language === 'indonesian' ? 'indonesian' : 'english';
    if (
      config.provider === 'openai' ||
      config.provider === 'groq' ||
      config.provider === 'gemini'
    ) {
      const openai = createOpenAIClient(config);
      const isGroq = config.provider === 'groq';
      const parts = isGroq ? chunkText(transcript, GROQ_CHUNK_TOKENS) : [transcript];
      const out: string[] = [];
      for (const part of parts) {
        if (isGroq) await paceTokens(Math.ceil(part.length / 4) + GROQ_MAX_OUTPUT_TOKENS);
        const response = await openai.chat.completions.create({
          model: config.summarizationModel,
          messages: [
            { role: 'system', content: FORMAT_PROMPTS[langKey] },
            { role: 'user', content: part },
          ],
          temperature: 0.2,
          ...(isGroq && { max_tokens: GROQ_MAX_OUTPUT_TOKENS }),
        });
        out.push(response.choices[0].message.content || part);
      }
      return out.join('\n\n');
    }
    return addBasicParagraphs(transcript);
  } catch (error) {
    console.error('[Format] Formatting failed:', error);
    return addBasicParagraphs(transcript);
  }
}

export async function summarizeTranscript(
  transcript: string,
  originalFilename: string,
  options: SummarizationOptions = {}
): Promise<LectureNotes> {
  const config = getSummarizationConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }

  const maxInputTokens = config.provider === 'groq' ? GROQ_MAX_INPUT_TOKENS : 100000;
  const estimatedTokens = Math.ceil(transcript.length / 4);
  console.log(`[Summarization] Estimated tokens: ${estimatedTokens}, Max: ${maxInputTokens}`);

  let processedTranscript = transcript;
  let wasCropped = false;

  if (estimatedTokens > maxInputTokens) {
    // Map step: condense each chunk into dense notes (no information cropped), then
    // summarize the combined digest in the final call.
    console.log(`[Summarization] Transcript too long (${estimatedTokens} tokens), condensing in chunks...`);
    const isGroq = config.provider === 'groq';
    const client = createOpenAIClient(config, { maxRetries: 0 });
    const parts = chunkText(transcript, isGroq ? GROQ_CHUNK_TOKENS : 30000);
    const digests: string[] = [];
    for (const part of parts) {
      if (isGroq) await paceTokens(Math.ceil(part.length / 4) + 800);
      const digest = await pRetry(async () => {
        const r = await client.chat.completions.create({
          model: config.summarizationModel,
          messages: [
            {
              role: 'system',
              content:
                'Condense this lecture transcript segment into dense bullet notes. Keep every key concept, definition, example, number and name. Same language as the input. No preamble.',
            },
            { role: 'user', content: part },
          ],
          temperature: 0.2,
          max_tokens: 800,
        });
        return r.choices[0].message.content || '';
      }, retryOptions('Condense'));
      digests.push(digest);
    }
    processedTranscript = digests.join('\n\n');
    if (Math.ceil(processedTranscript.length / 4) > maxInputTokens) {
      processedTranscript = cropToTokenLimit(processedTranscript, maxInputTokens);
      wasCropped = true;
    }
  }

  const systemPrompt = buildSummarizationPrompt(options);
  let summaryText: string;

  if (
    config.provider === 'openai' ||
    config.provider === 'groq' ||
    config.provider === 'gemini'
  ) {
    const openai = createOpenAIClient(config, { maxRetries: 0 });
    summaryText = await pRetry(async (attemptNumber) => {
      console.log(`[Summarization] Attempt ${attemptNumber}...`);
      if (config.provider === 'groq') {
        await paceTokens(Math.ceil(processedTranscript.length / 4) + GROQ_MAX_SUMMARY_OUTPUT_TOKENS);
      }
      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: processedTranscript },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        ...(config.provider === 'groq' && { max_tokens: GROQ_MAX_SUMMARY_OUTPUT_TOKENS }),
      });
      return response.choices[0].message.content || '{}';
    }, retryOptions('Summarization'));
  } else if (config.provider === 'anthropic') {
    summaryText = await pRetry(async (attemptNumber) => {
      console.log(`[Anthropic Summarization] Attempt ${attemptNumber}...`);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: config.summarizationModel,
          max_tokens: 4096,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nTranscript:\n${processedTranscript}` },
          ],
        }),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        if (response.status === 401 || response.status === 400) {
          throw new AbortError(`Anthropic API failed: ${errorText}`);
        }
        throw new Error(`Anthropic API failed: ${errorText}`);
      }
      const data = await response.json();
      return data.content[0].text;
    }, retryOptions('Anthropic'));
  } else {
    throw new Error(`Summarization not supported for provider: ${config.provider}`);
  }

  const parsed = JSON.parse(summaryText);

  // Add note if transcript was cropped
  let summary = parsed.summary || '';
  if (wasCropped) {
    summary = `⚠️ **Note**: Transcript was too long and was cropped to fit within API limits. Only the first ~${maxInputTokens} tokens were processed.\n\n${summary}`;
  }

  return {
    title: parsed.title || 'Untitled Lecture Notes',
    summary,
    paragraphs: parsed.paragraphs || [],
    bulletPoints: parsed.bulletPoints || [],
    keyConcepts: parsed.keyConcepts || [],
    definitions: parsed.definitions || [],
    exampleProblems: parsed.exampleProblems || [],
    quizQuestions: parsed.quizQuestions || [],
    actionItems: parsed.actionItems || [],
    metadata: {
      generatedAt: new Date().toISOString(),
      transcriptionModel: getAIConfig().transcriptionModel,
      summarizationModel: config.summarizationModel,
      originalFilename,
      wordCount: processedTranscript.split(/\s+/).length,
      ...(wasCropped && { note: 'Transcript was cropped due to API token limits' }),
    },
  };
}
