import { Canvas, Room, W, H, FLOOR_Y, type BackdropProps } from "./parts";
import { mix, dark, light, WallShade, FloorShade, FloorTiles, Glow, Shadow } from "./bolnitsa";
import { depthScale, feetY, seatTopY } from "../world/depth";

const WOOD = "#8a5a3a";

/**
 * Глубина (content/locations/tserkov.json → front.z = 0.85): алтарь с покровом, свечами, книгой и цветами — передний слой
 * (layer="front"), стоит на полу плана 0.85 перед ступенью апсиды. Священник за ним (метки behind-altar z 0.95, altar z 1)
 * скрыт по пояс; прихожане в проходе и на скамьях (средний план) — перед ним. В layer="back" алтаря нет.
 */
const FRONT_Z = 0.85;
const ALTAR_FEET = feetY(FRONT_Z);
/** Верх алтаря (покров) — по пояс священнику на плане 0.95–1 (ниже груди и у невысоких кукол). */
const ALTAR_TOP = FLOOR_Y - 215;

/** Алтарь — передний слой: каменный блок с вышитым покровом, свечи, раскрытая книга на аналое, цветы. */
const AltarFront = ({ p }: { p: BackdropProps["palette"] }) => {
  const stone = light(p.wall, 0.25);
  const gold = p.accent;
  const runner = mix(p.accent, "#8a2a2a", 0.7);
  const t = ALTAR_TOP;
  const f = ALTAR_FEET;
  return (
    <g>
      <Shadow cx={540} w={380} y={f} o={0.22} />
      <rect x={390} y={t + 12} width={300} height={f - t - 12} rx={8} fill={stone} />
      <rect x={672} y={t + 12} width={18} height={f - t - 12} fill="#000000" opacity={0.06} />
      <rect x={380} y={f - 28} width={320} height={28} rx={6} fill={dark(stone, 0.1)} />
      <rect x={380} y={f - 28} width={320} height={6} rx={3} fill="#ffffff" opacity={0.25} />
      <rect x={378} y={t} width={324} height={26} rx={8} fill="#fbf7ee" />
      <rect x={378} y={t + 22} width={324} height={14} fill={gold} />
      <path d={`M378 ${t + 36} h324 l-10 26 h-304 Z`} fill="#fbf7ee" />
      {Array.from({ length: 10 }).map((_, i) => <path key={i} d={`M${392 + i * 30} ${t + 62} l15 12 l15 -12`} fill={gold} opacity={0.6} />)}
      <rect x={450} y={t + 82} width={180} height={140} rx={6} fill={runner} />
      <path d={`M540 ${t + 102} l34 48 l-34 48 l-34 -48 Z`} fill={gold} opacity={0.85} />
      <circle cx={540} cy={t + 150} r={14} fill={runner} />
      <circle cx={540} cy={t + 150} r={6} fill={light(gold, 0.3)} />
      <rect x={450} y={t + 202} width={180} height={20} fill={gold} />
      {/* свечи на алтаре */}
      {[398, 682].map((x) => (
        <g key={x}>
          <Glow cx={x} cy={t - 138} rx={90} color="#ffd98a" opacity={0.5} />
          <ellipse cx={x} cy={t - 2} rx={22} ry={7} fill={gold} />
          <rect x={x - 5} y={t - 48} width={10} height={46} fill={gold} />
          <rect x={x - 9} y={t - 118} width={18} height={70} rx={3} fill="#f8f1de" />
          <Flame x={x} y={t - 118} s={0.8} />
        </g>
      ))}
      {/* раскрытая книга плашмя посередине (низко — лицо священника над ней) и цветы по краям */}
      <rect x={508} y={t - 10} width={64} height={10} rx={3} fill={runner} />
      <path d={`M504 ${t - 8} q18 -10 36 -3 q18 -7 36 3 v-5 q-18 -10 -36 -3 q-18 -7 -36 3 Z`} fill="#fbf7ee" />
      {[[440, -1], [640, 1]].map(([x, d]) => (
        <g key={x}>
          <path d={`M${x - 12} ${t} h24 l-4 -26 h-16 Z`} fill={light(gold, 0.3)} />
          {[[-14, -46, "#ffffff"], [0, -58, "#f2e0a0"], [14, -44, "#ffffff"], [d * 6, -38, "#e8a0a8"]].map(([dx, dy, c], i) => (
            <circle key={i} cx={(x as number) + (dx as number)} cy={t + (dy as number)} r={9} fill={c as string} />
          ))}
          <ellipse cx={(x as number) - 16} cy={t - 34} rx={5} ry={11} fill="#5b8c5a" transform={`rotate(-30 ${(x as number) - 16} ${t - 34})`} />
          <ellipse cx={(x as number) + 16} cy={t - 34} rx={5} ry={11} fill="#5b8c5a" transform={`rotate(30 ${(x as number) + 16} ${t - 34})`} />
        </g>
      ))}
    </g>
  );
};

