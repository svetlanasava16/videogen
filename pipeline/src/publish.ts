/**
 * Публикация через Postiz, учёт в базе (таблица posts).
 *   pnpm posts accounts                         — интеграции Postiz → content/accounts.json (по handle)
 *   pnpm posts plan --account yt-ru [--per-day 2] [--days 7] [--from 2026-12-01] [--kind video|story|text] [--dry-run]
 *   pnpm posts push [--account yt-ru] [--limit 20] [--draft] [--private] [--dry-run]
 *   pnpm posts sync                              — статусы и ссылки из Postiz → posts
 *   pnpm posts list [--account yt-ru]            — что запланировано
 * Правила: маркировка ИИ всегда (content/disclosure.json); 1–3 видео в день на канал; подряд не повторяем фон и главного героя.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { Episode, NARRATOR, pick, type Locale } from "@jf/core";
import { connect, schema as T, type Db } from "@jf/db";
import { AUDIENCE, LIMITS, caption, disclosure, settings, type Kind, type Platform } from "./publish/captions.js";
import * as P from "./publish/postiz.js";
import { ROOT } from "./util.js";

function arg(name: string, def?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const toEpisode = (r: typeof T.episodes.$inferSelect) =>
  Episode.parse({ id: r.id, jokeId: r.jokeId, locale: r.locale, title: r.title, location: r.location, place: r.place ?? undefined, cast: r.cast, roles: r.roles, lines: r.lines, music: r.music ?? undefined });

/** Главный герой эпизода: кто говорит больше всех (не рассказчик). */
function lead(ep: Episode) {
  const n = new Map<string, number>();
  for (const l of ep.lines) if (l.character !== NARRATOR) n.set(l.character, (n.get(l.character) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ep.cast[0];
}

/** Слоты публикации: per-day штук в день, равномерно в окне аудитории, со сдвигом ±25 мин (детерминированно). */
function slots(locale: Locale, from: Date, days: number, perDay: number, seed: string) {
  const a = AUDIENCE[locale];
  const out: Date[] = [];
  for (let d = 0; d < days; d++) {
    for (let k = 0; k < perDay; k++) {
      const hour = a.from + ((a.to - a.from) * (k + 0.5)) / perDay;
      const jitter = ((parseInt(pickHex(`${seed}:${d}:${k}`), 16) % 51) - 25) / 60;
      const t = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + d, 0, 0));
      t.setUTCMinutes(Math.round((hour + jitter - a.utcOffset) * 60));
      if (t.getTime() > Date.now() + 15 * 60_000) out.push(t);
    }
  }
  return out;
}
const pickHex = (s: string) => pick([...Array(256).keys()].map((n) => n.toString(16)), s)!;

async function account(db: Db, id: string) {
  const [a] = await db.select().from(T.accounts).where(eq(T.accounts.id, id));
  if (!a) throw new Error(`unknown account ${id} (content/accounts.json → pnpm db sync)`);
  return a;
}

