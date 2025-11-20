import { z } from 'zod';
import type { FileValidationResult } from '@/types';

const AUDIO_FORMATS = process.env.ALLOWED_AUDIO_FORMATS?.split(',') || [
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'flac',
];

const VIDEO_FORMATS = process.env.ALLOWED_VIDEO_FORMATS?.split(',') || [
  'mp4',
  'mkv',
  'mov',
  'avi',
  'webm',
];

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10) * 1024 * 1024;

const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
];

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/x-matroska',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
];

export const FileSchema = z.object({
  filepath: z.string(),
  originalFilename: z.string(),
  mimetype: z.string(),
  size: z
    .number()
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
});

export function validateFile(
  mimetype: string,
  size: number,
  filename: string
): FileValidationResult {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  const extension = filename.split('.').pop()?.toLowerCase();

  if (!extension) {
    return {
      valid: false,
      error: 'File must have a valid extension',
    };
  }

  const isAudio = AUDIO_FORMATS.includes(extension) && AUDIO_MIME_TYPES.includes(mimetype);
  const isVideo = VIDEO_FORMATS.includes(extension) && VIDEO_MIME_TYPES.includes(mimetype);

  if (!isAudio && !isVideo) {
    return {
      valid: false,
      error: `Invalid file format. Allowed formats: ${[...AUDIO_FORMATS, ...VIDEO_FORMATS].join(', ')}`,
    };
  }

  // For audio files, check against OpenAI's 25MB hard limit
  // Files > 10MB will be auto-compressed during processing
  if (isAudio) {
    const sizeMB = size / (1024 * 1024);
    if (sizeMB > 25) {
      return {
        valid: false,
        error:
          `Audio file is ${sizeMB.toFixed(2)}MB, exceeding OpenAI Whisper's 25MB limit. ` +
          `Please compress: ffmpeg -i input.mp3 -ar 16000 -ac 1 -b:a 48k output.mp3`,
      };
    }
    // Note: Files 10-25MB will be automatically compressed to ~8MB during processing
  }

  // For video files, estimate audio size and enforce reasonable limits
  if (isVideo) {
    const videoSizeMB = size / (1024 * 1024);
    // Allow larger videos since we extract and compress audio efficiently
    if (videoSizeMB > 500) {
      return {
        valid: false,
        error:
          `Video file is ${videoSizeMB.toFixed(2)}MB. Please use videos under 500MB. ` +
          `For longer videos, consider splitting or extracting audio first.`,
      };
    }
  }

  return {
    valid: true,
    fileType: isAudio ? 'audio' : 'video',
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}
