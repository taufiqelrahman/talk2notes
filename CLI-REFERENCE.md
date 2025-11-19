# CLI Reference & Quick Commands

Complete command-line reference for Talk2Notes with quick cheatsheet.

## 🚀 Quick Start Commands

```bash
# Clone and start
git clone https://github.com/taufiqelrahman/talk2notes.git
cd talk2notes
pnpm install
cp .env.example .env
# Edit .env with your API keys
pnpm dev
```

## 📦 Package Manager Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm build                # Build for production
pnpm start                # Start production server
pnpm lint                 # Run ESLint
pnpm type-check           # TypeScript type checking
pnpm format               # Format with Prettier
pnpm format:check         # Check formatting
```

## 🔧 Setup & Configuration

### FFmpeg Installation

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html

# Verify installation
ffmpeg -version
```

### Environment Configuration

**Minimum .env:**

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

**Full configuration:**

```env
# AI Provider (openai|groq|deepgram|anthropic)
AI_PROVIDER=openai

# API Keys (use provider-specific key)
OPENAI_API_KEY=sk-xxxxx
GROQ_API_KEY=gsk-xxxxx
DEEPGRAM_API_KEY=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Upload Configuration
MAX_FILE_SIZE_MB=100
ALLOWED_AUDIO_FORMATS=mp3,wav,m4a,aac,ogg,flac
ALLOWED_VIDEO_FORMATS=mp4,mkv,mov,avi,webm

# FFmpeg (optional, auto-detected)
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe

# Model Configuration (optional)
OPENAI_TRANSCRIPTION_MODEL=whisper-1
OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview
GROQ_MODEL=mixtral-8x7b-32768
ANTHROPIC_MODEL=claude-3-opus-20240229
```

## 🐳 Docker Commands

```bash
# Build image
docker build -t talk2notes .

# Run container
docker run -p 3000:3000 --env-file .env talk2notes

# Using docker-compose
docker-compose up                  # Start services
docker-compose up -d               # Start in background
docker-compose down                # Stop services
docker-compose logs -f             # Follow logs
docker-compose restart             # Restart services
```

## 🛠️ Development Workflow

### Branch Management

```bash
git checkout -b feat/feature-name   # Create feature branch
git checkout -b fix/bug-name        # Create bugfix branch
git checkout main                   # Switch to main
git pull origin main                # Update main
```

### Code Quality Checks

```bash
# Run all checks before commit
pnpm lint && pnpm type-check && pnpm format:check

# Auto-fix issues
pnpm lint --fix
pnpm format
```

### Commit Guidelines

```bash
# Follow conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update readme"
git commit -m "style: format code"
git commit -m "refactor: restructure code"
git commit -m "test: add tests"
git commit -m "chore: update dependencies"
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Manual Production Deployment

```bash
# Build application
pnpm build

# Start production server
pnpm start

# Or use PM2 for process management
pnpm add -g pm2
pm2 start npm --name "talk2notes" -- start
pm2 save
pm2 startup
```

### Docker Production

```bash
docker-compose -f docker-compose.yml up -d
```

## 🔍 Debugging & Troubleshooting

### Check Prerequisites

```bash
node --version          # Should be 18+
pnpm --version          # Should be 8+
ffmpeg -version         # Should be installed
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Clean Installation

```bash
# Remove all generated files
rm -rf node_modules .next pnpm-lock.yaml

# Fresh install
pnpm install
```

### Clear Cache

```bash
# Clear Next.js cache
rm -rf .next

# Clear pnpm cache
pnpm store prune
```

### Debug Build Issues

```bash
# Verbose build
pnpm build --debug

# Check TypeScript errors
pnpm type-check

# Check for dependency issues
pnpm list
```

## 🧪 Testing & Validation

### File Upload Testing

```bash
# Test with curl
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-audio.mp3"
```

### API Health Check

```bash
curl http://localhost:3000/api/health
```

## 📊 Monitoring & Logs

### View Application Logs

```bash
# Development logs
pnpm dev

# Production logs with PM2
pm2 logs talk2notes
pm2 monit
```

### Docker Logs

```bash
docker-compose logs -f            # All services
docker-compose logs -f app        # Specific service
docker logs <container-id>        # Specific container
```

## 🔐 Security Commands

### Update Dependencies

```bash
# Check for updates
pnpm outdated

# Update all dependencies
pnpm update

# Update specific package
pnpm update <package-name>
```

### Security Audit

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix
```

## 📁 File Management

### Clean Temporary Files

```bash
# Remove uploads directory
rm -rf uploads/*.tmp

# Clean all temporary files
find . -name "*.tmp" -type f -delete
```

### Backup Data

```bash
# Backup .env
cp .env .env.backup

# Backup uploads
tar -czf uploads-backup.tar.gz uploads/
```

## 🎯 Performance Optimization

### Build Analysis

```bash
# Analyze bundle size
ANALYZE=true pnpm build
```

### Production Optimization

```bash
# Enable production optimizations
NODE_ENV=production pnpm build
NODE_ENV=production pnpm start
```

## 🆘 Quick Troubleshooting Guide

| Issue            | Solution                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| FFmpeg not found | `brew install ffmpeg` (macOS) or `sudo apt install ffmpeg` (Linux)        |
| Port in use      | `lsof -ti:3000 \| xargs kill -9`                                          |
| Build fails      | `rm -rf .next node_modules && pnpm install`                               |
| Type errors      | `pnpm type-check` to see details                                          |
| Lint errors      | `pnpm lint --fix` to auto-fix                                             |
| Upload fails     | Check MAX_FILE_SIZE_MB in .env                                            |
| API key invalid  | Verify key in .env file                                                   |
| Out of memory    | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 pnpm build` |

## 📚 Related Documentation

- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Detailed setup guide with pnpm
- [QUICKSTART.md](QUICKSTART.md) - 5-minute quick start
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) - Code organization

---

**Need help?** Open an issue: https://github.com/taufiqelrahman/talk2notes/issues