async function plan(db: Db) {
  const acc = await account(db, arg("account") ?? "");
  const platform = acc.platform as Platform;
  const kind = (arg("kind") ?? (platform === "threads" || platform === "x" ? "text" : "video")) as Kind;
  const perDay = Number(arg("per-day", kind === "story" ? "1" : "2"));
  const days = Number(arg("days", "7"));
  const from = arg("from") ? new Date(`${arg("from")}T00:00:00Z`) : new Date();
  const times = slots(acc.locale as Locale, from, days, perDay, acc.id);

  const used = new Set((await db.select({ e: T.posts.episodeId }).from(T.posts).where(and(eq(T.posts.accountId, acc.id), eq(T.posts.kind, kind)))).map((r) => r.e));
  const taken = new Set((await db.select({ t: T.posts.scheduledAt }).from(T.posts).where(eq(T.posts.accountId, acc.id))).map((r) => r.t.getTime()));
  const rendered = new Set((await db.select({ e: T.renders.episodeId }).from(T.renders)).map((r) => r.e));
  const rows = await db
    .select({ ep: T.episodes, popularity: T.jokes.popularity, text: T.jokes.text, jokeLocale: T.jokes.locale })
    .from(T.episodes)
    .innerJoin(T.jokes, eq(T.jokes.id, T.episodes.jokeId))
    .where(and(eq(T.episodes.locale, acc.locale), sql`${T.episodes.status} <> 'rejected'`))
    .orderBy(desc(T.jokes.popularity));

  // кандидаты: не публиковались на этом аккаунте; для видео — уже отрендерены; текст влезает в лимит
  const pool = rows
    .filter((r) => !used.has(r.ep.id))
    .filter((r) => kind === "text" || rendered.has(r.ep.id))
    .map((r) => {
      const ep = toEpisode(r.ep);
      const translated = r.jokeLocale !== ep.locale;
      return { ep, cap: caption(ep, platform, kind, { translated, originalText: r.text }), lead: lead(ep) };
    })
    .filter((c) => c.cap.length <= LIMITS[platform]);

  // разнообразие: подряд не повторяем фон и главного героя (жадно, сохраняя порядок популярности)
  const chosen: typeof pool = [];
  const free = times.filter((t) => !taken.has(t.getTime()));
  for (const t of free) {
    const prev = chosen.slice(-2);
    const i = pool.findIndex((c) => !prev.some((p) => p.ep.location === c.ep.location || p.lead === c.lead));
    const c = pool.splice(i >= 0 ? i : 0, 1)[0];
    if (!c) break;
    chosen.push(c);
  }
  const d = disclosure();
  const rowsOut = chosen.map((c, i) => ({
    accountId: acc.id, episodeId: c.ep.id, kind, caption: c.cap, title: c.ep.title, disclosureVersion: d.version,
    aiFlag: true, state: "planned", scheduledAt: free[i],
  }));
  for (const r of rowsOut) console.log(`${r.scheduledAt.toISOString()}  ${r.episodeId.padEnd(24)} ${r.title}`);
  if (!rowsOut.length) console.log(kind === "text" ? "no candidates" : "no rendered candidates — run pnpm render --top N --locale " + acc.locale);
  if (flag("dry-run")) {
    if (rowsOut[0]) console.log(`\n--- caption example (${platform}/${kind}) ---\n${rowsOut[0].caption}`);
    return;
  }
  if (rowsOut.length) await db.insert(T.posts).values(rowsOut).onConflictDoNothing();
  console.log(`${rowsOut.length} posts planned for ${acc.id}`);
}

async function push(db: Db) {
  const dry = flag("dry-run");
  const limit = Number(arg("limit", "20")); // Postiz: 30 созданий постов в час
  const where = [eq(T.posts.state, "planned"), gte(T.posts.scheduledAt, new Date(Date.now() + 5 * 60_000))];
  if (arg("account")) where.push(eq(T.posts.accountId, arg("account")!));
  const todo = await db.select().from(T.posts).where(and(...where)).orderBy(asc(T.posts.scheduledAt)).limit(limit);
  if (!todo.length) return console.log("nothing planned");
  const ints = dry && !P.configured() ? [] : await P.integrations();
  for (const p of todo) {
    const acc = await account(db, p.accountId);
    const platform = acc.platform as Platform;
    const integration = ints.find((i) => i.id === acc.postizIntegrationId);
    if (!dry && (!acc.postizIntegrationId || !integration)) {
      console.error(`${p.id} ${acc.id}: no Postiz integration (pnpm posts accounts)`);
      continue;
    }
    const [epRow] = await db.select().from(T.episodes).where(eq(T.episodes.id, p.episodeId!));
    const ep = toEpisode(epRow);
    const [render] = p.kind === "text" ? [] : await db.select().from(T.renders).where(eq(T.renders.episodeId, ep.id)).orderBy(desc(T.renders.createdAt)).limit(1);
    if (p.kind !== "text" && !render) {
      console.error(`${p.id} ${ep.id}: no render (pnpm render ${ep.id})`);
      continue;
    }
    const body = {
      type: (flag("draft") ? "draft" : "schedule") as "draft" | "schedule",
      date: p.scheduledAt.toISOString(),
      integrationId: acc.postizIntegrationId ?? "<integration>",
      content: p.caption,
      settings: settings(platform, p.kind as Kind, ep, { identifier: integration?.identifier ?? platform, privateMode: flag("private") }),
    };
    if (dry) {
      console.log(JSON.stringify({ ...body, media: render ? [`<upload ${render.path}>`] : [] }, null, 2));
      continue;
    }
    try {
      const media = render ? [await P.upload(join(ROOT, render.path))] : [];
      const postId = await P.createPost({ ...body, media });
      await db.update(T.posts).set({ state: body.type === "draft" ? "draft" : "queued", postizPostId: postId, postizMediaId: media[0]?.id ?? null, renderId: render?.id ?? null, error: null, updatedAt: new Date() }).where(eq(T.posts.id, p.id));
      console.log(`${p.id} ${acc.id} ${ep.id} → Postiz ${postId} (${body.type} ${body.date})`);
    } catch (e) {
      await db.update(T.posts).set({ error: String((e as Error).message).slice(0, 1000), updatedAt: new Date() }).where(eq(T.posts.id, p.id));
      console.error(`${p.id} ${acc.id}: ${(e as Error).message}`);
    }
  }
}

