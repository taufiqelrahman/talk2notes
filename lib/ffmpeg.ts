import { promises as fs } from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import type { TranscriptionSegment } from '@/types';

const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE_PATH = process.env.FFPROBE_PATH || 'ffprobe';

ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

export interface AudioExtractionResult {
  audioPath: string;
  duration: number;
  format: string;
}

export async function extractAudioFromVideo(
  videoPath: string,
  outputDir: string = '/tmp'
): Promise<AudioExtractionResult> {
  const outputFilename = `${Date.now()}_extracted_audio.mp3`;
  const outputPath = path.join(outputDir, outputFilename);

  await fs.mkdir(outputDir, { recursive: true });

  // Check video file size to determine optimal bitrate
  const videoStats = await fs.stat(videoPath);
  const videoSizeMB = videoStats.size / (1024 * 1024);

  // Use lower bitrate for larger videos to stay under 10MB (safer for OpenAI)
  // Target: ~10MB max audio output
  let bitrate = 48; // Very conservative default

  if (videoSizeMB < 100) {
    bitrate = 64; // For smaller videos
  }

  console.log(
    `[FFmpeg] Video size: ${videoSizeMB.toFixed(2)}MB, using ${bitrate}kbps audio bitrate`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .toFormat('mp3')
      .audioBitrate(bitrate)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('libmp3lame')
      .on('start', (cmd) => {
        console.log(`[FFmpeg] Starting extraction: ${cmd}`);
      })
      .on('end', async () => {
        try {
          const duration = await getAudioDuration(outputPath);

          // Check if output file is within safe limits
          const stats = await fs.stat(outputPath);
          const fileSizeMB = stats.size / (1024 * 1024);

          console.log(
            `[FFmpeg] Extracted audio: ${fileSizeMB.toFixed(2)}MB, duration: ${duration.toFixed(2)}s`
          );

          // Reject if > 25MB (OpenAI limit)
          if (fileSizeMB > 25) {
            await fs.unlink(outputPath).catch(() => {});
            reject(
              new Error(
                `Extracted audio is ${fileSizeMB.toFixed(2)}MB, exceeds 25MB limit. ` +
                  `Please use a shorter video.`
              )
            );
            return;
          }

          // Warn if > 10MB (less reliable)
          if (fileSizeMB > 10) {
            console.warn(
              `[FFmpeg] Warning: Audio file is ${fileSizeMB.toFixed(2)}MB, may cause upload issues`
            );
          }

          resolve({
            audioPath: outputPath,
            duration,
            format: 'mp3',
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg extraction failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe audio file: ${err.message}`));
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
}

export async function convertAudioFormat(
  inputPath: string,
  outputFormat: string = 'mp3',
  outputDir: string = '/tmp'
): Promise<string> {
  const outputFilename = `${Date.now()}_converted.${outputFormat}`;
  const outputPath = path.join(outputDir, outputFilename);

  await fs.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat(outputFormat)
      .audioBitrate(48) // Lower bitrate for smaller files
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('libmp3lame')
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Audio conversion failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

/**
 * Compress audio file to target size if needed
 * Attempts to create a file under targetSizeMB
 */
export async function compressAudioIfNeeded(
  inputPath: string,
  targetSizeMB: number = 10,
  outputDir: string = '/tmp'
): Promise<string> {
  const stats = await fs.stat(inputPath);
  const currentSizeMB = stats.size / (1024 * 1024);

  console.log(`[Compress] Current size: ${currentSizeMB.toFixed(2)}MB, target: ${targetSizeMB}MB`);

  // If already under target, return original
  if (currentSizeMB <= targetSizeMB) {
    console.log(`[Compress] File already within target size`);
    return inputPath;
  }

  const outputFilename = `${Date.now()}_compressed.mp3`;
  const outputPath = path.join(outputDir, outputFilename);

  await fs.mkdir(outputDir, { recursive: true });

  // Calculate required bitrate to reach target size
  const duration = await getAudioDuration(inputPath);
  const targetBitrate = Math.floor((targetSizeMB * 8192) / duration);
  const bitrate = Math.max(32, Math.min(targetBitrate, 64)); // Between 32-64 kbps

  console.log(`[Compress] Compressing with ${bitrate}kbps (duration: ${duration.toFixed(2)}s)`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioBitrate(bitrate)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('libmp3lame')
      .on('end', async () => {
        const newStats = await fs.stat(outputPath);
        const newSizeMB = newStats.size / (1024 * 1024);
        console.log(`[Compress] Compressed to ${newSizeMB.toFixed(2)}MB`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Audio compression failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to cleanup temp file ${filePath}:`, error);
  }
}

export async function getAudioMetadata(filePath: string): Promise<{
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get audio metadata: ${err.message}`));
      } else {
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
        resolve({
          duration: metadata.format.duration || 0,
          bitrate: metadata.format.bit_rate || 0,
          sampleRate: audioStream?.sample_rate || 0,
          channels: audioStream?.channels || 0,
        });
      }
    });
  });
}
