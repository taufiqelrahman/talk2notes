import OpenAI from 'openai';
import { promises as fs } from 'fs';
import type {
  TranscriptionResult,
  LectureNotes,
  AIConfig,
  TranscriptionOptions,
  SummarizationOptions,
} from '@/types';

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
    maxRetries: 0, // Disable auto-retry, we'll handle it manually
  });

  // Manual retry logic with exponential backoff
  let lastError: any;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Transcription] Attempt ${attempt}/${maxAttempts}...`);

      // Read file and create File object
      const audioBuffer = await fs.readFile(audioPath);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const file = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });

      console.log(`[Transcription] Uploading ${file.size} bytes to OpenAI...`);

      const response = await openai.audio.transcriptions.create({
        file: file,
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
      lastError = error;
      console.error(`[Transcription] Attempt ${attempt} failed:`, error.message);

      // Don't retry on authentication errors or invalid files
      if (error.status === 401 || error.status === 400) {
        throw error;
      }

      // If it's a connection error and we have attempts left, wait and retry
      if (
        attempt < maxAttempts &&
        (error.code === 'ECONNRESET' || error.type === 'system' || error.code === 'ETIMEDOUT')
      ) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`[Transcription] Waiting ${waitTime / 1000}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      throw error;
    }
  }

  // If we got here, all retries failed
  throw new Error(
    `Failed to transcribe after ${maxAttempts} attempts. File size: ${fileSizeMB.toFixed(2)}MB. ` +
      `Last error: ${lastError?.message || 'Unknown error'}. ` +
      `Try with a smaller file (< 10MB recommended) or check your internet connection.`
  );
}

async function transcribeWithGroq(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const audioFile = await fs.readFile(audioPath);
  const file = new File([audioFile], 'audio.mp3', { type: 'audio/mp3' });

  const formData = new FormData();
  formData.append('file', file);
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
    throw new Error(`Groq transcription failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    text: data.text,
    duration: data.duration,
    language: data.language,
  };
}

async function transcribeWithDeepgram(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
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
    throw new Error(`Deepgram transcription failed: ${response.statusText}`);
  }

  const data = await response.json();
  const transcript = data.results.channels[0].alternatives[0];

  return {
    text: transcript.transcript,
    duration: data.metadata.duration,
    language: data.results.channels[0].detected_language,
  };
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
        { role: 'user', content: transcript },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    summaryText = response.choices[0].message.content || '{}';
  } else if (config.provider === 'anthropic') {
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
            content: `${systemPrompt}\n\nTranscript:\n${transcript}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API failed: ${response.statusText}`);
    }

    const data = await response.json();
    summaryText = data.content[0].text;
  } else {
    throw new Error(`Summarization not supported for provider: ${config.provider}`);
  }

  const parsed = JSON.parse(summaryText);

  return {
    title: parsed.title || 'Untitled Lecture Notes',
    summary: parsed.summary || '',
    paragraphs: parsed.paragraphs || [],
    bulletPoints: parsed.bulletPoints || [],
    keyConcepts: parsed.keyConcepts || [],
    definitions: parsed.definitions || [],
    exampleProblems: parsed.exampleProblems || [],
    actionItems: parsed.actionItems || [],
    metadata: {
      generatedAt: new Date().toISOString(),
      transcriptionModel: config.transcriptionModel,
      summarizationModel: config.summarizationModel,
      originalFilename,
      wordCount: transcript.split(/\s+/).length,
    },
  };
}

function buildSummarizationPrompt(options: SummarizationOptions): string {
  const detailLevel = options.detailLevel || 'detailed';
  const focusAreas = options.focusAreas?.join(', ') || 'all topics';

  return `You are an expert academic note-taker. Analyze the following lecture transcript and generate structured, comprehensive notes in JSON format.

Focus on: ${focusAreas}
Detail level: ${detailLevel}

Generate a JSON object with the following structure:
{
  "title": "A clear, descriptive title for the lecture",
  "summary": "A ${detailLevel} overview paragraph (3-5 sentences) summarizing the main themes and takeaways",
  "paragraphs": ["Array of well-structured paragraphs covering main topics in logical order", "Each paragraph should be 3-5 sentences", "Maintain academic writing style"],
  "bulletPoints": ["Concise key points", "Action items", "Important facts", "Main arguments"],
  "keyConcepts": [
    {
      "concept": "Concept name",
      "explanation": "Clear explanation",
      "importance": "high|medium|low"
    }
  ],
  "definitions": [
    {
      "term": "Technical term or concept",
      "definition": "Precise definition",
      "context": "How it's used in the lecture"
    }
  ],
  "exampleProblems": [
    {
      "problem": "Problem statement or question",
      "solution": "Solution if provided",
      "explanation": "Step-by-step explanation"
    }
  ],
  "actionItems": ["Tasks mentioned", "Assignments", "Follow-up items", "Further reading suggestions"]
}

Rules:
- Extract all key concepts, definitions, and examples mentioned
- Organize information logically and hierarchically
- Use clear, academic language
- Identify relationships between concepts
- Highlight important formulas, theories, or frameworks
- Note any examples, case studies, or illustrations used
- Capture action items and next steps
- If no example problems are present, return empty array
- Ensure all JSON is valid and properly formatted
- Do not include any text outside the JSON object`;
}
