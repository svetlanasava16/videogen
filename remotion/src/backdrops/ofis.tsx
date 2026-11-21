import { Canvas, Room, Plant, FLOOR_Y, W, type BackdropProps, type Palette } from "./parts";
import { SeatAt } from "./gostinaya";
import { WallShade, FloorShade, FloorTiles, Glow, Shadow, Clock, Calendar, Radiator, Baseboard, Digit, persX, rnd } from "./bolnitsa";
import { feetY, seatTopY } from "../world/depth";

/**
 * Фон «ofis»: кабинет начальника. Варианты (content/locations/ofis.json → bible.variants):
 * tv-studio, police-station, bank / government-office. Остальное — базовый кабинет.
 * Сиденья под метки (content/locations/ofis.json): кресло начальника справа от стола (desk), стул посетителя (visitor);
 * студия — кресла ведущего и гостя по бокам стола; участок — стул дежурного и стул задержанного; банк — стулья ожидания.
 *
 * Глубина (content/locations/ofis.json → front.z = 0.8): в участке дежурный стол, в банке стойка с перегородкой и окошками —
 * передний слой (layer="front"): дежурный / кассир за ним (desk, teller-1…3, z 0.95), посетители (z 0.5) — перед ним.
 * Низ стола/стойки — на полу плана 0.8 (FRONT_FEET), верх — y 1015. Всё, что на среднем плане (табурет задержанного,
 * стулья ожидания, стойки очереди), тоже в переднем слое: оно ближе стойки. Кабинет и студия переднего слоя не имеют.
 */

const FRONT_FEET = feetY(0.8);
const DESK_TOP = 1015;

/** Смешать цвет с белым (t>0) или чёрным (t<0). */
const shade = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t)));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

const WOOD = "#8a5a3a";
const WOOD_D = "#6b4429";
const PAPER = "#f4efe2";

/** Плинтус и лёгкая панель низа стены. */
const Wainscot = ({ wall, top = 900 }: { wall: string; top?: number }) => (
  <>
    <rect x={0} y={top} width={W} height={FLOOR_Y - top} fill={shade(wall, -0.08)} />
    <rect x={0} y={top - 10} width={W} height={10} fill={shade(wall, -0.16)} />
  </>
);

/** Потолочный светильник-панель (выше плашки рассказчика). */
const CeilingLight = ({ x, w = 300 }: { x: number; w?: number }) => (
  <g>
    <Glow cx={x + w / 2} cy={40} rx={w * 0.85} ry={150} color="#fffbe8" opacity={0.5} />
    <rect x={x} y={0} width={w} height={34} rx={6} fill="#f7f4ea" />
    <rect x={x} y={30} width={w} height={8} rx={4} fill="#00000014" />
  </g>
);

/** Окно с жалюзи. */
const BlindsWindow = ({ x, y, w, h, wall }: { x: number; y: number; w: number; h: number; wall: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill="#f2ede2" />
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} rx={6} fill="#bfe0f2" />
    {/* городские крыши вдали */}
    <path d={`M${x + 16} ${y + h - 16} v-90 h60 v40 h50 v-70 h70 v55 h${w - 32 - 180} v${65 + 0} Z`} fill="#a6cde3" />
    {/* жалюзи: опущены на верхние 55% */}
    <rect x={x + 10} y={y + 6} width={w - 20} height={22} rx={6} fill={shade(wall, -0.25)} />
    {Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} x={x + 18} y={y + 30 + i * 20} width={w - 36} height={14} rx={3} fill={i % 2 ? "#ece6d8" : "#e4ddcd"} />
    ))}
    <rect x={x + 22} y={y + 30 + 9 * 20} width={w - 44} height={10} rx={4} fill="#d6cdb8" />
    <rect x={x + w - 46} y={y + 28} width={4} height={220} fill="#b8ad96" />
    <circle cx={x + w - 44} cy={y + 252} r={7} fill="#b8ad96" />
    <rect x={x - 10} y={y + h - 8} width={w + 20} height={18} rx={6} fill="#e7e0d0" />
  </g>
);

/** Рамка с грамотой: печать и строки-полоски без текста. */
const Certificate = ({ x, y, accent }: { x: number; y: number; accent: string }) => (
  <g>
    <rect x={x} y={y} width={170} height={130} rx={6} fill={WOOD} />
    <rect x={x + 12} y={y + 12} width={146} height={106} fill={PAPER} />
    <rect x={x + 34} y={y + 30} width={102} height={10} rx={5} fill={accent} />
    <rect x={x + 30} y={y + 52} width={110} height={6} rx={3} fill="#d5cdbb" />
    <rect x={x + 30} y={y + 66} width={90} height={6} rx={3} fill="#d5cdbb" />
    <circle cx={x + 124} cy={y + 94} r={15} fill="#d9a630" />
    <path d={`M${x + 116} ${y + 104} l-6 18 l10 -6 l4 10 l4 -16 Z`} fill="#c8553d" />
  </g>
);

