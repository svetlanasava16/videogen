import { Canvas, Room, W, H, FLOOR_Y, type BackdropProps } from "./parts";
import { mix, dark, light, WOOD } from "./gostinaya";
import { depthScale, feetY, seatTopY } from "../world/depth";

const Flame = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-10} r={46} fill="#f5d77a" opacity={0.18} />
    <path d="M0 -34 Q14 -14 8 -2 Q0 6 -8 -2 Q-14 -14 0 -34 Z" fill="#f2a530" />
    <path d="M0 -20 Q6 -10 3 -4 Q0 0 -3 -4 Q-6 -10 0 -20 Z" fill="#fff1b0" />
  </g>
);

/** Высокий подсвечник на полу. */
const Candlestand = ({ x, gold }: { x: number; gold: string }) => (
  <g>
    <ellipse cx={x} cy={FLOOR_Y - 6} rx={46} ry={12} fill={dark(gold, 0.2)} />
    <rect x={x - 7} y={FLOOR_Y - 330} width={14} height={326} fill={gold} />
    <circle cx={x} cy={FLOOR_Y - 180} r={14} fill={gold} />
    <path d={`M${x - 40} ${FLOOR_Y - 340} L${x + 40} ${FLOOR_Y - 340} L${x + 20} ${FLOOR_Y - 316} L${x - 20} ${FLOOR_Y - 316} Z`} fill={gold} />
    <rect x={x - 12} y={FLOOR_Y - 420} width={24} height={82} rx={4} fill="#f8f1de" />
    <Flame x={x} y={FLOOR_Y - 420} />
  </g>
);

/** Церковная скамья на плане z от x0 до x1 (доли кадра): сиденье на seatTopY(z), спинка-панель, глухие боковины. */
const Pew = ({ x0, x1, z, color }: { x0: number; x1: number; z: number; color: string }) => {
  const s = depthScale(z);
  const l = x0 * W;
  const r = x1 * W;
  const top = seatTopY(z);
  const fy = feetY(z);
  return (
    <g>
      <rect x={l} y={top - 130 * s} width={r - l} height={130 * s} rx={14 * s} fill={color} />
      <rect x={l} y={top - 130 * s} width={r - l} height={16 * s} rx={8 * s} fill={light(color, 0.12)} />
      <rect x={l + 10 * s} y={top - 100 * s} width={r - l - 20 * s} height={60 * s} rx={8 * s} fill={dark(color, 0.08)} />
      <rect x={l - 6 * s} y={top} width={r - l + 12 * s} height={22 * s} rx={8 * s} fill={dark(color, 0.12)} />
      <rect x={l + 14 * s} y={top + 22 * s} width={r - l - 28 * s} height={fy - top - 22 * s} fill={dark(color, 0.32)} />
      <rect x={l - 12 * s} y={top - 150 * s} width={26 * s} height={fy - top + 150 * s} rx={10 * s} fill={dark(color, 0.18)} />
      <rect x={r - 14 * s} y={top - 150 * s} width={26 * s} height={fy - top + 150 * s} rx={10 * s} fill={dark(color, 0.18)} />
    </g>
  );
};

