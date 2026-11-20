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

/** Закадровый смех после реплики: смешок, смех, хохот. */
export const Laugh = z.enum(["chuckle", "laugh", "big"]);
export type Laugh = z.infer<typeof Laugh>;

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
      /** Кто озвучил: elevenlabs | comfy | fake (тест). */
      provider: z.string().optional(),
      voiceId: z.string().optional(),
      model: z.string().optional(),
      /** Хэш текста реплики на момент озвучки: не совпадает с текущим → озвучка устарела. */
      textHash: z.string().optional(),
    })
    .optional(),
  /** Пауза после реплики, сек (комическая пауза перед панчлайном). */
  pauseAfterSec: z.number().default(0.35),
  /** Куклы, которые входят в кадр перед этой репликой. */
  enter: z.array(z.string()).default([]),
  /** Куклы, которые уходят из кадра после этой реплики. */
  exit: z.array(z.string()).default([]),
  /** Закадровый смех после реплики. Если ни у одной реплики нет — "big" после последней. */
  laugh: Laugh.optional(),
});
export type Line = z.infer<typeof Line>;

/**
 * Сцена как данные (движок v2). Реплики живут в плоском Episode.lines (их озвучивают и субтитрируют),
 * сцена ссылается на них битом {type:"line", ref}. Остальные биты — действия без кода на эпизод.
 */
export const Shot = z.enum(["wide", "two", "close"]);
export type Shot = z.infer<typeof Shot>;
export const Beat = z.discriminatedUnion("type", [
  z.object({ type: z.literal("line"), ref: z.string() }),
  /** Пройти к метке места (content/locations → marks) или уйти за край; from — войти из-за края. */
  z.object({ type: z.literal("move"), who: z.string(), to: z.string(), from: z.enum(["off-left", "off-right"]).optional() }),
  /** Реквизит (content/props.json): взять, отдать (to — кому), уронить, положить. */
  z.object({ type: z.literal("prop"), who: z.string(), item: z.string(), action: z.enum(["hold", "give", "drop", "put"]), to: z.string().optional() }),
  /** Явный план камеры (иначе — авто-режиссура). */
  z.object({ type: z.literal("camera"), shot: Shot, on: z.string().optional() }),
  /** Звуковой эффект из content/audio.json (kind sfx). */
  z.object({ type: z.literal("sfx"), id: z.string() }),
  z.object({ type: z.literal("pause"), sec: z.number().min(0).max(5) }),
]);
export type Beat = z.infer<typeof Beat>;
export const Transition = z.enum(["cut", "wipe", "flyover"]);
export const Scene = z.object({
  location: z.string(),
  place: z.string().optional(),
  cast: z.array(z.string()).min(1).max(3),
  roles: z.record(z.string(), z.string()).default({}),
  beats: z.array(Beat).min(1),
  /** Переход перед сценой (для первой игнорируется). */
  transition: Transition.default("cut"),
});
export type Scene = z.infer<typeof Scene>;

export const Episode = z.object({
  id: z.string(),
  jokeId: z.string(),
  locale: Locale,
  title: z.string(),
  location: z.string(), // id фона (content/locations)
  /** Каноническая локация сцены (например "park" для фона "ulitsa") — выбирает вариант фона. */
  place: z.string().optional(),
  /** Участники слева направо (id кукол). */
  cast: z.array(z.string()).min(1).max(3),
  /** Роль каждой куклы в этом эпизоде (castId → canonical role) — выбирает вариант костюма. */
  roles: z.record(z.string(), z.string()).default({}),
  lines: z.array(Line).min(1),
  /** id музыкального трека из content/audio.json; нет — выбирается по hash(id), "none" — без музыки. */
  music: z.string().optional(),
  /** Сцены (движок v2). Нет — эпизод из одной сцены: location/place/cast/roles + все lines по порядку. */
  scenes: z.array(Scene).optional(),
  /** Смех персонажей после панчлайна (их голосами): играют вместе, куклы смеются. Пишет `pnpm voice run`. */
  outroLaughs: z
    .array(z.object({ character: z.string(), file: z.string(), durationSec: z.number(), provider: z.string().optional(), voiceId: z.string().optional() }))
    .default([]),
  format: z
    .object({ width: z.number(), height: z.number(), fps: z.number() })
    .default({ width: 1080, height: 1920, fps: 30 }),
});
export type Episode = z.infer<typeof Episode>;

