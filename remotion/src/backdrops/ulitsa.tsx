import type { ReactNode } from "react";
import { Canvas, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { depthScale, feetY, seatTopY } from "../world/depth";
import { useSign } from "../i18n/signs";
import { FONT } from "../fonts";

/**
 * Фон «ulitsa»: улица; варианты park, cemetery, stadium, zoo, yard / yard-night (двор пятиэтажки днём и ночью, один рисунок Yard). Скамейки нарисованы под метки bench-1/bench-2 (дальний план),
 * на стадионе — передний ряд трибуны (seat-1…seat-4).
 *
 * Здесь же — общий набор уличных деталей (облака, птицы, силуэт города, лиственные деревья, окна, вывески, плитка),
 * им пользуются doroga.tsx и plyazh.tsx. Правило детализации: всё мелкое — на фасадах, в небе, у линии стены (y ≤ 1190);
 * пол ниже 1190 — только плоская фактура (плитка, трещины, люк), полоса рассказчика y 150…420 — спокойное небо.
 */

/** Осветлить (k>0) или затемнить (k<0) цвет #rrggbb. */
export const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const t = k < 0 ? 0 : 255;
  const p = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * p));
  return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
};

/** Детерминированный «шум» 0..1. */
export const rnd = (i: number) => {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};


/** Кегль, при котором надпись влезает в maxW (грубая оценка: жирные заглавные ≈ 0.7 кегля на букву).
 *  Нужна для переводов: немецкое слово часто длиннее русского. */
export const fitSize = (text: string, size: number, maxW?: number, spacing = 1) => {
  if (!maxW) return size;
  const n = Math.max(1, [...text].length);
  const need = n * size * 0.7 + (n - 1) * spacing;
  return need <= maxW ? size : Math.max(6, (maxW - (n - 1) * spacing) / (n * 0.7));
};

/** Надпись (вывески, таблички). */
export const Label = ({ x, y, text, size = 34, color = "#ffffff", anchor = "middle", weight = 900, spacing = 1, maxW }: { x: number; y: number; text: string; size?: number; color?: string; anchor?: "start" | "middle" | "end"; weight?: number; spacing?: number; maxW?: number }) => {
  // при уменьшении кегля (длинный перевод) базовая линия остаётся на месте, текст чуть ниже центра — сдвигаем вверх
  const fs = fitSize(text, size, maxW, spacing);
  return <text x={x} y={y - (size - fs) * 0.36} textAnchor={anchor} fontFamily={FONT} fontWeight={weight} fontSize={fs} letterSpacing={spacing} fill={color}>{text}</text>;
};

/** Вывеска: доска с надписью. */
export const Sign = ({ x, y, w, h = 56, text, bg, fg = "#ffffff", size, r = 8 }: { x: number; y: number; w: number; h?: number; text: string; bg: string; fg?: string; size?: number; r?: number }) => (
  <g>
    <rect x={x} y={y + 5} width={w} height={h} rx={r} fill="#00000022" />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={bg} />
    <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={r * 0.6} fill="none" stroke={shade(bg, 0.25)} strokeWidth={3} />
    <Label x={x + w / 2} y={y + h / 2 + (size ?? h * 0.55) * 0.36} text={text} size={size ?? h * 0.55} color={fg} maxW={w - 18} />
  </g>
);

