/**
 * Проигрыватель исполнения в Remotion: кадр видео → sample (@jf/player) → FrameView (React SVG) + звук.
 * Вся постановка уже в треках; здесь только связь с часами и звуком Remotion.
 */
import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { captionLines, sample, type Performance } from "@jf/player";
import { FrameView, frontLayer } from "./Frame";
import { PerfSoundtrack } from "./PerfSoundtrack";

export { SPLIT } from "./Frame";

export const Play = ({ perf }: { perf: Performance }) => {
  const frame = useCurrentFrame();
  const lines = useMemo(() => captionLines(perf), [perf]);
  const state = sample(perf, frame, { frontLayer, lines });
  return (
    <>
      <FrameView perf={perf} state={state} />
      <PerfSoundtrack perf={perf} lines={lines} />
    </>
  );
};
