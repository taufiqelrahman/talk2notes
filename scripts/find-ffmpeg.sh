#!/bin/bash

echo "🔍 Finding FFmpeg installation..."
echo ""

# Try to find ffmpeg
FFMPEG_PATH=$(which ffmpeg 2>/dev/null)
FFPROBE_PATH=$(which ffprobe 2>/dev/null)

if [ -z "$FFMPEG_PATH" ]; then
  echo "❌ ffmpeg not found in PATH"
  
  # Try common locations
  echo ""
  echo "Checking common locations:"
  for path in /opt/homebrew/bin/ffmpeg /usr/local/bin/ffmpeg /usr/bin/ffmpeg /opt/local/bin/ffmpeg; do
    if [ -f "$path" ]; then
      echo "  ✓ Found: $path"
      FFMPEG_PATH="$path"
      break
    else
      echo "  ✗ Not found: $path"
    fi
  done
else
  echo "✅ ffmpeg found: $FFMPEG_PATH"
fi

if [ -z "$FFPROBE_PATH" ]; then
  echo "❌ ffprobe not found in PATH"
  
  # Try common locations
  echo ""
  echo "Checking common locations:"
  for path in /opt/homebrew/bin/ffprobe /usr/local/bin/ffprobe /usr/bin/ffprobe /opt/local/bin/ffprobe; do
    if [ -f "$path" ]; then
      echo "  ✓ Found: $path"
      FFPROBE_PATH="$path"
      break
    else
      echo "  ✗ Not found: $path"
    fi
  done
else
  echo "✅ ffprobe found: $FFPROBE_PATH"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$FFMPEG_PATH" ] && [ -n "$FFPROBE_PATH" ]; then
  echo "✅ FFmpeg is installed!"
  echo ""
  echo "Testing binaries..."
  
  # Test ffmpeg
  if "$FFMPEG_PATH" -version > /dev/null 2>&1; then
    echo "  ✓ ffmpeg works: $FFMPEG_PATH"
  else
    echo "  ✗ ffmpeg found but not executable: $FFMPEG_PATH"
  fi
  
  # Test ffprobe
  if "$FFPROBE_PATH" -version > /dev/null 2>&1; then
    echo "  ✓ ffprobe works: $FFPROBE_PATH"
  else
    echo "  ✗ ffprobe found but not executable: $FFPROBE_PATH"
  fi
  
  echo ""
  echo "📝 To fix the error, create .env.local with:"
  echo ""
  echo "FFMPEG_PATH=$FFMPEG_PATH"
  echo "FFPROBE_PATH=$FFPROBE_PATH"
  echo ""
  echo "Then restart the dev server: pnpm dev"
else
  echo "❌ FFmpeg is not installed"
  echo ""
  echo "Install it with:"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew >/dev/null 2>&1; then
      echo "  brew install ffmpeg"
    else
      echo "  Install Homebrew first: https://brew.sh"
      echo "  Then run: brew install ffmpeg"
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt >/dev/null 2>&1; then
      echo "  sudo apt update && sudo apt install ffmpeg"
    elif command -v yum >/dev/null 2>&1; then
      echo "  sudo yum install ffmpeg"
    else
      echo "  Use your package manager to install ffmpeg"
    fi
  else
    echo "  Download from: https://ffmpeg.org/download.html"
  fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
