import { Canvas, Room, FLOOR_Y, W, type BackdropProps } from "./parts";
import { SeatAt } from "./gostinaya";
import { depthScale, feetY, seatTopY } from "../world/depth";
import { WallShade, FloorShade, FloorPlanks, Glow, Shadow, Baseboard, rnd } from "./bolnitsa";
import { FONT } from "../fonts";

/**
 * Фон «klass»: школьный класс (парты сбоку: стул под меткой pupil-*, парта справа от него; стул учителя слева от его стола);
 * вариант university — аудитория с рядами амфитеатром и передним рядом откидных сидений (row-1…row-4).
 */

const rgb = (c: string) => {
  const h = c.replace("#", "");
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
};
const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const dark = (c: string, t: number) => mix(c, "#000000", t);
const light = (c: string, t: number) => mix(c, "#ffffff", t);

const WOOD = "#a8774f";
const CHALK = "#eef2e6";
const INK = "#2b2a2e";
const METAL = "#7d878c";
const RED = "#c8553d";

/** Зелёная доска с меловыми каракулями (фигуры, не слова). */
const Blackboard = ({ x, y, w, h, accent }: { x: number; y: number; w: number; h: number; accent: string }) => {
  const board = dark(accent, 0.42);
  const s = { stroke: CHALK, strokeWidth: 6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, opacity: 0.85 };
  const ix = x + 16;
  const iy = y + 16;
  return (
    <g>
      <rect x={x + 8} y={y + 10} width={w} height={h} rx={10} fill="#00000020" />
      <rect x={x} y={y} width={w} height={h} rx={10} fill={WOOD} />
      <rect x={ix} y={iy} width={w - 32} height={h - 32} rx={4} fill={board} />
      {/* стёртое пятно */}
      <ellipse cx={x + w * 0.72} cy={y + h * 0.7} rx={90} ry={34} fill={CHALK} opacity={0.08} />
      {/* треугольник с высотой */}
      <path d={`M${ix + 40} ${iy + 190} L${ix + 110} ${iy + 50} L${ix + 180} ${iy + 190} Z`} {...s} />
      <path d={`M${ix + 110} ${iy + 50} L${ix + 110} ${iy + 190}`} {...s} strokeWidth={4} strokeDasharray="10 10" />
      {/* круг с радиусом */}
      <circle cx={ix + 280} cy={iy + 110} r={56} {...s} />
      <path d={`M${ix + 280} ${iy + 110} L${ix + 330} ${iy + 86}`} {...s} />
      <circle cx={ix + 280} cy={iy + 110} r={5} fill={CHALK} opacity={0.85} />
      {/* «пример» — каракули и чёрточки */}
      <path d={`M${ix + 380} ${iy + 60} q12 -22 24 0 t24 0 t24 0`} {...s} />
      <path d={`M${ix + 470} ${iy + 52} h26 M${ix + 483} ${iy + 39} v26`} {...s} />
      <path d={`M${ix + 510} ${iy + 60} q12 -22 24 0 t24 0`} {...s} />
      <path d={`M${ix + 380} ${iy + 120} q14 -24 28 0 t28 0 t28 0 t28 0 t28 0`} {...s} />
      <path d={`M${ix + 380} ${iy + 180} q14 -24 28 0 t28 0 t28 0`} {...s} />
      <path d={`M${ix + 480} ${iy + 172} h30 M${ix + 480} ${iy + 186} h30`} {...s} />
      <circle cx={ix + 545} cy={iy + 178} r={14} {...s} />
      {/* полочка: мел и тряпка */}
      <rect x={x + 20} y={y + h} width={w - 40} height={16} rx={6} fill={dark(WOOD, 0.15)} />
      <rect x={x + 80} y={y + h - 8} width={34} height={10} rx={4} fill={CHALK} />
      <rect x={x + 130} y={y + h - 8} width={24} height={10} rx={4} fill="#f3d27a" />
      <rect x={x + w - 160} y={y + h - 22} width={74} height={24} rx={6} fill="#6b4429" />
      <rect x={x + w - 160} y={y + h - 22} width={74} height={9} rx={4} fill="#c9c0aa" />
    </g>
  );
};