/** Стол начальника у стены слева: монитор с клавиатурой, телефон, папки, кружка, табличка; кресло начальника — справа от стола (метка desk). */
const BossDesk = ({ accent }: { accent: string }) => {
  const top = 965;
  return (
    <g>
      <Shadow cx={260} w={500} />
      {/* монитор: на экране — таблица с графиком */}
      <rect x={60} y={790} width={190} height={130} rx={12} fill="#2d3640" />
      <rect x={72} y={802} width={166} height={106} rx={6} fill={shade(accent, 0.55)} />
      <rect x={72} y={802} width={166} height={18} fill={shade(accent, 0.2)} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={82} y={830 + i * 18} width={70} height={9} rx={3} fill="#ffffff" opacity={0.7} />)}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={168 + i * 16} y={896 - (i + 1) * 14} width={11} height={(i + 1) * 14} fill={i === 3 ? "#c8553d" : accent} />)}
      <rect x={142} y={920} width={26} height={34} fill="#2d3640" />
      <rect x={110} y={950} width={90} height={15} rx={6} fill="#2d3640" />
      <rect x={72} y={802} width={40} height={106} fill="#ffffff" opacity={0.08} />
      {/* клавиатура и мышь */}
      <rect x={96} y={955} width={130} height={12} rx={4} fill="#3a4148" />
      <ellipse cx={248} cy={960} rx={12} ry={7} fill="#3a4148" />
      {/* телефон */}
      <rect x={272} y={936} width={74} height={30} rx={8} fill="#2f2a2a" />
      <path d="M268 936 q38 -22 82 0 v-10 q-42 -20 -82 0 Z" fill="#2f2a2a" />
      <rect x={290} y={944} width={38} height={14} rx={3} fill="#4a4448" />
      <path d="M346 952 q16 8 6 20" stroke="#2f2a2a" strokeWidth={4} fill="none" />
      {/* стопка папок и бумаг */}
      <rect x={360} y={940} width={92} height={26} rx={3} fill={PAPER} />
      <rect x={364} y={930} width={88} height={10} rx={2} fill="#e8c46a" />
      <rect x={358} y={920} width={92} height={10} rx={2} fill={accent} />
      <rect x={362} y={910} width={86} height={10} rx={2} fill="#c8553d" />
      <rect x={366} y={902} width={80} height={8} rx={2} fill={PAPER} />
      {/* кружка и стакан с ручками */}
      <rect x={462} y={926} width={22} height={39} rx={6} fill={accent} />
      <rect x={466} y={906} width={4} height={24} fill="#c8553d" transform="rotate(-10 468 930)" />
      <rect x={474} y={904} width={4} height={26} fill="#2d3640" transform="rotate(8 476 930)" />
      {/* табличка с именем на передней кромке */}
      <path d="M180 965 l10 -26 h90 l10 26 Z" fill="#c9a24a" />
      <rect x={198} y={946} width={74} height={8} rx={3} fill="#5a4030" opacity={0.6} />
      {/* столешница и тумба */}
      <rect x={30} y={top} width={460} height={30} rx={8} fill={WOOD} />
      <rect x={30} y={top} width={460} height={8} rx={4} fill={shade(WOOD, 0.15)} />
      <rect x={46} y={top + 30} width={428} height={FLOOR_Y - top - 30} fill={WOOD_D} />
      <rect x={66} y={top + 50} width={180} height={70} rx={6} fill="#00000020" />
      <rect x={66} y={top + 132} width={180} height={70} rx={6} fill="#00000020" />
      <rect x={136} y={top + 80} width={40} height={10} rx={5} fill="#d9a630" />
      <rect x={136} y={top + 162} width={40} height={10} rx={5} fill="#d9a630" />
      <rect x={274} y={top + 50} width={180} height={152} rx={6} fill="#00000014" />
    </g>
  );
};

/** График продаж на доске: столбики, ломаная вниз-вверх со стрелкой. */
const SalesChart = ({ x, y, w, h, accent }: { x: number; y: number; w: number; h: number; accent: string }) => {
  const ix = x + 26;
  const iy = y + 22;
  const iw = w - 48;
  const ih = h - 50;
  const pts = [0.55, 0.7, 0.45, 0.62, 0.2, 0.35, 0.85].map((v, i, a) => [ix + 10 + (i / (a.length - 1)) * (iw - 30), iy + ih - v * ih] as const);
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={h} rx={8} fill="#000000" opacity={0.12} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#b8c0c4" />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={4} fill="#fbfbf8" />
      {[0.25, 0.5, 0.75].map((t) => <rect key={t} x={ix} y={iy + ih * t} width={iw} height={2} fill="#dfe3e4" />)}
      {[0.3, 0.42, 0.25, 0.5, 0.62].map((v, i) => (
        <rect key={i} x={ix + 16 + i * (iw / 5.4)} y={iy + ih - v * ih} width={iw / 9} height={v * ih} fill={shade(accent, 0.55)} />
      ))}
      <path d={`M${pts.map(([a, b]) => `${a} ${b}`).join(" L")}`} stroke="#c8553d" strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={`M${pts[6][0] + 4} ${pts[6][1] - 6} l-24 2 l14 18 Z`} fill="#c8553d" />
      <rect x={ix} y={iy} width={4} height={ih} fill="#3a4148" />
      <rect x={ix} y={iy + ih} width={iw} height={4} fill="#3a4148" />
      <rect x={x + 20} y={y + h - 8} width={w - 40} height={10} rx={4} fill="#9aa3a8" />
      <rect x={x + 40} y={y + h - 10} width={30} height={8} rx={3} fill="#c8553d" />
      <rect x={x + 76} y={y + h - 10} width={30} height={8} rx={3} fill={accent} />
    </g>
  );
};

/** Полка с папками-скоросшивателями. */
const BinderShelf = ({ x, y, w, accent }: { x: number; y: number; w: number; accent: string }) => {
  const cols = [accent, "#c8553d", "#e8c46a", accent, "#5b8c5a", "#3a4148", "#c8553d", accent];
  const n = Math.floor((w - 20) / 30);
  return (
    <g>
      <rect x={x + 4} y={y + 8} width={w} height={14} fill="#000000" opacity={0.1} />
      {Array.from({ length: n }).map((_, i) => {
        const hgt = 70 + (i % 3) * 6;
        const tilt = i === n - 1 ? 14 : 0;
        return (
          <g key={i} transform={`rotate(${tilt} ${x + 14 + i * 30 + 24} ${y})`}>
            <rect x={x + 12 + i * 30} y={y - hgt} width={26} height={hgt} rx={3} fill={cols[i % cols.length]} />
            <rect x={x + 17 + i * 30} y={y - hgt + 14} width={16} height={18} rx={2} fill="#ffffff" opacity={0.75} />
            <circle cx={x + 25 + i * 30} cy={y - 16} r={5} fill="#000000" opacity={0.25} />
          </g>
        );
      })}
      <rect x={x} y={y} width={w} height={14} rx={3} fill={WOOD} />
    </g>
  );
};

