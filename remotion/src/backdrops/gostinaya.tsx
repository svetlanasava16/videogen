import { useId } from "react";
import { Canvas, Room, Door, W, H, FLOOR_Y, type BackdropProps, type Palette } from "./parts";
import { depthScale, feetY, seatTopY } from "../world/depth";
import { FONT } from "../fonts";

/* ---------- цветовые помощники (используются и в соседних фонах) ---------- */
const rgb = (c: string) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
export const dark = (c: string, t = 0.2) => mix(c, "#000000", t);
export const light = (c: string, t = 0.2) => mix(c, "#ffffff", t);

export const WOOD = "#8a5a3a";

/* ---------- сиденья под метки (content/locations → marks {x, z, seat}) ----------
 * Рисуются по тем же числам, что и метка: x — доля ширины кадра, z — план (1 у стены, 0.5 середина, 0 перед).
 * Верх сиденья ровно на seatTopY(z), ножки до feetY(z), ширина ~140·depthScale(z) на одного сидящего.
 */
type SeatKind = "chair" | "stool" | "bar-stool" | "armchair" | "office" | "theater";

/** Одно сиденье анфас под меткой. back — высота спинки (px при масштабе 1), 0 — без спинки. */
export const SeatAt = ({ x, z = 1, kind = "chair", color = WOOD, pad, back }: { x: number; z?: number; kind?: SeatKind; color?: string; pad?: string; back?: number }) => {
  const s = depthScale(z);
  const cx = x * W;
  const top = seatTopY(z);
  const fy = feetY(z);
  const hw = 70 * s;
  const leg = dark(color, 0.35);
  if (kind === "stool" || kind === "bar-stool") {
    const r = kind === "bar-stool" ? 56 * s : 50 * s;
    return (
      <g>
        {kind === "bar-stool" ? (
          <>
            <rect x={cx - 6 * s} y={top} width={12 * s} height={fy - top} fill="#2b1d14" />
            <rect x={cx - 34 * s} y={top + (fy - top) * 0.55} width={68 * s} height={7 * s} rx={3 * s} fill="#2b1d14" />
            <ellipse cx={cx} cy={fy - 2} rx={34 * s} ry={7 * s} fill="#2b1d14" />
          </>
        ) : (
          <>
            <path d={`M${cx - r + 10 * s} ${top} L${cx - r - 4 * s} ${fy} h${12 * s} L${cx - r + 24 * s} ${top} Z`} fill={leg} />
            <path d={`M${cx + r - 10 * s} ${top} L${cx + r + 4 * s} ${fy} h${-12 * s} L${cx + r - 24 * s} ${top} Z`} fill={leg} />
            <rect x={cx - 6 * s} y={top} width={12 * s} height={fy - top} fill={dark(leg, 0.1)} />
          </>
        )}
        <rect x={cx - r} y={top} width={r * 2} height={20 * s} rx={10 * s} fill={color} />
        <rect x={cx - r} y={top} width={r * 2} height={7 * s} rx={4 * s} fill={light(color, 0.18)} />
      </g>
    );
  }
  if (kind === "armchair") {
    const bh = (back ?? 170) * s;
    return (
      <g>
        <rect x={cx - hw - 6 * s} y={top - bh} width={hw * 2 + 12 * s} height={bh + 30 * s} rx={34 * s} fill={dark(color, 0.12)} />
        <rect x={cx - hw * 0.7} y={top - bh + 18 * s} width={hw * 1.4} height={bh * 0.6} rx={24 * s} fill={dark(color, 0.04)} />
        <rect x={cx - hw * 0.9} y={top} width={hw * 1.8} height={30 * s} rx={10 * s} fill={color} />
        <rect x={cx - hw - 30 * s} y={top - 46 * s} width={40 * s} height={98 * s} rx={18 * s} fill={light(color, 0.06)} />
        <rect x={cx + hw - 10 * s} y={top - 46 * s} width={40 * s} height={98 * s} rx={18 * s} fill={light(color, 0.06)} />
        <rect x={cx - hw - 24 * s} y={top + 30 * s} width={hw * 2 + 48 * s} height={(fy - top) - 46 * s} rx={10 * s} fill={dark(color, 0.22)} />
        <rect x={cx - hw - 10 * s} y={fy - 18 * s} width={14 * s} height={18 * s} fill="#4a3020" />
        <rect x={cx + hw - 4 * s} y={fy - 18 * s} width={14 * s} height={18 * s} fill="#4a3020" />
      </g>
    );
  }
  if (kind === "office") {
    const bh = (back ?? 190) * s;
    return (
      <g>
        <rect x={cx - hw * 0.8} y={top - bh} width={hw * 1.6} height={bh - 10 * s} rx={30 * s} fill={color} />
        <rect x={cx - hw * 0.6} y={top - bh + 16 * s} width={hw * 1.2} height={bh * 0.4} rx={20 * s} fill={light(color, 0.1)} />
        <rect x={cx - 7 * s} y={top} width={14 * s} height={fy - top - 12 * s} fill="#2a2a30" />
        <path d={`M${cx - 46 * s} ${fy - 4 * s} L${cx} ${fy - 16 * s} L${cx + 46 * s} ${fy - 4 * s}`} stroke="#2a2a30" strokeWidth={8 * s} fill="none" strokeLinecap="round" />
        <circle cx={cx - 46 * s} cy={fy - 4 * s} r={6 * s} fill="#2a2a30" />
        <circle cx={cx + 46 * s} cy={fy - 4 * s} r={6 * s} fill="#2a2a30" />
        <rect x={cx - hw} y={top} width={hw * 2} height={22 * s} rx={10 * s} fill={dark(color, 0.1)} />
        <rect x={cx - hw - 6 * s} y={top - 50 * s} width={14 * s} height={52 * s} rx={6 * s} fill="#2a2a30" />
        <rect x={cx + hw - 8 * s} y={top - 50 * s} width={14 * s} height={52 * s} rx={6 * s} fill="#2a2a30" />
      </g>
    );
  }
  if (kind === "theater") {
    const bh = (back ?? 90) * s;
    return (
      <g>
        <rect x={cx - hw} y={top - bh} width={hw * 2} height={bh + 10 * s} rx={22 * s} fill={dark(color, 0.12)} />
        <rect x={cx - hw * 0.72} y={top - bh + 12 * s} width={hw * 1.44} height={bh * 0.6} rx={14 * s} fill={light(color, 0.08)} />
        <rect x={cx - hw} y={top} width={hw * 2} height={26 * s} rx={10 * s} fill={color} />
        <rect x={cx - hw - 12 * s} y={top - 30 * s} width={16 * s} height={fy - top + 30 * s} rx={6 * s} fill="#2b1d14" />
        <rect x={cx + hw - 4 * s} y={top - 30 * s} width={16 * s} height={fy - top + 30 * s} rx={6 * s} fill="#2b1d14" />
      </g>
    );
  }
  // обычный стул анфас
  const bh = (back ?? 150) * s;
  return (
    <g>
      {bh > 0 && (
        <>
          <rect x={cx - hw + 8 * s} y={top - bh} width={14 * s} height={bh} fill={dark(color, 0.2)} />
          <rect x={cx + hw - 22 * s} y={top - bh} width={14 * s} height={bh} fill={dark(color, 0.2)} />
          <rect x={cx - hw + 4 * s} y={top - bh} width={hw * 2 - 8 * s} height={bh * 0.42} rx={14 * s} fill={dark(color, 0.08)} />
          {pad && <rect x={cx - hw + 20 * s} y={top - bh + 12 * s} width={hw * 2 - 40 * s} height={bh * 0.24} rx={8 * s} fill={pad} />}
        </>
      )}
      <rect x={cx - hw + 8 * s} y={top + 14 * s} width={14 * s} height={fy - top - 14 * s} fill={leg} />
      <rect x={cx + hw - 22 * s} y={top + 14 * s} width={14 * s} height={fy - top - 14 * s} fill={leg} />
      <rect x={cx - hw} y={top} width={hw * 2} height={20 * s} rx={8 * s} fill={color} />
      {pad && <rect x={cx - hw + 6 * s} y={top - 4 * s} width={hw * 2 - 12 * s} height={10 * s} rx={5 * s} fill={pad} />}
    </g>
  );
};

/** Скамья под несколькими метками: от x0 до x1 (доли кадра) на плане z; back — спинка из досок; legs — металл/дерево. */
export const BenchAt = ({ x0, x1, z = 1, color = "#a8673f", metal = "#3a3a40", back = true, plinth = false }: { x0: number; x1: number; z?: number; color?: string; metal?: string; back?: boolean; plinth?: boolean }) => {
  const s = depthScale(z);
  const l = x0 * W;
  const r = x1 * W;
  const top = seatTopY(z);
  const fy = feetY(z);
  return (
    <g>
      {back && (
        <>
          <rect x={l + 24 * s} y={top - 150 * s} width={12 * s} height={150 * s} fill={metal} />
          <rect x={r - 36 * s} y={top - 150 * s} width={12 * s} height={150 * s} fill={metal} />
          <rect x={l} y={top - 150 * s} width={r - l} height={30 * s} rx={10 * s} fill={color} />
          <rect x={l} y={top - 100 * s} width={r - l} height={30 * s} rx={10 * s} fill={color} />
        </>
      )}
      {plinth ? (
        <rect x={l + 10 * s} y={top + 20 * s} width={r - l - 20 * s} height={fy - top - 20 * s} rx={6 * s} fill={dark(color, 0.3)} />
      ) : (
        <>
          <rect x={l + 10 * s} y={top + 16 * s} width={16 * s} height={fy - top - 16 * s} fill={metal} />
          <rect x={r - 26 * s} y={top + 16 * s} width={16 * s} height={fy - top - 16 * s} fill={metal} />
          {r - l > 400 * s && <rect x={(l + r) / 2 - 8 * s} y={top + 16 * s} width={16 * s} height={fy - top - 16 * s} fill={metal} />}
        </>
      )}
      <rect x={l - 8 * s} y={top} width={r - l + 16 * s} height={26 * s} rx={10 * s} fill={dark(color, 0.12)} />
      <rect x={l - 8 * s} y={top} width={r - l + 16 * s} height={9 * s} rx={5 * s} fill={light(color, 0.1)} />
    </g>
  );
};

/** Диван у стены под метками: сиденье от x0 до x1 (доли кадра), подлокотники снаружи. */
export const SofaAt = ({ x0, x1, z = 1, color }: { x0: number; x1: number; z?: number; color: string }) => {
  const s = depthScale(z);
  const l = x0 * W;
  const r = x1 * W;
  const top = seatTopY(z);
  const fy = feetY(z);
  const arm = 66 * s;
  const mid = (l + r) / 2;
  return (
    <g>
      <rect x={l - arm + 20 * s} y={top - 200 * s} width={r - l + arm * 2 - 40 * s} height={230 * s} rx={44 * s} fill={dark(color, 0.12)} />
      <rect x={l + 10 * s} y={top - 182 * s} width={mid - l - 18 * s} height={150 * s} rx={34 * s} fill={dark(color, 0.04)} />
      <rect x={mid + 8 * s} y={top - 182 * s} width={r - mid - 18 * s} height={150 * s} rx={34 * s} fill={dark(color, 0.04)} />
      <rect x={l - 6 * s} y={top} width={r - l + 12 * s} height={36 * s} rx={14 * s} fill={color} />
      <rect x={l - arm} y={top - 70 * s} width={arm} height={(fy - top) + 40 * s} rx={28 * s} fill={light(color, 0.06)} />
      <rect x={r} y={top - 70 * s} width={arm} height={(fy - top) + 40 * s} rx={28 * s} fill={light(color, 0.06)} />
      <rect x={l - arm + 10 * s} y={top + 34 * s} width={r - l + arm * 2 - 20 * s} height={fy - top - 50 * s} rx={10 * s} fill={dark(color, 0.22)} />
      <rect x={l - arm + 24 * s} y={fy - 16 * s} width={16 * s} height={16 * s} fill="#4a3020" />
      <rect x={r + arm - 40 * s} y={fy - 16 * s} width={16 * s} height={16 * s} fill="#4a3020" />
    </g>
  );
};

