/**
 * Звук исполнения как данные: какие файлы, с какого кадра, с какой громкостью и скоростью; громкость музыки на кадре.
 * Те же правила, что у дорожки Remotion: озвучка — 1, эффекты — 0,8, закадровый смех — 0,7 с затуханием
 * в последние 8 кадров, музыка — 0,1 и 0,05 под речью, вход/выход по 15 кадров.
 */
import { frameOf } from "./tracks";
import type { Performance } from "./types";
import type { CaptionLine } from "./sample";

export const VOLUME = { voice: 1, sfx: 0.8, laugh: 0.7, music: 0.1, musicDucked: 0.05 };
/** Вход и выход музыки, кадров. */
export const MUSIC_FADE = 15;
/** Затухание закадрового смеха в конце, кадров. */
export const LAUGH_FADE = 8;

export type AudioCue = {
  kind: "voice" | "outro" | "sfx" | "laugh";
  /** Путь относительно public/ (remotion/public). */
  file: string;
  /** Кадр начала; длительность в кадрах (у озвучки реплики — до конца файла). */
  from: number; frames?: number;
  gain: number; rate?: number;
  /** Затухание в последние fadeOut кадров (смех). */
  fadeOut?: number;
  key: string;
};

export function audioPlan(perf: Performance): AudioCue[] {
  const f = (s: number) => frameOf(s, perf.fps);
  return [
    ...perf.captions.filter((l) => l.audio).map((l): AudioCue => ({ kind: "voice", key: `v-${l.id}`, file: l.audio!.file, from: f(l.audio!.from), gain: VOLUME.voice, rate: l.audio!.rate })),
    ...perf.audio.outro.map((o): AudioCue => ({ kind: "outro", key: `o-${o.character}`, file: o.file, from: f(o.from), frames: f(o.dur), gain: VOLUME.voice })),
    ...perf.audio.sfx.map((c, i): AudioCue => ({ kind: "sfx", key: `sfx-${i}`, file: c.file, from: f(c.from), frames: f(c.dur), gain: VOLUME.sfx })),
    ...perf.audio.laughs.map((c, i): AudioCue => ({ kind: "laugh", key: `${i}`, file: c.file, from: f(c.from), frames: f(c.dur), gain: VOLUME.laugh, fadeOut: LAUGH_FADE })),
  ];
}

/** Громкость музыки на кадре: вход/выход и проседание под репликами (±3 кадра). */
export function musicGain(perf: Performance, frame: number, lines: CaptionLine[]): number {
  const N = perf.frames;
  const speaking = lines.some((l) => frame >= l.startFrame - 3 && frame <= l.endFrame + 3);
  const edge = clamp01(Math.min(frame / MUSIC_FADE, (N - frame) / MUSIC_FADE));
  return edge * (speaking ? VOLUME.musicDucked : VOLUME.music);
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
