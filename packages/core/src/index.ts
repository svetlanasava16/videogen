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
  /** Чистая версия для публикации (мат заменён мягким: «нафиг», «блин»). */
  text: z.string(),
  /** Версия без цензуры (слова источника), только если отличается от text. */
  uncensored: z.string().optional(),
  /** Голос из-за кадра: говорящего не видно (из бутылки, из-за двери, сверху, невидимка). Кукла может так и не появиться. */
  offscreen: z.boolean().optional(),
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
  /** Закадровый смех после реплики. Если ни у одной реплики нет — "big" после последней. */
  laugh: Laugh.optional(),
});
export type Line = z.infer<typeof Line>;

/**
 * Сцена как данные (движок v2). Реплики живут в плоском Episode.lines (их озвучивают и субтитрируют),
 * сцена ссылается на них битом {type:"line", ref}. Остальные биты — действия без кода на эпизод.
 */
export const Shot = z.enum(["wide", "group", "two", "close"]);
export type Shot = z.infer<typeof Shot>;

/** Переопределение внешности: заменить цвета/причёску, добавить/убрать аксессуары (для роли или для эпизода). */
export const LookPatch = z.object({
  clothes: z.string().optional(),
  accent: z.string().optional(),
  hair: z.string().optional(),
  hairStyle: z.string().optional(),
  /** Телосложение на эпизод: portly — толстый живот, slim — худой. */
  build: z.string().optional(),
  /** Цвет кожи на эпизод: серый — статуя, зелёный — больной… */
  skin: z.string().optional(),
  add: z.array(z.string()).default([]),
  remove: z.array(z.string()).default([]),
});
export type LookPatch = z.infer<typeof LookPatch>;

/** Массовка: задний ряд молчаливых фигур (пассажиры, ученики, гости…). Не говорит, реагирует битом crowd. */
export const Crowd = z.object({
  /** Кто это (для подбора фигур и подписи в сценарии): passengers, pupils, guests, audience, patients, soldiers, people… */
  who: z.string().default("people"),
  size: z.enum(["few", "many"]).default("many"),
  /** back — задний ряд за героями (по умолчанию); front — зрители в зале: силуэты голов в нижних рядах, спиной к нам. */
  at: z.enum(["back", "front"]).optional(),
  /** Сидят (пассажиры в салоне, зрители, очередь): фигуры сидят, перед ними спинки кресел цвета seatColor. */
  seated: z.boolean().optional(),
  seatColor: z.string().optional(),
});
export type Crowd = z.infer<typeof Crowd>;
/** flee — массовка с криком убегает за край кадра и больше не возвращается в этой сцене. */
/**
 * Действия кукол (бит act): отыгрыш того, что говорит рассказчик. Позы-состояния (STATE_ACTS) держатся
 * до следующего act этой куклы или до stand; остальные — sec секунд (по умолчанию 1.2).
 */
export const ACTS = [
  "slap", "punch", "hit-head", "cover-ears", "cover-eyes", "cover-face", "hug", "kiss", "point", "wave", "facepalm", "shrug",
  "nod", "shake-head", "bow", "kneel", "sit", "stand", "fall", "faint", "lie", "jump", "run", "cry", "laugh", "drink", "eat",
  "scratch-head", "hands-up", "clap", "pray-hands", "think", "sleep", "throw", "grab", "knock", "dance", "shiver", "flex", "write", "phone", "whistle", "look-down", "turn",
] as const;
export type Act = (typeof ACTS)[number];
/** Позы-состояния: держатся, пока кукла не сделает другое действие или stand. */
export const STATE_ACTS: readonly Act[] = ["cover-ears", "cover-eyes", "cover-face", "kneel", "sit", "lie", "sleep", "faint", "pray-hands", "hands-up", "think", "write", "phone"];
/** Действия по цели: кукла подходит к цели (to), цель вздрагивает (slap/punch/hit-head) или принимает (hug/kiss). */
export const TARGET_ACTS: readonly Act[] = ["slap", "punch", "hit-head", "hug", "kiss", "throw", "grab"];

/**
 * Планы глубины (как в South Park): z = 0 — передний план (крупнее, ниже в кадре), 0.5 — средний (по умолчанию),
 * 1 — дальний, у стены (мельче, выше). Геометрия плана — remotion/src/world/depth.ts.
 */
export const PLANES = { front: 0, mid: 0.5, back: 1 } as const;
export const Plane = z.enum(["front", "mid", "back"]);
export type Plane = z.infer<typeof Plane>;
/** Сиденья, нарисованные в фоне или мебелью: кукла на метке с seat сидит сама. */
export const SEATS = ["chair", "bench", "couch", "stool", "armchair", "car-seat", "pilot-seat", "bed"] as const;
export type Seat = (typeof SEATS)[number];
/**
 * Метка места: число — x (доля ширины сцены, средний план), или {x, z, seat}: z — план (0 перед, 1 у стены),
 * seat — на метке сиденье (кукла на ней сидит, пока не встанет или не пойдёт).
 */
export const Mark = z.union([
  z.number().min(0).max(1),
  z.object({ x: z.number().min(0).max(1), z: z.number().min(0).max(1).optional(), seat: z.enum(SEATS).optional() }),
]);
export type Mark = z.infer<typeof Mark>;
export const markOf = (m: Mark | undefined): { x: number; z: number; seat?: Seat } | undefined =>
  m === undefined ? undefined : typeof m === "number" ? { x: m, z: PLANES.mid } : { x: m.x, z: m.z ?? PLANES.mid, seat: m.seat };