const Flame = ({ x, y, s = 1, glow = true }: { x: number; y: number; s?: number; glow?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow && <circle cx={0} cy={-10} r={46} fill="#f5d77a" opacity={0.18} />}
    <path d="M0 -34 Q14 -14 8 -2 Q0 6 -8 -2 Q-14 -14 0 -34 Z" fill="#f2a530" />
    <path d="M0 -20 Q6 -10 3 -4 Q0 0 -3 -4 Q-6 -10 0 -20 Z" fill="#fff1b0" />
  </g>
);

/** Высокий подсвечник на полу: латунный поднос с песком и множеством тонких свечей. */
const Candlestand = ({ x, gold }: { x: number; gold: string }) => {
  const tray = FLOOR_Y - 340;
  const candles = [-44, -30, -16, -2, 12, 26, 40, -24, 4, 30];
  return (
    <g>
      <Shadow cx={x} w={120} o={0.2} />
      <Glow cx={x} cy={tray - 50} rx={150} ry={120} color="#ffd98a" opacity={0.55} />
      <ellipse cx={x} cy={FLOOR_Y - 6} rx={46} ry={12} fill={dark(gold, 0.2)} />
      <rect x={x - 7} y={tray + 10} width={14} height={FLOOR_Y - tray - 16} fill={gold} />
      <rect x={x - 3} y={tray + 10} width={4} height={FLOOR_Y - tray - 16} fill="#ffffff" opacity={0.3} />
      <circle cx={x} cy={FLOOR_Y - 180} r={14} fill={gold} />
      <circle cx={x} cy={FLOOR_Y - 90} r={10} fill={gold} />
      <path d={`M${x - 66} ${tray} L${x + 66} ${tray} L${x + 40} ${tray + 26} L${x - 40} ${tray + 26} Z`} fill={gold} />
      <rect x={x - 66} y={tray - 8} width={132} height={10} rx={4} fill="#d8c8a0" />
      {candles.map((dx, i) => {
        const back = i >= 7;
        const h = back ? 70 + (i % 2) * 12 : 40 + ((i * 7) % 4) * 10;
        const cy = tray - 6 - (back ? 4 : 0);
        return (
          <g key={i} opacity={back ? 0.85 : 1}>
            <rect x={x + dx - 3} y={cy - h} width={6} height={h} rx={2} fill="#f0dca0" />
            <Flame x={x + dx} y={cy - h} s={0.38} glow={false} />
          </g>
        );
      })}
    </g>
  );
};

