/**
 * База ANEK. (Postgres, infra/docker-compose.yml → anek-db).
 *   pnpm db migrate      — применить миграции packages/db/drizzle
 *   pnpm db sync         — залить контент из git (анекдоты, разметка, куклы, фоны, звук, эпизоды, аккаунты); идемпотентно
 *   pnpm db status       — сколько чего в базе
 *   pnpm db dump         — pg_dump в data/backups/
 * Источник правды для контента — git; рендеры, публикации и метрики живут только в базе.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { Character, Episode, Location } from "@jf/core";
import { connect, migrate, schema as T, type Db } from "@jf/db";
import { loadAudio } from "./audio.js";
import { DATA, ROOT, readJsonl } from "./util.js";

export const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
const hashOf = (v: unknown) => sha(JSON.stringify(v)).slice(0, 16);
const fileHash = (rel: string) => sha(readFileSync(join(ROOT, rel)));
const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const jsonFiles = (dir: string) => readdirSync(join(ROOT, dir)).filter((f) => f.endsWith(".json")).sort();

type Row = Record<string, unknown> & { id: string };

/** Вставить новые и обновить изменившиеся строки (по колонке хэша). Возвращает [новых, изменённых, без изменений]. */
async function upsert(db: Db, table: PgTable, rows: Row[], hashCol: "hash" | "contentHash" | "sha256", keep: string[] = []) {
  if (!rows.length) return [0, 0, 0];
  const t = table as unknown as Record<string, unknown> & PgTable;
  const existing = new Map<string, string>(
    (await db.select({ id: (t as any).id, h: (t as any)[hashCol] }).from(table)).map((r: any) => [r.id, r.h]),
  );
  const changed = rows.filter((r) => existing.get(r.id) !== r[hashCol]);
  const fresh = changed.filter((r) => !existing.has(r.id)).length;
  const cols = Object.keys(rows[0]).filter((c) => c !== "id" && !keep.includes(c));
  for (let i = 0; i < changed.length; i += 500) {
    const chunk = changed.slice(i, i + 500);
    const set: Record<string, unknown> = { updatedAt: sql`now()` };
    for (const c of cols) set[c] = sql.raw(`excluded."${toSnake(c)}"`);
    await db.insert(table).values(chunk as any).onConflictDoUpdate({ target: (t as any).id, set });
  }
  return [fresh, changed.length - fresh, rows.length - changed.length];
}
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());

function jokeRows(): Row[] {
  const analysis = new Map(readJsonl<Row>(join(DATA, "llm", "analyze", "results.jsonl")).map((a) => [a.id, a]));
  const rows: Row[] = [];
  for (const lang of ["ru", "en", "de"]) {
    for (const j of readJsonl<any>(join(DATA, "jokes", `${lang}.jsonl`))) {
      const a = analysis.get(j.id) as any;
      const r = {
        id: j.id, locale: j.lang, kind: j.kind, text: j.text, source: j.source, sourceRef: j.sourceRef ?? null,
        popularity: j.popularity ?? 0, score: j.score ?? null, analysis: a ?? null, excluded: Boolean(a?.flags?.includes("exclude")),
      };
      rows.push({ ...r, hash: hashOf(r) });
    }
  }
  return rows;
}

function castRows() {
  const chars = jsonFiles("content/characters").map((f) => Character.parse(readJson(join(ROOT, "content/characters", f))));
  const locs = jsonFiles("content/locations").map((f) => Location.parse(readJson(join(ROOT, "content/locations", f))));
  const characters = chars.map((c) => {
    const r = { id: c.id, name: c.name, family: c.family ?? null, look: c.look, bible: c.bible ?? null };
    return { ...r, hash: hashOf(r) };
  });
  const locations = locs.map((l) => {
    const r = { id: l.id, name: l.name, palette: l.palette ?? null, bible: l.bible ?? null };
    return { ...r, hash: hashOf(r) };
  });
  return { characters, locations };
}

function assetRows(): Row[] {
  const rows: Row[] = [];
  const add = (r: Record<string, unknown> & { id: string; path: string }) =>
    rows.push({ license: null, sourceUrl: null, author: null, durationSec: null, meta: null, ...r, sha256: fileHash(r.path), bytes: statSync(join(ROOT, r.path)).size });
  for (const f of jsonFiles("content/locations")) {
    const id = f.replace(/\.json$/, "");
    const code = `remotion/src/backdrops/${id}.tsx`;
    if (existsSync(join(ROOT, code))) add({ id: `backdrop:${id}`, kind: "backdrop", path: code, license: "own", meta: { data: `content/locations/${f}` } });
  }
  for (const f of jsonFiles("content/characters")) {
    const id = f.replace(/\.json$/, "");
    add({ id: `puppet:${id}`, kind: "puppet", path: `content/characters/${f}`, license: "own", meta: { rig: "remotion/src/puppet/Rig.tsx" } });
  }
  for (const c of loadAudio()) {
    add({ id: `audio:${c.id}`, kind: c.kind, path: `remotion/public/${c.file}`, durationSec: c.durationSec, license: c.license, sourceUrl: c.source, author: c.author, meta: { intensity: c.intensity, mood: c.mood } });
  }
  return rows;
}

