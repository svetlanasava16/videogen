/**
 * Авто-режиссура камеры. Сцена рисуется на холсте кадра, камера масштабирует и сдвигает его.
 * Правила (без кода на эпизод):
 *  - первая реплика сцены и рассказчик — общий план (wide);
 *  - диалог — двойной план (two) на говорящего и ближайшего собеседника;
 *  - панчлайн — крупный план (close) говорящего с медленным наездом;
 *  - смех в конце — общий план;
 *  - бит {type:"camera"} перекрывает правило до следующего бита camera или конца сцены.
 */
import { Easing, interpolate } from "remotion";
import { NARRATOR, type Shot } from "@jf/core";
import type { SceneTL, Timeline } from "../timeline";

export type Cam = { scale: number; fx: number; fy: number };
const SCALE: Record<Shot, number> = { wide: 1, two: 1.18, close: 1.5 };
const BLEND = 12; // кадров на смену плана
const PUSH = 0.08; // наезд на панчлайне (прирост масштаба за реплику)
const ease = Easing.inOut(Easing.cubic);

type Key = { frame: number; shot: Shot; on?: string; push?: { from: number; to: number } };

/** Ключевые планы сцены: явные биты camera + правила по репликам. */
function keys(tl: Timeline, sc: SceneTL, present: (id: string, frame: number) => boolean): Key[] {
  const out: Key[] = [{ frame: sc.from, shot: "wide" }];
  const lines = tl.lines.filter((l) => l.scene === sc.index);
  const explicit = [...sc.shots].sort((a, b) => a.frame - b.frame);
  lines.forEach((l, i) => {
    // явный план действует, пока не придёт следующий явный
    if (explicit.some((s) => s.frame <= l.startFrame)) return;
    const at = Math.max(sc.from, l.startFrame - 4);
    const others = sc.scene.cast.filter((c) => c !== l.character && present(c, l.startFrame));
    if (l.character === NARRATOR || i === 0) out.push({ frame: at, shot: "wide" });
    else if (l.punch) out.push({ frame: at, shot: "close", on: l.character, push: { from: l.startFrame, to: l.endFrame } });
    else out.push({ frame: at, shot: others.length ? "two" : "close", on: l.character });
  });
  for (const s of explicit) out.push({ frame: s.frame, shot: s.shot, on: s.on });
  for (const o of tl.outro) if (o.from >= sc.from && o.from < sc.to) out.push({ frame: o.from, shot: "wide" });
  // схлопнуть повторы подряд
  return out
    .sort((a, b) => a.frame - b.frame)
    .filter((k, i, all) => i === 0 || k.shot !== all[i - 1].shot || k.on !== all[i - 1].on || k.push);
}

/**
 * Состояние камеры на кадре. xOf — позиция x куклы на кадре, headY — высота головы, floorMidY — середина фигуры.
 */
export function cameraAt(
  tl: Timeline, sc: SceneTL, frame: number,
  geo: { width: number; height: number; headY: number; bodyY: number; xOf: (id: string, f: number) => number; present: (id: string, f: number) => boolean },
): Cam {
  const ks = keys(tl, sc, geo.present);
  const stateOf = (k: Key, f: number): Cam => {
    if (k.shot === "wide" || !k.on || !geo.present(k.on, k.frame)) return { scale: 1, fx: geo.width / 2, fy: geo.height / 2 };
    const x = geo.xOf(k.on, k.frame);
    if (k.shot === "two") {
      const others = sc.scene.cast.filter((c) => c !== k.on && geo.present(c, k.frame)).map((c) => geo.xOf(c, k.frame));
      const near = others.sort((a, b) => Math.abs(a - x) - Math.abs(b - x))[0] ?? x;
      return { scale: SCALE.two, fx: (x + near) / 2, fy: geo.bodyY };
    }
    const push = k.push ? interpolate(f, [k.push.from, k.push.to], [0, PUSH], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
    return { scale: SCALE.close + push, fx: x, fy: geo.headY };
  };
  let i = 0;
  while (i + 1 < ks.length && ks[i + 1].frame <= frame) i++;
  const cur = stateOf(ks[i], frame);
  if (i === 0 || frame - ks[i].frame >= BLEND) return cur;
  const prev = stateOf(ks[i - 1], ks[i].frame);
  const k = ease((frame - ks[i].frame) / BLEND);
  return { scale: prev.scale + (cur.scale - prev.scale) * k, fx: prev.fx + (cur.fx - prev.fx) * k, fy: prev.fy + (cur.fy - prev.fy) * k };
}

/** CSS-трансформация холста сцены: фокус в центр кадра, края не вылезают. */
export function cameraTransform(c: Cam, width: number, height: number) {
  const s = c.scale;
  const tx = Math.min(0, Math.max(width - width * s, width / 2 - c.fx * s));
  const ty = Math.min(0, Math.max(height - height * s, height / 2 - c.fy * s));
  return `translate(${tx}px, ${ty}px) scale(${s})`;
}
