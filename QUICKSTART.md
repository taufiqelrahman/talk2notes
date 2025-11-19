# Quick Start - 5 Minutes to First Transcription# Quick Start - 5 Minutes to First Transcription# Talk2Notes - Quick Start Guide

Get Talk2Notes running in 5 minutes.Get Talk2Notes running in 5 minutes.Get up and running with Talk2Notes in 5 minutes!

## Prerequisites## Prerequisites## Prerequisites

- Node.js 18.18+- Node.js 18+✅ Node.js 18+ installed

- pnpm 8+

- FFmpeg installed- pnpm 8+✅ npm 9+ installed

- API key from OpenAI/Groq/Deepgram/Anthropic

- FFmpeg installed✅ FFmpeg installed

## 1. Install

- API key from OpenAI/Groq/Deepgram/Anthropic✅ OpenAI API key ready

````bash

# Clone repository## 1. Install## Installation (One Command)

git clone https://github.com/yourusername/talk2notes.git

cd talk2notes`bash`bash



# Install dependencies# Clone repositorygit clone https://github.com/taufiqelrahman/talk2notes.git && cd talk2notes && ./setup.sh

pnpm install

git clone https://github.com/yourusername/talk2notes.git```

# Setup environment

cp .env.example .envcd talk2notes

````

Or manually:

## 2. Configure

# Install dependencies

Edit `.env` and add your API key:

pnpm install```bash

`````env

AI_PROVIDER=openai# 1. Clone

OPENAI_API_KEY=sk-your-key-here

```# Setup environmentgit clone https://github.com/taufiqelrahman/talk2notes.git



**Get API Keys:**cp .env.example .envcd talk2notes

- OpenAI: https://platform.openai.com/api-keys

- Groq (faster): https://console.groq.com````



## 3. Install FFmpeg# 2. Install



```bash## 2. Configurepnpm install

# macOS

brew install ffmpeg



# Ubuntu/DebianEdit `.env` and add your API key:# 3. Configure

sudo apt install ffmpeg

cp .env.example .env

# Verify

ffmpeg -version```envnano .env  # Add your OPENAI_API_KEY

`````

AI_PROVIDER=openai

## 4. Run

OPENAI_API_KEY=sk-your-key-here# 4. Run

````bash

pnpm dev```pnpm dev

````

`````

Open http://localhost:3000

**Get API Keys:**

## 5. Use

- OpenAI: https://platform.openai.com/api-keys## Your First Transcription

1. Upload an audio/video file (drag & drop)

2. Wait for processing (30s - 3min depending on file size)- Groq (faster): https://console.groq.com

3. View your structured notes

4. Download as JSON or Markdown1. **Open the app:** http://localhost:3000



## Supported Formats## 3. Install FFmpeg2. **Upload a file:** Drag & drop an audio/video file



**Audio:** MP3, WAV, M4A, AAC, OGG, FLAC  3. **Wait:** Processing takes a few seconds to minutes depending on file size

**Video:** MP4, MKV, MOV, AVI, WEBM

````bash4. **View notes:** See your structured lecture notes

## Common Issues

# macOS5. **Download:** Export as JSON or Markdown

| Problem | Solution |

|---------|----------|brew install ffmpeg

| FFmpeg not found | Install: `brew install ffmpeg` (macOS) |

| Port 3000 in use | Run: `PORT=3001 pnpm dev` |## Example API Keys

| API key invalid | Check `.env` has correct key |

| Upload fails | Max file size is 100MB by default |# Ubuntu/Debian



## Next Stepssudo apt install ffmpeg### OpenAI (Recommended)



- **Full setup:** [SETUP.md](SETUP.md)

- **CLI commands:** [CLI-REFERENCE.md](CLI-REFERENCE.md)

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)# Verify```env

- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)

ffmpeg -versionAI_PROVIDER=openai

## Production Deployment

```OPENAI_API_KEY=sk-proj-xxxxx

### Vercel (Recommended)

```bash````

vercel

```## 4. Run



### DockerGet key: https://platform.openai.com/api-keys

```bash

docker-compose up -d```bash

```

pnpm dev### Groq (Faster, Free Tier)

---

```

**That's it!** 🎉 For detailed documentation, see [README.md](README.md)

````env

Open http://localhost:3000AI_PROVIDER=groq

GROQ_API_KEY=gsk_xxxxx

## 5. Use```



1. Upload an audio/video file (drag & drop)Get key: https://console.groq.com

2. Wait for processing (30s - 3min depending on file size)

3. View your structured notes## Test Files

4. Download as JSON or Markdown

Try with these sample files:

## Supported Formats

- Short audio clip (30 seconds)

**Audio:** MP3, WAV, M4A, AAC, OGG, FLAC  - Lecture recording (5-10 minutes)

**Video:** MP4, MKV, MOV, AVI, WEBM- YouTube video (download with youtube-dl)



## Common Issues## Common Commands



| Problem | Solution |```bash

|---------|----------|pnpm dev              # Start development

| FFmpeg not found | Install: `brew install ffmpeg` (macOS) |pnpm build           # Build for production

| Port 3000 in use | Run: `PORT=3001 pnpm dev` |pnpm start               # Run production build

| API key invalid | Check `.env` has correct key |pnpm lint            # Check code quality

| Upload fails | Max file size is 100MB by default |```



## Next Steps## Troubleshooting Quick Fixes



- **Full setup:** [SETUP.md](SETUP.md)### FFmpeg not found

- **CLI commands:** [CLI-REFERENCE.md](CLI-REFERENCE.md)

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)```bash

- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)# macOS

brew install ffmpeg

## Production Deployment

# Ubuntu

### Vercel (Recommended)sudo apt install ffmpeg

```bash```

vercel

```### API key error



### DockerCheck that `.env` has:

```bash

docker-compose up -d```env

```OPENAI_API_KEY=sk-xxxxx  # No spaces, no quotes

`````

---

### Port 3000 in use

**That's it!** 🎉 For detailed documentation, see [README.md](README.md)

```bash
# Use different port
PORT=3001 pnpm dev

# Or kill the process
lsof -ti:3000 | xargs kill
```

### Upload fails

- Check file is < 100MB
- Verify format: MP3, WAV, MP4, MOV, etc.
- Ensure `uploads/` directory exists

## What's Next?

- 📖 Read [README.md](README.md) for full documentation
- 🏗️ Check [ARCHITECTURE.md](ARCHITECTURE.md) to understand the code
- 🤝 See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- 📁 Review [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) for file organization

## Getting Help

- **Issues:** https://github.com/taufiqelrahman/talk2notes/issues
- **Discussions:** https://github.com/taufiqelrahman/talk2notes/discussions

## Advanced Usage

### Change AI Provider

```env
# Use Groq instead of OpenAI
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxx
```

### Increase Upload Limit

```env
MAX_FILE_SIZE_MB=200
```

### Custom Models

```env
OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview
```

## Production Deployment

### Vercel (Easiest)

```bash
pnpm install -g vercel
vercel
```

### Docker

```bash
docker-compose up -d
```

### Manual

```bash
pnpm build
pnpm start
```

---

**That's it!** You're ready to transcribe lectures. 🎉
