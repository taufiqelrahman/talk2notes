#!/bin/bash

set -e

echo "🎙️ Talk2Notes Setup Script"
echo "=========================="
echo ""

check_command() {
    if command -v $1 &> /dev/null; then
        echo "✅ $1 is installed"
        return 0
    else
        echo "❌ $1 is not installed"
        return 1
    fi
}

echo "Step 1: Checking prerequisites..."
echo ""

NODE_OK=false
NPM_OK=false
FFMPEG_OK=false

if check_command node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo "   Node.js version: $NODE_VERSION (OK)"
        NODE_OK=true
    else
        echo "   Node.js version: $NODE_VERSION (Need 18+)"
    fi
fi

if check_command npm; then
    NPM_VERSION=$(npm --version)
    NPM_MAJOR=$(echo $NPM_VERSION | cut -d. -f1)
    if [ "$NPM_MAJOR" -ge 9 ]; then
        echo "   npm version: $NPM_VERSION (OK)"
        NPM_OK=true
    else
        echo "   npm version: $NPM_VERSION (Need 9+)"
    fi
fi

if check_command ffmpeg; then
    FFMPEG_OK=true
fi

echo ""

if ! $NODE_OK || ! $NPM_OK; then
    echo "❌ Node.js 18+ and npm 9+ are required"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

if ! $FFMPEG_OK; then
    echo "⚠️  FFmpeg is not installed"
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu: sudo apt-get install ffmpeg"
    echo ""
    read -p "Continue without FFmpeg? (video uploads won't work) [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Step 2: Installing dependencies..."
echo ""

npm install

echo ""
echo "Step 3: Setting up environment variables..."
echo ""

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo ""
    echo "⚠️  IMPORTANT: You need to add your API key!"
    echo ""
    echo "   1. Open .env in your editor"
    echo "   2. Set AI_PROVIDER (default: openai)"
    echo "   3. Add your API key"
    echo ""
    echo "   For OpenAI:"
    echo "   - Get key from: https://platform.openai.com/api-keys"
    echo "   - Add: OPENAI_API_KEY=sk-your-key-here"
    echo ""
    
    read -p "Open .env in default editor now? [Y/n] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "Step 4: Verifying configuration..."
echo ""

if grep -q "your_.*_api_key_here" .env 2>/dev/null; then
    echo "⚠️  API key not configured in .env"
    echo "   Please edit .env and add your API key"
else
    echo "✅ Environment variables configured"
fi

echo ""
echo "=========================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Verify your API key in .env"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:3000"
echo ""
echo "Documentation:"
echo "  - Setup guide: SETUP.md"
echo "  - Architecture: ARCHITECTURE.md"
echo "  - Contributing: CONTRIBUTING.md"
echo ""
echo "Happy coding! 🚀"
