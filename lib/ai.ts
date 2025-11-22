import OpenAI from 'openai';
import { promises as fs } from 'fs';
import type {
  TranscriptionResult,
  LectureNotes,
  AIConfig,
  TranscriptionOptions,
  SummarizationOptions,
} from '@/types';

const AI_PROVIDER =
  (process.env.AI_PROVIDER as 'openai' | 'groq' | 'deepgram' | 'anthropic') || 'openai';

export function getAIConfig(): AIConfig {
  switch (AI_PROVIDER) {
    case 'openai':
      return {
        provider: 'openai',
        transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
        summarizationModel: process.env.OPENAI_SUMMARIZATION_MODEL || 'gpt-4-turbo-preview',
        apiKey: process.env.OPENAI_API_KEY || '',
      };
    case 'groq':
      return {
        provider: 'groq',
        transcriptionModel: process.env.GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3',
        summarizationModel: process.env.GROQ_SUMMARIZATION_MODEL || 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY || '',
      };
    case 'deepgram':
      return {
        provider: 'deepgram',
        transcriptionModel: 'nova-2',
        summarizationModel: process.env.OPENAI_SUMMARIZATION_MODEL || 'gpt-4-turbo-preview',
        apiKey: process.env.DEEPGRAM_API_KEY || '',
      };
    case 'anthropic':
      return {
        provider: 'anthropic',
        transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
        summarizationModel: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      };
    default:
      throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
  }
}

export async function transcribeAudio(
  audioPath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }

  switch (config.provider) {
    case 'openai':
      return await transcribeWithOpenAI(audioPath, config, options);
    case 'groq':
      return await transcribeWithGroq(audioPath, config, options);
    case 'deepgram':
      return await transcribeWithDeepgram(audioPath, config, options);
    case 'anthropic':
      return await transcribeWithOpenAI(audioPath, config, options);
    default:
      throw new Error(`Transcription not supported for provider: ${config.provider}`);
  }
}

async function transcribeWithOpenAI(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  // Check file size - OpenAI Whisper has 25MB limit
  const stats = await fs.stat(audioPath);
  const fileSizeMB = stats.size / (1024 * 1024);

  if (fileSizeMB > 25) {
    throw new Error(
      `Audio file is ${fileSizeMB.toFixed(2)}MB. OpenAI Whisper API has a 25MB limit. ` +
        `Please use a shorter audio file or compress it further.`
    );
  }

  // For files > 10MB, reduce quality to be safer
  const shouldCompress = fileSizeMB > 10;

  console.log(
    `[Transcription] File size: ${fileSizeMB.toFixed(2)}MB${shouldCompress ? ' - Will attempt compression' : ''}`
  );

  const openai = new OpenAI({
    apiKey: config.apiKey,
    timeout: 600000, // Increase to 10 minutes for larger files
    maxRetries: 0, // Disable auto-retry, we'll handle it manually
  });

  // Manual retry logic with exponential backoff
  let lastError: any;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Transcription] Attempt ${attempt}/${maxAttempts}...`);

      // Read file and create Blob (File API not available in Node.js)
      const audioBuffer = await fs.readFile(audioPath);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      // Add name property to blob for OpenAI API compatibility
      Object.defineProperty(blob, 'name', { value: 'audio.mp3' });

      console.log(`[Transcription] Uploading ${blob.size} bytes to OpenAI...`);

      const response = await openai.audio.transcriptions.create({
        file: blob as any,
        model: config.transcriptionModel,
        language: options.language,
        prompt: options.prompt,
        temperature: options.temperature || 0,
        response_format: 'verbose_json',
      });

      console.log(`[Transcription] Success! Duration: ${response.duration}s`);

      return {
        text: response.text,
        duration: response.duration,
        language: response.language,
        segments: response.segments?.map((seg: any, idx: number) => ({
          id: idx,
          start: seg.start,
          end: seg.end,
          text: seg.text,
        })),
      };
    } catch (error: any) {
      lastError = error;
      console.error(`[Transcription] Attempt ${attempt} failed:`, error.message);

      // Don't retry on authentication errors or invalid files
      if (error.status === 401 || error.status === 400) {
        throw error;
      }

      // If it's a connection error and we have attempts left, wait and retry
      if (
        attempt < maxAttempts &&
        (error.code === 'ECONNRESET' || error.type === 'system' || error.code === 'ETIMEDOUT')
      ) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`[Transcription] Waiting ${waitTime / 1000}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      throw error;
    }
  }

  // If we got here, all retries failed
  throw new Error(
    `Failed to transcribe after ${maxAttempts} attempts. File size: ${fileSizeMB.toFixed(2)}MB. ` +
      `Last error: ${lastError?.message || 'Unknown error'}. ` +
      `Try with a smaller file (< 10MB recommended) or check your internet connection.`
  );
}

