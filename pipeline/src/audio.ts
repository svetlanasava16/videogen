/**
 * Библиотека звуков монтажа (content/audio.json + remotion/public/audio/).
 *   pnpm audio add <файл> --kind laugh --intensity chuckle|laugh|big --source <url> --author <имя> --license CC0
 *   pnpm audio add <файл> --kind music --mood quirky --source <url> --license CC0 [--start 3 --max 75]
 *   pnpm audio list
 * Файл нормализуется по громкости (смех −18 LUFS, музыка −23 LUFS), обрезается (смех ≤ 4 с, музыка ≤ 90 с) и сохраняется в mp3.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { AudioClip, AudioLibrary, Laugh } from "@jf/core";
import { ROOT, fromCwd } from "./util.js";

const LIB = join(ROOT, "content", "audio.json");
const PUBLIC = join(ROOT, "remotion", "public");

export const loadAudio = () => AudioLibrary.parse(JSON.parse(readFileSync(LIB, "utf8"))).clips;
const saveAudio = (clips: AudioClip[]) =>
  writeFileSync(LIB, JSON.stringify({ clips: [...clips].sort((a, b) => a.id.localeCompare(b.id)) }, null, 2) + "\n");

/** ffmpeg/ffprobe из Remotion (своих бинарников в системе нет). */
export function tool(name: "ffmpeg" | "ffprobe", args: string[]) {
  const r = spawnSync("npx", ["remotion", name, ...args], { cwd: join(ROOT, "remotion"), encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${name} failed: ${r.stderr?.slice(-800)}`);
  return r.stdout;
}

export function duration(file: string): number {
  const out = tool("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]);
  const d = parseFloat(out.trim().split("\n").pop() ?? "");
  if (!Number.isFinite(d)) throw new Error(`no duration for ${file}`);
  return d;
}

function arg(name: string, def?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}

function add(src: string) {
  const kind = arg("kind") as "laugh" | "music";
  if (kind !== "laugh" && kind !== "music") throw new Error("--kind laugh|music");
  const intensity = kind === "laugh" ? Laugh.parse(arg("intensity", "laugh")) : undefined;
  const source = arg("source");
  const license = arg("license");
  if (!source || !license) throw new Error("--source <url> and --license <CC0|…> are required");
  const clips = loadAudio();
  const base = arg("id") ?? `${kind}-${basename(src, extname(src)).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
  const id = clips.some((c) => c.id === base) ? `${base}-${clips.length}` : base;
  const rel = `audio/${kind === "laugh" ? "laughs" : "music"}/${id}.mp3`;
  mkdirSync(join(PUBLIC, dirname(rel)), { recursive: true });
  const start = arg("start", "0")!;
  const max = arg("max", kind === "laugh" ? "4" : "90")!;
  const lufs = kind === "laugh" ? -18 : -23;
  tool("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-ss", start, "-t", max, "-i", fromCwd(src),
    "-af", `loudnorm=I=${lufs}:TP=-2:LRA=11`, "-ac", "2", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", join(PUBLIC, rel)]);
  const clip = AudioClip.parse({
    id, kind, intensity, mood: kind === "music" ? arg("mood", "light") : undefined,
    file: rel, durationSec: Math.round(duration(join(PUBLIC, rel)) * 100) / 100,
    source, author: arg("author", ""), license,
  });
  saveAudio([...clips.filter((c) => c.id !== id), clip]);
  console.log(`added ${id} (${clip.durationSec}s) → remotion/public/${rel}`);
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
const [cmd, file] = process.argv.slice(2);
if (!isMain) {
  // импорт как библиотеки
} else if (cmd === "add" && file) {
  if (!existsSync(fromCwd(file))) throw new Error(`no such file: ${file}`);
  add(file);
} else if (cmd === "list") {
  for (const c of loadAudio()) console.log(`${c.id.padEnd(36)} ${c.kind.padEnd(6)} ${(c.intensity ?? c.mood ?? "").padEnd(8)} ${c.durationSec}s  ${c.license}  ${c.source}`);
} else {
  console.error("usage: audio add <file> --kind laugh|music [--intensity …|--mood …] --source <url> --license <…> [--author …] | audio list");
  process.exit(1);
}
