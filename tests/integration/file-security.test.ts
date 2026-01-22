import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  validateFileSignature,
  validateFileIntegrity,
  scanFileContent,
  validateFileSecurely,
} from '@/lib/file-security';

const TEST_DIR = path.join(process.cwd(), 'test-files');

async function createTestFile(filename: string, content: Buffer): Promise<string> {
  await fs.mkdir(TEST_DIR, { recursive: true });
  const filepath = path.join(TEST_DIR, filename);
  await fs.writeFile(filepath, content);
  return filepath;
}

async function cleanup() {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

describe('File Security - Magic Bytes Validation', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('validateFileSignature', () => {
    it('should validate MP3 file with ID3v2 tag', async () => {
      const mp3Header = Buffer.from([
        0x49,
        0x44,
        0x33, // ID3
        0x04,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);
      const filepath = await createTestFile('test.mp3', mp3Header);

      const result = await validateFileSignature(filepath);
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('mp3');
      expect(result.detectedMime).toBe('audio/mpeg');
    });

    it('should validate WAV file with RIFF header', async () => {
      const wavHeader = Buffer.from([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x24,
        0x00,
        0x00,
        0x00,
        0x57,
        0x41,
        0x56,
        0x45, // WAVE
      ]);
      const filepath = await createTestFile('test.wav', wavHeader);

      const result = await validateFileSignature(filepath);
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('wav');
      expect(result.detectedMime).toBe('audio/wav');
    });

    it('should validate FLAC file', async () => {
      const flacHeader = Buffer.from([
        0x66,
        0x4c,
        0x61,
        0x43, // fLaC
        0x00,
        0x00,
        0x00,
        0x00,
      ]);
      const filepath = await createTestFile('test.flac', flacHeader);

      const result = await validateFileSignature(filepath);
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('flac');
    });

    it('should validate OGG file', async () => {
      const oggHeader = Buffer.from([
        0x4f,
        0x67,
        0x67,
        0x53, // OggS
        0x00,
        0x00,
        0x00,
        0x00,
      ]);
      const filepath = await createTestFile('test.ogg', oggHeader);

      const result = await validateFileSignature(filepath);
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('ogg');
    });

    it('should reject file with invalid signature', async () => {
      const invalidHeader = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const filepath = await createTestFile('test.fake', invalidHeader);

      const result = await validateFileSignature(filepath);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not match');
    });

    it('should reject executable disguised as audio', async () => {
      const exeHeader = Buffer.from([
        0x4d,
        0x5a, // MZ (Windows executable)
        0x90,
        0x00,
        0x03,
        0x00,
      ]);
      const filepath = await createTestFile('virus.mp3', exeHeader);

      const result = await validateFileSignature(filepath);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileIntegrity', () => {
    it('should pass when signature matches claimed type', async () => {
      const mp3Header = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]);
      const filepath = await createTestFile('test.mp3', mp3Header);

      const result = await validateFileIntegrity(filepath, 'audio/mpeg', 'mp3');
      expect(result.valid).toBe(true);
    });

    it('should fail when signature does not match extension', async () => {
      const mp3Header = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]);
      const filepath = await createTestFile('fake.wav', mp3Header);

      const result = await validateFileIntegrity(filepath, 'audio/wav', 'wav');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should fail when signature does not match MIME type', async () => {
      const wavHeader = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00]);
      const filepath = await createTestFile('test.wav', wavHeader);

      const result = await validateFileIntegrity(filepath, 'audio/mpeg', 'wav');
      expect(result.valid).toBe(false);
    });
  });

  describe('scanFileContent', () => {
    it('should pass clean audio file', async () => {
      const cleanContent = Buffer.from([0x49, 0x44, 0x33, ...Buffer.alloc(1000, 0x00)]);
      const filepath = await createTestFile('clean.mp3', cleanContent);

      const result = await scanFileContent(filepath);
      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect suspiciously small files', async () => {
      const tinyContent = Buffer.from([0x49, 0x44, 0x33]);
      const filepath = await createTestFile('tiny.mp3', tinyContent);

      const result = await scanFileContent(filepath);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('suspiciously small');
    });

    it('should detect executable patterns', async () => {
      const exeContent = Buffer.from([
        0x4d,
        0x5a, // MZ
        ...Buffer.alloc(58, 0x00),
        ...Buffer.from('This program cannot be run'),
      ]);
      const filepath = await createTestFile('malicious.mp3', exeContent);

      const result = await scanFileContent(filepath);
      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.includes('suspicious'))).toBe(true);
    });

    it('should detect script tags', async () => {
      const scriptContent = Buffer.concat([
        Buffer.from([0x49, 0x44, 0x33]),
        Buffer.from('<script>alert("xss")</script>'),
      ]);
      const filepath = await createTestFile('xss.mp3', scriptContent);

      const result = await scanFileContent(filepath);
      expect(result.safe).toBe(false);
    });
  });

  describe('validateFileSecurely - Integration', () => {
    it('should pass valid MP3 file through all checks', async () => {
      const validMp3 = Buffer.concat([
        Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00]),
        Buffer.alloc(1000, 0x00),
      ]);
      const filepath = await createTestFile('valid.mp3', validMp3);

      const result = await validateFileSecurely(filepath, 'audio/mpeg', 'valid.mp3');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file with wrong signature', async () => {
      const invalidFile = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const filepath = await createTestFile('invalid.mp3', invalidFile);

      const result = await validateFileSecurely(filepath, 'audio/mpeg', 'invalid.mp3');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject file with type mismatch', async () => {
      const mp3Header = Buffer.concat([
        Buffer.from([0x49, 0x44, 0x33, 0x04]),
        Buffer.alloc(1000, 0x00),
      ]);
      const filepath = await createTestFile('fake.wav', mp3Header);

      const result = await validateFileSecurely(filepath, 'audio/wav', 'fake.wav');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should reject file with malicious content', async () => {
      const maliciousContent = Buffer.from([
        0x49,
        0x44,
        0x33, // Valid MP3 header
        ...Buffer.from('eval(atob("malicious"))'),
      ]);
      const filepath = await createTestFile('malicious.mp3', maliciousContent);

      const result = await validateFileSecurely(filepath, 'audio/mpeg', 'malicious.mp3');
      expect(result.valid).toBe(false);
    });
  });
});
