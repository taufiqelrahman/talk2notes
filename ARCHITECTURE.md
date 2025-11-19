# Talk2Notes Architecture

This document provides a comprehensive overview of the Talk2Notes architecture, design decisions, and implementation patterns.

## 🎯 Design Philosophy

### Core Principles

1. **Separation of Concerns**: TypeScript for server logic, JavaScript for client UI
2. **Type Safety**: Comprehensive TypeScript types for data models and APIs
3. **Security First**: Input validation, file sanitization, secure API handling
4. **Modularity**: Reusable components and abstracted integrations
5. **Developer Experience**: Clear patterns, consistent naming, good documentation

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                        (JavaScript)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Upload Form  │  │   Progress   │  │    Notes     │     │
│  │ Component    │  │  Indicator   │  │   Display    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   page.js    │  │  layout.js   │  │  API Routes  │     │
│  │  (Home)      │  │  (Root)      │  │ /transcribe  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server Actions Layer                      │
│                       (TypeScript)                           │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │      createTranscriptionMutation()             │         │
│  │  - Validate file                                │         │
│  │  - Process upload                               │         │
│  │  - Extract audio (if video)                     │         │
│  │  - Transcribe                                   │         │
│  │  - Summarize                                    │         │
│  │  - Cleanup                                      │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│                      (TypeScript)                            │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   AI Service │  │    FFmpeg    │  │    Upload    │     │
│  │              │  │   Service    │  │   Service    │     │
│  │ - Transcribe │  │ - Extract    │  │ - Validate   │     │
│  │ - Summarize  │  │ - Convert    │  │ - Save       │     │
│  │ - Abstract   │  │ - Metadata   │  │ - Cleanup    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   OpenAI     │  │     Groq     │  │  Deepgram    │     │
│  │  Whisper     │  │   Whisper    │  │    Nova      │     │
│  │   GPT-4      │  │   Mixtral    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

```
talk2notes/
├── actions/              # Server Actions (use server)
│   └── transcription.ts  # Main processing mutation
│
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   │   └── transcribe/
│   │       └── route.ts  # REST API endpoint
│   ├── layout.js        # Root layout (metadata, header, footer)
│   ├── page.js          # Home page (upload + display)
│   └── globals.css      # Global styles
│
├── components/          # Client components (JavaScript)
│   ├── upload.js        # File upload with drag-drop
│   ├── progress.js      # Progress indicator
│   └── notes-display.js # Tabbed notes viewer
│
├── lib/                 # Core libraries (TypeScript)
│   ├── ai.ts           # AI provider abstraction
│   ├── ffmpeg.ts       # Audio extraction utilities
│   └── upload.ts       # File upload handling
│
├── types/              # TypeScript type definitions
│   └── index.ts        # All interfaces and types
│
├── utils/              # Utility functions (TypeScript)
│   └── validateFile.ts # File validation logic
│
└── public/             # Static assets
```

## 🔄 Data Flow

### Upload to Notes Pipeline

```
1. User uploads file (upload.js)
   ↓
2. FormData sent to /api/transcribe
   ↓
3. API route calls createTranscriptionMutation()
   ↓
4. Server Action pipeline:
   a. validateFile() - Check format, size
   b. saveUploadedFile() - Store temporarily
   c. [If video] extractAudioFromVideo() - FFmpeg conversion
   d. transcribeAudio() - AI transcription
   e. summarizeTranscript() - AI summarization
   f. Cleanup temp files
   ↓
5. Return LectureNotes JSON
   ↓
6. Client displays structured notes (notes-display.js)
```

## 🔌 AI Provider Abstraction

### Design Pattern

The AI service uses a provider abstraction pattern to support multiple AI services:

```typescript
// lib/ai.ts
export function getAIConfig(): AIConfig {
  switch (AI_PROVIDER) {
    case 'openai': return { ... }
    case 'groq': return { ... }
    case 'deepgram': return { ... }
    case 'anthropic': return { ... }
  }
}

export async function transcribeAudio(
  audioPath: string,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const config = getAIConfig();

  // Route to appropriate provider
  switch (config.provider) {
    case 'openai': return transcribeWithOpenAI(...)
    case 'groq': return transcribeWithGroq(...)
    // ...
  }
}
```

### Adding New Providers

To add a new AI provider:

1. Update `AIProvider` type in `types/index.ts`
2. Add configuration in `getAIConfig()`
3. Implement `transcribeWith[Provider]()` function
4. Add to switch statements in `transcribeAudio()` and `summarizeTranscript()`
5. Document in README

## 🎭 Server Actions Pattern

### Mutation Pattern

All server actions follow a consistent mutation result pattern:

```typescript
interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Implementation

```typescript
'use server';

