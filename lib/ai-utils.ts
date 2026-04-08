import OpenAI from 'openai';
import pRetry from 'p-retry';
import type { AIConfig } from '@/types';

export function retryOptions(label: string): Parameters<typeof pRetry>[1] {
  return {
    retries: 3,
    factor: 2,
    minTimeout: 2000,
    maxTimeout: 10000,
    randomize: true,
    onFailedAttempt: (error) => {
      console.log(
        `[${label}] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
      );
    },
  };
}

export function createOpenAIClient(
  config: AIConfig,
  extraOpts: ConstructorParameters<typeof OpenAI>[0] = {}
): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
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
