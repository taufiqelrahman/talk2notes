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

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .toFormat('mp3')
      .audioBitrate(128)
      .audioChannels(1)
      .audioFrequency(16000)
      .on('end', async () => {
        try {
          const duration = await getAudioDuration(outputPath);
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
      .audioBitrate(128)
      .audioChannels(1)
      .audioFrequency(16000)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Audio conversion failed: ${err.message}`));
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
