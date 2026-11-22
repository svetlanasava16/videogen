/**
 * Компиляция эпизода в исполнение (ROADMAP §5): постановка, камера, субтитры и звук — один раз, в треки по времени.
 *   pnpm compile-episode <id>… [--debug] [--all] [--out out/perf] [--check]
 * --check: треки повторяют покадровую постановку (числа — с ошибкой ≤ 0,02, дискретные — точно) на каждом кадре.
 * Пишет out/perf/<id>.json (performance.json). Проиграть: композиция Performance (`--props='{"perf": …}'`)
 * или Joke с эпизодом (компилирует сама). Формат — remotion/src/perf/types.ts.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { Episode } from "@jf/core";
import { compileEpisode, type ActorSample } from "../../remotion/src/perf/compile.js";
import { sampleLin, sampleStep, sec } from "../../remotion/src/perf/tracks.js";
import { debugSet } from "./validate.js";
import { ROOT } from "./util.js";

const loadEp = (id: string) => Episode.parse(JSON.parse(readFileSync(join(ROOT, "content/episodes", `${id}.json`), "utf8")));
export function compileById(id: string) {
  return compileEpisode(loadEp(id));
}

/** Дискретные каналы куклы (ступеньки), остальные — числа с интерполяцией. */
const STEP = new Set(["mode", "facing", "speaking", "emotion", "hold", "act", "base", "seed", "actStart", "baseStart"]);
/** Сверка треков с покадровой постановкой: число расхождений и первые примеры. */
export function checkTracks(id: string): { samples: number; bad: string[] } {
  const raw: { scene: number; half?: string; frame: number; id: string; s: ActorSample }[] = [];
  const p = compileEpisode(loadEp(id), (scene, half, frame, aid, s) => raw.push({ scene, half, frame, id: aid, s: { ...s } }));
  const bad: string[] = [];
  for (const r of raw) {
    if (r.s.mode === "off") continue;
    const a = p.scenes[r.scene].views.find((v) => v.half === r.half)!.actors.find((x) => x.id === r.id)!;
    const t = sec(r.frame, p.fps);
    for (const [k, tr] of Object.entries(a.tracks)) {
      const want = (r.s as Record<string, unknown>)[k];
      const got = STEP.has(k) ? sampleStep(tr as never, t) : sampleLin(tr as never, t);
      const ok = STEP.has(k) ? JSON.stringify(got ?? null) === JSON.stringify(want ?? null) : Math.abs((got as number) - (want as number)) <= 0.02;
      if (!ok) bad.push(`${r.frame} ${r.id}.${k}: want ${JSON.stringify(want)} got ${JSON.stringify(got)}`);
    }
  }
  return { samples: raw.length, bad };
}

function main() {
  const { values, positionals } = parseArgs({ options: { debug: { type: "boolean" }, all: { type: "boolean" }, out: { type: "string" }, check: { type: "boolean" } }, allowPositionals: true });
  const ids = values.all
    ? readdirSync(join(ROOT, "content/episodes")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
    : values.debug ? debugSet() : positionals;
  if (!ids.length) { console.log("usage: pnpm compile-episode <id>… | --debug | --all [--out out/perf]"); return; }
  if (values.check) {
    let n = 0, failed = 0;
    for (const id of ids) {
      const r = checkTracks(id);
      n += r.samples;
      if (r.bad.length) { failed++; console.log(`${id}: ${r.bad.length} mismatches, e.g. ${r.bad.slice(0, 3).join("; ")}`); }
    }
    console.log(`${ids.length} episodes, ${n} puppet-frames: ${failed ? `${failed} with mismatches` : "tracks reproduce the staging on every frame"}`);
    process.exitCode = failed ? 1 : 0;
    return;
  }
  const dir = join(ROOT, values.out ?? "out/perf");
  mkdirSync(dir, { recursive: true });
  let bytes = 0, ms = 0;
  for (const id of ids) {
    const t0 = Date.now();
    const p = compileById(id);
    const js = JSON.stringify(p);
    ms += Date.now() - t0; bytes += js.length;
    writeFileSync(join(dir, `${id}.json`), js);
    if (ids.length <= 30) console.log(`${id}: ${p.duration.toFixed(1)} s, ${p.scenes.length} scenes, ${(js.length / 1024).toFixed(0)} KB, ${Date.now() - t0} ms`);
  }
  console.log(`${ids.length} episodes → ${values.out ?? "out/perf"} (${(bytes / 1024 / 1024).toFixed(1)} MB, ${(ms / 1000).toFixed(1)} s)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