/** Облако в два тона: светлый верх, чуть темнее плоский низ. */
export const Puff = ({ x, y, s = 1, color = "#ffffff", under, opacity = 1 }: { x: number; y: number; s?: number; color?: string; under?: string; opacity?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <rect x={-40} y={10} width={300} height={56} rx={28} fill={under ?? shade(color, -0.08)} />
    <circle cx={30} cy={10} r={50} fill={color} />
    <circle cx={110} cy={-20} r={72} fill={color} />
    <circle cx={190} cy={8} r={52} fill={color} />
    <rect x={-20} y={8} width={260} height={46} rx={23} fill={color} />
  </g>
);

/** Птицы-галочки: [x, y, размер]. */
export const Birds = ({ items, color = "#4a5560" }: { items: [number, number, number][]; color?: string }) => (
  <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
    {items.map(([x, y, s], i) => (
      <path key={i} d={`M${x - 16 * s} ${y} q${8 * s} ${-10 * s} ${16 * s} 0 q${8 * s} ${-10 * s} ${16 * s} 0`} strokeWidth={4 * s} />
    ))}
  </g>
);

/** Силуэт далёкого города: дома с точками окон, купол и башня. */
export const Skyline = ({ y, color, win, seed = 1, x0 = 0, x1 = W, dome = true }: { y: number; color: string; win?: string; seed?: number; x0?: number; x1?: number; dome?: boolean }) => {
  const blocks: { x: number; w: number; h: number }[] = [];
  let x = x0 - 20;
  let i = 0;
  while (x < x1) {
    const w = 70 + rnd(seed * 31 + i) * 90;
    const h = 90 + rnd(seed * 17 + i * 3) * 170;
    blocks.push({ x, w, h });
    x += w - 6;
    i++;
  }
  const wc = win ?? shade(color, 0.22);
  return (
    <g>
      {dome && (
        <g fill={color}>
          <rect x={x0 + (x1 - x0) * 0.62} y={y - 250} width={70} height={250} />
          <path d={`M${x0 + (x1 - x0) * 0.62 - 6} ${y - 248} q41 -90 82 0 z`} />
          <rect x={x0 + (x1 - x0) * 0.62 + 32} y={y - 320} width={6} height={50} />
        </g>
      )}
      {blocks.map((b, k) => (
        <g key={k}>
          <rect x={b.x} y={y - b.h} width={b.w} height={b.h} fill={color} />
          {rnd(seed + k * 7) > 0.6 && <rect x={b.x + b.w * 0.6} y={y - b.h - 26} width={6} height={26} fill={color} />}
          {Array.from({ length: Math.floor((b.h - 30) / 34) }).flatMap((_, r) =>
            Array.from({ length: Math.floor((b.w - 16) / 26) }).map((__, c) =>
              rnd(seed * 101 + k * 13 + r * 5 + c) > 0.55 ? <rect key={`${r}-${c}`} x={b.x + 12 + c * 26} y={y - b.h + 18 + r * 34} width={10} height={14} fill={wc} /> : null,
            ),
          )}
        </g>
      ))}
    </g>
  );
};

/** Лиственное дерево в три тона (тень, крона, блики); (x, y) — низ ствола. */
export const LeafyTree = ({ x, y, s = 1, tones = ["#3f6f45", "#5b8c5a", "#7fb06a"], trunk = "#6b4a32", flip = false }: { x: number; y: number; s?: number; tones?: [string, string, string] | string[]; trunk?: string; flip?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <path d="M-20 0 L-14 -250 L-60 -330 L-48 -338 L-6 -280 L4 -360 L18 -356 L14 -270 L56 -320 L66 -310 L16 -240 L22 0 Z" fill={trunk} />
    <path d="M-6 -60 q-6 -20 -2 -40" stroke={shade(trunk, -0.25)} strokeWidth={5} fill="none" />
    <g fill={tones[0]}>
      <circle cx={-110} cy={-330} r={92} />
      <circle cx={100} cy={-320} r={96} />
      <circle cx={0} cy={-300} r={100} />
      <circle cx={-40} cy={-450} r={100} />
      <circle cx={60} cy={-440} r={96} />
    </g>
    <g fill={tones[1]}>
      <circle cx={-90} cy={-360} r={78} />
      <circle cx={90} cy={-360} r={80} />
      <circle cx={-10} cy={-470} r={88} />
      <circle cx={10} cy={-350} r={84} />
    </g>
    <g fill={tones[2]}>
      <circle cx={-60} cy={-420} r={40} />
      <circle cx={30} cy={-500} r={44} />
      <circle cx={100} cy={-390} r={34} />
      <circle cx={-120} cy={-360} r={26} />
    </g>
  </g>
);

/** Пучки травы: [x, y, размер]. */
export const Tufts = ({ items, color }: { items: [number, number, number][]; color: string }) => (
  <g fill={color}>
    {items.map(([x, y, s], i) => (
      <path key={i} d={`M${x - 14 * s} ${y} q${2 * s} ${-18 * s} ${6 * s} ${-26 * s} q${2 * s} ${14 * s} ${5 * s} ${18 * s} q${3 * s} ${-16 * s} ${7 * s} ${-30 * s} q${4 * s} ${16 * s} ${4 * s} ${30 * s} q${4 * s} ${-10 * s} ${10 * s} ${-18 * s} q${-1 * s} ${12 * s} ${-4 * s} ${26 * s} Z`} />
    ))}
  </g>
);

/** Плитка тротуара: швы, несколько выщербленных плиток. */
export const Paving = ({ y0, y1, color, cell = 90, seed = 3 }: { y0: number; y1: number; color: string; cell?: number; seed?: number }) => {
  const rows: number[] = [];
  for (let y = y0 + cell * 0.55; y < y1; y += cell * 0.55) rows.push(y);
  return (
    <g>
      <rect x={0} y={y0} width={W} height={y1 - y0} fill={color} />
      {rows.map((y, r) => (
        <g key={y}>
          <rect x={0} y={y} width={W} height={3} fill="#00000014" />
          {Array.from({ length: Math.ceil(W / cell) + 1 }).map((_, c) => {
            const x = c * cell + (r % 2) * (cell / 2);
            const prevY = r === 0 ? y0 : rows[r - 1];
            return (
              <g key={c}>
                <rect x={x} y={prevY} width={3} height={y - prevY} fill="#00000012" />
                {rnd(seed * 97 + r * 31 + c) > 0.88 && <rect x={x + 6} y={prevY + 4} width={cell - 12} height={y - prevY - 8} rx={4} fill={shade(color, rnd(r + c) > 0.5 ? 0.08 : -0.06)} />}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
};

/** Канализационный люк (плоский эллипс на асфальте). */
export const Manhole = ({ x, y, s = 1, color = "#4a4a4a" }: { x: number; y: number; s?: number; color?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={70} ry={20} fill={shade(color, -0.2)} />
    <ellipse cx={0} cy={-2} rx={62} ry={16} fill={color} />
    {[-36, -18, 0, 18, 36].map((dx) => <rect key={dx} x={dx - 2} y={-12} width={4} height={20} fill={shade(color, -0.15)} />)}
  </g>
);

/** Трещины на асфальте. */
export const Cracks = ({ items, color = "#00000024" }: { items: [number, number, number][]; color?: string }) => (
  <g stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
    {items.map(([x, y, s], i) => (
      <path key={i} d={`M${x} ${y} l${30 * s} ${6 * s} l${18 * s} ${-8 * s} l${26 * s} ${10 * s} M${x + 48 * s} ${y - 2 * s} l${8 * s} ${-14 * s}`} />
    ))}
  </g>
);

/** Фонарь на столбе. */
export const LampPost = ({ x, top = 560, y = FLOOR_Y, color = "#2f3a40", light = "#f7dc8a", glow = 0.16 }: { x: number; top?: number; y?: number; color?: string; light?: string; glow?: number }) => (
  <g>
    {glow > 0 && <circle cx={x} cy={top + 40} r={130} fill={light} opacity={glow} />}
    <rect x={x - 9} y={top + 60} width={18} height={y - top - 60} fill={color} />
    <rect x={x - 14} y={top + 150} width={28} height={14} rx={4} fill={shade(color, 0.12)} />
    <rect x={x - 14} y={y - 140} width={28} height={10} rx={4} fill={shade(color, 0.12)} />
    <rect x={x - 24} y={y - 46} width={48} height={46} rx={10} fill={color} />
    <rect x={x - 30} y={y - 52} width={60} height={12} rx={5} fill={shade(color, 0.1)} />
    <rect x={x - 26} y={top + 8} width={52} height={60} rx={10} fill={light} />
    <rect x={x - 3} y={top + 8} width={6} height={60} fill={shade(color, 0.1)} opacity={0.6} />
    <path d={`M${x - 40} ${top + 14} L${x} ${top - 22} L${x + 40} ${top + 14} Z`} fill={color} />
    <circle cx={x} cy={top - 26} r={8} fill={color} />
    <rect x={x - 32} y={top + 62} width={64} height={12} rx={5} fill={color} />
  </g>
);

/** Урна. */
export const Bin = ({ x, y = FLOOR_Y, s = 1, color = "#4f6b52" }: { x: number; y?: number; s?: number; color?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-36 -110 H36 L28 0 H-28 Z" fill={color} />
    <rect x={-40} y={-118} width={80} height={14} rx={5} fill={shade(color, -0.2)} />
    {[-16, 0, 16].map((dx) => <rect key={dx} x={dx - 3} y={-96} width={6} height={80} rx={3} fill={shade(color, 0.12)} />)}
  </g>
);

/** Голубь. */
export const Pigeon = ({ x, y, body = "#8d93a0", flip = false, s = 1 }: { x: number; y: number; body?: string; flip?: boolean; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx={0} cy={-24} rx={30} ry={20} fill={body} />
    <path d="M22 -30 l26 -6 l-6 18 z" fill={shade(body, -0.25)} />
    <path d="M-6 -30 q16 -6 26 6 q-14 6 -26 -6 z" fill={shade(body, -0.12)} />
    <circle cx={-26} cy={-44} r={14} fill={shade(body, -0.1)} />
    <path d="M-32 -34 q8 6 16 0 v6 q-8 6 -16 0 z" fill="#6f9a8a" />
    <circle cx={-30} cy={-47} r={3} fill="#2b1d14" />
    <path d="M-40 -44 l-10 4 l10 3 z" fill="#e0a030" />
    <rect x={-6} y={-6} width={4} height={8} fill="#c8553d" />
    <rect x={6} y={-6} width={4} height={8} fill="#c8553d" />
  </g>
);

/** Скамейка со спинкой под метками: сиденье от x0 до x1 (доли кадра), верх сиденья = seatTopY(z); чугунные боковины. */
export const ParkBench = ({ x0, x1, z = 1, color = "#a8673f", metal = "#3a3a40" }: { x0: number; x1: number; z?: number; color?: string; metal?: string }) => {
  const s = depthScale(z);
  const l = x0 * W;
  const r = x1 * W;
  const top = seatTopY(z);
  const fy = feetY(z);
  const legs = [l + 6 * s, r - 6 * s, ...(r - l > 400 * s ? [(l + r) / 2] : [])];
  return (
    <g>
      <ellipse cx={(l + r) / 2} cy={fy} rx={(r - l) / 2 + 20 * s} ry={10 * s} fill="#00000018" />
      {legs.map((x) => (
        <g key={x} fill={metal}>
          <rect x={x - 8 * s} y={top - 160 * s} width={16 * s} height={170 * s} rx={6 * s} />
          <path d={`M${x - 26 * s} ${fy} q${8 * s} ${-40 * s} ${18 * s} ${-70 * s} h${16 * s} q${10 * s} ${30 * s} ${18 * s} ${70 * s} h${-12 * s} q${-8 * s} ${-30 * s} ${-14 * s} ${-44 * s} q${-6 * s} ${14 * s} ${-14 * s} ${44 * s} z`} />
          <rect x={x - 22 * s} y={top - 60 * s} width={44 * s} height={10 * s} rx={5 * s} />
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={l - 4 * s} y={top - (158 - i * 42) * s} width={r - l + 8 * s} height={30 * s} rx={8 * s} fill={i % 2 ? shade(color, -0.06) : color} />
      ))}
      {[0, 1, 2].map((i) => <rect key={`g${i}`} x={l} y={top - (158 - i * 42) * s + 22 * s} width={r - l} height={4 * s} fill="#00000018" />)}
      <rect x={l - 14 * s} y={top} width={r - l + 28 * s} height={26 * s} rx={10 * s} fill={shade(color, -0.12)} />
      <rect x={l - 14 * s} y={top} width={r - l + 28 * s} height={9 * s} rx={5 * s} fill={shade(color, 0.12)} />
      <rect x={l - 14 * s} y={top + 26 * s} width={r - l + 28 * s} height={6 * s} fill="#00000022" />
    </g>
  );
};

/** Окно: рама, стекло с бликом, занавески, ящик с цветами, форточка. */
export const Win = ({ x, y, w = 74, h = 104, frame = "#f2e6d0", glass = "#cfe6f5", curtain, flowers, lit = false, children }: { x: number; y: number; w?: number; h?: number; frame?: string; glass?: string; curtain?: string; flowers?: string; lit?: boolean; children?: ReactNode }) => (
  <g>
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={6} fill={frame} />
    <rect x={x} y={y} width={w} height={h} rx={4} fill={lit ? "#f7e3a0" : glass} />
    <path d={`M${x + 6} ${y + h * 0.7} L${x + w * 0.55} ${y + 6} H${x + w * 0.75} L${x + 6} ${y + h - 6} Z`} fill="#ffffff" opacity={0.22} />
    {children}
    {curtain && (
      <>
        <path d={`M${x} ${y} H${x + w * 0.3} Q${x + w * 0.14} ${y + h * 0.5} ${x + w * 0.22} ${y + h} H${x} Z`} fill={curtain} />
        <path d={`M${x + w} ${y} H${x + w * 0.7} Q${x + w * 0.86} ${y + h * 0.5} ${x + w * 0.78} ${y + h} H${x + w} Z`} fill={curtain} />
      </>
    )}
    <rect x={x + w / 2 - 3} y={y} width={6} height={h} fill={frame} />
    <rect x={x} y={y + h * 0.32} width={w} height={5} fill={frame} />
    <rect x={x - 10} y={y + h + 4} width={w + 20} height={10} rx={3} fill={shade(frame, -0.12)} />
    {flowers && (
      <g>
        <rect x={x - 4} y={y + h - 14} width={w + 8} height={18} rx={4} fill="#8a5a3a" />
        {[0.12, 0.32, 0.52, 0.72, 0.9].map((k, i) => <circle key={k} cx={x + w * k} cy={y + h - 18 - (i % 2) * 6} r={9} fill={i % 2 ? flowers : "#5b8c5a"} />)}
      </g>
    )}
  </g>
);

const WIN_CURTAINS = ["#e8c4a0", "#c9d6e8", "#e0b0b0", "#f2e6d0", "#d8c890"];

/** Фасад с сеткой окон, карнизом, водосточной трубой и антеннами; первый этаж (y 880…1100) отдаётся children. */
const Facade = ({ x, w, top, color, cols, seed = 1, pipe, roof = "antenna", children }: { x: number; w: number; top: number; color: string; cols: number[]; seed?: number; pipe?: number; roof?: "antenna" | "chimney" | "dish" | "none"; children?: ReactNode }) => {
  const rows: number[] = [];
  for (let y = top + 70; y + 110 < 860; y += 160) rows.push(y);
  return (
    <g>
      {roof === "antenna" && (
        <g stroke={shade(color, -0.45)} strokeWidth={5} fill="none" strokeLinecap="round">
          <path d={`M${x + w * 0.7} ${top - 6} V${top - 80} M${x + w * 0.7 - 34} ${top - 70} H${x + w * 0.7 + 34} M${x + w * 0.7 - 24} ${top - 52} H${x + w * 0.7 + 24}`} />
        </g>
      )}
      {roof === "chimney" && (
        <g>
          <rect x={x + w * 0.2} y={top - 70} width={46} height={70} fill={shade(color, -0.25)} />
          <rect x={x + w * 0.2 - 6} y={top - 80} width={58} height={14} fill={shade(color, -0.35)} />
        </g>
      )}
      {roof === "dish" && (
        <g fill={shade(color, 0.35)}>
          <ellipse cx={x + w * 0.75} cy={top - 34} rx={14} ry={26} transform={`rotate(-25 ${x + w * 0.75} ${top - 34})`} />
          <rect x={x + w * 0.75 - 3} y={top - 30} width={6} height={28} fill={shade(color, -0.4)} />
        </g>
      )}
      <rect x={x} y={top} width={w} height={1100 - top} fill={color} />
      {/* рустовка первого этажа и межэтажные пояса */}
      <rect x={x} y={882} width={w} height={218} fill={shade(color, -0.05)} />
      {rows.slice(1).map((ry) => <rect key={ry} x={x} y={ry - 26} width={w} height={6} fill={shade(color, -0.08)} />)}
      <rect x={x - 8} y={top - 6} width={w + 16} height={22} rx={4} fill={shade(color, -0.18)} />
      {Array.from({ length: Math.floor(w / 30) }).map((_, i) => <rect key={i} x={x + 8 + i * 30} y={top + 16} width={14} height={10} fill={shade(color, -0.12)} />)}
      <rect x={x} y={868} width={w} height={14} fill={shade(color, -0.12)} />
      {rows.map((ry, r) =>
        cols.map((cx, c) => {
          const k = seed * 53 + r * 7 + c * 3;
          return (
            <Win key={`${ry}-${cx}`} x={x + cx} y={ry} curtain={rnd(k) > 0.35 ? WIN_CURTAINS[Math.floor(rnd(k + 1) * WIN_CURTAINS.length)] : undefined} flowers={rnd(k + 2) > 0.72 ? ["#d8506a", "#e0a030", "#ffffff"][Math.floor(rnd(k + 3) * 3)] : undefined} />
          );
        }),
      )}
      {pipe !== undefined && (
        <g fill={shade(color, -0.3)}>
          <rect x={x + pipe - 7} y={top + 10} width={14} height={1090 - top} />
          <rect x={x + pipe - 14} y={top + 4} width={28} height={20} rx={4} />
          {[0.25, 0.5, 0.75].map((k) => <rect key={k} x={x + pipe - 11} y={top + (1090 - top) * k} width={22} height={8} rx={3} />)}
          <path d={`M${x + pipe - 7} 1084 h22 l10 16 h-32 z`} />
        </g>
      )}
      {children}
    </g>
  );
};

/** Балкон с решёткой (y — пол балкона). */
const Balcony = ({ x, y, w, color, rail = "#3a3a40", laundry }: { x: number; y: number; w: number; color: string; rail?: string; laundry?: boolean }) => (
  <g>
    <rect x={x - 10} y={y} width={w + 20} height={16} rx={3} fill={shade(color, -0.2)} />
    <rect x={x - 10} y={y + 16} width={w + 20} height={8} fill="#00000022" />
    <rect x={x - 6} y={y - 70} width={w + 12} height={8} rx={3} fill={rail} />
    {Array.from({ length: Math.floor(w / 16) + 1 }).map((_, i) => <rect key={i} x={x - 4 + i * 16} y={y - 64} width={4} height={64} fill={rail} />)}
    <path d={`M${x + 10} ${y - 40} q10 -16 20 0 q10 -16 20 0 q10 -16 20 0`} stroke={rail} strokeWidth={3} fill="none" />
    {laundry && (
      <g>
        <path d={`M${x} ${y - 110} Q${x + w / 2} ${y - 96} ${x + w} ${y - 110}`} stroke="#5a5a5a" strokeWidth={2} fill="none" />
        <rect x={x + 20} y={y - 104} width={30} height={40} rx={3} fill="#e0b0b0" />
        <path d={`M${x + 62} ${y - 102} h44 v18 h-10 v28 h-24 v-28 h-10 z`} fill="#8fb3d8" />
        <rect x={x + w - 54} y={y - 106} width={26} height={30} rx={3} fill="#f2e6d0" />
      </g>
    )}
    <path d={`M${x + w - 30} ${y - 70} h22 l-4 -24 h-14 z`} fill="#c8553d" />
    <circle cx={x + w - 19} cy={y - 104} r={16} fill="#5b8c5a" />
    <circle cx={x + w - 26} cy={y - 112} r={7} fill="#d8506a" />
  </g>
);

const Awning = ({ x, w, y, a, b, h = 60 }: { x: number; w: number; y: number; a: string; b: string; h?: number }) => {
  const n = Math.round(w / 44);
  const sw = w / n;
  return (
    <g>
      <rect x={x} y={y + h + 18} width={w} height={12} fill="#00000014" />
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <rect x={x + i * sw} y={y} width={sw} height={h} fill={i % 2 ? b : a} />
          <circle cx={x + i * sw + sw / 2} cy={y + h} r={sw / 2} fill={i % 2 ? b : a} />
        </g>
      ))}
      <rect x={x - 6} y={y - 6} width={w + 12} height={10} rx={4} fill={shade(a, -0.3)} />
    </g>
  );
};

/** Буханки и батоны на витрине. */
const Breads = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 6} y={y + 2} width={170} height={10} rx={4} fill="#a8774a" />
    <ellipse cx={x + 26} cy={y - 10} rx={28} ry={16} fill="#c9853f" />
    <path d={`M${x + 12} ${y - 18} l8 10 M${x + 26} ${y - 22} l8 10 M${x + 40} ${y - 18} l6 8`} stroke="#e8b070" strokeWidth={4} />
    <rect x={x + 62} y={y - 30} width={44} height={32} rx={12} fill="#8a5a2a" />
    <rect x={x + 62} y={y - 30} width={44} height={10} rx={5} fill="#a8703a" />
    <ellipse cx={x + 136} cy={y - 10} rx={26} ry={16} fill="#d89a50" />
    <circle cx={x + 136} cy={y - 10} r={6} fill="#c9853f" />
  </g>
);

const SIDEWALK_TOP = 1100;
const CURB_Y = 1250;

const Sidewalk = ({ asphalt }: { asphalt: string }) => (
  <g>
    <Paving y0={SIDEWALK_TOP} y1={CURB_Y} color="#bdb4a5" cell={100} />
    <rect x={0} y={SIDEWALK_TOP} width={W} height={14} fill="#00000014" />
    {/* бордюр, водосток, асфальт */}
    <rect x={0} y={CURB_Y} width={W} height={24} fill="#d6cfc2" />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={i * 96} y={CURB_Y} width={3} height={24} fill="#00000018" />)}
    <rect x={0} y={CURB_Y + 24} width={W} height={H - CURB_Y - 24} fill={asphalt} />
    <rect x={0} y={CURB_Y + 24} width={W} height={10} fill="#00000022" />
    <g>
      <rect x={430} y={CURB_Y + 30} width={90} height={22} rx={4} fill={shade(asphalt, -0.3)} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={438 + i * 16} y={CURB_Y + 34} width={8} height={14} fill={shade(asphalt, 0.1)} />)}
    </g>
    {[60, 400, 740].map((x) => <rect key={x} x={x} y={1560} width={200} height={22} rx={8} fill="#ffffff" opacity={0.35} />)}
    <rect x={0} y={1850} width={W} height={10} fill="#ffffff" opacity={0.25} />
    <Manhole x={860} y={1700} color={shade(asphalt, -0.12)} />
    <Cracks items={[[120, 1460, 1.2], [620, 1780, 1], [300, 1660, 0.8]]} />
    <path d="M700 1420 h120 v40 h-120 z" fill={shade(asphalt, 0.05)} />
  </g>
);

const Street = ({ palette }: BackdropProps) => {
  const t = useSign();
  return (
  <>
    <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
    <rect x={0} y={560} width={W} height={540} fill={shade(palette.wall, 0.12)} />
    <Puff x={760} y={470} s={0.45} color="#ffffffdd" under="#e6eef4" />
    <Puff x={80} y={120} s={0.55} color="#ffffff99" under="#ffffff66" />
    <Puff x={-60} y={480} s={0.3} color="#ffffffaa" under="#ffffff88" />
    <Birds items={[[520, 380, 1], [560, 400, 0.8], [600, 372, 0.7]]} />
    {/* дальний город */}
    <Skyline y={1000} color={shade(palette.wall, -0.1)} seed={2} />
    <Facade x={-20} w={320} top={560} color="#c8653d" cols={[60, 190]} seed={1} pipe={300} roof="chimney">
      {/* «Цветы»: витрина с вёдрами цветов */}
      <Sign x={124} y={884} w={156} h={34} text={t("flowers")} bg="#5b8c5a" size={22} />
      <Win x={30} y={950} w={130} h={100} frame="#f2e6d0">
        <rect x={30} y={1010} width={130} height={40} fill="#f2e6d0" />
      </Win>
      <rect x={20} y={1050} width={150} height={22} rx={6} fill="#8a5a3a" />
      {[40, 80, 120, 150].map((fx, i) => <circle key={fx} cx={fx} cy={1046} r={14} fill={i % 2 ? "#e0a030" : "#d8506a"} />)}
      {[50, 140].map((bx, i) => (
        <g key={bx}>
          <path d={`M${bx - 18} 1100 l4 -40 h28 l4 40 z`} fill="#8d93a0" />
          {[-10, 0, 10].map((d, k) => <circle key={d} cx={bx + d} cy={1052 - (k % 2) * 10} r={10} fill={["#d8506a", "#f2e6d0", "#e0a030"][(k + i) % 3]} />)}
        </g>
      ))}
      <rect x={190} y={920} width={84} height={180} rx={6} fill="#6b4429" />
      <rect x={200} y={932} width={64} height={70} rx={4} fill="#cfe6f5" opacity={0.6} />
      <circle cx={260} cy={1015} r={6} fill="#e0a030" />
      {/* табличка с названием улицы */}
      <rect x={196} y={590} width={92} height={40} rx={6} fill="#2f5f9a" />
      <rect x={200} y={594} width={84} height={32} rx={4} fill="none" stroke="#ffffff" strokeWidth={2} />
      <Label x={242} y={617} text={t("garden_street")} size={14} maxW={78} />
    </Facade>
    <Facade x={300} w={340} top={470} color="#ead7b2" cols={[50, 216]} seed={2} roof="antenna">
      <Balcony x={340} y={804} w={120} color="#ead7b2" laundry />
      {/* булочная «Хлеб» */}
      <Sign x={350} y={886} w={240} h={52} text={t("bread")} bg="#8a4a2a" fg="#f7e3b0" />
      <Awning x={310} w={320} y={944} a={palette.accent} b="#fff4e0" h={36} />
      <rect x={326} y={1004} width={190} height={96} rx={6} fill="#cfe6f5" />
      <path d="M340 1090 l60 -80 h30 l-60 80 z" fill="#ffffff" opacity={0.45} />
      <Breads x={336} y={1078} />
      <rect x={536} y={994} width={84} height={106} rx={6} fill="#8a5a3a" />
      <rect x={546} y={1004} width={64} height={46} rx={4} fill="#cfe6f5" opacity={0.7} />
      <circle cx={606} cy={1050} r={5} fill="#e0a030" />
      <Label x={578} y={1072} text="OPEN" size={12} color="#f7e3b0" maxW={60} />
    </Facade>
    {/* кот в окне */}
    <g fill="#3a3030">
      <ellipse cx={553} cy={632} rx={22} ry={16} />
      <circle cx={553} cy={607} r={15} />
      <path d="M540 599 l2 -16 l10 10 z M566 599 l-2 -16 l-10 10 z" />
      <path d="M573 639 q20 4 16 -20" stroke="#3a3030" strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
    <Facade x={640} w={240} top={600} color="#d9a44a" cols={[30, 136]} seed={3} roof="dish" pipe={232}>
      {/* аптека */}
      <Sign x={652} y={890} w={180} h={44} text={t("pharmacy")} bg="#2f8a5a" />
      <circle cx={846} cy={912} r={20} fill="#ffffff" />
      <path d="M840 898 h12 v8 h8 v12 h-8 v8 h-12 v-8 h-8 v-12 h8 z" fill="#2f8a5a" />
      <Win x={660} y={950} w={110} h={100}>
        <rect x={672} y={1010} width={86} height={8} fill="#ffffff" opacity={0.6} />
        {[684, 704, 724, 744].map((bx, i) => <rect key={bx} x={bx} y={994 - (i % 2) * 6} width={14} height={16 + (i % 2) * 6} rx={3} fill={["#e8e4d8", "#c8553d", "#4a7fb0", "#f2e6d0"][i]} />)}
      </Win>
      <rect x={790} y={940} width={70} height={160} rx={6} fill="#6b4429" />
      <rect x={798} y={950} width={54} height={60} rx={4} fill="#cfe6f5" opacity={0.6} />
    </Facade>
    <Facade x={880} w={220} top={520} color="#b98a63" cols={[40, 140]} seed={4} roof="antenna">
      <Balcony x={910} y={644} w={90} color="#b98a63" />
      {/* подъезд с номером дома и афиша */}
      <rect x={1000} y={940} width={90} height={160} rx={6} fill="#5a4a3a" />
      <rect x={994} y={928} width={102} height={12} rx={4} fill={shade("#b98a63", -0.3)} />
      <rect x={958} y={950} width={34} height={28} rx={4} fill="#2f5f9a" />
      <Label x={975} y={972} text="12" size={20} />
      <rect x={898} y={960} width={84} height={110} rx={4} fill="#f2e6d0" />
      <rect x={904} y={966} width={72} height={40} fill="#c8553d" />
      <Label x={940} y={994} text={t("circus")} size={20} maxW={66} />
      {[1016, 1028, 1040, 1052].map((ly) => <rect key={ly} x={908} y={ly} width={60 - (ly % 3) * 10} height={6} rx={3} fill="#8d93a0" />)}
    </Facade>
    {/* голуби на карнизе */}
    <Pigeon x={470} y={474} s={0.55} />
    <Pigeon x={505} y={474} s={0.5} flip />
    <Sidewalk asphalt={palette.floor} />
    <LeafyTree x={1060} y={1110} s={0.8} />
    <rect x={1010} y={1096} width={100} height={14} rx={4} fill="#8a7f70" />
    <LampPost x={100} top={560} />
    <Bin x={176} y={FLOOR_Y} s={0.75} />
    <ParkBench x0={0.72} x1={0.96} />
    <Pigeon x={640} y={1236} />
    <Pigeon x={690} y={1226} s={0.7} flip body="#9a9aa6" />
  </>
  );
};

const Park = ({ palette }: BackdropProps) => {
  const t = useSign();
  const grass = "#8fbf6a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <rect x={0} y={600} width={W} height={400} fill={shade(palette.wall, 0.15)} />
      <circle cx={880} cy={560} r={90} fill="#fbe7a6" opacity={0.35} />
      <circle cx={880} cy={560} r={70} fill="#fbe7a6" />
      <Puff x={60} y={520} s={0.5} color="#ffffffdd" under="#eef3f6" />
      <Puff x={560} y={640} s={0.3} color="#ffffffbb" />
      <Puff x={720} y={110} s={0.45} color="#ffffff88" under="#ffffff66" />
      <Birds items={[[400, 560, 1], [440, 585, 0.8], [700, 470, 0.7], [735, 488, 0.6]]} />
      {/* город вдалеке */}
      <Skyline y={960} color={shade(palette.wall, -0.08)} seed={5} />
      {/* полоса деревьев: дальняя (светлее) и ближняя */}
      <g fill="#8cba74">
        {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={i * 100 - 20} cy={900 - (i % 3) * 22} r={78} />)}
      </g>
      <g fill="#6fa25a">
        {[0, 120, 240, 360, 480, 600, 720, 840, 960, 1080].map((x, i) => <circle key={x} cx={x} cy={935 - (i % 3) * 25} r={92} />)}
      </g>
      <g fill="#86b96b">
        {[0, 120, 240, 360, 480, 600, 720, 840, 960, 1080].map((x, i) => <circle key={x} cx={x - 30} cy={880 - (i % 3) * 25} r={34} />)}
      </g>
      {/* тополя */}
      {[180, 820].map((x, i) => (
        <g key={x}>
          <rect x={x - 6} y={860} width={12} height={90} fill="#6b4a32" />
          <ellipse cx={x} cy={820 - i * 20} rx={42} ry={130} fill="#5b8c4c" />
          <ellipse cx={x - 12} cy={790 - i * 20} rx={18} ry={70} fill="#76a862" />
        </g>
      ))}
      <rect x={0} y={950} width={W} height={H - 950} fill={grass} />
      <rect x={0} y={950} width={W} height={20} fill="#00000012" />
      {/* дорожка с бортиком */}
      <path d="M470 950 L610 950 L900 1920 L180 1920 Z" fill="#e6d3a5" />
      <path d="M470 950 L490 950 L230 1920 L180 1920 Z" fill="#00000010" />
      <path d="M466 950 L472 950 L186 1920 L172 1920 Z M606 950 L614 950 L910 1920 L896 1920 Z" fill="#c9b88a" />
      {[[520, 1010, 3], [560, 1060, 4], [480, 1130, 4], [600, 1240, 5], [430, 1380, 6], [650, 1520, 6], [500, 1700, 7], [330, 1800, 6]].map(([x, y, r]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={r * 2} ry={r} fill="#c9b88a" />
      ))}
      {/* киоск «Мороженое» в конце аллеи */}
      <g>
        <rect x={640} y={890} width={110} height={70} rx={6} fill="#f2e6d0" />
        <rect x={650} y={906} width={90} height={30} rx={4} fill="#cfe6f5" />
        <path d="M630 892 h130 l-10 -30 h-110 z" fill="#d8506a" />
        <path d="M640 862 h20 v-6 h-20 z M680 862 h20 v-6 h-20 z M720 862 h20 v-6 h-20 z" fill="#ffffff" />
        <Label x={695} y={954} text={t("ice_cream")} size={11} color="#d8506a" maxW={96} />
      </g>
      {/* кусты и клумба */}
      <g fill="#5f9a4c">
        <circle cx={300} cy={1010} r={50} />
        <circle cx={360} cy={1020} r={40} />
        <circle cx={760} cy={1015} r={46} />
        <circle cx={808} cy={1028} r={30} />
      </g>
      <g fill="#78b060">
        <circle cx={290} cy={995} r={18} />
        <circle cx={752} cy={998} r={16} />
      </g>
      <ellipse cx={350} cy={1095} rx={110} ry={26} fill="#7a5236" />
      {[280, 310, 340, 370, 400, 420].map((fx, i) => <circle key={fx} cx={fx} cy={1086 - (i % 2) * 6} r={11} fill={["#d8506a", "#e0a030", "#ffffff"][i % 3]} />)}
      <LeafyTree x={90} y={1200} s={1.05} tones={["#3f6f45", "#5b8c5a", "#86b96b"]} />
      <LeafyTree x={1010} y={1180} s={0.95} tones={["#386640", "#4f8350", "#78ac62"]} flip />
      {/* белка на стволе */}
      <g transform="translate(1010 1040)">
        <path d="M14 -10 q30 -10 26 -50 q-4 -20 -20 -8 q10 20 -10 40 z" fill="#b5651d" />
        <ellipse cx={0} cy={0} rx={14} ry={22} fill="#c9773a" />
        <circle cx={-4} cy={-24} r={10} fill="#c9773a" />
        <circle cx={-8} cy={-26} r={2} fill="#2b1d14" />
      </g>
      <LampPost x={250} top={720} y={1110} glow={0} />
      <Bin x={186} y={1150} s={0.6} />
      <ParkBench x0={0.66} x1={0.9} color="#b0703f" />
      {/* шарик, привязанный к скамейке */}
      <path d={`M960 ${seatTopY(1)} q-10 -150 -20 -290`} stroke="#2b1d14" strokeWidth={3} fill="none" />
      <ellipse cx={940} cy={800} rx={34} ry={42} fill="#d8506a" />
      <ellipse cx={928} cy={786} rx={8} ry={12} fill="#ffffff" opacity={0.4} />
      <path d="M934 840 l6 10 l6 -10 z" fill="#d8506a" />
      {/* трава и цветы */}
      <Tufts color="#7aac58" items={[[60, 1280, 1], [140, 1460, 1.2], [960, 1300, 1], [1020, 1480, 1.3], [80, 1700, 1.4], [990, 1760, 1.4], [260, 1240, 0.8], [840, 1260, 0.8]]} />
      {[[60, 1320, "#e0a030"], [110, 1360, "#d8506a"], [960, 1340, "#ffffff"], [1010, 1300, "#e0a030"], [150, 1420, "#ffffff"], [920, 1420, "#d8506a"], [40, 1560, "#ffffff"]].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x as number} cy={y as number} r={14} fill={c as string} />
          <circle cx={x as number} cy={y as number} r={5} fill="#c8553d" />
        </g>
      ))}
    </>
  );
};

