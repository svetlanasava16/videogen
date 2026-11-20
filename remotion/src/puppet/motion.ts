import type { Emotion } from "@jf/core";

/** Телосложение → размеры тела в боксе куклы (ширина 300, голова по центру x=150). */
export type Build = "slim" | "average" | "stocky" | "portly" | "child";
export const BUILDS: Record<Build, { bodyW: number; bodyH: number; legH: number; legGap: number; head: number }> = {
  slim: { bodyW: 140, bodyH: 185, legH: 140, legGap: 26, head: 1 },
  average: { bodyW: 180, bodyH: 175, legH: 120, legGap: 34, head: 1 },
  stocky: { bodyW: 205, bodyH: 160, legH: 100, legGap: 44, head: 1 },
  portly: { bodyW: 225, bodyH: 175, legH: 95, legGap: 50, head: 1 },
  child: { bodyW: 150, bodyH: 130, legH: 90, legGap: 28, head: 1 },
};
export const BODY_TOP = 230;
export const asBuild = (b?: string): Build => (b && b in BUILDS ? (b as Build) : "average");

/** Детерминированный «шум» по seed: одинаковый при каждом рендере кадра. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Моргание: раз в 3–5 с закрытые глаза на 4 кадра. */
export function blink(frame: number, seed: number, fps = 30): boolean {
  const period = Math.round(fps * (3 + hash(seed) * 2));
  const phase = (frame + Math.round(hash(seed + 1) * period)) % period;
  return phase < 4;
}

/** Открытие рта при речи (0..1): слоги ~5 в секунду с вариацией. */
export function mouthOpen(frame: number, seed: number): number {
  const a = Math.abs(Math.sin(frame * 0.55 + seed));
  const b = Math.abs(Math.sin(frame * 0.23 + seed * 3));
  return Math.min(1, 0.25 + 0.75 * a * (0.6 + 0.4 * b));
}

/** Углы рук (градусы, 0 = вниз, + = наружу) для эмоции; при речи — жест рукой. */
export function armAngles(emotion: Emotion, speaking: boolean, frame: number, seed: number, walk: number) {
  let left = 10;
  let right = 10;
  switch (emotion) {
    case "angry": left = right = 42; break; // руки в боки
    case "surprised": left = right = 150; break; // руки вверх
    case "sad": left = right = 3; break;
    case "happy": left = 25; right = 25 + 15 * Math.sin(frame / 5); break;
    case "smug": left = right = -35; break; // скрещённые на груди
    default: break;
  }
  if (speaking && emotion !== "surprised" && emotion !== "smug") {
    // жест: «говорящая» рука периодически поднимается
    const g = Math.max(0, Math.sin(frame / 9 + seed));
    right = right + g * 70;
  }
  if (walk > 0) {
    const s = Math.sin(frame / 3.2) * 22 * walk;
    left = 8 + s;
    right = 8 - s;
  }
  return { left, right };
}

/** Углы ног при шаге (градусы), 0 = стоит. */
export function legAngles(frame: number, walk: number) {
  const s = Math.sin(frame / 3.2) * 24 * walk;
  return { left: s, right: -s };
}

/** Покачивание тела: дыхание и подпрыгивание при ходьбе. */
export function bodyBob(frame: number, seed: number, walk: number) {
  const idle = Math.sin((frame + seed) / 14) * 3;
  const step = Math.abs(Math.sin(frame / 3.2)) * 10 * walk;
  return idle - step;
}
