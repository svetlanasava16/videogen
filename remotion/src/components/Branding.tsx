import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { Locale } from "@jf/core";
import disclosure from "../../../content/disclosure.json";

const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";

/** Водяной знак ANEK. в правом верхнем углу на всё видео. */
export const Watermark = () => (
  <div
    style={{
      position: "absolute", top: 56, right: 56, fontFamily: FONT, fontWeight: 900, fontSize: 42,
      color: "#ffffff", opacity: 0.7, letterSpacing: "0.02em", WebkitTextStroke: "6px #00000088", paintOrder: "stroke fill",
    }}
  >
    {disclosure.brand}
  </div>
);

/** Финальная карточка: логотип и короткая маркировка (голос — ИИ, персонажи вымышлены). */
export const EndCard = ({ from, frames, locale }: { from: number; frames: number; locale: Locale }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const k = interpolate(frame - from, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(20,16,12,${0.88 * k})`, justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
      <div style={{ opacity: k, transform: `scale(${0.9 + 0.1 * k})`, textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 190, fontWeight: 900, letterSpacing: "0.02em" }}>
          ANEK<span style={{ color: "#ffd400" }}>.</span>
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, opacity: 0.85, marginTop: 24 }}>{disclosure.card[locale]}</div>
        <div style={{ fontSize: 32, fontWeight: 500, opacity: 0.6, marginTop: 18 }}>{disclosure.copyright}</div>
      </div>
    </AbsoluteFill>
  );
};