export async function createTranscriptionMutation(
  formData: FormData
): Promise<MutationResult<LectureNotes>> {
  try {
    // Process logic
    return {
      success: true,
      data: lectureNotes,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### Benefits

- **Consistent error handling**: Errors never throw, always return
- **Type safety**: Generic type for data payload
- **Easy client consumption**: Check `success` field
- **Logging friendly**: Centralized error capture

## 🎨 Component Architecture

### Client Components (JavaScript)

All UI components are client-side JavaScript for simplicity and flexibility.

#### UploadForm Component

```javascript
// components/upload.js
'use client';

Features:
- Drag-and-drop support
- File validation
- Progress tracking
- Error handling
- Optimistic UI updates
```

#### NotesDisplay Component

```javascript
// components/notes-display.js
'use client';

Features:
- Tabbed interface
- JSON/Markdown export
- Formatted display
- Responsive design
```

### Design Decisions

- **Client-side state**: React hooks for local state
- **No server components for UI**: Simplifies data flow
- **Progressive enhancement**: Works without JS for static content

## 🔐 Security Architecture

### Multi-Layer Validation

```
Client → Server Action → Service Layer
  ↓           ↓              ↓
[Basic]   [Full Validation] [Final Check]
```

### File Upload Security

1. **MIME type checking**: Validate against whitelist
2. **Extension validation**: Check file extension
3. **Size limits**: Enforce maximum file size
4. **Sanitized storage**: Random filenames, isolated directory
5. **Automatic cleanup**: Remove files after processing

### API Security

- No hardcoded secrets
- Environment variable configuration
- Input sanitization at every layer
- Structured error messages (no sensitive data leaks)

## 📊 Data Models

### Core Types

```typescript
// Uploaded file metadata
interface UploadedFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

// AI transcription result
interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  segments?: TranscriptionSegment[];
}

// Final structured notes
interface LectureNotes {
  title: string;
  summary: string;
  paragraphs: string[];
  bulletPoints: string[];
  keyConcepts: KeyConcept[];
  definitions: Definition[];
  exampleProblems: ExampleProblem[];
  actionItems: string[];
  metadata: NotesMetadata;
}
```

## 🎯 Prompt Engineering

### Transcription Prompt

```typescript
{
  language: 'en',
  temperature: 0,  // Deterministic output
  prompt: undefined  // Let model auto-detect
}
```

### Summarization Prompt

Located in `lib/ai.ts` → `buildSummarizationPrompt()`:

**Key elements:**

- JSON schema specification
- Detail level control (concise/detailed/comprehensive)
- Focus areas (if specified)
- Structured output requirements
- Academic writing style
- Relationship identification
- Example extraction rules

## ⚡ Performance Considerations

### Optimizations

1. **Streaming not implemented**: Batch processing for simplicity
2. **Single file processing**: No concurrent uploads (yet)
3. **Temp file cleanup**: Automatic removal after processing
4. **Audio optimization**: Convert to mono, 16kHz for smaller payload

### Future Improvements

- [ ] Streaming responses
- [ ] Queue system for batch processing
- [ ] Caching for repeated files
- [ ] Chunk large files
- [ ] Background job processing

## 🚀 Deployment Architecture

### Environment Requirements

- Node.js 18+ runtime
- FFmpeg binaries
- Writable /tmp directory
- Environment variables for API keys

### Vercel Deployment

**Considerations:**

- FFmpeg availability (use serverless layer or custom build)
- File size limits (100MB default)
- Function timeout (10s default, upgrade needed)
- Environment variable configuration

### Docker Deployment

**Included:**

- FFmpeg in container
- Node.js runtime
- All dependencies
- Environment variable support

## 🔧 Configuration System

### Environment Variables

```env
# AI Provider Selection
AI_PROVIDER=openai|groq|deepgram|anthropic

# Provider-specific keys
OPENAI_API_KEY=...
GROQ_API_KEY=...

# File upload configuration
MAX_FILE_SIZE_MB=100
ALLOWED_AUDIO_FORMATS=mp3,wav,...
ALLOWED_VIDEO_FORMATS=mp4,mkv,...

# FFmpeg paths (optional)
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe
```

### Runtime Configuration

Configuration is loaded at module initialization:

- `lib/ai.ts` → AI provider config
- `utils/validateFile.ts` → Upload limits
- `lib/upload.ts` → Upload directory

## 🧪 Testing Strategy

### Current State

Manual testing for MVP release.

### Future Testing

- **Unit tests**: Core utilities and validation
- **Integration tests**: Server Actions end-to-end
- **E2E tests**: Full upload → notes flow
- **Mock AI providers**: Test without API calls

## 📈 Monitoring & Logging

### Current Logging

```typescript
console.error('Operation failed:', error);
```

### Future Enhancements

- Structured logging (Winston, Pino)
- Error tracking (Sentry)
- Analytics (Plausible, Umami)
- Performance monitoring (Vercel Analytics)

## 🔄 Migration Path

### Version 1.x → 2.x

Potential breaking changes:

- API response format changes
- Provider configuration updates
- Type definition modifications

Migration guide will be provided with major releases.

## 🤝 Extension Points

### Adding Features

**Easy to add:**

- New AI providers (abstraction layer ready)
- New export formats (component pattern established)
- Additional validation rules (modular design)
- Custom prompt templates (configuration-based)

**More complex:**

- Real-time processing (requires streaming)
- Batch uploads (requires queue system)
- Collaboration (requires database)

## 📚 Additional Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

---

This architecture is designed to be:

- **Extensible**: Easy to add providers and features
- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple validation layers
- **Type-safe**: TypeScript throughout server layer
- **Developer-friendly**: Consistent patterns and good documentation

For questions or discussions about architecture decisions, please open a [GitHub Discussion](https://github.com/taufiqelrahman/talk2notes/discussions).
