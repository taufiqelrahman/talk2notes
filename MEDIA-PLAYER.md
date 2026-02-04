# Media Player Feature

## Overview

Fitur media player memungkinkan pengguna untuk memutar kembali video/audio **hanya untuk YouTube dan Direct URL sources** dengan tampilan compact floating yang modern.

### ✨ Key Features

- **Compact Floating Design**: Player berukuran 320px yang mengapung di pojok kanan atas
- **Smart Sticky**: Otomatis floating saat scroll melewati posisi player, kembali normal saat scroll up
- **Minimize/Expand**: Toggle visibility untuk hemat ruang layar
- **Colorful Themes**: Merah untuk YouTube, biru untuk media URLs
- **Smooth Animations**: Transisi halus untuk semua interaksi

### ⚠️ Important Note

**Media player HANYA tersedia untuk:**

- ✅ **YouTube URLs**: Video langsung dari YouTube (red theme)
- ✅ **Direct Media URLs**: Link langsung ke file audio/video (blue theme)

**TIDAK tersedia untuk:**

- ❌ File upload lokal (MP3, MP4, dll yang di-upload dari komputer)

### Why Only URLs?

- **No Storage Needed**: URL sources tidak perlu disimpan, langsung diakses dari sumbernya
- **Serverless-Friendly**: Tidak perlu filesystem atau cloud storage
- **Always Available**: Selama sumber masih online, bisa diplay kapan saja
- **No Size Limits**: Tidak terbatas ukuran localStorage

## Features

### Compact Floating Player

- **Picture-in-Picture Style**: 320px width, floats at top-right corner
- **Smart Positioning**: Fixed position only when scrolled past original location
- **Responsive Behavior**: Returns to normal when scrolling back up
- **Smooth Transitions**: 300ms duration for all position changes
- **Z-Index Management**: z-40 to stay above content
- **Shadow Effects**: Enhanced shadow when floating

### Minimize/Expand Controls

- **Toggle Button**: Click to minimize/expand player
- **Compact Mode**: Only shows header bar when minimized
- **Visual Indicators**: Up/down arrow icons
- **State Persistence**: Remembers state during session

### Colorful Themes

**YouTube Player (Red Theme)**:

- Background: `bg-red-50` (light pink/red)
- Border: `border-red-300`
- Text: `text-red-900` (dark red)
- Icons: `text-red-600`, `text-red-700`
- Hover: `hover:bg-red-100`

**Media URL Player (Blue Theme)**:

- Background: `bg-blue-50` (light blue)
- Border: `border-blue-300`
- Text: `text-blue-900` (dark blue)
- Icons: `text-blue-600`, `text-blue-700`
- Hover: `hover:bg-blue-100`

### YouTube Integration

- **YouTube Embed**: Video YouTube di-embed langsung
- **Full Player Controls**: Play, pause, seek, volume, fullscreen
- **Auto-detect**: Otomatis deteksi YouTube URL dan convert ke embed
- **16:9 Aspect Ratio**: Responsive video dengan aspect ratio standar

### Direct URL Support

- **HTML5 Video**: Playback langsung dari URL media
- **Multiple Formats**: Support format yang didukung browser
- **Stream-friendly**: Tidak perlu download seluruh file

## Technical Implementation

### Components

#### MediaPlayer Component

**Location**: `components/media-player.tsx`

```tsx
interface MediaPlayerProps {
  sourceUrl: string; // YouTube URL or direct media URL
  sourceType: 'youtube' | 'url'; // Type of source
  fileName: string; // Original filename for display
}
```

**Key Features**:

- **Sticky Scroll Detection**: Uses `useRef` and scroll event listener
- **Original Position Tracking**: Stores initial position to determine when to float
- **State Management**: `isSticky` and `isMinimized` states
- **Conditional Styling**: Dynamic classes based on sticky/minimized state
- **YouTube URL Parsing**: Auto-detect and convert to embed URL
- **HTML5 Video**: For direct media URLs with preload metadata
- **Error Handling**: Graceful fallback for invalid URLs
- **Colorful Themes**: Red for YouTube, blue for media URLs
- **Responsive Design**: 320px when floating, full-width when normal

**Sticky Behavior Logic**:

```typescript
const originalTopRef = useRef<number>(0);
const [isSticky, setIsSticky] = useState(false);

useEffect(() => {
  // Store original position on mount
  if (playerRef.current && originalTopRef.current === 0) {
    originalTopRef.current = playerRef.current.getBoundingClientRect().top + window.scrollY;
  }

  const handleScroll = () => {
    if (playerRef.current && originalTopRef.current > 0) {
      const scrollY = window.scrollY;
      // Stick when scrolled past original position minus offset
      const shouldStick = scrollY > originalTopRef.current - 70;
      setIsSticky(shouldStick);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**YouTube URL Parsing**:

```typescript
const getYouTubeEmbedUrl = (url: string): string | null => {
  // Supports:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // Returns: https://www.youtube.com/embed/VIDEO_ID
};
```

### Data Storage

#### Metadata Structure

**Location**: `types/index.ts`

```typescript
export interface NotesMetadata {
  // ... existing fields
  sourceUrl?: string; // YouTube or media URL
  sourceType?: 'youtube' | 'url'; // Source type
}
```

Only YouTube and direct URL sources will have these fields populated.

#### Action Updates

**Location**: `actions/transcription.ts`

**For YouTube**:

```typescript
return {
  success: true,
  data: {
    ...lectureNotes,
    transcript: formattedTranscript,
    metadata: {
      ...lectureNotes.metadata,
      sourceUrl: youtubeUrl,
      sourceType: 'youtube' as const,
    },
  },
};
```

**For Direct URLs**:

````typescript
return {
  success: true,
  data: {
    ...lectureNotes,
    transcript: formattedTranscript,
    metadata: {
      ...lectureNotes.metadata,
      sourceUrl: mediaUrl,
      sourceType: 'url' as const,
    },
  },
};Features**:
1. Conditional rendering based on sourceUrl and sourceType
2. Info banner explaining feature limitation
3. Positioned between header and tabs

**Code Example**:
```tsx
{notes.metadata.sourceUrl && notes.metadata.sourceType && (
  <div className="p-6 border-b border-gray-200">
    {/* Info note */}
    <div className="mb-3 flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-md">
      <span>
        <strong>Media Player:</strong> This feature is available for YouTube
        and direct URL sources only. File uploads are not stored for playback.
      </span>
    </div>
    {/* Player */}
    <MediaPlayer
      sourceUrl={notes.metadata.sourceUrl}
      sourceType={notes.metadata.sourc
1. Import MediaPlayer component
2. Conditional rendering based on metadata availability
3. Positioned between header and tabs

**Code Example**:
```tsx
{notes.metadata.fileUrl && notes.metadata.mimeType && (
  <div className="p-6 border-b border-gray-200">
    <MediaPlayer
      fileUrl={notes.metadata.fileUrl}
      mimeType={notes.metadata.mimeType}
      fileName={notes.metadata.originalFilename}
    />
  </div>
)}
````

## File Management

### Storage

- **Directory**: `uploads/` (project root)
- **Naming**: Timestamp-based unique filenames
- **Persistence**: Files are kept for playback (not auto-deleted)

### Cleanup Considerations

Files should be manually cleaned up periodically to manage disk space:

```bash
# Example: Delete files older than 7 days
findLocation**: Browser localStorage (as base64 data URL)
- **Persistence**: Permanent until user clears browser data
- **Size**: Limited by localStorage quota (5-10MB typically)
- **Server**: No files stored on server after processing

### Cleanup
- **Automatic**: Files are automatically deleted from server after transcription
- **Manual**: Users can clear browser data to remove stored files
- **History**: Clearing history also removes associated file data

### Size Optimization
Files are automatically optimized:
1. Videos: Audio track extracted, video discarded
2. Large files (>10MB): Compressed to ~8MB target
3. Format: MP3 for universal compatibility
4. Bitrate: Reduced for smaller size while maintaining clarity
- OGG (most browsers)
- AAC (most browsers)

**Video**:
- MP4/H.264 (widely supported)
- WebM (modern browsers)
- OGG (most browsers)

### Fallback Behavior
- Displays error message for unsupported formats
- Browser's native controls handle playback capabilities
- No custom codec implementation required

## Testing

### Manual Testing Steps

## Testing

### Manual Testing Steps

1. **YouTube URL**
   - Submit a YouTube URL
   - Verify YouTube embed appears in notes
   - Test video playback controls
   - Verify responsive layout

2. **Direct Media URL**
   - Submit a direct URL to an MP3/MP4 file
   - Verify HTML5 player appears
   - Test play/pause/seek functionality

3. **File Upload**
   - Upload an MP3 or MP4 file
   - Verify **NO player appears** (expected behavior)
   - Verify info note is NOT shown
   - Confirm notes are generated correctly

4. **History Integration**
   - Save YouTube/URL notes to history
   - Load from history
   - Verify player still works with historical data

## Advantages of URL-Only Approach

### For Serverless Deployment
✅ **No storage needed**: Perfect for Vercel, Netlify, Fly.io
✅ **No cloud costs**: No S3, R2, or CDN required
✅ **Scalable**: Each user streams from original source
✅ **Simple**: No file management needed

### For Users
✅ **No size limits**: Can play videos of any length
✅ **Always fresh**: Always plays from original source
✅ **No storage quota**: Doesn't use localStorage/browser storage
✅ **HD Quality**: Full quality from original source

### Limitations
⚠️ **Source availability**: Only works if URL is still active
⚠️ **File uploads excluded**: Local files are not stored
⚠️ **Internet required**: Cannot play offline
⚠️ **CORS issues**: Some URLs may block embedding
1. **Playback Speed Control**: Allow users to adjust playback speed (0.5x, 1x, 1.5x, 2x)
2. **Timestamp Sync**: Click on transcript segments to jump to that point in audio/video
3. **Download Button**: Direct download of original media file
4. **Waveform Visualization**: Visual audio waveform for easier navigation
5.File size validation (max 100MB upload)
✅ MIME type validation
✅ Magic bytes verification
✅ Client-side storage (no server exposure)
✅ Base64 encoding

### Privacy Benefits
✅ **No server storage**: Files not kept on server after processing
✅ **User-controlled**: Users can clear their own data
✅ **No tracking**: No server-side file access logs
✅ **Local only**: Data stays in user's browser

### Considerations
- **XSS Protection**: Base64 data URLs are safe from XSS when properly handled
- **Storage Quota**: Browser enforces automatic limits
- **Data Retention**: Users control their own data retention
✅ Filename sanitization

### Additional Considerations
- **Access Control**: Currently no authentication on file access
- **Rate Limiting**: Consider adding rate limits to file endpoint
- **Encryption**: Consider encrypting sensitive audio content
- **Audit Logging**: Track file access for security monitoring

### Recommendations for Production
1. Add authentication to `/api/uploads/` endpoint
2. Implement per-user storage quotas
3. Add rate limiting to prevent abuse
4. Ccomponents/
│   ├── media-player.tsx       # Player component
│   ├── upload.tsx             # File upload with base64 conversion
│   └── notes-display.tsx      # Display with player integration
├── actions/
│   └── transcription.ts       # Handles base64 storage in metadata
└── types/
    └── index.ts               # Metadata with fileUrl (base64)
```

## Troubleshooting

### Player Not Appearing

- Check if `fileUrl` and `mimeType` exist in metadata
- Verify base64 data URL format starts with `data:`
- Check browser console for errors
- Verify localStorage has space available

### File Not Playing

- Verify MIME type is correct
- Check if browser supports the codec
- Verify base64 string is not corrupted
- Check if localStorage quota exceeded

### localStorage Full Error

- File too large (>10MB): Should be auto-compressed
- Clear old history items to free space
- Check total localStorage usage in DevTools
- Try smaller file or different browser

### Missing File After Refresh

- Check if localStorage was cleared
- Verify file was saved to history
- Check browser privacy settings (incognito mode clears on close)

---

**Version**: 2.0 (LocalStorage Implementation)

- Verify filename in URL matches file in `uploads/`
- Check for special characters in filename
- Ensure file wasn't deleted

### Performance Issues

- Large files may take time to load
- Consider implementing progressive loading
- Check network speed and file size
- Use compressed formats when possible

---

**Version**: 1.0  
**Last Updated**: February 4, 2026  
**Author**: Talk2Notes Development Team