/** Внешность куклы. Аксессуары — стереотипные детали, рисуются поверх базы. */
export const Look = z.object({
  /** Тип фигуры: man, woman, boy, girl, old-man, old-woman, dog, cat, bird, cow, horse, bear, hare, devil… */
  kind: z.string(),
  skin: z.string(),
  clothes: z.string(),
  accent: z.string().optional(),
  hair: z.string().optional(),
  /** short | bald | fringe | long | bun | pigtails | perm | curly | none */
  hairStyle: z.string().optional(),
  /** Телосложение: slim | average | stocky | portly | child (рост и ширина тела). */
  build: z.string().optional(),
  accessories: z.array(z.string()).default([]),
});
export type Look = z.infer<typeof Look>;

/** Переопределение внешности для роли: заменить цвета/причёску, добавить/убрать аксессуары. */
export const LookPatch = z.object({
  clothes: z.string().optional(),
  accent: z.string().optional(),
  hair: z.string().optional(),
  hairStyle: z.string().optional(),
  add: z.array(z.string()).default([]),
  remove: z.array(z.string()).default([]),
});
export type LookPatch = z.infer<typeof LookPatch>;

export function applyLook(look: Look, patch?: LookPatch): Look {
  if (!patch) return look;
  const acc = look.accessories.filter((a) => !patch.remove.includes(a));
  for (const a of patch.add) if (!acc.includes(a)) acc.push(a);
  return {
    ...look,
    clothes: patch.clothes ?? look.clothes,
    accent: patch.accent ?? look.accent,
    hair: patch.hair ?? look.hair,
    hairStyle: patch.hairStyle ?? look.hairStyle,
    accessories: acc,
  };
}

/** Внешность куклы в конкретной роли (с учётом варианта костюма). */
export function lookForRole(c: Character, role?: string): Look {
  const v = role ? c.bible?.variants.find((x) => x.roles.includes(role)) : undefined;
  return applyLook(c.look, v?.look);
}

/** Персонаж — данные, а не код: внешность заменяется без правки пайплайна. */
export const Character = z.object({
  id: z.string(),
  name: z.record(Locale, z.string()),
  /** puppet2d сейчас; model3d позже для топовых персонажей. */
  renderer: z.enum(["puppet2d", "model3d"]).default("puppet2d"),
  look: Look,
  /** Семейство: двойник ссылается на базовую куклу (тот же риг, другие волосы/одежда). */
  family: z.string().optional(),
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
      variants: z.array(z.object({ roles: z.array(z.string()), change: z.string(), look: LookPatch.optional() })).default([]),
      voiceBrief: z.record(Locale, z.string()),
      /** Короткое текстовое описание внешности (для людей и агентов; рисуется кодом). */
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
  /** Метки места: x (доля ширины кадра 0..1) — door, counter, desk, bed, center… Нет — автослоты. */
  marks: z.record(z.string(), z.number().min(0).max(1)).default({}),
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
  palette: z.array(z.string()),
});
export type Style = z.infer<typeof Style>;

/** Звук из библиотеки (content/audio.json): смех или фоновая музыка, только CC0 / свободные лицензии. */
export const AudioClip = z.object({
  id: z.string(),
  kind: z.enum(["laugh", "music", "sfx"]),
  /** Для смеха: сила. */
  intensity: Laugh.optional(),
  /** Для музыки: настроение (light, quirky, calm…). */
  mood: z.string().optional(),
  /** Путь относительно remotion/public. */
  file: z.string(),
  durationSec: z.number(),
  source: z.string(),
  author: z.string().default(""),
  license: z.string(),
});
export type AudioClip = z.infer<typeof AudioClip>;
export const AudioLibrary = z.object({ clips: z.array(AudioClip).default([]) });

/** Детерминированный выбор из списка по строке (одинаковый при каждом рендере). */
export function pick<T>(items: T[], key: string): T | undefined {
  if (!items.length) return undefined;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return items[(h >>> 0) % items.length];
}

/** Реплики со смехом: явная разметка или "big" после последней. */
export function laughs(lines: { laugh?: Laugh }[]): (Laugh | undefined)[] {
  const any = lines.some((l) => l.laugh);
  return lines.map((l, i) => (any ? l.laugh : i === lines.length - 1 ? "big" : undefined));
}

