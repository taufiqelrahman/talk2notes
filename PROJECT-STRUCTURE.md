# Talk2Notes Project Structure

```
talk2notes/
│
├── .github/                      # GitHub configuration
│   └── workflows/                # GitHub Actions workflows
│       ├── ci.yml                # Continuous Integration
│       ├── deploy.yml            # Production deployment
│       ├── release.yml           # Release automation
│       └── code-quality.yml      # Code quality checks
│
├── .vscode/                      # VS Code configuration
│   ├── extensions.json           # Recommended extensions
│   └── settings.json             # Editor settings
│
├── actions/                      # Next.js Server Actions (TypeScript)
│   └── transcription.ts          # Main transcription mutation logic
│       ├── createTranscriptionMutation()
│       ├── validateFileMutation()
│       └── cleanupFilesAction()
│
├── app/                          # Next.js App Router (JavaScript)
│   ├── api/                      # API Routes
│   │   └── transcribe/
│   │       └── route.ts          # Transcription API endpoint
│   ├── layout.js                 # Root layout with header/footer
│   ├── page.js                   # Home page (upload + display)
│   └── globals.css               # Global styles with Tailwind
│
├── components/                   # React Components (JavaScript/TypeScript)
│   ├── upload.tsx                # File upload form with drag-drop
│   ├── progress.js               # Progress indicator
│   ├── notes-display.js          # Tabbed notes viewer
│   └── history.tsx               # History list with delete functionality
│
├── lib/                          # Core Libraries (TypeScript)
│   ├── ai.ts                     # AI provider abstraction
│   │   ├── getAIConfig()
│   │   ├── transcribeAudio()
│   │   ├── summarizeTranscript()
│   │   ├── transcribeWithOpenAI()
│   │   ├── transcribeWithGroq()
│   │   ├── transcribeWithDeepgram()
│   │   └── buildSummarizationPrompt()
│   │
│   ├── ffmpeg.ts                 # FFmpeg utilities
│   │   ├── extractAudioFromVideo()
│   │   ├── getAudioDuration()
│   │   ├── convertAudioFormat()
│   │   ├── cleanupTempFile()
│   │   └── getAudioMetadata()
│   │
│   └── upload.ts                 # File upload handling
│       ├── ensureUploadDir()
│       ├── parseFormData()
│       ├── saveUploadedFile()
│       └── cleanupUploadedFile()
│
├── types/                        # TypeScript Type Definitions
│   └── index.ts                  # All interfaces and types
│       ├── UploadedFile
│       ├── TranscriptionResult
│       ├── LectureNotes
│       ├── KeyConcept
│       ├── Definition
│       ├── ExampleProblem
│       ├── HistoryItem
│       ├── MutationResult<T>
│       └── AIConfig
│
├── utils/                        # Utility Functions (TypeScript)
│   ├── validateFile.ts           # File validation
│   │   ├── validateFile()
│   │   ├── formatFileSize()
│   │   ├── formatDuration()
│   │   └── sanitizeFilename()
│   └── history.ts                # History management
│       ├── getHistory()
│       ├── saveToHistory()
│       ├── deleteFromHistory()
│       ├── clearHistory()
│       ├── getHistoryItem()
│       └── formatTimestamp()
│
├── public/                       # Static Assets
│   └── (images, icons, etc.)
│
├── uploads/                      # Upload directory (gitignored)
│   └── (temporary uploaded files)
│
├── .env.example                  # Environment variables template
├── .env                          # Environment variables (gitignored)
├── .gitignore                    # Git ignore rules
├── .prettierrc.json              # Prettier configuration
├── .prettierignore               # Prettier ignore rules
├── .eslintrc.json                # ESLint configuration
├── .editorconfig                 # Editor configuration
│
├── commitlint.config.js          # Commit message linting
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
│
├── package.json                  # Project dependencies and scripts
├── package-lock.json             # Dependency lock file
│
├── Dockerfile                    # Docker container definition
├── docker-compose.yml            # Docker Compose configuration
│
├── README.md                     # Main documentation
├── ARCHITECTURE.md               # Architecture documentation
├── CONTRIBUTING.md               # Contribution guidelines
├── SETUP.md                      # Setup instructions
├── LICENSE                       # MIT License
│
└── setup.sh                      # Automated setup script
```

## Key Directories Explained

### `actions/` - Server Actions

Server-side logic using Next.js Server Actions with `'use server'` directive.
All files are TypeScript for type safety.

