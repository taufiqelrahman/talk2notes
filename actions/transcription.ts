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
import { transcribeAudio, summarizeTranscript, translateTranscript } from '@/lib/ai';
import { saveUploadedFile, cleanupUploadedFile } from '@/lib/upload';
import { promises as fs } from 'fs';

export async function createTranscriptionMutation(
  formData: FormData
): Promise<MutationResult<LectureNotes>> {
  try {
    const file = formData.get('file') as File | null;
    const youtubeUrl = formData.get('youtubeUrl') as string | null;
    const language = (formData.get('language') as 'english' | 'indonesian') || 'english';

    if (!file && !youtubeUrl) {
      return {
        success: false,
        error: 'No file or YouTube URL provided',
      };
    }

    // Handle YouTube URL
    if (youtubeUrl) {
      const { downloadYoutubeAudio, isValidYoutubeUrl } = await import('@/lib/youtube');

      if (!isValidYoutubeUrl(youtubeUrl)) {
        return {
          success: false,
          error: 'Invalid YouTube URL',
        };
      }

      let downloadedAudio: { audioPath: string; title: string } | null = null;
      let compressedAudio: string | null = null;

      try {
        downloadedAudio = await downloadYoutubeAudio(youtubeUrl);

        let audioPath = downloadedAudio.audioPath;
        const originalFilename = `${downloadedAudio.title}.mp3`;

        // Check file size and compress if needed (Groq limit is ~25MB)
        const stats = await fs.stat(audioPath);
        const fileSizeMB = stats.size / (1024 * 1024);

        console.log(`[YouTube] Downloaded audio size: ${fileSizeMB.toFixed(2)}MB`);

        if (fileSizeMB > 24) {
          console.log('[YouTube] Audio too large, compressing...');
          compressedAudio = await compressAudioIfNeeded(audioPath, 24);
          audioPath = compressedAudio;

          const newStats = await fs.stat(audioPath);
          const newSizeMB = newStats.size / (1024 * 1024);
          console.log(`[YouTube] Compressed audio size: ${newSizeMB.toFixed(2)}MB`);
        }

        // Transcribe
        const transcriptionResult = await transcribeAudio(audioPath, {
          language: language === 'indonesian' ? 'id' : 'en',
        });

        // Translate if Indonesian
        let transcriptText = transcriptionResult.text;
        if (language === 'indonesian') {
          transcriptText = await translateTranscript(transcriptText, 'indonesian');
        }

        // Format transcript with paragraphs and sections
        const { formatTranscript } = await import('@/lib/ai');
        const formattedTranscript = await formatTranscript(transcriptText, language);

        // Summarize
        const lectureNotes = await summarizeTranscript(transcriptText, originalFilename, {
          language,
          detailLevel: 'detailed',
        });

        // Cleanup
        await cleanupUploadedFile(downloadedAudio.audioPath);
        if (compressedAudio && compressedAudio !== downloadedAudio.audioPath) {
          await cleanupUploadedFile(compressedAudio);
        }

        return {
          success: true,
          data: {
            ...lectureNotes,
            transcript: formattedTranscript,
          },
        };
      } catch (error) {
        // Cleanup on error
        if (downloadedAudio?.audioPath) {
          await cleanupUploadedFile(downloadedAudio.audioPath).catch(() => {});
        }
        if (compressedAudio && compressedAudio !== downloadedAudio?.audioPath) {
          await cleanupUploadedFile(compressedAudio).catch(() => {});
        }
        throw error;
      }
    }

    // Handle regular file upload
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

    // Translate transcript if Indonesian is selected
    let finalTranscript = transcriptionResult.text;
    if (language === 'indonesian') {
      console.log('[Transcription] Translating transcript to Indonesian...');
      finalTranscript = await translateTranscript(transcriptionResult.text, 'indonesian');
    }

    // Format transcript with paragraphs and sections
    const { formatTranscript } = await import('@/lib/ai');
    console.log('[Transcription] Formatting transcript with paragraphs and sections...');
    const formattedTranscript = await formatTranscript(finalTranscript, language);

    const lectureNotes = await summarizeTranscript(finalTranscript, uploadedFile.originalFilename, {
      detailLevel: 'detailed',
      language: language,
    });

    // Add full transcript to the response (already formatted)
    const notesWithTranscript = {
      ...lectureNotes,
      transcript: formattedTranscript,
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