/** Хэш текста реплики для проверки актуальности озвучки (FNV-1a, без зависимостей — работает и в браузере). */
export function textHash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Голоса без куклы (рассказчик) и общие настройки озвучки: content/voices.json. */
export const VoiceConfig = z.object({
  model: z.string().default("eleven_multilingual_v2"),
  /** Модель для смеха персонажей в конце (нужны аудио-теги [laughs]). */
  laughModel: z.string().default("eleven_v3"),
  narrator: z.record(Locale, z.object({ elevenlabsVoiceId: z.string(), notes: z.string().optional() })),
});
export type VoiceConfig = z.infer<typeof VoiceConfig>;

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
  id: z.string(), // `${jokeId}.${locale}`
  jokeId: z.string(),
  locale: Locale,
  adaptation: z.enum(["original", "direct", "reworked", "unfit"]),
  notes: z.string().default(""),
  title: z.string(),
  /** id фона из content/locations */
  location: z.string(),
  /** id кукол слева направо */
  cast: z.array(z.string()).min(1).max(3),
  /** кукла → каноническая роль (выбирает костюм) */
  roles: z.record(z.string(), z.string()).default({}),
  lines: z
    .array(
      z.object({
        character: z.string(), // id куклы из cast или "narrator"
        text: z.string().min(1),
        emotion: Emotion,
        pauseAfterSec: z.number(),
        enter: z.array(z.string()).default([]),
        exit: z.array(z.string()).default([]),
        laugh: Laugh.optional(),
      }),
    )
    .min(1),
});
export type ScriptDraft = z.infer<typeof ScriptDraft>;

/**
 * Проверка выходов и уходов: говорит только тот, кто в кадре; входит — кто отсутствует; уходит — кто присутствует.
 * Кто начинает за кадром: кукла, чьё первое событие — enter.
 */
export function stagingProblems(cast: string[], lines: { character: string; enter?: string[]; exit?: string[] }[]): string[] {
  const pr: string[] = [];
  const first = new Map<string, "enter" | "exit">();
  for (const l of lines) {
    for (const id of l.enter ?? []) if (!first.has(id)) first.set(id, "enter");
    for (const id of l.exit ?? []) if (!first.has(id)) first.set(id, "exit");
  }
  const on = new Set(cast.filter((id) => first.get(id) !== "enter"));
  lines.forEach((l, i) => {
    for (const id of [...(l.enter ?? []), ...(l.exit ?? [])]) {
      if (id === NARRATOR) pr.push(`line ${i + 1}: narrator cannot enter/exit`);
      else if (!cast.includes(id)) pr.push(`line ${i + 1}: ${id} not in cast`);
    }
    for (const id of l.enter ?? []) {
      if (on.has(id)) pr.push(`line ${i + 1}: ${id} enters but is already on stage`);
      on.add(id);
    }
    if (l.character !== NARRATOR && !on.has(l.character)) pr.push(`line ${i + 1}: ${l.character} speaks while off stage`);
    for (const id of l.exit ?? []) {
      if (!on.has(id)) pr.push(`line ${i + 1}: ${id} exits but is not on stage`);
      on.delete(id);
    }
  });
  return pr;
}


/** Сцены эпизода: явные (v2) или одна сцена из полей старого формата. */
export function scenesOf(ep: Episode): Scene[] {
  if (ep.scenes?.length) return ep.scenes;
  return [{ location: ep.location, place: ep.place, cast: ep.cast, roles: ep.roles, beats: ep.lines.map((l) => ({ type: "line" as const, ref: l.id })), transition: "cut" }];
}

/** Реплики в порядке показа (по битам сцен). */
export function orderedLines(ep: Episode): Line[] {
  const byId = new Map(ep.lines.map((l) => [l.id, l]));
  return scenesOf(ep).flatMap((s) => s.beats.flatMap((b) => (b.type === "line" && byId.has(b.ref) ? [byId.get(b.ref)!] : [])));
}

/**
 * Проверка сцен (v2): реплики подключены ровно по одному разу; говорит, ходит и держит реквизит только тот, кто в кадре;
 * входят только отсутствующие, уходят только присутствующие; метки и реквизит существуют.
 */
