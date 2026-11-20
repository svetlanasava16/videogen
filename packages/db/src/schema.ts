/**
 * База ANEK.: контент (копия из git, заливается `pnpm db sync`) + операционные данные
 * (рендеры, публикации, метрики), которые живут только здесь.
 */
import { boolean, index, integer, jsonb, pgTable, primaryKey, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true });
const created = () => ts("created_at").notNull().defaultNow();
const updated = () => ts("updated_at").notNull().defaultNow();

// ---------- контент (источник правды — git) ----------

export const jokes = pgTable("jokes", {
  id: text("id").primaryKey(),
  locale: text("locale").notNull(),
  kind: text("kind").notNull(),
  text: text("text").notNull(),
  source: text("source").notNull(),
  sourceRef: jsonb("source_ref"),
  popularity: real("popularity").notNull().default(0),
  score: integer("score"),
  /** Разметка стадии analyze (персонажи, локация, переводимость, флаги). */
  analysis: jsonb("analysis"),
  excluded: boolean("excluded").notNull().default(false),
  hash: text("hash").notNull(),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("jokes_locale_idx").on(t.locale)]);

export const characters = pgTable("characters", {
  id: text("id").primaryKey(),
  name: jsonb("name").notNull(),
  family: text("family"),
  look: jsonb("look").notNull(),
  bible: jsonb("bible"),
  hash: text("hash").notNull(),
  updatedAt: updated(),
});

export const locations = pgTable("locations", {
  id: text("id").primaryKey(),
  name: jsonb("name").notNull(),
  palette: jsonb("palette"),
  bible: jsonb("bible"),
  hash: text("hash").notNull(),
  updatedAt: updated(),
});

/** Файлы: фоны и куклы (код), звук, озвучка, превью. */
export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(), // backdrop | puppet | laugh | music | voice | thumbnail | other
  path: text("path").notNull(), // относительно корня репо
  sha256: text("sha256").notNull(),
  bytes: integer("bytes").notNull(),
  durationSec: real("duration_sec"),
  license: text("license"),
  sourceUrl: text("source_url"),
  author: text("author"),
  meta: jsonb("meta"),
  updatedAt: updated(),
}, (t) => [index("assets_kind_idx").on(t.kind)]);

export const episodes = pgTable("episodes", {
  id: text("id").primaryKey(), // `${jokeId}.${locale}`
  jokeId: text("joke_id").notNull(),
  locale: text("locale").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  place: text("place"),
  cast: jsonb("cast").$type<string[]>().notNull(),
  roles: jsonb("roles").notNull(),
  lines: jsonb("lines").notNull(),
  /** Сцены движка v2 (null — одна сцена из location/cast/lines). */
  scenes: jsonb("scenes"),
  music: text("music"),
  adaptation: text("adaptation"),
  /** draft | approved | rejected — ручное решение, sync его не трогает. */
  status: text("status").notNull().default("draft"),
  contentHash: text("content_hash").notNull(),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("episodes_locale_idx").on(t.locale), index("episodes_joke_idx").on(t.jokeId)]);

// ---------- операционные данные ----------

export const renders = pgTable("renders", {
  id: serial("id").primaryKey(),
  /** Эпизод или сборник (ровно одно из двух). */
  episodeId: text("episode_id").references(() => episodes.id),
  compilationId: text("compilation_id"),
  path: text("path").notNull(),
  sha256: text("sha256").notNull(),
  bytes: integer("bytes").notNull(),
  durationSec: real("duration_sec").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  fps: integer("fps").notNull(),
  /** Хэш эпизода + звука + кода монтажа на момент рендера: тот же хэш = рендер не нужен. */
  contentHash: text("content_hash").notNull(),
  gitSha: text("git_sha"),
  musicAssetId: text("music_asset_id"),
  voice: text("voice"), // none | elevenlabs | comfy
  createdAt: created(),
}, (t) => [uniqueIndex("renders_episode_hash_idx").on(t.episodeId, t.contentHash)]);

/** Аккаунты площадок (канал на язык). Список — content/accounts.json. */
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(), // yt-ru, tt-en, ig-de, th-ru…
  platform: text("platform").notNull(), // youtube | tiktok | instagram | threads | x | vk
  locale: text("locale").notNull(),
  handle: text("handle"),
  postizIntegrationId: text("postiz_integration_id"),
  active: boolean("active").notNull().default(false),
  updatedAt: updated(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id),
  episodeId: text("episode_id").references(() => episodes.id),
  renderId: integer("render_id").references(() => renders.id),
  compilationId: text("compilation_id"),
  kind: text("kind").notNull(), // video | story | text | compilation
  caption: text("caption").notNull(),
  title: text("title"),
  disclosureVersion: integer("disclosure_version").notNull(),
  aiFlag: boolean("ai_flag").notNull().default(true),
  /** planned → queued (в Postiz) → published | error; draft — черновик в Postiz. */
  state: text("state").notNull().default("planned"),
  scheduledAt: ts("scheduled_at").notNull(),
  postizPostId: text("postiz_post_id"),
  postizMediaId: text("postiz_media_id"),
  publishedAt: ts("published_at"),
  url: text("url"),
  error: text("error"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [
  index("posts_state_idx").on(t.state),
  uniqueIndex("posts_account_episode_kind_idx").on(t.accountId, t.episodeId, t.kind),
]);

/** Снимки метрик поста во времени. */
export const postMetrics = pgTable("post_metrics", {
  postId: integer("post_id").notNull().references(() => posts.id),
  capturedAt: ts("captured_at").notNull().defaultNow(),
  views: integer("views"),
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  saves: integer("saves"),
  raw: jsonb("raw"),
}, (t) => [primaryKey({ columns: [t.postId, t.capturedAt] })]);

export const accountMetrics = pgTable("account_metrics", {
  accountId: text("account_id").notNull().references(() => accounts.id),
  date: text("date").notNull(), // YYYY-MM-DD
  followers: integer("followers"),
  raw: jsonb("raw"),
  capturedAt: ts("captured_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.accountId, t.date] })]);