/** Кулер с бутылью воды. */
const WaterCooler = ({ x }: { x: number }) => (
  <g>
    <Shadow cx={x + 40} w={110} />
    <rect x={x} y={FLOOR_Y - 250} width={80} height={250} rx={8} fill="#eef0f0" />
    <rect x={x} y={FLOOR_Y - 250} width={80} height={16} rx={6} fill="#d8dcdc" />
    <rect x={x + 10} y={FLOOR_Y - 190} width={60} height={60} rx={6} fill="#d8dcdc" />
    <rect x={x + 18} y={FLOOR_Y - 186} width={10} height={14} rx={3} fill="#4a7ab0" />
    <rect x={x + 52} y={FLOOR_Y - 186} width={10} height={14} rx={3} fill="#c8553d" />
    <rect x={x + 14} y={FLOOR_Y - 150} width={52} height={6} fill="#aab0b2" />
    <path d={`M${x + 4} ${FLOOR_Y - 250} Q${x} ${FLOOR_Y - 330} ${x + 14} ${FLOOR_Y - 380} H${x + 66} Q${x + 80} ${FLOOR_Y - 330} ${x + 76} ${FLOOR_Y - 250} Z`} fill="#9fd0ea" opacity={0.9} />
    <rect x={x + 30} y={FLOOR_Y - 400} width={20} height={22} rx={3} fill="#4a7ab0" />
    <rect x={x + 14} y={FLOOR_Y - 360} width={10} height={90} rx={5} fill="#ffffff" opacity={0.5} />
    <rect x={x + 4} y={FLOOR_Y - 310} width={72} height={4} fill="#7fb8d8" opacity={0.8} />
    <rect x={x + 84} y={FLOOR_Y - 200} width={18} height={60} rx={3} fill="#f4f1ea" />
  </g>
);

/** Ковёр на полу в перспективе (плоский, не мешает ходить). */
const FloorRug = ({ x0, x1, y0, y1, color }: { x0: number; x1: number; y0: number; y1: number; color: string }) => (
  <g>
    <path d={`M${persX(x0, y0)} ${y0} L${persX(x1, y0)} ${y0} L${persX(x1, y1)} ${y1} L${persX(x0, y1)} ${y1} Z`} fill={color} opacity={0.3} />
    <path d={`M${persX(x0 + 30, y0 + 10)} ${y0 + 10} L${persX(x1 - 30, y0 + 10)} ${y0 + 10} L${persX(x1 - 30, y1 - 14)} ${y1 - 14} L${persX(x0 + 30, y1 - 14)} ${y1 - 14} Z`} fill="none" stroke={shade(color, 0.35)} strokeWidth={5} opacity={0.6} />
  </g>
);

/** Потолок «армстронг»: полоса плиток с швами над плашкой рассказчика. */
const GridCeiling = ({ wall }: { wall: string }) => (
  <g>
    <rect x={0} y={0} width={W} height={70} fill={shade(wall, 0.35)} />
    {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={i * 120} y={0} width={4} height={70} fill={shade(wall, -0.1)} />)}
    <rect x={0} y={66} width={W} height={8} fill={shade(wall, -0.12)} />
  </g>
);

const BaseOffice = ({ palette }: { palette: Palette }) => (
  <>
    <Room wall={palette.wall} floor={palette.floor} />
    <WallShade />
    <FloorTiles color={palette.floor} step={150} rows={9} checker={0.035} seam={0.07} />
    <FloorShade />
    <FloorRug x0={330} x1={1000} y0={1220} y1={1420} color={shade(palette.accent, -0.3)} />
    <GridCeiling wall={palette.wall} />
    <Wainscot wall={palette.wall} />
    <Baseboard color={shade(palette.wall, -0.3)} h={18} />
    <CeilingLight x={140} />
    <CeilingLight x={640} />
    <Certificate x={120} y={460} accent={palette.accent} />
    <BinderShelf x={40} y={712} w={270} accent={palette.accent} />
    <SalesChart x={330} y={446} w={240} h={196} accent={palette.accent} />
    <Calendar x={350} y={690} w={112} h={140} accent={palette.accent} pic="#9fc7a0" />
    <Clock cx={522} cy={740} r={40} rim="#3a4148" h={9} m={55} />
    <BlindsWindow x={600} y={450} w={340} h={360} wall={palette.wall} />
    <Radiator x={760} w={170} y={1000} h={110} color="#eceae4" />
    <WaterCooler x={650} />
    <BossDesk accent={palette.accent} />
    <Shadow cx={0.53 * W} w={140} />
    <SeatAt x={0.53} z={1} kind="office" color="#2f2a2a" back={230} />
    <Shadow cx={985} w={150} />
    <Plant x={985} scale={1.15} pot={palette.accent} />
    <Shadow cx={0.72 * W} w={140} y={1275} o={0.14} />
    <SeatAt x={0.72} z={0.5} kind="chair" color={WOOD_D} pad={palette.accent} />
  </>
);

/* ---------- tv-studio ---------- */

const StudioLight = ({ x, flip = false }: { x: number; flip?: boolean }) => {
  const d = flip ? -1 : 1;
  return (
    <g>
      <rect x={x - 6} y={760} width={12} height={FLOOR_Y - 770} fill="#2a2a30" />
      <path d={`M${x} ${FLOOR_Y - 120} L${x - 70} ${FLOOR_Y} M${x} ${FLOOR_Y - 120} L${x + 70} ${FLOOR_Y}`} stroke="#2a2a30" strokeWidth={10} />
      <g transform={`rotate(${25 * d} ${x} 740)`}>
        <rect x={x - 70} y={690} width={140} height={110} rx={18} fill="#3a3a44" />
        <rect x={x - 54} y={700} width={108} height={90} rx={12} fill="#fff4cf" />
      </g>
    </g>
  );
};