/** Поверхность в фоне (стойка, прилавок, стол): положенный предмет (prop put) ложится на неё. x0..x1 — доли ширины, top — высота над полом плана z (px при масштабе 1). */
export const Surface = z.object({ x0: z.number(), x1: z.number(), z: z.number().min(0).max(1), top: z.number() });
export type Surface = z.infer<typeof Surface>;
/** Передний слой фона (стойка бара, прилавок): рисуется поверх кукол, стоящих дальше z, и под теми, кто ближе. */
export const FrontLayer = z.object({ z: z.number().min(0).max(1) });
/**
 * Автослот места: куда встаёт кукла без своей метки (нет move или move to "auto"). Порядок в списке — приоритет.
 * roles — слот для этих ролей (бармен за стойкой); без roles — для остальных: берутся первые по числу кукол
 * и раздаются слева направо в порядке cast. Слотов не хватило — прежняя раскладка по ширине.
 */
export const Slot = z.object({ mark: z.string(), roles: z.array(z.string()).optional() });
export type Slot = z.infer<typeof Slot>;

/** Транспорт снаружи: рисуется remotion/src/world/Vehicles.tsx (вид сбоку), седоки видны в окнах или сидят верхом. */
export const VEHICLES = ["car", "taxi", "police-car", "ambulance", "bus", "tram", "train", "truck", "tractor", "bicycle", "motorcycle", "scooter", "horse-cart", "road-roller"] as const;
export type VehicleKind = (typeof VEHICLES)[number];
export const Vehicle = z.object({
  /** id в сцене (car1, bus) — на него ссылаются биты drive/board/alight. */
  id: z.string(),
  kind: z.enum(VEHICLES),
  /** Стоит на метке с начала сцены; нет — за краем, пока не въедет (drive с from). */
  at: z.string().optional(),
  plane: Plane.optional(),
  /** Кто уже внутри с начала сцены (первый — водитель). */
  riders: z.array(z.string()).default([]),
  /** Смотрит влево (едет справа налево). */
  facing: z.enum(["left", "right"]).optional(),
  /** Цвет кузова легковой (car): две машины в одной сцене различаются цветом — «запорожец» и иномарка. */
  color: z.string().optional(),
});
export type Vehicle = z.infer<typeof Vehicle>;

/** Мебель на сцене (то, о чём говорит анекдот, но чего нет в фоне): стол, прилавок, кафедра… Рисует remotion/src/world/SetPieces.tsx. */
export const SET_ITEMS = ["dining-table", "table", "desk", "counter", "lectern", "sofa", "bed", "christmas-tree", "chair", "bench", "stool", "armchair", "row-of-chairs", "scales", "sink", "specimen-shelf", "swing", "toilet"] as const;
export const SetItem = z.object({
  item: z.string(),
  /** Метка места (content/locations → marks), left/center/right; по умолчанию center. */
  at: z.string().optional(),
  size: z.enum(["small", "normal", "big"]).optional(),
  /** Сидят за ним: куклы в пределах стола по умолчанию сидят (dining-table, table — да; стулья и скамьи — сиденья). */
  seat: z.boolean().optional(),
  /** План (по умолчанию: стол — средний, диван/кровать/ёлка — дальний, стул — план метки). */
  plane: Plane.optional(),
  /** Цвет предмета, если он бывает разным (унитаз: белый, голубой, розовый). */
  color: z.string().optional(),
});
export type SetItem = z.infer<typeof SetItem>;
export const CrowdReact = z.enum(["scream", "gasp", "laugh", "cheer", "murmur", "calm", "flee"]);
export type CrowdReact = z.infer<typeof CrowdReact>;