async function transcribeWithGroq(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const audioFile = await fs.readFile(audioPath);
  // Use Blob instead of File (File API not available in Node.js)
  const blob = new Blob([audioFile], { type: 'audio/mp3' });
  // Add name property to blob for API compatibility
  Object.defineProperty(blob, 'name', { value: 'audio.mp3' });

  const formData = new FormData();
  formData.append('file', blob as any);
  formData.append('model', config.transcriptionModel);
  if (options.language) formData.append('language', options.language);
  if (options.temperature) formData.append('temperature', options.temperature.toString());

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Groq transcription failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    text: data.text,
    duration: data.duration,
    language: data.language,
  };
}

async function transcribeWithDeepgram(
  audioPath: string,
  config: AIConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const audioBuffer = await fs.readFile(audioPath);

  const response = await fetch(
    `https://api.deepgram.com/v1/listen?model=${config.transcriptionModel}&smart_format=true&punctuate=true&paragraphs=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${config.apiKey}`,
        'Content-Type': 'audio/mp3',
      },
      body: audioBuffer,
    }
  );

  if (!response.ok) {
    throw new Error(`Deepgram transcription failed: ${response.statusText}`);
  }

  const data = await response.json();
  const transcript = data.results.channels[0].alternatives[0];

  return {
    text: transcript.transcript,
    duration: data.metadata.duration,
    language: data.results.channels[0].detected_language,
  };
}

export async function translateTranscript(
  transcript: string,
  targetLanguage: 'english' | 'indonesian'
): Promise<string> {
  if (targetLanguage === 'english') {
    return transcript; // No translation needed for English
  }

  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }

  console.log(`[Translation] Translating transcript to Indonesian...`);

  try {
    if (config.provider === 'openai' || config.provider === 'groq') {
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
      });

      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator and Islamic scholar. Translate English text to natural Bahasa Indonesia while adding proper Arabic script for Islamic references.

CRITICAL RULES FOR QURAN/HADITH QUOTES:
1. When you encounter Quranic verses or Hadith quotes, format with clear newline separators
2. Use this EXACT format:

---

Arabic text with harakat

(transliteration)

"Indonesian translation"

[Reference]

---

3. Reference format:
   - Quran: [QS. Surah Name: Verse] or [QS. Surah Number: Verse]
   - Hadith: [HR. Bukhari], [HR. Muslim], [HR. Tirmidzi], etc.

4. Example for Quran:

---

وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ

