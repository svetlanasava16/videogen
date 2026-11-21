import type { Fx, Mat } from "./acts";
import { mApply } from "./acts";
import { FONT } from "../fonts";

/** Эффекты действий: след взмаха, вспышка удара, дуги движения, звёздочки, слёзы, Z, сердечко, нота, «?», мысли. */
const INK = "#2b1d14";
const STAR = "#f2c94c";
const TEAR = "#7fc4ef";

const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number, n = 18) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.sin(a)).toFixed(1)} ${(cy + r * Math.cos(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
};

const starPath = (r: number, spikes: number, inner: number) => {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
};

const HEART = "M0 10 C-22 -6 -14 -24 0 -12 C14 -24 22 -6 0 10 Z";
const frac = (x: number) => x - Math.floor(x);

function Glyph({ g, t }: { g: string; t: number }) {
  switch (g) {
    case "z":
      return (
        <g fontFamily={FONT} fontWeight={900} fill="#4a5a7a">
          {[0, 1, 2].map((i) => {
            const ph = frac(t * 0.6 + i / 3);
            return <text key={i} x={10 + ph * 50} y={-ph * 110} fontSize={28 + ph * 30} opacity={Math.min(1, (1 - ph) * 2.5)}>Z</text>;
          })}
        </g>
      );
    case "heart": {
      const ph = frac(t * 0.7);
      return <g transform={`translate(${ph * 16} ${-ph * 50}) scale(${1.4 + 0.25 * Math.sin(t * 9)})`} opacity={Math.min(1, (1 - ph) * 3)}><path d={HEART} fill="#e0475b" /></g>;
    }
    case "note": {
      const ph = frac(t * 0.8);
      return (
        <g transform={`translate(${Math.sin(t * 5) * 8} ${-ph * 50}) rotate(${Math.sin(t * 6) * 12})`} opacity={Math.min(1, (1 - ph) * 3)} fill={INK}>
          <ellipse cx={0} cy={0} rx={13} ry={10} transform="rotate(-20)" />
          <rect x={9} y={-50} width={6} height={50} />
          <path d="M15 -50 Q34 -40 30 -20 Q28 -34 15 -36 Z" />
        </g>
      );
    }
    case "q":
      return <text x={0} y={0} fontSize={76} fontWeight={900} fontFamily={FONT} fill={INK} transform={`rotate(${Math.sin(t * 4) * 8})`}>?</text>;
    case "dots":
      return <g fill="#ffffff" stroke={INK} strokeWidth={4}>{[[0, 0, 7], [22, -26, 11], [50, -58, 16]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} opacity={frac(t * 0.8) * 3 > i ? 1 : 0.35} />)}</g>;
    default:
      return null;
  }
}

/**
 * Слой эффектов. where: "torso" / "head" — внутри соответствующей группы рига (двигаются вместе с ней);
 * "up" — значки (Z, сердечко, нота, «?», мысли) в кадре сцены: точка привязки переводится матрицей M, значок остаётся вертикальным.
 */
export function FxLayer({ items, where, M, facing, opacity }: { items: Fx[]; where: "torso" | "head" | "up"; M?: { torso: Mat; head: Mat }; facing: 1 | -1; opacity: number }) {
  const out: React.ReactNode[] = [];
  items.forEach((fx, i) => {
    const space = "space" in fx ? fx.space : fx.type === "stars" || fx.type === "tears" ? "head" : "torso";
    if (fx.type === "glyph") {
      if (where !== "up" || !M) return;
      const [x, y] = mApply(space === "head" ? M.head : M.torso, fx.at);
      out.push(<g key={i} transform={`translate(${x} ${y}) scale(${facing} 1)`}><Glyph g={fx.g} t={fx.t} /></g>);
      return;
    }
    if (where !== space) return;
    switch (fx.type) {
      case "swoosh":
        out.push(
          <g key={i} fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
            {[0, 1, 2].map((j) => <path key={j} d={arcPath(fx.cx, fx.cy, fx.r - j * 16, fx.a0, fx.a1)} strokeWidth={7 - j * 1.5} opacity={0.42 - j * 0.11} />)}
          </g>,
        );
        break;
      case "burst":
        out.push(
          <g key={i} transform={`translate(${fx.at[0]} ${fx.at[1]})`}>
            <path d={starPath(fx.r, 8, 0.45)} fill={STAR} />
            <circle r={fx.r * 0.28} fill="#fff8dc" />
          </g>,
        );
        break;
      case "arcs": {
        const n = fx.n ?? 2, span = fx.span ?? 60;
        out.push(
          <g key={i} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.55}>
            {Array.from({ length: n }, (_, j) => <path key={j} d={arcPath(fx.at[0], fx.at[1], fx.r + j * 14, fx.dir - span / 2, fx.dir + span / 2, 8)} />)}
          </g>,
        );
        break;
      }
      case "stars":
        out.push(
          <g key={i}>
            {[0, 1, 2].map((j) => {
              const a = fx.t * 4 + (j * 2 * Math.PI) / 3;
              return <path key={j} d={starPath(14, 5, 0.5)} fill={STAR} transform={`translate(${150 + Math.cos(a) * 66} ${64 + Math.sin(a) * 16}) rotate(${fx.t * 120})`} />;
            })}
          </g>,
        );
        break;
      case "tears":
        out.push(
          <g key={i} fill={TEAR}>
            {[112, 188].map((x) => (
              <g key={x}>
                <path d={`M${x - 5} 162 Q${x - 8} 190 ${x - 4} 214 L${x + 4} 214 Q${x + 6} 190 ${x + 5} 162 Z`} opacity={0.85} />
                {[0, 0.5].map((o) => {
                  const ph = frac(fx.t * 1.4 + o);
                  const dx = (x < 150 ? -1 : 1) * (6 + ph * 14);
                  return <path key={o} transform={`translate(${x + dx} ${214 + ph * 120})`} d="M0 -14 Q9 0 7 6 Q0 13 -7 6 Q-9 0 0 -14 Z" opacity={1 - ph * 0.6} />;
                })}
              </g>
            ))}
          </g>,
        );
        break;
      case "rays": {
        const n = fx.n ?? 3, span = fx.span ?? 90;
        out.push(
          <g key={i} stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={0.6}>
            {Array.from({ length: n }, (_, j) => {
              const a = ((fx.dir - span / 2 + (span * j) / Math.max(1, n - 1)) * Math.PI) / 180;
              const [sx, sy] = [Math.sin(a), Math.cos(a)];
              return <line key={j} x1={fx.at[0] + sx * fx.r} y1={fx.at[1] + sy * fx.r} x2={fx.at[0] + sx * (fx.r + 20)} y2={fx.at[1] + sy * (fx.r + 20)} />;
            })}
          </g>,
        );
        break;
      }
      case "speed":
        out.push(
          <g key={i} stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={0.35}>
            {fx.ys.map((y, j) => <line key={j} x1={fx.x - (j % 2) * 14} y1={y} x2={fx.x - 70 - (j % 2) * 30} y2={y} />)}
          </g>,
        );
        break;
    }
  });
  if (!out.length) return null;
  return <g opacity={opacity}>{out}</g>;
}