export const Beat = z.discriminatedUnion("type", [
  z.object({ type: z.literal("line"), ref: z.string() }),
  /** Пройти к метке места (content/locations → marks) или уйти за край; from — войти из-за края. */
  /** plane — на какой план встать (иначе план метки); via — пройти впереди (front, по умолчанию) или за спинами (back). */
  z.object({ type: z.literal("move"), who: z.string(), to: z.string(), from: z.enum(["off-left", "off-right"]).optional(), plane: Plane.optional(), via: z.enum(["front", "back"]).optional() }),
  /** Реквизит (content/props.json): взять, отдать (to — кому), уронить, положить. */
  z.object({ type: z.literal("prop"), who: z.string(), item: z.string(), action: z.enum(["hold", "give", "drop", "put"]), to: z.string().optional() }),
  /** Явный план камеры (иначе — авто-режиссура). */
  z.object({ type: z.literal("camera"), shot: Shot, on: z.string().optional() }),
  /** Звуковой эффект из content/audio.json (kind sfx). */
  z.object({ type: z.literal("sfx"), id: z.string() }),
  z.object({ type: z.literal("pause"), sec: z.number().min(0).max(5) }),
  /** Тряска кадра (взлёт, турбуленция, удар, взрыв): идёт параллельно со следующими репликами, sec секунд. */
  z.object({ type: z.literal("shake"), sec: z.number().min(0.2).max(10).default(1.5), strength: z.enum(["light", "strong"]).default("light") }),
  /** Действие куклы во время следующей реплики (подзатыльник, закрыть уши, сесть, упасть…), to — цель. */
  z.object({ type: z.literal("act"), who: z.string(), act: z.enum(ACTS), to: z.string().optional(), sec: z.number().min(0.2).max(10).optional() }),
  /** Реакция массовки сцены (scene.crowd): кричит, ахает, смеётся, ликует, шумит, успокаивается. */
  z.object({ type: z.literal("crowd"), react: CrowdReact }),
  /** Машина (scene.vehicles) едет к метке, въезжает из-за края (from) или уезжает (to: off-left/off-right) вместе с седоками. */
  z.object({ type: z.literal("drive"), vehicle: z.string(), to: z.string(), from: z.enum(["off-left", "off-right"]).optional() }),
  /** Садится в машину (виден в окне / верхом); alight — выходит рядом с ней или идёт к метке to. */
  z.object({ type: z.literal("board"), who: z.string(), vehicle: z.string() }),
  z.object({ type: z.literal("alight"), who: z.string(), vehicle: z.string(), to: z.string().optional() }),
]);
export type Beat = z.infer<typeof Beat>;
export const Transition = z.enum(["cut", "wipe", "flyover"]);
export const Scene = z.object({
  location: z.string(),
  place: z.string().optional(),
  cast: z.array(z.string()).min(1),
  roles: z.record(z.string(), z.string()).default({}),
  /** Костюм на эпизод: castId → патч внешности поверх роли (тёмные очки слепому, фартук…). */
  looks: z.record(z.string(), LookPatch).optional(),
  crowd: Crowd.optional(),
  /** Мебель сцены: стол перед куклами («за столом»), прилавок, кафедра, диван сзади, стулья… */
  set: z.array(SetItem).optional(),
  /** Транспорт снаружи: машина, автобус, велосипед… (биты drive/board/alight). */
  vehicles: z.array(Vehicle).optional(),
  /**
   * Разделённый экран (телефонный разговор двух мест): верхняя половина — location сцены,
   * нижняя — split.location; split.cast — кто из cast стоит внизу.
   */
  split: z.object({ location: z.string(), place: z.string().optional(), cast: z.array(z.string()).min(1) }).optional(),
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
  /** Вид эпизода (замороженная схема v2): joke — анекдот; meme и bridge (связка серии) — зарезервированы. */
  kind: z.enum(["joke", "meme", "bridge"]).default("joke"),
  /** Версия схемы эпизода. Старые файлы переводит migrateEpisodeData (pnpm migrate-episodes). */
  v: z.literal(2).default(2),
  /** Место первой сцены (сводка для базы и обложки; рисуют сцены). */
  location: z.string(),
  /** Каноническая локация из разметки (архетип: "doctor-office", "park"…) — метаданные; комнату сцены задаёт scenes[].place. */
  place: z.string().optional(),
  /** Все куклы эпизода (сводка; кто в кадре — scenes[].cast). */
  cast: z.array(z.string()).min(1),
  /** Роли кукол (сводка; костюм в сцене — scenes[].roles). */
  roles: z.record(z.string(), z.string()).default({}),
  lines: z.array(Line).min(1),
  /** id музыкального трека из content/audio.json; нет — выбирается по hash(id), "none" — без музыки. */
  music: z.string().optional(),
  /** Рендер без цензуры: субтитры из lines[].uncensored (для неозвученных; озвучка — чистая версия). */
  explicit: z.boolean().default(false),
  /**
   * Флаги риска самого эпизода (как у разметки анекдота): political, real-person… Эпизод с флагом из PUBLISH_BLOCKING
   * не попадает в постинг (db sync ставит rejected) и в автосборники. Для своих анекдотов без разметки.
   */
  flags: z.array(z.enum(["ethnic", "sexual", "political", "violence", "religion", "profanity", "dark", "real-person", "drugs", "homophobia", "exclude"])).optional(),
  /** Сцены: где, кто, что делает (биты). Каждая реплика из lines — ровно в одном бите line, по порядку. */
  scenes: z.array(Scene).min(1),
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

/**
 * Гардероб (content/wardrobe/*.json): одежда, аксессуары, причёски — данные, код рисует их библиотекой примитивов
 * (remotion/src/puppet/wardrobe.tsx). Слот — куда крепится вещь на риге:
 * head-back — за головой (капюшон, платок); hair — причёска (look.hairStyle: draw — поверх головы, back — за головой);
 * face, head, hat — на голове поверх лица, в порядке look.accessories (hat — головной убор: один на голове, при чужой форме свой снимается);
 * torso — на теле (обрезка по контуру тела, порядок по layer; clip: false — поверх тела без обрезки, как шуба);
 * hand — после рук (предмет у тела); rig — вещь целиком рисует риг (ряса, крюк, простыня-привидение).
 */
export const WARDROBE_SLOTS = ["head-back", "hair", "face", "head", "hat", "torso", "hand", "rig"] as const;
/** Фигура примитива: { p: "path" | "rect" | … | "each" | имя примитива, …параметры }. Числа — числа или выражения над размерами тела. */
export const WardrobeShape: z.ZodType<{ p: string; [k: string]: unknown }> = z.object({ p: z.string() }).passthrough();
export const WardrobeItem = z.object({
  id: z.string(),
  slot: z.enum(WARDROBE_SLOTS),
  /** Короткое описание для людей. */
  note: z.string().optional(),
  /** Порядок на теле (torso): 0 — форма (низ), 1 — жилет/халат поверх, 2 — нагрудные детали (по умолчанию). */
  layer: z.number().optional(),
  /** torso: false — рисуется поверх тела без обрезки по контуру (шуба, полотенце). */
  clip: z.boolean().optional(),
  /** Переносится как форма роли от куклы — хозяйки роли (costumeFor). */
  wear: z.boolean().optional(),
  /** Форма на руках и ногах (рисует риг): рукава, брюки, нашивки на манжетах, погоны, полосы. */
  outfit: z.object({
    sleeve: z.string().optional(),
    pants: z.string().optional(),
    cuff: z.object({ color: z.string(), n: z.number() }).optional(),
    board: z.object({ color: z.string(), edge: z.string().optional(), stars: z.number().optional(), star: z.string().optional() }).optional(),
    stripes: z.string().optional(),
  }).optional(),
  /** Эффекты, которые рисует сам риг: ряса цвета robe, крюк вместо кисти, гипс, мех на рукавах, пятна, помада, без бровей, простыня. */
  rig: z.object({
    robe: z.string().optional(),
    hook: z.boolean().optional(),
    plaster: z.boolean().optional(),
    fur: z.boolean().optional(),
    spots: z.boolean().optional(),
    lips: z.string().optional(),
    brows: z.boolean().optional(),
    ghost: z.boolean().optional(),
  }).optional(),
  /** Локальные переменные (выражения), вычисляются по порядку перед рисованием. */
  let: z.record(z.union([z.string(), z.number()])).optional(),
  draw: z.array(WardrobeShape).default([]),
  /** Ещё и на голове (пятна) или, у причёски, — часть за головой. */
  head: z.array(WardrobeShape).optional(),
  back: z.array(WardrobeShape).optional(),
});
export type WardrobeItem = z.infer<typeof WardrobeItem>;
export const WardrobeFile = z.object({ items: z.array(WardrobeItem) });

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
    build: patch.build ?? look.build,
    skin: patch.skin ?? look.skin,
    accessories: acc,
  };
}

