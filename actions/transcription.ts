'use server';

import { revalidatePath } from 'next/cache';
import type { MutationResult, LectureNotes, UploadedFile, ProcessingState } from '@/types';
import { validateFile } from '@/utils/validateFile';
import {
  extractAudioFromVideo,
  cleanupTempFile,
  compressAudioIfNeeded,
  checkFFmpegAvailable,
  getFFmpegValidationDetails,
} from '@/lib/ffmpeg';
import { transcribeAudio, summarizeTranscript } from '@/lib/ai';
import { saveUploadedFile, cleanupUploadedFile } from '@/lib/upload';
import { promises as fs } from 'fs';

export async function createTranscriptionMutation(
  formData: FormData
): Promise<MutationResult<LectureNotes>> {
  try {
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as 'english' | 'indonesian') || 'english';

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    const validation = validateFile(file.type, file.size, file.name);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Check FFmpeg availability for video files
    if (validation.fileType === 'video' && !checkFFmpegAvailable()) {
      return {
        success: false,
        error: getFFmpegValidationDetails(),
      };
    }

    const uploadedFile = await saveUploadedFile(file);

    let audioPath = uploadedFile.filepath;
    let tempAudioPath: string | null = null;
    let compressedAudioPath: string | null = null;

    if (validation.fileType === 'video') {
      const extractionResult = await extractAudioFromVideo(uploadedFile.filepath);
      tempAudioPath = extractionResult.audioPath;
      audioPath = tempAudioPath;
    }

    // Check if audio needs compression before transcription
    const stats = await fs.stat(audioPath);
    const sizeMB = stats.size / (1024 * 1024);

    console.log(`[Transcription] Audio file size: ${sizeMB.toFixed(2)}MB`);

    // Auto-compress if file > 10MB for better reliability
    if (sizeMB > 10) {
      console.log(`[Transcription] File > 10MB, compressing for better reliability...`);
      compressedAudioPath = await compressAudioIfNeeded(audioPath, 8); // Target 8MB

      // Use compressed version for transcription
      audioPath = compressedAudioPath;

      const newStats = await fs.stat(audioPath);
      const newSizeMB = newStats.size / (1024 * 1024);
      console.log(`[Transcription] Using compressed audio: ${newSizeMB.toFixed(2)}MB`);
    }

    const transcriptionResult = await transcribeAudio(audioPath, {
      language: 'en',
      temperature: 0,
    });

    const lectureNotes = await summarizeTranscript(
      transcriptionResult.text,
      uploadedFile.originalFilename,
      {
        detailLevel: 'detailed',
        language: language,
      }
    );

    // Add full transcript to the response
    const notesWithTranscript = {
      ...lectureNotes,
      transcript: transcriptionResult.text,
    };

    // Cleanup temporary files
    if (compressedAudioPath) {
      await cleanupTempFile(compressedAudioPath);
    }
    if (tempAudioPath) {
      await cleanupTempFile(tempAudioPath);
    }
    await cleanupUploadedFile(uploadedFile.filepath);

    revalidatePath('/');

    return {
      success: true,
      data: notesWithTranscript,
    };
  } catch (error) {
    console.error('Transcription mutation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function validateFileMutation(
  formData: FormData
): Promise<MutationResult<{ fileType: string; size: number }>> {
  try {
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    const validation = validateFile(file.type, file.size, file.name);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    return {
      success: true,
      data: {
        fileType: validation.fileType || 'unknown',
        size: file.size,
      },
    };
  } catch (error) {
    console.error('File validation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getProcessingStatusAction(
  processingId: string
): Promise<MutationResult<ProcessingState>> {
  return {
    success: true,
    data: {
      step: 'complete',
      progress: 100,
      message: 'Processing complete',
    },
  };
}

export async function cleanupFilesAction(filePaths: string[]): Promise<MutationResult<void>> {
  try {
    await Promise.all(filePaths.map((path) => cleanupUploadedFile(path)));

    return {
      success: true,
    };
  } catch (error) {
    console.error('Cleanup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    };
  }
}
