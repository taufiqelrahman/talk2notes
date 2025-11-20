# FFmpeg Configuration Fix

## Problem

Error: `spawn /usr/local/bin/ffprobe ENOENT` meskipun FFmpeg sudah terinstall.

## Root Cause

Auto-detection FFmpeg berhasil menemukan path saat module load, tapi path tersebut tidak bisa dieksekusi saat runtime.

## Solution

### 1. Find FFmpeg Paths

```bash
pnpm find:ffmpeg
```

Script ini akan:

- ✓ Mencari FFmpeg di sistem Anda
- ✓ Test apakah binary bisa dijalankan
- ✓ Menampilkan path yang harus dimasukkan ke `.env.local`

### 2. Configure Environment

Buat file `.env.local` (copy dari .env.example):

```bash
cp .env.example .env.local
```

Edit `.env.local` dan uncomment/isi dengan path yang benar:

```bash
# Contoh untuk M1/M2 Mac
FFMPEG_PATH=/opt/homebrew/bin/ffmpeg
FFPROBE_PATH=/opt/homebrew/bin/ffprobe

# Atau untuk Intel Mac
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe
```

### 3. Restart Server

```bash
# Stop dengan Ctrl+C
pnpm dev
```

## Changes Made

### 1. `lib/ffmpeg.ts`

- **Detection Strategy**: Simplified to check file existence instead of running `-version` at module load
- **Runtime Validation**: Validation now runs when needed, not at startup
- **Better Error Messages**: Shows tried paths and suggests alternatives

### 2. `scripts/find-ffmpeg.sh` (NEW)

- Comprehensive FFmpeg finder
- Tests common paths: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/opt/local/bin`
- Verifies binaries are executable
- Outputs exact configuration for `.env.local`

### 3. `.env.local.template` (NEW)

- Template file for environment configuration
- Includes common FFmpeg paths for different platforms
- Clear instructions

### 4. Updated Documentation

- **TROUBLESHOOTING.md**: Added detailed FFmpeg troubleshooting section
- **package.json**: Added `find:ffmpeg` script
- **.env.example**: Updated with better FFmpeg configuration comments

## Why This Works

**Before**:

- Auto-detection ran at module load time
- Used `execSync` with `-version` which might hang or fail
- No fallback if detection succeeded but execution failed at runtime

**After**:

- Lightweight file existence check at module load
- Runtime validation only when needed
- Manual override via `.env.local` always takes precedence
- Comprehensive error messages with suggestions

## Testing

After configuration, test video upload:

```bash
# Upload a small video file through the web UI
# Watch server logs for:
[FFmpeg] Found ffmpeg at: /opt/homebrew/bin/ffmpeg
[FFmpeg] Found ffprobe at: /opt/homebrew/bin/ffprobe
[FFmpeg] ✓ ffmpeg is working
[FFmpeg] ✓ ffprobe is working
```

## If Still Not Working

1. **Check binary permissions**:

   ```bash
   ls -la /opt/homebrew/bin/ffmpeg
   ls -la /opt/homebrew/bin/ffprobe
   ```

2. **Test binaries directly**:

   ```bash
   /opt/homebrew/bin/ffmpeg -version
   /opt/homebrew/bin/ffprobe -version
   ```

3. **Verify installation**:

   ```bash
   brew list ffmpeg
   brew info ffmpeg
   ```

4. **Reinstall if needed**:
   ```bash
   brew uninstall ffmpeg
   brew install ffmpeg
   pnpm find:ffmpeg
   ```

## Alternative: System PATH

If you want the app to use FFmpeg from PATH instead of hardcoded paths, you can leave `FFMPEG_PATH` and `FFPROBE_PATH` unset in `.env.local`. The app will fallback to using the binary name (relies on system PATH).

This only works if FFmpeg is properly in your PATH:

```bash
which ffmpeg  # Should return a path
echo $PATH    # Should include FFmpeg's directory
```
