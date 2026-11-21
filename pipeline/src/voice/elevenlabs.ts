/**
 * ElevenLabs: TTS с таймингами по символам → mp3 + тайминги слов.
 * Документация: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
 * Ключ: ELEVENLABS_API_KEY в корневом .env (только на компьютере, где делают озвучку).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Emotion, Locale, WordTiming } from "@jf/core";
import { ROOT } from "../util.js";

if (existsSync(join(ROOT, ".env"))) process.loadEnvFile(join(ROOT, ".env"));

const API = "https://api.elevenlabs.io/v1";

function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("нет ELEVENLABS_API_KEY: добавьте его в корневой .env (см. .claude/skills/jokes-voice)");
  return k;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "xi-api-key": key(), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${method} ${path.split("?")[0]}: HTTP ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

/** Модели с аудио-тегами ([laughs], [angrily]…): эмоция задаётся тегом, а не настройками. */
const tagged = (model: string) => /^eleven_v[34]/.test(model);

/** Эмоция реплики → настройки голоса (multilingual v2) или тег (v3/v4). */
const SETTINGS: Record<Emotion, { stability: number; style: number; tag: string }> = {
  neutral: { stability: 0.5, style: 0.0, tag: "" },
  happy: { stability: 0.4, style: 0.35, tag: "[cheerfully]" },
  angry: { stability: 0.3, style: 0.5, tag: "[angrily]" },
  surprised: { stability: 0.3, style: 0.45, tag: "[surprised]" },
  sad: { stability: 0.55, style: 0.3, tag: "[sadly]" },
  smug: { stability: 0.45, style: 0.3, tag: "[smugly]" },
};

type Alignment = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };

/** Символы → слова; аудио-теги в квадратных скобках в субтитры не попадают. */
export function wordsFromAlignment(a: Alignment): WordTiming[] {
  const words: WordTiming[] = [];
  let cur: WordTiming | undefined;
  let inTag = false;
  a.characters.forEach((ch, i) => {
    if (ch === "[") inTag = true;
    if (inTag) {
      if (ch === "]") inTag = false;
      return;
    }
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = undefined;
      return;
    }
    const s = a.character_start_times_seconds[i];
    const e = a.character_end_times_seconds[i];
    if (!cur) cur = { text: ch, start: s, end: e };
    else {
      cur.text += ch;
      cur.end = e;
    }
  });
  if (cur) words.push(cur);
  return words;
}

export type Tts = { audio: Buffer; words: WordTiming[] };

export async function tts(opts: {
  voiceId: string; text: string; model: string; emotion: Emotion; locale: Locale;
  previousText?: string; nextText?: string; seed?: number;
  /** Текст уже содержит свои теги (смех) — эмоцию не добавлять. */
  raw?: boolean;
}): Promise<Tts> {
  const st = SETTINGS[opts.emotion] ?? SETTINGS.neutral;
  const v3 = tagged(opts.model);
  const body: Record<string, unknown> = {
    text: v3 && st.tag && !opts.raw ? `${st.tag} ${opts.text}` : opts.text,
    model_id: opts.model,
    voice_settings: v3
      ? { stability: st.tag || opts.raw ? 0.0 : 0.5, similarity_boost: 0.75 }
      : { stability: st.stability, similarity_boost: 0.75, style: st.style, use_speaker_boost: true, speed: 1 },
    seed: opts.seed,
  };
  if (!opts.model.startsWith("eleven_multilingual_v2")) body.language_code = opts.locale;
  if (!v3) {
    if (opts.previousText) body.previous_text = opts.previousText;
    if (opts.nextText) body.next_text = opts.nextText;
  }
  const r = await call<{ audio_base64: string; alignment?: Alignment; normalized_alignment?: Alignment }>(
    "POST", `/text-to-speech/${opts.voiceId}/with-timestamps?output_format=mp3_44100_128`, body,
  );
  const al = r.alignment ?? r.normalized_alignment;
  if (!al && !opts.raw) throw new Error("ElevenLabs вернул ответ без таймингов (alignment)");
  return { audio: Buffer.from(r.audio_base64, "base64"), words: al ? wordsFromAlignment(al) : [] };
}

export type SharedVoice = {
  voice_id: string; public_owner_id: string; name: string; gender?: string; age?: string; accent?: string;
  language?: string; locale?: string; descriptive?: string; use_case?: string; preview_url?: string; description?: string;
};

/** Поиск в общей Voice Library (бесплатно). */
export async function searchVoices(q: { search?: string; language?: string; gender?: string; age?: string; pageSize?: number }) {
  const p = new URLSearchParams({ page_size: String(q.pageSize ?? 20) });
  if (q.search) p.set("search", q.search);
  if (q.language) p.set("language", q.language);
  if (q.gender) p.set("gender", q.gender);
  if (q.age) p.set("age", q.age);
  return (await call<{ voices: SharedVoice[] }>("GET", `/shared-voices?${p}`)).voices;
}

/** Добавить голос из библиотеки в «My voices» (занимает слот плана); возвращает voice_id для озвучки. */
export async function addSharedVoice(publicOwnerId: string, voiceId: string, name: string) {
  return (await call<{ voice_id: string }>("POST", `/voices/add/${publicOwnerId}/${voiceId}`, { new_name: name })).voice_id;
}

/**
 * Проверка ключа без трат символов (pnpm voice doctor): подписка (тариф, остаток), чтение Voice Library,
 * свои голоса, модели. tts=true — ещё одна короткая пробная озвучка (несколько символов) для проверки права Text to Speech.
 */
export async function probe(opts: { ttsVoiceId?: string } = {}) {
  const check = async <T>(name: string, f: () => Promise<T>) => {
    try { return { name, ok: true as const, value: await f() }; } catch (e) { return { name, ok: false as const, error: String((e as Error).message).slice(0, 200) }; }
  };
  return {
    subscription: await check("User: Read (подписка)", () => call<{ tier: string; character_count: number; character_limit: number; status?: string; voice_limit?: number; voice_slots_used?: number }>("GET", "/user/subscription")),
    library: await check("Voices: Read (Voice Library)", () => call<{ voices: unknown[] }>("GET", "/shared-voices?page_size=1")),
    voices: await check("Voices: Read (My voices)", () => call<{ voices: { voice_id: string; category?: string }[] }>("GET", "/voices")),
    models: await check("Models (список моделей)", () => call<{ model_id: string; can_do_text_to_speech?: boolean }[]>("GET", "/models")),
    tts: opts.ttsVoiceId ? await check("Text to Speech (пробная фраза)", () => tts({ voiceId: opts.ttsVoiceId!, text: "Да.", model: "eleven_multilingual_v2", locale: "ru", emotion: "neutral" }).then((r) => ({ bytes: r.audio.length }))) : undefined,
  };
}

/** Остаток символов в подписке. */
export async function quota() {
  const s = await call<{ character_count: number; character_limit: number; tier: string }>("GET", "/user/subscription");
  return { used: s.character_count, limit: s.character_limit, tier: s.tier };
}
