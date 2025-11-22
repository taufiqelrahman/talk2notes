#!/bin/bash

# Quick Deploy Script for Fly.io
# Usage: ./deploy-fly.sh

set -e

echo "🚀 Talk2Notes - Fly.io Deployment"
echo "=================================="
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Flyctl CLI not found!"
    echo "Installing flyctl..."
    brew install flyctl
fi

echo "✅ Flyctl found: $(flyctl version)"
echo ""

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Please login to Fly.io..."
    flyctl auth login
fi

echo "✅ Logged in as: $(flyctl auth whoami)"
echo ""

# Check if app exists
if [ -f "fly.toml" ]; then
    APP_NAME=$(grep '^app = ' fly.toml | cut -d'"' -f2)
    echo "📦 Found existing app: $APP_NAME"
    echo ""
    
    # Ask if want to redeploy or create new
    read -p "Deploy to existing app? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying to $APP_NAME..."
        flyctl deploy
        exit 0
    fi
fi

# Create new app
echo "🆕 Creating new Fly.io app..."
flyctl launch --no-deploy

APP_NAME=$(grep '^app = ' fly.toml | cut -d'"' -f2)

echo ""
echo "🔑 Setting up environment variables..."
echo ""

# Prompt for API provider
echo "Select AI Provider:"
echo "1) Groq (Free - Recommended)"
echo "2) OpenAI (Paid)"
read -p "Enter choice (1-2): " provider_choice

if [ "$provider_choice" = "1" ]; then
    read -p "Enter your Groq API Key (gsk_...): " groq_key
    flyctl secrets set AI_PROVIDER=groq
    flyctl secrets set GROQ_API_KEY="$groq_key"
    flyctl secrets set GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
    flyctl secrets set GROQ_SUMMARIZATION_MODEL=llama-3.3-70b-versatile
    echo "✅ Groq configuration set"
elif [ "$provider_choice" = "2" ]; then
    read -p "Enter your OpenAI API Key (sk-...): " openai_key
    flyctl secrets set AI_PROVIDER=openai
    flyctl secrets set OPENAI_API_KEY="$openai_key"
    flyctl secrets set OPENAI_TRANSCRIPTION_MODEL=whisper-1
    flyctl secrets set OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview
    echo "✅ OpenAI configuration set"
fi

echo ""
echo "🚀 Deploying application..."
flyctl deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is available at: https://$APP_NAME.fly.dev"
echo ""
echo "Useful commands:"
echo "  flyctl logs          # View logs"
echo "  flyctl status        # Check status"
echo "  flyctl open          # Open in browser"
echo "  flyctl ssh console   # SSH into machine"
echo ""
