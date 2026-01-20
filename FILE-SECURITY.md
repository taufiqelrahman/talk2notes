# File Upload Security

This document describes the comprehensive file upload security implementation in Talk2Notes.

## Overview

File upload security uses a multi-layered approach to validate and sanitize uploaded files, protecting against malicious content and file tampering.

## Security Layers

### Layer 1: MIME Type Validation

**Location**: `utils/validateFile.ts`

Basic validation that checks if the uploaded file's MIME type matches allowed audio/video formats.

- Allowed audio MIME types: `audio/mpeg`, `audio/wav`, `audio/m4a`, etc.
- Allowed video MIME types: `video/mp4`, `video/quicktime`, `video/x-matroska`, etc.

**Limitation**: MIME types can be easily spoofed by attackers.

### Layer 2: File Extension Validation

**Location**: `utils/validateFile.ts`

Validates that the file extension matches the expected format.

- Allowed extensions: `.mp3`, `.wav`, `.m4a`, `.mp4`, `.mkv`, `.mov`, etc.

**Limitation**: Extensions can be renamed by users.

### Layer 3: File Size Limits

**Location**: `utils/validateFile.ts`

Enforces strict file size limits to prevent DoS attacks and resource exhaustion.

- Audio files: Max 25MB (OpenAI Whisper limit)
- Video files: Max 500MB
- Auto-compression for files > 10MB

### Layer 4: Magic Bytes Validation (File Signature)

**Location**: `lib/file-security.ts`

**This is the critical security layer** that validates actual file content by reading the file's binary signature (magic bytes).

#### How It Works

1. **Read File Header**: Opens the file and reads the first 12 bytes
2. **Signature Matching**: Compares bytes against known audio/video signatures
3. **Type Detection**: Returns the actual file type based on content

#### Supported Signatures

**Audio Formats**:

```
MP3:  FF FB (MPEG-1 Layer 3)
      FF F3 (MPEG-1 Layer 3)
      49 44 33 (ID3v2 tag)
WAV:  52 49 46 46 (RIFF)
FLAC: 66 4C 61 43 (fLaC)
OGG:  4F 67 67 53 (OggS)
M4A:  66 74 79 70 4D 34 41 (ftypM4A at offset 4)
```

**Video Formats**:

```
MP4:  66 74 79 70 69 73 6F 6D (ftypisom at offset 4)
MKV:  1A 45 DF A3 (Matroska)
MOV:  66 74 79 70 71 74 (ftypqt at offset 4)
AVI:  52 49 46 46 (RIFF)
```

#### Protection Against

- ✅ File extension spoofing (e.g., `.exe` renamed to `.mp3`)
- ✅ MIME type manipulation
- ✅ Malicious executable files disguised as media
- ✅ Corrupted or tampered files

### Layer 5: Content Scanning

**Location**: `lib/file-security.ts`

Scans file content for suspicious patterns that shouldn't appear in audio/video files.

#### Detected Patterns

- Executable headers (PE, ELF)
- Shell scripts (`#!/bin`)
- Script tags (`<script>`)
- JavaScript `eval()`
- PHP `base64_decode`
- Windows commands (`cmd.exe`, `powershell`)

#### File Integrity Check

Validates that the detected file type matches the claimed MIME type and extension.

**Example**:

- File claims: `.mp3` / `audio/mpeg`
- Actual content: MP4 video
- Result: ❌ Rejected (type mismatch)

## Implementation

### File Upload Flow

```typescript
// 1. User uploads file
const file = await saveUploadedFile(uploadedFile);

// 2. Basic validation (MIME, extension, size)
const validation = validateFile(file.type, file.size, file.name);

// 3. Security validation (magic bytes + content scan)
const securityCheck = await validateFileSecurely(file.filepath, file.type, file.name);

// 4. If validation fails, delete file and reject
if (!securityCheck.valid) {
  await cleanupUploadedFile(file.filepath);
  throw new Error(securityCheck.error);
}

// 5. File is safe to process
```

