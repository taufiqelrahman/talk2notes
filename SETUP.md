# Talk2Notes Setup Guide

This guide will help you set up Talk2Notes on your local machine or server.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 18.18.0 or higher (required for Next.js 15)
- [ ] pnpm 8.0.0 or higher
- [ ] FFmpeg installed
- [ ] API key from your chosen AI provider
- [ ] Git installed

## Step-by-Step Installation

### 1. Install Node.js and pnpm

**Check if already installed:**

```bash
node --version  # Should be 18.0.0+
pnpm --version   # Should be 9.0.0+
```

**If not installed:**

**macOS (using Homebrew):**

```bash
brew install node
```

**Ubuntu/Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

### 2. Install FFmpeg

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**

1. Download from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract and add to PATH

**Verify installation:**

```bash
ffmpeg -version
ffprobe -version
```

**Quick check** (after cloning the repo):

```bash
pnpm check:ffmpeg
```

This will verify FFmpeg is properly installed and show the detected paths.

### 3. Get API Keys

You need an API key from one of these providers:

#### OpenAI (Recommended)

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API keys section
4. Create new secret key
5. Copy the key (starts with `sk-`)

#### Groq (Alternative)

1. Go to [console.groq.com](https://console.groq.com/)
2. Sign up or log in
3. Generate API key
4. Copy the key (starts with `gsk_`)

#### Deepgram (Alternative)

1. Go to [deepgram.com](https://deepgram.com/)
2. Create account
3. Get API key from console

### 4. Clone the Repository

```bash
git clone https://github.com/taufiqelrahman/talk2notes.git
cd talk2notes
```

### 5. Install Dependencies

```bash
pnpm install
```

This will install all required packages including:

- Next.js
- React
- OpenAI SDK
- FFmpeg wrapper
- Formidable
- Zod
- And development tools

### 6. Configure Environment Variables

**Copy the example file:**

```bash
cp .env.example .env
```

**Edit `.env` with your values:**

```bash
# Use your preferred editor
nano .env
# or
vim .env
# or
code .env
```

**Minimum required configuration (Groq - Free!):**

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
GROQ_SUMMARIZATION_MODEL=llama-3.3-70b-versatile
```

**Alternative: OpenAI (Paid):**

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_TRANSCRIPTION_MODEL=whisper-1
OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview
```

**Full configuration example:**

```env
# AI Service Configuration (Default: Groq - Free!)
AI_PROVIDER=groq

# Groq Configuration
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
GROQ_SUMMARIZATION_MODEL=llama-3.3-70b-versatile

# Upload Configuration
MAX_FILE_SIZE_MB=100
ALLOWED_AUDIO_FORMATS=mp3,wav,m4a,aac,ogg,flac
ALLOWED_VIDEO_FORMATS=mp4,mkv,mov,avi,webm

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# FFmpeg Configuration (optional, auto-detected)
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe
```

### 7. Run the Development Server

```bash
pnpm dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

### 8. Verify Installation

1. Open your browser to `http://localhost:3000`
2. You should see the Talk2Notes interface
3. Try uploading a small audio file (test with a short recording)
4. Check that processing completes successfully

## Troubleshooting

### FFmpeg Not Found

**Error:** `Cannot find ffmpeg`

**Solution:**

```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg

# Verify
which ffmpeg
```

If installed but not found, set the path in `.env`:

```env
FFMPEG_PATH=/path/to/ffmpeg
FFPROBE_PATH=/path/to/ffprobe
```

### API Key Issues

**Error:** `API key not configured`

**Solution:**

1. Check `.env` file exists
2. Verify API key is correct
3. Ensure no extra spaces in `.env`
4. Restart the dev server after changes

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**

```bash
# Use a different port
PORT=3001 pnpm dev

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill
```

### File Upload Fails

**Error:** `File upload failed` or `File too large`

**Solution:**

1. Check file size is under limit (default 100MB)
2. Verify file format is supported
3. Check `MAX_FILE_SIZE_MB` in `.env`
4. Ensure `uploads/` directory is writable

### TypeScript Errors

**Error:** Type errors during development

**Solution:**

```bash
# Check for errors
pnpm type-check

# If dependencies issue
rm -rf node_modules package-lock.json
pnpm install
```

## Production Setup

### Build for Production

```bash
pnpm build
pnpm start
```

### Using Docker

```bash
# Build image
docker build -t talk2notes .

# Run container
docker run -p 3000:3000 --env-file .env talk2notes
```

### Using Docker Compose

```bash
docker-compose up -d
```

### Deploy to Vercel

```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

## Optional: Development Tools

### Install Recommended VS Code Extensions

Open VS Code in the project directory:

```bash
code .
```

Install recommended extensions (VS Code will prompt):

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Extension

### Set Up Git Hooks (Optional)

For conventional commits:

```bash
pnpm install --save-dev @commitlint/cli @commitlint/config-conventional husky
npx husky install
```

## Next Steps

Once installed:

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the codebase
2. Check [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute
3. Try different AI providers by changing `AI_PROVIDER` in `.env`
4. Customize the summarization prompts in `lib/ai.ts`

## Getting Help

- **Documentation:** [README.md](README.md)
- **Issues:** [GitHub Issues](https://github.com/taufiqelrahman/talk2notes/issues)
- **Discussions:** [GitHub Discussions](https://github.com/taufiqelrahman/talk2notes/discussions)

## pnpm Package Manager Guide

This project uses **pnpm** for faster, more efficient dependency management.

### Why pnpm?

- ⚡ Up to 2x faster than npm
- 💾 Space efficient (content-addressable storage)
- 🔒 Strict dependency resolution
- 🎯 Monorepo friendly

### Common pnpm Commands

```bash
pnpm install                      # Install dependencies
pnpm add <package>                # Add dependency
pnpm add -D <package>             # Add dev dependency
pnpm remove <package>             # Remove package
pnpm update                       # Update all packages
pnpm outdated                     # Check outdated packages
pnpm list --depth=0               # List direct dependencies
pnpm store prune                  # Clean cache
```

### pnpm Configuration

Project configuration in `.npmrc`:

```ini
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
node-linker=isolated
```

## Quick Reference

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter
pnpm type-check       # Check TypeScript
pnpm format           # Format code
pnpm format:check     # Check formatting

# Deployment
vercel                # Deploy to Vercel
docker-compose up     # Run with Docker
```

---

**Success!** 🎉 You now have Talk2Notes running locally.
