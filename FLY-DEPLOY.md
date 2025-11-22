# Deploy Talk2Notes to Fly.io

Complete guide to deploy Talk2Notes to Fly.io's free tier.

## Prerequisites

- Fly.io account (sign up at https://fly.io/app/sign-up)
- Flyctl CLI installed
- Groq API key (or other AI provider key)

## Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Or using curl
curl -L https://fly.io/install.sh | sh
```

Verify installation:

```bash
flyctl version
```

## Step 2: Login to Fly.io

```bash
flyctl auth login
```

This will open a browser for authentication.

## Step 3: Create Fly.io Configuration

Run this command in your project directory:

```bash
flyctl launch --no-deploy
```

When prompted:

- **App name**: Choose a unique name (e.g., `talk2notes-yourname`)
- **Region**: Choose closest to you (e.g., `sin` for Singapore, `nrt` for Tokyo)
- **Database**: Skip (select No)
- **Redis**: Skip (select No)

This will create a `fly.toml` file.

## Step 4: Configure fly.toml

Update the generated `fly.toml` file with this configuration:

```toml
app = "your-app-name"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

## Step 5: Set Environment Variables

Set your API keys as secrets (they won't be in fly.toml):

```bash
# For Groq (recommended - free)
flyctl secrets set AI_PROVIDER=groq
flyctl secrets set GROQ_API_KEY=gsk_your_key_here
flyctl secrets set GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
flyctl secrets set GROQ_SUMMARIZATION_MODEL=llama-3.3-70b-versatile

# Or for OpenAI
flyctl secrets set AI_PROVIDER=openai
flyctl secrets set OPENAI_API_KEY=sk-your_key_here
flyctl secrets set OPENAI_TRANSCRIPTION_MODEL=whisper-1
flyctl secrets set OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview
```

## Step 6: Update Dockerfile (if needed)

Your existing Dockerfile should work, but ensure it has:

```dockerfile
FROM node:18-alpine AS base

# Install FFmpeg (important!)
RUN apk add --no-cache ffmpeg

# Install yt-dlp for YouTube support
RUN apk add --no-cache python3 py3-pip
RUN pip3 install yt-dlp

# ... rest of your Dockerfile
```

## Step 7: Update next.config.js

Add standalone output for Fly.io:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

module.exports = nextConfig;
```

## Step 8: Deploy!

```bash
flyctl deploy
```

This will:

1. Build your Docker image
2. Push to Fly.io registry
3. Deploy to your selected region
4. Start your app

## Step 9: Access Your App

```bash
flyctl open
```

Or visit: `https://your-app-name.fly.dev`

## Step 10: Monitor

Check logs:

```bash
flyctl logs
```

Check status:

```bash
flyctl status
```

Check resource usage:

```bash
flyctl scale show
```

## Important Notes

### ⚠️ Free Tier Limitations

- **RAM**: 256MB (may be tight for large files)
- **Storage**: 3GB persistent storage (sufficient for temp files)
- **CPU**: Shared CPU (may be slower)

### 🎯 Optimization Tips

1. **File Size Limits**: Consider reducing `MAX_FILE_SIZE_MB` in production:

   ```bash
   flyctl secrets set MAX_FILE_SIZE_MB=50
   ```

2. **Auto-scaling**: App will auto-stop when idle and start on request (cold start ~5-10 seconds)

3. **Memory Issues**: If you hit memory limits, upgrade to 512MB:
   ```bash
   flyctl scale memory 512
   ```
   Note: This moves you to paid tier (~$2-3/month)

### 🔧 Troubleshooting

**Problem**: Out of memory errors

**Solution**:

```bash
flyctl scale memory 512
```

**Problem**: Slow cold starts

**Solution**: Keep 1 machine always running (costs ~$2/month):

```toml
[http_service]
  min_machines_running = 1
```

**Problem**: FFmpeg not found

**Solution**: Ensure Dockerfile includes:

```dockerfile
RUN apk add --no-cache ffmpeg
```

**Problem**: YouTube downloads fail

**Solution**: Install yt-dlp in Dockerfile:

```dockerfile
RUN apk add --no-cache python3 py3-pip
RUN pip3 install yt-dlp
```

## Updating Your App

After making changes:

```bash
# Commit your changes
git add .
git commit -m "Update app"

# Deploy
flyctl deploy
```

## Cost Estimate

- **Free tier**: 3 shared-cpu VMs with 256MB RAM
- **With 512MB RAM**: ~$2-3/month
- **Always-on (min 1 machine)**: ~$2/month additional

## Useful Commands

```bash
# View app info
flyctl info

# SSH into machine
flyctl ssh console

# View secrets
flyctl secrets list

# Scale vertically
flyctl scale memory 512
flyctl scale count 2

# Delete app (if needed)
flyctl apps destroy your-app-name
```

## Next Steps

1. ✅ Deploy successfully
2. Test with a small audio file
3. Monitor memory usage with `flyctl logs`
4. If memory issues, upgrade to 512MB
5. Set up custom domain (optional)

## Resources

- Fly.io Docs: https://fly.io/docs/
- Fly.io Status: https://status.fly.io/
- Community: https://community.fly.io/

---

**Note**: This deployment includes FFmpeg and yt-dlp, so all features (video, YouTube) will work on Fly.io! 🚀