**Purpose:** Handle mutations and server-side operations
**Language:** TypeScript
**Pattern:** MutationResult<T> return type

### `app/` - App Router

Next.js 14 App Router for pages and routing.
Uses JavaScript for flexibility in client components.

**Purpose:** Pages, layouts, and API routes
**Language:** JavaScript (pages), TypeScript (API routes)
**Pattern:** File-based routing

### `components/` - UI Components

React client components for the user interface.
Uses JavaScript for simplicity in UI code.

**Purpose:** Reusable UI components
**Language:** JavaScript
**Pattern:** Functional components with hooks

### `lib/` - Core Libraries

Business logic and external service integrations.
TypeScript for type safety and maintainability.

**Purpose:** Core application logic
**Language:** TypeScript
**Pattern:** Exported functions with types

### `types/` - Type Definitions

Centralized TypeScript type definitions.
Shared across all TypeScript files.

**Purpose:** Type definitions and interfaces
**Language:** TypeScript
**Pattern:** Export interfaces and types

### `utils/` - Utility Functions

Helper functions used across the application.
TypeScript for type safety.

**Purpose:** Reusable utility functions
**Language:** TypeScript
**Pattern:** Pure functions with types

## File Naming Conventions

- **TypeScript files:** `kebab-case.ts` (e.g., `validate-file.ts`)
- **JavaScript files:** `kebab-case.js` (e.g., `upload-form.js`)
- **React components:** `PascalCase` for component names
- **Constants:** `UPPER_SNAKE_CASE`
- **Functions:** `camelCase`

## Import Path Aliases

The project uses path aliases for cleaner imports:

```typescript
// Instead of: import { LectureNotes } from '../../../types'
import { LectureNotes } from '@/types'

// Available aliases:
@/actions      → /actions
@/app          → /app
@/components   → /components
@/lib          → /lib
@/types        → /types
@/utils        → /utils
```

## Configuration Files

| File                   | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `next.config.js`       | Next.js configuration (body size, experimental features) |
| `tsconfig.json`        | TypeScript compiler options                              |
| `tailwind.config.js`   | Tailwind CSS theme and configuration                     |
| `postcss.config.js`    | PostCSS plugins configuration                            |
| `.eslintrc.json`       | ESLint rules for code quality                            |
| `.prettierrc.json`     | Prettier formatting rules                                |
| `commitlint.config.js` | Conventional commit validation                           |

## Build Output

When you run `npm run build`, Next.js creates:

```
.next/
├── cache/              # Build cache
├── server/             # Server-side code
├── static/             # Static assets
└── types/              # Generated types
```

## Environment Files

```
.env                    # Local development (gitignored)
.env.example            # Template for environment variables
.env.local              # Local overrides (gitignored)
.env.production         # Production variables (gitignored)
```

## Dependencies Overview

### Core Dependencies

- `next` - React framework
- `react`, `react-dom` - UI library
- `openai` - OpenAI API client
- `formidable` - File upload handling
- `fluent-ffmpeg` - FFmpeg wrapper
- `zod` - Schema validation

### Dev Dependencies

- `typescript` - Type checking
- `eslint` - Code linting
- `prettier` - Code formatting
- `tailwindcss` - CSS framework
- `autoprefixer`, `postcss` - CSS processing

## Scripts Reference

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## CI/CD Workflows

### `ci.yml` - Continuous Integration

- Runs on push/PR to main/develop
- Lint, type check, build
- Security scan with Snyk

### `deploy.yml` - Production Deployment

- Runs on push to main
- Deploys to Vercel
- Sends deployment notifications

### `release.yml` - Release Automation

- Triggered by version tags (v*.*.\*)
- Creates GitHub release
- Publishes Docker image

### `code-quality.yml` - Code Quality

- Runs on PRs
- Validates conventional commits
- Comments on PR with results

## Docker Structure

### `Dockerfile`

Multi-stage build:

1. **base** - Node.js + FFmpeg
2. **dependencies** - Install packages
3. **build** - Build application
4. **runner** - Production runtime

### `docker-compose.yml`

- Single service configuration
- Volume for uploads
- Environment variable support
- Auto-restart policy

## Getting Started

For first-time setup, run:

```bash
./setup.sh
```

Or follow [SETUP.md](SETUP.md) for detailed instructions.

---

**Maintained by:** Talk2Notes Contributors
**License:** MIT
**Last Updated:** November 2025
