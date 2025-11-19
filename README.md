# Talk2Notes 🎙️📝

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Transform audio and video lectures into structured, comprehensive notes using AI

Talk2Notes is an open-source web application that automatically transcribes audio and video files and generates well-organized lecture notes complete with summaries, key concepts, definitions, example problems, and action items.

## ✨ Features

- 🎯 **Multi-format Support**: Upload MP3, WAV, M4A, MP4, MKV, MOV, and more
- 🤖 **AI-Powered**: Transcription and summarization using OpenAI, Groq, Deepgram, or Anthropic
- 📊 **Structured Output**: Organized notes with paragraphs, bullet points, concepts, and definitions
- 💾 **Export Options**: Download as JSON or Markdown
- ⚡ **Fast Processing**: Automatic audio extraction from video files using FFmpeg
- 🎨 **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- 🔒 **Secure**: File validation and size limits for safe uploads

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- FFmpeg installed on your system
- API key for your chosen AI provider (OpenAI, Groq, Deepgram, or Anthropic)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/talk2notes.git
cd talk2notes
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
```

4. **Install FFmpeg** (if not already installed)

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

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Basic Usage

1. Visit the application homepage
2. Drag and drop or click to upload an audio/video file
3. Wait for processing (transcription + summarization)
4. View your structured notes
5. Download as JSON or Markdown

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
MutationResult<LectureNotes>
```

#### `validateFileMutation(formData: FormData)`

Validates uploaded file without processing.

**Returns:**
```typescript
MutationResult<{ fileType: string; size: number }>
```

### Core Functions

#### `transcribeAudio(audioPath: string, options?: TranscriptionOptions)`

Transcribes audio file using configured AI provider.

#### `summarizeTranscript(transcript: string, filename: string, options?: SummarizationOptions)`

Generates structured notes from transcript.

#### `extractAudioFromVideo(videoPath: string)`

Extracts audio from video file using FFmpeg.

## 🧪 Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
npm run format:check
```

### Building for Production

```bash
npm run build
npm start
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Note:** Ensure FFmpeg is available in your deployment environment. For Vercel, consider using a custom build or serverless FFmpeg solution.

### Docker

```bash
docker build -t talk2notes .
docker run -p 3000:3000 --env-file .env talk2notes
```

### Environment Variables for Production

Ensure all required environment variables are set:

- `AI_PROVIDER`
- `OPENAI_API_KEY` (or provider-specific key)
- `MAX_FILE_SIZE_MB`
- `NODE_ENV=production`

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [OpenAI](https://openai.com/) - Whisper and GPT models
- [FFmpeg](https://ffmpeg.org/) - Audio/video processing
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Formidable](https://github.com/node-formidable/formidable) - File uploads

## 📞 Support

- 📫 Issues: [GitHub Issues](https://github.com/yourusername/talk2notes/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/talk2notes/discussions)
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
