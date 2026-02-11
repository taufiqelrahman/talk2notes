# Media Player Feature

## Overview

The media player feature allows users to replay video/audio **only for YouTube and Direct URL sources** with a modern compact floating display.

### ✨ Key Features

- **Compact Floating Design**: 320px player that floats on screen
- **Draggable Player**: Drag & drop player anywhere when floating
- **Smart Edge Snapping**: Automatically snaps to left/right edge when released
- **Smart Sticky**: Automatically floats when scrolling past player position, returns to normal when scrolling back up
- **Minimize/Expand**: Toggle visibility to save screen space
- **Colorful Themes**: Red for YouTube, blue for media URLs
- **Smooth Animations**: Smooth transitions for all interactions (except during drag)
- **Safe Boundaries**: 16px padding from top/bottom edges, 16px left and 32px right padding

### ⚠️ Important Note

**Media player ONLY available for:**

- ✅ **YouTube URLs**: Direct videos from YouTube (red theme)
- ✅ **Direct Media URLs**: Direct links to audio/video files (blue theme)

**NOT available for:**

- ❌ Local file uploads (MP3, MP4, etc. uploaded from computer)

### Why Only URLs?

- **No Storage Needed**: URL sources don't need to be stored, accessed directly from their source
- **Serverless-Friendly**: No filesystem or cloud storage required
- **Always Available**: Can be played anytime as long as the source is still online
- **No Size Limits**: No localStorage size limitations

## Features

### Compact Floating Player

- **Picture-in-Picture Style**: 320px width, floats on screen
- **Draggable Positioning**: Click and drag to reposition player anywhere
- **Smart Edge Snapping**: Automatically snaps to nearest edge (left/right) when released
- **Viewport Boundaries**: Player stays within screen bounds with safe padding
  - 16px padding from top edge
  - 16px padding from bottom edge
  - 16px padding from left edge
  - 32px padding from right edge (more spacious)
- **Text Selection Prevention**: Text doesn't get selected during drag
- **Responsive Dragging**: Player follows cursor immediately without delay
- **Smart Positioning**: Fixed position only when scrolled past original location
- **Initial Position**: Starts at top-right with proper 32px right padding when first becoming sticky
- **Responsive Behavior**: Returns to normal when scrolling back up
- **Smooth Transitions**: 300ms duration for non-drag movements
- **Z-Index Management**: z-40 to stay above content
- **Shadow Effects**: Enhanced shadow when floating
- **Visual Feedback**: Cursor changes to grab/grabbing during drag

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

- **YouTube Embed**: YouTube videos are embedded directly
- **Full Player Controls**: Play, pause, seek, volume, fullscreen
- **Auto-detect**: Automatically detects YouTube URLs and converts to embed
- **16:9 Aspect Ratio**: Responsive video with standard aspect ratio

### Direct URL Support

- **HTML5 Video**: Direct playback from media URL
- **Multiple Formats**: Supports browser-supported formats
- **Stream-friendly**: No need to download entire file

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
- **Drag & Drop**: Full drag functionality with mouse events
- **Position Management**: Dynamic position state with viewport boundary constraints
- **Edge Snapping**: Automatically positions player at nearest edge (left/right)
- **Original Position Tracking**: Stores initial position to determine when to float
- **State Management**: `isSticky`, `isMinimized`, `isDragging`, and `position` states
- **Conditional Styling**: Dynamic classes based on sticky/minimized/dragging state
- **Text Selection Prevention**: `e.preventDefault()` and `select-none` class
- **Responsive Transitions**: Transitions disabled during drag for instant feedback
- **YouTube URL Parsing**: Auto-detect and convert to embed URL
- **HTML5 Video**: For direct media URLs with preload metadata
- **Error Handling**: Graceful fallback for invalid URLs
- **Colorful Themes**: Red for YouTube, blue for media URLs
- **Responsive Design**: 320px when floating, full-width when normal

**Sticky Behavior Logic**:

```typescript
const originalTopRef = useRef<number>(0);
const [isSticky, setIsSticky] = useState(false);
const [isDragging, setIsDragging] = useState(false);
const [position, setPosition] = useState({ x: 0, y: 0 });

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

      // Set initial position when becoming sticky
      if (shouldStick && position.x === 0 && position.y === 0) {
        setPosition({ x: window.innerWidth - 352, y: 80 }); // 352 = 320px + 32px right padding
      }
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [position.x, position.y]);
```