const Gravestone = ({ x, y, s = 1, color = "#8c8fa0", cross = false }: { x: number; y: number; s?: number; color?: string; cross?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={90} ry={16} fill="#00000022" />
    {cross ? (
      <>
        <rect x={-16} y={-230} width={32} height={230} rx={6} fill={color} />
        <rect x={-70} y={-180} width={140} height={32} rx={6} fill={color} />
        <rect x={6} y={-230} width={10} height={230} fill={shade(color, -0.15)} />
      </>
    ) : (
      <>
        <rect x={-74} y={-20} width={148} height={22} rx={4} fill={shade(color, -0.12)} />
        <path d="M-60 -18 V-130 a60 60 0 0 1 120 0 V-18 Z" fill={color} />
        <path d="M30 -18 V-160 a60 60 0 0 1 30 30 V-18 Z" fill={shade(color, -0.18)} />
        <ellipse cx={-6} cy={-138} rx={18} ry={22} fill={shade(color, -0.25)} />
        <rect x={-30} y={-100} width={50} height={8} rx={4} fill={shade(color, -0.2)} />
        <rect x={-30} y={-80} width={50} height={8} rx={4} fill={shade(color, -0.2)} />
        <path d="M-50 -20 q-10 -30 6 -46 q-4 20 8 46 z" fill="#3f5a3a" opacity={0.6} />
      </>
    )}
  </g>
);

/** Оградка вокруг могилы (вид спереди). */
const GraveFence = ({ x, y, w, h = 60, color = "#2e2a3a" }: { x: number; y: number; w: number; h?: number; color?: string }) => (
  <g fill={color}>
    <rect x={x} y={y - h} width={w} height={5} />
    <rect x={x} y={y - 12} width={w} height={4} />
    {Array.from({ length: Math.floor(w / 14) + 1 }).map((_, i) => (
      <g key={i}>
        <rect x={x + i * 14} y={y - h} width={3} height={h} />
        <path d={`M${x + i * 14 - 3} ${y - h} l4.5 -10 l4.5 10 z`} />
      </g>
    ))}
  </g>
);

const Cemetery = () => {
  const ground = "#4f5d4a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#4a4270" />
      <rect x={0} y={520} width={W} height={200} fill="#68507f" />
      <rect x={0} y={720} width={W} height={150} fill="#9b6280" />
      <rect x={0} y={870} width={W} height={150} fill="#d28a6c" />
      {/* звёзды (мелкие, вне плашки рассказчика — в основном) */}
      {Array.from({ length: 26 }).map((_, i) => (
        <circle key={i} cx={rnd(i + 3) * W} cy={60 + rnd(i + 40) * 640} r={2 + rnd(i + 9) * 3} fill="#f3e3b5" opacity={0.35 + rnd(i) * 0.5} />
      ))}
      <circle cx={800} cy={600} r={80} fill="#f3e3b5" opacity={0.12} />
      <circle cx={800} cy={600} r={58} fill="#f3e3b5" />
      <circle cx={822} cy={588} r={50} fill="#68507f" />
      {/* вытянутые облака */}
      <rect x={520} y={690} width={360} height={22} rx={11} fill="#7d5a85" />
      <rect x={600} y={716} width={300} height={16} rx={8} fill="#8a5f86" />
      <rect x={-20} y={820} width={380} height={20} rx={10} fill="#b77580" />
      <Birds items={[[420, 760, 1], [452, 780, 0.8]]} color="#2a2430" />
      {/* холмы, церковь вдалеке, ограда */}
      <path d="M0 990 Q260 900 520 980 T1080 960 V1040 H0 Z" fill="#3e3a52" />
      <g fill="#33304a">
        <rect x={640} y={880} width={70} height={100} />
        <rect x={662} y={820} width={26} height={60} />
        <path d="M656 822 q19 -46 38 0 z" />
        <rect x={673} y={760} width={4} height={30} />
        <rect x={666} y={770} width={18} height={4} />
        <path d="M630 884 L675 850 L720 884 Z" />
        <rect x={720} y={920} width={60} height={60} />
        <path d="M712 924 L750 896 L788 924 Z" />
      </g>
      <rect x={668} y={900} width={14} height={22} rx={7} fill="#e8c070" opacity={0.7} />
      <g fill="#2e2a3a">
        <rect x={0} y={985} width={W} height={8} />
        {Array.from({ length: 28 }).map((_, i) => <path key={i} d={`M${i * 40} 1030 v-60 l6 -10 l6 10 v60 z`} />)}
      </g>
      <rect x={0} y={1030} width={W} height={H - 1030} fill={ground} />
      <rect x={0} y={1030} width={W} height={16} fill="#00000018" />
      {/* туман у земли */}
      <rect x={0} y={1040} width={W} height={40} fill="#c8b8d8" opacity={0.12} />
      {/* дальний ряд: памятники и оградки */}
      {[[330, 1075], [470, 1070], [620, 1078], [760, 1072], [960, 1068]].map(([x, y]) => <Gravestone key={x} x={x} y={y} s={0.38} color="#6f7183" />)}
      <Gravestone x={560} y={1090} s={0.4} color="#6f7183" cross />
      <GraveFence x={430} y={1092} w={84} h={30} />
      <GraveFence x={720} y={1090} w={84} h={30} />
      {/* берёзка вдали */}
      <g>
        <rect x={895} y={900} width={10} height={170} fill="#c9c4cc" />
        {[930, 970, 1010].map((y) => <rect key={y} x={895} y={y} width={6} height={4} fill="#2a2430" />)}
        <ellipse cx={900} cy={900} rx={46} ry={70} fill="#3f4a4a" />
      </g>
      {/* голое дерево */}
      <g fill="none" stroke="#2a2430" strokeLinecap="round">
        <path d="M150 1200 C150 1000 170 850 140 640" strokeWidth={44} />
        <path d="M150 900 C210 840 260 820 330 760" strokeWidth={20} />
        <path d="M145 780 C100 730 80 690 40 660" strokeWidth={18} />
        <path d="M140 680 C170 620 200 590 250 560" strokeWidth={14} />
        <path d="M260 800 C280 760 300 740 330 700" strokeWidth={10} />
        <path d="M70 680 C60 640 70 610 60 580" strokeWidth={9} />
        <path d="M300 776 C330 780 350 770 372 750" strokeWidth={6} />
        <path d="M210 600 C230 580 236 560 232 540" strokeWidth={6} />
        <path d="M100 716 C80 700 60 710 40 700" strokeWidth={6} />
      </g>
      {/* вороны */}
      <g fill="#1e1a24">
        <ellipse cx={300} cy={755} rx={26} ry={16} />
        <circle cx={322} cy={740} r={12} />
        <path d="M332 740 l16 4 l-16 5 z" fill="#e0a030" />
        <path d="M278 752 l-26 10 l22 6 z" />
        <ellipse cx={226} cy={562} rx={18} ry={11} />
        <circle cx={212} cy={552} r={8} />
        <path d="M244 560 l18 6 l-16 4 z" />
      </g>
      {/* скамейка у оградки (метки bench-1, bench-2) */}
      <ParkBench x0={0.26} x1={0.5} color="#5a4a3a" metal="#2a2430" />
      <GraveFence x={560} y={1190} w={220} h={90} />
      <Gravestone x={880} y={1200} s={1} color="#9a9cac" />
      <Gravestone x={1040} y={1170} s={0.8} color="#868899" cross />
      <Gravestone x={70} y={1220} s={0.85} color="#8c8fa0" />
      {/* венок у креста */}
      <g transform="translate(1040 1120)">
        <circle cx={0} cy={0} r={34} fill="none" stroke="#3f6b3a" strokeWidth={16} />
        {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={34 * Math.cos((a * Math.PI) / 180)} cy={34 * Math.sin((a * Math.PI) / 180)} r={7} fill="#d8506a" />)}
        <path d="M-8 30 l-10 36 M8 30 l12 34" stroke="#2f2a6a" strokeWidth={7} />
      </g>
      {/* букетик, лампадка */}
      <rect x={846} y={1150} width={6} height={40} fill="#3f6b3a" />
      <circle cx={849} cy={1148} r={12} fill="#d8506a" />
      <circle cx={866} cy={1158} r={10} fill="#e0a030" />
      <rect x={906} y={1160} width={20} height={30} rx={4} fill="#c8553d" />
      <ellipse cx={916} cy={1156} rx={8} ry={12} fill="#f7dc8a" opacity={0.9} />
      <circle cx={916} cy={1160} r={26} fill="#f7dc8a" opacity={0.15} />
      {/* трава и опавшие листья */}
      <Tufts color="#43503f" items={[[60, 1300, 1.2], [300, 1420, 1], [700, 1350, 1.1], [980, 1460, 1.3], [180, 1600, 1.4], [860, 1680, 1.4]]} />
      {[[240, 1280], [520, 1330], [820, 1290], [400, 1520], [700, 1600]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={12} ry={6} fill={i % 2 ? "#8a5a3a" : "#a86a3a"} transform={`rotate(${i * 40} ${x} ${y})`} />)}
    </>
  );
};