const TvStudio = ({ palette }: { palette: Palette }) => {
  const back = shade(palette.accent, -0.15);
  const floor = "#3a3e4a";
  return (
    <>
      <Room wall="#2b2f3a" floor={floor} />
      {/* дальняя стена: акустические панели */}
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={i * 122 + 6} y={300} width={110} height={FLOOR_Y - 330} rx={8} fill="#313644" />
      ))}
      <WallShade top={0.04} bottom={0.2} />
      {/* глянцевый пол: отражения и разметка скотчем */}
      <FloorTiles color={floor} step={260} rows={5} checker={0.05} seam={0.08} />
      <path d={`M300 ${FLOOR_Y} L780 ${FLOOR_Y} L900 1920 L180 1920 Z`} fill="#ffffff" opacity={0.035} />
      <rect x={380} y={FLOOR_Y + 6} width={320} height={10} rx={5} fill={shade(palette.accent, 0.3)} opacity={0.35} />
      {/* кабели по полу у краёв */}
      <path d={`M0 1480 Q120 1440 90 1360 Q60 1290 150 ${FLOOR_Y + 30}`} stroke="#1d2028" strokeWidth={10} fill="none" />
      <path d={`M1080 1520 Q940 1470 990 1380 Q1030 1300 930 ${FLOOR_Y + 30}`} stroke="#1d2028" strokeWidth={10} fill="none" />
      <FloorShade strength={0.35} />
      {/* потолочная ферма с прожекторами */}
      <rect x={0} y={40} width={W} height={22} fill="#1d2028" />
      <rect x={0} y={8} width={W} height={10} fill="#1d2028" />
      <path d={Array.from({ length: 18 }).map((_, i) => `M${i * 60} 18 L${i * 60 + 30} 40 L${i * 60 + 60} 18`).join(" ")} stroke="#1d2028" strokeWidth={5} fill="none" />
      {[180, 420, 660, 900].map((x) => (
        <g key={x}>
          <Glow cx={x} cy={150} rx={150} ry={90} opacity={0.5} />
          <rect x={x - 6} y={62} width={12} height={30} fill="#1d2028" />
          <rect x={x - 34} y={88} width={68} height={50} rx={12} fill="#3a3a44" />
          <rect x={x - 40} y={84} width={10} height={58} rx={3} fill="#2a2a30" />
          <rect x={x + 30} y={84} width={10} height={58} rx={3} fill="#2a2a30" />
          <rect x={x - 24} y={130} width={48} height={10} rx={4} fill="#fff4cf" />
        </g>
      ))}
      {/* цветной задник: LED-панели, кольцо лампочек, бегущая строка */}
      <Glow cx={540} cy={720} rx={560} ry={360} color={shade(palette.accent, 0.3)} opacity={0.35} />
      <rect x={110} y={440} width={860} height={560} rx={60} fill={back} />
      {Array.from({ length: 6 }).map((_, i) => <rect key={`v${i}`} x={110 + (i + 1) * 123} y={440} width={3} height={560} fill="#000000" opacity={0.12} />)}
      {Array.from({ length: 3 }).map((_, i) => <rect key={`h${i}`} x={110} y={440 + (i + 1) * 140} width={860} height={3} fill="#000000" opacity={0.12} />)}
      <circle cx={540} cy={720} r={230} fill={shade(palette.accent, 0.12)} />
      <circle cx={540} cy={720} r={150} fill={shade(palette.accent, 0.25)} />
      <circle cx={540} cy={720} r={80} fill={shade(palette.accent, 0.4)} />
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2;
        return <circle key={i} cx={540 + Math.cos(a) * 262} cy={720 + Math.sin(a) * 262} r={7} fill="#fff4cf" opacity={i % 2 ? 0.9 : 0.55} />;
      })}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={150} y={480 + i * 34} width={110 - i * 22} height={14} rx={7} fill={shade(palette.accent, 0.3)} />
      ))}
      <rect x={110} y={940} width={860} height={44} fill={shade(palette.accent, -0.35)} />
      <rect x={110} y={940} width={150} height={44} fill="#c8553d" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={290 + i * 130} y={956} width={70 + (i % 2) * 30} height={12} rx={6} fill="#ffffff" opacity={0.7} />)}
      {/* лампа «в эфире» */}
      <Glow cx={900} cy={490} rx={110} ry={60} color="#ff5a3a" opacity={0.6} />
      <rect x={846} y={468} width={108} height={44} rx={12} fill="#c8352d" />
      <circle cx={868} cy={490} r={8} fill="#ffffff" />
      <rect x={884} y={484} width={56} height={12} rx={6} fill="#ffe0d8" />
      {/* лучи света */}
      <path d="M420 140 L250 1190 L560 1190 Z" fill="#fff4cf" opacity={0.07} />
      <path d="M660 140 L520 1190 L840 1190 Z" fill="#fff4cf" opacity={0.07} />
      {/* стол с микрофоном посередине, кресло ведущего слева (host), кресло гостя справа (guest) */}
      <Shadow cx={540} w={360} o={0.3} />
      <path d="M380 1000 Q540 976 700 1000 L690 1190 L390 1190 Z" fill="#e8e4dc" />
      <path d="M380 1000 Q540 976 700 1000 L698 1040 Q540 1016 382 1040 Z" fill="#ffffff" opacity={0.4} />
      <path d="M370 988 Q540 962 710 988 L710 1014 Q540 990 370 1014 Z" fill={palette.accent} />
      <rect x={490} y={1060} width={100} height={50} rx={10} fill={shade(palette.accent, -0.1)} />
      <circle cx={540} cy={1085} r={14} fill="#ffffff" opacity={0.8} />
      <rect x={612} y={906} width={10} height={80} rx={4} fill="#2a2a30" />
      <rect x={598} y={972} width={38} height={14} rx={6} fill="#2a2a30" />
      <rect x={603} y={872} width={28} height={50} rx={14} fill="#4a4a54" />
      <rect x={600} y={900} width={34} height={14} rx={4} fill={palette.accent} />
      <rect x={420} y={958} width={90} height={20} rx={3} fill={PAPER} />
      <rect x={430} y={950} width={80} height={10} rx={2} fill={shade(PAPER, -0.06)} />
      {/* кружки ведущего и гостя */}
      <rect x={392} y={950} width={24} height={30} rx={6} fill="#c8553d" />
      <rect x={660} y={950} width={24} height={30} rx={6} fill="#f4f1ea" />
      <rect x={662} y={958} width={20} height={6} fill={palette.accent} />
      <Shadow cx={0.24 * W} w={140} o={0.3} />
      <SeatAt x={0.24} z={1} kind="office" color="#3a3a44" back={210} />
      <Shadow cx={0.76 * W} w={180} o={0.3} />
      <SeatAt x={0.76} z={1} kind="armchair" color={shade(palette.accent, -0.25)} />
      {/* растение у кресла гостя и монитор-«суфлёр» у ведущего */}
      <rect x={30} y={1020} width={8} height={170} fill="#1d2028" />
      <rect x={-10} y={960} width={110} height={70} rx={8} fill="#1d2028" />
      <rect x={-2} y={968} width={94} height={54} rx={4} fill={shade(palette.accent, 0.25)} />
      <rect x={6} y={980} width={60} height={8} rx={4} fill="#ffffff" opacity={0.8} />
      <rect x={6} y={996} width={46} height={8} rx={4} fill="#ffffff" opacity={0.6} />
      <StudioLight x={70} />
      <StudioLight x={1010} flip />
      {/* лёгкая дымка */}
      <Glow cx={540} cy={1100} rx={700} ry={180} color="#9aa8c8" opacity={0.12} />
    </>
  );
};