export function sceneProblems(
  ep: { lines: { id: string; character: string; enter?: string[]; exit?: string[] }[]; scenes?: Scene[] },
  opts: { marksOf: (location: string) => string[] | undefined; props: string[] },
): string[] {
  const pr: string[] = [];
  const scenes = ep.scenes ?? [];
  const byId = new Map(ep.lines.map((l) => [l.id, l]));
  const used = new Map<string, number>();
  scenes.forEach((sc, si) => {
    const tag = `scene ${si + 1}`;
    const marks = opts.marksOf(sc.location);
    // кто стартует за кадром: первое событие — вход (line.enter или move с from)
    const first = new Map<string, "in" | "out">();
    for (const b of sc.beats) {
      if (b.type === "line") {
        const l = byId.get(b.ref);
        for (const id of l?.enter ?? []) if (!first.has(id)) first.set(id, "in");
        if (l && !first.has(l.character)) first.set(l.character, "out");
        for (const id of l?.exit ?? []) if (!first.has(id)) first.set(id, "out");
      } else if (b.type === "move" && !first.has(b.who)) first.set(b.who, b.from ? "in" : "out");
      else if (b.type === "prop" && !first.has(b.who)) first.set(b.who, "out");
    }
    const here = new Set(sc.cast.filter((id) => first.get(id) !== "in"));
    const need = (who: string, what: string) => {
      if (who === NARRATOR) return;
      if (!sc.cast.includes(who)) pr.push(`${tag}: ${who} ${what} but is not in the scene cast`);
      else if (!here.has(who)) pr.push(`${tag}: ${who} ${what} while off stage`);
    };
    for (const b of sc.beats) {
      if (b.type === "line") {
        const l = byId.get(b.ref);
        if (!l) { pr.push(`${tag}: line ${b.ref} does not exist`); continue; }
        used.set(b.ref, (used.get(b.ref) ?? 0) + 1);
        for (const id of l.enter ?? []) { if (here.has(id)) pr.push(`${tag}: ${id} enters but is already on stage`); here.add(id); }
        need(l.character, "speaks");
        for (const id of l.exit ?? []) { if (!here.has(id)) pr.push(`${tag}: ${id} exits but is not on stage`); here.delete(id); }
      } else if (b.type === "move") {
        if (!sc.cast.includes(b.who)) { pr.push(`${tag}: ${b.who} moves but is not in the scene cast`); continue; }
        if (b.from) { if (here.has(b.who)) pr.push(`${tag}: ${b.who} enters from ${b.from} but is already on stage`); here.add(b.who); }
        else need(b.who, "moves");
        if (b.to.startsWith("off-")) here.delete(b.who);
        else if (marks && marks.length && !marks.includes(b.to)) pr.push(`${tag}: unknown mark "${b.to}" at ${sc.location} (marks: ${marks.join(", ")})`);
        else if (!marks?.length) pr.push(`${tag}: ${sc.location} has no marks; use enter/exit on lines instead of move`);
      } else if (b.type === "prop") {
        need(b.who, `uses ${b.item}`);
        if (!opts.props.includes(b.item)) pr.push(`${tag}: unknown prop "${b.item}" (props: ${opts.props.join(", ")})`);
        if (b.action === "give" && b.to && !here.has(b.to)) pr.push(`${tag}: ${b.who} gives ${b.item} to ${b.to} who is not on stage`);
      } else if (b.type === "camera" && b.on) need(b.on, "is the camera target");
    }
  });
  if (scenes.length) {
    for (const l of ep.lines) if (!used.has(l.id)) pr.push(`line ${l.id} is not used in any scene`);
    for (const [id, n] of used) if (n > 1) pr.push(`line ${id} is used ${n} times`);
  }
  return pr;
}

/** Сборник: несколько анекдотов подряд с пролётом по городу между ними (content/compilations/<id>.json хранит id эпизодов). */
export const CompilationSpec = z.object({
  id: z.string(),
  locale: Locale,
  title: z.string(),
  episodes: z.array(z.string()).min(2),
  transition: z.enum(["flyover", "wipe"]).default("flyover"),
});
export type CompilationSpec = z.infer<typeof CompilationSpec>;
/** Пропсы рендера сборника: эпизоды целиком. */
export const CompilationProps = z.object({ id: z.string(), locale: Locale, title: z.string(), episodes: z.array(Episode).min(1) });
export type CompilationProps = z.infer<typeof CompilationProps>;
