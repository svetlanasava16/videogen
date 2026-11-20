import { estimateWords, lineDuration, type Episode, type WordTiming } from "@jf/core";

export type TimedLine = {
  id: string;
  character: string;
  text: string;
  emotion: Episode["lines"][number]["emotion"];
  startFrame: number;
  endFrame: number; // конец речи (без паузы)
  words: { text: string; startFrame: number; endFrame: number }[];
};

/** Переход куклы: вход (0→1) или уход (1→0) на отрезке кадров. */
export type Move = { id: string; from: number; to: number; kind: "enter" | "exit" };

export const LEAD_IN_SEC = 0.3;
export const TAIL_SEC = 1.0;
export const WALK_SEC = 0.7;

export function buildTimeline(ep: Episode) {
  const fps = ep.format.fps;
  const f = (sec: number) => Math.round(sec * fps);
  let t = LEAD_IN_SEC;
  const moves: Move[] = [];
  const lines: TimedLine[] = ep.lines.map((l) => {
    if (l.enter.length) {
      for (const id of l.enter) moves.push({ id, from: f(t), to: f(t + WALK_SEC), kind: "enter" });
      t += WALK_SEC;
    }
    const words: WordTiming[] = l.audio ? l.audio.words : estimateWords(l.text);
    const dur = lineDuration(l);
    const timed: TimedLine = {
      id: l.id,
      character: l.character,
      text: l.text,
      emotion: l.emotion,
      startFrame: f(t),
      endFrame: f(t + dur),
      words: words.map((w) => ({ text: w.text, startFrame: f(t + w.start), endFrame: f(t + w.end) })),
    };
    t += dur;
    if (l.exit.length) {
      for (const id of l.exit) moves.push({ id, from: f(t + 0.15), to: f(t + 0.15 + WALK_SEC), kind: "exit" });
      t += WALK_SEC + 0.15;
    }
    t += l.pauseAfterSec;
    return timed;
  });

  // кто в кадре с самого начала: все, чьё первое событие — не вход
  const firstKind = new Map<string, Move["kind"]>();
  for (const m of moves) if (!firstKind.has(m.id)) firstKind.set(m.id, m.kind);
  const startsOn = new Set(ep.cast.filter((id) => firstKind.get(id) !== "enter"));

  /** Присутствие куклы в кадре 0..1 на кадре frame. */
  const presence = (id: string, frame: number) => {
    let p = startsOn.has(id) ? 1 : 0;
    for (const m of moves) {
      if (m.id !== id || frame < m.from) continue;
      const k = Math.min(1, (frame - m.from) / Math.max(1, m.to - m.from));
      p = m.kind === "enter" ? k : 1 - k;
    }
    return p;
  };
  /** Идёт ли сейчас переход у куклы (и какой). */
  const moving = (id: string, frame: number) => moves.find((m) => m.id === id && frame >= m.from && frame <= m.to);

  return { lines, moves, presence, moving, durationInFrames: f(t + TAIL_SEC) };
}