/** Плинтус вдоль линии пола. */
export const Plinth = ({ color }: { color: string }) => <rect x={0} y={FLOOR_Y - 26} width={W} height={26} fill={color} />;

/** Большой двустворчатый шкаф; низ стоит на полу. */
export const Wardrobe = ({ x, w = 270, h = 660, color = WOOD }: { x: number; w?: number; h?: number; color?: string }) => {
  const y = FLOOR_Y - h;
  return (
    <g>
      <rect x={x + 14} y={y + 14} width={w} height={h - 14} rx={10} fill="#00000020" />
      <rect x={x - 10} y={y} width={w + 20} height={28} rx={8} fill={dark(color, 0.18)} />
      <rect x={x} y={y + 24} width={w} height={h - 44} rx={8} fill={color} />
      <rect x={x + 16} y={y + 44} width={w / 2 - 24} height={h - 104} rx={6} fill={dark(color, 0.08)} />
      <rect x={x + w / 2 + 8} y={y + 44} width={w / 2 - 24} height={h - 104} rx={6} fill={dark(color, 0.08)} />
      <rect x={x + w / 2 - 22} y={y + h * 0.48} width={10} height={44} rx={5} fill="#e0b030" />
      <rect x={x + w / 2 + 12} y={y + h * 0.48} width={10} height={44} rx={5} fill="#e0b030" />
      <rect x={x + 14} y={FLOOR_Y - 22} width={22} height={22} fill={dark(color, 0.35)} />
      <rect x={x + w - 36} y={FLOOR_Y - 22} width={22} height={22} fill={dark(color, 0.35)} />
    </g>
  );
};

/* =====================================================================================
 * Детализация интерьеров — общий набор (им пользуются gostinaya, kukhnya, spalnya, podyezd, bar, magazin).
 * Правила: детали на стенах, у задней стены, на потолке и лёгкой фактурой пола; середина пола ниже FLOOR_Y свободна.
 * Зоны текста: рассказчик y 150…420, субтитры y≈1380…1600 — там только спокойные крупные плоскости.
 * ===================================================================================== */

/** Уникальный id для градиентов/клипов (на листе Locations несколько фонов в одном документе). */
export const useUid = (p = "g") => `${p}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

/** Мягкий градиент-оверлей (глубина, затенение): прозрачность from → to, вертикально или горизонтально. */
export const VShade = ({ x = 0, y, w = W, h, color = "#000000", from = 0, to = 0.25, dir = "v" }: { x?: number; y: number; w?: number; h: number; color?: string; from?: number; to?: number; dir?: "v" | "h" }) => {
  const id = useUid("vs");
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2={dir === "h" ? "1" : "0"} y2={dir === "h" ? "0" : "1"}>
          <stop offset="0" stopColor={color} stopOpacity={from} />
          <stop offset="1" stopColor={color} stopOpacity={to} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
    </>
  );
};

/** Мягкое световое пятно (лампа, окно, неон). */
export const Glow = ({ cx, cy, r, rx, ry, color = "#fff1c4", opacity = 0.35 }: { cx: number; cy: number; r: number; rx?: number; ry?: number; color?: string; opacity?: number }) => {
  const id = useUid("gl");
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={opacity} />
          <stop offset="0.5" stopColor={color} stopOpacity={opacity * 0.4} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx ?? r} ry={ry ?? r} fill={`url(#${id})`} />
    </>
  );
};

/** Перспектива пола: горизонт HZ (согласован с масштабом кукол на планах), линии сходятся к центру кадра. */
export const HZ = 760;
export const persX = (x: number, y: number) => W / 2 + (x - W / 2) * ((y - HZ) / (FLOOR_Y - HZ));
/** Ряды пола (y), равномерные по глубине: d — шаг. */
export const floorRows = (d = 0.07) => {
  const ys: number[] = [];
  for (let j = 1; j < 40; j++) {
    const k = 1 - d * j;
    if (k <= 0) break;
    const y = HZ + (FLOOR_Y - HZ) / k;
    ys.push(Math.min(y, H));
    if (y >= H) break;
  }
  return ys;
};
const boardXs = (step: number) => {
  const xs: number[] = [];
  for (let x = W / 2 - Math.ceil(W / 2 / step) * step; x <= W + step; x += step) xs.push(x);
  return xs;
};
const quad = (xa: number, xb: number, y0: number, y1: number) =>
  `M${persX(xa, y0)} ${y0} L${persX(xb, y0)} ${y0} L${persX(xb, y1)} ${y1} L${persX(xa, y1)} ${y1} Z`;

/** Дощатый пол: доски чуть разного тона, швы к точке схода, стыки вразбежку. */
export const FloorBoards = ({ color, step = 64, t = 0.1, d = 0.075 }: { color: string; step?: number; t?: number; d?: number }) => {
  const xs = boardXs(step);
  const ys = [FLOOR_Y, ...floorRows(d)];
  const seam = dark(color, t);
  return (
    <g>
      {xs.slice(0, -1).map((x, i) => {
        const v = ((i * 37) % 5) - 2;
        return <path key={`b${i}`} d={quad(x, xs[i + 1], FLOOR_Y, H)} fill={v === 0 ? color : v > 0 ? light(color, 0.025 * v) : dark(color, -0.025 * v)} />;
      })}
      {xs.map((x, i) => (
        <path key={`s${i}`} d={`M${x - 1} ${FLOOR_Y} L${x + 1} ${FLOOR_Y} L${persX(x + 3, H)} ${H} L${persX(x - 3, H)} ${H} Z`} fill={seam} />
      ))}
      {ys.slice(0, -1).flatMap((y, j) =>
        xs.slice(0, -1).map((x, i) =>
          (i * 2 + j * 3) % 5 === 0 ? <rect key={`j${i}-${j}`} x={persX(x, y)} y={y - 1} width={persX(xs[i + 1], y) - persX(x, y)} height={2 + (y - FLOOR_Y) / 140} fill={seam} /> : null,
        ),
      )}
    </g>
  );
};

/** Плитка/линолеум в перспективе: шахматка a/b (или ровный цвет a со швами). */
export const FloorTiles = ({ a, b, step = 120, d = 0.1, grout }: { a: string; b?: string; step?: number; d?: number; grout?: string }) => {
  const xs = boardXs(step);
  const ys = [FLOOR_Y, ...floorRows(d)];
  if (ys[ys.length - 1] < H) ys.push(H);
  return (
    <g>
      {ys.slice(0, -1).flatMap((y, j) =>
        xs.slice(0, -1).map((x, i) => <path key={`${i}-${j}`} d={quad(x, xs[i + 1], y, ys[j + 1])} fill={b && (i + j) % 2 ? b : a} />),
      )}
      {grout && (
        <>
          {xs.map((x, i) => <path key={`gx${i}`} d={`M${x - 1.5} ${FLOOR_Y} L${x + 1.5} ${FLOOR_Y} L${persX(x + 4, H)} ${H} L${persX(x - 4, H)} ${H} Z`} fill={grout} />)}
          {ys.map((y, j) => <rect key={`gy${j}`} x={0} y={y - 1} width={W} height={2 + (y - FLOOR_Y) / 120} fill={grout} />)}
        </>
      )}
    </g>
  );
};

/** Ковёр/дорожка на полу в перспективе: от x0 до x1 (по линии стены), от y0 до y1. */
export const FloorRug = ({ x0, x1, y0, y1, color, border, inner, fringe = "#f2e6d0" }: { x0: number; x1: number; y0: number; y1: number; color: string; border?: string; inner?: string; fringe?: string }) => {
  const b = border ?? dark(color, 0.25);
  const k = (y: number) => (y - HZ) / (FLOOR_Y - HZ);
  const pad = 26;
  const xa = (x: number, y: number) => persX(x, y);
  return (
    <g>
      <path d={quad(x0, x1, y0, y1)} transform="translate(0 6)" fill="#00000030" />
      <path d={quad(x0, x1, y0, y1)} fill={b} />
      <path d={quad(x0 + pad, x1 - pad, y0 + 10 * k(y0), y1 - 12 * k(y1))} fill={color} />
      {inner && <path d={quad(x0 + pad * 3, x1 - pad * 3, y0 + 30 * k(y0), y1 - 34 * k(y1))} fill={inner} />}
      {[y0 - 6, y1].map((y, j) => (
        <g key={j}>
          {Array.from({ length: 14 }).map((_, i) => {
            const x = xa(x0 + ((x1 - x0) * (i + 0.5)) / 14, y);
            return <rect key={i} x={x - 2} y={y} width={4} height={8 * k(y)} fill={fringe} opacity={0.8} />;
          })}
        </g>
      ))}
    </g>
  );
};

/** Контактная тень под мебелью у стены. */
export const FloorShadow = ({ cx, w, y = FLOOR_Y, o = 0.25, h = 14 }: { cx: number; w: number; y?: number; o?: number; h?: number }) => (
  <ellipse cx={cx} cy={y + 2} rx={w / 2} ry={h} fill="#000000" opacity={o} />
);

/** Потолок: полоса потолка + карниз-лепнина. */
export const Ceiling = ({ color, h = 80, molding }: { color: string; h?: number; molding?: string }) => (
  <g>
    <rect x={0} y={0} width={W} height={h} fill={color} />
    <rect x={0} y={h} width={W} height={12} fill={molding ?? dark(color, 0.08)} />
    <rect x={0} y={h + 12} width={W} height={5} fill={light(color, 0.2)} />
    <rect x={0} y={h + 17} width={W} height={14} fill="#00000014" />
  </g>
);

/** Плинтус с бликом. */
export const Skirting = ({ color, h = 30 }: { color: string; h?: number }) => (
  <g>
    <rect x={0} y={FLOOR_Y - h} width={W} height={h} fill={color} />
    <rect x={0} y={FLOOR_Y - h} width={W} height={6} fill={light(color, 0.18)} />
  </g>
);

/** Розетка и выключатель. */
export const Outlet = ({ x, y, color = "#f2ede2" }: { x: number; y: number; color?: string }) => (
  <g>
    <rect x={x - 22} y={y - 22} width={44} height={44} rx={8} fill={color} />
    <circle cx={x - 8} cy={y} r={4} fill="#5a5048" />
    <circle cx={x + 8} cy={y} r={4} fill="#5a5048" />
  </g>
);
export const Switch = ({ x, y, color = "#f2ede2" }: { x: number; y: number; color?: string }) => (
  <g>
    <rect x={x - 20} y={y - 26} width={40} height={52} rx={8} fill={color} />
    <rect x={x - 9} y={y - 14} width={18} height={20} rx={4} fill={dark(color, 0.12)} />
  </g>
);

