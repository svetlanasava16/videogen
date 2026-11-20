import { z } from "zod";

export const Locale = z.enum(["ru", "en", "de"]);
export type Locale = z.infer<typeof Locale>;

export const Emotion = z.enum(["neutral", "happy", "angry", "surprised", "sad", "smug"]);
export type Emotion = z.infer<typeof Emotion>;

/** Слово с таймингом (секунды от начала реплики). Источник: ElevenLabs with-timestamps. */
export const WordTiming = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
});
export type WordTiming = z.infer<typeof WordTiming>;

export const Line = z.object({
  id: z.string(),
  character: z.string(), // id персонажа из content/characters
  text: z.string(),
  emotion: Emotion.default("neutral"),
  /** Пока озвучки нет, тайминги оцениваются по тексту (estimateWords). */
  audio: z
    .object({
      file: z.string(), // путь относительно public/ Remotion
      durationSec: z.number(),
      words: z.array(WordTiming),
    })
    .optional(),
  /** Пауза после реплики, сек (комическая пауза перед панчлайном). */
  pauseAfterSec: z.number().default(0.35),
});
export type Line = z.infer<typeof Line>;

export const Episode = z.object({
  id: z.string(),
  jokeId: z.string(),
  locale: Locale,
  title: z.string(),
  location: z.string(), // id локации
  /** Участники слева направо. */
  cast: z.array(z.string()).min(1).max(3),
  lines: z.array(Line).min(1),
  format: z
    .object({ width: z.number(), height: z.number(), fps: z.number() })
    .default({ width: 1080, height: 1920, fps: 30 }),
});
export type Episode = z.infer<typeof Episode>;

/** Персонаж — данные, а не код: внешность заменяется без правки пайплайна. */
export const Character = z.object({
  id: z.string(),
  name: z.record(Locale, z.string()),
  /** puppet2d сейчас; model3d позже для топовых персонажей. */
  renderer: z.enum(["puppet2d", "model3d"]).default("puppet2d"),
  look: z.object({
    /** Тип фигуры для 2D-заглушки: man, woman, boy, girl, old-man, old-woman, bear, hare, dog, cat, devil, angel… */
    kind: z.string(),
    skin: z.string(),
    clothes: z.string(),
    accent: z.string().optional(),
  }),
  voice: z.record(Locale, z.object({ elevenlabsVoiceId: z.string(), notes: z.string().optional() })),
  /** Описание для арта и кастинга (стадия cast). */
  bible: z
    .object({
      summary: z.string(),
      age: z.string(),
      build: z.string(),
      silhouette: z.string(),
      outfit: z.string(),
      features: z.string(),
      palette: z.array(z.string()),
      personality: z.string(),
      /** Канонические роли, которые играет кукла (data/llm/canon/characters.out.json). */
      roles: z.array(z.string()),
      /** Смена реквизита/костюма под роль, без перерисовки куклы. */
      variants: z.array(z.object({ roles: z.array(z.string()), change: z.string() })).default([]),
      voiceBrief: z.record(Locale, z.string()),
      /** Промпт для ComfyUI (листа персонажа), дополняется общим стилем content/style.json. */
      prompt: z.string(),
    })
    .optional(),
});
export type Character = z.infer<typeof Character>;

export const Location = z.object({
  id: z.string(),
  name: z.record(Locale, z.string()),
  palette: z.object({ wall: z.string(), floor: z.string(), accent: z.string() }),
  props: z.array(z.string()).default([]),
  bible: z
    .object({
      summary: z.string(),
      /** Канонические локации, которые закрывает этот фон. */
      roles: z.array(z.string()),
      variants: z.array(z.object({ roles: z.array(z.string()), change: z.string() })).default([]),
      prompt: z.string(),
    })
    .optional(),
});
export type Location = z.infer<typeof Location>;

/** Общий визуальный стиль: один на весь канал. */
export const Style = z.object({
  id: z.string(),
  description: z.string(),
  positive: z.string(),
  negative: z.string(),
  palette: z.array(z.string()),
});
export type Style = z.infer<typeof Style>;

