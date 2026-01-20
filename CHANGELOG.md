# Changelog

All notable changes to Talk2Notes will be documented in this file.

## [2.6.0] - 2026-01-20

### Added

- 🧪 **Testing Infrastructure**: Comprehensive testing setup
  - Vitest testing framework with React Testing Library
  - 58 integration tests covering core functionality
  - File validation and security tests (magic bytes, integrity checks)
  - Rate limiter tests (request counting, window expiration)
  - AI configuration tests (provider setup, model selection)
  - History management tests (localStorage operations)
  - Test UI mode for interactive debugging
  - Code coverage reporting with v8
  - Complete testing guide (`TESTING.md`)
  - Test commands: `pnpm test`, `pnpm test:ui`, `pnpm test:coverage`

- 🛡️ **Error Boundaries**: Comprehensive error handling system
  - Page-level error boundary (`app/error.tsx`)
  - Root-level error boundary (`app/global-error.tsx`)
  - Reusable error boundary component (`components/error-boundary.tsx`)
  - Error boundaries in History and Upload/Display sections
  - Loading state component (`app/loading.tsx`)
  - Custom 404 page (`app/not-found.tsx`)
  - Error boundary test page (`/test-error-boundary`)
  - Complete documentation (`ERROR-BOUNDARY.md`)

- 🔒 **File Upload Security**: Magic bytes validation and content scanning
  - File signature validation (magic bytes) to detect file type spoofing
  - Content pattern scanning for malicious executables
  - Multi-layer security: MIME type, extension, size, signature, content
  - Comprehensive file integrity checks
  - Protection against renamed executables and tampered files
  - Complete test suite for security features
  - Documentation (`FILE-SECURITY.md`)
  - Supported formats: MP3, WAV, FLAC, OGG, M4A, MP4, MKV, MOV, AVI

### Improved

- App now gracefully handles errors without crashing
- User-friendly error messages in production
- Detailed error info for developers in dev mode
- Independent error recovery per section
- Better overall stability and reliability
- Enhanced file upload security with actual content validation
- Protection against file tampering and malicious uploads
- Automated testing for critical functionality

### Security

- Fixed file upload vulnerability (magic bytes validation)
- Added executable pattern detection
- Enhanced file type validation beyond MIME types
- All security features now have test coverage

### Developer Experience

- Easy-to-run test suite with watch mode
- Interactive test UI for debugging
- Comprehensive test documentation
- Improved confidence in code changes

## [2.5.0] - 2025-11-22

### 🛡️ Rate Limiting & Free Tier Protection

#### Added

- **Comprehensive Rate Limiting System**: Prevents abuse and ensures app stays within free tier limits
  - **Hourly limit**: 10 transcriptions per hour per IP address
  - **Daily limit**: 50 transcriptions per day per IP address
  - **File size limit**: Reduced to 50MB (from 100MB) for safer memory usage on 256MB RAM
  - **YouTube limit**: 100MB maximum for downloaded videos
- **Rate Limit Display**: Blue info box showing current usage
  - Real-time display of remaining hourly/daily quota
  - Shows "X / 10 files this hour" and "Y / 50 files today"
  - Automatic updates after each transcription
- **API Endpoint**: `/api/limits` for checking current rate limit status
  - Returns remaining requests and reset times
  - Useful for monitoring and debugging
- **Clear Error Messages**: User-friendly rate limit exceeded messages
  - Shows exact time until limit resets
  - Examples: "Try again in 45 minutes" or "Resets in 8 hours"

#### Technical

- New module: `lib/rate-limiter.ts` - Core rate limiting logic
  - In-memory rate limiter with automatic cleanup
  - Per-IP tracking using `x-forwarded-for` and `x-real-ip` headers
  - `RateLimiter` class with check/reset/status methods
  - Configurable limits via `RATE_LIMITS` constant
  - Cleanup interval runs every 5 minutes
- New API route: `app/api/limits/route.ts` - Rate limit status endpoint
- Updated `actions/transcription.ts`: Rate limit checks before processing
  - Hourly check with detailed error messages
  - Daily check for quota protection
  - Client ID extraction from request headers