/** Окно с видом наружу: двор с панельным домом и деревом (днём) или огни города (ночью); форточка, подоконник. */
export const WindowView = ({ x, y, w, h, frame = "#f2ead8", night = false, sill = true, view = "yard" }: { x: number; y: number; w: number; h: number; frame?: string; night?: boolean; sill?: boolean; view?: "yard" | "city" | "street" }) => {
  const id = useUid("wv");
  const gx = x + 16;
  const gy = y + 16;
  const gw = w - 32;
  const gh = h - 32;
  const skyA = night ? "#1c2742" : "#8fc0e0";
  const skyB = night ? "#3a4a70" : "#d6ebf3";
  const bld = night ? "#27324d" : "#d8cbb4";
  const far = night ? "#2f3b5a" : "#b7c8d2";
  const winC = night ? "#f2cf6a" : "#7fa3bb";
  const tree = night ? "#1f2c33" : "#6d9a5c";
  const bx = gx + gw * 0.42;
  const by = gy + gh * (view === "street" ? 0.42 : 0.28);
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <rect x={gx} y={gy} width={gw} height={gh} rx={4} />
        </clipPath>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyA} />
          <stop offset="1" stopColor={skyB} />
        </linearGradient>
      </defs>
      <rect x={x + 10} y={y + 10} width={w} height={h} rx={8} fill="#00000018" />
      <rect x={x} y={y} width={w} height={h} rx={8} fill={frame} />
      <g clipPath={`url(#${id}c)`}>
        <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#${id}s)`} />
        {night ? (
          <>
            <circle cx={gx + gw * 0.2} cy={gy + gh * 0.18} r={14} fill="#f5e6a8" />
            {[[0.5, 0.1], [0.75, 0.2], [0.35, 0.3], [0.9, 0.08]].map(([a, b], i) => <circle key={i} cx={gx + gw * a} cy={gy + gh * b} r={2.5} fill="#f5e6a8" />)}
          </>
        ) : (
          <>
            <ellipse cx={gx + gw * 0.22} cy={gy + gh * 0.16} rx={gw * 0.16} ry={gh * 0.05} fill="#ffffff" opacity={0.85} />
            <ellipse cx={gx + gw * 0.3} cy={gy + gh * 0.13} rx={gw * 0.1} ry={gh * 0.05} fill="#ffffff" opacity={0.85} />
          </>
        )}
        {/* дальние дома */}
        {Array.from({ length: 6 }).map((_, i) => {
          const hh = gh * (0.22 + ((i * 29) % 4) * 0.05);
          return <rect key={i} x={gx + i * gw * 0.19 - 10} y={gy + gh - hh - gh * 0.12} width={gw * 0.17} height={hh + gh * 0.12} fill={far} />;
        })}
        {/* соседний панельный дом */}
        <rect x={bx} y={by} width={gw} height={gh} fill={bld} />
        <rect x={bx} y={by} width={gw} height={8} fill={dark(bld, 0.15)} />
        {Array.from({ length: 6 }).flatMap((_, r) =>
          Array.from({ length: 4 }).map((__, c) => {
            const lit = night ? (r * 3 + c * 5) % 4 !== 0 : true;
            return <rect key={`${r}-${c}`} x={bx + 14 + c * 46} y={by + 20 + r * 50} width={26} height={30} rx={2} fill={lit ? winC : dark(bld, 0.2)} opacity={night ? 0.9 : 1} />;
          }),
        )}
        {Array.from({ length: 6 }).map((_, r) => <rect key={`l${r}`} x={bx} y={by + 58 + r * 50} width={gw} height={3} fill={dark(bld, 0.08)} />)}
        {/* дерево во дворе / фонарь */}
        <circle cx={gx + gw * 0.18} cy={gy + gh * 0.8} r={gw * 0.22} fill={tree} />
        <circle cx={gx + gw * 0.36} cy={gy + gh * 0.88} r={gw * 0.17} fill={dark(tree, 0.08)} />
        <rect x={gx + gw * 0.17} y={gy + gh * 0.86} width={8} height={gh * 0.2} fill={dark(tree, 0.3)} />
        {night && <Glow cx={gx + gw * 0.62} cy={gy + gh * 0.85} r={gw * 0.25} color="#f5d77a" opacity={0.5} />}
        {/* блик стекла */}
        <path d={`M${gx + gw * 0.55} ${gy} L${gx + gw * 0.7} ${gy} L${gx + gw * 0.25} ${gy + gh} L${gx + gw * 0.1} ${gy + gh} Z`} fill="#ffffff" opacity={night ? 0.05 : 0.14} />
      </g>
      {/* рама: средник и форточка */}
      <rect x={x + w / 2 - 7} y={gy} width={14} height={gh} fill={frame} />
      <rect x={gx} y={y + h * 0.34} width={gw} height={12} fill={frame} />
      <rect x={x + w / 2 + 7} y={gy} width={4} height={gh} fill={dark(frame, 0.12)} />
      <rect x={x + w / 2 - 34} y={y + h * 0.55} width={20} height={8} rx={4} fill={dark(frame, 0.3)} />
      {sill && (
        <>
          <rect x={x - 22} y={y + h - 6} width={w + 44} height={22} rx={5} fill={light(frame, 0.2)} />
          <rect x={x - 22} y={y + h + 16} width={w + 44} height={8} fill="#00000020" />
        </>
      )}
    </g>
  );
};

/** Шторы с подхватами (и тюль) на карнизе от x0 до x1. */
export const Curtains = ({ x0, x1, y, h, color, tie, tulle = true, rod = WOOD, part = 0.3 }: { x0: number; x1: number; y: number; h: number; color: string; tie?: string; tulle?: boolean; rod?: string; part?: number }) => {
  const cw = (x1 - x0) * part;
  const ty = y + h * 0.55;
  const fold = dark(color, 0.14);
  const tb = tie ?? "#e0b030";
  return (
    <g>
      {tulle && (
        <g opacity={0.35}>
          <rect x={x0 + 10} y={y + 6} width={x1 - x0 - 20} height={h * 0.92} fill="#ffffff" />
          {Array.from({ length: Math.floor((x1 - x0) / 30) }).map((_, i) => <rect key={i} x={x0 + 22 + i * 30} y={y + 6} width={8} height={h * 0.92} fill="#ffffff" />)}
        </g>
      )}
      {/* левая */}
      <path d={`M${x0 - 14} ${y} L${x0 + cw} ${y} Q${x0 + cw * 0.5} ${ty - 40} ${x0 + cw * 0.3} ${ty} Q${x0 + cw * 0.7} ${ty + 80} ${x0 + cw * 0.6} ${y + h} L${x0 - 14} ${y + h} Z`} fill={color} />
      <path d={`M${x0 + cw * 0.3} ${y} Q${x0 + cw * 0.25} ${ty - 60} ${x0 + cw * 0.12} ${ty} L${x0 + cw * 0.1} ${y + h} L${x0 + cw * 0.02} ${y + h} L${x0 + cw * 0.04} ${ty} Q${x0 + cw * 0.12} ${ty - 60} ${x0 + cw * 0.18} ${y} Z`} fill={fold} />
      <rect x={x0 - 4} y={ty - 10} width={cw * 0.42} height={18} rx={9} fill={tb} />
      {/* правая */}
      <path d={`M${x1 + 14} ${y} L${x1 - cw} ${y} Q${x1 - cw * 0.5} ${ty - 40} ${x1 - cw * 0.3} ${ty} Q${x1 - cw * 0.7} ${ty + 80} ${x1 - cw * 0.6} ${y + h} L${x1 + 14} ${y + h} Z`} fill={color} />
      <path d={`M${x1 - cw * 0.3} ${y} Q${x1 - cw * 0.25} ${ty - 60} ${x1 - cw * 0.12} ${ty} L${x1 - cw * 0.1} ${y + h} L${x1 - cw * 0.02} ${y + h} L${x1 - cw * 0.04} ${ty} Q${x1 - cw * 0.12} ${ty - 60} ${x1 - cw * 0.18} ${y} Z`} fill={fold} />
      <rect x={x1 + 4 - cw * 0.42} y={ty - 10} width={cw * 0.42} height={18} rx={9} fill={tb} />
      {/* карниз */}
      <rect x={x0 - 30} y={y - 12} width={x1 - x0 + 60} height={12} rx={6} fill={rod} />
      <circle cx={x0 - 30} cy={y - 6} r={11} fill={rod} />
      <circle cx={x1 + 30} cy={y - 6} r={11} fill={rod} />
    </g>
  );
};

/** Чугунная батарея-гармошка. */
export const Radiator = ({ x, y, w = 200, h = 110, color = "#e9e4d8" }: { x: number; y: number; w?: number; h?: number; color?: string }) => {
  const n = Math.floor(w / 22);
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={h} rx={8} fill="#00000018" />
      {Array.from({ length: n }).map((_, i) => <rect key={i} x={x + i * (w / n)} y={y} width={w / n - 4} height={h} rx={8} fill={i % 2 ? color : dark(color, 0.05)} />)}
      <rect x={x - 4} y={y + 14} width={w + 4} height={8} fill={dark(color, 0.12)} />
      <rect x={x - 4} y={y + h - 22} width={w + 4} height={8} fill={dark(color, 0.12)} />
      <rect x={x + w - 4} y={y + h - 30} width={30} height={10} fill={dark(color, 0.15)} />
    </g>
  );
};

/** Настенные часы. */
export const WallClock = ({ x, y, r = 44, frame = WOOD, face = "#f6f1e6", t = 0.35 }: { x: number; y: number; r?: number; frame?: string; face?: string; t?: number }) => (
  <g>
    <circle cx={x + 5} cy={y + 6} r={r} fill="#00000020" />
    <circle cx={x} cy={y} r={r} fill={frame} />
    <circle cx={x} cy={y} r={r * 0.78} fill={face} />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={x - 2} y={y - r * 0.72} width={4} height={i % 3 ? r * 0.08 : r * 0.14} fill="#4a4038" transform={`rotate(${i * 30} ${x} ${y})`} />
    ))}
    <rect x={x - 3} y={y - r * 0.5} width={6} height={r * 0.54} rx={3} fill="#2b2b2b" transform={`rotate(${t * 360} ${x} ${y})`} />
    <rect x={x - 2} y={y - r * 0.66} width={4} height={r * 0.7} rx={2} fill="#2b2b2b" transform={`rotate(${t * 4320} ${x} ${y})`} />
    <circle cx={x} cy={y} r={4} fill="#c8553d" />
  </g>
);

/** Отрывной календарь. */
export const Calendar = ({ x, y, accent = "#c8553d", day = "21" }: { x: number; y: number; accent?: string; day?: string }) => (
  <g>
    <rect x={x + 4} y={y + 5} width={84} height={110} rx={5} fill="#00000020" />
    <rect x={x} y={y} width={84} height={110} rx={5} fill="#f8f4ea" />
    <rect x={x} y={y} width={84} height={28} rx={5} fill={accent} />
    <rect x={x} y={y + 20} width={84} height={8} fill={accent} />
    <text x={x + 42} y={y + 84} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#3a3330">{day}</text>
    <rect x={x + 16} y={y + 94} width={52} height={5} rx={2} fill="#c9c1b2" />
    <circle cx={x + 42} cy={y - 6} r={5} fill="#5a5048" />
  </g>
);