/** Внешность куклы в конкретной роли (с учётом варианта костюма) и с костюмом эпизода поверх. */
export function lookForRole(c: Character, role?: string, episode?: LookPatch): Look {
  const v = role ? c.bible?.variants.find((x) => x.roles.includes(role)) : undefined;
  return applyLook(applyLook(c.look, v?.look), episode);
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
  /**
   * Фон из деталей (без кода): база room/outdoor + детали из remotion/src/backdrops/parts.tsx с координатами (кадр 1080×1920, пол y=1190).
   * Используется, если для id нет нарисованного компонента.
   */
  kit: z
    .object({
      base: z.enum(["room", "outdoor"]),
      sky: z.string().optional(),
      ground: z.string().optional(),
      horizon: z.number().optional(),
      items: z
        .array(
          z.object({
            part: z.enum(["window", "door", "shelf", "lamp", "table", "plant", "tree", "fence", "picture", "rug", "cloud", "rect", "circle", "path"]),
            /** Для part=path: SVG-путь в координатах кадра (x/y — сдвиг). */
            d: z.string().optional(),
            x: z.number(),
            y: z.number().optional(),
            w: z.number().optional(),
            h: z.number().optional(),
            r: z.number().optional(),
            s: z.number().optional(),
            color: z.string().optional(),
            color2: z.string().optional(),
            kind: z.string().optional(),
            night: z.boolean().optional(),
            items: z.array(z.string()).optional(),
          }),
        )
        .default([]),
    })
    .optional(),
  /** Метки места: x (доля ширины кадра 0..1) или {x, z, seat} — door, counter, desk, bench-1… Нет — автослоты. */
  marks: z.record(z.string(), Mark).default({}),
  /** Поверхности фона, на которые кладут предметы (стойка, прилавок). */
  surfaces: z.array(Surface).optional(),
  /** Передний слой фона (стойка перед барменом): компонент фона рисует его при layer="front". */
  front: FrontLayer.optional(),
  /** Автослоты вида по умолчанию (у сублокации — свои). */
  slots: z.array(Slot).optional(),
  bible: z
    .object({
      summary: z.string(),
      /** Канонические локации, которые закрывает этот фон. */
      roles: z.array(z.string()),
      /**
       * Сублокации (комнаты места): id = scene.place (waiting-room, cockpit…), roles — канонические локации, которые она закрывает,
       * change — что видно; marks — свои метки (иначе метки места), set — мебель, добавляемая к сцене сама, crowd — массовка по умолчанию.
       */
      variants: z.array(z.object({
        id: z.string().optional(),
        name: z.record(Locale, z.string()).optional(),
        roles: z.array(z.string()),
        change: z.string(),
        marks: z.record(z.string(), Mark).optional(),
        set: z.array(SetItem).optional(),
        crowd: Crowd.optional(),
        surfaces: z.array(Surface).optional(),
        front: FrontLayer.optional(),
        slots: z.array(Slot).optional(),
      })).default([]),
      prompt: z.string(),
    })
    .optional(),
});
export type Location = z.infer<typeof Location>;

/**
 * Роли без особого костюма — их играет любая кукла (обычный мужик, покупатель, жена, ребёнок, пациент…).
 * Роли-внешность — их нельзя «одолжить» костюмом: внешность у куклы-хозяйки (блондинка — светлые волосы),
 * сценарий должен брать саму эту куклу. Остальные роли чужой куклы берут костюм хозяйки (remotion/src/puppet/costume.ts).
 */
export const GENERIC_ROLES = [
  "everyman", "customer", "child", "wife", "husband", "woman", "man", "friend", "neighbor", "employee", "father", "mother", "son",
  "daughter", "patient", "relative", "student", "tourist", "grandma", "grandpa", "driver", "passenger", "guest", "old-man",
  "old-woman", "boy", "girl", "lover", "drunk", "teenager", "baby", "visitor", "colleague", "citizen",
];
export const APPEARANCE_ROLES = ["blonde", "redhead"];
/** Флаги эпизода, при которых он не публикуется (rejected) и не попадает в автосборники. */
export const PUBLISH_BLOCKING = ["political", "real-person", "ethnic", "sexual", "homophobia", "drugs", "exclude"] as const;