/** Нейтральный храм: алтарь со свечами, скамьи по бокам, высокое цветное окно. Без символа конфессии. */
export const Tserkov = ({ palette: p }: BackdropProps) => {
  const stone = light(p.wall, 0.25);
  const niche = dark(p.wall, 0.12);
  const gold = p.accent;
  const lead = "#5a4a3a";
  const glass = ["#c8553d", "#4a7ab0", gold, "#5b8c5a", "#4a7ab0", "#c8553d", "#7a5aa0", gold, "#4a7ab0"];
  const runner = mix(p.accent, "#8a2a2a", 0.7);
  // окно: прямоугольная часть 466..614 × 590..884, сверху полукруг r=74
  const wx = 466;
  const ww = 148;
  const wy = 590;
  const wh = 294;
  return (
    <Canvas>
      <Room wall={p.wall} floor={p.floor} />
      {/* колонны */}
      {[200, 820].map((x) => (
        <g key={x}>
          <rect x={x} y={0} width={60} height={FLOOR_Y} fill={stone} />
          <rect x={x - 12} y={440} width={84} height={26} rx={6} fill={light(stone, 0.2)} />
          <rect x={x - 12} y={FLOOR_Y - 46} width={84} height={46} rx={6} fill={dark(stone, 0.06)} />
        </g>
      ))}
      {/* ниша-апсида и луч света */}
      <path d={`M310 ${FLOOR_Y} V690 A230 230 0 0 1 770 690 V${FLOOR_Y} Z`} fill={niche} />
      <path d={`M${wx} 884 L${wx + ww} 884 L760 ${FLOOR_Y} L320 ${FLOOR_Y} Z`} fill="#f5e6a8" opacity={0.18} />
      {/* цветное окно */}
      <path d={`M${wx - 18} ${wy + wh + 18} V${wy} A92 92 0 0 1 ${wx + ww + 18} ${wy} V${wy + wh + 18} Z`} fill={light(stone, 0.2)} />
      <path d={`M${wx} ${wy + wh} V${wy} A74 74 0 0 1 ${wx + ww} ${wy} V${wy + wh} Z`} fill={lead} />
      <path d={`M${wx + 6} ${wy - 4} A68 68 0 0 1 ${wx + ww - 6} ${wy - 4} Z`} fill="#4a7ab0" />
      <circle cx={540} cy={wy - 18} r={30} fill={gold} />
      <circle cx={540} cy={wy - 18} r={14} fill="#f5e6a8" />
      {glass.map((c, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cw = (ww - 6) / 3;
        const ch = (wh - 6) / 3;
        return <rect key={i} x={wx + 6 + col * cw} y={wy + 6 + row * ch} width={cw - 6} height={ch - 6} rx={3} fill={c} opacity={0.9} />;
      })}
      {/* ступень и алтарь */}
      <rect x={300} y={FLOOR_Y - 34} width={480} height={34} rx={6} fill={light(p.floor, 0.25)} />
      <rect x={390} y={FLOOR_Y - 250} width={300} height={216} rx={8} fill={stone} />
      <rect x={378} y={FLOOR_Y - 262} width={324} height={26} rx={8} fill="#fbf7ee" />
      <rect x={378} y={FLOOR_Y - 240} width={324} height={14} fill={gold} />
      <rect x={450} y={FLOOR_Y - 226} width={180} height={150} rx={6} fill={runner} />
      <rect x={450} y={FLOOR_Y - 96} width={180} height={20} fill={gold} />
      {/* свечи на алтаре */}
      {[420, 660].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={FLOOR_Y - 264} rx={22} ry={7} fill={gold} />
          <rect x={x - 5} y={FLOOR_Y - 310} width={10} height={46} fill={gold} />
          <rect x={x - 9} y={FLOOR_Y - 380} width={18} height={70} rx={3} fill="#f8f1de" />
          <Flame x={x} y={FLOOR_Y - 380} s={0.8} />
        </g>
      ))}
      <rect x={510} y={FLOOR_Y - 292} width={60} height={30} rx={4} fill={dark(WOOD, 0.1)} />
      <rect x={510} y={FLOOR_Y - 292} width={60} height={8} rx={3} fill={runner} />
      <Candlestand x={300} gold={gold} />
      <Candlestand x={780} gold={gold} />
      {/* дорожка */}
      <path d={`M430 ${FLOOR_Y} L650 ${FLOOR_Y} L720 ${H} L360 ${H} Z`} fill={runner} opacity={0.85} />
      {/* скамьи по бокам прохода, средний план (метки pew-left, pew-left-2, pew-right-2, pew-right) */}
      <Pew x0={0.04} x1={0.33} z={0.5} color={WOOD} />
      <Pew x0={0.67} x1={0.96} z={0.5} color={WOOD} />
    </Canvas>
  );
};
