# Quick Start - 5 Minutes to First Transcription# Quick Start - 5 Minutes to First Transcription# Quick Start - 5 Minutes to First Transcription# Talk2Notes - Quick Start Guide

Get Talk2Notes running in 5 minutes with **free Groq API** (no credit card needed!)Get Talk2Notes running in 5 minutes.Get Talk2Notes running in 5 minutes.Get up and running with Talk2Notes in 5 minutes!

## Prerequisites## Prerequisites## Prerequisites## Prerequisites

- ✅ Node.js 18.18+ installed- Node.js 18.18+- Node.js 18+✅ Node.js 18+ installed

- ✅ pnpm 8+ installed

- ✅ FFmpeg installed- pnpm 8+

- ✅ Groq API key (free, get in 30 seconds!)

- FFmpeg installed- pnpm 8+✅ npm 9+ installed

## 🚀 Installation (3 Steps)

- API key from OpenAI/Groq/Deepgram/Anthropic

### 1. Clone & Install

- FFmpeg installed✅ FFmpeg installed

```bash

git clone https://github.com/taufiqelrahman/talk2notes.git## 1. Install

cd talk2notes

pnpm install- API key from OpenAI/Groq/Deepgram/Anthropic✅ OpenAI API key ready

```

``````bash

### 2. Get Free API Key

# Clone repository## 1. Install## Installation (One Command)

**Option A: Groq (Recommended - Free!)** 🆓

git clone https://github.com/yourusername/talk2notes.git

1. Go to: https://console.groq.com/keys

2. Sign up with Google/GitHub (30 seconds)cd talk2notes`bash`bash

3. Click "Create API Key"

4. Copy key starting with `gsk_...`



**Option B: OpenAI (Requires Payment)** 💳# Install dependencies# Clone repositorygit clone https://github.com/taufiqelrahman/talk2notes.git && cd talk2notes && ./setup.sh

- Get key: https://platform.openai.com/api-keys

pnpm install

### 3. Configure

git clone https://github.com/yourusername/talk2notes.git```

```bash

# Copy example config# Setup environment

cp .env.example .env

cp .env.example .envcd talk2notes

# Edit and add your API key

nano .env````

```

Or manually:

Add your Groq key:

```env## 2. Configure

AI_PROVIDER=groq

GROQ_API_KEY=gsk_your_actual_key_here# Install dependencies

GROQ_TRANSCRIPTION_MODEL=whisper-large-v3

GROQ_SUMMARIZATION_MODEL=llama-3.3-70b-versatileEdit `.env` and add your API key:

```

pnpm install```bash

## ▶️ Run

`````env

```bash

pnpm devAI_PROVIDER=openai# 1. Clone

```

OPENAI_API_KEY=sk-your-key-here

Open http://localhost:3000 🎉

```# Setup environmentgit clone https://github.com/taufiqelrahman/talk2notes.git

## 🎯 Your First Transcription



1. **Upload:** Drag & drop an audio/video file

2. **Wait:** Processing takes 30s - 3 min (depending on file size)**Get API Keys:**cp .env.example .envcd talk2notes

3. **View:** See your structured lecture notes

4. **Download:** Export as JSON or Markdown- OpenAI: https://platform.openai.com/api-keys



## 📁 Supported Formats- Groq (faster): https://console.groq.com````



**Audio:** MP3, WAV, M4A, AAC, OGG, FLAC

**Video:** MP4, MKV, MOV, AVI, WEBM

## 3. Install FFmpeg# 2. Install

## 🔧 FFmpeg Setup



If you don't have FFmpeg:

```bash## 2. Configurepnpm install

```bash

# macOS# macOS

brew install ffmpeg

brew install ffmpeg

# Ubuntu/Debian

sudo apt install ffmpeg



# Verify# Ubuntu/DebianEdit `.env` and add your API key:# 3. Configure

ffmpeg -version

```sudo apt install ffmpeg



## 🆚 Provider Comparisoncp .env.example .env



| Feature | Groq (Default) | OpenAI |# Verify

|---------|----------------|--------|

| **Cost** | 🆓 Free | 💰 Paid |ffmpeg -version```envnano .env  # Add your OPENAI_API_KEY

| **Setup** | 30 seconds | Need credit card |

| **Speed** | ⚡ Very Fast | Normal |`````

| **Quality** | ✅ Excellent | ✅ Excellent |

| **Daily Limit** | ~240 hours | Depends on plan |AI_PROVIDER=openai



## ❓ Common Issues## 4. Run



| Problem | Solution |OPENAI_API_KEY=sk-your-key-here# 4. Run

|---------|----------|

| FFmpeg not found | Install: `brew install ffmpeg` (macOS) |````bash

| Port 3000 in use | Run: `PORT=3001 pnpm dev` |

| API key invalid | Check `.env` has correct key (starts with `gsk_` for Groq) |pnpm dev```pnpm dev

| Error 429 quota | Using OpenAI? Switch to Groq (free!) |

``````

## 📚 Next Steps

`````

- Read [Groq Setup Guide](GROQ-SETUP.md) for detailed configuration

- Check [Troubleshooting](TROUBLESHOOTING.md) if you hit issuesOpen http://localhost:3000

- See [Setup Guide](SETUP.md) for advanced configuration

**Get API Keys:**

## 💡 Pro Tips

## 5. Use

1. **Start with Groq** - It's free and fast!

2. **Use files < 10MB** - For fastest processing- OpenAI: https://platform.openai.com/api-keys## Your First Transcription

3. **Video files auto-extract audio** - No need to convert manually

4. **Files 10-25MB auto-compress** - But may take longer1. Upload an audio/video file (drag & drop)



---2. Wait for processing (30s - 3min depending on file size)- Groq (faster): https://console.groq.com



**Total time:** 5 minutes ⏱️  3. View your structured notes

**Cost:** $0 (with Groq) 💸

**Next:** Upload your first lecture! 🎓4. Download as JSON or Markdown1. **Open the app:** http://localhost:3000




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
