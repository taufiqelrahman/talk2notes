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
        read -p "Update Gemini summarization secret before deploying? (y/n): " -n 1 -r update_gemini
        echo ""
        if [[ $update_gemini =~ ^[Yy]$ ]]; then
            read -p "Enter your Gemini API Key: " gemini_key
            flyctl secrets set --stage AI_SUMMARIZATION_PROVIDER=gemini
            flyctl secrets set --stage GEMINI_API_KEY="$gemini_key"
            flyctl secrets set --stage GEMINI_SUMMARIZATION_MODEL=gemini-3.6-flash
            echo "✅ Gemini summarization configuration set"
        fi

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

# Prompt for transcription provider (audio -> text)
echo "Select transcription provider:"
echo "1) Groq (Free - Recommended)"
echo "2) OpenAI (Paid)"
read -p "Enter choice (1-2): " provider_choice

if [ "$provider_choice" = "1" ]; then
    read -p "Enter your Groq API Key (gsk_...): " groq_key
    flyctl secrets set --stage AI_PROVIDER=groq
    flyctl secrets set --stage GROQ_API_KEY="$groq_key"
    flyctl secrets set --stage GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
    flyctl secrets set --stage GROQ_SUMMARIZATION_MODEL=openai/gpt-oss-20b
    echo "✅ Groq configuration set"
elif [ "$provider_choice" = "2" ]; then
    read -p "Enter your OpenAI API Key (sk-...): " openai_key
    flyctl secrets set --stage AI_PROVIDER=openai
    flyctl secrets set --stage OPENAI_API_KEY="$openai_key"
    flyctl secrets set --stage OPENAI_TRANSCRIPTION_MODEL=whisper-1
    flyctl secrets set --stage OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview
    echo "✅ OpenAI configuration set"
fi

echo ""

# Prompt for summarization provider (translate/format/summarize), independent from
# transcription above. Defaults to the transcription provider if skipped.
echo "Use Gemini for translate/format/summarize instead of the provider above? (y/n)"
read -p "Enter choice: " -n 1 -r use_gemini
echo ""

if [[ $use_gemini =~ ^[Yy]$ ]]; then
    read -p "Enter your Gemini API Key: " gemini_key
    flyctl secrets set --stage AI_SUMMARIZATION_PROVIDER=gemini
    flyctl secrets set --stage GEMINI_API_KEY="$gemini_key"
    flyctl secrets set --stage GEMINI_SUMMARIZATION_MODEL=gemini-3.6-flash
    echo "✅ Gemini summarization configuration set"
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