/* ---------- police-station ---------- */

const WantedPoster = ({ x, y, tilt = 0, face = "#8a7a66" }: { x: number; y: number; tilt?: number; face?: string }) => (
  <g transform={`rotate(${tilt} ${x + 60} ${y + 75})`}>
    <rect x={x + 3} y={y + 5} width={120} height={150} rx={4} fill="#000000" opacity={0.15} />
    <rect x={x} y={y} width={120} height={150} rx={4} fill="#efe2bf" />
    <rect x={x + 30} y={y + 14} width={60} height={12} rx={6} fill="#b4452f" />
    <circle cx={x + 60} cy={y + 66} r={24} fill={face} />
    <path d={`M${x + 24} ${y + 128} q36 -48 72 0 Z`} fill={face} />
    <rect x={x + 28} y={y + 134} width={64} height={6} rx={3} fill="#cdbf9c" />
    <circle cx={x + 60} cy={y + 8} r={6} fill="#c8553d" />
  </g>
);

/** Решётчатая дверь камеры; за ней видна камера: нары, окошко с решёткой. */
const BarredDoor = ({ x }: { x: number }) => {
  const y = FLOOR_Y - 560;
  const w = 260;
  return (
    <g>
      <rect x={x - 16} y={y - 16} width={w + 32} height={576} rx={8} fill="#5d6870" />
      <rect x={x} y={y} width={w} height={560} fill="#3a4148" />
      {/* камера внутри */}
      <rect x={x} y={y + 400} width={w} height={160} fill="#30363c" />
      <rect x={x + 150} y={y + 70} width={70} height={56} rx={4} fill="#6a8aa8" />
      <Glow cx={x + 185} cy={y + 200} rx={90} ry={150} color="#a8c8e0" opacity={0.25} />
      {[0, 1, 2].map((i) => <rect key={i} x={x + 160 + i * 20} y={y + 70} width={6} height={56} fill="#2b3036" />)}
      <rect x={x + 20} y={y + 380} width={170} height={26} rx={4} fill="#7a5a3a" />
      <rect x={x + 30} y={y + 406} width={10} height={60} fill="#2b3036" />
      <rect x={x + 170} y={y + 406} width={10} height={60} fill="#2b3036" />
      <rect x={x + 30} y={y + 362} width={70} height={22} rx={10} fill="#8a8f96" />
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <rect x={x + 18 + i * 44} y={y} width={12} height={560} rx={6} fill="#9aa5ad" />
          <rect x={x + 20 + i * 44} y={y} width={4} height={560} fill="#ffffff" opacity={0.25} />
        </g>
      ))}
      <rect x={x} y={y + 120} width={w} height={14} fill="#9aa5ad" />
      <rect x={x} y={y + 380} width={w} height={14} fill="#9aa5ad" />
      <rect x={x + 10} y={y + 260} width={46} height={60} rx={8} fill="#7d878f" />
      <circle cx={x + 33} cy={y + 290} r={8} fill="#3a4148" />
    </g>
  );
};

/** Ростомер для фото задержанных: горизонтальные линии с делениями. */
const HeightChart = ({ x, w }: { x: number; w: number }) => (
  <g>
    <rect x={x} y={640} width={w} height={FLOOR_Y - 660} fill="#e8ece8" opacity={0.3} />
    {Array.from({ length: 13 }).map((_, i) => {
      const y = 660 + i * 40;
      const big = i % 2 === 0;
      return <rect key={i} x={x} y={y} width={big ? w : w * 0.35} height={big ? 5 : 3} fill="#3a4148" opacity={big ? 0.55 : 0.35} />;
    })}
  </g>
);