/** Фото в рамке: портрет (голова и плечи) или пейзаж. */
export const PhotoFrame = ({ x, y, w = 90, h = 110, frame = WOOD, kind = "portrait", tone = "#d9c9a8", oval = false }: { x: number; y: number; w?: number; h?: number; frame?: string; kind?: "portrait" | "landscape" | "couple"; tone?: string; oval?: boolean }) => {
  const id = useUid("pf");
  const ix = x + 10;
  const iy = y + 10;
  const iw = w - 20;
  const ih = h - 20;
  return (
    <g>
      <rect x={x + 5} y={y + 6} width={w} height={h} rx={oval ? w / 2 : 5} fill="#00000022" />
      {oval ? <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill={frame} /> : <rect x={x} y={y} width={w} height={h} rx={5} fill={frame} />}
      <defs>
        <clipPath id={id}>{oval ? <ellipse cx={x + w / 2} cy={y + h / 2} rx={iw / 2} ry={ih / 2} /> : <rect x={ix} y={iy} width={iw} height={ih} />}</clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={ix} y={iy} width={iw} height={ih} fill={tone} />
        {kind === "landscape" ? (
          <>
            <rect x={ix} y={iy + ih * 0.62} width={iw} height={ih} fill="#7e9a62" />
            <path d={`M${ix} ${iy + ih * 0.65} L${ix + iw * 0.35} ${iy + ih * 0.3} L${ix + iw * 0.6} ${iy + ih * 0.6} L${ix + iw * 0.8} ${iy + ih * 0.42} L${ix + iw} ${iy + ih * 0.62} Z`} fill="#6a7f8f" />
            <circle cx={ix + iw * 0.78} cy={iy + ih * 0.2} r={iw * 0.08} fill="#f5e6a8" />
          </>
        ) : kind === "couple" ? (
          <>
            {[0.34, 0.66].map((t, i) => (
              <g key={t}>
                <circle cx={ix + iw * t} cy={iy + ih * 0.4} r={iw * 0.13} fill="#e8c8a8" />
                <path d={`M${ix + iw * t - iw * 0.13} ${iy + ih * 0.32} Q${ix + iw * t} ${iy + ih * 0.16} ${ix + iw * t + iw * 0.13} ${iy + ih * 0.32} Z`} fill={i ? "#8a5a3a" : "#4a3a30"} />
                <rect x={ix + iw * t - iw * 0.2} y={iy + ih * 0.56} width={iw * 0.4} height={ih * 0.5} rx={iw * 0.12} fill={i ? "#c8553d" : "#4a5a6a"} />
              </g>
            ))}
          </>
        ) : (
          <>
            <circle cx={ix + iw / 2} cy={iy + ih * 0.42} r={iw * 0.2} fill="#e8c8a8" />
            <path d={`M${ix + iw * 0.3} ${iy + ih * 0.36} Q${ix + iw / 2} ${iy + ih * 0.12} ${ix + iw * 0.7} ${iy + ih * 0.36} Z`} fill="#6a6a6a" />
            <rect x={ix + iw * 0.18} y={iy + ih * 0.66} width={iw * 0.64} height={ih * 0.5} rx={iw * 0.2} fill="#5a6070" />
          </>
        )}
      </g>
    </g>
  );
};

/** Ряд книжных корешков на линии base. */
export const Books = ({ x, base, n = 8, colors = ["#7a2e2e", "#4a6fa5", "#5b8c5a", "#c9a24a", "#8a5a3a", "#3a3a4a"], seed = 0, s = 1 }: { x: number; base: number; n?: number; colors?: string[]; seed?: number; s?: number }) => {
  let cx = x;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const k = i + seed;
        const bw = (16 + ((k * 7) % 3) * 5) * s;
        const bh = (58 + ((k * 13) % 4) * 9) * s;
        const c = colors[k % colors.length];
        const lean = k % 7 === 3;
        const el = (
          <g key={i} transform={lean ? `rotate(14 ${cx + bw} ${base})` : undefined}>
            <rect x={cx} y={base - bh} width={bw} height={bh} rx={2} fill={c} />
            <rect x={cx} y={base - bh + 10 * s} width={bw} height={4 * s} fill={light(c, 0.35)} />
            <rect x={cx} y={base - 16 * s} width={bw} height={4 * s} fill={light(c, 0.35)} />
          </g>
        );
        cx += bw + 2 * s + (lean ? 10 * s : 0);
        return el;
      })}
    </g>
  );
};

/** Цветок в горшке (маленький, на подоконник/полку). */
export const PotPlant = ({ x, y, s = 1, pot = "#c8553d", leaf = "#5b8c5a", flower }: { x: number; y: number; s?: number; pot?: string; leaf?: string; flower?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-40, -15, 15, 40].map((a, i) => <ellipse key={a} cx={0} cy={-46} rx={12} ry={34} fill={i % 2 ? leaf : dark(leaf, 0.12)} transform={`rotate(${a} 0 -14)`} />)}
    {flower && [-22, 0, 22].map((dx, i) => <circle key={dx} cx={dx} cy={-74 - (i % 2) * 10} r={9} fill={flower} />)}
    <path d="M-26 -22 L26 -22 L20 0 L-20 0 Z" fill={pot} />
    <rect x={-29} y={-27} width={58} height={9} rx={3} fill={dark(pot, 0.12)} />
  </g>
);

/** Ковёр на стену с орнаментом (советская классика). */
export const WallCarpet = ({ x, y, w, h, base, border, figure, light: lt }: { x: number; y: number; w: number; h: number; base: string; border: string; figure: string; light: string }) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect x={x + 8} y={y + 10} width={w} height={h} rx={4} fill="#00000026" />
      <rect x={x} y={y} width={w} height={h} rx={4} fill={border} />
      <rect x={x + 26} y={y + 26} width={w - 52} height={h - 52} fill={base} />
      {/* зубчатая кайма */}
      {Array.from({ length: Math.floor((w - 52) / 26) }).map((_, i) => (
        <g key={i} fill={figure}>
          <path d={`M${x + 26 + i * 26} ${y + 26} l13 14 l13 -14 Z`} />
          <path d={`M${x + 26 + i * 26} ${y + h - 26} l13 -14 l13 14 Z`} />
        </g>
      ))}
      {Array.from({ length: Math.floor(h / 40) }).map((_, i) => (
        <g key={i} fill={lt}>
          <rect x={x + 9} y={y + 20 + i * 40} width={8} height={8} transform={`rotate(45 ${x + 13} ${y + 24 + i * 40})`} />
          <rect x={x + w - 17} y={y + 20 + i * 40} width={8} height={8} transform={`rotate(45 ${x + w - 13} ${y + 24 + i * 40})`} />
        </g>
      ))}
      {/* медальон */}
      <path d={`M${cx} ${cy - h * 0.3} L${cx + w * 0.3} ${cy} L${cx} ${cy + h * 0.3} L${cx - w * 0.3} ${cy} Z`} fill={figure} />
      <path d={`M${cx} ${cy - h * 0.2} L${cx + w * 0.2} ${cy} L${cx} ${cy + h * 0.2} L${cx - w * 0.2} ${cy} Z`} fill={lt} />
      <path d={`M${cx} ${cy - h * 0.1} L${cx + w * 0.1} ${cy} L${cx} ${cy + h * 0.1} L${cx - w * 0.1} ${cy} Z`} fill={base} />
      {/* угловые розетки */}
      {[[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]].map(([a, b], i) => (
        <g key={i}>
          <circle cx={x + w * a} cy={y + h * b} r={Math.min(w, h) * 0.07} fill={figure} />
          <circle cx={x + w * a} cy={y + h * b} r={Math.min(w, h) * 0.035} fill={lt} />
        </g>
      ))}
    </g>
  );
};

/** Люстра-тарелка или рожковая люстра со свечением. */
export const CeilingLamp = ({ x, y = 80, len = 70, kind = "dish", color = "#f2e6c8", glow = "#fff1c4", r = 300, o = 0.32 }: { x: number; y?: number; len?: number; kind?: "dish" | "arms" | "bulb" | "tube"; color?: string; glow?: string; r?: number; o?: number }) => {
  const by = y + len;
  return (
    <g>
      <Glow cx={x} cy={by + 40} r={r} color={glow} opacity={o} />
      {kind !== "tube" && <rect x={x - 3} y={y} width={6} height={len} fill="#3a2a20" />}
      {kind === "dish" && (
        <>
          <ellipse cx={x} cy={y + 4} rx={22} ry={8} fill={dark(color, 0.2)} />
          <path d={`M${x - 90} ${by + 10} Q${x} ${by + 60} ${x + 90} ${by + 10} Z`} fill={color} />
          <ellipse cx={x} cy={by + 10} rx={90} ry={14} fill={light(color, 0.3)} />
          <ellipse cx={x} cy={by + 34} rx={40} ry={8} fill="#ffffff" opacity={0.6} />
        </>
      )}
      {kind === "arms" && (
        <>
          <path d={`M${x - 110} ${by} Q${x} ${by + 50} ${x + 110} ${by}`} stroke="#b08a4a" strokeWidth={8} fill="none" />
          <circle cx={x} cy={by + 20} r={16} fill="#b08a4a" />
          {[-110, 0, 110].map((dx) => (
            <g key={dx}>
              <path d={`M${x + dx - 34} ${by + (dx ? 40 : 66)} L${x + dx - 20} ${by + (dx ? -6 : 22)} L${x + dx + 20} ${by + (dx ? -6 : 22)} L${x + dx + 34} ${by + (dx ? 40 : 66)} Z`} fill={color} />
              <ellipse cx={x + dx} cy={by + (dx ? 40 : 66)} rx={34} ry={7} fill="#fff6d8" />
            </g>
          ))}
        </>
      )}
      {kind === "bulb" && (
        <>
          <rect x={x - 10} y={by - 4} width={20} height={20} fill="#5a5a5a" />
          <circle cx={x} cy={by + 30} r={20} fill="#fff4c8" />
          <circle cx={x} cy={by + 30} r={34} fill="#fff4c8" opacity={0.3} />
        </>
      )}
      {kind === "tube" && (
        <>
          <rect x={x - 170} y={y} width={340} height={26} rx={8} fill={dark(color, 0.25)} />
          <rect x={x - 160} y={y + 20} width={320} height={16} rx={8} fill="#fbfbf4" />
        </>
      )}
    </g>
  );
};

/* ===================================== сцены гостиной ===================================== */

/** Обои: мягкие вертикальные полосы с мелким цветочным узором. */
const Wallpaper = ({ wall, step = 90, y0 = 0, y1 = FLOOR_Y }: { wall: string; step?: number; y0?: number; y1?: number }) => {
  const motif = light(wall, 0.16);
  const stem = dark(wall, 0.07);
  return (
    <g>
      {Array.from({ length: Math.ceil(W / step) + 1 }).map((_, i) => (
        <rect key={i} x={i * step} y={y0} width={step * 0.42} height={y1 - y0} fill={dark(wall, 0.045)} />
      ))}
      {Array.from({ length: Math.ceil(W / step) + 1 }).flatMap((_, i) =>
        Array.from({ length: 8 }).map((__, j) => {
          const cx = i * step + step * 0.71;
          const cy = 470 + j * 110 + (i % 2) * 55;
          if (cy > y1 - 30 || cy < y0 + 20) return null;
          return (
            <g key={`${i}-${j}`}>
              <rect x={cx - 1.5} y={cy + 6} width={3} height={22} fill={stem} />
              {[0, 90, 180, 270].map((a) => <circle key={a} cx={cx + 7 * Math.cos((a * Math.PI) / 180)} cy={cy + 7 * Math.sin((a * Math.PI) / 180)} r={5} fill={motif} />)}
              <circle cx={cx} cy={cy} r={3} fill={dark(wall, 0.12)} />
            </g>
          );
        }),
      )}
    </g>
  );
};

/** Панели-обшивка низа стены: рейки и филёнки. */
const Wainscot = ({ y, color, x0 = 0, x1 = W, skip = [] as [number, number][] }: { y: number; color: string; x0?: number; x1?: number; skip?: [number, number][] }) => {
  const n = Math.round((x1 - x0) / 150);
  const pw = (x1 - x0) / n;
  return (
    <g>
      <rect x={x0} y={y} width={x1 - x0} height={FLOOR_Y - y} fill={color} />
      <rect x={x0} y={y - 8} width={x1 - x0} height={16} fill={dark(color, 0.18)} />
      <rect x={x0} y={y - 8} width={x1 - x0} height={5} fill={light(color, 0.2)} />
      {Array.from({ length: n }).map((_, i) => {
        const px = x0 + i * pw + 22;
        if (skip.some(([a, b]) => px + pw - 44 > a && px < b)) return null;
        return (
          <g key={i}>
            <rect x={px} y={y + 34} width={pw - 44} height={FLOOR_Y - y - 90} rx={4} fill={dark(color, 0.1)} />
            <rect x={px + 4} y={y + 38} width={pw - 52} height={FLOOR_Y - y - 98} rx={3} fill={color} />
          </g>
        );
      })}
    </g>
  );
};

