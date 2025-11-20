# Changelog

All notable changes to Talk2Notes will be documented in this file.

## [2.2.0] - 2025-11-20

### 🆓 Free AI Provider Support

#### Added

- **Groq integration**: Free AI provider with generous tier (no credit card needed)
- **GROQ-SETUP.md**: Complete guide for setting up Groq
- Separate model configuration for transcription and summarization
- Support for `llama-3.3-70b-versatile` for note generation

#### Fixed

- Groq model configuration bug (was using Whisper model for summarization)
- Now uses proper models: `whisper-large-v3` for transcription, `llama-3.3-70b-versatile` for summarization

#### Changed

- Environment variables: `GROQ_MODEL` → `GROQ_TRANSCRIPTION_MODEL` + `GROQ_SUMMARIZATION_MODEL`
- Updated `.env.example` with correct Groq configuration

### 📚 Documentation Cleanup

#### Removed

- **QUICK-FIX.md**: Content merged into TROUBLESHOOTING.md
- **FFMPEG-FIX.md**: Content merged into TROUBLESHOOTING.md
- **PROGRESS-FEATURE.md**: Content moved to CHANGELOG.md

#### Changed

- **DOCS.md**: Updated index with streamlined structure
- **README.md**: Updated links to reflect new documentation structure
- Improved navigation and discoverability

## [2.1.0] - 2025-11-20

### 🎨 Enhanced User Experience - Progress Tracking

#### Added

- **Visual processing steps**: 6-step progress indicator with icons and animations
- **Detailed progress bar**: Percentage tracking with shimmer effects and mini-step indicators
- **Real-time status updates**: File size, operation details, and estimated completion time
- **Educational tips**: Rotating tips and best practices during processing (changes every 5s)
- **Smart time estimation**: Automatic ETA based on file size
- **Smooth progress simulation**: Realistic progress animation between actual milestones
- **Large file warning**: Info banner for files > 10MB explaining auto-compression
- **New components**:
  - `ProcessingSteps` - Step-by-step visual progress
  - `ProcessingTips` - Rotating educational content
  - Enhanced `ProgressIndicator` with details and time estimates

#### Changed

- **File size limits relaxed**: Audio files now accept up to 25MB (was 10MB hard reject)
- **Video size limit increased**: Videos now accept up to 500MB (was 200MB)
- **Smarter validation**: Files 10-25MB accepted with auto-compression notice
- **Better user feedback**: Warning banners instead of hard rejections for large files

#### Improved

- **Progress visibility**: Users see exactly what's happening at each stage
- **Wait time perception**: Estimated times and tips reduce anxiety
- **User education**: Tips teach optimization and best practices
- **Visual feedback**: Color-coded steps (gray → blue → green)
- **Animation polish**: Smooth transitions and GPU-accelerated effects
- **Flexibility**: Users can now upload larger files that will be auto-compressed

#### UX Enhancements

- Progress now shows: Validate → Upload → Extract → Compress → Transcribe → Generate
- Each step has descriptive details (e.g., "Converting video to audio format...")
- Compression step only shows for files > 10MB
- Extraction step only shows for video files
- Tips educate users on file optimization and features
- Blue info banner warns users about auto-compression for 10-25MB files

## [2.0.0] - 2025-11-20

### 🎯 Major Improvements - File Upload Reliability

#### Added

- **Auto-compression for large files**: Files over 10MB are automatically compressed to ~8MB for maximum reliability
- **Intelligent retry mechanism**: 3 retry attempts with exponential backoff (2s, 4s, 8s)
- **Adaptive bitrate encoding**: Video extraction uses 48-64kbps based on file size
- **Comprehensive logging**: Console logs show file sizes, compression status, and upload progress
- **New compression function**: `compressAudioIfNeeded()` in ffmpeg.ts

#### Changed

- **OpenAI timeout**: Increased from 5 to 10 minutes for large file uploads
- **File size limits**: Audio files now soft-limited to 10MB (was 25MB) for better reliability
- **Video size limits**: Videos limited to 200MB (approximately 25 minutes)
- **FFmpeg audio extraction**: Reduced bitrate from 64kbps to 48kbps for smaller outputs
- **Error messages**: More informative errors with file sizes and suggested solutions
- **Validation**: Stricter upfront validation prevents large files from starting processing

#### Fixed

- **ECONNRESET errors**: Fixed connection reset issues with files > 10MB
- **Upload timeouts**: Large file uploads now reliably complete
- **Memory issues**: Stream-based file handling instead of loading entire file to memory
- **Body size limit**: Properly configured in `experimental.serverActions` for Next.js 15

#### Technical Details

- Manual retry logic replaces OpenAI SDK auto-retry for better control
- Blob-based File objects for more reliable uploads
- File size checks at multiple stages: validation → extraction → transcription
- Auto-cleanup of compressed temporary files

### 📚 Documentation

- Added comprehensive `TROUBLESHOOTING.md` with common error solutions
- Updated `README.md` with link to troubleshooting guide
- Added this `CHANGELOG.md` for tracking changes
- Updated file size guidelines and recommendations

### 🔧 Configuration

- `next.config.js`: Moved serverActions to experimental block
- Environment variables: No changes required
- FFmpeg settings: Auto-configured based on file size

---

## [1.0.0] - 2025-11-19

### Initial Release

#### Features

- Audio and video file upload support
- AI transcription using OpenAI Whisper API
- Structured note generation with GPT
- Multi-provider support (OpenAI, Groq, Deepgram, Anthropic)
- FFmpeg integration for video-to-audio extraction
- Modern UI with Next.js 15 and React 19
- Export to JSON and Markdown
- File validation and size limits
- TypeScript for type safety

#### File Support

- Audio: MP3, WAV, M4A, AAC, OGG, FLAC
- Video: MP4, MKV, MOV, AVI, WEBM

#### Technical Stack

- Next.js 15 with App Router
- React 19 with Server Actions
- OpenAI API for transcription and summarization
- FFmpeg for media processing
- Tailwind CSS for styling
- TypeScript for type safety

---

## Release Notes Guidelines

### Version Numbers

- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (1.X.0)**: New features, no breaking changes
- **Patch (1.0.X)**: Bug fixes, small improvements

### Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
