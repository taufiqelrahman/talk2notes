# Quick Fix Guide - File Upload Issues

## ⚡ TL;DR - Fast Solutions

### Problem: File upload fails with "Connection error"

**✅ Quick Fix:**

```bash
# Compress your audio to under 10MB
ffmpeg -i your-file.mp3 -ar 16000 -ac 1 -b:a 48k compressed.mp3
```

**Or:** The app now does this automatically! Just restart and retry.

---

## 🎯 File Size Recommendations (Updated v2.1)

| Duration  | File Size | What to Do                                     |
| --------- | --------- | ---------------------------------------------- |
| 0-20 min  | < 10MB    | ✅ Upload directly - Fastest, no compression   |
| 20-50 min | 10-25MB   | ✅ Upload directly - Auto-compressed to ~8MB   |
| 50+ min   | > 25MB    | ⚠️ Compress manually first (exceeds API limit) |

**New in v2.1:** Files 10-25MB now accepted! Auto-compression happens seamlessly during processing.

---

## 🔧 One-Line Fixes

### Audio too large

```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 -b:a 48k output.mp3
```

### Video to audio (compressed)

```bash
ffmpeg -i video.mp4 -vn -ar 16000 -ac 1 -b:a 48k audio.mp3
```

### Split long audio (30-min chunks)

```bash
ffmpeg -i long.mp3 -f segment -segment_time 1800 -c copy part_%03d.mp3
```

### Check file size

```bash
ls -lh your-file.mp3
```

---

## 📋 What Changed in v2.0

### Before (v1.0)

- Files up to 25MB accepted
- Frequent connection errors with files > 10MB
- Manual retry required

### After (v2.0) ✨

- ✅ **Auto-compression** for files > 10MB
- ✅ **3 automatic retries** with smart backoff
- ✅ **Better error messages** with file sizes
- ✅ **Console logging** to see what's happening
- ✅ **Stricter validation** catches issues early

---

## 🎬 For Video Files

Videos are automatically processed:

1. Audio extracted at 48kbps (very efficient)
2. If > 10MB, compressed to ~8MB
3. Transcribed with 3 retry attempts

**Recommended:** Videos under 200MB (~25 minutes)

---

## 📊 Console Output (What to Expect)

### Successful Upload

```
[Transcription] Audio file size: 8.45MB
[Transcription] Attempt 1/3...
[Transcription] Uploading 8861184 bytes to OpenAI...
[Transcription] Success! Duration: 1245.32s
```

### Auto-Compression

```
[Transcription] Audio file size: 16.32MB
[Transcription] File > 10MB, compressing for better reliability...
[Compress] Current size: 16.32MB, target: 8MB
[Compress] Compressing with 48kbps (duration: 2145.67s)
[Compress] Compressed to 7.98MB
[Transcription] Using compressed audio: 7.98MB
[Transcription] Attempt 1/3...
[Transcription] Success! Duration: 2145.67s
```

### Retry After Failure

```
[Transcription] Attempt 1/3...
[Transcription] Attempt 1 failed: read ECONNRESET
[Transcription] Waiting 2s before retry...
[Transcription] Attempt 2/3...
[Transcription] Success! Duration: 1245.32s
```

---

## ❌ When to Give Up

If you see this after 3 retries:

```
Failed to transcribe after 3 attempts
```

**Try:**

1. Compress file manually to under 8MB
2. Split into smaller chunks (< 20 min each)
3. Check internet connection
4. Try again later (OpenAI API might be busy)

---

## 🔍 Debug Checklist

- [ ] File is under 10MB (check with `ls -lh`)
- [ ] Dev server restarted after config changes
- [ ] Console shows compression happening
- [ ] Internet connection is stable
- [ ] OpenAI API key is valid
- [ ] Tried with a tiny test file (1 min audio)

---

## 💡 Pro Tips

1. **Best reliability:** Keep files under 10MB
2. **For long content:** Split into 20-minute chunks
3. **Optimal format:** MP3, 16kHz, mono, 48kbps
4. **Watch console:** Logs show exactly what's happening
5. **Auto-retry:** Wait for all 3 attempts before giving up

---

## 🆘 Still Not Working?

1. **Test with small file:**

   ```bash
   # Create 1-minute silent test file
   ffmpeg -f lavfi -i anullsrc -t 60 -ar 16000 -ac 1 -b:a 48k test.mp3
   ```

2. **Check OpenAI API:**

   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. **View full logs:**
   - Open browser console (F12)
   - Check terminal where `pnpm dev` is running

4. **Create GitHub issue:**
   Include:
   - File size (`ls -lh`)
   - Console logs
   - Error message
   - What you tried

---

## 📚 More Help

- **Detailed guide:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Setup:** [SETUP.md](SETUP.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **GitHub Issues:** [Report a bug](https://github.com/taufiqelrahman/talk2notes/issues)