const TvStand = ({ x, accent }: { x: number; accent: string }) => (
  <g>
    <FloorShadow cx={x + 85} w={190} />
    <rect x={x} y={FLOOR_Y - 170} width={170} height={150} rx={8} fill={WOOD} />
    <rect x={x + 14} y={FLOOR_Y - 150} width={142} height={56} rx={5} fill={dark(WOOD, 0.12)} />
    <rect x={x + 14} y={FLOOR_Y - 86} width={68} height={56} rx={5} fill={dark(WOOD, 0.08)} />
    <rect x={x + 88} y={FLOOR_Y - 86} width={68} height={56} rx={5} fill={dark(WOOD, 0.08)} />
    <circle cx={x + 85} cy={FLOOR_Y - 122} r={6} fill="#e0b030" />
    {/* пластинки/журналы в нише */}
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={x + 22 + i * 12} y={FLOOR_Y - 146} width={9} height={50} fill={["#c8553d", "#4a6fa5", "#e0b030", "#3a3a3a", "#5b8c5a"][i]} />)}
    <rect x={x + 10} y={FLOOR_Y - 20} width={16} height={20} fill="#4a3020" />
    <rect x={x + 144} y={FLOOR_Y - 20} width={16} height={20} fill="#4a3020" />
    {/* пузатый телевизор с «рожками», кружевная салфетка и слоник */}
    <Glow cx={x + 72} cy={FLOOR_Y - 238} r={150} color="#9fd0ff" opacity={0.22} />
    <line x1={x + 85} y1={FLOOR_Y - 300} x2={x + 40} y2={FLOOR_Y - 370} stroke="#3a2a20" strokeWidth={5} strokeLinecap="round" />
    <line x1={x + 85} y1={FLOOR_Y - 300} x2={x + 132} y2={FLOOR_Y - 362} stroke="#3a2a20" strokeWidth={5} strokeLinecap="round" />
    <circle cx={x + 40} cy={FLOOR_Y - 370} r={5} fill="#3a2a20" />
    <circle cx={x + 132} cy={FLOOR_Y - 362} r={5} fill="#3a2a20" />
    <rect x={x + 6} y={FLOOR_Y - 304} width={158} height={134} rx={22} fill="#5a4a40" />
    <rect x={x + 22} y={FLOOR_Y - 288} width={100} height={100} rx={16} fill="#5f8fb8" />
    <rect x={x + 22} y={FLOOR_Y - 230} width={100} height={42} fill="#4a7a5a" />
    <circle cx={x + 72} cy={FLOOR_Y - 244} r={14} fill="#f2e6d0" />
    <rect x={x + 34} y={FLOOR_Y - 278} width={26} height={12} rx={6} fill="#ffffff60" />
    <circle cx={x + 143} cy={FLOOR_Y - 270} r={8} fill="#c9b8a0" />
    <circle cx={x + 143} cy={FLOOR_Y - 242} r={8} fill="#c9b8a0" />
    <rect x={x + 134} y={FLOOR_Y - 216} width={18} height={30} rx={3} fill="#3a2e28" />
    <path d={`M${x + 20} ${FLOOR_Y - 304} h130 l-8 18 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 Z`} fill="#f8f4ea" />
    <g transform={`translate(${x + 128} ${FLOOR_Y - 304})`}>
      <ellipse cx={0} cy={-18} rx={20} ry={14} fill="#d8d0c4" />
      <circle cx={-20} cy={-26} r={10} fill="#d8d0c4" />
      <rect x={-30} y={-24} width={6} height={20} rx={3} fill="#d8d0c4" />
      <rect x={-12} y={-8} width={6} height={8} fill="#c8c0b4" />
      <rect x={8} y={-8} width={6} height={8} fill="#c8c0b4" />
    </g>
    <rect x={x + 160} y={FLOOR_Y - 60} width={6} height={40} fill="#2b2b2b" />
    <path d={`M${x + 163} ${FLOOR_Y - 22} q20 18 40 4`} stroke="#2b2b2b" strokeWidth={5} fill="none" />
  </g>
);

/** Торшер у стены. */
const FloorLamp = ({ x, color }: { x: number; color: string }) => (
  <g>
    <Glow cx={x} cy={790} r={170} color="#ffe9b0" opacity={0.3} />
    <FloorShadow cx={x} w={70} o={0.2} h={8} />
    <ellipse cx={x} cy={FLOOR_Y - 6} rx={34} ry={9} fill="#3a2a20" />
    <rect x={x - 4} y={800} width={8} height={FLOOR_Y - 806} fill="#3a2a20" />
    <path d={`M${x - 54} 810 L${x - 34} 726 L${x + 34} 726 L${x + 54} 810 Z`} fill={color} />
    <rect x={x - 54} y={804} width={108} height={10} fill={dark(color, 0.18)} />
    {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={x - 50 + i * 12} y={814} width={3} height={14} fill={dark(color, 0.18)} />)}
  </g>
);

/* ---------- базовая гостиная ----------
 * Метки (content/locations/gostinaya.json): door 0.11 (z1), sofa-1 0.31 / sofa 0.41 / sofa-2 0.51 (диван, z1),
 * tv 0.72 (z1), window 0.9 (z1), armchair 0.86 (кресло, z0.5).
 */
const Living = ({ palette: p }: { palette: Palette }) => {
  const curtain = dark(p.accent, 0.15);
  return (
    <>
      <Room wall={p.wall} floor={p.floor} />
      <Wallpaper wall={p.wall} />
      <VShade y={0} h={640} from={0.16} to={0} />
      <Ceiling color={light(p.wall, 0.3)} h={70} />
      <FloorBoards color={p.floor} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.28} />
      <Skirting color={dark(p.wall, 0.32)} />
      <CeilingLamp x={460} y={87} len={50} kind="arms" color={light(p.accent, 0.55)} r={340} o={0.28} />
      {/* дверь с наличником, выключатель, часы над дверью */}
      <rect x={8} y={FLOOR_Y - 540} width={222} height={540} rx={6} fill={light(p.wall, 0.3)} />
      <Door x={24} w={190} color={dark(WOOD, 0.05)} />
      <Switch x={248} y={850} />
      <WallClock x={119} y={588} r={40} frame={dark(WOOD, 0.1)} t={0.42} />
      {/* ковёр на стене над диваном */}
      <WallCarpet x={276} y={560} w={350} h={420} base={dark(p.accent, 0.42)} border={dark(p.accent, 0.2)} figure={mix(p.accent, "#e0a030", 0.45)} light={light(p.accent, 0.45)} />
      <FloorShadow cx={443} w={420} />
      <SofaAt x0={0.26} x1={0.56} color={p.accent} />
      {/* подушки и вязаный плед */}
      <rect x={300} y={seatTopY(1) - 150} width={70} height={64} rx={18} fill="#e0b030" transform={`rotate(-12 335 ${seatTopY(1) - 118})`} />
      <rect x={540} y={seatTopY(1) - 146} width={62} height={58} rx={18} fill={light(p.accent, 0.4)} transform={`rotate(10 571 ${seatTopY(1) - 117})`} />
      <path d={`M470 ${seatTopY(1) - 168} h96 v70 l-12 10 l-12 -10 l-12 10 l-12 -10 l-12 10 l-12 -10 l-12 10 l-12 -10 Z`} fill="#e9dcc0" />
      {[0, 1, 2].map((i) => <rect key={i} x={470} y={seatTopY(1) - 160 + i * 22} width={96} height={6} fill="#c9a24a" opacity={0.7} />)}
      {/* полка над телевизором: книги, фото, вазочка */}
      <rect x={680} y={700} width={170} height={14} rx={4} fill={WOOD} />
      <rect x={680} y={714} width={170} height={6} fill="#00000020" />
      <Books x={690} base={700} n={4} s={0.9} />
      <PhotoFrame x={772} y={612} w={62} h={86} frame="#c9a24a" kind="couple" />
      <FloorLamp x={662} color={light(p.accent, 0.5)} />
      <TvStand x={692} accent={p.accent} />
      {/* окно со двором, шторы на подхватах, батарея, цветы на подоконнике */}
      <WindowView x={874} y={446} w={196} h={330} />
      <PotPlant x={912} y={772} s={0.62} flower="#c8553d" />
      <PotPlant x={1022} y={772} s={0.5} pot="#e0b030" leaf="#4f7f4a" />
      <Curtains x0={862} x1={1080} y={436} h={420} color={curtain} tie={light(p.accent, 0.4)} />
      <Radiator x={892} y={870} w={168} h={104} />
      {/* ковёр на полу */}
      <FloorRug x0={300} x1={780} y0={1204} y1={1320} color={dark(p.accent, 0.12)} border={dark(p.accent, 0.38)} inner={mix(p.accent, "#e0a030", 0.3)} />
      {/* кресло на среднем плане справа, с салфеткой на спинке */}
      <FloorShadow cx={0.86 * W} y={feetY(0.5)} w={230} o={0.22} />
      <SeatAt x={0.86} z={0.5} kind="armchair" color={mix(p.accent, "#7a5a8a", 0.4)} />
      <path d={`M${0.86 * W - 46} ${seatTopY(0.5) - 160} h92 v40 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 l-12 10 Z`} fill="#f8f4ea" opacity={0.92} />
    </>
  );
};