/** Сублокация сцены: вариант по id или по roles (старые эпизоды хранят в place канонический архетип). */
export function subLocation(loc: Location | undefined, place: string | undefined) {
  if (!loc || !place || place === loc.id) return undefined;
  const vs = loc.bible?.variants ?? [];
  return vs.find((v) => v.id === place) ?? vs.find((v) => v.roles.includes(place));
}
/** Метки сцены: свои метки сублокации, иначе метки места. */
export const marksFor = (loc: Location | undefined, place: string | undefined): Record<string, Mark> =>
  subLocation(loc, place)?.marks ?? loc?.marks ?? {};

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
  /** Темп воспроизведения озвучки на рендере (высота голоса сохраняется): рассказчик живее персонажей. */
  tempo: z.object({ narrator: z.number().default(1.25), characters: z.number().default(1.1) }).default({ narrator: 1.25, characters: 1.1 }),
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
  cast: z.array(z.string()).min(1),
  /** кукла → каноническая роль (выбирает костюм) */
  roles: z.record(z.string(), z.string()).default({}),
  /** Костюм на эпизод: кукла → патч (add/remove аксессуаров, clothes/hair) — без scenes. */
  looks: z.record(z.string(), LookPatch).optional(),
  /** Массовка — без scenes. */
  crowd: Crowd.optional(),
  /** Мебель — без scenes. */
  set: z.array(SetItem).optional(),
  /** Заявки художнику: чего не хватает, чтобы шутка работала (сценарий всё равно написан на имеющихся куклах). */
  needs: z
    .array(z.object({ kind: z.enum(["accessory", "puppet", "prop", "backdrop", "crowd"]), id: z.string(), description: z.string(), why: z.string().default("") }))
    .optional(),
  lines: z
    .array(
      z.object({
        character: z.string(), // id куклы из cast или "narrator"
        text: z.string().min(1),
        /** Версия без цензуры (слова источника), только если text смягчён. */
        uncensored: z.string().optional(),
        offscreen: z.boolean().optional(),
        emotion: Emotion,
        pauseAfterSec: z.number(),
        enter: z.array(z.string()).default([]),
        exit: z.array(z.string()).default([]),
        laugh: Laugh.optional(),
      }),
    )
    .min(1),
  /** Сцены движка v2 (необязательно): биты ссылаются на реплики l1, l2… по порядку в lines. */
  scenes: z.array(Scene).optional(),
});
export type ScriptDraft = z.infer<typeof ScriptDraft>;

/** Сцены эпизода (после заморозки формата — всегда явные). */
export function scenesOf(ep: Episode): Scene[] {
  return ep.scenes;
}

/** Край, из-за которого кукла входит/куда уходит в старом формате: первая половина cast — слева. */
const legacyEdge = (cast: string[], id: string) => (cast.indexOf(id) < cast.length / 2 ? "off-left" : "off-right");

/**
 * Перевод старого эпизода в формат v2 — детерминированно, без LLM (pnpm migrate-episodes; materialize сценариев).
 * Работает с сырым JSON (до Episode.parse, иначе старые поля молча отбросятся):
 *  - нет scenes → одна сцена из location/cast/roles/looks/crowd/set; place эпизода — комната сцены, только если это
 *    сублокация места (подбирает isPlace), иначе — вид по умолчанию, как и рисовалось раньше;
 *  - lines[].enter → бит move {to: "auto", from: край} перед репликой; lines[].exit → move {to: край} после неё;
 *  - looks/crowd/set верхнего уровня уходят в сцену; enter/exit из реплик удаляются; kind/v проставляются.
 * Повторный запуск ничего не меняет.
 */