/** Церковная скамья на плане z от x0 до x1 (доли кадра): сиденье на seatTopY(z), спинка-панель, глухие боковины. */
const Pew = ({ x0, x1, z, color }: { x0: number; x1: number; z: number; color: string }) => {
  const s = depthScale(z);
  const l = x0 * W;
  const r = x1 * W;
  const top = seatTopY(z);
  const fy = feetY(z);
  return (
    <g>
      <Shadow cx={(l + r) / 2} w={r - l + 40} y={fy} h={16} o={0.18} />
      <rect x={l} y={top - 130 * s} width={r - l} height={130 * s} rx={14 * s} fill={color} />
      <rect x={l} y={top - 130 * s} width={r - l} height={16 * s} rx={8 * s} fill={light(color, 0.12)} />
      <rect x={l + 10 * s} y={top - 100 * s} width={r - l - 20 * s} height={60 * s} rx={8 * s} fill={dark(color, 0.08)} />
      {/* книжки на полочке спинки */}
      {[0.25, 0.7].map((t) => (
        <rect key={t} x={l + (r - l) * t} y={top - 148 * s} width={34 * s} height={22 * s} rx={3 * s} fill={t < 0.5 ? "#7a2a2a" : "#3a4a6a"} />
      ))}
      <rect x={l - 6 * s} y={top} width={r - l + 12 * s} height={22 * s} rx={8 * s} fill={dark(color, 0.12)} />
      <rect x={l + 14 * s} y={top + 22 * s} width={r - l - 28 * s} height={fy - top - 22 * s} fill={dark(color, 0.32)} />
      <rect x={l - 12 * s} y={top - 150 * s} width={26 * s} height={fy - top + 150 * s} rx={10 * s} fill={dark(color, 0.18)} />
      <rect x={r - 14 * s} y={top - 150 * s} width={26 * s} height={fy - top + 150 * s} rx={10 * s} fill={dark(color, 0.18)} />
      <circle cx={l + 1 * s} cy={top - 152 * s} r={14 * s} fill={dark(color, 0.1)} />
      <circle cx={r + 1 * s} cy={top - 152 * s} r={14 * s} fill={dark(color, 0.1)} />
    </g>
  );
};

/** Кладка: ряды камней со сдвигом, едва заметные. */
const Masonry = ({ color }: { color: string }) => {
  const rows = Math.ceil(FLOOR_Y / 70);
  return (
    <g stroke={dark(color, 0.25)} strokeWidth={3} opacity={0.18}>
      {Array.from({ length: rows }).map((_, r) => (
        <g key={r}>
          <line x1={0} y1={r * 70} x2={W} y2={r * 70} />
          {Array.from({ length: 9 }).map((_, c) => {
            const x = c * 140 + (r % 2 ? 70 : 0);
            return <line key={c} x1={x} y1={r * 70} x2={x} y2={r * 70 + 70} />;
          })}
        </g>
      ))}
    </g>
  );
};

/** Арочная панель в золотой раме: силуэт фигуры с нимбом (как на иконостасе, без деталей). */
const IconPanel = ({ x, y, w, h, gold, robe, bg }: { x: number; y: number; w: number; h: number; gold: string; robe: string; bg: string }) => {
  const cx = x + w / 2;
  const r = w / 2;
  return (
    <g>
      <path d={`M${x - 10} ${y + h + 10} V${y + r} A${r + 10} ${r + 10} 0 0 1 ${x + w + 10} ${y + r} V${y + h + 10} Z`} fill={dark(gold, 0.2)} />
      <path d={`M${x - 4} ${y + h + 4} V${y + r} A${r + 4} ${r + 4} 0 0 1 ${x + w + 4} ${y + r} V${y + h + 4} Z`} fill={gold} />
      <path d={`M${x + 6} ${y + h - 6} V${y + r} A${r - 6} ${r - 6} 0 0 1 ${x + w - 6} ${y + r} V${y + h - 6} Z`} fill={bg} />
      <circle cx={cx} cy={y + h * 0.3} r={w * 0.26} fill={light(gold, 0.15)} />
      <circle cx={cx} cy={y + h * 0.3} r={w * 0.26} fill="none" stroke={dark(gold, 0.1)} strokeWidth={3} />
      <ellipse cx={cx} cy={y + h * 0.31} rx={w * 0.13} ry={w * 0.15} fill="#d8b08a" />
      <path d={`M${cx - w * 0.15} ${y + h * 0.28} Q${cx} ${y + h * 0.18} ${cx + w * 0.15} ${y + h * 0.28} L${cx + w * 0.16} ${y + h * 0.42} Q${cx} ${y + h * 0.48} ${cx - w * 0.16} ${y + h * 0.42} Z`} fill={dark(robe, 0.25)} opacity={0.55} />
      <path d={`M${cx - w * 0.36} ${y + h - 6} Q${cx - w * 0.32} ${y + h * 0.48} ${cx} ${y + h * 0.44} Q${cx + w * 0.32} ${y + h * 0.48} ${cx + w * 0.36} ${y + h - 6} Z`} fill={robe} />
      <path d={`M${cx - w * 0.06} ${y + h * 0.46} L${cx} ${y + h - 6} L${cx + w * 0.06} ${y + h * 0.46} Z`} fill={light(robe, 0.25)} />
      <rect x={cx - w * 0.1} y={y + h * 0.6} width={w * 0.2} height={w * 0.24} rx={3} fill={light(gold, 0.2)} />
    </g>
  );
};