/* ---------- прихожая с входной дверью ---------- */
const Hallway = ({ palette: p }: { palette: Palette }) => {
  const dx = 590;
  const dy = FLOOR_Y - 580;
  const door = dark(p.accent, 0.4);
  return (
    <>
      <Room wall={p.wall} floor={p.floor} />
      <Wallpaper wall={p.wall} step={120} y1={900} />
      <VShade y={0} h={640} from={0.2} to={0} />
      <Ceiling color={light(p.wall, 0.28)} h={70} />
      <FloorTiles a={p.floor} b={light(p.floor, 0.06)} step={96} d={0.085} grout={dark(p.floor, 0.12)} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.3} />
      <Wainscot y={900} color={dark(p.wall, 0.14)} skip={[[dx - 30, dx + 290]]} />
      <Skirting color={dark(p.wall, 0.36)} />
      <CeilingLamp x={300} y={87} len={30} kind="dish" color="#f6efe0" r={300} o={0.3} />
      {/* обитая дерматином входная дверь: наличник, звонок, цепочка, номер */}
      <rect x={dx - 26} y={dy - 26} width={312} height={606} rx={10} fill={light(p.wall, 0.35)} />
      <rect x={dx - 12} y={dy - 12} width={284} height={592} rx={8} fill={dark(p.wall, 0.08)} />
      <rect x={dx} y={dy} width={260} height={580} rx={8} fill={door} />
      <rect x={dx + 12} y={dy + 12} width={236} height={556} rx={20} fill={light(door, 0.05)} />
      {Array.from({ length: 5 }).flatMap((_, r) =>
        Array.from({ length: 3 }).map((__, c) => <circle key={`${r}-${c}`} cx={dx + 60 + c * 70} cy={dy + 70 + r * 105} r={7} fill={light(door, 0.25)} />),
      )}
      {Array.from({ length: 4 }).flatMap((_, r) =>
        Array.from({ length: 2 }).map((__, c) => <path key={`l${r}-${c}`} d={`M${dx + 60 + c * 70} ${dy + 70 + r * 105} L${dx + 130 + c * 70} ${dy + 175 + r * 105} M${dx + 130 + c * 70} ${dy + 70 + r * 105} L${dx + 60 + c * 70} ${dy + 175 + r * 105}`} stroke={dark(door, 0.12)} strokeWidth={3} />),
      )}
      <circle cx={dx + 130} cy={dy + 150} r={9} fill="#e0b030" />
      <rect x={dx + 104} y={dy + 40} width={52} height={30} rx={4} fill="#e0b030" />
      <text x={dx + 130} y={dy + 63} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={22} fill={dark(door, 0.1)}>48</text>
      <rect x={dx + 214} y={dy + 290} width={30} height={14} rx={7} fill="#e0b030" />
      <rect x={dx + 222} y={dy + 330} width={14} height={30} rx={5} fill="#c9b070" />
      <rect x={dx + 214} y={dy + 220} width={24} height={14} rx={4} fill="#c9b070" />
      <path d={`M${dx + 226} ${dy + 232} q-30 40 -6 70`} stroke="#c9b070" strokeWidth={4} fill="none" strokeDasharray="6 4" />
      <rect x={dx + 10} y={FLOOR_Y} width={240} height={26} rx={6} fill={dark(p.floor, 0.25)} />
      <FloorRug x0={dx + 10} x1={dx + 250} y0={1196} y1={1236} color="#7a6a50" border="#5a4a38" fringe="#5a4a38" />
      {/* счётчик над дверью, календарь */}
      <rect x={470} y={472} width={96} height={96} rx={6} fill="#d8d4c8" />
      <rect x={484} y={486} width={68} height={40} rx={4} fill="#2b3036" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={490 + i * 15} y={496} width={10} height={20} fill={i === 3 ? "#c8553d" : "#f2efe6"} />)}
      <circle cx={518} cy={546} r={10} fill="#8a8a8a" />
      <path d={`M518 568 L518 ${dy - 26}`} stroke="#5a5048" strokeWidth={5} />
      <Calendar x={900} y={540} accent={p.accent} />
      {/* вешалка: пальто, шарф, шляпа и кепка */}
      <rect x={150} y={640} width={16} height={FLOOR_Y - 640} fill={dark(WOOD, 0.2)} />
      <FloorShadow cx={158} w={150} o={0.2} />
      <ellipse cx={158} cy={FLOOR_Y - 8} rx={70} ry={14} fill={dark(WOOD, 0.3)} />
      <circle cx={158} cy={640} r={16} fill={dark(WOOD, 0.2)} />
      <path d="M118 680 Q158 650 198 680" stroke={dark(WOOD, 0.2)} strokeWidth={12} fill="none" strokeLinecap="round" />
      <rect x={96} y={680} width={86} height={300} rx={36} fill="#4a6a8a" />
      <rect x={100} y={690} width={20} height={140} rx={10} fill={dark("#4a6a8a", 0.15)} />
      {[760, 820, 880].map((y) => <circle key={y} cx={170} cy={y} r={5} fill={dark("#4a6a8a", 0.3)} />)}
      <rect x={160} y={688} width={66} height={230} rx={30} fill="#8a6a4a" />
      <rect x={196} y={690} width={14} height={180} fill={p.accent} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={196} y={700 + i * 40} width={14} height={14} fill={light(p.accent, 0.5)} />)}
      <path d="M118 628 Q158 560 198 628 Z" fill="#3a3a3a" />
      <ellipse cx={158} cy={630} rx={58} ry={12} fill="#3a3a3a" />
      <rect x={120} y={612} width={76} height={8} fill="#c8553d" />
      {/* телефон на полочке */}
      <rect x={236} y={770} width={100} height={12} rx={4} fill={WOOD} />
      <path d="M246 770 L256 728 L316 728 L326 770 Z" fill="#c8553d" />
      <circle cx={286} cy={748} r={16} fill="#f2e6d0" />
      <circle cx={286} cy={748} r={6} fill="#c8553d" />
      <rect x={244} y={712} width={84} height={18} rx={9} fill={dark("#c8553d", 0.15)} />
      <path d="M326 760 q30 40 6 80 q-20 30 10 60" stroke="#2b2b2b" strokeWidth={4} fill="none" />
      {/* банкетка для обуви — сиденье (метка bench 0.37, z1); обувь под ней */}
      <FloorShadow cx={0.37 * W} w={270} o={0.2} />
      <BenchAt x0={0.26} x1={0.48} color={WOOD} metal={dark(WOOD, 0.25)} back={false} />
      <ellipse cx={320} cy={FLOOR_Y - 8} rx={26} ry={9} fill="#2b2b2b" />
      <ellipse cx={372} cy={FLOOR_Y - 8} rx={26} ry={9} fill="#2b2b2b" />
      <ellipse cx={440} cy={FLOOR_Y - 8} rx={28} ry={9} fill="#c8553d" />
      <ellipse cx={478} cy={FLOOR_Y + 6} rx={28} ry={10} fill="#c8553d" />
      {/* зонт-трость и рожок */}
      <path d={`M960 ${FLOOR_Y} L940 ${FLOOR_Y - 300}`} stroke="#2b2b2b" strokeWidth={8} strokeLinecap="round" />
      <path d={`M900 ${FLOOR_Y - 300} Q940 ${FLOOR_Y - 380} 980 ${FLOOR_Y - 300} Z`} fill="#4a6a8a" />
      <rect x={936} y={FLOOR_Y - 300} width={10} height={200} rx={4} fill="#4a6a8a" />
      <path d={`M1010 ${FLOOR_Y - 8} L1000 ${FLOOR_Y - 250} q-2 -24 18 -24`} stroke="#c8553d" strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* зеркало в раме и ключница */}
      <ellipse cx={420} cy={690} rx={74} ry={94} fill={dark(WOOD, 0.1)} />
      <ellipse cx={420} cy={690} rx={60} ry={80} fill="#cfe6f5" />
      <path d="M380 640 l40 -30 l12 10 l-44 36 Z" fill="#ffffff90" />
      <rect x={952} y={720} width={90} height={18} rx={6} fill={WOOD} />
      {[975, 1012].map((x, i) => (
        <g key={x}>
          <rect x={x - 2} y={738} width={4} height={14} fill="#8a8a8a" />
          <circle cx={x} cy={758} r={9} fill={i ? "#c9b070" : "#e0b030"} />
          <rect x={x - 3} y={764} width={6} height={22} rx={2} fill={i ? "#c9b070" : "#e0b030"} />
        </g>
      ))}
    </>
  );
};

/* ---------- балкон, ночной город ---------- */
const STARS = [[120, 470], [300, 520], [520, 450], [660, 560], [980, 470], [420, 620], [200, 660], [900, 640], [760, 470], [60, 590], [610, 470], [350, 590], [880, 520], [180, 540]];
const Balcony = ({ palette: p }: { palette: Palette }) => {
  const sky = "#2b3a55";
  const back = Array.from({ length: 12 }).map((_, i) => ({ x: i * 95 - 20, w: 90, h: 180 + ((i * 53) % 140) }));
  const front = Array.from({ length: 9 }).map((_, i) => ({ x: i * 130 - 40, w: 120, h: 120 + ((i * 71) % 130) }));
  const rail = "#4a3a34";
  const sheet = "#5a6a62";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={sky} />
      <VShade y={0} h={1060} color="#141c30" from={0.7} to={0} />
      <VShade y={700} h={360} color="#e0a030" from={0} to={0.2} />
      {STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 5 : 3} fill="#f5e6a8" opacity={0.8} />)}
      <Glow cx={830} cy={540} r={150} color="#f5e6a8" opacity={0.25} />
      <circle cx={830} cy={540} r={58} fill="#f5e6a8" />
      <circle cx={852} cy={524} r={52} fill={mix(sky, "#141c30", 0.3)} />
      {/* телебашня с огоньком */}
      <path d="M296 1000 L312 640 L320 640 L336 1000 Z" fill={mix(sky, "#000000", 0.3)} />
      <rect x={298} y={720} width={36} height={20} rx={4} fill={mix(sky, "#000000", 0.3)} />
      <rect x={314} y={560} width={4} height={84} fill={mix(sky, "#000000", 0.3)} />
      <circle cx={316} cy={560} r={6} fill="#ff5a4a" />
      <Glow cx={316} cy={560} r={30} color="#ff5a4a" opacity={0.6} />
      {back.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={1000 - b.h} width={b.w} height={b.h + 40} fill={mix(sky, "#000000", 0.2)} />
          {i % 4 === 1 && <rect x={b.x + 30} y={1000 - b.h - 30} width={4} height={30} fill={mix(sky, "#000000", 0.2)} />}
          {Array.from({ length: Math.floor(b.h / 50) }).map((_, j) =>
            (i + j) % 3 === 0 ? <rect key={j} x={b.x + 22 + (j % 2) * 32} y={1000 - b.h + 24 + j * 50} width={16} height={20} fill="#f5d77a" opacity={0.75} /> : null,
          )}
        </g>
      ))}
      {front.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={1060 - b.h} width={b.w} height={b.h + 40} fill={mix(sky, "#000000", 0.42)} />
          {i % 3 === 2 && (
            <>
              <rect x={b.x + 20} y={1060 - b.h - 40} width={44} height={40} rx={4} fill={mix(sky, "#000000", 0.42)} />
              <path d={`M${b.x + 80} ${1060 - b.h} l0 -50 m-14 10 h28 m-24 12 h20`} stroke={mix(sky, "#000000", 0.42)} strokeWidth={4} />
            </>
          )}
          {Array.from({ length: Math.floor(b.h / 46) }).map((_, j) =>
            (i * 2 + j) % 3 !== 1 ? <rect key={j} x={b.x + 20 + (j % 2) * 50} y={1060 - b.h + 20 + j * 46} width={22} height={24} fill={(i + j) % 4 ? "#f5c85a" : "#9fd0ff"} /> : null,
          )}
        </g>
      ))}
      {/* потолок балкона — плита соседей сверху, лампочка на проводе */}
      <rect x={0} y={0} width={W} height={96} fill={dark(p.wall, 0.55)} />
      <rect x={0} y={96} width={W} height={14} fill={dark(p.wall, 0.65)} />
      <path d="M640 110 q10 40 0 80" stroke="#1e1a18" strokeWidth={4} fill="none" />
      <Glow cx={640} cy={214} r={260} color="#ffd98a" opacity={0.3} />
      <circle cx={640} cy={210} r={18} fill="#fff1b8" />
      <rect x={631} y={186} width={18} height={14} fill="#4a4a4a" />
      {/* стена дома и балконная дверь с занавеской */}
      <rect x={0} y={0} width={120} height={FLOOR_Y} fill={dark(p.wall, 0.25)} />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={0} y={140 + i * 90} width={120} height={4} fill={dark(p.wall, 0.32)} />)}
      <rect x={0} y={560} width={96} height={FLOOR_Y - 560} fill={dark(p.wall, 0.45)} />
      <rect x={0} y={580} width={76} height={FLOOR_Y - 580} fill="#f5d77a" opacity={0.85} />
      <path d="M0 580 h70 q-20 120 -6 230 l-64 0 Z" fill={light(p.accent, 0.35)} opacity={0.75} />
      <rect x={0} y={860} width={76} height={10} fill={dark(p.wall, 0.45)} />
      <Glow cx={60} cy={900} r={260} color="#f5d77a" opacity={0.22} />
      {/* пол балкона — бетонная плитка */}
      <FloorTiles a={dark(p.floor, 0.1)} b={dark(p.floor, 0.16)} step={130} d={0.1} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.35} />
      <path d={`M0 ${FLOOR_Y} L80 ${FLOOR_Y} L380 ${H} L0 ${H} Z`} fill="#f5d77a" opacity={0.12} />
      {/* бельевые верёвки с прищепками */}
      <path d="M120 470 Q600 520 1080 470" stroke="#d8cdb8" strokeWidth={4} fill="none" />
      <path d="M330 488 h120 l20 40 h-30 v110 h-100 v-110 h-30 z" fill={light(p.accent, 0.1)} />
      <rect x={378} y={500} width={24} height={12} fill={dark(p.accent, 0.1)} />
      <rect x={600} y={494} width={40} height={90} rx={12} fill="#e0b030" />
      <rect x={660} y={494} width={40} height={90} rx={12} fill="#e0b030" />
      <rect x={490} y={500} width={90} height={140} rx={6} fill="#8fb3c8" />
      {[0, 1, 2].map((i) => <rect key={i} x={490} y={600 + i * 12} width={90} height={5} fill="#f6efe0" />)}
      {[350, 430, 500, 566, 612, 672].map((x) => <rect key={x} x={x} y={482} width={8} height={20} rx={2} fill={x % 3 ? "#5b8c5a" : "#c8553d"} />)}
      {/* перила с обшивкой из профлиста */}
      <rect x={100} y={940} width={W} height={26} rx={8} fill={rail} />
      {Array.from({ length: 20 }).map((_, i) => <rect key={i} x={140 + i * 50} y={966} width={10} height={70} fill={rail} />)}
      <rect x={100} y={1030} width={W} height={FLOOR_Y - 1030} fill={sheet} />
      {Array.from({ length: 25 }).map((_, i) => <rect key={i} x={110 + i * 40} y={1030} width={16} height={FLOOR_Y - 1030} fill={dark(sheet, 0.14)} />)}
      <rect x={100} y={1030} width={W} height={10} fill={dark(sheet, 0.25)} />
      <rect x={100} y={FLOOR_Y - 30} width={W} height={18} fill={rail} />
      {/* лыжи в углу */}
      <path d={`M1040 ${FLOOR_Y - 10} L1062 640 q2 -22 14 -16 L1056 ${FLOOR_Y - 10} Z`} fill="#c8553d" />
      <path d={`M1018 ${FLOOR_Y - 10} L1038 650 q2 -22 14 -16 L1034 ${FLOOR_Y - 10} Z`} fill={dark("#c8553d", 0.15)} />
      {/* табуретка курильщика (метка stool 0.3, z1), банка-пепельница, ящик с банками */}
      <SeatAt x={0.3} kind="stool" color={WOOD} />
      <rect x={404} y={FLOOR_Y - 40} width={34} height={40} rx={6} fill="#cfe2ea" opacity={0.7} />
      <rect x={404} y={FLOOR_Y - 18} width={34} height={18} fill="#8a8a8a" opacity={0.6} />
      <rect x={160} y={FLOOR_Y - 90} width={110} height={90} rx={6} fill="#a07a50" />
      {[176, 212, 248].map((x) => (
        <g key={x}>
          <rect x={x - 14} y={FLOOR_Y - 124} width={30} height={40} rx={6} fill="#7a9a5a" />
          <rect x={x - 16} y={FLOOR_Y - 132} width={34} height={10} rx={3} fill="#c9b070" />
        </g>
      ))}
      <rect x={160} y={FLOOR_Y - 60} width={110} height={10} fill="#86643f" />
      {/* ящик с цветами */}
      <rect x={760} y={880} width={240} height={60} rx={8} fill={WOOD} />
      <rect x={760} y={900} width={240} height={8} fill={dark(WOOD, 0.2)} />
      {[790, 840, 890, 940, 975].map((x, i) => (
        <g key={x}>
          <rect x={x - 3} y={850} width={6} height={34} fill="#5b8c5a" />
          <ellipse cx={x - 12} cy={872} rx={12} ry={7} fill="#5b8c5a" />
          <circle cx={x} cy={846} r={16} fill={i % 2 ? "#e0b030" : p.accent} />
          <circle cx={x} cy={846} r={6} fill={light(i % 2 ? "#e0b030" : p.accent, 0.5)} />
        </g>
      ))}
    </>
  );
};