### API Usage

#### Validate File Signature

```typescript
import { validateFileSignature } from '@/lib/file-security';

const result = await validateFileSignature('/path/to/file.mp3');

if (result.valid) {
  console.log(`Detected: ${result.detectedType} (${result.detectedMime})`);
} else {
  console.error(result.error);
}
```

#### Validate File Integrity

```typescript
import { validateFileIntegrity } from '@/lib/file-security';

const result = await validateFileIntegrity(
  '/path/to/file.mp3',
  'audio/mpeg', // claimed MIME
  'mp3' // claimed extension
);

if (!result.valid) {
  console.error('File tampering detected:', result.error);
}
```

#### Comprehensive Security Check

```typescript
import { validateFileSecurely } from '@/lib/file-security';

const result = await validateFileSecurely(filepath, mimeType, filename);

if (!result.valid) {
  throw new Error(result.error);
}

if (result.warnings) {
  console.warn('Security warnings:', result.warnings);
}
```

## Security Benefits

### Before (Vulnerable)

```typescript
// Only checking MIME type and extension
// ❌ Attacker can rename virus.exe to virus.mp3
// ❌ File upload succeeds
// ❌ Server processes malicious file
```

### After (Secure)

```typescript
// Checking actual file content with magic bytes
// ✅ File claims to be MP3
// ✅ Read first bytes: 4D 5A (EXE header)
// ✅ Signature mismatch detected
// ✅ File deleted immediately
// ✅ Upload rejected with clear error
```

## Testing

Run the test suite to verify magic bytes validation:

```bash
# Install tsx if not available
pnpm add -D tsx

# Run tests
npx tsx lib/__tests__/file-security.test.ts
```

### Test Cases

1. ✅ Valid MP3 file (ID3v2 header)
2. ✅ Valid WAV file (RIFF header)
3. ✅ Invalid file (random bytes)
4. ✅ Type mismatch (MP3 bytes with .wav extension)
5. ✅ Suspicious content (executable pattern)

## Error Messages

### File Signature Mismatch

```
File signature does not match any supported audio/video format
```

**Cause**: File content doesn't match known audio/video signatures.

### File Content Mismatch

```
File content mismatch: File appears to be exe (application/x-msdownload)
but claimed as mp3 (audio/mpeg). Possible file tampering or corruption.
```

**Cause**: Actual file type differs from claimed type.

### Security Scan Failed

```
File failed security scan: File contains suspicious executable patterns
```

**Cause**: File contains patterns commonly found in malicious files.

## Performance Impact

- **Minimal**: Only reads first 12 bytes for signature validation
- **Fast**: Signature check takes < 1ms
- **Async**: Non-blocking file operations
- **Memory efficient**: Small buffer for header reading

## Limitations

### Not a Virus Scanner

This implementation does NOT replace antivirus software. It:

- ✅ Detects file type mismatches
- ✅ Identifies obvious malicious patterns
- ❌ Does NOT detect all viruses/malware
- ❌ Does NOT perform deep content analysis

### Recommended for Production

For production deployments, consider:

1. **ClamAV Integration**: Add virus scanning
2. **Sandboxed Processing**: Process files in isolated environment
3. **Cloud Security Services**: AWS GuardDuty, VirusTotal API
4. **Rate Limiting**: Prevent abuse (already implemented)
5. **File Quarantine**: Temporary isolation before processing

## Files

- `lib/file-security.ts` - Core security validation logic
- `utils/validateFile.ts` - Basic file validation
- `lib/upload.ts` - File upload handler with security integration
- `lib/__tests__/file-security.test.ts` - Test suite

## References

- [List of File Signatures (Wikipedia)](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [OWASP File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [Magic Bytes Reference](https://www.garykessler.net/library/file_sigs.html)

## Changelog

**v2.5.0** - Added magic bytes validation and content scanning

- Implemented file signature validation
- Added content pattern scanning
- Enhanced upload security with multi-layer validation
- Created comprehensive test suite