/** Лампада на цепочке: красное стекло, огонёк. */
const Lampada = ({ x, y, gold }: { x: number; y: number; gold: string }) => (
  <g>
    <line x1={x} y1={0} x2={x} y2={y - 30} stroke={dark(gold, 0.25)} strokeWidth={3} />
    <path d={`M${x} ${y - 30} L${x - 22} ${y} M${x} ${y - 30} L${x + 22} ${y}`} stroke={dark(gold, 0.25)} strokeWidth={3} />
    <Glow cx={x} cy={y + 14} rx={70} color="#ff9a5a" opacity={0.5} />
    <path d={`M${x - 24} ${y} h48 q-4 34 -24 38 q-20 -4 -24 -38 Z`} fill="#b8342a" />
    <rect x={x - 26} y={y - 4} width={52} height={8} rx={3} fill={gold} />
    <Flame x={x} y={y + 6} s={0.4} glow={false} />
  </g>
);

/** Боковое арочное окно с лучом света. */
const SideWindow = ({ x, w = 110, y = 470, h = 300, glass, frame }: { x: number; w?: number; y?: number; h?: number; glass: string; frame: string }) => (
  <g>
    <path d={`M${x - 10} ${y + h + 10} V${y + w / 2} A${w / 2 + 10} ${w / 2 + 10} 0 0 1 ${x + w + 10} ${y + w / 2} V${y + h + 10} Z`} fill={frame} />
    <path d={`M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`} fill={glass} />
    <rect x={x + w / 2 - 3} y={y + 10} width={6} height={h - 10} fill={frame} />
    {[0.4, 0.65].map((t) => <rect key={t} x={x} y={y + h * t} width={w} height={5} fill={frame} />)}
    <rect x={x + 10} y={y + w / 2} width={14} height={h * 0.5} rx={7} fill="#ffffff" opacity={0.45} />
  </g>
);

