import { promises as fs } from 'fs';

/**
 * File signature validation using magic bytes
 * This provides an additional layer of security by verifying actual file content
 * instead of just trusting MIME types and extensions
 */

interface FileSignature {
  bytes: number[];
  offset: number;
  extension: string;
  mimeType: string;
}

/**
 * Known file signatures (magic bytes) for audio and video formats
 * Reference: https://en.wikipedia.org/wiki/List_of_file_signatures
 */
const FILE_SIGNATURES: FileSignature[] = [
  // Audio formats
  {
    bytes: [0xff, 0xfb], // MP3 with MPEG-1 Layer 3
    offset: 0,
    extension: 'mp3',
    mimeType: 'audio/mpeg',
  },
  {
    bytes: [0xff, 0xf3], // MP3 with MPEG-1 Layer 3
    offset: 0,
    extension: 'mp3',
    mimeType: 'audio/mpeg',
  },
  {
    bytes: [0xff, 0xf2], // MP3 with MPEG-2 Layer 3
    offset: 0,
    extension: 'mp3',
    mimeType: 'audio/mpeg',
  },
  {
    bytes: [0x49, 0x44, 0x33], // MP3 with ID3v2 tag (ID3)
    offset: 0,
    extension: 'mp3',
    mimeType: 'audio/mpeg',
  },
  {
    bytes: [0x52, 0x49, 0x46, 0x46], // WAV (RIFF)
    offset: 0,
    extension: 'wav',
    mimeType: 'audio/wav',
  },
  {
    bytes: [0x66, 0x4c, 0x61, 0x43], // FLAC (fLaC)
    offset: 0,
    extension: 'flac',
    mimeType: 'audio/flac',
  },
  {
    bytes: [0x4f, 0x67, 0x67, 0x53], // OGG (OggS)
    offset: 0,
    extension: 'ogg',
    mimeType: 'audio/ogg',
  },
  {
    bytes: [0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41], // M4A (ftypM4A)
    offset: 4,
    extension: 'm4a',
    mimeType: 'audio/m4a',
  },

  // Video formats
  {
    bytes: [0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d], // MP4 (ftypisom)
    offset: 4,
    extension: 'mp4',
    mimeType: 'video/mp4',
  },
  {
    bytes: [0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32], // MP4 (ftypmp42)
    offset: 4,
    extension: 'mp4',
    mimeType: 'video/mp4',
  },
  {
    bytes: [0x1a, 0x45, 0xdf, 0xa3], // MKV/WebM (Matroska)
    offset: 0,
    extension: 'mkv',
    mimeType: 'video/x-matroska',
  },
  {
    bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // MOV (ftypqt)
    offset: 4,
    extension: 'mov',
    mimeType: 'video/quicktime',
  },
  {
    bytes: [0x52, 0x49, 0x46, 0x46], // AVI (RIFF...AVI)
    offset: 0,
    extension: 'avi',
    mimeType: 'video/x-msvideo',
  },
];

/**
 * Read the first N bytes of a file for signature validation
 */
async function readFileHeader(filepath: string, bytesToRead: number = 12): Promise<Buffer> {
  const fileHandle = await fs.open(filepath, 'r');
  try {
    const buffer = Buffer.alloc(bytesToRead);
    await fileHandle.read(buffer, 0, bytesToRead, 0);
    return buffer;
  } finally {
    await fileHandle.close();
  }
}

/**
 * Check if buffer matches a signature at given offset
 */