(wa maa arsalnaaka illa rahmatan lil 'aalamiin)

"Dan Kami tidak mengutus engkau melainkan sebagai rahmat bagi seluruh alam."

[QS. Al-Anbiya: 107]

---

5. Example for Hadith:

---

إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ

(innama al-a'malu bin niyyat)

"Sesungguhnya setiap amalan tergantung pada niatnya."

[HR. Bukhari & Muslim]

---

6. For common Islamic phrases (NOT Quran/Hadith quotes), keep inline:
   - بِسْمِ اللّٰهِ (bismillah) - Dengan nama Allah
   - الْحَمْدُ لِلّٰهِ (alhamdulillah) - Segala puji bagi Allah

7. Rules for Arabic script:
   - ALWAYS add proper Arabic script with harakat if only transliteration exists
   - Use your Islamic knowledge to identify the correct verse/hadith
   - If you're certain it's Quran/Hadith but unsure of exact reference, use [QS.] or [HR.]

8. Other rules:
   - Keep technical Islamic terms: salah, zakat, hajj, wudhu
   - Translate English sentences to natural Indonesian
   - Maintain paragraph structure
   - Keep names and proper nouns unchanged

IMPORTANT:
- If transcript only has transliteration, ADD the proper Arabic script with reference
- Use your knowledge to identify correct Quranic surah/verse or Hadith narrator when possible
- If unsure about exact reference, still add [QS.] or [HR.] to indicate the type of quote

Output the translated transcript directly without any preamble, headers, or explanations.`,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.3,
      });

      const translated = response.choices[0].message.content || transcript;
      console.log(`[Translation] ✓ Translation complete`);
      return translated;
    } else {
      // For other providers, return original transcript
      console.log(`[Translation] Translation not supported for provider: ${config.provider}`);
      return transcript;
    }
  } catch (error) {
    console.error('[Translation] Translation failed:', error);
    // Return original transcript if translation fails
    return transcript;
  }
}

/**
 * Format transcript with paragraphs and sections for better readability
 */
export async function formatTranscript(
  transcript: string,
  language: 'english' | 'indonesian' = 'english'
): Promise<string> {
  const config = getAIConfig();

  if (!config.apiKey) {
    // If no API key, just add basic paragraphs every ~500 characters
    return addBasicParagraphs(transcript);
  }

  try {
    const systemPrompt =
      language === 'indonesian'
        ? `Kamu adalah asisten yang memformat transkrip ceramah Islam menjadi lebih mudah dibaca.

ATURAN PENTING:
1. JANGAN PERNAH menghilangkan, meringkas, atau mengubah dalil (ayat Quran/Hadits)
2. Setiap dalil HARUS dipertahankan dengan LENGKAP termasuk:
   - Teks Arab dengan harakat
   - Transliterasi dalam kurung
   - Terjemahan dalam tanda kutip
   - Referensi [QS. Nama Surah: Ayat] atau [HR. Perawi]
3. Jika ada dalil, pisahkan dengan horizontal rule (---) sebelum dan sesudah dalil
4. Jangan ubah atau hilangkan konten apapun, hanya tambahkan format paragraf dan sub judul

Format dalil yang HARUS dipertahankan:
---

(teks Arab dengan harakat)

(transliterasi)

"Terjemahan"

[QS. Nama Surah: Ayat]

---

Tugas formatting:
1. Identifikasi topik/tema utama
2. Pisahkan menjadi bagian dengan ## Sub Judul
3. Format teks menjadi paragraf (pisahkan setiap 3-5 kalimat)
4. Pertahankan SEMUA dalil dengan format lengkap di atas

Contoh output:
## Tema Pertama

Penjelasan tema dengan beberapa kalimat. Ini adalah paragraf pertama yang menjelaskan konsep dasar.

---

النَّاسُ نِيَامٌ فَإِذَا مَاتُوا انْتَبَهُوا

(An-naasu niyaamun fa idza maatuu intabahuu)

"Manusia itu dalam keadaan tidur, maka apabila mereka mati, mereka baru sadar"

[HR. Al-Dailami]

---

Penjelasan setelah dalil. Ini melanjutkan pembahasan dengan mengaitkan dalil tersebut.

## Tema Kedua

Dan seterusnya...`
        : `You are an assistant that formats Islamic lecture transcripts for better readability.

IMPORTANT RULES:
1. NEVER remove, summarize, or modify dalil (Quranic verses/Hadith)
2. Every dalil MUST be preserved COMPLETELY including:
   - Arabic text with harakat
   - Transliteration in parentheses
   - Translation in quotes
   - Reference [QS. Surah Name: Verse] or [HR. Narrator]
3. If there's dalil, separate with horizontal rule (---) before and after dalil
4. Don't change or remove any content, only add paragraph formatting and subheadings

Dalil format that MUST be preserved:
---

(Arabic text with harakat)

(transliteration)

"Translation"

[QS. Surah Name: Verse]

---

Formatting tasks:
1. Identify main topics/themes
2. Split into sections with ## Subheadings
3. Format text into paragraphs (split every 3-5 sentences)
4. Preserve ALL dalil with complete format above

Example output:
## First Theme

Explanation of theme with several sentences. This is the first paragraph explaining the basic concept.

---

النَّاسُ نِيَامٌ فَإِذَا مَاتُوا انْتَبَهُوا

(An-naasu niyaamun fa idza maatuu intabahuu)

"Mankind are asleep, and when they die, they wake up"

[HR. Al-Dailami]

---

Explanation after dalil. This continues the discussion by relating to that dalil.

## Second Theme

And so on...`;

    if (config.provider === 'openai' || config.provider === 'groq') {
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
      });

      // Check token limit and crop if needed
      const estimatedTokens = Math.ceil(transcript.length / 4);
      const maxTokens = config.provider === 'groq' ? 9000 : 100000;

      let processedTranscript = transcript;
      if (estimatedTokens > maxTokens) {
        console.log(`[Format] Transcript too long, cropping to ${maxTokens} tokens for formatting`);
        const maxChars = maxTokens * 4;
        const sentences = transcript.substring(0, maxChars).split(/[.!?]\s+/);
        sentences.pop();
        processedTranscript = sentences.join('. ') + '.';
      }

      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: processedTranscript },
        ],
        temperature: 0.2,
      });

      return response.choices[0].message.content || transcript;
    }

    return addBasicParagraphs(transcript);
  } catch (error) {
    console.error('[Format] Formatting failed:', error);
    return addBasicParagraphs(transcript);
  }
}

/**
 * Add basic paragraph breaks every ~500 characters at sentence boundaries
 */
function addBasicParagraphs(transcript: string): string {
  const sentences = transcript.split(/([.!?]\s+)/);
  let result = '';
  let charCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    result += sentences[i];
    charCount += sentences[i].length;

    // Add double newline every ~500 chars at sentence end
    if (charCount > 500 && sentences[i].match(/[.!?]\s+/)) {
      result += '\n\n';
      charCount = 0;
    }
  }

  return result.trim();
}

/**
 * Split transcript into chunks based on token estimate
 * Rough estimate: 1 token ≈ 4 characters
 */
function chunkTranscript(transcript: string, maxTokens: number = 10000): string[] {
  const maxChars = maxTokens * 4; // Rough estimate

  if (transcript.length <= maxChars) {
    return [transcript];
  }

  const chunks: string[] = [];
  const sentences = transcript.split(/[.!?]\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    const testChunk = currentChunk + sentence + '. ';

    if (testChunk.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + '. ';
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function summarizeTranscript(
  transcript: string,
  originalFilename: string,
  options: SummarizationOptions = {}
): Promise<LectureNotes> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }

  // Check if transcript is too long (estimate tokens)
  const estimatedTokens = Math.ceil(transcript.length / 4);
  const maxInputTokens = config.provider === 'groq' ? 9000 : 100000; // Leave some buffer for Groq

  console.log(`[Summarization] Estimated tokens: ${estimatedTokens}, Max: ${maxInputTokens}`);

  // If transcript is too long, crop it (don't process the rest)
  let processedTranscript = transcript;
  let wasCropped = false;

  if (estimatedTokens > maxInputTokens) {
    console.log(
      `[Summarization] Transcript too long (${estimatedTokens} tokens), cropping to ${maxInputTokens} tokens...`
    );
    const maxChars = maxInputTokens * 4;

    // Crop at sentence boundary
    const sentences = transcript.substring(0, maxChars).split(/[.!?]\s+/);
    sentences.pop(); // Remove last incomplete sentence
    processedTranscript = sentences.join('. ') + '.';
    wasCropped = true;

    const newEstimate = Math.ceil(processedTranscript.length / 4);
    console.log(`[Summarization] Cropped transcript to ${newEstimate} tokens`);
  }

  const systemPrompt = buildSummarizationPrompt(options);

  let summaryText: string;

  if (config.provider === 'openai' || config.provider === 'groq') {
    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
    });

    const response = await openai.chat.completions.create({
      model: config.summarizationModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: processedTranscript }, // Use cropped transcript
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    summaryText = response.choices[0].message.content || '{}';
  } else if (config.provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: config.summarizationModel,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nTranscript:\n${processedTranscript}`, // Use cropped transcript
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API failed: ${response.statusText}`);
    }

    const data = await response.json();
    summaryText = data.content[0].text;
  } else {
    throw new Error(`Summarization not supported for provider: ${config.provider}`);
  }

  const parsed = JSON.parse(summaryText);

  // Add note if transcript was cropped
  let summary = parsed.summary || '';
  if (wasCropped) {
    summary = `⚠️ **Note**: Transcript was too long and was cropped to fit within API limits. Only the first ~${maxInputTokens} tokens were processed.\n\n${summary}`;
  }

  return {
    title: parsed.title || 'Untitled Lecture Notes',
    summary,
    paragraphs: parsed.paragraphs || [],
    bulletPoints: parsed.bulletPoints || [],
    keyConcepts: parsed.keyConcepts || [],
    definitions: parsed.definitions || [],
    exampleProblems: parsed.exampleProblems || [],
    actionItems: parsed.actionItems || [],
    metadata: {
      generatedAt: new Date().toISOString(),
      transcriptionModel: config.transcriptionModel,
      summarizationModel: config.summarizationModel,
      originalFilename,
      wordCount: processedTranscript.split(/\s+/).length,
      ...(wasCropped && { note: 'Transcript was cropped due to API token limits' }),
    },
  };
}

async function summarizeTranscriptInChunks(
  transcript: string,
  originalFilename: string,
  options: SummarizationOptions,
  maxTokens: number
): Promise<LectureNotes> {
  console.log('[Summarization] Processing transcript in chunks...');

  const chunks = chunkTranscript(transcript, maxTokens);
  console.log(`[Summarization] Split into ${chunks.length} chunks`);

  const config = getAIConfig();
  const chunkSummaries: LectureNotes[] = [];

  // Summarize each chunk
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[Summarization] Processing chunk ${i + 1}/${chunks.length}`);

    const systemPrompt = buildSummarizationPrompt(options);
    let summaryText: string;

    if (config.provider === 'openai' || config.provider === 'groq') {
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
      });

      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: chunks[i] },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      summaryText = response.choices[0].message.content || '{}';
    } else {
      throw new Error(`Chunked summarization only supported for OpenAI/Groq`);
    }

    const parsed = JSON.parse(summaryText);
    chunkSummaries.push({
      title: parsed.title || `Part ${i + 1}`,
      summary: parsed.summary || '',
      paragraphs: parsed.paragraphs || [],
      bulletPoints: parsed.bulletPoints || [],
      keyConcepts: parsed.keyConcepts || [],
      definitions: parsed.definitions || [],
      exampleProblems: parsed.exampleProblems || [],
      actionItems: parsed.actionItems || [],
      metadata: {
        generatedAt: new Date().toISOString(),
        transcriptionModel: config.transcriptionModel,
        summarizationModel: config.summarizationModel,
        originalFilename,
        wordCount: chunks[i].split(/\s+/).length,
      },
    });
  }

  // Merge all chunk summaries
  console.log('[Summarization] Merging chunk summaries...');

  return {
    title: chunkSummaries[0].title,
    summary: chunkSummaries.map((s) => s.summary).join('\n\n'),
    paragraphs: chunkSummaries.flatMap((s) => s.paragraphs),
    bulletPoints: chunkSummaries.flatMap((s) => s.bulletPoints),
    keyConcepts: chunkSummaries.flatMap((s) => s.keyConcepts),
    definitions: chunkSummaries.flatMap((s) => s.definitions),
    exampleProblems: chunkSummaries.flatMap((s) => s.exampleProblems),
    actionItems: chunkSummaries.flatMap((s) => s.actionItems),
    metadata: {
      generatedAt: new Date().toISOString(),
      transcriptionModel: config.transcriptionModel,
      summarizationModel: config.summarizationModel,
      originalFilename,
      wordCount: transcript.split(/\s+/).length,
    },
  };
}