const PoliceStation = ({ palette }: { palette: Palette }) => (
  <>
    <Room wall={palette.wall} floor={palette.floor} />
    <WallShade />
    <FloorTiles color={palette.floor} step={180} rows={8} checker={0.06} seam={0.1} />
    <FloorShade />
    <Wainscot wall={palette.wall} top={880} />
    <rect x={0} y={860} width={W} height={20} fill={palette.accent} />
    <Baseboard color={shade(palette.wall, -0.35)} h={18} />
    <GridCeiling wall={palette.wall} />
    <CeilingLight x={120} />
    <CeilingLight x={620} />
    {/* пробковая доска с ориентировками, картой участка и нитками */}
    <rect x={96} y={451} width={470} height={210} rx={10} fill="#000000" opacity={0.12} />
    <rect x={90} y={445} width={470} height={210} rx={10} fill="#b98a5a" />
    <rect x={102} y={457} width={446} height={186} rx={6} fill="#c99c6a" />
    {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={110 + rnd(i) * 430} cy={465 + rnd(i + 40) * 170} r={2.5} fill="#a87a4a" />)}
    <WantedPoster x={124} y={472} tilt={-4} />
    <WantedPoster x={264} y={470} tilt={3} face="#6f6255" />
    <WantedPoster x={404} y={474} tilt={-2} face="#94826c" />
    <path d="M184 480 L324 478 L464 482" stroke="#c8352d" strokeWidth={3} fill="none" />
    {/* часы и ростомер */}
    <Clock cx={690} cy={530} r={56} rim="#3a4148" face="#f4f1ea" h={2} m={10} />
    <HeightChart x={600} w={170} />
    {/* наручники и связка ключей на крючках у камеры */}
    <rect x={752} y={706} width={8} height={14} rx={3} fill="#3a4148" />
    <circle cx={756} cy={740} r={16} fill="none" stroke="#9aa5ad" strokeWidth={6} />
    <circle cx={756} cy={776} r={16} fill="none" stroke="#9aa5ad" strokeWidth={6} />
    <rect x={752} y={754} width={8} height={8} fill="#9aa5ad" />
    <BarredDoor x={790} />
    <circle cx={812} cy={1000} r={12} fill="none" stroke="#c9a24a" strokeWidth={5} />
    <rect x={806} y={1010} width={6} height={30} fill="#c9a24a" transform="rotate(-15 809 1010)" />
    <rect x={814} y={1010} width={6} height={26} fill="#b8963a" transform="rotate(12 817 1010)" />
    {/* стул дежурного (метка desk) — за столом; сам стол и табурет задержанного — передний слой (PoliceFront) */}
    <Shadow cx={0.4 * W} w={130} y={feetY(0.95)} />
    <SeatAt x={0.4} z={0.95} kind="office" color="#3a4148" />
    <Shadow cx={435} w={480} y={FRONT_FEET - 4} o={0.18} />
    <Shadow cx={0.2 * W} w={110} y={1275} o={0.14} />
  </>
);

/** Передний слой участка: дежурный стол (дежурный сидит за ним — desk, z 0.95) и табурет задержанного перед столом (suspect). */
const PoliceFront = ({ palette }: { palette: Palette }) => {
  const top = DESK_TOP;
  const x0 = 220, x1 = 650;
  return (
    <>
      <rect x={x0 + 14} y={top + 26} width={x1 - x0 - 28} height={FRONT_FEET - top - 26} fill="#4a545c" />
      <rect x={x0 + 14} y={top + 26} width={x1 - x0 - 28} height={12} fill="#00000025" />
      <rect x={x0 + 34} y={top + 50} width={150} height={70} rx={6} fill="#00000020" />
      <rect x={x0 + 34} y={top + 130} width={150} height={60} rx={6} fill="#00000020" />
      <rect x={x0 + 94} y={top + 80} width={30} height={8} rx={4} fill="#9aa5ad" />
      <rect x={x0 + 94} y={top + 156} width={30} height={8} rx={4} fill="#9aa5ad" />
      <rect x={x0 + 210} y={top + 50} width={190} height={140} rx={6} fill="#00000014" />
      <rect x={x0 + 280} y={top + 70} width={50} height={50} rx={25} fill={palette.accent} opacity={0.8} />
      <path d={`M${x0 + 305} ${top + 78} l7 14 l15 2 l-11 10 l3 15 l-14 -8 l-14 8 l3 -15 l-11 -10 l15 -2 Z`} fill="#f4f1ea" />
      <rect x={x0} y={top} width={x1 - x0} height={26} rx={6} fill="#5d6870" />
      <rect x={x0} y={top} width={x1 - x0} height={7} rx={4} fill="#7d878f" />
      {/* монитор и рация слева, бумаги посередине, коробка пончиков и лампа справа — место дежурного (x 0.4) свободно */}
      <rect x={232} y={top - 55} width={80} height={55} rx={6} fill="#2b3036" />
      <rect x={242} y={top - 45} width={60} height={30} rx={4} fill="#6aa0c8" />
      <rect x={326} y={top - 40} width={22} height={40} rx={5} fill="#2b3036" />
      <rect x={334} y={top - 60} width={5} height={22} fill="#2b3036" />
      <rect x={330} y={top - 32} width={14} height={8} rx={2} fill="#7fe0a0" opacity={0.8} />
      <rect x={440} y={top - 22} width={100} height={22} rx={3} fill={PAPER} />
      <rect x={446} y={top - 32} width={90} height={10} rx={2} fill="#e8c46a" />
      <rect x={556} y={top - 35} width={30} height={35} rx={4} fill="#f2e0b8" />
      <circle cx={564} cy={top - 35} r={9} fill="#d9a07a" />
      <circle cx={564} cy={top - 35} r={3.5} fill="#f2e0b8" />
      <circle cx={580} cy={top - 39} r={9} fill="#e88aa8" />
      <circle cx={580} cy={top - 39} r={3.5} fill="#f2e0b8" />
      <Glow cx={620} cy={top - 20} rx={80} ry={36} opacity={0.5} />
      <rect x={618} y={top - 80} width={10} height={60} fill="#2b3036" transform={`rotate(-20 623 ${top})`} />
      <path d={`M590 ${top - 100} l60 0 l-10 34 l-40 0 Z`} fill={palette.accent} transform={`rotate(-20 620 ${top - 80})`} />
      {/* табурет задержанного перед столом (suspect, средний план) */}
      <SeatAt x={0.2} z={0.5} kind="stool" color="#5d6870" />
    </>
  );
};

