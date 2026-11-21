/**
 * Общие примитивы фонов. Холст 1080×1920, viewBox тот же.
 * Линия пола FLOOR_Y = 1190: на ней стоят куклы (их полоса — y 640…1190, x 0…1080, середина свободна).
 * Субтитры: персонажи — y≈1270+, рассказчик — y≈150…420 (затемнённая плашка). Не кладите туда мелкие детали.
 * Стиль: плоские формы, без контуров и градиентов (допустима мягкая полупрозрачная тень), тёплая палитра.
 */
import type { ReactNode } from "react";

export const W = 1080;
export const H = 1920;
export const FLOOR_Y = 1190;

export type Palette = { wall: string; floor: string; accent: string };
export type BackdropProps = {
  palette: Palette;
  /** Сублокация (id варианта: "park" для "ulitsa"); undefined = базовый вид. */
  variant?: string;
  /**
   * Слой: "back" (по умолчанию) — весь фон, кроме переднего слоя; "front" — только передний слой (стойка, прилавок),
   * который движок рисует поверх кукол, стоящих за ним (location.front.z). Фон без переднего слоя на "front" возвращает null.
   */
  layer?: "back" | "front";
};

/** Обёртка: svg на весь кадр. */
export const Canvas = ({ children }: { children: ReactNode }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

/** Стена и пол (интерьер). */
export const Room = ({ wall, floor, floorY = FLOOR_Y }: { wall: string; floor: string; floorY?: number }) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={wall} />
    <rect x={0} y={floorY} width={W} height={H - floorY} fill={floor} />
    <rect x={0} y={floorY - 18} width={W} height={18} fill="#00000022" />
  </>
);

/** Небо и земля (экстерьер). */
export const Outdoor = ({ sky, ground, horizon = 1000 }: { sky: string; ground: string; horizon?: number }) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={sky} />
    <rect x={0} y={horizon} width={W} height={H - horizon} fill={ground} />
  </>
);

export const Window = ({ x, y, w = 260, h = 300, frame = "#f2e6d0", glass = "#cfe6f5", night = false }: { x: number; y: number; w?: number; h?: number; frame?: string; glass?: string; night?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill={frame} />
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} rx={6} fill={night ? "#2b3a55" : glass} />
    <rect x={x + w / 2 - 6} y={y + 16} width={12} height={h - 32} fill={frame} />
    <rect x={x + 16} y={y + h / 2 - 6} width={w - 32} height={12} fill={frame} />
    {night && <circle cx={x + w * 0.72} cy={y + h * 0.3} r={18} fill="#f5e6a8" />}
  </g>
);

export const Door = ({ x, y = FLOOR_Y - 520, w = 240, h = 520, color = "#8a5a3a", knob = "#e0b030" }: { x: number; y?: number; w?: number; h?: number; color?: string; knob?: string }) => (
  <g>
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 14} rx={8} fill="#00000022" />
    <rect x={x} y={y} width={w} height={h} rx={6} fill={color} />
    <rect x={x + 30} y={y + 40} width={w - 60} height={h * 0.35} rx={6} fill="#00000018" />
    <rect x={x + 30} y={y + h * 0.5} width={w - 60} height={h * 0.38} rx={6} fill="#00000018" />
    <circle cx={x + w - 34} cy={y + h * 0.52} r={12} fill={knob} />
  </g>
);

export const Shelf = ({ x, y, w = 420, color = "#8a5a3a", items = [] as string[] }: { x: number; y: number; w?: number; color?: string; items?: string[] }) => (
  <g>
    <rect x={x} y={y} width={w} height={16} rx={4} fill={color} />
    {items.map((c, i) => (
      <rect key={i} x={x + 20 + i * ((w - 40) / Math.max(items.length, 1))} y={y - 70 - (i % 3) * 14} width={36} height={70 + (i % 3) * 14} rx={8} fill={c} />
    ))}
  </g>
);

export const HangingLamp = ({ x, y = 0, len = 220, color = "#e0a030", glow = true }: { x: number; y?: number; len?: number; color?: string; glow?: boolean }) => (
  <g>
    <rect x={x - 3} y={y} width={6} height={len} fill="#2b1d14" />
    {glow && <circle cx={x} cy={y + len + 40} r={180} fill={color} opacity={0.12} />}
    <path d={`M${x - 80} ${y + len + 50} Q${x} ${y + len - 30} ${x + 80} ${y + len + 50} Z`} fill={color} />
  </g>
);