/** Нейтральный храм: апсида с цветным окном и иконостасными панелями, алтарь, лампады, подсвечники с множеством свечей, скамьи по бокам. */
export const Tserkov = ({ palette: p, layer = "back" }: BackdropProps) => {
  if (layer === "front") return <Canvas><AltarFront p={p} /></Canvas>;
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
      <Masonry color={p.wall} />
      <WallShade top={0.2} bottom={0.12} />
      {/* каменные плиты пола */}
      <FloorTiles color={p.floor} step={230} rows={6} checker={0.08} seam={0.14} />
      <FloorShade />
      {/* боковые арочные окна и лучи от них */}
      <SideWindow x={40} glass="#f2e8c8" frame={stone} />
      <SideWindow x={930} glass="#f2e8c8" frame={stone} />
      <path d={`M40 770 L150 770 L380 ${FLOOR_Y + 120} L170 ${FLOOR_Y + 120} Z`} fill="#fff6d8" opacity={0.12} />
      <path d={`M930 770 L1040 770 L910 ${FLOOR_Y + 120} L700 ${FLOOR_Y + 120} Z`} fill="#fff6d8" opacity={0.12} />
      {/* хорос — круглая люстра под сводом */}
      <Glow cx={540} cy={110} rx={360} ry={150} color="#ffe2a0" opacity={0.5} />
      <line x1={540} y1={0} x2={540} y2={60} stroke={dark(gold, 0.3)} strokeWidth={4} />
      <path d="M540 60 L380 100 M540 60 L700 100 M540 60 L460 104 M540 60 L620 104" stroke={dark(gold, 0.3)} strokeWidth={2.5} />
      <ellipse cx={540} cy={106} rx={170} ry={24} fill="none" stroke={gold} strokeWidth={10} />
      {Array.from({ length: 9 }).map((_, i) => {
        const a = Math.PI * (i / 8);
        const x = 540 - Math.cos(a) * 170;
        const y = 106 + Math.sin(a) * 24;
        return (
          <g key={i}>
            <rect x={x - 4} y={y - 26} width={8} height={24} rx={2} fill="#f0dca0" />
            <Flame x={x} y={y - 26} s={0.35} glow={false} />
          </g>
        );
      })}
      {/* колонны */}
      {[200, 820].map((x) => (
        <g key={x}>
          <rect x={x} y={0} width={60} height={FLOOR_Y} fill={stone} />
          <rect x={x + 8} y={0} width={10} height={FLOOR_Y} fill="#ffffff" opacity={0.3} />
          <rect x={x + 44} y={0} width={10} height={FLOOR_Y} fill="#000000" opacity={0.06} />
          <rect x={x - 12} y={440} width={84} height={26} rx={6} fill={light(stone, 0.2)} />
          <rect x={x - 6} y={466} width={72} height={10} fill={gold} opacity={0.7} />
          <rect x={x - 12} y={FLOOR_Y - 46} width={84} height={46} rx={6} fill={dark(stone, 0.06)} />
        </g>
      ))}
      {/* ниша-апсида с золотым ободом и луч света */}
      <path d={`M310 ${FLOOR_Y} V690 A230 230 0 0 1 770 690 V${FLOOR_Y} Z`} fill={niche} />
      <path d={`M310 ${FLOOR_Y} V690 A230 230 0 0 1 770 690 V${FLOOR_Y}`} fill="none" stroke={gold} strokeWidth={10} />
      {Array.from({ length: 15 }).map((_, i) => {
        const a = Math.PI * (i / 14);
        return <circle key={i} cx={540 - Math.cos(a) * 230} cy={690 - Math.sin(a) * 230} r={5} fill={light(gold, 0.4)} />;
      })}
      <path d={`M${wx} 884 L${wx + ww} 884 L760 ${FLOOR_Y} L320 ${FLOOR_Y} Z`} fill="#f5e6a8" opacity={0.18} />
      {/* иконостасные панели по сторонам окна */}
      <IconPanel x={340} y={600} w={96} h={190} gold={gold} robe="#7a2a2a" bg="#2f4a6a" />
      <IconPanel x={644} y={600} w={96} h={190} gold={gold} robe="#2f4a6a" bg="#7a2a2a" />
      <Lampada x={388} y={540} gold={gold} />
      <Lampada x={692} y={540} gold={gold} />
      {/* цветное окно */}
      <Glow cx={540} cy={wy + 100} rx={180} ry={260} color="#fff0c0" opacity={0.35} />
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
      {/* ступень апсиды; сам алтарь — передний слой (AltarFront), здесь только его тень на полу плана 0.85 */}
      <rect x={300} y={FLOOR_Y - 34} width={480} height={34} rx={6} fill={light(p.floor, 0.25)} />
      <rect x={300} y={FLOOR_Y - 34} width={480} height={7} rx={4} fill="#ffffff" opacity={0.3} />
      <Candlestand x={300} gold={gold} />
      <Candlestand x={780} gold={gold} />
      {/* дорожка с каймой */}
      <path d={`M430 ${FLOOR_Y} L650 ${FLOOR_Y} L720 ${H} L360 ${H} Z`} fill={runner} opacity={0.85} />
      <path d={`M446 ${FLOOR_Y} L634 ${FLOOR_Y} L698 ${H} L382 ${H} Z`} fill="none" stroke={gold} strokeWidth={6} opacity={0.55} />
      {/* скамьи по бокам прохода, средний план (метки pew-left, pew-left-2, pew-right-2, pew-right) */}
      <Pew x0={0.04} x1={0.33} z={0.5} color={WOOD} />
      <Pew x0={0.67} x1={0.96} z={0.5} color={WOOD} />
    </Canvas>
  );
};