function matchesSignature(buffer: Buffer, signature: FileSignature): boolean {
  const { bytes, offset } = signature;

  if (buffer.length < offset + bytes.length) {
    return false;
  }

  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

/**
 * Validate file signature against known audio/video formats
 */
export async function validateFileSignature(
  filepath: string
): Promise<{ valid: boolean; detectedType?: string; detectedMime?: string; error?: string }> {
  try {
    // Read first 12 bytes (enough for most signatures)
    const header = await readFileHeader(filepath, 12);

    // Check against all known signatures
    for (const signature of FILE_SIGNATURES) {
      if (matchesSignature(header, signature)) {
        return {
          valid: true,
          detectedType: signature.extension,
          detectedMime: signature.mimeType,
        };
      }
    }

    // No matching signature found
    return {
      valid: false,
      error: 'File signature does not match any supported audio/video format',
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read file signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate that file signature matches claimed MIME type and extension
 */
export async function validateFileIntegrity(
  filepath: string,
  claimedMimeType: string,
  claimedExtension: string
): Promise<{ valid: boolean; warning?: string; error?: string }> {
  const signatureCheck = await validateFileSignature(filepath);

  if (!signatureCheck.valid) {
    return {
      valid: false,
      error: signatureCheck.error || 'Invalid file signature',
    };
  }

  const { detectedType, detectedMime } = signatureCheck;

  // Check if detected type matches claimed extension
  const extensionMatch = detectedType === claimedExtension.toLowerCase();

  // Check if detected MIME matches claimed MIME (with some flexibility)
  const mimeMatch =
    detectedMime === claimedMimeType ||
    // Allow some common MIME variations
    (detectedType === 'mp3' && claimedMimeType === 'audio/mp3') ||
    (detectedType === 'wav' && claimedMimeType.includes('wav')) ||
    (detectedType === 'm4a' && claimedMimeType.includes('m4a'));

  if (!extensionMatch || !mimeMatch) {
    return {
      valid: false,
      error: `File content mismatch: File appears to be ${detectedType} (${detectedMime}) but claimed as ${claimedExtension} (${claimedMimeType}). Possible file tampering or corruption.`,
    };
  }

  return {
    valid: true,
  };
}

/**
 * Scan file for suspicious patterns
 * Basic content scanning for common malicious patterns
 */
export async function scanFileContent(filepath: string): Promise<{
  safe: boolean;
  warnings: string[];
}> {
  const warnings: string[] = [];

  try {
    const stats = await fs.stat(filepath);

    // Check for suspiciously small files
    if (stats.size < 100) {
      warnings.push('File is suspiciously small (< 100 bytes)');
    }

    // Read first 1KB for pattern scanning
    const header = await readFileHeader(filepath, 1024);
    const headerStr = header.toString('utf-8', 0, Math.min(1024, header.length));

    // Check for executable patterns (should not be in audio/video)
    const suspiciousPatterns = [
      /MZ.{58}This program/i, // PE executable
      /\x7fELF/i, // ELF executable
      /#!\/bin/i, // Shell script
      /<script/i, // HTML/JS script tags
      /eval\(/i, // JavaScript eval
      /base64_decode/i, // PHP decode
      /cmd\.exe/i, // Windows command
      /powershell/i, // PowerShell
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(headerStr)) {
        warnings.push('File contains suspicious executable patterns');
        break;
      }
    }

    // File is considered safe if no critical warnings
    const safe = warnings.length === 0;

    return { safe, warnings };
  } catch (error) {
    return {
      safe: false,
      warnings: [
        `Failed to scan file content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Comprehensive file security validation
 * Combines signature validation, integrity check, and content scanning
 */
export async function validateFileSecurely(
  filepath: string,
  claimedMimeType: string,
  filename: string
): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  // Step 1: Validate file signature
  const signatureCheck = await validateFileSignature(filepath);
  if (!signatureCheck.valid) {
    return {
      valid: false,
      error: signatureCheck.error || 'Invalid file signature',
    };
  }

  // Step 2: Validate file integrity (signature matches claimed type)
  const integrityCheck = await validateFileIntegrity(filepath, claimedMimeType, extension);
  if (!integrityCheck.valid) {
    return {
      valid: false,
      error: integrityCheck.error,
    };
  }

  // Step 3: Scan for suspicious content
  const contentScan = await scanFileContent(filepath);
  if (!contentScan.safe) {
    return {
      valid: false,
      error: 'File failed security scan: ' + contentScan.warnings.join(', '),
    };
  }

  // All checks passed
  return {
    valid: true,
    warnings: contentScan.warnings.length > 0 ? contentScan.warnings : undefined,
  };
}