/** Грубая оценка таймингов по числу символов (пока нет реальной озвучки). */
export function estimateWords(text: string, charsPerSec = 14): WordTiming[] {
  const parts = text.split(/\s+/).filter(Boolean);
  let t = 0;
  return parts.map((w) => {
    const dur = Math.max(0.18, w.length / charsPerSec);
    const out = { text: w, start: t, end: t + dur };
    t += dur + 0.04;
    return out;
  });
}

export function lineDuration(line: Line): number {
  if (line.audio) return line.audio.durationSec;
  const w = estimateWords(line.text);
  return w.length ? w[w.length - 1].end : 0.5;
}

/** Анекдот в базе. Тексты фольклорные или из открытых датасетов с указанной лицензией. */
export const Joke = z.object({
  id: z.string(),
  lang: Locale,
  kind: z.enum(["anekdot", "dad-joke", "joke"]).default("anekdot"),
  text: z.string(),
  source: z.enum(["folk", "original"]).default("folk"),
  tags: z.array(z.string()).default([]),
  /** Перцентиль популярности внутри источника, 0..1 (1 = самый популярный). */
  popularity: z.number().min(0).max(1).default(0),
  /** Сырой рейтинг источника (голоса, score). */
  score: z.number().optional(),
  sourceRef: z
    .object({ dataset: z.string(), id: z.string(), url: z.string().optional(), license: z.string() })
    .optional(),
});
export type Joke = z.infer<typeof Joke>;

/** Зарезервированный id: голос без куклы на экране. */
export const NARRATOR = "narrator";

export const Translatability = z.object({
  verdict: z.enum(["translate", "adapt", "skip"]),
  reason: z.enum(["universal", "wordplay", "culture-ref", "name-or-stereotype", "format", "other"]),
  note: z.string().default(""),
});
export type Translatability = z.infer<typeof Translatability>;

/** Результат LLM-стадии analyze для одного анекдота. */
export const JokeAnalysis = z.object({
  id: z.string(),
  /** Суть сюжета и панчлайна одной фразой на английском: для поиска пересказов одного анекдота. */
  gist: z.string().optional(),
  form: z.enum(["dialogue", "narrative", "qa", "one-liner"]),
  needsNarrator: z.boolean(),
  characters: z.array(
    z.object({
      archetype: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case english id"),
      role: z.enum(["speaker", "silent", "mentioned"]),
      nameInText: z.string().default(""),
      looks: z.string().default(""),
    }),
  ),
  location: z.object({
    archetype: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    props: z.array(z.string()).default([]),
  }),
  wordplay: z.object({ present: z.boolean(), explanation: z.string().default("") }),
  cultureRefs: z.array(z.string()).default([]),
  translatability: z.object({ ru: Translatability.optional(), en: Translatability.optional(), de: Translatability.optional() }),
  funny: z.number().int().min(1).max(5),
  videoFit: z.number().int().min(1).max(5),
  flags: z.array(z.enum(["ethnic", "sexual", "political", "violence", "religion", "profanity", "dark", "real-person", "drugs", "homophobia", "exclude"])).default([]),
});
export type JokeAnalysis = z.infer<typeof JokeAnalysis>;

/** Результат LLM-стадии script: сценарий одного анекдота на одном языке. */
export const ScriptDraft = z.object({
  id: z.string(), // jokeId
  locale: Locale,
  adaptation: z.enum(["original", "direct", "reworked", "unfit"]),
  notes: z.string().default(""),
  title: z.string(),
  location: z.string(),
  cast: z.array(z.string()).min(1).max(3),
  lines: z
    .array(
      z.object({
        character: z.string(), // id из cast или "narrator"
        text: z.string(),
        emotion: Emotion,
        pauseAfterSec: z.number(),
      }),
    )
    .min(1),
});
export type ScriptDraft = z.infer<typeof ScriptDraft>;
