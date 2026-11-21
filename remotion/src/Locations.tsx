import { AbsoluteFill } from "remotion";
import { markOf, marksFor } from "@jf/core";
import { locations } from "./registry";
import { Background } from "./components/Background";
import { feetY, seatTopY } from "./world/depth";

/**
 * Превью всех фонов и их сублокаций. props.only — ограничить списком id; props.marks — нарисовать метки:
 * кружок — где стоят стопы куклы на метке (x, план z), полоска — верх сиденья (seat), подпись — имя метки.
 * Так видно, совпадают ли нарисованные стулья и скамьи с метками.
 */
export const Locations = ({ only, marks }: { only?: string[]; marks?: boolean }) => {
  const tiles = Object.values(locations)
    .filter((l) => !only?.length || only.includes(l.id))
    .flatMap((l) => [{ l, place: undefined as string | undefined }, ...(l.bible?.variants ?? []).map((v) => ({ l, place: v.id ?? v.roles[0] }))]);
  return (
    <AbsoluteFill style={{ background: "#2b1d14", display: "flex", flexWrap: "wrap", gap: 12, padding: 12, alignContent: "flex-start" }}>
      {tiles.map(({ l, place }) => (
        <div key={l.id + (place ?? "")} style={{ width: 270, height: 520, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: "scale(0.25)", transformOrigin: "0 0" }}>
            <Background location={l} place={place} />
            {marks && (
              <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
                {Object.entries(marksFor(l, place)).map(([name, m]) => {
                  const mk = markOf(m)!;
                  const x = mk.x * 1080, y = feetY(mk.z);
                  return (
                    <g key={name}>
                      {mk.seat && <rect x={x - 70} y={seatTopY(mk.z) - 6} width={140} height={12} fill="#ff2fd0" />}
                      <circle cx={x} cy={y} r={18} fill="#ff2fd0" stroke="#fff" strokeWidth={5} />
                      <text x={x} y={y + 62} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff" stroke="#000" strokeWidth={8} paintOrder="stroke">{name}</text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#000a", color: "#fff", font: "700 18px Inter, Arial", padding: 4 }}>
            {l.id}{place ? ` · ${place}` : ""}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