/** Карта мира на рейке. */
const WorldMap = ({ x, y, w, h, accent }: { x: number; y: number; w: number; h: number; accent: string }) => (
  <g>
    <rect x={x + 6} y={y + 8} width={w} height={h} fill="#00000018" />
    <rect x={x} y={y} width={w} height={h} fill="#a9d3e6" />
    <ellipse cx={x + w * 0.24} cy={y + h * 0.32} rx={w * 0.14} ry={h * 0.16} fill={accent} />
    <ellipse cx={x + w * 0.3} cy={y + h * 0.7} rx={w * 0.07} ry={h * 0.17} fill={accent} transform={`rotate(-15 ${x + w * 0.3} ${y + h * 0.7})`} />
    <ellipse cx={x + w * 0.58} cy={y + h * 0.3} rx={w * 0.12} ry={h * 0.12} fill="#d9b86a" />
    <ellipse cx={x + w * 0.56} cy={y + h * 0.6} rx={w * 0.07} ry={h * 0.17} fill="#d9b86a" />
    <ellipse cx={x + w * 0.78} cy={y + h * 0.34} rx={w * 0.15} ry={h * 0.13} fill={accent} />
    <ellipse cx={x + w * 0.84} cy={y + h * 0.76} rx={w * 0.07} ry={h * 0.07} fill="#d9b86a" />
    <rect x={x - 12} y={y - 10} width={w + 24} height={14} rx={7} fill="#6b4429" />
    <rect x={x - 12} y={y + h - 4} width={w + 24} height={14} rx={7} fill="#6b4429" />
  </g>
);