/* ---------- подвал ---------- */
const Basement = ({ palette: p }: { palette: Palette }) => {
  const wall = mix(p.wall, "#6f6a64", 0.55);
  const floor = dark(mix(p.floor, "#5a5550", 0.4), 0.15);
  const brick = dark(wall, 0.1);
  const jars = ["#5b8c5a", "#c8553d", "#e0b030", "#5b8c5a", "#c8553d"];
  const pipe = "#7a6a5a";
  return (
    <>
      <Room wall={wall} floor={floor} />
      {/* кирпич проступает сквозь штукатурку */}
      {Array.from({ length: 4 }).flatMap((_, r) =>
        Array.from({ length: 3 }).map((__, c) => <rect key={`${r}-${c}`} x={300 + c * 74 + (r % 2) * 37} y={860 + r * 40} width={66} height={32} rx={4} fill={brick} />),
      )}
      {Array.from({ length: 3 }).flatMap((_, r) =>
        Array.from({ length: 2 }).map((__, c) => <rect key={`b${r}-${c}`} x={40 + c * 74 + (r % 2) * 37} y={540 + r * 40} width={66} height={32} rx={4} fill={brick} />),
      )}
      {Array.from({ length: 3 }).flatMap((_, r) =>
        Array.from({ length: 3 }).map((__, c) => <rect key={`c${r}-${c}`} x={560 + c * 74 + (r % 2) * 37} y={1040 + r * 40} width={66} height={32} rx={4} fill={brick} />),
      )}
      {/* пятна сырости */}
      <ellipse cx={720} cy={860} rx={90} ry={60} fill={dark(wall, 0.06)} />
      <ellipse cx={150} cy={1120} rx={110} ry={50} fill={dark(wall, 0.06)} />
      <VShade y={0} h={900} color="#1a1612" from={0.45} to={0} />
      {/* потолок: балки перекрытия и трубы */}
      <rect x={0} y={0} width={W} height={110} fill={dark(wall, 0.35)} />
      {[60, 320, 580, 840].map((x) => <rect key={x} x={x} y={0} width={70} height={130} fill={dark(WOOD, 0.35)} />)}
      <rect x={0} y={118} width={W} height={28} rx={6} fill={pipe} />
      <rect x={0} y={150} width={W} height={16} fill={light(pipe, 0.1)} />
      {[160, 460, 860].map((x) => <rect key={x} x={x} y={112} width={22} height={40} rx={4} fill={dark(pipe, 0.25)} />)}
      {/* стояк с вентилем и капающая вода */}
      <rect x={684} y={146} width={28} height={FLOOR_Y - 146} fill={pipe} />
      <rect x={680} y={480} width={36} height={60} rx={4} fill="#c9c0b0" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={680} y={486 + i * 14} width={36} height={4} fill="#a89e8e" />)}
      <rect x={680} y={720} width={36} height={18} rx={4} fill={dark(pipe, 0.25)} />
      <circle cx={698} cy={690} r={30} fill="#c8553d" />
      <circle cx={698} cy={690} r={14} fill={wall} />
      <rect x={694} y={690} width={8} height={30} fill="#5a4a3a" />
      <path d="M716 760 q4 10 0 16 q-4 -6 0 -16 Z" fill="#9fc8dc" />
      <ellipse cx={730} cy={FLOOR_Y + 10} rx={60} ry={10} fill="#9fc8dc" opacity={0.35} />
      {/* окошко под потолком и луч */}
      <path d="M440 560 L640 560 L780 1190 L320 1190 Z" fill="#f5e6a8" opacity={0.1} />
      <rect x={430} y={450} width={220} height={120} rx={8} fill={dark(wall, 0.3)} />
      <rect x={446} y={466} width={188} height={88} rx={4} fill="#9fb8c8" />
      <rect x={446} y={530} width={188} height={24} fill="#7a9a5a" />
      {[470, 500, 530].map((x, i) => <path key={x} d={`M${x} 530 l6 -18 l6 18`} fill="#5b8c5a" />)}
      {[490, 540, 590].map((x) => <rect key={x} x={x - 4} y={466} width={8} height={88} fill="#3a3a3a" />)}
      {/* паутина */}
      <path d="M0 146 Q60 170 70 250 M0 200 Q40 205 52 230 M20 146 Q30 200 70 250 M0 176 Q50 180 62 236" stroke="#d8d4cc" strokeWidth={2} fill="none" opacity={0.6} />
      <path d="M650 450 q-30 10 -40 40 M650 470 q-20 4 -26 24 M630 450 q0 30 -20 40" stroke="#d8d4cc" strokeWidth={2} fill="none" opacity={0.6} />
      {/* лампочка */}
      <rect x={258} y={146} width={5} height={274} fill="#2b1d14" />
      <Glow cx={260} cy={458} r={320} color="#f5e6a8" opacity={0.3} />
      <rect x={250} y={420} width={20} height={20} fill="#5a5a5a" />
      <circle cx={260} cy={458} r={22} fill="#f5e6a8" />
      {/* щит с инструментами */}
      <rect x={290} y={620} width={130} height={200} rx={6} fill="#b8a07a" />
      {Array.from({ length: 5 }).flatMap((_, r) => Array.from({ length: 4 }).map((__, c) => <circle key={`${r}${c}`} cx={306 + c * 32} cy={636 + r * 40} r={3} fill="#8a7454" />))}
      <rect x={306} y={640} width={10} height={70} rx={3} fill={WOOD} />
      <rect x={296} y={636} width={30} height={20} rx={4} fill="#5a5a5a" />
      <path d="M340 646 l0 120 l50 -20 l0 -100 Z" fill="#9aa1a6" />
      <rect x={336} y={630} width={12} height={34} rx={4} fill={WOOD} />
      <path d="M396 650 q8 40 0 80 M410 650 q-8 40 0 80" stroke="#5a5a5a" strokeWidth={7} fill="none" />
      <rect x={300} y={760} width={70} height={14} rx={7} fill="#c8553d" />
      <rect x={360} y={762} width={46} height={10} fill="#9aa1a6" />
      {/* стеллаж с банками (подписанными) */}
      <FloorShadow cx={130} w={250} o={0.25} />
      <rect x={20} y={720} width={14} height={FLOOR_Y - 720} fill={WOOD} />
      <rect x={226} y={720} width={14} height={FLOOR_Y - 720} fill={WOOD} />
      {[840, 980, 1120].map((y, r) => (
        <g key={y}>
          <rect x={14} y={y} width={232} height={16} rx={4} fill={dark(WOOD, 0.05)} />
          {[0, 1, 2, 3].map((k) => {
            const c = jars[(r + k) % jars.length];
            return (
              <g key={k}>
                <rect x={44 + k * 46} y={y - 76} width={38} height={76} rx={10} fill={c} opacity={0.9} />
                <rect x={46 + k * 46} y={y - 86} width={34} height={14} rx={4} fill="#c9b070" />
                <rect x={50 + k * 46} y={y - 50} width={26} height={18} rx={2} fill="#f2ead8" />
                <rect x={54 + k * 46} y={y - 70} width={6} height={14} rx={3} fill="#ffffff" opacity={0.5} />
              </g>
            );
          })}
        </g>
      ))}
      {/* мышиная норка */}
      <path d={`M470 ${FLOOR_Y} v-26 a16 16 0 0 1 32 0 v26 Z`} fill="#1e1a16" />
      {/* бетонный пол, плиты и трещины */}
      <FloorTiles a={floor} b={light(floor, 0.03)} step={190} d={0.12} grout={dark(floor, 0.18)} />
      <path d="M360 1300 l40 30 l-10 30 l50 40" stroke={dark(floor, 0.25)} strokeWidth={3} fill="none" />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.35} />
      {/* лестница наверх */}
      <FloorShadow cx={900} w={320} o={0.25} />
      <path d={`M1080 560 L1080 640 L800 ${FLOOR_Y} L740 ${FLOOR_Y} Z`} fill={dark(WOOD, 0.25)} />
      {Array.from({ length: 7 }).map((_, i) => {
        const t = (i + 0.5) / 7;
        const x = 1080 - t * 300;
        const y = 600 + t * (FLOOR_Y - 600);
        return (
          <g key={i}>
            <rect x={x - 70} y={y - 14} width={130} height={22} rx={4} fill={WOOD} />
            <rect x={x - 70} y={y - 14} width={130} height={6} rx={3} fill={light(WOOD, 0.15)} />
          </g>
        );
      })}
      <path d={`M1080 360 L800 ${FLOOR_Y - 330}`} stroke={dark(WOOD, 0.3)} strokeWidth={12} strokeLinecap="round" />
      <rect x={794} y={FLOOR_Y - 336} width={12} height={336} fill={dark(WOOD, 0.3)} />
      {/* ящики и мешок под лестницей: низкий ящик посередине — сиденье (метка crate 0.56, z1) */}
      <rect x={900} y={FLOOR_Y - 120} width={150} height={120} rx={6} fill="#a07a50" />
      <rect x={900} y={FLOOR_Y - 70} width={150} height={12} fill="#86643f" />
      <rect x={930} y={FLOOR_Y - 200} width={100} height={80} rx={6} fill="#b58e60" />
      <path d={`M1036 ${FLOOR_Y} q-10 -100 14 -130 q14 -16 26 0 l4 130 Z`} fill="#b8a27a" />
      <path d="M1046 1068 q16 -10 30 0" stroke="#8a7454" strokeWidth={6} fill="none" />
      {[1052, 1068, 1060].map((x, i) => <circle key={i} cx={x} cy={1060 - i * 8} r={9} fill="#a8804a" />)}
      <FloorShadow cx={0.56 * W} w={150} o={0.22} />
      <rect x={0.56 * W - 62} y={seatTopY(1)} width={124} height={FLOOR_Y - seatTopY(1)} rx={5} fill="#a07a50" />
      <rect x={0.56 * W - 62} y={seatTopY(1)} width={124} height={9} rx={4} fill="#b58e60" />
      <rect x={0.56 * W - 62} y={seatTopY(1) + 28} width={124} height={7} fill="#86643f" />
    </>
  );
};

