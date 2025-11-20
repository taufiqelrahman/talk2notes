#!/bin/bash

# FFmpeg Installation Check Script
# This script verifies FFmpeg installation and configuration

echo "🔍 Checking FFmpeg installation..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check FFmpeg
if command -v ffmpeg &> /dev/null; then
    FFMPEG_PATH=$(which ffmpeg)
    FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n 1)
    echo -e "${GREEN}✓ FFmpeg found${NC}"
    echo "  Path: $FFMPEG_PATH"
    echo "  Version: $FFMPEG_VERSION"
else
    echo -e "${RED}✗ FFmpeg not found${NC}"
    FFMPEG_MISSING=1
fi

echo ""

# Check FFprobe
if command -v ffprobe &> /dev/null; then
    FFPROBE_PATH=$(which ffprobe)
    FFPROBE_VERSION=$(ffprobe -version 2>&1 | head -n 1)
    echo -e "${GREEN}✓ FFprobe found${NC}"
    echo "  Path: $FFPROBE_PATH"
    echo "  Version: $FFPROBE_VERSION"
else
    echo -e "${RED}✗ FFprobe not found${NC}"
    FFPROBE_MISSING=1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Installation instructions if missing
if [ ! -z "$FFMPEG_MISSING" ] || [ ! -z "$FFPROBE_MISSING" ]; then
    echo -e "${YELLOW}⚠ FFmpeg is not properly installed${NC}"
    echo ""
    echo "Installation instructions:"
    echo ""
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  macOS (Homebrew):"
        echo "    brew install ffmpeg"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  Ubuntu/Debian:"
        echo "    sudo apt update"
        echo "    sudo apt install ffmpeg"
        echo ""
        echo "  Fedora/RHEL:"
        echo "    sudo dnf install ffmpeg"
    else
        echo "  Windows:"
        echo "    Download from: https://ffmpeg.org/download.html"
        echo "    Add to PATH after installation"
    fi
    
    echo ""
    echo "After installation, restart your terminal and run this script again."
    exit 1
else
    echo -e "${GREEN}✓ FFmpeg is properly installed and ready to use!${NC}"
    echo ""
    echo "You can add these to your .env file (optional):"
    echo ""
    echo "FFMPEG_PATH=$FFMPEG_PATH"
    echo "FFPROBE_PATH=$FFPROBE_PATH"
    echo ""
    echo "Note: The app will auto-detect these paths if not specified."
    exit 0
fi