const Clock = ({ cx, cy, r = 52 }: { cx: number; cy: number; r?: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={INK} />
    <circle cx={cx} cy={cy} r={r - 9} fill="#f7f3e8" />
    <path d={`M${cx} ${cy} L${cx} ${cy - r * 0.6} M${cx} ${cy} L${cx + r * 0.42} ${cy + r * 0.12}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <circle cx={cx} cy={cy} r={6} fill={RED} />
  </g>
);

/** Ученическая парта со стулом, вид сбоку: сиденье стула под меткой (x, z), парта справа — ученик смотрит на доску. */
const SchoolDesk = ({ x, z, wood = WOOD, accent }: { x: number; z: number; wood?: string; accent: string }) => {
  const s = depthScale(z);
  const cx = x * W;
  const top = seatTopY(z);
  const fy = feetY(z);
  const hw = 52 * s;
  const dl = cx + hw + 4 * s;
  const dw = 130 * s;
  const dtop = top - 74 * s;
  return (
    <g>
      {/* стул: спинка слева */}
      <rect x={cx - hw} y={top - 130 * s} width={16 * s} height={fy - top + 130 * s} fill={METAL} />
      <rect x={cx + hw - 16 * s} y={top} width={14 * s} height={fy - top} fill={METAL} />
      <rect x={cx - hw - 4 * s} y={top - 132 * s} width={30 * s} height={90 * s} rx={10 * s} fill={dark(wood, 0.08)} />
      <rect x={cx - hw} y={top} width={hw * 2} height={18 * s} rx={8 * s} fill={dark(wood, 0.08)} />
      {/* парта */}
      <rect x={dl + 6 * s} y={dtop} width={14 * s} height={fy - dtop} fill={METAL} />
      <rect x={dl + dw - 20 * s} y={dtop} width={14 * s} height={fy - dtop} fill={METAL} />
      <rect x={dl} y={dtop + 22 * s} width={dw} height={40 * s} rx={6 * s} fill={dark(wood, 0.18)} />
      <path d={`M${dl - 6 * s} ${dtop - 10 * s} L${dl + dw + 4 * s} ${dtop - 2 * s} L${dl + dw + 4 * s} ${dtop + 18 * s} L${dl - 6 * s} ${dtop + 14 * s} Z`} fill={wood} />
      {/* книжки */}
      <rect x={dl + 50 * s} y={dtop - 26 * s} width={60 * s} height={16 * s} rx={3 * s} fill={accent} />
      <rect x={dl + 56 * s} y={dtop - 40 * s} width={50 * s} height={14 * s} rx={3 * s} fill={RED} />
    </g>
  );
};

/** Учительский стол с глобусом, книгами и яблоком. */
const TeacherTable = ({ x, w, accent }: { x: number; w: number; accent: string }) => {
  const top = FLOOR_Y - 250;
  return (
    <g>
      <rect x={x + 10} y={top + 24} width={w - 20} height={150} rx={6} fill={dark(WOOD, 0.15)} />
      <rect x={x + 20} y={top + 24} width={22} height={226} fill={dark(WOOD, 0.3)} />
      <rect x={x + w - 42} y={top + 24} width={22} height={226} fill={dark(WOOD, 0.3)} />
      <rect x={x} y={top} width={w} height={28} rx={8} fill={WOOD} />
      {/* глобус */}
      <rect x={x + 60} y={top - 12} width={60} height={12} rx={6} fill={INK} />
      <rect x={x + 86} y={top - 40} width={8} height={30} fill={INK} />
      <circle cx={x + 90} cy={top - 96} r={56} fill="#7fb3d5" />
      <ellipse cx={x + 72} cy={top - 112} rx={24} ry={18} fill={accent} />
      <ellipse cx={x + 108} cy={top - 76} rx={16} ry={20} fill={accent} />
      <path d={`M${x + 30} ${top - 120} A62 62 0 0 1 ${x + 140} ${top - 50}`} stroke={dark(METAL, 0.2)} strokeWidth={7} fill="none" />
      {/* книги и яблоко */}
      <rect x={x + 160} y={top - 26} width={110} height={26} rx={4} fill={accent} />
      <rect x={x + 168} y={top - 48} width={96} height={22} rx={4} fill="#d9b86a" />
      <circle cx={x + 230} cy={top - 70} r={22} fill={RED} />
      <rect x={x + 228} y={top - 100} width={5} height={14} fill="#6b4429" />
      <ellipse cx={x + 242} cy={top - 96} rx={10} ry={5} fill={accent} />
      {/* стакан с карандашами и классный журнал */}
      <rect x={x + 250} y={top - 34} width={24} height={34} rx={4} fill="#4a7ab0" />
      {[0, 1, 2].map((i) => <rect key={i} x={x + 254 + i * 6} y={top - 54 + i * 3} width={4} height={24} fill={[RED, "#e8c46a", accent][i]} transform={`rotate(${(i - 1) * 10} ${x + 256 + i * 6} ${top - 34})`} />)}
      <rect x={x + 150} y={top - 8} width={96} height={8} rx={2} fill="#f4efe2" />
    </g>
  );
};

/** Подвесной светильник-шар на штанге (школа). */
const BallLamp = ({ x, len = 80 }: { x: number; len?: number }) => (
  <g>
    <Glow cx={x} cy={len + 40} rx={220} ry={150} opacity={0.5} />
    <rect x={x - 3} y={0} width={6} height={len} fill="#5a5a5a" />
    <rect x={x - 16} y={len - 6} width={32} height={14} rx={4} fill="#5a5a5a" />
    <circle cx={x} cy={len + 40} r={44} fill="#fbf6e4" />
    <ellipse cx={x - 14} cy={len + 26} rx={12} ry={16} fill="#ffffff" />
  </g>
);

/** Портрет учёного в овальной рамке (борода или парик — по kind). */
const Portrait = ({ x, y, w = 84, h = 104, kind = 0 }: { x: number; y: number; w?: number; h?: number; kind?: number }) => {
  const cx = x + w / 2;
  const hair = ["#e8e4dc", "#3a2a20", "#9a8a7a"][kind % 3];
  return (
    <g>
      <rect x={x + 4} y={y + 6} width={w} height={h} rx={8} fill="#000000" opacity={0.14} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#8a5a3a" />
      <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx={4} fill="#d8cfb8" />
      <path d={`M${x + 12} ${y + h - 7} Q${cx} ${y + h * 0.55} ${x + w - 12} ${y + h - 7} Z`} fill="#3a3a44" />
      <path d={`M${cx - 8} ${y + h * 0.66} L${cx} ${y + h - 10} L${cx + 8} ${y + h * 0.66} Z`} fill="#f4f1ea" />
      <ellipse cx={cx} cy={y + h * 0.42} rx={w * 0.2} ry={h * 0.2} fill="#e8c4a0" />
      {kind % 3 === 0 && <path d={`M${cx - w * 0.26} ${y + h * 0.4} Q${cx - w * 0.3} ${y + h * 0.15} ${cx} ${y + h * 0.18} Q${cx + w * 0.3} ${y + h * 0.15} ${cx + w * 0.26} ${y + h * 0.4} Q${cx + w * 0.3} ${y + h * 0.62} ${cx + w * 0.2} ${y + h * 0.62} L${cx + w * 0.18} ${y + h * 0.38} L${cx - w * 0.18} ${y + h * 0.38} L${cx - w * 0.2} ${y + h * 0.62} Q${cx - w * 0.3} ${y + h * 0.62} ${cx - w * 0.26} ${y + h * 0.4} Z`} fill={hair} />}
      {kind % 3 === 1 && (
        <>
          <path d={`M${cx - w * 0.22} ${y + h * 0.36} Q${cx} ${y + h * 0.12} ${cx + w * 0.22} ${y + h * 0.36} Z`} fill={hair} />
          <path d={`M${cx - w * 0.18} ${y + h * 0.48} Q${cx} ${y + h * 0.76} ${cx + w * 0.18} ${y + h * 0.48} Q${cx} ${y + h * 0.58} ${cx - w * 0.18} ${y + h * 0.48} Z`} fill={hair} />
        </>
      )}
      {kind % 3 === 2 && (
        <>
          <ellipse cx={cx - w * 0.22} cy={y + h * 0.4} rx={w * 0.08} ry={h * 0.12} fill={hair} />
          <ellipse cx={cx + w * 0.22} cy={y + h * 0.4} rx={w * 0.08} ry={h * 0.12} fill={hair} />
          <path d={`M${cx - w * 0.14} ${y + h * 0.52} Q${cx} ${y + h * 0.62} ${cx + w * 0.14} ${y + h * 0.52} L${cx + w * 0.1} ${y + h * 0.58} Q${cx} ${y + h * 0.64} ${cx - w * 0.1} ${y + h * 0.58} Z`} fill={hair} />
        </>
      )}
      <circle cx={cx - w * 0.07} cy={y + h * 0.42} r={2.5} fill={INK} />
      <circle cx={cx + w * 0.07} cy={y + h * 0.42} r={2.5} fill={INK} />
    </g>
  );
};

/** Таблица элементов: цветная сетка клеток. */
const PeriodicTable = ({ x, y, w, h, accent }: { x: number; y: number; w: number; h: number; accent: string }) => {
  const cols = 18;
  const cw = (w - 16) / cols;
  const ch = (h - 34) / 7;
  const cells: [number, number, string][] = [];
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c > 0 && c < 17) continue;
      if ((r === 1 || r === 2) && c > 1 && c < 12) continue;
      const col = c < 2 ? "#e88a6a" : c > 11 ? (c === 17 ? "#9a7ac0" : "#e8c46a") : "#8ab8d8";
      cells.push([r, c, col]);
    }
  return (
    <g>
      <rect x={x + 4} y={y + 6} width={w} height={h} rx={4} fill="#000000" opacity={0.12} />
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#fbf8f0" />
      <rect x={x + 8} y={y + 6} width={w * 0.5} height={10} rx={5} fill={accent} />
      {cells.map(([r, c, col]) => <rect key={`${r}-${c}`} x={x + 8 + c * cw} y={y + 24 + r * ch} width={cw - 1.5} height={ch - 1.5} fill={col} />)}
    </g>
  );
};

/** Полоска цифр над доской: карточки 1…0. */
const NumberStrip = ({ x, y, w, accent }: { x: number; y: number; w: number; accent: string }) => {
  const n = 10;
  const cw = w / n;
  const cols = [accent, RED, "#e8c46a", "#4a7ab0", "#9a7ac0"];
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <rect x={x + i * cw + 3} y={y} width={cw - 6} height={44} rx={5} fill={light(cols[i % cols.length], 0.25)} />
          <text x={x + i * cw + cw / 2} y={y + 35} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={32} fill="#ffffff">{(i + 1) % 10}</text>
        </g>
      ))}
    </g>
  );
};

const Classroom = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => (
  <>
    <Room wall={wall} floor={floor} />
    <WallShade />
    <FloorPlanks color={floor} step={70} rows={11} />
    <FloorShade />
    <rect x={0} y={900} width={W} height={FLOOR_Y - 900} fill={dark(wall, 0.08)} />
    {Array.from({ length: 18 }).map((_, i) => <rect key={i} x={i * 62 + 28} y={914} width={4} height={FLOOR_Y - 940} fill={dark(wall, 0.14)} />)}
    <rect x={0} y={890} width={W} height={12} fill={dark(wall, 0.18)} />
    <Baseboard color={dark(WOOD, 0.3)} h={20} />
    <BallLamp x={190} />
    <BallLamp x={540} />
    <BallLamp x={890} />
    <WorldMap x={40} y={460} w={190} h={150} accent={accent} />
    <Portrait x={40} y={650} kind={0} />
    <Portrait x={146} y={650} kind={1} />
    <NumberStrip x={290} y={424} w={620} accent={accent} />
    <Blackboard x={280} y={476} w={640} h={262} accent={accent} />
    <Clock cx={990} cy={500} r={50} />
    <PeriodicTable x={940} y={575} w={130} h={92} accent={accent} />
    {/* деревянный чертёжный треугольник на гвоздике */}
    <path d="M240 650 L240 760 L268 760 Z" fill="none" stroke={WOOD} strokeWidth={8} strokeLinejoin="round" />
    <circle cx={244} cy={646} r={4} fill={INK} />
    <Shadow cx={0.1 * W + 60} w={200} />
    <Shadow cx={0.34 * W + 60} w={200} />
    <SchoolDesk x={0.1} z={1} wood={mix(WOOD, wall, 0.2)} accent={mix(accent, wall, 0.3)} />
    <SchoolDesk x={0.34} z={1} wood={mix(WOOD, wall, 0.2)} accent={mix(accent, wall, 0.3)} />
    <Shadow cx={920} w={300} />
    <TeacherTable x={775} w={290} accent={accent} />
    <Shadow cx={0.66 * W} w={120} />
    <SeatAt x={0.66} z={1} kind="chair" color={dark(WOOD, 0.1)} pad={accent} />
    <Shadow cx={0.16 * W + 70} w={240} y={1275} o={0.14} />
    <SchoolDesk x={0.16} z={0.5} accent={accent} />
  </>
);

/** Аудитория: ряды амфитеатром поднимаются к задней стене. */
const LectureHall = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => {
  const tiers = [0, 1, 2, 3];
  const tierTop = (i: number) => FLOOR_Y - 160 - i * 130;
  return (
    <>
      <Room wall={wall} floor={floor} />
      <WallShade />
      <FloorPlanks color={floor} step={70} rows={11} />
      <FloorShade />
      {/* пилястры и портреты между окнами */}
      {[210, 480, 750].map((xx, i) => (
        <g key={xx}>
          <Glow cx={xx + 60} cy={430} rx={70} ry={50} opacity={0.5} />
          <path d={`M${xx + 46} 452 h28 l-6 14 h-16 Z`} fill="#c9a24a" />
          <Portrait x={xx + 22} y={474} w={76} h={94} kind={i} />
        </g>
      ))}
      {/* подвесные светильники рядами */}
      {[140, 400, 680, 940].map((xx) => (
        <g key={xx}>
          <Glow cx={xx} cy={120} rx={200} ry={110} opacity={0.45} />
          <rect x={xx - 2} y={0} width={4} height={90} fill="#5a5a5a" />
          <path d={`M${xx - 56} 128 Q${xx} 70 ${xx + 56} 128 Z`} fill={dark(accent, 0.2)} />
          <ellipse cx={xx} cy={128} rx={40} ry={8} fill="#fff6d0" />
        </g>
      ))}
      {/* высокие окна под потолком */}
      {[60, 330, 600, 870].map((xx) => (
        <g key={xx}>
          <path d={`M${xx} 600 V500 A75 75 0 0 1 ${xx + 150} 500 V600 Z`} fill={light(wall, 0.35)} />
          <path d={`M${xx + 14} 590 V502 A61 61 0 0 1 ${xx + 136} 502 V590 Z`} fill="#bcdcec" />
          <rect x={xx + 71} y={440} width={8} height={150} fill={light(wall, 0.35)} />
        </g>
      ))}
      {/* ряды: дальние светлее */}
      {[...tiers].reverse().map((i) => {
        const y = tierTop(i);
        const wood = mix(WOOD, wall, 0.3 + i * 0.12);
        const seat = mix(accent, wall, 0.25 + i * 0.12);
        return (
          <g key={i}>
            {Array.from({ length: 10 }).map((_, k) => (
              <rect key={k} x={20 + k * 108} y={y - 46} width={74} height={70} rx={16} fill={seat} />
            ))}
            <rect x={0} y={y} width={W} height={FLOOR_Y - y} fill={dark(wood, 0.12)} />
            <rect x={0} y={y - 4} width={W} height={20} rx={4} fill={wood} />
            <rect x={0} y={y - 4} width={W} height={5} fill="#ffffff" opacity={0.2} />
            {/* тетради, книги, ноутбуки на пюпитрах */}
            {Array.from({ length: 10 }).map((_, k) => {
              const xx = 30 + k * 108 + rnd(k + i * 11) * 30;
              if (xx > 440 && xx < 620) return null;
              const r = rnd(k * 3 + i * 17);
              if (r < 0.35) return null;
              return r < 0.6 ? (
                <rect key={k} x={xx} y={y - 12} width={40} height={9} rx={2} fill={[RED, "#e8c46a", "#4a7ab0", light(accent, 0.3)][(k + i) % 4]} opacity={0.9 - i * 0.12} />
              ) : (
                <g key={k} opacity={0.95 - i * 0.12}>
                  <path d={`M${xx} ${y - 4} l8 -34 h40 l-4 34 Z`} fill="#5a5f66" />
                  <path d={`M${xx + 12} ${y - 8} l6 -24 h28 l-3 24 Z`} fill="#9cc6e0" />
                </g>
              );
            })}
          </g>
        );
      })}
      {/* лестница-проход посередине */}
      <rect x={470} y={tierTop(3) - 4} width={140} height={FLOOR_Y - tierTop(3) + 4} fill={mix(floor, wall, 0.35)} />
      {tiers.map((i) => (
        <g key={i}>
          <rect x={470} y={tierTop(i) - 4} width={140} height={14} fill={dark(mix(floor, wall, 0.35), 0.15)} />
          <circle cx={480} cy={tierTop(i) + 26} r={5} fill="#f5d77a" />
          <circle cx={600} cy={tierTop(i) + 26} r={5} fill="#f5d77a" />
          <Glow cx={480} cy={tierTop(i) + 26} rx={22} opacity={0.6} />
          <Glow cx={600} cy={tierTop(i) + 26} rx={22} opacity={0.6} />
        </g>
      ))}
      <rect x={0} y={FLOOR_Y - 18} width={W} height={18} fill="#00000022" />
      {/* передний ряд откидных сидений у фасада первого яруса (метки row-1…row-4) */}
      {[0.1, 0.24, 0.38, 0.62].map((x) => (
        <SeatAt key={x} x={x} z={1} kind="theater" color={mix(accent, wall, 0.15)} back={70} />
      ))}
      {/* кафедра: ноутбук, бумаги, вода */}
      <Shadow cx={940} w={240} />
      <path d={`M840 ${FLOOR_Y} L860 ${FLOOR_Y - 300} L1020 ${FLOOR_Y - 300} L1040 ${FLOOR_Y} Z`} fill={dark(WOOD, 0.1)} />
      <rect x={830} y={FLOOR_Y - 330} width={220} height={34} rx={8} fill={WOOD} />
      <rect x={880} y={FLOOR_Y - 250} width={120} height={150} rx={8} fill={accent} />
      <circle cx={940} cy={FLOOR_Y - 175} r={30} fill={light(accent, 0.35)} />
      <path d={`M880 ${FLOOR_Y - 330} Q880 ${FLOOR_Y - 400} 850 ${FLOOR_Y - 420}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={846} cy={FLOOR_Y - 426} rx={12} ry={16} fill={INK} />
      <rect x={990} y={FLOOR_Y - 380} width={30} height={50} rx={6} fill="#cfe6f5" opacity={0.9} />
      <path d={`M900 ${FLOOR_Y - 330} l12 -50 h70 l-6 50 Z`} fill="#5a5f66" />
      <path d={`M914 ${FLOOR_Y - 336} l9 -38 h56 l-5 38 Z`} fill="#9cc6e0" />
      <circle cx={946} cy={FLOOR_Y - 356} r={8} fill="#ffffff" opacity={0.8} />
      <rect x={846} y={FLOOR_Y - 338} width={46} height={8} rx={2} fill="#f4efe2" />
      <rect x={994} y={FLOOR_Y - 360} width={22} height={26} rx={4} fill="#9cc6e0" />
    </>
  );
};

export const Klass = ({ palette, variant }: BackdropProps) => {
  const { wall, floor, accent } = palette;
  return (
    <Canvas>
      {variant === "university" ? (
        <LectureHall wall={wall} floor={floor} accent={accent} />
      ) : (
        <Classroom wall={wall} floor={floor} accent={accent} />
      )}
    </Canvas>
  );
};
