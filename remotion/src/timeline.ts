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

export const LEAD_IN_SEC = 0.3;
export const TAIL_SEC = 1.0;

export function buildTimeline(ep: Episode) {
  const fps = ep.format.fps;
  let t = LEAD_IN_SEC;
  const lines: TimedLine[] = ep.lines.map((l) => {
    const words: WordTiming[] = l.audio ? l.audio.words : estimateWords(l.text);
    const dur = lineDuration(l);
    const startFrame = Math.round(t * fps);
    const timed: TimedLine = {
      id: l.id,
      character: l.character,
      text: l.text,
      emotion: l.emotion,
      startFrame,
      endFrame: Math.round((t + dur) * fps),
      words: words.map((w) => ({
        text: w.text,
        startFrame: Math.round((t + w.start) * fps),
        endFrame: Math.round((t + w.end) * fps),
      })),
    };
    t += dur + l.pauseAfterSec;
    return timed;
  });
  return { lines, durationInFrames: Math.round((t + TAIL_SEC) * fps) };
}