const Stadium = ({ palette }: BackdropProps) => {
  const t = useSign();
  const crowd = ["#c8553d", "#e0a030", "#4a6fa5", "#f2e6d0", "#5b8c5a", "#8a5a3a"];
  const tiers = [620, 690, 760, 830, 900];
  const aisles = [260, 800];
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <Puff x={700} y={130} s={0.4} color="#ffffff88" under="#ffffff66" />
      {/* табло */}
      <g>
        <rect x={420} y={440} width={240} height={110} rx={10} fill="#2b2f36" />
        <rect x={432} y={452} width={216} height={86} rx={6} fill="#14181e" />
        <Label x={540} y={514} text="2 : 1" size={52} color="#f2b84b" />
        <rect x={470} y={550} width={16} height={30} fill="#4a4f5a" />
        <rect x={594} y={550} width={16} height={30} fill="#4a4f5a" />
      </g>
      {/* прожекторы */}
      {[80, 1000].map((x) => (
        <g key={x}>
          <path d={`M${x - 60} 470 L${x + (x < 540 ? 420 : -420)} 1000 L${x + (x < 540 ? 180 : -180)} 1000 Z`} fill="#fff4c8" opacity={0.08} />
          <rect x={x - 8} y={500} width={16} height={500} fill="#4a4f5a" />
          {[560, 640, 720, 800, 880].map((y) => <path key={y} d={`M${x - 8} ${y} l16 40 M${x + 8} ${y} l-16 40`} stroke="#5d6574" strokeWidth={4} />)}
          <rect x={x - 50} y={450} width={100} height={64} rx={8} fill="#4a4f5a" />
          {[-30, 0, 30].map((dx) => (
            <g key={dx}>
              <circle cx={x + dx} cy={474} r={11} fill="#fff4c8" />
              <circle cx={x + dx} cy={496} r={9} fill="#fff4c8" opacity={0.8} />
            </g>
          ))}
        </g>
      ))}
      {/* козырёк над трибуной */}
      <path d="M0 560 L1080 560 L1080 586 L0 586 Z" fill="#4a5260" />
      {[120, 360, 720, 960].map((x) => <rect key={x} x={x - 5} y={586} width={10} height={40} fill="#4a5260" />)}
      {/* трибуны */}
      <path d="M0 586 L1080 586 L1080 1000 L0 1000 Z" fill="#7d8796" />
      {tiers.map((ty, ti) => (
        <g key={ty}>
          <rect x={0} y={ty} width={W} height={60} fill={ti % 2 ? "#8b95a4" : "#97a1b0"} />
          {Array.from({ length: 27 }).map((_, i) => {
            const k = ti * 31 + i;
            const cx = i * 40 + 21 + (ti % 2) * 20;
            if (rnd(k) < 0.18 || aisles.some((a) => Math.abs(cx - a) < 26)) return null;
            const up = rnd(k + 11) > 0.82;
            return (
              <g key={i}>
                <rect x={cx - 13} y={ty + 26} width={26} height={30} rx={10} fill={crowd[Math.floor(rnd(k + 7) * crowd.length)]} />
                <circle cx={cx} cy={ty + 18} r={11} fill={rnd(k + 3) < 0.5 ? "#f1c9a5" : "#c99872"} />
                {up && <rect x={cx + 8} y={ty - 6} width={6} height={26} rx={3} fill="#f1c9a5" />}
              </g>
            );
          })}
        </g>
      ))}
      {aisles.map((a) => (
        <g key={a}>
          <rect x={a - 22} y={600} width={44} height={400} fill="#a7b0bd" />
          {tiers.map((ty) => <rect key={ty} x={a - 22} y={ty + 30} width={44} height={6} fill="#8b95a4" />)}
        </g>
      ))}
      <rect x={0} y={586} width={W} height={384} fill={palette.wall} opacity={0.4} />
      {/* флаги и растяжка болельщиков */}
      <g>
        <path d="M150 760 l0 -100" stroke="#3a3a40" strokeWidth={5} />
        <path d="M150 660 h70 v44 h-70 z" fill="#c8553d" />
        <path d="M150 682 h70 v10 h-70 z" fill="#f2e6d0" />
        <path d="M930 840 l0 -100" stroke="#3a3a40" strokeWidth={5} />
        <path d="M930 740 h-70 v44 h70 z" fill="#4a6fa5" />
        <path d="M860 754 h70 v12 h-70 z" fill="#e0a030" />
        <rect x={340} y={846} width={400} height={50} rx={6} fill="#f2e6d0" />
        <Label x={540} y={884} text={t("go_team")} size={36} color="#c8553d" maxW={370} />
      </g>
      {/* рекламный борт */}
      {["sport", "milk", "lotto", "juice", "sport", "milk"].map((key, i) => {
        const bg = [palette.accent, "#c8553d", "#4a6fa5"][i % 3];
        return (
          <g key={i}>
            <rect x={i * 180} y={960} width={180} height={50} fill={bg} />
            <rect x={i * 180} y={960} width={4} height={50} fill="#00000022" />
            <Label x={i * 180 + 90} y={995} text={t(key)} size={26} color="#ffffff" maxW={160} />
          </g>
        );
      })}
      {/* поле */}
      <rect x={0} y={1010} width={W} height={H - 1010} fill="#5f9e4f" />
      {[1010, 1090, 1190, 1310, 1460, 1640].map((y, i) => i % 2 ? <rect key={y} x={0} y={y} width={W} height={[80, 100, 120, 150, 180, 280][i]} fill="#6aa95a" /> : null)}
      <rect x={0} y={1010} width={W} height={14} fill="#00000018" />
      <rect x={0} y={1290} width={W} height={10} fill="#ffffff" opacity={0.7} />
      <path d="M200 1920 Q540 1560 880 1920" stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.6} />
      <circle cx={540} cy={1760} r={9} fill="#ffffff" opacity={0.7} />
      {/* угловой флажок */}
      <rect x={1040} y={1220} width={6} height={90} fill="#f2e6d0" />
      <path d="M1046 1222 l34 12 l-34 14 z" fill="#e0a030" />
      {/* передний ряд трибуны: бетонная ступень и пластиковые кресла (метки seat-1…seat-4 — через одно) */}
      <rect x={0} y={1024} width={W} height={FLOOR_Y - 1024} fill="#9aa3b0" />
      <rect x={0} y={1024} width={W} height={12} fill="#b4bcc8" />
      <rect x={0} y={FLOOR_Y - 8} width={W} height={8} fill="#00000022" />
      {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((x, i) => (
        <StadiumSeat key={x} x={x} color={i % 2 ? palette.accent : "#c8553d"} />
      ))}
      {/* бутылка воды и шарф на бетоне */}
      <rect x={1030} y={1120} width={16} height={40} rx={5} fill="#8fc3dc" opacity={0.9} />
      {/* мяч */}
      <circle cx={880} cy={1330} r={30} fill="#ffffff" />
      <path d="M880 1314 l14 10 l-6 16 h-16 l-6 -16 z" fill="#2b2b2b" />
      <ellipse cx={880} cy={1362} rx={30} ry={6} fill="#00000022" />
    </>
  );
};