/* ---------- bank / government-office ---------- */

const Stamp = ({ x, top, color }: { x: number; top: number; color: string }) => (
  <g>
    <rect x={x - 26} y={top - 8} width={52} height={14} rx={4} fill={color} />
    <rect x={x - 8} y={top - 42} width={16} height={36} rx={4} fill="#5a4030" />
    <circle cx={x} cy={top - 46} r={14} fill="#5a4030" />
  </g>
);

const Stanchion = ({ x, y = FLOOR_Y }: { x: number; y?: number }) => (
  <g fill="#c9a24a">
    <ellipse cx={x} cy={y - 4} rx={34} ry={10} />
    <rect x={x - 6} y={y - 190} width={12} height={186} />
    <rect x={x - 2} y={y - 190} width={4} height={186} fill="#f2d68a" />
    <circle cx={x} cy={y - 194} r={12} />
  </g>
);

/** Табло курсов: строки «флажок — цифры». */
const RateBoard = ({ x, y, w, accent }: { x: number; y: number; w: number; accent: string }) => {
  const flags = [["#3a5fa0", "#ffffff", "#c8352d"], ["#2a4a8a", "#e8c040", "#2a4a8a"], ["#c8352d", "#ffffff", "#3a5fa0"]];
  return (
    <g>
      <rect x={x + 5} y={y + 7} width={w} height={140} rx={8} fill="#000000" opacity={0.12} />
      <rect x={x} y={y} width={w} height={140} rx={8} fill="#22262e" />
      <rect x={x} y={y} width={w} height={26} rx={8} fill={accent} />
      {flags.map((f, i) => (
        <g key={i}>
          {f.map((c, j) => <rect key={j} x={x + 14} y={y + 36 + i * 34 + j * 8} width={36} height={8} fill={c} />)}
          {[0, 1].map((k) => (
            <g key={k}>
              {[0, 1, 2].map((d) => (
                <Digit key={d} x={x + 66 + k * (w - 80) / 2 + d * 18} y={y + 36 + i * 34} d={String(Math.floor(rnd(i * 7 + k * 3 + d) * 10))} s={0.6} color={k ? "#ff8a5a" : "#7fe0a0"} />
              ))}
            </g>
          ))}
        </g>
      ))}
    </g>
  );
};

/** Банк: стена, табло, часы и то, что за перегородкой у стены (шкафы с ячейками, мониторы); пол. */
const BankCounter = ({ palette }: { palette: Palette }) => {
  const marble = shade(palette.wall, 0.25);
  return (
    <>
      <Room wall={palette.wall} floor={palette.floor} />
      {/* мраморные панели стены */}
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <rect x={i * 180 + 4} y={70} width={172} height={520} fill={marble} opacity={0.5} />
          <path d={`M${i * 180 + 20} ${120 + rnd(i) * 80} q60 ${40 + rnd(i + 3) * 60} 40 ${160 + rnd(i + 5) * 80} t60 200`} stroke={shade(palette.wall, -0.08)} strokeWidth={3} fill="none" opacity={0.6} />
        </g>
      ))}
      <WallShade />
      <FloorTiles color={palette.floor} step={220} rows={6} checker={0.12} seam={0.1} />
      <FloorShade />
      <GridCeiling wall={palette.wall} />
      <CeilingLight x={80} w={260} />
      <CeilingLight x={410} w={260} />
      <CeilingLight x={740} w={260} />
      {/* часы и табло курсов над окошками */}
      <Clock cx={540} cy={500} r={52} rim={palette.accent} face="#f4f1ea" hand="#333333" h={11} m={50} />
      <RateBoard x={130} y={436} w={250} accent={palette.accent} />
      <RateBoard x={700} y={436} w={250} accent={palette.accent} />
      {/* за перегородкой, у стены: шкафы с ячейками, мониторы, сейф */}
      <rect x={0} y={640} width={W} height={FLOOR_Y - 640} fill={shade(palette.wall, -0.08)} />
      {[0, 1, 2].map((i) => {
        const x = 20 + i * 350;
        return (
          <g key={i}>
            <rect x={x + 44} y={660} width={80} height={300} rx={4} fill={shade(palette.wall, -0.18)} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => <rect key={k} x={x + 52} y={668 + k * 36} width={64} height={28} rx={2} fill={shade(palette.wall, -0.26)} />)}
            <rect x={x + 236} y={800} width={70} height={52} rx={4} fill="#3a4148" />
            <rect x={x + 242} y={806} width={58} height={38} rx={3} fill="#6aa0c8" opacity={0.8} />
            <rect x={x + 262} y={852} width={18} height={60} fill="#3a4148" />
          </g>
        );
      })}
      <Shadow cx={540} w={1160} y={FRONT_FEET - 4} o={0.16} />
      <Shadow cx={0.78 * W} w={0.32 * W} y={1275} o={0.14} />
      <Shadow cx={155} w={260} y={1275} o={0.1} />
    </>
  );
};

