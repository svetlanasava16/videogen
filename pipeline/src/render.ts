/**
 * Рендер эпизодов в MP4 и учёт в базе (таблица renders).
 *   pnpm render <episodeId…>                    — конкретные эпизоды
 *   pnpm render --compilation <id> [--force]     — сборник из content/compilations/<id>.json
 *   pnpm render --top 10 --locale ru [--voiced] [--force]   — самые популярные анекдоты языка без актуального рендера
 *                                                (--voiced: только полностью озвученные эпизоды)
 * Файл: renders/<episodeId>/<contentHash>.mp4. contentHash = эпизод + звук + маркировка + код монтажа:
 * если ничего не менялось, рендер пропускается.
 * Рендерит Remotion CLI по заранее собранному бандлу (сборка один раз на запуск).
 * macOS: headless Chrome зависает, пока дисплей спит, поэтому на время рендера держим `caffeinate -d`.
 */
import { execSync, spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { and, eq, inArray, sql } from "drizzle-orm";
import { AudioLibrary, CompilationSpec, Episode, pick } from "@jf/core";
import { connect, schema as T } from "@jf/db";
import { sha } from "./db.js";
import { ROOT } from "./util.js";

const REMOTION = join(ROOT, "remotion");

function treeHash(dir: string): string {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d).sort()) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk(dir);
  return sha(files.map((f) => relative(ROOT, f) + ":" + sha(readFileSync(f))).join("\n"));
}

const episodePath = (id: string) => join(ROOT, "content", "episodes", `${id}.json`);
const loadEpisode = (id: string) => Episode.parse(JSON.parse(readFileSync(episodePath(id), "utf8")));

export function renderHash(ep: Episode, codeHash: string) {
  const audio = readFileSync(join(ROOT, "content", "audio.json"), "utf8");
  const disclosure = readFileSync(join(ROOT, "content", "disclosure.json"), "utf8");
  return sha(JSON.stringify(ep) + audio + disclosure + codeHash).slice(0, 16);
}

function musicId(ep: Episode) {
  if (ep.music === "none") return null;
  const lib = AudioLibrary.parse(JSON.parse(readFileSync(join(ROOT, "content", "audio.json"), "utf8"))).clips.filter((c) => c.kind === "music");
  return (ep.music ?? pick(lib, ep.id)?.id) ?? null;
}

