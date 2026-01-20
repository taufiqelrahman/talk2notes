import { describe, it, expect } from 'vitest';
import { getAIConfig } from '@/lib/ai';

describe('AI Configuration', () => {
  describe('getAIConfig', () => {
    it('should return Groq config (default in test env)', () => {
      // Test uses default groq provider from setup
      const config = getAIConfig();

      expect(config.provider).toBe('groq');
      expect(config.transcriptionModel).toBe('whisper-large-v3');
      expect(config.summarizationModel).toBe('llama-3.3-70b-versatile');
      expect(config.apiKey).toBe('test-api-key');
    });

    it('should have correct model names', () => {
      const config = getAIConfig();

      expect(config.transcriptionModel).toBeDefined();
      expect(config.summarizationModel).toBeDefined();
      expect(typeof config.transcriptionModel).toBe('string');
      expect(typeof config.summarizationModel).toBe('string');
    });

    it('should have valid API key', () => {
      const config = getAIConfig();

      expect(config.apiKey).toBeDefined();
      expect(config.apiKey).toBe('test-api-key');
    });
  });
});
