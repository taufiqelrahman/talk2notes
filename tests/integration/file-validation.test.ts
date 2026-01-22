import { describe, it, expect } from 'vitest';
import { validateFile, sanitizeFilename, formatFileSize } from '@/utils/validateFile';

describe('File Validation', () => {
  describe('validateFile', () => {
    it('should accept valid MP3 files', () => {
      const result = validateFile('audio/mpeg', 5 * 1024 * 1024, 'test.mp3');
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('audio');
    });

    it('should accept valid WAV files', () => {
      const result = validateFile('audio/wav', 3 * 1024 * 1024, 'test.wav');
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('audio');
    });

    it('should accept valid MP4 video files', () => {
      const result = validateFile('video/mp4', 50 * 1024 * 1024, 'test.mp4');
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('video');
    });

    it('should reject files exceeding max size', () => {
      const result = validateFile('audio/mpeg', 60 * 1024 * 1024, 'test.mp3');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject invalid file extensions', () => {
      const result = validateFile('application/pdf', 1024, 'test.pdf');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });

    it('should reject files without extensions', () => {
      const result = validateFile('audio/mpeg', 1024, 'testfile');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });

    it('should reject audio files over 25MB', () => {
      const result = validateFile('audio/mpeg', 26 * 1024 * 1024, 'test.mp3');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('25MB limit');
    });

    it('should reject video files over 500MB', () => {
      const result = validateFile('video/mp4', 501 * 1024 * 1024, 'test.mp4');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should handle MIME type variations', () => {
      const result1 = validateFile('audio/mp3', 5 * 1024 * 1024, 'test.mp3');
      const result2 = validateFile('audio/x-wav', 5 * 1024 * 1024, 'test.wav');
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace special characters with underscores', () => {
      expect(sanitizeFilename('file@name#test.mp3')).toBe('file_name_test.mp3');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeFilename('MyFile.MP3')).toBe('myfile.mp3');
    });

    it('should collapse multiple underscores', () => {
      expect(sanitizeFilename('file___name.mp3')).toBe('file_name.mp3');
    });

    it('should preserve dots and hyphens', () => {
      expect(sanitizeFilename('file-name.test.mp3')).toBe('file-name.test.mp3');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });
  });
});