/** Запуск Remotion CLI в пакете remotion. */
function remotion(args: string[]) {
  const r = spawnSync("npx", ["remotion", ...args, "--log=error"], { cwd: REMOTION, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`remotion ${args[0]} failed:\n${(r.stdout + r.stderr).split("\n").filter((l) => /error|Error/.test(l)).slice(0, 8).join("\n")}`);
  return r.stdout;
}

/** Длительность композиции в кадрах — та же формула, что в Root.calculateMetadata. */
function framesOf(out: string) {
  const r = spawnSync("npx", ["remotion", "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", out], { cwd: REMOTION, encoding: "utf8" });
  return parseFloat(r.stdout.trim().split("\n").pop() ?? "0");
}

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

/** Сборник: pnpm render --compilation <id> → renders/compilations/<id>/<hash>.mp4 (+ обложка первого анекдота). */
async function renderCompilation(id: string, force: boolean) {
  const { db, close } = connect();
  try {
    const spec = CompilationSpec.parse(JSON.parse(readFileSync(join(ROOT, "content", "compilations", `${id}.json`), "utf8")));
    const props = { id: spec.id, locale: spec.locale, title: spec.title, episodes: spec.episodes.map(loadEpisode) };
    const codeHash = treeHash(join(REMOTION, "src"));
    const town = readFileSync(join(ROOT, "content", "world", "town.json"), "utf8");
    const hash = sha(JSON.stringify(props) + town + renderHash(props.episodes[0], codeHash)).slice(0, 16);
    const exists = await db.select({ id: T.renders.id }).from(T.renders).where(and(eq(T.renders.compilationId, id), eq(T.renders.contentHash, hash)));
    if (exists.length && !force) return console.log(`${id}: up to date`);
    const awake = process.platform === "darwin" ? spawn("caffeinate", ["-d", "-i", "-w", String(process.pid)], { stdio: "ignore" }) : undefined;
    const tmp = mkdtempSync(join(tmpdir(), "anek-comp-"));
    const propsFile = join(tmp, "props.json");
    writeFileSync(propsFile, JSON.stringify(props));
    console.log(`bundling remotion…`);
    remotion(["bundle", "src/index.ts", "--out-dir", join(tmp, "bundle")]);
    const rel = join("renders", "compilations", id, `${hash}.mp4`);
    mkdirSync(join(ROOT, "renders", "compilations", id), { recursive: true });
    const t0 = Date.now();
    remotion(["render", join(tmp, "bundle"), "Compilation", join(ROOT, rel), `--props=${propsFile}`, "--codec=h264"]);
    remotion(["still", join(tmp, "bundle"), "Cover", join(ROOT, rel.replace(/\.mp4$/, ".cover.jpg")), `--props=${episodePath(spec.episodes[0])}`, "--image-format=jpeg", "--jpeg-quality=90"]);
    const out = join(ROOT, rel);
    const row = {
      episodeId: null, compilationId: id, path: rel, sha256: sha(readFileSync(out)), bytes: statSync(out).size,
      durationSec: Math.round(framesOf(out) * 100) / 100, width: 1080, height: 1920, fps: 30, contentHash: hash,
      gitSha: execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim(), musicAssetId: null,
      voice: props.episodes.every((e) => e.lines.every((l) => l.audio)) ? props.episodes[0].lines[0].audio?.provider ?? "none" : "none",
    };
    await db.insert(T.renders).values(row);
    rmSync(tmp, { recursive: true, force: true });
    awake?.kill();
    console.log(`${id}: ${rel} (${row.durationSec.toFixed(1)}s, ${(row.bytes / 1e6).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  } finally {
    await close();
  }
}

async function main() {
  if (arg("compilation")) return renderCompilation(arg("compilation")!, process.argv.includes("--force"));
  const { db, close } = connect();
  try {
    let ids = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !all[i - 1]?.startsWith("--"));
    const force = process.argv.includes("--force");
    const codeHash = treeHash(join(REMOTION, "src"));
    const explicit = ids.length > 0;
    if (!ids.length) {
      const top = Number(arg("top") ?? 5);
      const locale = arg("locale");
      const rows = await db
        .select({ id: T.episodes.id })
        .from(T.episodes)
        .innerJoin(T.jokes, eq(T.jokes.id, T.episodes.jokeId))
        .where(and(locale ? eq(T.episodes.locale, locale) : sql`true`, sql`${T.episodes.status} <> 'rejected'`))
        .orderBy(sql`${T.jokes.popularity} desc`);
      const done = new Set(
        (await db.select({ e: T.renders.episodeId, h: T.renders.contentHash }).from(T.renders)).map((r) => `${r.e}:${r.h}`),
      );
      const voicedOnly = process.argv.includes("--voiced");
      ids = rows
        .map((r) => r.id)
        .filter((id) => !voicedOnly || loadEpisode(id).lines.every((l) => l.audio))
        .filter((id) => force || !done.has(`${id}:${renderHash(loadEpisode(id), codeHash)}`))
        .slice(0, top);
    }
    if (explicit && !force) {
      const done = new Set((await db.select({ e: T.renders.episodeId, h: T.renders.contentHash }).from(T.renders)).map((r) => `${r.e}:${r.h}`));
      const before = ids;
      ids = ids.filter((id) => !done.has(`${id}:${renderHash(loadEpisode(id), codeHash)}`));
      for (const id of before) if (!ids.includes(id)) console.log(`${id}: up to date`);
    }
    if (!ids.length) return console.log("nothing to render");

    const awake = process.platform === "darwin" ? spawn("caffeinate", ["-d", "-i", "-w", String(process.pid)], { stdio: "ignore" }) : undefined;
    const bundleDir = mkdtempSync(join(tmpdir(), "anek-bundle-"));
    console.log(`bundling remotion…`);
    remotion(["bundle", "src/index.ts", "--out-dir", bundleDir]);
    const gitSha = execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();

    for (const id of ids) {
      const ep = loadEpisode(id);
      const hash = renderHash(ep, codeHash);
      const exists = await db.select({ id: T.renders.id }).from(T.renders).where(and(eq(T.renders.episodeId, id), eq(T.renders.contentHash, hash)));
      if (exists.length && !force) {
        console.log(`${id}: up to date`);
        continue;
      }
      const rel = join("renders", id, `${hash}.mp4`);
      const out = join(ROOT, rel);
      mkdirSync(join(ROOT, "renders", id), { recursive: true });
      const t0 = Date.now();
      try {
        remotion(["render", bundleDir, "Joke", out, `--props=${episodePath(id)}`, "--codec=h264"]);
        // обложка Reel рядом с видео
        remotion(["still", bundleDir, "Cover", join(ROOT, "renders", id, `${hash}.cover.jpg`), `--props=${episodePath(id)}`, "--image-format=jpeg", "--jpeg-quality=90"]);
      } catch (e) {
        console.error(`${id}: ${(e as Error).message}`);
        continue;
      }
      const row = {
        episodeId: id, path: rel, sha256: sha(readFileSync(out)), bytes: statSync(out).size,
        durationSec: Math.round(framesOf(out) * 100) / 100, width: ep.format.width, height: ep.format.height, fps: ep.format.fps,
        contentHash: hash, gitSha, musicAssetId: musicId(ep) ? `audio:${musicId(ep)}` : null, voice: ep.lines.find((l) => l.audio)?.audio?.provider ?? "none",
      };
      if (exists.length) await db.update(T.renders).set(row).where(inArray(T.renders.id, exists.map((e) => e.id)));
      else await db.insert(T.renders).values(row);
      console.log(`${id}: ${rel} (${row.durationSec.toFixed(1)}s, ${(row.bytes / 1e6).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    rmSync(bundleDir, { recursive: true, force: true });
    awake?.kill();
  } finally {
    await close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
