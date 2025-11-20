# 🆓 Setup Groq (Gratis!)

Groq lebih cepat dari OpenAI dan punya free tier yang generous!

## 🚀 Quick Setup (3 menit)

### 1. Daftar Groq (Gratis)

```bash
open https://console.groq.com
```

- Sign up pakai Google/GitHub
- Instant approval, no credit card needed!

### 2. Get API Key

```bash
open https://console.groq.com/keys
```

- Click "Create API Key"
- Copy key yang mulai dengan `gsk_...`

### 3. Configure Project

Kalau belum punya `.env.local`, copy dulu:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Change provider to groq
AI_PROVIDER=groq

# Add your Groq API key
GROQ_API_KEY=gsk_your_key_here

# Transcription model (Whisper for audio-to-text)
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3

# Summarization model (LLM for generating notes)
GROQ_SUMMARIZATION_MODEL=llama-3.3-70b-versatile

# Comment out or remove OpenAI key
# OPENAI_API_KEY=...
```

### 4. Restart Server

```bash
# Stop server (Ctrl+C)
pnpm dev
```

## ✅ Test

Upload audio/video file dan cek console logs:

```
[AI] Using Groq for transcription
[AI] Model: whisper-large-v3
[Transcription] ✓ Success!
```

## 📊 Groq Free Tier Limits

- **Whisper transcription**:
  - 14,400 requests/day
  - ~240 hours audio/day
  - Good enough untuk development!

- **Speed**: 2-3x lebih cepat dari OpenAI
- **Quality**: Sama bagusnya (pakai Whisper Large V3)

## 🆚 OpenAI vs Groq

| Feature         | OpenAI              | Groq              |
| --------------- | ------------------- | ----------------- |
| **Free Tier**   | ❌ No (need credit) | ✅ Yes (generous) |
| **Speed**       | Normal              | ⚡ Very Fast      |
| **Quality**     | Excellent           | Excellent         |
| **Cost** (paid) | $0.006/min          | Free/Cheap        |

## 🔧 Troubleshooting

### Error: "model does not support chat completions"

**Fixed!** Pastikan config di `.env.local` pakai 2 model berbeda:

```bash
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3     # For audio transcription
GROQ_SUMMARIZATION_MODEL=llama-3.3-70b-versatile  # For note generation
```

Jangan pakai `GROQ_MODEL` (deprecated).

### Error: "Invalid API Key"

- Check key starts with `gsk_`
- No spaces before/after key
- Regenerate key if needed

### Error: "Rate Limit"

Free tier limits:

- Wait 1 minute
- Or upgrade to paid tier ($$$)

### Still using OpenAI?

Check `.env.local`:

```bash
# Must be 'groq', not 'openai'
AI_PROVIDER=groq
```

Restart server after changing!

## 🌍 Language Support

Groq mendukung fitur bilingual Talk2Notes:

**English (Default):**

- Transcription dan notes dalam bahasa Inggris

**Indonesian:**

- Automatic translation transcript ke Bahasa Indonesia
- Notes di-generate dalam Bahasa Indonesia
- **Perfect untuk konten Islami:**
  - Preserves teks Arab (ayat Quran, Hadits) dengan harakat
  - Format: "teks Arab (transliterasi) - terjemahan Indonesia"
  - Istilah teknis Islam tetap dalam bahasa Arab

Pilih language di UI sebelum upload file!

## 💡 Pro Tips

1. **Groq untuk transcription** (gratis & cepat)
2. **OpenAI untuk summarization** (lebih bagus)

   ```bash
   AI_PROVIDER=groq  # untuk Whisper
   GROQ_API_KEY=...

   # Masih bisa pakai OpenAI untuk summary (optional)
   OPENAI_API_KEY=...
   OPENAI_SUMMARIZATION_MODEL=gpt-4-turbo-preview
   ```

3. **File size limit**: Sama seperti OpenAI (25MB audio)
4. **Pakai mode Indonesian**: Bagus untuk kajian/ceramah Islam dengan konten Arab

## 📚 References

- Groq Console: https://console.groq.com
- Groq Docs: https://console.groq.com/docs
- Pricing: https://wow.groq.com/pricing (free tier included!)

---

**Ready?** Copy command di bawah:

```bash
# 1. Open Groq console
open https://console.groq.com/keys

# 2. After getting API key, edit config
nano .env.local
# Set: AI_PROVIDER=groq
# Set: GROQ_API_KEY=gsk_...

# 3. Restart
pnpm dev
```

Selesai! 🎉