export function migrateEpisodeData(raw: Record<string, any>, isPlace: (location: string, place: string) => boolean = () => false): Record<string, any> {
  const ep = JSON.parse(JSON.stringify(raw)) as Record<string, any>;
  const lines = (ep.lines ?? []) as Record<string, any>[];
  lines.forEach((l, i) => { if (!l.id) l.id = `l${i + 1}`; });
  const byId = new Map(lines.map((l) => [l.id as string, l]));
  if (!Array.isArray(ep.scenes) || !ep.scenes.length) {
    ep.scenes = [{
      location: ep.location,
      ...(ep.place && isPlace(ep.location, ep.place) ? { place: ep.place } : {}),
      cast: ep.cast, roles: ep.roles ?? {},
      ...(ep.looks ? { looks: ep.looks } : {}), ...(ep.crowd ? { crowd: ep.crowd } : {}), ...(ep.set ? { set: ep.set } : {}),
      beats: lines.map((l) => ({ type: "line", ref: l.id })), transition: "cut",
    }];
  }
  for (const sc of ep.scenes as Record<string, any>[]) {
    const beats: Record<string, any>[] = [];
    for (const b of sc.beats ?? []) {
      const l = b.type === "line" ? byId.get(b.ref) : undefined;
      for (const id of l?.enter ?? []) if (sc.cast.includes(id)) beats.push({ type: "move", who: id, to: "auto", from: legacyEdge(sc.cast, id) });
      beats.push(b);
      for (const id of l?.exit ?? []) if (sc.cast.includes(id)) beats.push({ type: "move", who: id, to: legacyEdge(sc.cast, id) });
    }
    sc.beats = beats;
  }
  for (const l of lines) { delete l.enter; delete l.exit; }
  delete ep.looks; delete ep.crowd; delete ep.set;
  // сводка: все куклы и роли эпизода (первая сцена — первой), место — первой сцены
  const scs = ep.scenes as Record<string, any>[];
  ep.location = scs[0].location;
  ep.cast = [...new Set(scs.flatMap((sc) => sc.cast as string[]))];
  ep.roles = Object.assign({}, ...[...scs].reverse().map((sc) => sc.roles ?? {}));
  ep.kind ??= "joke";
  ep.v = 2;
  return ep;
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
  ep: { lines: { id: string; character: string; offscreen?: boolean }[]; scenes?: Scene[] },
  /** marksOf(location, place) — метки сублокации (place) или места; places(location) — id сублокаций (для проверки place). */
  opts: { marksOf: (location: string, place?: string) => string[] | undefined; props: string[]; places?: (location: string) => string[] | undefined },
): string[] {
  const pr: string[] = [];
  const scenes = ep.scenes ?? [];
  for (const [si, sc] of scenes.entries()) {
    if (sc.beats.some((b) => b.type === "crowd") && !sc.crowd) pr.push(`scene ${si + 1}: crowd beat but the scene has no crowd`);
    for (const id of Object.keys(sc.looks ?? {})) if (!sc.cast.includes(id)) pr.push(`scene ${si + 1}: looks for ${id} who is not in the scene cast`);
    for (const id of sc.split?.cast ?? []) if (!sc.cast.includes(id)) pr.push(`scene ${si + 1}: split.cast ${id} is not in the scene cast`);
    if (sc.split && sc.split.cast.length === sc.cast.length) pr.push(`scene ${si + 1}: split needs someone in the top half too`);
    for (const [loc, place] of [[sc.location, sc.place], [sc.split?.location, sc.split?.place]] as const) {
      const ps = loc && place && place !== loc ? opts.places?.(loc) : undefined;
      if (ps && !ps.includes(place!)) pr.push(`scene ${si + 1}: unknown place "${place}" at ${loc} (places: ${ps.join(", ") || "none"})`);
    }
    const vids = (sc.vehicles ?? []).map((v) => v.id);
    if (new Set(vids).size !== vids.length) pr.push(`scene ${si + 1}: vehicle ids must be unique`);
    for (const v of sc.vehicles ?? []) for (const r of v.riders) if (!sc.cast.includes(r)) pr.push(`scene ${si + 1}: rider ${r} of ${v.id} is not in the scene cast`);
  }
  const byId = new Map(ep.lines.map((l) => [l.id, l]));
  const used = new Map<string, number>();
  scenes.forEach((sc, si) => {
    const tag = `scene ${si + 1}`;
    const marks = opts.marksOf(sc.location, sc.place);
    const markOk = (to: string, mk = marks) => to.startsWith("off-") || !mk?.length || mk.includes(to);
    // машины: на месте с начала (at), иначе за краем до drive с from; седоки в кадре, пока в кадре машина
    const vehicles = new Map((sc.vehicles ?? []).map((v) => [v.id, { here: !!v.at, riders: new Set(v.riders) }]));
    for (const v of sc.vehicles ?? []) if (v.at && !markOk(v.at)) pr.push(`${tag}: vehicle ${v.id} at unknown mark "${v.at}"`);
    const riding = (id: string) => [...vehicles.values()].find((v) => v.riders.has(id));
    // кто стартует за кадром: первое событие — вход (move с from)
    const first = new Map<string, "in" | "out">();
    for (const b of sc.beats) {
      if (b.type === "line") {
        const l = byId.get(b.ref);
        if (l && !l.offscreen && !first.has(l.character)) first.set(l.character, "out");
      } else if (b.type === "move" && !first.has(b.who)) first.set(b.who, b.from ? "in" : "out");
      // prop не решает, где кукла: можно взять цветы за кадром и войти с ними
    }
    // кто звучит только из-за кадра и ничего больше не делает — в кадре не стоит
    const voiceOnly = new Set(sc.beats.flatMap((b) => (b.type === "line" && byId.get(b.ref)?.offscreen ? [byId.get(b.ref)!.character] : [])).filter((id) => !first.has(id)));
    const here = new Set(sc.cast.filter((id) => first.get(id) !== "in" && !voiceOnly.has(id) && (riding(id)?.here ?? true)));
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
        if (!l.offscreen) need(l.character, "speaks");
        else if (l.character !== NARRATOR && !sc.cast.includes(l.character)) pr.push(`${tag}: ${l.character} speaks off screen but is not in the scene cast (needed for the voice)`);
      } else if (b.type === "move") {
        if (!sc.cast.includes(b.who)) { pr.push(`${tag}: ${b.who} moves but is not in the scene cast`); continue; }
        if (b.from) { if (here.has(b.who)) pr.push(`${tag}: ${b.who} enters from ${b.from} but is already on stage`); here.add(b.who); }
        else need(b.who, "moves");
        // в нижней половине разделённого экрана — метки своего места
        const loc = sc.split?.cast.includes(b.who) ? sc.split.location : sc.location;
        const mk = loc === sc.location ? marks : opts.marksOf(loc, sc.split?.place);
        if (b.to.startsWith("off-")) here.delete(b.who);
        else if (b.to === "auto") { /* автослот: место по порядку в cast */ }
        else if (mk && mk.length && !mk.includes(b.to)) pr.push(`${tag}: unknown mark "${b.to}" at ${loc} (marks: ${mk.join(", ")})`);
        else if (!mk?.length) pr.push(`${tag}: ${loc} has no marks; use "to": "auto"`);
      } else if (b.type === "prop") {
        // взять в руки можно и за кадром (войдёт уже с предметом); отдать/уронить/положить — только в кадре
        if (b.action === "hold") { if (!sc.cast.includes(b.who)) pr.push(`${tag}: ${b.who} holds ${b.item} but is not in the scene cast`); }
        else need(b.who, `uses ${b.item}`);
        if (!opts.props.includes(b.item)) pr.push(`${tag}: unknown prop "${b.item}" (props: ${opts.props.join(", ")})`);
        if (b.action === "give" && b.to && !here.has(b.to)) pr.push(`${tag}: ${b.who} gives ${b.item} to ${b.to} who is not on stage`);
      } else if (b.type === "act") {
        need(b.who, `does ${b.act}`);
        if (b.to && b.to !== NARRATOR && !sc.cast.includes(b.to)) pr.push(`${tag}: ${b.who} ${b.act} to ${b.to} who is not in the scene cast`);
      } else if (b.type === "camera" && b.on) need(b.on, "is the camera target");
      else if (b.type === "drive") {
        const v = vehicles.get(b.vehicle);
        if (!v) { pr.push(`${tag}: drive of unknown vehicle "${b.vehicle}" (scene.vehicles: ${[...vehicles.keys()].join(", ") || "none"})`); continue; }
        if (b.from) { if (v.here) pr.push(`${tag}: ${b.vehicle} drives in from ${b.from} but is already here`); v.here = true; }
        else if (!v.here) pr.push(`${tag}: ${b.vehicle} drives while off stage (use from)`);
        if (!markOk(b.to)) pr.push(`${tag}: unknown mark "${b.to}" for ${b.vehicle}`);
        if (b.to.startsWith("off-")) v.here = false;
        for (const r of v.riders) if (v.here) here.add(r); else here.delete(r);
      } else if (b.type === "board" || b.type === "alight") {
        const v = vehicles.get(b.vehicle);
        if (!v) { pr.push(`${tag}: ${b.type} unknown vehicle "${b.vehicle}"`); continue; }
        if (!sc.cast.includes(b.who)) { pr.push(`${tag}: ${b.who} ${b.type}s but is not in the scene cast`); continue; }
        if (b.type === "board") {
          if (!v.here) pr.push(`${tag}: ${b.who} boards ${b.vehicle} which is off stage`);
          need(b.who, "boards");
          v.riders.add(b.who);
        } else {
          if (!v.riders.has(b.who)) pr.push(`${tag}: ${b.who} alights from ${b.vehicle} without riding it`);
          if (!v.here) pr.push(`${tag}: ${b.who} alights from ${b.vehicle} which is off stage`);
          v.riders.delete(b.who);
          if (b.to && !markOk(b.to)) pr.push(`${tag}: unknown mark "${b.to}"`);
          here.add(b.who);
        }
      }
    }
  });
  if (scenes.length) {
    // реплики идут в сценах по порядку lines (панчлайн — последним)
    const refs = scenes.flatMap((sc) => sc.beats.flatMap((b) => (b.type === "line" ? [b.ref] : [])));
    const order = ep.lines.map((l) => l.id).filter((id) => refs.includes(id));
    if (refs.join(",") !== order.join(",")) pr.push(`lines must be referenced in the order of lines (got ${refs.join(", ")})`);
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

/* ============================== Мир (ROADMAP §8) ============================== */
/** Имя на трёх языках. */
export const Names3 = z.object({ ru: z.string().min(1), en: z.string().min(1), de: z.string().min(1) });

/**
 * Канон городка (content/world/canon.json): кварталы, жители, их отношения, постоянные места.
 * Его читают сценарист связок серии и игра. Житель — кукла с именем на каждом языке (одна и та же личность во всех языках).
 */
export const DISTRICT_KINDS = ["center", "quarter", "village", "outskirts", "otherworld"] as const;
export const District = z.object({
  id: z.string(),
  name: Names3,
  kind: z.enum(DISTRICT_KINDS),
  /** Национальный квартал: культурно-специфичные анекдоты этого языка живут здесь. */
  locale: Locale.optional(),
  /** Узел карты (content/world/map.json), где квартал на карте. */
  node: z.string(),
  note: z.string().default(""),
});
/** Место в городке: фон и сублокация. */
export const PlaceRef = z.object({ location: z.string(), place: z.string().optional() });
export const Resident = z.object({
  id: z.string(),
  puppet: z.string(),
  name: Names3,
  /**
   * Квартал. "home" — квартал языка эпизода (семья Мужика: в ru — русский квартал, в de — немецкий);
   * иначе id квартала из districts.
   */
  district: z.string(),
  home: PlaceRef.optional(),
  /** Работа: место и роль (бармен в баре, доктор в поликлинике). */
  work: PlaceRef.extend({ role: z.string() }).optional(),
  /** Роли анекдотов, которые этот житель играет (сопоставление ролей с каноном — pnpm canon-cast). */
  roles: z.array(z.string()).default([]),
  /** Характер — коротко, по-английски (для сценариста). */
  traits: z.string(),
  /** Повторяющиеся шутки и привычки. */
  gags: z.array(z.string()).default([]),
});
export const RELATION_KINDS = ["spouse", "parent", "sibling", "in-law", "neighbor", "boss", "friend", "drinking-buddy", "teacher", "doctor", "owner", "rival"] as const;
/** Отношение: a — к b (parent: a — родитель b; boss: a — начальник b; owner: a — хозяин животного b). spouse, sibling, neighbor, friend — взаимные. */
export const Relation = z.object({ a: z.string(), b: z.string(), kind: z.enum(RELATION_KINDS), note: z.string().default("") });
export const Landmark = z.object({ id: z.string(), name: Names3, location: z.string(), place: z.string().optional(), node: z.string(), owner: z.string().optional() });
export const Canon = z.object({
  v: z.literal(1),
  districts: z.array(District),
  residents: z.array(Resident),
  relations: z.array(Relation),
  landmarks: z.array(Landmark),
});
export type Canon = z.infer<typeof Canon>;
export type Resident = z.infer<typeof Resident>;

/**
 * Состояние мира (content/world/state.json): журнал фактов серий по порядку. Факт держится, пока его не отменит
 * другой (undoes): «машина разбита» → «машину починили». Сценарист связок получает выжимку про участников серии.
 */
export const WorldFact = z.object({
  id: z.string(),
  /** Что произошло: короткий ключ (car-broken, repeats-year) и описание. */
  fact: z.string(),
  text: Names3.partial().default({}),
  actors: z.array(z.string()).default([]),
  /** Где (место и комната), если факт привязан к месту: «бар закрыт на ремонт». */
  place: PlaceRef.optional(),
  series: z.string().optional(),
  episode: z.string().optional(),
  /** Отменяет ранее записанный факт (его id). */
  undoes: z.string().optional(),
});
export const WorldState = z.object({ v: z.literal(1), facts: z.array(WorldFact) });
export type WorldState = z.infer<typeof WorldState>;

/**
 * Карта городка как граф (content/world/map.json): узлы — здания (из town.json) и улицы, рёбра — переходы с временем пути.
 * Пролёты в сборниках идут по графу; новая локация = узел и рёбра в данных.
 */
export const EDGE_KINDS = ["street", "bridge", "road", "bus", "tram", "boat", "plane", "sky", "underground"] as const;
export const MapNode = z.object({
  id: z.string(),
  kind: z.enum(["building", "street", "stop"]),
  x: z.number(), y: z.number(),
  district: z.string(),
  name: Names3.optional(),
});
export const MapEdge = z.object({ a: z.string(), b: z.string(), kind: z.enum(EDGE_KINDS), min: z.number().positive() });
export const TownGraph = z.object({ v: z.literal(1), nodes: z.array(MapNode), edges: z.array(MapEdge) });
export type TownGraph = z.infer<typeof TownGraph>;

// ---------- Мир: маршруты по графу и роли → жители (чистые функции; ROADMAP §8) ----------

export type Route = { nodes: string[]; edges: z.infer<typeof MapEdge>[]; minutes: number };

/** Кратчайший по времени путь между узлами графа городка (Дейкстра; граф маленький — без кучи). */
export function shortestRoute(g: z.infer<typeof TownGraph>, from: string, to: string): Route | undefined {
  const adj = new Map<string, { to: string; e: z.infer<typeof MapEdge> }[]>();
  for (const e of g.edges) {
    (adj.get(e.a) ?? adj.set(e.a, []).get(e.a)!).push({ to: e.b, e });
    (adj.get(e.b) ?? adj.set(e.b, []).get(e.b)!).push({ to: e.a, e });
  }
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { n: string; e: z.infer<typeof MapEdge> }>();
  const done = new Set<string>();
  for (;;) {
    let u: string | undefined, best = Infinity;
    for (const [n, d] of dist) if (!done.has(n) && (d < best || (d === best && u !== undefined && n < u))) { u = n; best = d; }
    if (u === undefined) return undefined;
    if (u === to) break;
    done.add(u);
    for (const { to: v, e } of adj.get(u) ?? []) {
      const d = best + e.min;
      if (d < (dist.get(v) ?? Infinity)) { dist.set(v, d); prev.set(v, { n: u, e }); }
    }
  }
  const nodes = [to], edges: z.infer<typeof MapEdge>[] = [];
  for (let n = to; n !== from; ) { const p = prev.get(n)!; edges.unshift(p.e); nodes.unshift(p.n); n = p.n; }
  return { nodes, edges, minutes: dist.get(to)! };
}

/** Узел графа здания, где показывают место (location/place); сначала точное совпадение place, потом здание локации. */
export function nodeForPlace(g: z.infer<typeof TownGraph>, town: { buildings: { id: string; places: { location: string; place?: string }[] }[] }, location: string, place?: string): string | undefined {
  const b = town.buildings.find((b) => b.places.some((p) => p.location === location && p.place === place))
    ?? town.buildings.find((b) => b.places.some((p) => p.location === location && !p.place))
    ?? town.buildings.find((b) => b.places.some((p) => p.location === location));
  return b && g.nodes.some((n) => n.id === b.id) ? b.id : undefined;
}

export type CastLink = { puppet: string; role?: string; resident?: string; how: "role" | "default" | "none" };

/**
 * Роль куклы в эпизоде → житель канона: сначала житель этой куклы с этой ролью, иначе основной житель куклы
 * (первый в canon.residents). Детерминированно, без LLM. Один житель на двух кукол эпизода — конфликт (см. castConflicts).
 */
export function residentFor(canon: z.infer<typeof Canon>, puppet: string, role?: string): CastLink {
  const mine = canon.residents.filter((r) => r.puppet === puppet);
  const byRole = role ? mine.find((r) => r.roles.includes(role)) : undefined;
  if (byRole) return { puppet, role, resident: byRole.id, how: "role" };
  if (mine[0]) return { puppet, role, resident: mine[0].id, how: "default" };
  return { puppet, role, how: "none" };
}

/** Пары ролей, которым в каноне нужна связь (муж и жена — супруги и т. п.). */
export const ROLE_RELATIONS: { a: string[]; b: string[]; kind: (typeof RELATION_KINDS)[number] }[] = [
  { a: ["husband"], b: ["wife"], kind: "spouse" },
  { a: ["father", "mother"], b: ["son", "daughter", "child", "vovochka", "fritzchen", "baby"], kind: "parent" },
  { a: ["mother-in-law"], b: ["husband"], kind: "in-law" },
  { a: ["boss"], b: ["employee", "secretary"], kind: "boss" },
  { a: ["teacher"], b: ["vovochka", "fritzchen", "child", "student"], kind: "teacher" },
];

/** Связь a–b нужного вида в каноне (в любую сторону; parent/boss/teacher — направленные: a старший). */
export function related(canon: z.infer<typeof Canon>, a: string, b: string, kind: string): boolean {
  const directed = kind === "parent" || kind === "boss" || kind === "teacher" || kind === "owner";
  return canon.relations.some((r) => r.kind === kind && ((r.a === a && r.b === b) || (!directed && r.a === b && r.b === a)));
}

/** Конфликты состава эпизода с каноном: один житель на двух кукол; роли-пары без связи в каноне. */
export function castConflicts(canon: z.infer<typeof Canon>, links: CastLink[]): string[] {
  const out: string[] = [];
  const seen = new Map<string, string>();
  for (const l of links) {
    if (!l.resident) continue;
    if (seen.has(l.resident)) out.push(`${l.resident} plays both ${seen.get(l.resident)} and ${l.puppet}${l.role ? ` (${l.role})` : ""}`);
    else seen.set(l.resident, `${l.puppet}${l.role ? ` (${l.role})` : ""}`);
  }
  for (const rr of ROLE_RELATIONS) for (const x of links) for (const y of links) {
    if (x === y || !x.resident || !y.resident || x.resident === y.resident) continue;
    if (!x.role || !y.role || !rr.a.includes(x.role) || !rr.b.includes(y.role)) continue;
    if (!related(canon, x.resident, y.resident, rr.kind)) out.push(`${x.role} ${x.resident} and ${y.role} ${y.resident}: no "${rr.kind}" relation in canon`);
  }
  return out;
}

/** Действующие факты журнала мира: без отменённых и без самих отмен (undoes). */
export function activeFacts(state: z.infer<typeof WorldState>): z.infer<typeof WorldFact>[] {
  const undone = new Set(state.facts.map((f) => f.undoes).filter(Boolean) as string[]);
  return state.facts.filter((f) => !undone.has(f.id) && !f.undoes);
}