/** Пластиковое кресло трибуны на дальнем плане: верх сиденья = seatTopY(1). */
const StadiumSeat = ({ x, color }: { x: number; color: string }) => {
  const s = depthScale(1);
  const cx = x * W;
  const top = seatTopY(1);
  const hw = 60 * s;
  return (
    <g>
      <rect x={cx - 8 * s} y={top + 16 * s} width={16 * s} height={FLOOR_Y - top - 16 * s} fill="#5a606a" />
      <path d={`M${cx - hw + 6 * s} ${top} V${top - 76 * s} Q${cx} ${top - 100 * s} ${cx + hw - 6 * s} ${top - 76 * s} V${top} Z`} fill={color} />
      <rect x={cx - hw + 18 * s} y={top - 70 * s} width={2 * hw - 36 * s} height={8 * s} rx={4 * s} fill={shade(color, 0.2)} />
      <rect x={cx - hw} y={top - 6 * s} width={2 * hw} height={26 * s} rx={10 * s} fill={shade(color, -0.12)} />
      <rect x={cx - hw} y={top - 6 * s} width={2 * hw} height={8 * s} rx={4 * s} fill={shade(color, 0.12)} />
    </g>
  );
};

const Zoo = ({ palette }: BackdropProps) => {
  const t = useSign();
  const sand = "#dcc38e";
  const bar = "#4f5562";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <rect x={0} y={620} width={W} height={380} fill={shade(palette.wall, 0.15)} />
      <Puff x={720} y={480} s={0.45} color="#ffffffdd" under="#eef3f6" />
      <Puff x={120} y={130} s={0.4} color="#ffffff88" under="#ffffff66" />
      <Birds items={[[380, 520, 1], [416, 540, 0.8], [900, 640, 0.7]]} />
      {/* деревья дальнего плана: два слоя */}
      <g fill="#97c27a">
        {Array.from({ length: 11 }).map((_, i) => <circle key={i} cx={i * 110 - 40} cy={890 - (i % 2) * 30} r={80} />)}
      </g>
      <g fill="#7fae62">
        {[0, 140, 280, 420, 560, 700, 840, 980].map((x, i) => <circle key={x} cx={x} cy={940 - (i % 2) * 30} r={100} />)}
      </g>
      {/* слон за деревьями */}
      <g transform="translate(470 985)">
        <ellipse cx={0} cy={-70} rx={90} ry={60} fill="#9aa0aa" />
        <circle cx={-80} cy={-90} r={44} fill="#a6acb6" />
        <ellipse cx={-62} cy={-86} rx={26} ry={36} fill="#8a909a" />
        <path d="M-112 -80 q-20 40 -6 76 h14 q-10 -36 8 -66 z" fill="#a6acb6" />
        <circle cx={-96} cy={-100} r={4} fill="#2b1d14" />
        <path d="M-108 -70 q-12 6 -20 0" stroke="#f2e6d0" strokeWidth={6} fill="none" strokeLinecap="round" />
        {[-50, -10, 30, 60].map((dx) => <rect key={dx} x={dx - 12} y={-30} width={24} height={30} rx={6} fill="#9aa0aa" />)}
      </g>
      {/* акация у жирафа */}
      <g>
        <path d="M330 1000 L338 860 L300 820 M338 880 L380 830" stroke="#7a5236" strokeWidth={14} fill="none" strokeLinecap="round" />
        <ellipse cx={330} cy={810} rx={110} ry={30} fill="#6f9a52" />
        <ellipse cx={360} cy={790} rx={70} ry={22} fill="#86b062" />
      </g>
      {/* жираф за низким забором */}
      <g>
        <rect x={160} y={720} width={44} height={300} rx={20} fill="#e3b04b" transform="rotate(12 182 1000)" />
        <ellipse cx={190} cy={960} rx={110} ry={60} fill="#e3b04b" />
        <g transform="rotate(12 182 1000)">
          <ellipse cx={172} cy={700} rx={44} ry={28} fill="#e3b04b" />
          <rect x={150} y={658} width={8} height={26} rx={4} fill="#8a5a3a" />
          <rect x={174} y={656} width={8} height={26} rx={4} fill="#8a5a3a" />
          <circle cx={150} cy={696} r={5} fill="#2b1d14" />
          <ellipse cx={136} cy={712} rx={14} ry={10} fill="#d4a040" />
          <path d="M192 700 q14 -6 20 4" stroke="#d4a040" strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
        {[[150, 950], [230, 940], [200, 980], [120, 975], [195, 860], [205, 780], [260, 960], [170, 920]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={12} fill="#a8673f" />
        ))}
      </g>
      <rect x={0} y={990} width={W} height={H - 990} fill={sand} />
      <rect x={0} y={990} width={W} height={14} fill="#00000012" />
      {/* низкий деревянный забор с табличкой */}
      <g fill="#a8774a">
        <rect x={0} y={1000} width={400} height={16} />
        <rect x={0} y={1040} width={400} height={16} />
        {[20, 110, 200, 290, 380].map((x) => <rect key={x} x={x} y={985} width={18} height={95} rx={4} />)}
      </g>
      <Sign x={60} y={1012} w={100} h={34} text={t("giraffe")} bg="#2f6b4a" size={18} />
      {/* клетка со львом */}
      <rect x={600} y={640} width={480} height={460} fill="#00000014" />
      <path d="M620 1080 Q700 980 800 1000 Q900 960 1080 1000 V1080 Z" fill="#b89a6a" />
      <rect x={590} y={1080} width={500} height={40} rx={6} fill="#9a8a6a" />
      <g>
        <ellipse cx={900} cy={1050} rx={120} ry={45} fill="#d79a3e" />
        <rect x={990} y={1000} width={70} height={14} rx={7} fill="#d79a3e" transform="rotate(-20 990 1000)" />
        <circle cx={1052} cy={978} r={12} fill="#9a5a2a" />
        <circle cx={790} cy={1000} r={70} fill="#9a5a2a" />
        <circle cx={790} cy={1000} r={58} fill="#b06a30" />
        <circle cx={790} cy={1008} r={44} fill="#e0aa4e" />
        <circle cx={776} cy={998} r={5} fill="#2b1d14" />
        <circle cx={804} cy={998} r={5} fill="#2b1d14" />
        <ellipse cx={790} cy={1020} rx={10} ry={7} fill="#5a3a2a" />
      </g>
      <rect x={590} y={630} width={500} height={24} rx={6} fill={bar} />
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i}>
          <rect x={610 + i * 42} y={650} width={10} height={440} fill={bar} />
          <rect x={612 + i * 42} y={650} width={3} height={440} fill="#ffffff" opacity={0.15} />
        </g>
      ))}
      <rect x={590} y={860} width={500} height={10} fill={bar} />
      <Sign x={790} y={590} w={120} h={40} text={t("lion")} bg="#8a4a2a" size={24} />
      {/* табличка-лапка */}
      <rect x={496} y={1000} width={10} height={130} fill="#6b4429" />
      <rect x={446} y={940} width={110} height={80} rx={10} fill="#f2e6d0" />
      <g fill="#8a5a3a">
        <ellipse cx={501} cy={990} rx={16} ry={13} />
        <circle cx={482} cy={968} r={7} />
        <circle cx={496} cy={960} r={7} />
        <circle cx={510} cy={960} r={7} />
        <circle cx={522} cy={968} r={7} />
      </g>
      {/* следы и камешки на песке */}
      {[[200, 1320], [260, 1350], [320, 1325], [380, 1355], [860, 1500], [920, 1530]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={12} ry={6} fill="#c9ae78" />)}
      {[[100, 1600], [700, 1700], [980, 1380], [480, 1820]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={10} ry={5} fill="#b89a6a" />)}
      <Tufts color="#a8b86a" items={[[40, 1200, 1], [560, 1200, 0.8], [1040, 1220, 1]]} />
    </>
  );
};

