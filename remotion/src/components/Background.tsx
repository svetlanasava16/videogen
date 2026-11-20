import { AbsoluteFill } from "remotion";
import type { Location } from "@jf/core";

/** Простая 2D-локация. Дальше сюда встанет three.js-сцена (@remotion/three). */
export const Background = ({ location }: { location: Location }) => {
  const { wall, floor, accent } = location.palette;
  const has = (p: string) => location.props.includes(p);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: wall }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "38%", background: floor }} />
      {/* полка с бутылками — только где есть бутылки */}
      {has("bottles") && <div style={{ position: "absolute", left: "8%", right: "8%", top: "12%", height: 10, background: accent, opacity: 0.6 }} />}
      {has("bottles") && Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${10 + i * 9.5}%`,
            top: "6%",
            width: 36,
            height: 90,
            borderRadius: "8px 8px 4px 4px",
            background: accent,
            opacity: 0.35 + (i % 3) * 0.15,
          }}
        />
      ))}
      {/* лампа */}
      {has("lamp") && (<>
        <div style={{ position: "absolute", left: "50%", top: 0, width: 4, height: "9%", background: "#111" }} />
        <div
          style={{
            position: "absolute", left: "calc(50% - 60px)", top: "9%", width: 120, height: 50,
            borderRadius: "60px 60px 0 0", background: accent, boxShadow: `0 40px 160px 60px ${accent}55`,
          }}
        />
      </>)}
      {/* стойка */}
      {has("counter") && <div style={{ position: "absolute", left: 0, right: 0, bottom: "30%", height: 36, background: "#5b3a29" }} />}
      {/* окно — для остальных интерьеров */}
      {has("window") && <div style={{ position: "absolute", left: "62%", top: "10%", width: "26%", height: "22%", background: "#cfe6f5", border: `10px solid ${accent}` }} />}
    </AbsoluteFill>
  );
};