/* ---------- столовая: длинный накрытый стол позади кукол ---------- */
const Chandelier = ({ x }: { x: number }) => (
  <g>
    <Glow cx={x} cy={220} r={380} color="#f5e6a8" opacity={0.3} />
    <rect x={x - 3} y={80} width={6} height={70} fill="#2b1d14" />
    <path d={`M${x - 130} 190 Q${x} 250 ${x + 130} 190`} stroke="#c9a24a" strokeWidth={10} fill="none" />
    <ellipse cx={x} cy={170} rx={34} ry={26} fill="#c9a24a" />
    {[-130, -65, 0, 65, 130].map((dx) => (
      <g key={dx}>
        <rect x={x + dx - 6} y={dx === 0 ? 196 : 176 + Math.abs(dx) * 0.05} width={12} height={24} fill="#c9a24a" />
        <path d={`M${x + dx} ${dx === 0 ? 168 : 146} q-16 22 0 34 q16 -12 0 -34 z`} fill="#fff0b8" />
      </g>
    ))}
    {/* хрустальные подвески */}
    {[-100, -50, 0, 50, 100].map((dx, i) => (
      <path key={dx} d={`M${x + dx} ${222 + (i % 2) * 8} l7 12 l-7 14 l-7 -14 Z`} fill="#e8f4fa" />
    ))}
  </g>
);

/** Сервант с хрусталём за стеклом. */
const Sideboard = ({ x, w, h, accent }: { x: number; w: number; h: number; accent: string }) => {
  const y = FLOOR_Y - h;
  const glass = "#cfe2ea";
  return (
    <g>
      <FloorShadow cx={x + w / 2} w={w + 30} o={0.25} />
      <rect x={x + 12} y={y + 12} width={w} height={h - 12} rx={8} fill="#00000022" />
      <rect x={x - 8} y={y - 14} width={w + 16} height={22} rx={6} fill={dark(WOOD, 0.15)} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill={WOOD} />
      <rect x={x + 16} y={y + 20} width={w - 32} height={h * 0.55} rx={6} fill={glass} />
      <rect x={x + 16} y={y + 20} width={w - 32} height={h * 0.55} rx={6} fill="#ffffff" opacity={0.12} />
      {[0.22, 0.42].map((t) => <rect key={t} x={x + 16} y={y + h * t} width={w - 32} height={8} fill={dark(WOOD, 0.1)} />)}
      {/* тарелки на ребре */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx={x + 50 + i * ((w - 100) / 3)} cy={y + h * 0.22 - 28} rx={22} ry={28} fill={i % 2 ? "#f6f3ee" : accent} />
          <ellipse cx={x + 50 + i * ((w - 100) / 3)} cy={y + h * 0.22 - 28} rx={12} ry={16} fill={i % 2 ? "#e0d8c8" : light(accent, 0.3)} />
        </g>
      ))}
      {/* хрустальные бокалы и графин */}
      {[0, 1, 2, 3].map((i) => {
        const gx = x + 40 + i * ((w - 120) / 3);
        const gy = y + h * 0.42;
        return (
          <g key={i} fill="#eef7fb">
            <path d={`M${gx - 12} ${gy - 52} h24 l-4 22 h-16 Z`} />
            <rect x={gx - 2} y={gy - 30} width={4} height={22} />
            <rect x={gx - 9} y={gy - 8} width={18} height={6} rx={2} />
            <path d={`M${gx - 6} ${gy - 48} l4 14`} stroke="#ffffff" strokeWidth={2} />
          </g>
        );
      })}
      <path d={`M${x + w - 50} ${y + h * 0.42} q-26 0 -22 -40 q4 -14 12 -18 v-18 h20 v18 q8 4 12 18 q4 40 -22 40 Z`} fill="#e3f0f5" />
      <rect x={x + 16} y={y + h * 0.6} width={w - 32} height={h * 0.36} rx={6} fill={dark(WOOD, 0.12)} />
      <rect x={x + w / 2 - 4} y={y + h * 0.6} width={8} height={h * 0.36} fill={WOOD} />
      <circle cx={x + w / 2 - 18} cy={y + h * 0.75} r={6} fill="#e0b030" />
      <circle cx={x + w / 2 + 18} cy={y + h * 0.75} r={6} fill="#e0b030" />
      {/* ваза с цветами и салфетка сверху */}
      <path d={`M${x + 30} ${y - 14} h${w - 60} l-10 14 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 Z`} fill="#f8f4ea" />
      <path d={`M${x + w / 2 - 20} ${y - 14} q-10 -50 6 -70 h28 q16 20 6 70 Z`} fill={light(accent, 0.25)} />
      {[[-26, -110], [0, -126], [24, -108], [-12, -94], [14, -96]].map(([dx, dy], i) => (
        <g key={i}>
          <rect x={x + w / 2 + dx / 2 - 2} y={y + dy + 14} width={4} height={50} fill="#5b8c5a" />
          <circle cx={x + w / 2 + dx} cy={y + dy} r={14} fill={i % 2 ? "#f6efe0" : "#e0b030"} />
        </g>
      ))}
    </g>
  );
};

/** Часы с маятником. */
const PendulumClock = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 46} y={y + 6} width={100} height={250} rx={10} fill="#00000022" />
    <path d={`M${x - 52} ${y + 20} Q${x} ${y - 30} ${x + 52} ${y + 20} Z`} fill={dark(WOOD, 0.2)} />
    <rect x={x - 50} y={y + 14} width={100} height={240} rx={8} fill={WOOD} />
    <circle cx={x} cy={y + 70} r={38} fill="#f6f1e6" />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={x - 1.5} y={y + 38} width={3} height={8} fill="#4a4038" transform={`rotate(${i * 30} ${x} ${y + 70})`} />)}
    <rect x={x - 2} y={y + 46} width={4} height={26} fill="#2b2b2b" transform={`rotate(40 ${x} ${y + 70})`} />
    <rect x={x - 2} y={y + 52} width={4} height={20} fill="#2b2b2b" transform={`rotate(200 ${x} ${y + 70})`} />
    <rect x={x - 32} y={y + 120} width={64} height={120} rx={6} fill="#cfe2ea" />
    <rect x={x - 2} y={y + 120} width={4} height={80} fill="#c9a24a" transform={`rotate(8 ${x} ${y + 120})`} />
    <circle cx={x + 11} cy={y + 200} r={14} fill="#c9a24a" />
  </g>
);

const DiningRoom = ({ palette: p }: { palette: Palette }) => {
  const chair = dark(WOOD, 0.15);
  return (
    <>
      <Room wall={p.wall} floor={p.floor} />
      <Wallpaper wall={p.wall} y1={900} />
      <VShade y={0} h={640} from={0.16} to={0} />
      <Ceiling color={light(p.wall, 0.3)} h={80} />
      <FloorBoards color={p.floor} step={58} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.28} />
      <Wainscot y={900} color={dark(p.wall, 0.16)} />
      <Skirting color={dark(p.wall, 0.34)} />
      <Chandelier x={540} />
      {/* окно со шторами, часы с маятником, картина */}
      <WindowView x={340} y={470} w={230} h={330} view="yard" />
      <PotPlant x={455} y={796} s={0.6} flower="#e0b030" />
      <Curtains x0={326} x1={584} y={460} h={430} color={dark(p.accent, 0.12)} tie="#e0b030" />
      <PendulumClock x={680} y={500} />
      <rect x={776} y={496} width={220} height={170} rx={6} fill="#c9a24a" />
      <rect x={790} y={510} width={192} height={142} fill="#3a4a3a" />
      {/* натюрморт: ваза с фруктами */}
      <ellipse cx={886} cy={630} rx={60} ry={14} fill="#6a4a30" />
      <circle cx={860} cy={606} r={22} fill="#c8553d" />
      <circle cx={900} cy={600} r={24} fill="#e0b030" />
      <circle cx={882} cy={584} r={18} fill="#8a4a8a" />
      <circle cx={918} cy={618} r={14} fill="#5b8c5a" />
      <PhotoFrame x={830} y={700} w={70} h={86} frame="#c9a24a" kind="portrait" oval />
      <PhotoFrame x={910} y={710} w={66} h={76} frame={WOOD} kind="couple" />
      <Sideboard x={40} w={250} h={560} accent={p.accent} />
      <FloorRug x0={100} x1={980} y0={1210} y1={1350} color={dark(p.accent, 0.15)} border={dark(p.accent, 0.4)} inner={mix(p.accent, "#e0a030", 0.25)} />
      {/* стулья на среднем плане (метки chair-1…chair-4, z0.5): перед ними — стол варианта (set: dining-table), он закрывает сиденья */}
      {[0.2, 0.4, 0.6, 0.8].map((x) => (
        <SeatAt key={x} x={x} z={0.5} color={chair} pad={p.accent} back={190} />
      ))}
    </>
  );
};

/** Гостиная: базовый вид + прихожая (front-door), балкон (balcony), подвал (basement), столовая (dining-room). */
export const Gostinaya = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "front-door" ? (
      <Hallway palette={palette} />
    ) : variant === "dining-room" ? (
      <DiningRoom palette={palette} />
    ) : variant === "balcony" ? (
      <Balcony palette={palette} />
    ) : variant === "basement" ? (
      <Basement palette={palette} />
    ) : (
      <Living palette={palette} />
    )}
  </Canvas>
);