// ——— Двор пятиэтажки: yard (день) и yard-night (ночь) — один рисунок с флагом night ———

/** Смешать цвет a с цветом b (k = доля b). */
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const x = p(a), y = p(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * k));
  return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
};

const NIGHT_INK = "#141c38";
const LIT = "#f7d774";

/** Разметка двора (доли кадра) — совпадает с метками yard / yard-night в content/locations/ulitsa.json. */
const YARD = { entrance: 0.28, bench: [0.36, 0.6] as const, swing: 0.72, sandbox: 0.3 };
const BLD = { x0: -20, x1: 1100, top: 540, base: 1112, floors: 5 };
const FLOOR_H = (BLD.base - 30 - (BLD.top + 30)) / BLD.floors;
/** Окна квартир (центры x) и лестничная клетка над подъездом. */
const APT_COLS = [70, 150, 470, 570, 690, 790, 930, 1030];
/** Ночью горят эти окна: [этаж 0 = верхний, колонка]; [0, 2] — верхний этаж справа от подъезда, оттуда кричат. */
const LIT_WINDOWS = [[0, 2], [1, 4], [2, 6], [3, 2], [4, 7], [2, 0], [1, 7]];
const BALCONIES = [[1, 4], [2, 4], [3, 4], [1, 6], [2, 6], [3, 6]];