**Drag & Drop Logic**:

```typescript
const dragOffsetRef = useRef({ x: 0, y: 0 });

// Handle mouse down - start drag
const handleMouseDown = (e: React.MouseEvent) => {
  if (!isSticky) return;
  e.preventDefault(); // Prevent text selection

  const rect = playerRef.current?.getBoundingClientRect();
  if (rect) {
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
  }
};

// Handle mouse move - update position
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && playerRef.current) {
      const playerWidth = 320;
      const playerHeight = playerRef.current.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = e.clientX - dragOffsetRef.current.x;
      let newY = e.clientY - dragOffsetRef.current.y;

      // Clamp to viewport boundaries with padding
      newX = Math.max(16, Math.min(newX, viewportWidth - playerWidth - 32)); // 16px left, 32px right
      newY = Math.max(16, Math.min(newY, viewportHeight - playerHeight - 16)); // 16px top and bottom

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && playerRef.current) {
      const playerWidth = 320;
      const viewportWidth = window.innerWidth;
      const centerX = viewportWidth / 2;

      // Snap to nearest edge (left or right)
      setPosition((prev) => ({
        x: prev.x < centerX ? 16 : viewportWidth - playerWidth - 32, // 32px padding on right
        y: prev.y,
      }));
    }
    setIsDragging(false);
  };

  if (isDragging) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDragging]);
```

**Dynamic Styling**:

```tsx
<div
  ref={playerRef}
  className={`bg-red-50 rounded-lg border border-red-300 select-none ${
    isDragging ? '' : 'transition-all duration-300'
  } ${
    isSticky ? 'fixed z-40 shadow-xl w-80' : 'w-full'
  } ${isMinimized ? 'p-1.5' : isSticky ? 'p-2' : 'p-4'} ${
    isDragging ? 'cursor-grabbing' : isSticky ? 'cursor-grab' : ''
  }`}
  style={isSticky ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
  onMouseDown={handleMouseDown}
>
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
   - Scroll down to trigger sticky mode
   - Verify player floats at top-right
   - Click and drag player to different positions
   - Release and verify it snaps to nearest edge
   - Try dragging to viewport boundaries
   - Verify player stays within screen bounds
   - Test minimize/expand while floating

2. **Direct Media URL**
   - Submit a direct URL to an MP3/MP4 file
   - Verify HTML5 player appears
   - Test play/pause/seek functionality
   - Scroll to trigger sticky mode
   - Test drag functionality
   - Verify edge snapping behavior
   - Test text selection doesn't occur during drag

3. **File Upload**
   - Upload an MP3 or MP4 file
   - Verify **NO player appears** (expected behavior)
   - Verify info note is NOT shown
   - Confirm notes are generated correctly

4. **History Integration**
   - Save YouTube/URL notes to history
   - Load from history
   - Verify player still works with historical data
   - Test drag functionality on historical items

5. **Edge Cases**
   - Resize browser window while player is floating
   - Test on mobile devices (drag may not work)
   - Minimize then drag player
   - Drag player rapidly to test performance
   - Test with very long videos
   - Test cursor changes (grab/grabbing)

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
⚠️ **Mobile drag**: Touch drag not yet implemented (desktop only)

## Troubleshooting

### Player Not Appearing

- Check if `sourceUrl` and `sourceType` exist in metadata
- Verify it's a YouTube or direct URL source (not file upload)
- Check browser console for errors
- Verify URL is valid and accessible

### Player Not Draggable

- Only works when player is in sticky/floating mode (scroll down first)
- Check if `isDragging` state is updating in DevTools
- Verify mouse events are being captured
- Mobile touch events not yet supported

### Player Position Issues

- Player should snap to edges (left/right) when released
- If stuck outside viewport, scroll up/down to reset
- Check viewport width calculations in browser DevTools
- Right edge uses 32px padding, left edge uses 16px

### Text Selection During Drag

- Should be prevented by `e.preventDefault()` and `select-none` class
- If still occurring, check browser compatibility
- Verify `handleMouseDown` is being called

### Performance Issues

- Dragging should be instant (transitions disabled during drag)
- If laggy, check browser performance in DevTools
- Large videos may affect overall page performance
- Consider closing other browser tabs

---

**Version**: 3.1 (Draggable Player with Safe Boundaries)
**Last Updated**: February 5, 2026
**Author**: Talk2Notes Development Team
```
