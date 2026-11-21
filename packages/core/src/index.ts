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
export const SET_ITEMS = ["dining-table", "table", "desk", "counter", "lectern", "sofa", "bed", "christmas-tree", "chair", "bench", "stool", "armchair", "row-of-chairs", "scales", "sink", "specimen-shelf", "swing"] as const;
export const SetItem = z.object({
  item: z.string(),
  /** Метка места (content/locations → marks), left/center/right; по умолчанию center. */
  at: z.string().optional(),
  size: z.enum(["small", "normal", "big"]).optional(),
  /** Сидят за ним: куклы в пределах стола по умолчанию сидят (dining-table, table — да; стулья и скамьи — сиденья). */
  seat: z.boolean().optional(),
  /** План (по умолчанию: стол — средний, диван/кровать/ёлка — дальний, стул — план метки). */
  plane: Plane.optional(),
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
  location: z.string(), // id фона (content/locations)
  /** Каноническая локация сцены (например "park" для фона "ulitsa") — выбирает вариант фона. */
  place: z.string().optional(),
  /** Участники слева направо (id кукол). */
  cast: z.array(z.string()).min(1),
  /** Роль каждой куклы в этом эпизоде (castId → canonical role) — выбирает вариант костюма. */
  roles: z.record(z.string(), z.string()).default({}),
  /** Костюм на эпизод (без scenes): castId → патч внешности. */
  looks: z.record(z.string(), LookPatch).optional(),
  /** Массовка (без scenes). */
  crowd: Crowd.optional(),
  /** Мебель (без scenes). */
  set: z.array(SetItem).optional(),
  lines: z.array(Line).min(1),
  /** id музыкального трека из content/audio.json; нет — выбирается по hash(id), "none" — без музыки. */
  music: z.string().optional(),
  /** Рендер без цензуры: субтитры из lines[].uncensored (для неозвученных; озвучка — чистая версия). */
  explicit: z.boolean().default(false),
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

/**
 * Проверка выходов и уходов: говорит только тот, кто в кадре; входит — кто отсутствует; уходит — кто присутствует.
 * Кто начинает за кадром: кукла, чьё первое событие — enter.
 */
export function stagingProblems(cast: string[], lines: { character: string; enter?: string[]; exit?: string[]; offscreen?: boolean }[]): string[] {
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
    // голос из-за кадра (offscreen) может звучать, пока кукла не в кадре
    if (l.character !== NARRATOR && !l.offscreen && !on.has(l.character)) pr.push(`line ${i + 1}: ${l.character} speaks while off stage`);
    for (const id of l.exit ?? []) {
      if (!on.has(id)) pr.push(`line ${i + 1}: ${id} exits but is not on stage`);
      on.delete(id);
    }
  });
  return pr;
}


/** Сцены эпизода: явные (v2) или одна сцена из полей старого формата. */
export function scenesOf(ep: Episode): Scene[] {
  // place эпизода (архетип из разметки) в сцены НЕ переносится: сцена без place — вид по умолчанию (сценарист задаёт комнату сам)
  if (ep.scenes?.length) return ep.scenes;
  return [{
    location: ep.location, place: ep.place, cast: ep.cast, roles: ep.roles, looks: ep.looks, crowd: ep.crowd, set: ep.set,
    beats: ep.lines.map((l) => ({ type: "line" as const, ref: l.id })), transition: "cut",
  }];
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
  ep: { lines: { id: string; character: string; enter?: string[]; exit?: string[]; offscreen?: boolean }[]; scenes?: Scene[] },
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
    // кто стартует за кадром: первое событие — вход (line.enter или move с from)
    const first = new Map<string, "in" | "out">();
    for (const b of sc.beats) {
      if (b.type === "line") {
        const l = byId.get(b.ref);
        for (const id of l?.enter ?? []) if (!first.has(id)) first.set(id, "in");
        if (l && !l.offscreen && !first.has(l.character)) first.set(l.character, "out");
        for (const id of l?.exit ?? []) if (!first.has(id)) first.set(id, "out");
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
        for (const id of l.enter ?? []) { if (here.has(id)) pr.push(`${tag}: ${id} enters but is already on stage`); here.add(id); }
        if (!l.offscreen) need(l.character, "speaks");
        else if (l.character !== NARRATOR && !sc.cast.includes(l.character)) pr.push(`${tag}: ${l.character} speaks off screen but is not in the scene cast (needed for the voice)`);
        for (const id of l.exit ?? []) { if (!here.has(id)) pr.push(`${tag}: ${id} exits but is not on stage`); here.delete(id); }
      } else if (b.type === "move") {
        if (!sc.cast.includes(b.who)) { pr.push(`${tag}: ${b.who} moves but is not in the scene cast`); continue; }
        if (b.from) { if (here.has(b.who)) pr.push(`${tag}: ${b.who} enters from ${b.from} but is already on stage`); here.add(b.who); }
        else need(b.who, "moves");
        // в нижней половине разделённого экрана — метки своего места
        const loc = sc.split?.cast.includes(b.who) ? sc.split.location : sc.location;
        const mk = loc === sc.location ? marks : opts.marksOf(loc, sc.split?.place);
        if (b.to.startsWith("off-")) here.delete(b.who);
        else if (mk && mk.length && !mk.includes(b.to)) pr.push(`${tag}: unknown mark "${b.to}" at ${loc} (marks: ${mk.join(", ")})`);
        else if (!mk?.length) pr.push(`${tag}: ${loc} has no marks; use enter/exit on lines instead of move`);
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
