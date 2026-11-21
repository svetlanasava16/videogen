/**
 * Общая часть stills и golden: ключевые кадры эпизода по таймлайну, рендер кадров одним бандлом и одним браузером,
 * контактный лист (PNG) без внешних утилит.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { PNG } from "pngjs";
import { Episode, NARRATOR } from "@jf/core";
import { buildTimeline } from "../../remotion/src/timeline.js";
import { ROOT } from "./util.js";

export type KeyFrame = { frame: number; kind: string; label: string };

export function loadEpisode(id: string) {
  return Episode.parse(JSON.parse(readFileSync(join(ROOT, "content/episodes", `${id}.json`), "utf8")));
}

/**
 * Ключевые моменты: начало каждой сцены, каждая реплика (вскоре после начала), панчлайн (конец), входы (дошёл)
 * и уходы (на полпути), положил/отдал предмет, машина приехала, последний кадр. Близкие кадры (< 6) склеиваются.
 */
export function keyFrames(ep: Episode): KeyFrame[] {
  const tl = buildTimeline(ep);
  const out: KeyFrame[] = [];
  const last = tl.lines[tl.lines.length - 1];
  for (const sc of tl.scenes) {
    out.push({ frame: sc.from + 6, kind: "scene", label: `scene ${sc.index + 1}: ${sc.scene.location}${sc.scene.place ? ":" + sc.scene.place : ""}` });
    for (const m of sc.moves) {
      if (m.to <= m.from) continue;
      if (m.kind === "enter") out.push({ frame: m.to - 2, kind: "enter", label: `${m.id} entered → ${m.target}` });
      if (m.kind === "exit") out.push({ frame: Math.round((m.from + m.to) / 2), kind: "exit", label: `${m.id} leaves` });
    }
    for (const p of sc.props) if (p.action === "put" || p.action === "give") out.push({ frame: p.frame + 12, kind: p.action, label: `${p.who} ${p.action} ${p.item}${p.to ? " → " + p.to : ""}` });
    for (const d of sc.drives) if (d.to > d.from && d.kind !== "exit") out.push({ frame: d.to, kind: "drive", label: `${d.vehicle} arrived` });
  }
  for (const l of tl.lines) {
    const dur = l.endFrame - l.startFrame;
    const who = l.character === NARRATOR ? "narrator" : l.character;
    out.push({ frame: l.startFrame + Math.min(12, Math.round(dur / 3)), kind: "line", label: `${l.id} ${who}: ${l.text.slice(0, 60)}` });
  }
  if (last) out.push({ frame: Math.max(last.startFrame, last.endFrame - 2), kind: "punch", label: `punchline ${last.id}` });
  out.push({ frame: tl.durationInFrames - 2, kind: "end", label: "last frame" });
  out.sort((a, b) => a.frame - b.frame);
  const merged: KeyFrame[] = [];
  for (const k of out) {
    const p = merged[merged.length - 1];
    if (p && k.frame - p.frame < 6) { p.label += ` | ${k.label}`; if (k.kind === "punch") p.kind = "punch"; continue; }
    merged.push({ ...k, frame: Math.max(0, Math.min(tl.durationInFrames - 1, k.frame)) });
  }
  return merged;
}

/** Рендерер кадров: один бандл Remotion и один браузер на весь прогон. */
export async function stillRenderer() {
  // STILLS_DEV=1 — сборка React в режиме разработки: предупреждения React в логе читаемы (в production текст пустой)
  const serveUrl = await bundle({ entryPoint: join(ROOT, "remotion/src/index.ts"), webpackOverride: (c) => (process.env.STILLS_DEV ? { ...c, mode: "development" } : c) });
  const browser = await openBrowser("chrome");
  return {
    async render(ep: Episode, frames: number[], scale: number, outFile: (frame: number) => string) {
      const composition = await selectComposition({ serveUrl, id: "Joke", inputProps: ep, puppeteerInstance: browser });
      for (const frame of frames) {
        await renderStill({ composition, serveUrl, output: outFile(frame), frame, inputProps: ep, scale, imageFormat: "png", puppeteerInstance: browser, overwrite: true });
      }
    },
    close: () => browser.close({ silent: true }),
  };
}

/** Контактный лист: картинки одного размера в сетку cols колонок, зазор 6 px. */
export function contactSheet(files: string[], cols = 6): Buffer {
  const imgs = files.map((f) => PNG.sync.read(readFileSync(f)));
  if (!imgs.length) return PNG.sync.write(new PNG({ width: 1, height: 1 }));
  const w = imgs[0].width, h = imgs[0].height, gap = 6;
  const rows = Math.ceil(imgs.length / cols);
  const sheet = new PNG({ width: cols * (w + gap) + gap, height: rows * (h + gap) + gap });
  sheet.data.fill(0x2b); // тёмный фон
  for (let i = 0; i < sheet.data.length; i += 4) sheet.data[i + 3] = 255;
  imgs.forEach((im, i) => PNG.bitblt(im, sheet, 0, 0, Math.min(w, im.width), Math.min(h, im.height), gap + (i % cols) * (w + gap), gap + Math.floor(i / cols) * (h + gap)));
  return PNG.sync.write(sheet);
}