- Updated `components/upload.tsx`: Rate limit display in UI
  - Fetches limits on component mount
  - Shows blue info box with current usage
  - Updates after successful transcription
- Updated `utils/validateFile.ts`: Integrated with rate limiter for file size limits
- New documentation: `RATE-LIMITS.md` - Complete rate limiting guide
  - Configuration instructions
  - Monitoring guidelines
  - Troubleshooting tips
  - Bypass options for development

#### Changed

- File size limit reduced from 100MB to 50MB for free tier safety
- Memory footprint optimized for 256MB RAM instances
- Automatic cleanup of expired rate limit entries

#### Security

- Per-IP rate limiting prevents API abuse
- Protects Groq free tier from exhaustion
- Prevents memory overflow on small instances
- Fair usage enforcement across all users

### 🚀 Deployment

- **Live Demo**: Deployed to Fly.io at https://talk2notes.fly.dev
- Production-ready with rate limiting enabled
- Running on free tier (256MB RAM, Singapore region)

## [2.4.0] - 2025-11-22

### 🗂️ History Management

#### Added

- **History Feature**: Automatic saving of all successful transcriptions to localStorage
  - Browse past transcriptions with "Show/Hide History" button
  - Maximum 50 history items stored locally
  - Individual delete functionality (hover to show trash icon)
  - Clear all history with confirmation dialog
  - One-click restore to view past notes
- **Smart History Display**:
  - Sorted by timestamp (most recent first)
  - Relative time display ("2 hours ago", "3 days ago")
  - Preview of summary for each item
  - Source indicators (YouTube icon vs File icon)
  - Language info (English/Indonesian flags)
  - Click any item to restore complete notes
- **Cross-tab Synchronization**: History updates automatically across browser tabs
- **Empty State**: Beautiful empty state with icon when no history exists

#### Technical

- New component: `components/history.tsx` - History list with delete functionality
- New utility: `utils/history.ts` - localStorage management functions
  - `getHistory()` - Load all history items
  - `saveToHistory()` - Save new transcription
  - `deleteFromHistory()` - Remove specific item
  - `clearHistory()` - Remove all items
  - `formatTimestamp()` - Format relative time
- New type: `HistoryItem` interface in `types/index.ts`
- Auto-save after successful transcription (file and YouTube)
- Storage events for cross-tab sync

#### Changed

- `app/page.tsx`: Added history toggle button and section
- `components/upload.tsx`: Auto-save to history after transcription completes

### 📚 Documentation Updates

#### Added

- **History Management section** in README.md with full feature list
- **Access History section** in QUICKSTART.md with step-by-step guide
- **History Management Flow** in ARCHITECTURE.md
- Updated PROJECT-STRUCTURE.md with new files and functions

#### Changed

- Features list updated with "History Management" feature
- All documentation synchronized with new history functionality

## [2.3.0] - 2025-11-20

### 🌍 Bilingual Support & Enhanced Display

#### Added

- **Language Selection**: Choose between English (🇬🇧) or Indonesian (🇮🇩) for notes generation
- **Transcript Translation**: Automatic translation to Bahasa Indonesia when selected
- **Islamic Content Handling**: Special preservation of Arabic text with harakat, transliteration, and translations
- **Full Transcript Tab**: New dedicated tab to view complete transcription
- **Transcript Download**: Separate TXT download button for transcript
- **Markdown Rendering**: Beautiful formatted display using `react-markdown` and `remark-gfm`
  - Support for bold, italic, lists, code blocks
  - Tailwind prose styling for professional typography
  - Applied across all tabs (Summary, Detailed Notes, Concepts, Definitions, Problems, Actions)

#### Changed

- Translation prompt optimized to output clean content without instructions preamble
- Enhanced UI for Problems tab with color-coded sections (blue/green/gray backgrounds)
- Improved Action Items display with flex layout for markdown content
- System message approach for translation instead of user prompt with rules

#### Technical

- Added dependencies: `react-markdown@9.x`, `remark-gfm`, `rehype-raw`
- New function: `translateTranscript()` in `lib/ai.ts`
- Extended types: `language?: 'english' | 'indonesian'` in `SummarizationOptions`
- Extended types: `transcript?: string` in `LectureNotes`

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
