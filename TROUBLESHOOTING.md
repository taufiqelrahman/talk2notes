# Troubleshooting Guide

Common issues and their solutions for Talk2Notes.

## 🔴 Connection Errors

### Error: `Connection to OpenAI API failed` or `ECONNRESET`

**Cause**: This typically occurs when:

- Audio file is too large (even under 25MB, files over 10MB can be unstable)
- Network connection is unstable during upload
- Upload timeout during large file transfer

**✅ Automatic Fix (v2.0+)**:
The app now **automatically compresses** audio files over 10MB to ~8MB before transcription for maximum reliability.

**Manual Solutions**:

1. **Use files under 10MB** (recommended for best reliability):

   ```bash
   # Check file size
   ls -lh your-file.mp3

   # Compress to optimal size
   ffmpeg -i input.mp3 -ar 16000 -ac 1 -b:a 48k output.mp3
   ```

2. **For audio files 10-25MB**:
   - App will auto-compress (watch console logs)
   - May take longer but should work
   - If fails, manually compress to under 10MB

3. **For video files**:
   - Videos are extracted at 48kbps (very small)
   - Keep videos under 200MB
   - Recommended: Videos under 25 minutes
   - Auto-compression applies to extracted audio

4. **Check console logs**:

   ```
   [Transcription] File size: 16.32MB
   [Transcription] File > 10MB, compressing...
   [Compress] Compressing with 48kbps
   [Compress] Compressed to 8.14MB
   [Transcription] Attempt 1/3...
   ```

5. **Network issues**:
   - App retries 3 times with exponential backoff
   - Each retry waits: 2s, 4s, 8s
   - Check your internet connection if all retries fail

---

## 📦 Body Size Limit Errors

### Error: `Body exceeded 1 MB limit`

**Cause**: Next.js default limit for Server Actions is 1MB.

**Solution**: Already fixed in `next.config.js`:

```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '100mb',
  },
}
```

**If still occurs**:

1. Restart the dev server:

   ```bash
   # Stop server (Ctrl+C)
   pnpm dev
   ```

2. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

---

## 🎵 FFmpeg Errors

### Error: `spawn /usr/local/bin/ffprobe ENOENT` or `FFmpeg not found`

**Cause**: FFmpeg is not installed, or the app can't find it.

**✅ Quick Fix (3 steps)**:

```bash
# Step 1: Find your FFmpeg paths
pnpm find:ffmpeg

# Step 2: Copy the paths shown, create .env.local:
cp .env.example .env.local

# Step 3: Edit .env.local and add the paths (uncomment and set):
# FFMPEG_PATH=/opt/homebrew/bin/ffmpeg
# FFPROBE_PATH=/opt/homebrew/bin/ffprobe

# Then restart: pnpm dev
```

**Detailed Solutions**:

1. **Check installation status**:

   ```bash
   # Run the finder script
   pnpm find:ffmpeg

   # This will:
   # - Find FFmpeg on your system
   # - Test if it works
   # - Show exact paths to add to .env.local
   ```

2. **If FFmpeg is NOT installed**:

   **macOS:**

   ```bash
   # Install with Homebrew
   brew install ffmpeg

   # Find paths after install
   pnpm find:ffmpeg
   ```

   **Ubuntu/Debian:**

   ```bash
   sudo apt update && sudo apt install ffmpeg
   ```

   **Windows:**
   - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Extract and add to PATH
   - Restart terminal/IDE

3. **If FFmpeg IS installed but not detected**:

   ```bash
   # Find the actual paths
   which ffmpeg
   which ffprobe

   # Or use the helper
   pnpm find:ffmpeg
   ```

   Then create `.env.local` (copy from `.env.example`) and add:

   ```bash
   FFMPEG_PATH=/actual/path/to/ffmpeg
   FFPROBE_PATH=/actual/path/to/ffprobe
   ```

   **Common paths**:
   - macOS (M1/M2): `/opt/homebrew/bin/ffmpeg`
   - macOS (Intel): `/usr/local/bin/ffmpeg`
   - Linux: `/usr/bin/ffmpeg`

4. **Verify it works**:

   ```bash
   # Test the binaries directly
   /opt/homebrew/bin/ffmpeg -version
   /opt/homebrew/bin/ffprobe -version
   ```

5. **After configuration**:

   ```bash
   # MUST restart the dev server
   # Stop with Ctrl+C, then:
   pnpm dev
   ```

**Auto-detection (v2.1+)**:

- App tries to find FFmpeg automatically
- Checks: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/opt/local/bin`
- If auto-detection fails, manual configuration via `.env.local` is required

**Still not working?**

1. Make sure FFmpeg is executable: `ls -la $(which ffmpeg)`
2. Check file permissions: `chmod +x /path/to/ffmpeg /path/to/ffprobe`
3. Verify PATH in dev server: Add `console.log(process.env.PATH)` to see environment

### Error: `FFmpeg extraction failed`

**Other Causes & Solutions**:

1. **Corrupted video file**:
   ffmpeg -version

   # Install on macOS

   brew install ffmpeg

   # Install on Ubuntu

   sudo apt install ffmpeg

   ```

   ```

2. **Corrupted video file**:
   - Try another video file
   - Re-download or re-encode the video

3. **Unsupported codec**:
   - Convert to supported format:
     ```bash
     ffmpeg -i input.mkv -c:v libx264 -c:a aac output.mp4
     ```

---

## 🔑 API Key Issues

### Error: `API key not configured`

**Solution**:

1. Create `.env.local` file:

   ```bash
   cp .env.example .env.local
   ```

2. Add your OpenAI API key:

   ```bash
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. Restart server:
   ```bash
   pnpm dev
   ```

### Error: `Invalid API key`

**Solutions**:

- Verify key is correct (starts with `sk-`)
- Check key hasn't expired at [platform.openai.com](https://platform.openai.com/)
- Ensure no extra spaces or quotes in `.env.local`

---

## 💾 File Upload Issues

### Error: `File validation failed`

**Common causes**:

1. **File too large**:
   - Audio: Max 25MB
   - Video: Estimated audio output must be under 25MB
   - Recommended: Videos under 45 minutes

2. **Unsupported format**:
   - Supported audio: mp3, wav, m4a, aac, ogg, flac
   - Supported video: mp4, mkv, mov, avi, webm

3. **Corrupted file**:
   - Re-download or re-create the file
   - Try converting to a standard format

---

## 🐌 Performance Issues

### Transcription taking too long

**Normal processing times**:

- 1 minute audio: ~10-30 seconds
- 10 minute audio: ~1-3 minutes
- 30 minute audio: ~3-8 minutes

**If slower than expected**:

1. **Check file size**:
   - Larger files take longer to upload and process
   - Compress audio before upload

2. **OpenAI API load**:
   - Processing time varies based on API load
   - Try during off-peak hours

3. **Network speed**:
   - Upload speed affects initial transfer
   - Test your connection: [fast.com](https://fast.com)

---

## 🔧 Development Environment

### Port already in use

**Error**: `Port 3000 is already in use`

**Solution**:

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Start server
pnpm dev
```

### Module not found errors

**Solution**:

```bash
# Remove node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml

# Reinstall dependencies
pnpm install
```

### TypeScript errors

**Solution**:

```bash
# Type check
pnpm type-check

# Clear Next.js cache
rm -rf .next

# Restart dev server
pnpm dev
```

---

## 📊 File Size Guidelines (Updated v2.1)

### ✅ Recommended Limits (Best Reliability)

| File Type   | Recommended      | Max Allowed  | Notes                      |
| ----------- | ---------------- | ------------ | -------------------------- |
| Audio (mp3) | **< 10MB**       | **25MB** ✨  | Auto-compressed if 10-25MB |
| Video (mp4) | **< 300MB**      | **500MB** ✨ | Audio extracted at 48kbps  |
| Duration    | **< 25 minutes** | ~60 minutes  | Longer = larger files      |

**✨ New in v2.1:** Increased limits! Files up to 25MB (audio) and 500MB (video) now accepted with automatic compression.

### 🎯 Target Quality Settings

For best results, use these FFmpeg settings:

```bash
# Optimal audio for transcription (48kbps, ~0.36MB/minute)
ffmpeg -i input.mp3 -ar 16000 -ac 1 -b:a 48k output.mp3

# Good quality (64kbps, ~0.48MB/minute)
ffmpeg -i input.mp3 -ar 16000 -ac 1 -b:a 64k output.mp3
```

### 📐 Calculate Audio File Size

```
File Size (MB) = (Bitrate in kbps × Duration in seconds) / 8192
```

Example for 30 minutes at 64kbps:

```
(64 × 1800) / 8192 = 14MB ✅
```

---

## 🆘 Still Having Issues?

1. **Check logs**:
   - Server logs in terminal
   - Browser console (F12)

2. **Enable debug mode**:

   ```bash
   NODE_ENV=development pnpm dev
   ```

3. **Test with small file**:
   - Try with a 1-minute audio clip
   - If works, issue is file size related

4. **Create GitHub issue**:
   - Include error message
   - File type and size
   - Steps to reproduce

---

## 📝 Optimization Tips

### For best results:

1. **Prepare audio files**:

   ```bash
   # Convert to optimal format
   ffmpeg -i input.wav \
     -ar 16000 \
     -ac 1 \
     -b:a 64k \
     output.mp3
   ```

2. **Split long recordings**:

   ```bash
   # Split 2-hour file into 30-minute chunks
   ffmpeg -i long-audio.mp3 -f segment -segment_time 1800 -c copy chunk_%03d.mp3
   ```

3. **Monitor file sizes**:

   ```bash
   # Check all files in uploads
   du -h uploads/
   ```

4. **Clean up old files**:
   ```bash
   # Remove files older than 7 days
   find uploads/ -mtime +7 -delete
   ```
