import { AudioLibrary, estimateWords, laughs, lineDuration, pick, type AudioClip, type Episode, type WordTiming } from "@jf/core";
import audioData from "../../content/audio.json";

const clips = AudioLibrary.parse(audioData).clips;

export type TimedLine = {
  id: string;
  character: string;
  text: string;
  emotion: Episode["lines"][number]["emotion"];
  startFrame: number;
  endFrame: number; // конец речи (без паузы)
  words: { text: string; startFrame: number; endFrame: number }[];
  /** Файл озвучки (относительно public/), если реплика озвучена. */
  audioFile?: string;
};

/** Переход куклы: вход (0→1) или уход (1→0) на отрезке кадров. */
export type Move = { id: string; from: number; to: number; kind: "enter" | "exit" };

/** Звук на таймлайне: смех или музыка (кадры). */
export type Cue = { clip: AudioClip; from: number; frames: number };

export const LEAD_IN_SEC = 0.3;
export const TAIL_SEC = 1.0;
export const WALK_SEC = 0.7;
/** Финальная карточка ANEK. с дисклеймером. */
export const END_CARD_SEC = 1.2;
/** Какая доля смеха звучит в паузе (хвост накладывается на следующую реплику). */
const LAUGH_GAP = 0.6;

/** Музыка эпизода: явная, "none" или выбор по id из библиотеки. */
export function musicFor(ep: Episode): AudioClip | undefined {
  if (ep.music === "none") return undefined;
  const pool = clips.filter((c) => c.kind === "music");
  return ep.music ? pool.find((c) => c.id === ep.music) : pick(pool, ep.id);
}

export function buildTimeline(ep: Episode) {
  const fps = ep.format.fps;
  const f = (sec: number) => Math.round(sec * fps);
  let t = LEAD_IN_SEC;
  const moves: Move[] = [];
  const laughCues: Cue[] = [];
  const laughOf = laughs(ep.lines);
  const laughPool = clips.filter((c) => c.kind === "laugh");
  let laughEnd = 0;
  const lines: TimedLine[] = ep.lines.map((l, i) => {
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
      audioFile: l.audio?.file,
    };
    t += dur;
    const want = laughOf[i];
    const clip = want ? pick(laughPool.filter((c) => c.intensity === want), `${ep.id}:${i}`) ?? pick(laughPool, `${ep.id}:${i}`) : undefined;
    let gap = 0;
    if (clip) {
      laughCues.push({ clip, from: f(t + 0.1), frames: f(clip.durationSec) });
      laughEnd = Math.max(laughEnd, t + 0.1 + clip.durationSec);
      gap = i < ep.lines.length - 1 ? clip.durationSec * LAUGH_GAP : 0;
    }
    if (l.exit.length) {
      for (const id of l.exit) moves.push({ id, from: f(t + 0.15), to: f(t + 0.15 + WALK_SEC), kind: "exit" });
      t += WALK_SEC + 0.15;
    }
    t += Math.max(l.pauseAfterSec, gap);
    return timed;
  });
  const speechEnd = Math.max(t + TAIL_SEC, laughEnd + 0.2);
  const card = { from: f(speechEnd), frames: f(END_CARD_SEC) };

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

  const durationInFrames = card.from + card.frames;
  const music = musicFor(ep);
  return { lines, moves, presence, moving, laughs: laughCues, music, card, durationInFrames };
}