const Yard = ({ night = false }: { night?: boolean }) => {
  /** Ночной тон: краски уходят в тёмно-синий. */
  const t = (hex: string, k = 0.62) => (night ? mix(hex, NIGHT_INK, k) : hex);
  const sky = night ? "#1b2550" : "#a9c4d8";
  const panel = t("#d9d2c2");
  const seam = shade(panel, -0.1);
  const ex = YARD.entrance * W;
  const sw = YARD.swing * W;
  const swingTop = seatTopY(0.5);
  const midY = feetY(0.5);
  const lampHead = { x: sw - 10, y: 470 };
  const floorTop = (f: number) => BLD.top + 30 + f * FLOOR_H;
  return (
    <>
      {/* небо */}
      <rect x={0} y={0} width={W} height={H} fill={sky} />
      {night ? (
        <>
          <rect x={0} y={420} width={W} height={160} fill="#22306a" />
          {Array.from({ length: 40 }).map((_, i) => (
            <circle key={i} cx={rnd(i + 7) * W} cy={40 + rnd(i + 61) * 500} r={1.5 + rnd(i + 19) * 3} fill="#f3e9c0" opacity={0.3 + rnd(i + 3) * 0.6} />
          ))}
          <circle cx={170} cy={470} r={86} fill="#f3e9c0" opacity={0.1} />
          <circle cx={170} cy={470} r={54} fill="#f3e9c0" />
          <circle cx={156} cy={456} r={12} fill="#e2d6a6" />
          <circle cx={186} cy={488} r={8} fill="#e2d6a6" />
          <circle cx={182} cy={448} r={6} fill="#e2d6a6" />
        </>
      ) : (
        <>
          <rect x={0} y={430} width={W} height={120} fill={shade(sky, 0.12)} />
          <Puff x={720} y={150} s={0.45} color="#ffffff88" under="#ffffff66" />
          <Puff x={40} y={420} s={0.35} color="#ffffffcc" under="#eef3f6" />
          <Birds items={[[640, 470, 0.9], [676, 488, 0.7]]} />
        </>
      )}
      {/* крыша: парапет, антенны, вентшахты */}
      <g fill={t("#5a5650")}>
        {[260, 640, 980].map((x) => <rect key={x} x={x} y={BLD.top - 34} width={46} height={40} />)}
      </g>
      <g stroke={t("#4a4a4a")} strokeWidth={5} fill="none" strokeLinecap="round">
        {[[400, 70], [580, 90]].map(([x, h]) => (
          <path key={x} d={`M${x} ${BLD.top} V${BLD.top - h} M${x - 30} ${BLD.top - h + 10} H${x + 30} M${x - 20} ${BLD.top - h + 28} H${x + 20} M${x - 12} ${BLD.top - h + 44} H${x + 12}`} />
        ))}
      </g>
      {/* фасад пятиэтажки: панели со швами */}
      <rect x={BLD.x0} y={BLD.top} width={BLD.x1 - BLD.x0} height={BLD.base - BLD.top} fill={panel} />
      <rect x={BLD.x0 - 8} y={BLD.top - 8} width={BLD.x1 - BLD.x0 + 16} height={26} rx={3} fill={shade(panel, -0.22)} />
      {Array.from({ length: BLD.floors + 1 }).map((_, f) => <rect key={f} x={BLD.x0} y={floorTop(f) - 4} width={BLD.x1 - BLD.x0} height={5} fill={seam} />)}
      {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={-20 + i * 120 + 100} y={BLD.top + 18} width={4} height={BLD.base - 30 - BLD.top - 18} fill={seam} opacity={0.7} />)}
      {/* цоколь с продухами */}
      <rect x={BLD.x0} y={BLD.base - 30} width={BLD.x1 - BLD.x0} height={30} fill={t("#9a8f80")} />
      {[60, 180, 500, 620, 740, 860, 980].map((x) => <rect key={x} x={x} y={BLD.base - 22} width={34} height={14} rx={3} fill={t("#3e3a36")} />)}
      {/* окна квартир */}
      {Array.from({ length: BLD.floors }).map((_, f) =>
        APT_COLS.map((cx, c) => {
          const lit = night && LIT_WINDOWS.some(([lf, lc]) => lf === f && lc === c);
          const k = f * 17 + c * 5 + 3;
          const y = floorTop(f) + 22;
          const groundEntrance = f === BLD.floors - 1 && Math.abs(cx - ex) < 140;
          if (groundEntrance) return null;
          return (
            <g key={`${f}-${c}`}>
              {lit && <rect x={cx - 52} y={y - 18} width={104} height={108} rx={20} fill={LIT} opacity={0.18} />}
              <Win x={cx - 30} y={y} w={60} h={66} frame={t("#f2ece0")} glass={night ? "#24305a" : "#bcd6e8"} lit={lit} curtain={rnd(k) > 0.4 ? t(WIN_CURTAINS[Math.floor(rnd(k + 1) * WIN_CURTAINS.length)], lit ? 0.15 : 0.62) : undefined} flowers={!night && rnd(k + 2) > 0.8 ? "#d8506a" : undefined}>
                {lit && f === 0 && c === 2 && (
                  /* силуэт в окне верхнего этажа: кто-то выглянул */
                  <g fill="#3a2e2a">
                    <circle cx={cx + 10} cy={y + 30} r={12} />
                    <path d={`M${cx - 6} ${y + 66} q2 -22 16 -24 q14 2 16 24 z`} />
                  </g>
                )}
              </Win>
            </g>
          );
        }),
      )}
      {/* балконы с бельём и цветами */}
      {BALCONIES.map(([f, c]) => {
        const cx = APT_COLS[c];
        const y = floorTop(f) + FLOOR_H - 8;
        const rail = t("#7a6f62");
        return (
          <g key={`b${f}-${c}`}>
            <rect x={cx - 66} y={y} width={132} height={12} fill={shade(panel, -0.25)} />
            <rect x={cx - 64} y={y - 44} width={128} height={44} fill={rail} />
            {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={cx - 58 + i * 16} y={y - 40} width={6} height={36} fill={shade(rail, -0.2)} />)}
            <rect x={cx - 68} y={y - 50} width={136} height={8} rx={3} fill={shade(rail, -0.3)} />
            {f === 2 && <rect x={cx - 44} y={y - 82} width={26} height={34} rx={3} fill={t("#e0b0b0")} />}
            {f === 3 && <circle cx={cx + 42} cy={y - 60} r={14} fill={t("#5b8c5a")} />}
          </g>
        );
      })}
      {/* лестничная клетка над подъездом: узкие окна между этажами */}
      {Array.from({ length: BLD.floors - 1 }).map((_, f) => {
        const y = floorTop(f) + FLOOR_H * 0.55;
        const lit = night && f >= 1;
        return (
          <g key={`st${f}`}>
            <rect x={ex - 26} y={y} width={52} height={70} rx={4} fill={t("#f2ece0")} />
            <rect x={ex - 20} y={y + 6} width={40} height={58} rx={2} fill={lit ? "#e8d48a" : night ? "#24305a" : "#c5d6dc"} />
            {[0, 1, 2].map((r) => <rect key={r} x={ex - 20} y={y + 22 + r * 14} width={40} height={2} fill={t("#a0a8a8")} />)}
            <rect x={ex - 1} y={y + 6} width={2} height={58} fill={t("#a0a8a8")} />
          </g>
        );
      })}
      {/* подъезд: козырёк с лампой, дверь с домофоном, табличка */}
      <g>
        {night && <path d={`M${ex - 30} 964 L${ex - 110} ${BLD.base + 70} H${ex + 110} L${ex + 30} 964 Z`} fill={LIT} opacity={0.14} />}
        <rect x={ex - 54} y={970} width={108} height={BLD.base - 970} fill={t("#7a6e60")} />
        <rect x={ex - 44} y={980} width={88} height={BLD.base - 980} rx={4} fill={t("#5e4636")} />
        <rect x={ex - 36} y={990} width={72} height={46} rx={3} fill={night ? "#2a3050" : t("#8fa8b8")} />
        <rect x={ex - 36} y={1046} width={72} height={52} rx={3} fill={shade(t("#5e4636"), -0.12)} />
        <rect x={ex + 26} y={1050} width={10} height={24} rx={3} fill={t("#c8b070")} />
        <rect x={ex + 56} y={1000} width={22} height={36} rx={3} fill={t("#3a3a40")} />
        {[0, 1, 2].map((r) => <circle key={r} cx={ex + 67} cy={1010 + r * 9} r={2.5} fill={t("#c8c8c8")} />)}
        {/* объявления на стене */}
        <rect x={ex - 92} y={1000} width={28} height={36} fill={t("#f2ece0")} transform={`rotate(-4 ${ex - 78} 1018)`} />
        <rect x={ex - 88} y={1046} width={24} height={22} fill={t("#f7e3a0")} transform={`rotate(3 ${ex - 76} 1057)`} />
        {/* козырёк */}
        <rect x={ex - 92} y={946} width={184} height={22} fill={shade(panel, -0.2)} />
        <rect x={ex - 92} y={964} width={184} height={6} fill="#00000030" />
        <rect x={ex - 14} y={970} width={28} height={10} rx={4} fill={night ? "#fff2b8" : t("#e6e0c8")} />
        {night && <circle cx={ex} cy={976} r={34} fill={LIT} opacity={0.3} />}
        {/* номер подъезда и квартир */}
        <rect x={ex - 40} y={914} width={80} height={26} rx={4} fill={t("#2f5f9a")} />
        <Label x={ex} y={934} text="1–20" size={18} color={t("#ffffff", 0.4)} />
        {/* крыльцо */}
        <rect x={ex - 70} y={BLD.base - 6} width={140} height={14} fill={t("#a8a094")} />
      </g>
      {/* табличка с номером дома на углу */}
      <rect x={1000} y={600} width={64} height={44} rx={6} fill={t("#2f5f9a")} />
      <Label x={1032} y={632} text="7" size={30} color={t("#ffffff", 0.4)} />
      {/* дерево слева и тополь справа */}
      <LeafyTree x={60} y={1150} s={1.05} tones={[t("#3f6f45"), t("#5b8c5a"), t("#7fb06a")]} trunk={t("#6b4a32")} />
      {/* земля: асфальт вдоль дома, бордюр, двор */}
      <rect x={0} y={BLD.base} width={W} height={H - BLD.base} fill={t("#9aa86a")} />
      <rect x={0} y={BLD.base} width={W} height={1196 - BLD.base} fill={t("#8a8a86")} />
      <rect x={0} y={BLD.base} width={W} height={10} fill="#00000022" />
      <rect x={0} y={1196} width={W} height={14} fill={t("#c8c2b4")} />
      <rect x={0} y={1210} width={W} height={8} fill="#00000018" />
      {/* вытоптанные дорожки и проплешины */}
      <path d={`M${ex - 70} 1218 C${ex - 40} 1400 ${ex + 160} 1560 ${ex + 120} 1920 H${ex + 330} C${ex + 360} 1600 ${ex + 120} 1420 ${ex + 70} 1218 Z`} fill={t("#c2ad82")} />
      <ellipse cx={sw} cy={midY + 6} rx={150} ry={26} fill={t("#b49e74")} />
      <Tufts color={t("#7f9a52")} items={[[40, 1300, 1.1], [980, 1340, 1], [60, 1560, 1.3], [1010, 1620, 1.3], [620, 1480, 0.9], [880, 1780, 1.4], [160, 1820, 1.2]]} />
      <ellipse cx={760} cy={1660} rx={90} ry={18} fill={night ? "#2a3560" : "#8fb3c8"} opacity={0.6} />
      <Cracks items={[[400, 1150, 0.9], [820, 1170, 0.8]]} />
      {/* бельевые верёвки на столбах (за домом слева) */}
      <g>
        {[30, 210].map((x) => (
          <g key={x} fill={t("#5a5650")}>
            <rect x={x - 5} y={830} width={10} height={1150 - 830} />
            <rect x={x - 34} y={826} width={68} height={8} rx={3} />
          </g>
        ))}
        <path d="M0 834 Q120 856 240 834 M0 846 Q120 868 240 846" stroke={t("#e8e4d8")} strokeWidth={2} fill="none" />
        <rect x={40} y={848} width={74} height={92} rx={2} fill={t("#f2ece0")} />
        <rect x={40} y={848} width={74} height={10} fill={t("#c9d6e8")} />
        <path d="M128 852 h48 v18 h-10 v34 h-28 v-34 h-10 z" fill={t("#8fb3d8")} />
        <rect x={186} y={850} width={14} height={26} rx={3} fill={t("#d8506a")} />
        <rect x={204} y={846} width={14} height={26} rx={3} fill={t("#e0a030")} />
      </g>
      {/* старые «Жигули» у края кадра справа (капот влево) */}
      <g transform={`translate(${W + 70} 1196) scale(${-0.5} 0.5)`}>
        <path d="M-430 -75 L-430 -262 Q-430 -296 -398 -298 L-352 -302 L-298 -538 Q-290 -562 -262 -562 L200 -562 Q226 -562 236 -540 L305 -304 L405 -296 Q440 -292 440 -260 L440 -75 Q440 -45 412 -45 L-402 -45 Q-430 -45 -430 -75 Z" fill={t("#c8553d")} />
        <path d="M-12 -300 L-12 -528 L196 -528 L264 -300 Z M-42 -300 L-42 -528 L-262 -528 L-321 -300 Z" fill={night ? "#1a2240" : "#9fc0d4"} />
        <rect x={-440} y={-212} width={890} height={9} fill={t("#d8dce0")} />
        <rect x={-440} y={-112} width={890} height={60} fill={shade(t("#c8553d"), -0.22)} />
        {[300, -300].map((x) => (
          <g key={x}>
            <circle cx={x} cy={-60} r={78} fill={t("#1d1f23")} />
            <circle cx={x} cy={-60} r={34} fill={t("#b8bcc2")} />
          </g>
        ))}
        <rect x={428} y={-272} width={16} height={36} rx={6} fill={night ? "#3a3a30" : "#f2eecc"} />
      </g>
      {/* мусорные контейнеры перед машиной */}
      <g>
        {[[938, "#4f6b52"], [1016, "#5a6a7a"]].map(([x, c]) => (
          <g key={x as number}>
            <path d={`M${(x as number) - 34} 1100 h68 l-5 82 h-58 z`} fill={t(c as string)} />
            <rect x={(x as number) - 40} y={1090} width={80} height={13} rx={4} fill={shade(t(c as string), -0.25)} />
            <rect x={(x as number) - 22} y={1118} width={44} height={6} rx={3} fill={shade(t(c as string), 0.15)} />
            <circle cx={(x as number) - 24} cy={1186} r={7} fill={t("#2b2b2b")} />
            <circle cx={(x as number) + 24} cy={1186} r={7} fill={t("#2b2b2b")} />
          </g>
        ))}
        <path d="M990 1090 q18 -22 40 -6 l-8 9 z" fill={t("#e8e4d8")} />
      </g>
      {/* фонарь двора: столб справа, «кобра» над качелями */}
      <g>
        <path d={`M1050 1190 V560 Q1050 ${lampHead.y - 20} ${lampHead.x + 120} ${lampHead.y - 14} L${lampHead.x + 20} ${lampHead.y - 6}`} stroke={t("#6a6a6e")} strokeWidth={16} fill="none" strokeLinecap="round" />
        <rect x={1040} y={1100} width={20} height={90} fill={t("#5a5a5e")} />
        <path d={`M${lampHead.x - 50} ${lampHead.y} Q${lampHead.x - 10} ${lampHead.y - 34} ${lampHead.x + 46} ${lampHead.y - 14} L${lampHead.x + 40} ${lampHead.y + 8} Z`} fill={t("#4a4a50")} />
        <ellipse cx={lampHead.x} cy={lampHead.y + 6} rx={42} ry={10} fill={night ? "#fff6c8" : t("#d8dce0")} />
      </g>
      {night && (
        /* конус света над качелями и пятно на земле */
        <g>
          <path d={`M${lampHead.x - 40} ${lampHead.y + 8} L${sw - 240} ${midY + 20} H${sw + 230} L${lampHead.x + 40} ${lampHead.y + 8} Z`} fill={LIT} opacity={0.13} />
          <path d={`M${lampHead.x - 26} ${lampHead.y + 8} L${sw - 140} ${midY + 10} H${sw + 130} L${lampHead.x + 26} ${lampHead.y + 8} Z`} fill={LIT} opacity={0.1} />
          <ellipse cx={sw} cy={midY + 10} rx={250} ry={44} fill={LIT} opacity={0.22} />
          <circle cx={lampHead.x} cy={lampHead.y + 8} r={60} fill={LIT} opacity={0.25} />
        </g>
      )}
      {/* горка слева (дальний план) */}
      <g>
        {(() => {
          const c = t("#d8506a");
          const m = t("#4a6fa5");
          return (
            <g>
              <path d="M70 1186 L100 900 M120 1186 L150 900" stroke={m} strokeWidth={8} />
              {[930, 970, 1010, 1050, 1090, 1130].map((y) => <rect key={y} x={70 + (1186 - y) * 0.1 + 8} y={y} width={44} height={6} fill={m} />)}
              <rect x={92} y={890} width={74} height={14} rx={4} fill={m} />
              <path d="M150 894 Q170 900 200 1000 Q228 1150 270 1176 L270 1192 L250 1192 Q206 1160 180 1010 Q160 920 140 910 Z" fill={c} />
              <path d="M150 894 Q170 900 200 1000 Q228 1150 270 1176" stroke={shade(c, 0.25)} strokeWidth={5} fill="none" />
            </g>
          );
        })()}
      </g>
      {/* скамейка у подъезда (bench-1, bench-2) */}
      <ParkBench x0={YARD.bench[0]} x1={YARD.bench[1]} color={t("#6f8f4a")} metal={t("#3a3a40")} />
      {/* семечки и кот под скамейкой */}
      <g fill={t("#3a3030")}>
        <ellipse cx={600} cy={1180} rx={22} ry={12} />
        <circle cx={582} cy={1168} r={10} />
        <path d="M575 1162 l1 -10 l7 6 z M589 1162 l-1 -10 l-7 6 z" />
        <path d="M620 1180 q18 2 16 -16" stroke={t("#3a3030")} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      {/* песочница (средний план): бортик, песок, ведёрко, совок, куличики */}
      {(() => {
        const cx = YARD.sandbox * W;
        const wood = t("#c9853f");
        const sand = t("#e8cf8e");
        return (
          <g>
            <path d={`M${cx - 170} ${midY - 30} L${cx + 170} ${midY - 30} L${cx + 190} ${midY + 40} L${cx - 190} ${midY + 40} Z`} fill={sand} />
            <path d={`M${cx - 176} ${midY - 40} H${cx + 176} V${midY - 26} H${cx - 176} Z`} fill={shade(wood, -0.1)} />
            <path d={`M${cx - 196} ${midY + 36} H${cx + 196} V${midY + 60} H${cx - 196} Z`} fill={wood} />
            <rect x={cx - 196} y={midY + 36} width={392} height={7} fill={shade(wood, 0.15)} />
            <path d={`M${cx - 176} ${midY - 40} L${cx - 196} ${midY + 60} H${cx - 180} L${cx - 162} ${midY - 40} Z M${cx + 176} ${midY - 40} L${cx + 196} ${midY + 60} H${cx + 180} L${cx + 162} ${midY - 40} Z`} fill={shade(wood, -0.18)} />
            {[-120, -96, -72].map((dx, i) => <path key={dx} d={`M${cx + dx - 12} ${midY + 4 - i * 2} h24 l-4 -18 h-16 z`} fill={shade(sand, -0.12)} />)}
            <path d={`M${cx + 70} ${midY + 20} h40 l-6 -40 h-28 z`} fill={t("#d8506a")} />
            <path d={`M${cx + 74} ${midY - 20} q16 -24 32 0`} stroke={t("#d8506a")} strokeWidth={4} fill="none" />
            <path d={`M${cx + 130} ${midY + 16} l40 -50`} stroke={t("#4a6fa5")} strokeWidth={6} strokeLinecap="round" />
            <ellipse cx={cx + 128} cy={midY + 20} rx={14} ry={7} fill={t("#4a6fa5")} />
          </g>
        );
      })()}
      {/* качели (средний план, метка swing): П-рама на А-стойках, цепи, сиденье на seatTopY(0.5) */}
      {(() => {
        const frame = t("#3f6fa5", 0.5);
        const hw = 120;
        const bar = 520;
        const seatW = 70;
        return (
          <g>
            {[-1, 1].map((d) => (
              <g key={d} stroke={frame} strokeWidth={16} strokeLinecap="round">
                <path d={`M${sw + d * hw} ${bar} L${sw + d * (hw + 46)} ${midY}`} />
                <path d={`M${sw + d * hw} ${bar} L${sw + d * (hw - 34)} ${midY}`} />
                <path d={`M${sw + d * (hw + 24)} ${bar + 360} L${sw + d * (hw - 16)} ${bar + 360}`} strokeWidth={10} />
              </g>
            ))}
            {[-1, 1].map((d) => <ellipse key={`f${d}`} cx={sw + d * (hw + 6)} cy={midY + 2} rx={60} ry={8} fill="#00000020" />)}
            <rect x={sw - hw - 30} y={bar - 12} width={2 * hw + 60} height={22} rx={10} fill={frame} />
            <rect x={sw - hw - 30} y={bar - 12} width={2 * hw + 60} height={7} rx={4} fill={shade(frame, 0.2)} />
            {[-1, 1].map((d) => (
              <g key={`c${d}`}>
                <path d={`M${sw + d * (seatW - 6)} ${bar + 10} V${swingTop}`} stroke={t("#8a8e96", 0.5)} strokeWidth={5} strokeDasharray="10 4" />
                <circle cx={sw + d * (seatW - 6)} cy={bar + 12} r={7} fill={t("#5a5e66", 0.5)} />
              </g>
            ))}
            <rect x={sw - seatW} y={swingTop} width={2 * seatW} height={18} rx={6} fill={t("#e0a030", 0.5)} />
            <rect x={sw - seatW} y={swingTop} width={2 * seatW} height={6} rx={3} fill={shade(t("#e0a030", 0.5), 0.2)} />
            <rect x={sw - seatW + 6} y={swingTop + 18} width={2 * seatW - 12} height={6} fill="#00000022" />
          </g>
        );
      })()}
    </>
  );
};

export const Ulitsa = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "yard" || variant === "yard-night" ? (
      <Yard night={variant === "yard-night"} />
    ) : variant === "park" ? (
      <Park palette={palette} />
    ) : variant === "cemetery" ? (
      <Cemetery />
    ) : variant === "stadium" ? (
      <Stadium palette={palette} />
    ) : variant === "zoo" ? (
      <Zoo palette={palette} />
    ) : (
      <Street palette={palette} />
    )}
  </Canvas>
);
