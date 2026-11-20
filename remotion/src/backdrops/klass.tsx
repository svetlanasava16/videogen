import { Canvas, Room, FLOOR_Y, W, type BackdropProps } from "./parts";

/** Фон «klass»: школьный класс; вариант university — аудитория с рядами амфитеатром. */

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

/** Ученическая парта со стулом (вид сбоку). */
const SchoolDesk = ({ x, s = 1, wood = WOOD, accent }: { x: number; s?: number; wood?: string; accent: string }) => (
  <g transform={`translate(${x + 234 * s} ${FLOOR_Y}) scale(${-s} ${s})`}>
    {/* стул */}
    <rect x={190} y={-260} width={16} height={260} fill={METAL} />
    <rect x={150} y={-110} width={14} height={110} fill={METAL} />
    <rect x={144} y={-124} width={90} height={18} rx={8} fill={dark(wood, 0.08)} />
    <rect x={194} y={-262} width={30} height={96} rx={10} fill={dark(wood, 0.08)} />
    {/* парта */}
    <rect x={10} y={-180} width={16} height={180} fill={METAL} />
    <rect x={150} y={-180} width={16} height={60} fill={METAL} />
    <rect x={0} y={-150} width={170} height={56} rx={6} fill={dark(wood, 0.18)} />
    <path d="M-6 -204 L176 -196 L176 -176 L-6 -180 Z" fill={wood} />
    {/* книжки */}
    <rect x={20} y={-222} width={70} height={16} rx={3} fill={accent} transform="rotate(2 55 -214)" />
    <rect x={28} y={-236} width={58} height={14} rx={3} fill={RED} transform="rotate(2 57 -229)" />
    <rect x={110} y={-212} width={50} height={8} rx={4} fill="#f3d27a" />
  </g>
);

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
    </g>
  );
};

const Classroom = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => (
  <>
    <Room wall={wall} floor={floor} />
    <rect x={0} y={900} width={W} height={FLOOR_Y - 900} fill={dark(wall, 0.08)} />
    <rect x={0} y={890} width={W} height={12} fill={dark(wall, 0.18)} />
    <WorldMap x={40} y={460} w={190} h={150} accent={accent} />
    <Blackboard x={280} y={430} w={640} h={270} accent={accent} />
    <Clock cx={990} cy={500} r={50} />
    <SchoolDesk x={-150} s={1.05} wood={mix(WOOD, wall, 0.35)} accent={mix(accent, wall, 0.35)} />
    <SchoolDesk x={20} s={1.25} accent={accent} />
    <TeacherTable x={740} w={330} accent={accent} />
  </>
);

/** Аудитория: ряды амфитеатром поднимаются к задней стене. */
const LectureHall = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => {
  const tiers = [0, 1, 2, 3];
  const tierTop = (i: number) => FLOOR_Y - 160 - i * 130;
  return (
    <>
      <Room wall={wall} floor={floor} />
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
          </g>
        );
      })}
      {/* лестница-проход посередине */}
      <rect x={470} y={tierTop(3) - 4} width={140} height={FLOOR_Y - tierTop(3) + 4} fill={mix(floor, wall, 0.35)} />
      {tiers.map((i) => (
        <rect key={i} x={470} y={tierTop(i) - 4} width={140} height={14} fill={dark(mix(floor, wall, 0.35), 0.15)} />
      ))}
      <rect x={0} y={FLOOR_Y - 18} width={W} height={18} fill="#00000022" />
      {/* кафедра */}
      <path d={`M840 ${FLOOR_Y} L860 ${FLOOR_Y - 300} L1020 ${FLOOR_Y - 300} L1040 ${FLOOR_Y} Z`} fill={dark(WOOD, 0.1)} />
      <rect x={830} y={FLOOR_Y - 330} width={220} height={34} rx={8} fill={WOOD} />
      <rect x={880} y={FLOOR_Y - 250} width={120} height={150} rx={8} fill={accent} />
      <circle cx={940} cy={FLOOR_Y - 175} r={30} fill={light(accent, 0.35)} />
      <path d={`M880 ${FLOOR_Y - 330} Q880 ${FLOOR_Y - 400} 850 ${FLOOR_Y - 420}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={846} cy={FLOOR_Y - 426} rx={12} ry={16} fill={INK} />
      <rect x={990} y={FLOOR_Y - 380} width={30} height={50} rx={6} fill="#cfe6f5" opacity={0.9} />
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
