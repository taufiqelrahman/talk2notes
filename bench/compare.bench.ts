import { it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

process.loadEnvFile(path.resolve(__dirname, '../.env'));
process.env.AI_PROVIDER = 'groq';
if (process.env.BENCH_MODEL) process.env.GROQ_TRANSCRIPTION_MODEL = process.env.BENCH_MODEL;
else delete process.env.GROQ_TRANSCRIPTION_MODEL;

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

function wer(ref: string[], hyp: string[]) {
  const d = Array.from({ length: ref.length + 1 }, (_, i) => [i, ...Array(hyp.length).fill(0)]);
  for (let j = 0; j <= hyp.length; j++) d[0][j] = j;
  for (let i = 1; i <= ref.length; i++)
    for (let j = 1; j <= hyp.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1)
      );
  return d[ref.length][hyp.length] / ref.length;
}

it('before vs after', async () => {
  const audio = path.resolve(__dirname, process.env.BENCH_AUDIO || 'long.mp3');
  const hasRef = !process.env.BENCH_AUDIO;
  const ref = hasRef ? norm(readFileSync(path.resolve(__dirname, 'reference.txt'), 'utf8')) : [];
  const fileSec = Number(process.env.BENCH_SEC || 0);
  const key = process.env.GROQ_API_KEY!;

  const { transcribeWithGroq } = await import('./old-providers');
  const { transcribeAudioChunked } = await import('@/lib/ai');

  let t = Date.now();
  const before = await transcribeWithGroq(
    audio,
    { provider: 'groq', transcriptionModel: 'whisper-large-v3', summarizationModel: '', apiKey: key },
    { language: process.env.BENCH_LANG }
  );
  const tBefore = (Date.now() - t) / 1000;

  t = Date.now();
  const after = await transcribeAudioChunked(audio, { language: process.env.BENCH_LANG, temperature: 0 });
  const tAfter = (Date.now() - t) / 1000;

  const row = (name: string, r: any, sec: number) => ({
    version: name,
    seconds: +sec.toFixed(1),
    billedAudioSec: Math.round(r.duration || (name === 'before' ? fileSec : 0)),
    lang: r.language,
    words: norm(r.text).length,
    WER_pct: hasRef ? +(wer(ref, norm(r.text)) * 100).toFixed(2) : null,
  });
  console.log('BEFORE:', before.text.slice(0, 300), '\nAFTER:', after.text.slice(0, 300));
  if (!hasRef) console.log('diff_before_vs_after_pct', +(wer(norm(before.text), norm(after.text)) * 100).toFixed(2));
  console.table([row('before', before, tBefore), row('after', after, tAfter)]);
}, 1_800_000);