/**
 * Передний слой банка: перегородка с тремя стеклянными окошками (полупрозрачными — кассир за ними виден, teller-1…3)
 * и стойка во всю ширину; на стойке штампы, ручка на цепочке, звонок, бланки, цветок. Перед стойкой — стойки очереди
 * (queue) и стулья ожидания (wait-1…3) на среднем плане.
 */
const BankFront = ({ palette }: { palette: Palette }) => {
  const top = DESK_TOP;
  const glass = "#d8ecf4";
  return (
    <>
      {/* перегородка: рама, простенки между окошками, стекло */}
      <rect x={0} y={590} width={W} height={24} fill={shade(palette.accent, -0.1)} />
      {[0, 1, 2].map((i) => {
        const x = 20 + i * 350;
        return (
          <g key={i}>
            <rect x={x} y={614} width={30} height={top - 614} fill={shade(palette.wall, -0.12)} />
            <rect x={x + 310} y={614} width={30} height={top - 614} fill={shade(palette.wall, -0.12)} />
            <rect x={x + 30} y={614} width={280} height={26} fill={shade(palette.wall, -0.12)} />
            <rect x={x + 30} y={640} width={280} height={top - 640} fill={glass} opacity={0.3} />
            <rect x={x + 30} y={640} width={280} height={top - 640} fill="none" stroke={shade(palette.wall, -0.2)} strokeWidth={6} />
            <path d={`M${x + 120} ${top} v-60 a50 50 0 0 1 100 0 v60 Z`} fill="#000000" opacity={0.08} />
            <path d={`M${x + 120} ${top} v-60 a50 50 0 0 1 100 0 v60`} fill="none" stroke={shade(palette.wall, -0.2)} strokeWidth={5} />
            <rect x={x + 120} y={650} width={100} height={36} rx={6} fill={palette.accent} />
            <Digit x={x + 158} y={656} d={String(i + 1)} s={0.6} color="#ffffff" />
            <path d={`M${x + 50} 700 l40 0 l-30 140 l-40 0 Z`} fill="#ffffff" opacity={0.25} />
          </g>
        );
      })}
      <rect x={0} y={614} width={20} height={top - 614} fill={shade(palette.wall, -0.12)} />
      <rect x={1060} y={614} width={20} height={top - 614} fill={shade(palette.wall, -0.12)} />
      {/* стойка */}
      <rect x={0} y={top + 26} width={W} height={FRONT_FEET - top - 26} fill={shade(palette.wall, -0.22)} />
      <rect x={0} y={top + 26} width={W} height={12} fill="#00000020" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={50 + i * 350} y={top + 60} width={280} height={FRONT_FEET - top - 90} rx={8} fill="#00000014" />
      ))}
      <rect x={0} y={top} width={W} height={26} fill="#e8e1d2" />
      <rect x={0} y={top} width={W} height={7} fill="#ffffff" opacity={0.5} />
      <Stamp x={110} top={top + 14} color="#c8553d" />
      <Stamp x={260} top={top + 14} color={palette.accent} />
      <rect x={760} y={top - 6} width={110} height={20} rx={3} fill={PAPER} />
      <rect x={764} y={top - 16} width={104} height={12} rx={3} fill="#e6ddc8" />
      {/* ручка на цепочке, звонок, бланки, цветок */}
      <rect x={400} y={top} width={30} height={14} rx={4} fill="#3a4148" />
      <rect x={410} y={top - 20} width={5} height={24} fill="#2d3640" transform={`rotate(25 412 ${top + 4})`} />
      <path d={`M416 ${top + 14} q10 18 30 4`} stroke="#9aa5ad" strokeWidth={3} fill="none" />
      <ellipse cx={660} cy={top + 12} rx={18} ry={5} fill="#3a4148" />
      <path d={`M644 ${top + 12} a16 16 0 0 1 32 0 Z`} fill="#c9a24a" />
      <rect x={658} y={top - 10} width={4} height={8} fill="#3a4148" />
      <rect x={990} y={top - 16} width={30} height={30} rx={5} fill={palette.accent} />
      <ellipse cx={998} cy={top - 32} rx={10} ry={20} fill="#5b8c5a" transform={`rotate(-20 998 ${top - 32})`} />
      <ellipse cx={1014} cy={top - 34} rx={9} ry={18} fill="#6a9c68" transform={`rotate(20 1014 ${top - 34})`} />
      {/* ограждение очереди (queue) и стулья ожидания (wait-1…3) — средний план */}
      <Stanchion x={60} y={feetY(0.5)} />
      <Stanchion x={250} y={feetY(0.5)} />
      <path d={`M60 ${feetY(0.5) - 186} Q155 ${feetY(0.5) - 120} 250 ${feetY(0.5) - 186}`} stroke="#b4452f" strokeWidth={14} fill="none" strokeLinecap="round" />
      {[0.66, 0.78, 0.9].map((x) => (
        <SeatAt key={x} x={x} z={0.5} kind="chair" color={shade(palette.accent, -0.3)} pad={palette.accent} back={130} />
      ))}
    </>
  );
};

export const Ofis = ({ palette, variant, layer = "back" }: BackdropProps) => {
  const bank = variant === "bank" || variant === "government-office";
  if (layer === "front") {
    // передний слой — дежурный стол участка и стойка банка; кабинет и студия без него
    if (variant === "police-station") return <Canvas><PoliceFront palette={palette} /></Canvas>;
    if (bank) return <Canvas><BankFront palette={palette} /></Canvas>;
    return null;
  }
  return (
    <Canvas>
      {variant === "tv-studio" ? (
        <TvStudio palette={palette} />
      ) : variant === "police-station" ? (
        <PoliceStation palette={palette} />
      ) : bank ? (
        <BankCounter palette={palette} />
      ) : (
        <BaseOffice palette={palette} />
      )}
    </Canvas>
  );
};
