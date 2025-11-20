import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import type { TranscriptionSegment } from '@/types';

// Auto-detect FFmpeg and FFprobe paths with runtime verification
function detectBinaryPath(binaryName: string): string {
  console.log(`[FFmpeg] Detecting ${binaryName}...`);

  // Try common installation locations directly first (faster)
  const commonPaths = [
    `/opt/homebrew/bin/${binaryName}`, // M1/M2 Mac (Homebrew)
    `/usr/local/bin/${binaryName}`, // Intel Mac (Homebrew)
    `/usr/bin/${binaryName}`, // Linux
    `/opt/local/bin/${binaryName}`, // MacPorts
  ];

  for (const testPath of commonPaths) {
    try {
      // Simple existence check - don't verify at module load
      const result = execSync(`test -f "${testPath}" && echo "exists"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (result === 'exists') {
        console.log(`[FFmpeg] Found ${binaryName} at: ${testPath}`);
        return testPath;
      }
    } catch (error) {
      // This path doesn't exist, try next
    }
  }

  // Try 'which' command as fallback
  try {
    const result = execSync(`which ${binaryName}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    if (result && result.length > 0) {
      console.log(`[FFmpeg] Found ${binaryName} via 'which': ${result}`);
      return result;
    }
  } catch (error) {
    console.log(`[FFmpeg] 'which' command failed for ${binaryName}`);
  }

  // Last resort: just use the binary name (rely on PATH at runtime)
  console.warn(`[FFmpeg] Using binary name as fallback: ${binaryName}`);
  return binaryName;
}

const FFMPEG_PATH = process.env.FFMPEG_PATH || detectBinaryPath('ffmpeg');
const FFPROBE_PATH = process.env.FFPROBE_PATH || detectBinaryPath('ffprobe');

console.log(`[FFmpeg] Configured paths:`, { FFMPEG_PATH, FFPROBE_PATH });

// Set paths for fluent-ffmpeg
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

// Runtime validation - checks every time it's called
function validateFFmpegInstallation(): { isValid: boolean; details: string } {
  const errors: string[] = [];

  // Test FFmpeg
  try {
    execSync(`"${FFMPEG_PATH}" -version`, { stdio: 'ignore', timeout: 5000 });
    console.log(`[FFmpeg] ✓ ffmpeg is working (${FFMPEG_PATH})`);
  } catch (error: any) {
    const errorMsg = `ffmpeg not executable at: ${FFMPEG_PATH}`;
    console.error(`[FFmpeg] ${errorMsg}`, error.message);
    errors.push(errorMsg);

    // Try alternative paths
    const alternatives = [
      '/opt/homebrew/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      '/usr/bin/ffmpeg',
    ].filter((p) => p !== FFMPEG_PATH);

    errors.push(`Tried: ${FFMPEG_PATH}`);
    errors.push(`Try setting FFMPEG_PATH in .env.local to one of: ${alternatives.join(', ')}`);
  }

  // Test FFprobe
  try {
    execSync(`"${FFPROBE_PATH}" -version`, { stdio: 'ignore', timeout: 5000 });
    console.log(`[FFmpeg] ✓ ffprobe is working (${FFPROBE_PATH})`);
  } catch (error: any) {
    const errorMsg = `ffprobe not executable at: ${FFPROBE_PATH}`;
    console.error(`[FFmpeg] ${errorMsg}`, error.message);
    errors.push(errorMsg);

    // Try alternative paths
    const alternatives = [
      '/opt/homebrew/bin/ffprobe',
      '/usr/local/bin/ffprobe',
      '/usr/bin/ffprobe',
    ].filter((p) => p !== FFPROBE_PATH);

    errors.push(`Tried: ${FFPROBE_PATH}`);
    errors.push(`Try setting FFPROBE_PATH in .env.local to one of: ${alternatives.join(', ')}`);
  }

  if (errors.length > 0) {
    const details =
      `FFmpeg not available:\n\n${errors.join('\n')}\n\n` +
      `Quick fix:\n` +
      `1. Install: brew install ffmpeg\n` +
      `2. Find paths: which ffmpeg && which ffprobe\n` +
      `3. Create .env.local with:\n` +
      `   FFMPEG_PATH=/your/actual/path/to/ffmpeg\n` +
      `   FFPROBE_PATH=/your/actual/path/to/ffprobe\n` +
      `4. Restart the dev server`;

    return { isValid: false, details };
  }

  return { isValid: true, details: 'FFmpeg is available and working' };
}

// Export validation functions (no pre-validation at module load)
export function checkFFmpegAvailable(): boolean {
  try {
    const result = validateFFmpegInstallation();
    return result.isValid;
  } catch (error) {
    console.error('[FFmpeg] Validation error:', error);
    return false;
  }
}

export function getFFmpegValidationDetails(): string {
  try {
    const result = validateFFmpegInstallation();
    return result.details;
  } catch (error: any) {
    return `FFmpeg validation error: ${error.message}`;
  }
}

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
        // Check if it's a binary not found error
        if (err.message && (err.message.includes('ENOENT') || err.message.includes('spawn'))) {
          reject(
            new Error(
              `FFprobe binary not found. Please install FFmpeg:\n` +
                `  macOS: brew install ffmpeg\n` +
                `  Ubuntu: sudo apt install ffmpeg\n` +
                `  Windows: Download from https://ffmpeg.org/download.html\n` +
                `Current ffprobe path: ${FFPROBE_PATH}`
            )
          );
        } else {
          reject(new Error(`Failed to probe audio file: ${err.message}`));
        }
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
