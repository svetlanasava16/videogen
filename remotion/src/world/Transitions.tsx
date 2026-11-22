import { Easing, interpolate } from "../lib/anim";
import { Fill } from "../lib/Fill";

const ease = Easing.inOut(Easing.cubic);
const INK = "#2b1d14";
const ACCENT = "#e0a030";

/**
 * Переход между сценами: перекрывает стык at (кадр смены сцены) на frames кадров.
 * wipe — тёплая шторка слева направо (в середине закрывает кадр целиком); cut — ничего.
 * flyover внутри эпизода рисуется как wipe; пролёт по карте города — в сборниках (world/Flyover).
 */
export const SceneTransition = ({ frame, at, frames, kind }: { frame: number; at: number; frames: number; kind: "cut" | "wipe" | "flyover" }) => {
  if (kind === "cut" || frames <= 0) return null;
  const from = at - frames / 2;
  if (frame < from || frame > at + frames / 2) return null;
  const p = ease(interpolate(frame, [from, at + frames / 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  // шторка заходит слева (0 → 0.5 закрывает), уходит вправо (0.5 → 1 открывает)
  const x = interpolate(p, [0, 0.5, 1], [-100, 0, 100]);
  return (
    <Fill style={{ transform: `translateX(${x}%)` }}>
      <Fill style={{ background: INK }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 36, background: ACCENT }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 36, background: ACCENT }} />
    </Fill>
  );
};
