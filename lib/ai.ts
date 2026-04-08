import OpenAI from 'openai';
import { promises as fs } from 'fs';
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
      return await transcribeWithOpenAI(audioPath, config, options);
    case 'groq':
      return await transcribeWithGroq(audioPath, config, options);
    case 'deepgram':
      return await transcribeWithDeepgram(audioPath, config, options);
    case 'anthropic':
      return await transcribeWithOpenAI(audioPath, config, options);
    default:
      throw new Error(`Transcription not supported for provider: ${config.provider}`);
  }
}

async function transcribeWithOpenAI(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  // Check file size - OpenAI Whisper has 25MB limit
  const stats = await fs.stat(audioPath);
  const fileSizeMB = stats.size / (1024 * 1024);

  if (fileSizeMB > 25) {
    throw new Error(
      `Audio file is ${fileSizeMB.toFixed(2)}MB. OpenAI Whisper API has a 25MB limit. ` +
        `Please use a shorter audio file or compress it further.`
    );
  }

  // For files > 10MB, reduce quality to be safer
  const shouldCompress = fileSizeMB > 10;

  console.log(
    `[Transcription] File size: ${fileSizeMB.toFixed(2)}MB${shouldCompress ? ' - Will attempt compression' : ''}`
  );

  const openai = new OpenAI({
    apiKey: config.apiKey,
    timeout: 600000, // Increase to 10 minutes for larger files
    maxRetries: 0, // Disable auto-retry, we'll handle it manually with p-retry
  });

  // Use p-retry for robust retry logic with exponential backoff
  return pRetry(
    async (attemptNumber) => {
      try {
        console.log(`[Transcription] Attempt ${attemptNumber}/${3}...`);

        // Read file - OpenAI SDK can handle fs.ReadStream or Buffer directly
        const audioBuffer = await fs.readFile(audioPath);
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });

        console.log(`[Transcription] Uploading ${blob.size} bytes to OpenAI...`);

        const response = await openai.audio.transcriptions.create({
          file: blob as any, // OpenAI SDK handles Blob in Node.js
          model: config.transcriptionModel,
          language: options.language,
          prompt: options.prompt,
          temperature: options.temperature || 0,
          response_format: 'verbose_json',
        });

        console.log(`[Transcription] Success! Duration: ${response.duration}s`);

        return {
          text: response.text,
          duration: response.duration,
          language: response.language,
          segments: response.segments?.map((seg: any, idx: number) => ({
            id: idx,
            start: seg.start,
            end: seg.end,
            text: seg.text,
          })),
        };
      } catch (error: any) {
        console.error(`[Transcription] Attempt ${attemptNumber} failed:`, error.message);

        // Don't retry on authentication errors or invalid files (abort immediately)
        if (error.status === 401 || error.status === 400) {
          throw new AbortError(error.message);
        }

        // For other errors, let p-retry handle it
        throw error;
      }
    },
    {
      retries: 3,
      factor: 2, // Exponential backoff factor
      minTimeout: 2000, // Start with 2s
      maxTimeout: 10000, // Cap at 10s
      randomize: true, // Add jitter to prevent thundering herd
      onFailedAttempt: (error) => {
        console.log(
          `[Transcription] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      },
    }
  ).catch((error) => {
    // Enhanced error message with file size context
    if (error instanceof AbortError) {
      throw error;
    }
    throw new Error(
      `Failed to transcribe after 3 attempts. File size: ${fileSizeMB.toFixed(2)}MB. ` +
        `Last error: ${error?.message || 'Unknown error'}. ` +
        `Try with a smaller file (< 10MB recommended) or check your internet connection.`
    );
  });
}

async function transcribeWithGroq(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  return pRetry(
    async (attemptNumber) => {
      console.log(`[Groq Transcription] Attempt ${attemptNumber}...`);

      const audioFile = await fs.readFile(audioPath);
      // Create Blob with proper type for Node.js FormData compatibility
      const blob = new Blob([audioFile], { type: 'audio/mpeg' });

      const formData = new FormData();
      // Append with explicit filename (3rd parameter) for Node.js FormData
      formData.append('file', blob, 'audio.mp3');
      formData.append('model', config.transcriptionModel);
      if (options.language) formData.append('language', options.language);
      if (options.temperature) formData.append('temperature', options.temperature.toString());

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Don't retry on auth errors
        if (response.status === 401 || response.status === 400) {
          throw new AbortError(`Groq transcription failed: ${response.statusText} - ${errorText}`);
        }
        throw new Error(`Groq transcription failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      return {
        text: data.text,
        duration: data.duration,
        language: data.language,
      };
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 2000,
      maxTimeout: 10000,
      randomize: true,
      onFailedAttempt: (error) => {
        console.log(
          `[Groq] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      },
    }
  );
}

async function transcribeWithDeepgram(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  return pRetry(
    async (attemptNumber) => {
      console.log(`[Deepgram Transcription] Attempt ${attemptNumber}...`);

      const audioBuffer = await fs.readFile(audioPath);

      const response = await fetch(
        `https://api.deepgram.com/v1/listen?model=${config.transcriptionModel}&smart_format=true&punctuate=true&paragraphs=true`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${config.apiKey}`,
            'Content-Type': 'audio/mp3',
          },
          body: audioBuffer,
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        // Don't retry on auth errors
        if (response.status === 401 || response.status === 400) {
          throw new AbortError(`Deepgram transcription failed: ${errorText}`);
        }
        throw new Error(`Deepgram transcription failed: ${errorText}`);
      }

      const data = await response.json();
      const transcript = data.results.channels[0].alternatives[0];

      return {
        text: transcript.transcript,
        duration: data.metadata.duration,
        language: data.results.channels[0].detected_language,
      };
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 2000,
      maxTimeout: 10000,
      randomize: true,
      onFailedAttempt: (error) => {
        console.log(
          `[Deepgram] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      },
    }
  );
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
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
      });

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

  if (!config.apiKey) {
    // If no API key, just add basic paragraphs every ~500 characters
    return addBasicParagraphs(transcript);
  }

  try {
    const langKey =
      language === 'arabic' ? 'arabic' : language === 'indonesian' ? 'indonesian' : 'english';
    const systemPrompt = FORMAT_PROMPTS[langKey];

    if (config.provider === 'openai' || config.provider === 'groq') {
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
      });

      // Check token limit and crop if needed
      const estimatedTokens = Math.ceil(transcript.length / 4);
      const maxTokens = config.provider === 'groq' ? 9000 : 100000;

      let processedTranscript = transcript;
      if (estimatedTokens > maxTokens) {
        console.log(`[Format] Transcript too long, cropping to ${maxTokens} tokens for formatting`);
        const maxChars = maxTokens * 4;
        const sentences = transcript.substring(0, maxChars).split(/[.!?]\s+/);
        sentences.pop();
        processedTranscript = sentences.join('. ') + '.';
      }

      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          { role: 'system', content: systemPrompt },
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

/**
 * Add basic paragraph breaks every ~500 characters at sentence boundaries
 */
function addBasicParagraphs(transcript: string): string {
  const sentences = transcript.split(/([.!?]\s+)/);
  let result = '';
  let charCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    result += sentences[i];
    charCount += sentences[i].length;

    // Add double newline every ~500 chars at sentence end
    if (charCount > 500 && sentences[i].match(/[.!?]\s+/)) {
      result += '\n\n';
      charCount = 0;
    }
  }

  return result.trim();
}

/**
 * Split transcript into chunks based on token estimate
 * Rough estimate: 1 token ≈ 4 characters
 */
function chunkTranscript(transcript: string, maxTokens: number = 10000): string[] {
  const maxChars = maxTokens * 4; // Rough estimate

  if (transcript.length <= maxChars) {
    return [transcript];
  }

  const chunks: string[] = [];
  const sentences = transcript.split(/[.!?]\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    const testChunk = currentChunk + sentence + '. ';

    if (testChunk.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + '. ';
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
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

  // Check if transcript is too long (estimate tokens)
  const estimatedTokens = Math.ceil(transcript.length / 4);
  const maxInputTokens = config.provider === 'groq' ? 9000 : 100000; // Leave some buffer for Groq

  console.log(`[Summarization] Estimated tokens: ${estimatedTokens}, Max: ${maxInputTokens}`);

  // If transcript is too long, crop it (don't process the rest)
  let processedTranscript = transcript;
  let wasCropped = false;

  if (estimatedTokens > maxInputTokens) {
    console.log(
      `[Summarization] Transcript too long (${estimatedTokens} tokens), cropping to ${maxInputTokens} tokens...`
    );
    const maxChars = maxInputTokens * 4;

    // Crop at sentence boundary
    const sentences = transcript.substring(0, maxChars).split(/[.!?]\s+/);
    sentences.pop(); // Remove last incomplete sentence
    processedTranscript = sentences.join('. ') + '.';
    wasCropped = true;

    const newEstimate = Math.ceil(processedTranscript.length / 4);
    console.log(`[Summarization] Cropped transcript to ${newEstimate} tokens`);
  }

  const systemPrompt = buildSummarizationPrompt(options);

  let summaryText: string;

  if (config.provider === 'openai' || config.provider === 'groq') {
    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
      maxRetries: 0, // We'll handle retries with p-retry
    });

    summaryText = await pRetry(
      async (attemptNumber) => {
        console.log(`[Summarization] Attempt ${attemptNumber}...`);

        const response = await openai.chat.completions.create({
          model: config.summarizationModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: processedTranscript }, // Use cropped transcript
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        return response.choices[0].message.content || '{}';
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 2000,
        maxTimeout: 10000,
        randomize: true,
        onFailedAttempt: (error) => {
          console.log(
            `[Summarization] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        },
      }
    );
  } else if (config.provider === 'anthropic') {
    summaryText = await pRetry(
      async (attemptNumber) => {
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
              {
                role: 'user',
                content: `${systemPrompt}\n\nTranscript:\n${processedTranscript}`, // Use cropped transcript
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          // Abort on auth/validation errors
          if (response.status === 401 || response.status === 400) {
            throw new AbortError(`Anthropic API failed: ${errorText}`);
          }
          throw new Error(`Anthropic API failed: ${errorText}`);
        }

        const data = await response.json();
        return data.content[0].text;
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 2000,
        maxTimeout: 10000,
        randomize: true,
        onFailedAttempt: (error) => {
          console.log(
            `[Anthropic] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        },
      }
    );
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

async function summarizeTranscriptInChunks(
  transcript: string,
  originalFilename: string,
  options: SummarizationOptions,
  maxTokens: number
): Promise<LectureNotes> {
  console.log('[Summarization] Processing transcript in chunks...');

  const chunks = chunkTranscript(transcript, maxTokens);
  console.log(`[Summarization] Split into ${chunks.length} chunks`);

  const config = getAIConfig();
  const chunkSummaries: LectureNotes[] = [];

  // Summarize each chunk
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[Summarization] Processing chunk ${i + 1}/${chunks.length}`);

    const systemPrompt = buildSummarizationPrompt(options);
    let summaryText: string;

    if (config.provider === 'openai' || config.provider === 'groq') {
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
      });

      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: chunks[i] },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      summaryText = response.choices[0].message.content || '{}';
    } else {
      throw new Error(`Chunked summarization only supported for OpenAI/Groq`);
    }

    const parsed = JSON.parse(summaryText);
    chunkSummaries.push({
      title: parsed.title || `Part ${i + 1}`,
      summary: parsed.summary || '',
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
        wordCount: chunks[i].split(/\s+/).length,
      },
    });
  }

  // Merge all chunk summaries
  console.log('[Summarization] Merging chunk summaries...');

  return {
    title: chunkSummaries[0].title,
    summary: chunkSummaries.map((s) => s.summary).join('\n\n'),
    paragraphs: chunkSummaries.flatMap((s) => s.paragraphs),
    bulletPoints: chunkSummaries.flatMap((s) => s.bulletPoints),
    keyConcepts: chunkSummaries.flatMap((s) => s.keyConcepts),
    definitions: chunkSummaries.flatMap((s) => s.definitions),
    exampleProblems: chunkSummaries.flatMap((s) => s.exampleProblems),
    quizQuestions: chunkSummaries.flatMap((s) => s.quizQuestions),
    actionItems: chunkSummaries.flatMap((s) => s.actionItems),
    metadata: {
      generatedAt: new Date().toISOString(),
      transcriptionModel: config.transcriptionModel,
      summarizationModel: config.summarizationModel,
      originalFilename,
      wordCount: transcript.split(/\s+/).length,
    },
  };
}