async function sync(db: Db) {
  const mine = await db.select().from(T.posts).where(isNotNull(T.posts.postizPostId));
  if (!mine.length) return console.log("no posts in Postiz yet");
  const times = mine.map((p) => p.scheduledAt.getTime());
  const start = new Date(Math.min(...times) - 86400_000).toISOString();
  const end = new Date(Math.max(...times) + 86400_000).toISOString();
  const remote = new Map((await P.listPosts(start, end)).map((r) => [r.id, r]));
  let n = 0;
  for (const p of mine) {
    const r = remote.get(p.postizPostId!);
    if (!r) continue;
    const state = r.state === "PUBLISHED" ? "published" : r.state === "ERROR" ? "error" : r.state === "DRAFT" ? "draft" : "queued";
    if (state === p.state && (r.releaseURL ?? null) === p.url) continue;
    await db.update(T.posts).set({
      state, url: r.releaseURL ?? p.url, error: r.error ?? null, updatedAt: new Date(),
      publishedAt: state === "published" ? p.publishedAt ?? new Date(r.publishDate ?? Date.now()) : p.publishedAt,
    }).where(eq(T.posts.id, p.id));
    n++;
  }
  console.log(`${n} posts updated from Postiz (${mine.length} tracked)`);
}

async function accounts() {
  const file = join(ROOT, "content", "accounts.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as { accounts: { id: string; platform: string; handle: string; postizIntegrationId: string }[] };
  const ints = await P.integrations();
  const platformOf = (identifier: string) => identifier.replace(/-standalone$/, "").replace(/^instagram.*/, "instagram");
  for (const i of ints) {
    const match = data.accounts.find((a) => a.platform === platformOf(i.identifier) && a.handle && [i.name, i.profile].some((n) => n?.toLowerCase().replace(/^@/, "") === a.handle.toLowerCase().replace(/^@/, "")));
    if (match) match.postizIntegrationId = i.id;
    console.log(`${i.identifier.padEnd(22)} ${(i.profile ?? i.name).padEnd(28)} ${i.id}  → ${match?.id ?? "(no account with this handle in content/accounts.json)"}`);
  }
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("content/accounts.json updated; set \"active\": true where needed, then pnpm db sync");
}

async function list(db: Db) {
  const where = arg("account") ? eq(T.posts.accountId, arg("account")!) : sql`true`;
  const rows = await db.select().from(T.posts).where(where).orderBy(asc(T.posts.scheduledAt));
  for (const r of rows) console.log(`${String(r.id).padStart(5)} ${r.accountId.padEnd(6)} ${r.kind.padEnd(5)} ${r.state.padEnd(9)} ${r.scheduledAt.toISOString()} ${r.episodeId} ${r.url ?? ""}${r.error ? " ERR " + r.error.slice(0, 60) : ""}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const cmd = process.argv[2];
  const { db, close } = connect();
  try {
    if (cmd === "plan") await plan(db);
    else if (cmd === "push") await push(db);
    else if (cmd === "sync") await sync(db);
    else if (cmd === "accounts") await accounts();
    else if (cmd === "list") await list(db);
    else {
      console.error("usage: publish accounts|plan|push|sync|list (see header of pipeline/src/publish.ts)");
      process.exitCode = 1;
    }
  } finally {
    await close();
  }
}
