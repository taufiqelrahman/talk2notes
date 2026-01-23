import { describe, it, expect, beforeEach } from 'vitest';
import { saveToHistory, getHistory, deleteFromHistory, clearHistory } from '@/utils/history';
import type { LectureNotes } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('History Management', () => {
  const mockNotes: LectureNotes = {
    title: 'Test Lecture',
    summary: 'Test summary',
    paragraphs: ['Para 1', 'Para 2'],
    bulletPoints: ['Point 1', 'Point 2'],
    keyConcepts: [
      {
        concept: 'Test Concept',
        explanation: 'Test explanation',
        importance: 'high' as const,
      },
    ],
    definitions: [
      {
        term: 'Term 1',
        definition: 'Definition 1',
        context: 'Context 1',
      },
    ],
    exampleProblems: [],
    actionItems: ['Action 1'],
    metadata: {
      generatedAt: new Date().toISOString(),
      transcriptionModel: 'whisper-large-v3',
      summarizationModel: 'llama-3.3-70b-versatile',
      originalFilename: 'test.mp3',
      wordCount: 100,
    },
  };

  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('saveToHistory', () => {
    it('should save item to history', () => {
      saveToHistory({
        title: 'Test',
        notes: mockNotes,
        language: 'en',
        source: 'file',
        filename: 'test.mp3',
      });

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].title).toBe('Test');
      expect(history[0].id).toBeDefined();
    });

    it('should add timestamp to history item', () => {
      saveToHistory({
        title: 'Test',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      const history = getHistory();
      expect(history[0].timestamp).toBeDefined();
      expect(typeof history[0].timestamp).toBe('number');
    });

    it('should handle multiple items', () => {
      saveToHistory({
        title: 'Test 1',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      saveToHistory({
        title: 'Test 2',
        notes: mockNotes,
        language: 'id',
        source: 'youtube',
        youtubeUrl: 'https://youtube.com/watch?v=test',
      });

      const history = getHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no history', () => {
      const history = getHistory();
      expect(history).toEqual([]);
    });

    it('should return saved history items', () => {
      saveToHistory({
        title: 'Test',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].notes).toEqual(mockNotes);
    });

    it('should sort by timestamp descending', () => {
      saveToHistory({
        title: 'First',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      // Wait a bit to ensure different timestamps
      saveToHistory({
        title: 'Second',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      const history = getHistory();
      expect(history[0].title).toBe('Second');
      expect(history[1].title).toBe('First');
    });
  });

  describe('deleteFromHistory', () => {
    it('should delete specific item', () => {
      saveToHistory({
        title: 'Test 1',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      saveToHistory({
        title: 'Test 2',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      const history1 = getHistory();
      const id1 = history1[1].id;

      deleteFromHistory(id1);

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].title).toBe('Test 2');
    });

    it('should handle deleting non-existent item', () => {
      saveToHistory({
        title: 'Test',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      deleteFromHistory('non-existent-id');

      const history = getHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history items', () => {
      saveToHistory({
        title: 'Test 1',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      saveToHistory({
        title: 'Test 2',
        notes: mockNotes,
        language: 'en',
        source: 'file',
      });

      clearHistory();

      const history = getHistory();
      expect(history).toEqual([]);
    });

    it('should handle clearing empty history', () => {
      clearHistory();
      const history = getHistory();
      expect(history).toEqual([]);
    });
  });
});
