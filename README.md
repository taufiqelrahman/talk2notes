# Talk2Notes 🎙️📝

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Transform audio and video lectures into structured, comprehensive notes using AI

Talk2Notes is an open-source web application that automatically transcribes audio and video files and generates well-organized lecture notes complete with summaries, key concepts, definitions, example problems, and action items.

🌐 **[Live Demo](https://talk2notes.fly.dev)** | 📖 **[Documentation](DOCS.md)** | ⚡ **[Quick Start](QUICKSTART.md)** | 🆓 **[Groq Setup](GROQ-SETUP.md)** | 🛡️ **[Rate Limits](RATE-LIMITS.md)** | 🔍 **[Troubleshooting](TROUBLESHOOTING.md)**

## ✨ Features

- 💰 **Free to Use**: Default Groq integration with generous free tier (no credit card required!)
- 🎵 **Multi-format Support**: Upload MP3, WAV, M4A, MP4, MKV, MOV, and more
- 🎬 **YouTube Support**: Transcribe directly from YouTube URLs (requires yt-dlp)
- 🤖 **AI-Powered**: Transcription and summarization using Groq (default), OpenAI, Deepgram, or Anthropic
- 🌍 **Bilingual Support**: Generate notes in English or Indonesian (Bahasa Indonesia)
- 📝 **Formatted Transcript**: AI-formatted transcript with paragraphs, sections, and subheadings for easy reading
- 📊 **Structured Output**: Organized notes with paragraphs, bullet points, concepts, and definitions
- ✨ **Markdown Rendering**: Beautiful formatted display with support for bold, italic, lists, and code blocks
- 💾 **Export Options**: Download notes as JSON or Markdown, transcript as TXT
- 📋 **Copy to Clipboard**: Quick copy functionality for each tab
- 💾 **Auto-save**: Results persist across page refreshes
- 📜 **History Management**: Browse, search, and restore past transcriptions with individual delete
- 🛡️ **Rate Limiting**: Smart limits (10/hour, 50/day) to stay within free tier while preventing abuse
- ✂️ **Smart Cropping**: Automatically crops long transcripts to fit API limits (preserves sentence boundaries)
- 🗜️ **Auto Compression**: Compresses large audio files (>24MB YouTube, >10MB uploads) for reliable transcription
- ⚡ **Fast Processing**: Automatic audio extraction from video files using FFmpeg
- 🎨 **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- 🕌 **Islamic Content**: Preserves dalil with Arabic text, harakat, transliteration, translations, and references
- 🔒 **Secure**: File validation and size limits for safe uploads
- 🛡️ **Error Handling**: Robust error boundaries for graceful error recovery
- 🔐 **File Security**: Magic bytes validation to prevent malicious file uploads

## 🚀 Quick Start

### Prerequisites

- Node.js 18.18+ and pnpm 8+
- FFmpeg installed on your system
- yt-dlp (optional, for YouTube support)
- Groq API key (free, no credit card!) or other AI provider

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/taufiqelrahman/talk2notes.git
cd talk2notes
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Get free API key**

Go to https://console.groq.com/keys and sign up (30 seconds, no credit card needed!)

4. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
GROQ_SUMMARIZATION_MODEL=llama-3.3-70b-versatile
```

5. **Install FFmpeg** (if not already installed)

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

6. **Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Basic Usage

**File Upload:**

1. Visit the application homepage
2. Select your preferred language (🇬🇧 English or 🇮🇩 Indonesian)
3. Drag and drop or click to upload an audio/video file (MP3, WAV, M4A, MP4, MKV, MOV, etc.)
4. Wait for processing (transcription + summarization)
5. View your structured notes with beautiful markdown formatting
6. Download notes as JSON/Markdown or transcript as TXT

**YouTube URL:**

1. Toggle to "YouTube URL" mode
2. Select your preferred language
3. Paste a YouTube video URL (supports youtube.com, youtu.be, etc.)
4. Wait for processing (download → transcribe → summarize)
5. View formatted notes and transcript
6. **Note**: Videos >500MB or >24MB audio will be auto-compressed for reliable transcription

### Language Support

**English (Default)**

- Original transcription in English
- Notes generated in English

**Bahasa Indonesia**

- Automatic translation of transcript to Indonesian
- Notes generated in Indonesian
- **Special handling for Islamic content:**
  - Preserves Arabic text (Quranic verses, Hadith) with harakat
  - Maintains format: "Arabic text (transliteration) - Indonesian translation"
  - Keeps technical Islamic terms in original Arabic when commonly used

### Transcript Formatting

Talk2Notes automatically formats transcripts for better readability:

- **AI-Powered Formatting**: Uses AI to restructure raw transcripts
- **Paragraph Organization**: Groups sentences into coherent paragraphs (3-5 sentences each)
- **Topic-Based Sections**: Adds `## Subheadings` based on content topics
- **Dalil Preservation**: Maintains Islamic references with proper formatting:
  ```
  ---
  (Arabic text with harakat)
  (transliteration)
  "Translation"
  [QS. Surah: Verse] or [HR. Narrator]
  ---
  ```
- **Smart Cropping**: For long videos, transcripts are cropped at ~9000 tokens (preserves sentence boundaries)
- **No Content Loss**: All dalil, key points, and technical terms are preserved

### History Management

All transcriptions are automatically saved to your browser's history:

- **Automatic Saving**: Every successful transcription is saved automatically (max 50 items)
- **Quick Access**: Click "Show History" button to browse past transcriptions
- **Smart Organization**: Sorted by timestamp (most recent first)
- **Detailed Info**: View title, source (file/YouTube), language, timestamp, and summary preview
- **One-Click Restore**: Click any history item to reload its complete notes
- **Individual Delete**: Remove specific items with the delete button (appears on hover)
- **Clear All**: Remove all history with confirmation dialog
- **Cross-Tab Sync**: History updates automatically across multiple browser tabs
- **Relative Timestamps**: "2 hours ago", "3 days ago" for easy reference
- **Source Icons**: Visual indicators for YouTube videos vs uploaded files
- **Persistent Storage**: Stored locally in browser (localStorage)

**Note**: History is stored locally in your browser. Clearing browser data will remove all history.

### Viewing Notes

The application provides multiple tabs for organized viewing:

- **Summary**: Overview with key takeaways and bullet points
- **Detailed Notes**: Full paragraphs with markdown formatting
- **Key Concepts**: Important concepts with explanations
- **Definitions**: Technical terms and their definitions
- **Examples**: Sample problems with solutions
- **Action Items**: Actionable tasks with checkboxes
- **Full Transcript**: AI-formatted transcription with paragraphs, sections, and download option

### Markdown Support

All notes are rendered with beautiful markdown formatting:

- **Bold** and _italic_ text
- Bulleted and numbered lists
- `Code blocks` and inline code
- Links and references
- Proper typography with Tailwind prose

AI-generated notes can include markdown syntax which will be automatically rendered for better readability.

### Export Options

**Download Notes:**

- **JSON**: Complete structured data with all fields
- **Markdown**: Formatted document ready for sharing

**Download Transcript:**

- **TXT**: Plain text transcript in selected language

### Supported Providers

#### OpenAI (Default)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_TRANSCRIPTION_MODEL=whisper-1
OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview
```

#### Groq

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=whisper-large-v3
```

#### Deepgram

```env
AI_PROVIDER=deepgram
DEEPGRAM_API_KEY=...
```

#### Anthropic (for summarization)

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
```

## 🏗️ Architecture

### Project Structure

```
talk2notes/
├── actions/              # Server Actions
│   └── transcription.ts  # Main processing logic
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   ├── layout.js        # Root layout
│   ├── page.js          # Home page
│   └── globals.css      # Global styles
├── components/          # React components (JS)
│   ├── upload.js        # Upload form
│   ├── progress.js      # Progress indicator
│   └── notes-display.js # Notes viewer
├── lib/                 # Core libraries (TS)
│   ├── ai.ts           # AI provider abstraction
│   ├── ffmpeg.ts       # Audio extraction
│   └── upload.ts       # File handling
├── types/              # TypeScript definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── validateFile.ts
└── public/             # Static assets
```

### Server Actions Flow

```typescript
// actions/transcription.ts
export async function createTranscriptionMutation(formData: FormData) {
  // 1. Validate file
  // 2. Extract audio (if video)
  // 3. Transcribe with AI
  // 4. Summarize transcript
  // 5. Return structured notes
  // 6. Cleanup temp files
}
```

### Mutation Pattern

All server actions follow a consistent mutation pattern:

```typescript
interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## 🔧 Configuration

### File Upload Limits

Edit `.env`:

```env
MAX_FILE_SIZE_MB=100
ALLOWED_AUDIO_FORMATS=mp3,wav,m4a,aac,ogg,flac
ALLOWED_VIDEO_FORMATS=mp4,mkv,mov,avi,webm
```

### AI Model Configuration

Each provider has configurable models:

```env
# OpenAI
OPENAI_TRANSCRIPTION_MODEL=whisper-1
OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview

# Groq
GROQ_MODEL=whisper-large-v3
```

## 📝 API Reference

### Server Actions

#### `createTranscriptionMutation(formData: FormData)`

Processes uploaded file and returns lecture notes.

**Parameters:**

- `formData`: FormData containing the uploaded file

**Returns:**

```typescript
MutationResult<LectureNotes>;
```

#### `validateFileMutation(formData: FormData)`

Validates uploaded file without processing.

**Returns:**

```typescript
MutationResult<{ fileType: string; size: number }>;
```

### Core Functions

#### `transcribeAudio(audioPath: string, options?: TranscriptionOptions)`

Transcribes audio file using configured AI provider.

#### `summarizeTranscript(transcript: string, filename: string, options?: SummarizationOptions)`

Generates structured notes from transcript.

#### `extractAudioFromVideo(videoPath: string)`

Extracts audio from video file using FFmpeg.

## 🧪 Development

### Testing

```bash
# Run all tests
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run tests once (CI mode)
pnpm test:run

# Generate coverage report
pnpm test:coverage
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

### Formatting

```bash
pnpm format
pnpm format:check
```

### Building for Production

```bash
pnpm build
pnpm start
```

## 🚢 Deployment

### Fly.io (Recommended - Free Tier) ⭐

**Full features supported**: Video, YouTube, Large files, FFmpeg, yt-dlp

See complete guide: **[FLY-DEPLOY.md](FLY-DEPLOY.md)**

Quick deploy:

```bash
# Install Fly CLI
brew install flyctl

# Login
flyctl auth login

# Deploy
flyctl launch
flyctl secrets set GROQ_API_KEY=your_key_here
flyctl deploy
```

**Free tier**: 3 shared-cpu VMs with 256MB RAM (sufficient for most usage)

### Vercel (Limited Features)

⚠️ **Limitations**: No FFmpeg, No yt-dlp, 4.5MB max body size, 10-60s timeout

Only suitable for:

- Audio files only (<4MB)
- No video processing
- No YouTube support

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Railway (~$5-10/month)

**Full features supported**: All features work perfectly

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Docker (Self-hosted)

```bash
docker build -t talk2notes .
docker run -p 3000:3000 --env-file .env talk2notes
```

### Environment Variables for Production

Required secrets:

- `AI_PROVIDER` (groq, openai, deepgram, anthropic)
- `GROQ_API_KEY` or `OPENAI_API_KEY`
- `GROQ_TRANSCRIPTION_MODEL` (whisper-large-v3)
- `GROQ_SUMMARIZATION_MODEL` (llama-3.3-70b-versatile)
- `NODE_ENV=production`

Optional:

- `MAX_FILE_SIZE_MB` (default: 100)
- `ALLOWED_AUDIO_FORMATS`
- `ALLOWED_VIDEO_FORMATS`

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 📚 Documentation

- [Quick Start](QUICKSTART.md) - Get started in 5 minutes
- [Setup Guide](SETUP.md) - Detailed installation, configuration, and pnpm guide
- [CLI Reference](CLI-REFERENCE.md) - Complete command-line reference
- [Architecture](ARCHITECTURE.md) - System design and structure
- [Project Structure](PROJECT-STRUCTURE.md) - Code organization
- [Contributing](CONTRIBUTING.md) - How to contribute

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [OpenAI](https://openai.com/) - Whisper and GPT models
- [FFmpeg](https://ffmpeg.org/) - Audio/video processing
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Formidable](https://github.com/node-formidable/formidable) - File uploads
- [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager

## 📞 Support

- 📫 Issues: [GitHub Issues](https://github.com/taufiqelrahman/talk2notes/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/taufiqelrahman/talk2notes/discussions)
- 📖 Docs: [Architecture Documentation](ARCHITECTURE.md)

## 🗺️ Roadmap

- [ ] Real-time progress tracking
- [ ] Batch processing
- [ ] Custom prompt templates
- [ ] Multi-language support
- [ ] Note collaboration features
- [ ] Cloud storage integration
- [ ] Mobile app

---

**Made with ❤️ by the Talk2Notes community**
