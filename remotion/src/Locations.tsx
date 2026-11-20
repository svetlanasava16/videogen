import { AbsoluteFill } from "remotion";
import { locations } from "./registry";
import { Background } from "./components/Background";

/** Превью всех фонов и их вариантов. props.only — ограничить списком id. */
export const Locations = ({ only }: { only?: string[] }) => {
  const tiles = Object.values(locations)
    .filter((l) => !only?.length || only.includes(l.id))
    .flatMap((l) => [{ l, place: undefined as string | undefined }, ...(l.bible?.variants ?? []).map((v) => ({ l, place: v.roles[0] }))]);
  return (
    <AbsoluteFill style={{ background: "#2b1d14", display: "flex", flexWrap: "wrap", gap: 12, padding: 12, alignContent: "flex-start" }}>
      {tiles.map(({ l, place }) => (
        <div key={l.id + (place ?? "")} style={{ width: 270, height: 520, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: "scale(0.25)", transformOrigin: "0 0" }}>
            <Background location={l} place={place} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#000a", color: "#fff", font: "700 18px Inter, Arial", padding: 4 }}>
            {l.id}{place ? ` · ${place}` : ""}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
