import { useCurrentFrame } from "remotion";
import { lookForRole, type Crowd as CrowdSpec, type Emotion, type Look } from "@jf/core";
import { characters } from "../registry";
import { BOX_H, BOX_W, Puppet } from "../components/Puppet";
import type { CrowdEvent } from "../timeline";

/** Одежда массовки: приглушённые цвета, чтобы фигуры не спорили с героями. */
const CLOTHES = ["#7a8a9a", "#9a7f6a", "#6f8a72", "#8c7aa0", "#a08a5a", "#6a7f9a", "#9a6f6f", "#7f7f7f"];
const ADULT = ["man", "woman", "old-man", "old-woman"];
const KIDS = ["boy", "girl"];
/** Кто в массовке дети. */
const KID_CROWDS = ["pupils", "children", "kids", "students-school", "class"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Фигуры массовки: базы существующих кукол нужного возраста, без аксессуаров, в своей одежде. */
function figures(spec: CrowdSpec, seed: string): Look[] {
  const kinds = KID_CROWDS.includes(spec.who) ? KIDS : ADULT;
  const pool = Object.values(characters)
    .filter((c) => kinds.includes(c.look.kind))
    .map((c) => lookForRole(c));
  if (!pool.length) return [];
  const n = spec.size === "few" ? 4 : 7;
  return Array.from({ length: n }, (_, i) => {
    const h = hash(`${seed}:${i}`);
    const base = pool[h % pool.length];
    return { ...base, clothes: CLOTHES[(h >>> 8) % CLOTHES.length], accent: undefined, accessories: [] };
  });
}

/** Состояние фигуры по реакции. */
function pose(react: CrowdEvent["react"] | undefined, frame: number, i: number) {
  const ph = frame / 3 + i * 1.3;
  switch (react) {
    case "scream": return { emotion: "surprised" as Emotion, speaking: true, dx: Math.sin(ph * 1.9) * 7, dy: 0 };
    case "gasp": return { emotion: "surprised" as Emotion, speaking: false, dx: 0, dy: -4 };
    case "laugh": return { emotion: "happy" as Emotion, speaking: true, dx: 0, dy: -Math.abs(Math.sin(ph)) * 8 };
    case "cheer": return { emotion: "surprised" as Emotion, speaking: true, dx: 0, dy: -Math.abs(Math.sin(ph * 0.8)) * 16 };
    case "murmur": return { emotion: "neutral" as Emotion, speaking: (i + Math.floor(frame / 12)) % 2 === 0, dx: 0, dy: 0 };
    default: return { emotion: "neutral" as Emotion, speaking: false, dx: 0, dy: 0 };
  }
}

/**
 * Массовка: задний ряд молчаливых фигур за героями (пассажиры, ученики, гости).
 * floorY — линия пола героев; фигуры меньше и выше по кадру — стоят дальше.
 */
export const Crowd = ({ spec, events, seed, width, floorY, heroH }: {
  spec: CrowdSpec; events: CrowdEvent[]; seed: string; width: number; floorY: number; heroH: number;
}) => {
  const frame = useCurrentFrame();
  const looks = figures(spec, seed);
  const ev = events.find((e) => frame >= e.from && frame <= e.to + 6);
  const h = heroH * 0.62;
  const w = (h * BOX_W) / BOX_H;
  const feet = floorY - heroH * 0.1;
  return (
    <div style={{ position: "absolute", inset: 0, filter: "saturate(0.6) brightness(0.88)" }}>
      {looks.map((look, i) => {
        const x = ((i + 0.5) / looks.length) * width + ((hash(`${seed}x${i}`) % 60) - 30);
        const p = pose(ev?.react, frame, i);
        const delay = ev && frame < ev.from + i * 2; // реакция прокатывается по ряду
        const q = delay ? pose(undefined, frame, i) : p;
        return (
          <div key={i} style={{
            position: "absolute", left: x - w / 2 + q.dx, top: feet - (h * 585) / BOX_H + q.dy, width: w, height: h,
            display: "flex", justifyContent: "center",
          }}>
            <Puppet look={look} emotion={q.emotion} speaking={q.speaking} facing={i % 2 ? -1 : 1} seed={i * 31 + 7} />
          </div>
        );
      })}
    </div>
  );
};
