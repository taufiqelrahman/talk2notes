# URL Source Feature

## Overview

Talk2Notes now supports three input methods for audio/video content:

1. **File Upload** - Upload audio/video files directly from your device
2. **YouTube URL** - Download and transcribe YouTube videos
3. **Media URL** - Download and transcribe media from any direct URL

## Media URL Feature

### What is it?

The Media URL feature allows you to transcribe audio/video content directly from URLs without downloading them to your device first.

### Supported URLs

- Direct links to audio files (MP3, WAV, M4A, AAC, OGG, FLAC)
- Direct links to video files (MP4, MKV, MOV, AVI, WEBM)
- Google Drive public links (must be set to "Anyone with the link")
- Dropbox public links
- Any publicly accessible media URL

### How to Use

1. Click the "🔗 URL" tab on the upload form
2. Paste the direct URL to your media file
3. Select your preferred output language (English, Bahasa Indonesia, or Arabic)
4. Click "Generate Lecture Notes"

### Requirements

- The URL must be a **direct download link** to the media file
- The file must be publicly accessible (no authentication required)
- Maximum file size: 50MB (larger files will be compressed)

### Examples of Valid URLs

```
https://example.com/audio/lecture.mp3
https://drive.google.com/uc?id=FILE_ID&export=download
https://www.dropbox.com/s/XXXXX/audio.mp3?dl=1
```

### Technical Details

- Audio is automatically downloaded to the server
- Large files (>24MB) are automatically compressed for optimal transcription
- The same AI transcription and summarization pipeline is used as file uploads
- Temporary files are cleaned up after processing

### Rate Limits

The same rate limits apply as file uploads:

- **Hourly limit**: 10 transcriptions per hour
- **Daily limit**: 50 transcriptions per day

### Troubleshooting

#### "Failed to download media" Error

- Verify the URL is publicly accessible
- Check if the URL is a direct link to the media file
- Ensure the URL is not behind authentication
- Try opening the URL in a browser to confirm it downloads

#### "Invalid media URL" Error

- Ensure the URL starts with `http://` or `https://`
- Check for typos in the URL
- Verify the URL format is correct

## Implementation Files

### Frontend

- [`components/upload.tsx`](components/upload.tsx) - Upload form with URL input
- [`components/history.tsx`](components/history.tsx) - History display with URL source indicator

### Backend

- [`lib/media-downloader.ts`](lib/media-downloader.ts) - URL download utility
- [`actions/transcription.ts`](actions/transcription.ts) - Transcription action with URL support

### Types

- [`types/index.ts`](types/index.ts) - Type definitions with `mediaUrl` support

## Future Enhancements

- [ ] Support for authentication (API keys, OAuth)
- [ ] Better error messages with URL validation
- [ ] Support for playlist URLs
- [ ] Support for streaming URLs
- [ ] Progress indicator for large downloads