function episodeRows(): Row[] {
  const adaptation = new Map(readJsonl<any>(join(DATA, "llm", "script", "results.jsonl")).map((r) => [r.id, r.adaptation]));
  return jsonFiles("content/episodes")
    .map((f) => Episode.parse(readJson(join(ROOT, "content/episodes", f))))
    .filter((e) => !e.id.startsWith("demo-") && !e.id.startsWith("test-"))
    .map((e) => ({
      id: e.id, jokeId: e.jokeId, locale: e.locale, title: e.title, location: e.location, place: e.place ?? null,
      cast: e.cast, roles: e.roles, lines: e.lines, music: e.music ?? null, adaptation: adaptation.get(e.id) ?? null,
      contentHash: hashOf(e),
    }));
}

function accountRows(): Row[] {
  const p = join(ROOT, "content", "accounts.json");
  if (!existsSync(p)) return [];
  return (readJson(p).accounts as any[]).map((a) => ({
    id: a.id, platform: a.platform, locale: a.locale, handle: a.handle || null,
    postizIntegrationId: a.postizIntegrationId || null, active: Boolean(a.active),
    hash: hashOf(a),
  }));
}

export async function sync(db: Db) {
  const report = (name: string, [n, u, s]: number[]) => console.log(`${name.padEnd(11)} +${n} new, ~${u} updated, ${s} unchanged`);
  report("jokes", await upsert(db, T.jokes, jokeRows(), "hash"));
  const { characters, locations } = castRows();
  report("characters", await upsert(db, T.characters, characters, "hash"));
  report("locations", await upsert(db, T.locations, locations, "hash"));
  report("assets", await upsert(db, T.assets, assetRows(), "sha256"));
  report("episodes", await upsert(db, T.episodes, episodeRows(), "contentHash", ["status"]));
  // аккаунты: хэш не храним в таблице — сравниваем по полям, postiz id из файла не затираем, если там пусто
  const acc = accountRows();
  for (const a of acc) {
    const { hash: _h, ...row } = a;
    const set: Record<string, unknown> = { platform: row.platform, locale: row.locale, active: row.active, updatedAt: sql`now()` };
    if (row.handle) set.handle = row.handle;
    if (row.postizIntegrationId) set.postizIntegrationId = row.postizIntegrationId;
    await db.insert(T.accounts).values(row as any).onConflictDoUpdate({ target: T.accounts.id, set });
  }
  console.log(`accounts    ${acc.length} in content/accounts.json`);
}

export async function status(db: Db) {
  const count = async (name: string) => (await db.execute(sql.raw(`select count(*)::int as n from ${name}`)))[0] as { n: number };
  for (const t of ["jokes", "characters", "locations", "assets", "episodes", "renders", "accounts", "posts", "post_metrics", "account_metrics"])
    console.log(`${t.padEnd(16)} ${(await count(t)).n}`);
  const states = await db.execute(sql`select state, count(*)::int as n from posts group by state order by state`);
  if (states.length) console.log("posts by state:", states.map((r: any) => `${r.state}=${r.n}`).join(" "));
}

function dump() {
  const dir = join(DATA, "backups");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `anek-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`);
  const r = spawnSync("docker", ["exec", "anek-db", "pg_dump", "-U", "anek", "-d", "anek", "--no-owner"], { encoding: "utf8", maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(r.stderr);
  writeFileSync(file, r.stdout);
  console.log(`dump → ${file.replace(ROOT + "/", "")} (${(r.stdout.length / 1e6).toFixed(1)} MB)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const cmd = process.argv[2];
  if (cmd === "dump") dump();
  else if (["migrate", "sync", "status"].includes(cmd)) {
    const { db, close } = connect();
    try {
      if (cmd === "migrate") { await migrate(db); console.log("migrations applied"); }
      if (cmd === "sync") await sync(db);
      if (cmd === "status") await status(db);
    } finally {
      await close();
    }
  } else {
    console.error("usage: db migrate|sync|status|dump");
    process.exit(1);
  }
}