export const Table = ({ x, w = 360, h = 230, top = "#8a5a3a", legs = "#6b4429" }: { x: number; w?: number; h?: number; top?: string; legs?: string }) => (
  <g>
    <rect x={x} y={FLOOR_Y - h} width={w} height={26} rx={8} fill={top} />
    <rect x={x + 20} y={FLOOR_Y - h + 26} width={22} height={h - 26} fill={legs} />
    <rect x={x + w - 42} y={FLOOR_Y - h + 26} width={22} height={h - 26} fill={legs} />
  </g>
);

export const Plant = ({ x, y = FLOOR_Y, scale = 1, pot = "#c8553d", leaf = "#5b8c5a" }: { x: number; y?: number; scale?: number; pot?: string; leaf?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx={-30} cy={-170} rx={34} ry={70} fill={leaf} transform="rotate(-25 -30 -170)" />
    <ellipse cx={30} cy={-170} rx={34} ry={70} fill={leaf} transform="rotate(25 30 -170)" />
    <ellipse cx={0} cy={-200} rx={30} ry={80} fill={leaf} />
    <path d="M-50 -110 L50 -110 L38 0 L-38 0 Z" fill={pot} />
  </g>
);

export const Cloud = ({ x, y, s = 1, color = "#ffffff" }: { x: number; y: number; s?: number; color?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <circle cx={0} cy={0} r={60} />
    <circle cx={70} cy={-20} r={75} />
    <circle cx={150} cy={0} r={60} />
    <rect x={0} y={0} width={150} height={60} />
  </g>
);

export const Tree = ({ x, y = FLOOR_Y, s = 1, crown = "#5b8c5a", trunk = "#6b4429", kind = "round" as "round" | "pine" | "birch" }: { x: number; y?: number; s?: number; crown?: string; trunk?: string; kind?: "round" | "pine" | "birch" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-18} y={-260} width={36} height={260} fill={kind === "birch" ? "#f2f2f2" : trunk} />
    {kind === "birch" && [40, 110, 180].map((yy) => <rect key={yy} x={-18} y={-yy} width={20} height={8} fill="#2b1d14" />)}
    {kind === "pine" ? (
      <path d="M0 -560 L120 -240 L-120 -240 Z M0 -460 L140 -160 L-140 -160 Z" fill={crown} />
    ) : (
      <>
        <circle cx={0} cy={-330} r={130} fill={crown} />
        <circle cx={-80} cy={-280} r={90} fill={crown} />
        <circle cx={80} cy={-280} r={90} fill={crown} />
      </>
    )}
  </g>
);

export const Fence = ({ y = FLOOR_Y, x0 = 0, x1 = W, color = "#b08a5a", h = 160 }: { y?: number; x0?: number; x1?: number; color?: string; h?: number }) => (
  <g fill={color}>
    <rect x={x0} y={y - h * 0.75} width={x1 - x0} height={18} />
    <rect x={x0} y={y - h * 0.35} width={x1 - x0} height={18} />
    {Array.from({ length: Math.floor((x1 - x0) / 60) + 1 }).map((_, i) => (
      <path key={i} d={`M${x0 + i * 60} ${y} v${-h} l14 -20 l14 20 v${h} z`} />
    ))}
  </g>
);

export const Picture = ({ x, y, w = 160, h = 120, frame = "#8a5a3a", art = "#7fb3d5" }: { x: number; y: number; w?: number; h?: number; frame?: string; art?: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={frame} />
    <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} fill={art} />
    <path d={`M${x + 12} ${y + h - 12} L${x + w * 0.4} ${y + h * 0.45} L${x + w * 0.6} ${y + h * 0.65} L${x + w * 0.75} ${y + h * 0.5} L${x + w - 12} ${y + h - 12} Z`} fill="#5b8c5a" />
  </g>
);

export const Rug = ({ cx = W / 2, color = "#c8553d", w = 760 }: { cx?: number; color?: string; w?: number }) => (
  <ellipse cx={cx} cy={FLOOR_Y + 60} rx={w / 2} ry={50} fill={color} opacity={0.85} />
);