function buildSummarizationPrompt(options: SummarizationOptions): string {
  const detailLevel = options.detailLevel || 'detailed';
  const focusAreas = options.focusAreas?.join(', ') || 'all topics';
  const language = options.language || 'english';

  const languageInstruction =
    language === 'indonesian'
      ? `Generate notes in Bahasa Indonesia. Use formal, academic Indonesian language.

CRITICAL RULE FOR QURAN/HADITH QUOTES:
When including Quranic verses or Hadith in paragraphs, format with clear newline separators:

---

Arabic text with harakat

(transliteration)

"Indonesian translation"

[Reference]

---

Examples:

---

وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ

(wa maa arsalnaaka illa rahmatan lil 'aalamiin)

"Dan Kami tidak mengutus engkau melainkan sebagai rahmat bagi seluruh alam."

[QS. Al-Anbiya: 107]

---

---

إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ

(innama al-a'malu bin niyyat)

"Sesungguhnya setiap amalan tergantung pada niatnya."

[HR. Bukhari & Muslim]

---

IMPORTANT:
- If transcript has transliteration, ADD proper Arabic script with harakat
- Use your Islamic knowledge to identify correct Quran surah/verse or Hadith narrator
- For common phrases (not quotes), keep inline: بِسْمِ اللّٰهِ (bismillah)
- Reference format: [QS. Surah: Verse] or [HR. Narrator]

FORMATTING:
- Title: In Indonesian
- Summary: In Indonesian  
- Paragraphs: In Indonesian (keep Arabic quotes with transliteration + translation as specified)
- Bullet points: In Indonesian
- Concepts: Indonesian names with Indonesian explanations
- Definitions: Indonesian terms with Indonesian definitions
- Action items: In Indonesian`
      : `Generate notes in English. Use clear, academic English.

CRITICAL RULE FOR QURAN/HADITH QUOTES:
When including Quranic verses or Hadith in paragraphs, format with clear newline separators:

---

Arabic text with harakat

(transliteration)

"English translation"

[Reference]

---

Examples:

---

وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ

(wa maa arsalnaaka illa rahmatan lil 'aalamiin)

"And We have not sent you except as a mercy to all the worlds."

[QS. Al-Anbiya: 107]

---

---

إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ

(innama al-a'malu bin niyyat)

"Verily, actions are judged by intentions."

[HR. Bukhari & Muslim]

---

IMPORTANT:
- If transcript has transliteration, ADD proper Arabic script with harakat
- Use your Islamic knowledge to identify correct Quran surah/verse or Hadith narrator
- For common phrases (not quotes), keep inline: بِسْمِ اللّٰهِ (bismillah)
- Reference format: **[QS. Surah: Verse]** or **[HR. Narrator]**`;

  return `You are an expert academic note-taker and Islamic scholar. Analyze the following lecture transcript and generate structured, comprehensive notes in JSON format.

${languageInstruction}

Focus on: ${focusAreas}
Detail level: ${detailLevel}

Generate a JSON object with the following structure:
{
  "title": "A clear, descriptive title for the lecture",
  "summary": "A ${detailLevel} overview paragraph (3-5 sentences) summarizing the main themes and takeaways",
  "paragraphs": ["Array of well-structured paragraphs covering main topics in logical order", "Each paragraph should be 3-5 sentences", "Maintain academic writing style"],
  "bulletPoints": ["Concise key points", "Action items", "Important facts", "Main arguments"],
  "keyConcepts": [
    {
      "concept": "Concept name",
      "explanation": "Clear explanation",
      "importance": "high|medium|low"
    }
  ],
  "definitions": [
    {
      "term": "Technical term or concept",
      "definition": "Precise definition",
      "context": "How it's used in the lecture"
    }
  ],
  "exampleProblems": [
    {
      "problem": "Problem statement or question",
      "solution": "Solution if provided",
      "explanation": "Step-by-step explanation"
    }
  ],
  "actionItems": ["Tasks mentioned", "Assignments", "Follow-up items", "Further reading suggestions"]
}

Rules:
- Extract all key concepts, definitions, and examples mentioned
- Organize information logically and hierarchically
- Use clear, academic language in the specified language (${language === 'indonesian' ? 'Bahasa Indonesia' : 'English'})
- For Arabic text (Quran, Hadith): ALWAYS preserve original Arabic with harakat, add transliteration, then translation
- Identify relationships between concepts
- Highlight important formulas, theories, or frameworks
- Note any examples, case studies, or illustrations used
- Capture action items and next steps
- If no example problems are present, return empty array
- Ensure all JSON is valid and properly formatted
- Do not include any text outside the JSON object`;
}
