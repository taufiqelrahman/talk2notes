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
} from '@/lib/ai-utils';
import {
  transcribeWithOpenAI,
  transcribeWithGroq,
  transcribeWithDeepgram,
} from '@/lib/transcription-providers';

export { buildSummarizationPrompt } from '@/lib/ai-prompts';

const AI_PROVIDER =
  (process.env.AI_PROVIDER as 'openai' | 'groq' | 'deepgram' | 'anthropic') || 'openai';

export function getAIConfig(): AIConfig {
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
        summarizationModel: process.env.GROQ_SUMMARIZATION_MODEL || 'llama-3.3-70b-versatile',
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

export async function translateTranscript(
  transcript: string,
  targetLanguage: 'english' | 'indonesian'
): Promise<string> {
  if (targetLanguage === 'english') {
    return transcript; // No translation needed for English
  }

  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }

  console.log(`[Translation] Translating transcript to Indonesian...`);

  try {
    if (config.provider === 'openai' || config.provider === 'groq') {
      const openai = createOpenAIClient(config);

      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          {
            role: 'system',
            content: TRANSLATE_TO_INDONESIAN_PROMPT,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.3,
      });

      const translated = response.choices[0].message.content || transcript;
      console.log(`[Translation] ✓ Translation complete`);
      return translated;
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
  const config = getAIConfig();

  if (!config.apiKey) return addBasicParagraphs(transcript);

  try {
    const langKey =
      language === 'arabic' ? 'arabic' : language === 'indonesian' ? 'indonesian' : 'english';
    if (config.provider === 'openai' || config.provider === 'groq') {
      const openai = createOpenAIClient(config);
      const maxTokens = config.provider === 'groq' ? 9000 : 100000;
      const estimatedTokens = Math.ceil(transcript.length / 4);
      let processedTranscript = transcript;
      if (estimatedTokens > maxTokens) {
        console.log(`[Format] Transcript too long, cropping to ${maxTokens} tokens for formatting`);
        processedTranscript = cropToTokenLimit(transcript, maxTokens);
      }
      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          { role: 'system', content: FORMAT_PROMPTS[langKey] },
          { role: 'user', content: processedTranscript },
        ],
        temperature: 0.2,
      });
      return response.choices[0].message.content || transcript;
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
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }

  const maxInputTokens = config.provider === 'groq' ? 9000 : 100000;
  const estimatedTokens = Math.ceil(transcript.length / 4);
  console.log(`[Summarization] Estimated tokens: ${estimatedTokens}, Max: ${maxInputTokens}`);

  let processedTranscript = transcript;
  let wasCropped = false;

  if (estimatedTokens > maxInputTokens) {
    console.log(
      `[Summarization] Transcript too long (${estimatedTokens} tokens), cropping to ${maxInputTokens} tokens...`
    );
    processedTranscript = cropToTokenLimit(transcript, maxInputTokens);
    wasCropped = true;
    console.log(
      `[Summarization] Cropped transcript to ${Math.ceil(processedTranscript.length / 4)} tokens`
    );
  }

  const systemPrompt = buildSummarizationPrompt(options);
  let summaryText: string;

  if (config.provider === 'openai' || config.provider === 'groq') {
    const openai = createOpenAIClient(config, { maxRetries: 0 });
    summaryText = await pRetry(async (attemptNumber) => {
      console.log(`[Summarization] Attempt ${attemptNumber}...`);
      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: processedTranscript },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
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
      transcriptionModel: config.transcriptionModel,
      summarizationModel: config.summarizationModel,
      originalFilename,
      wordCount: processedTranscript.split(/\s+/).length,
      ...(wasCropped && { note: 'Transcript was cropped due to API token limits' }),
    },
  };
}
