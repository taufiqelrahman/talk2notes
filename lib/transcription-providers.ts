import OpenAI from 'openai';
import { promises as fs } from 'fs';
import pRetry, { AbortError } from 'p-retry';
import type { AIConfig, TranscriptionOptions, TranscriptionResult } from '@/types';
import { retryOptions, createOpenAIClient } from '@/lib/ai-utils';

export async function transcribeWithOpenAI(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const stats = await fs.stat(audioPath);
  const fileSizeMB = stats.size / (1024 * 1024);

  if (fileSizeMB > 25) {
    throw new Error(
      `Audio file is ${fileSizeMB.toFixed(2)}MB. OpenAI Whisper API has a 25MB limit. ` +
        `Please use a shorter audio file or compress it further.`
    );
  }

  const shouldCompress = fileSizeMB > 10;
  console.log(
    `[Transcription] File size: ${fileSizeMB.toFixed(2)}MB${shouldCompress ? ' - Will attempt compression' : ''}`
  );

  const openai = new OpenAI({
    apiKey: config.apiKey,
    timeout: 600000,
    maxRetries: 0,
  });

  return pRetry(async (attemptNumber) => {
    try {
      console.log(`[Transcription] Attempt ${attemptNumber}/${3}...`);

      const audioBuffer = await fs.readFile(audioPath);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      console.log(`[Transcription] Uploading ${blob.size} bytes to OpenAI...`);

      const response = await openai.audio.transcriptions.create({
        file: blob as any,
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
      if (error.status === 401 || error.status === 400) throw new AbortError(error.message);
      throw error;
    }
  }, retryOptions('Transcription')).catch((error) => {
    if (error instanceof AbortError) throw error;
    throw new Error(
      `Failed to transcribe after 3 attempts. File size: ${fileSizeMB.toFixed(2)}MB. ` +
        `Last error: ${error?.message || 'Unknown error'}. ` +
        `Try with a smaller file (< 10MB recommended) or check your internet connection.`
    );
  });
}

export async function transcribeWithGroq(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  return pRetry(async (attemptNumber) => {
    console.log(`[Groq Transcription] Attempt ${attemptNumber}...`);

    const audioFile = await fs.readFile(audioPath);
    const blob = new Blob([audioFile], { type: 'audio/mpeg' });

    const formData = new FormData();
    formData.append('file', blob, 'audio.mp3');
    formData.append('model', config.transcriptionModel);
    if (options.language) formData.append('language', options.language);
    if (options.temperature) formData.append('temperature', options.temperature.toString());

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401 || response.status === 400) {
        throw new AbortError(`Groq transcription failed: ${response.statusText} - ${errorText}`);
      }
      throw new Error(`Groq transcription failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return { text: data.text, duration: data.duration, language: data.language };
  }, retryOptions('Groq'));
}

export async function transcribeWithDeepgram(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  return pRetry(async (attemptNumber) => {
    console.log(`[Deepgram Transcription] Attempt ${attemptNumber}...`);

    const audioBuffer = await fs.readFile(audioPath);
    const response = await fetch(
      `https://api.deepgram.com/v1/listen?model=${config.transcriptionModel}&smart_format=true&punctuate=true&paragraphs=true`,
      {
        method: 'POST',
        headers: { Authorization: `Token ${config.apiKey}`, 'Content-Type': 'audio/mp3' },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
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
  }, retryOptions('Deepgram'));
}
