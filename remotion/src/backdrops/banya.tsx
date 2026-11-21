import { Canvas, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { depthScale, feetY, seatTopY } from "../world/depth";
import { shade } from "./ulitsa";

/**
 * Фон «banya»: парилка. Слева вдоль стены — нижняя лавка под метками bench-1 (x 0.12), bench/bench-2 (0.3), bench-3 (0.48)
 * на дальнем плане (верх доски = seatTopY(1)), над ней — верхний полок; деревянная шайка с ковшом (bucket, 0.68),
 * печь-каменка с паром (stove, 0.85); на стене веники, шапки, окошко, лампа в деревянной решётке.
 */

const PLANK = 74; // высота бревна стены

/** Веник: связка берёзовых веток, ручка вверх, на гвозде. */
const Broom = ({ x, y, s = 1, leaf = "#7a9a4a" }: { x: number; y: number; s?: number; leaf?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-6} r={5} fill="#3a3a40" />
    <path d="M0 -4 L-6 14 M0 -4 L6 14" stroke="#6b4429" strokeWidth={3} />
    <rect x={-9} y={10} width={18} height={50} rx={6} fill="#8a6a3a" />
    <rect x={-11} y={44} width={22} height={8} rx={3} fill="#c8553d" />
    <path d="M-10 56 Q-60 120 -40 190 Q0 220 40 190 Q60 120 10 56 Z" fill={shade(leaf, -0.18)} />
    <path d="M-6 60 Q-44 120 -26 180 Q0 200 26 180 Q44 120 6 60 Z" fill={leaf} />
    {[[-24, 110], [16, 100], [-8, 150], [24, 150], [-30, 170], [6, 186]].map(([lx, ly], i) => (
      <ellipse key={i} cx={lx} cy={ly} rx={10} ry={6} fill={shade(leaf, 0.18)} transform={`rotate(${i * 30} ${lx} ${ly})`} />
    ))}
  </g>
);

/** Банная шапка-колпак из войлока на крючке. */
const FeltHat = ({ x, y, color = "#e8dcc4" }: { x: number; y: number; color?: string }) => (
  <g>
    <rect x={x - 4} y={y - 8} width={8} height={14} rx={3} fill="#5a3a20" />
    <path d={`M${x - 46} ${y + 70} Q${x - 40} ${y} ${x} ${y} Q${x + 40} ${y} ${x + 46} ${y + 70} Z`} fill={color} />
    <rect x={x - 52} y={y + 62} width={104} height={18} rx={8} fill={shade(color, -0.1)} />
  </g>
);

/** Клуб пара. */
const Steam = ({ x, y, s = 1, o = 0.5 }: { x: number; y: number; s?: number; o?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff" opacity={o}>
    <circle cx={0} cy={0} r={50} />
    <circle cx={50} cy={-24} r={60} />
    <circle cx={104} cy={4} r={44} />
    <circle cx={46} cy={26} r={40} />
  </g>
);

/** Лавка у стены на дальнем плане: доска от x0 до x1 (доли кадра), верх = seatTopY(1). */
const LowBench = ({ x0, x1, wood }: { x0: number; x1: number; wood: string }) => {
  const s = depthScale(1);
  const top = seatTopY(1);
  const fy = feetY(1);
  const l = x0 * W;
  const r = x1 * W;
  return (
    <g>
      <rect x={l} y={top + 24 * s} width={r - l} height={fy - top - 24 * s} fill={shade(wood, -0.35)} />
      {[l + 20, (l + r) / 2 - 12, r - 44].map((x) => <rect key={x} x={x} y={top + 20 * s} width={24} height={fy - top - 20 * s} fill={shade(wood, -0.2)} />)}
      <rect x={l - 10} y={top - 4} width={r - l + 20} height={30 * s} rx={6} fill={wood} />
      <rect x={l - 10} y={top - 4} width={r - l + 20} height={8} rx={4} fill={shade(wood, 0.15)} />
      {Array.from({ length: Math.floor((r - l) / 140) }).map((_, i) => <rect key={i} x={l + 130 + i * 140} y={top - 2} width={3} height={26 * s} fill={shade(wood, -0.2)} />)}
    </g>
  );
};

export const Banya = ({ palette }: BackdropProps) => {
  const wall = palette.wall;
  const wood = "#d8b47a";
  const dark = palette.accent;
  const top = seatTopY(1);
  return (
    <Canvas>
      {/* бревенчатая стена */}
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      {Array.from({ length: Math.ceil(FLOOR_Y / PLANK) }).map((_, i) => {
        const y = FLOOR_Y - (i + 1) * PLANK;
        return (
          <g key={i}>
            <rect x={0} y={y} width={W} height={PLANK} fill={i % 2 ? wall : shade(wall, -0.04)} />
            <rect x={0} y={y + PLANK - 10} width={W} height={10} fill={shade(wall, -0.16)} />
            <rect x={0} y={y + 4} width={W} height={6} fill={shade(wall, 0.12)} />
          </g>
        );
      })}
      {/* сучки */}
      {[[220, 560], [520, 480], [960, 700], [380, 1000], [620, 760], [140, 260], [860, 330]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={14} ry={9} fill={shade(wall, -0.2)} />
          <ellipse cx={x} cy={y} rx={6} ry={4} fill={shade(wall, -0.32)} />
        </g>
      ))}
      {/* окошко с запотевшим стеклом */}
      <rect x={680} y={480} width={150} height={130} rx={8} fill={shade(wall, -0.3)} />
      <rect x={692} y={492} width={126} height={106} rx={4} fill="#b8d0d8" />
      <rect x={692} y={492} width={126} height={106} rx={4} fill="#ffffff" opacity={0.4} />
      <rect x={752} y={492} width={6} height={106} fill={shade(wall, -0.3)} />
      <path d="M704 580 q10 -20 4 -40 M790 590 q-6 -24 4 -44" stroke="#ffffff" strokeWidth={4} opacity={0.7} fill="none" />
      {/* лампа в деревянной решётке */}
      <g>
        <circle cx={980} cy={500} r={90} fill="#fff1c0" opacity={0.18} />
        <rect x={930} y={450} width={100} height={110} rx={10} fill="#fff1c0" />
        {[946, 970, 994, 1014].map((x) => <rect key={x} x={x} y={450} width={8} height={110} fill={dark} />)}
        <rect x={926} y={446} width={108} height={12} rx={4} fill={dark} />
        <rect x={926} y={552} width={108} height={12} rx={4} fill={dark} />
      </g>
      {/* веники и шапки на стене */}
      <rect x={60} y={600} width={540} height={14} rx={6} fill={shade(wood, -0.2)} />
      <Broom x={110} y={614} s={0.75} />
      <Broom x={200} y={614} s={0.85} leaf="#6f8f44" />
      <FeltHat x={330} y={618} />
      <FeltHat x={450} y={618} color="#d9c4a0" />
      <Broom x={560} y={614} s={0.7} leaf="#86a456" />
      {/* термометр */}
      <g>
        <rect x={620} y={700} width={56} height={150} rx={10} fill={wood} />
        <rect x={642} y={716} width={12} height={110} rx={6} fill="#f4f1ea" />
        <rect x={645} y={760} width={6} height={66} fill="#c8553d" />
        <circle cx={648} cy={830} r={11} fill="#c8553d" />
        {[730, 750, 770, 790, 810].map((y) => <rect key={y} x={658} y={y} width={10} height={3} fill={shade(wood, -0.4)} />)}
      </g>
      {/* верхний полок (за сидящими) */}
      <g>
        <rect x={0} y={850} width={640} height={36} rx={6} fill={wood} />
        <rect x={0} y={850} width={640} height={8} fill={shade(wood, 0.15)} />
        <rect x={0} y={886} width={640} height={60} fill={shade(wood, -0.12)} />
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={i * 110 + 30} y={886} width={4} height={60} fill={shade(wood, -0.25)} />)}
        {[40, 320, 600].map((x) => <rect key={x} x={x} y={946} width={26} height={top - 946} fill={shade(wood, -0.3)} />)}
        <rect x={0} y={946} width={640} height={10} fill="#00000022" />
      </g>
      {/* нижняя лавка: bench-1, bench-2, bench-3 */}
      <LowBench x0={0.04} x1={0.56} wood={wood} />
      {/* полотенце, висящее на краю лавки */}
      <path d={`M470 ${top - 4} h60 v80 l-8 10 h-44 l-8 -10 z`} fill="#f4f1ea" />
      <rect x={470} y={top + 50} width={60} height={8} fill="#c8553d" />
      {/* шайка с ковшом (bucket) */}
      <g transform={`translate(${0.68 * W} ${FLOOR_Y})`}>
        <ellipse cx={0} cy={0} rx={80} ry={12} fill="#00000022" />
        <path d="M-70 -110 H70 L58 0 H-58 Z" fill={wood} />
        {[-50, -25, 0, 25, 50].map((d) => <rect key={d} x={d - 1} y={-108} width={3} height={106} fill={shade(wood, -0.2)} />)}
        <rect x={-72} y={-90} width={144} height={10} rx={4} fill="#8a8f98" />
        <rect x={-64} y={-30} width={128} height={10} rx={4} fill="#8a8f98" />
        <ellipse cx={0} cy={-110} rx={70} ry={14} fill={shade(wood, -0.25)} />
        <ellipse cx={0} cy={-108} rx={60} ry={10} fill="#8fc3dc" />
        <rect x={-90} y={-130} width={30} height={46} rx={6} fill={wood} transform="rotate(-20 -75 -110)" />
        <path d="M-30 -116 L40 -170" stroke={shade(wood, -0.25)} strokeWidth={12} strokeLinecap="round" />
        <ellipse cx={-34} cy={-112} rx={22} ry={10} fill={shade(wood, -0.15)} />
      </g>
      {/* каменка: печь, камни, топка, труба */}
      <g>
        <rect x={0.85 * W - 22} y={0} width={44} height={760} fill="#4a4f58" />
        <rect x={0.85 * W - 28} y={300} width={56} height={14} fill="#3a3f47" />
        <rect x={0.85 * W - 28} y={560} width={56} height={14} fill="#3a3f47" />
        <rect x={810} y={820} width={230} height={FLOOR_Y - 820} rx={14} fill="#3a3f47" />
        <rect x={810} y={820} width={230} height={16} rx={8} fill="#4f555f" />
        {/* решётка с камнями */}
        <rect x={800} y={760} width={250} height={70} rx={10} fill="#2b2f36" />
        {[[830, 770], [870, 760], [910, 774], [950, 762], [990, 772], [1024, 768], [850, 790], [890, 794], [930, 792], [970, 796], [1010, 792]].map(([cx, cy], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={24} ry={18} fill={["#8a8c96", "#6f717b", "#9a9ca6"][i % 3]} />
        ))}
        {[820, 860, 900, 940, 980, 1020].map((x) => <rect key={x} x={x} y={748} width={6} height={80} fill="#2b2f36" />)}
        {/* дверца топки с огнём */}
        <rect x={860} y={960} width={130} height={110} rx={10} fill="#2b2f36" />
        <rect x={874} y={974} width={102} height={82} rx={6} fill="#e06a2a" />
        <path d="M884 1056 q10 -50 30 -40 q4 -30 24 -20 q16 -20 26 10 q8 30 2 50 z" fill="#f2b84b" />
        <path d="M904 1056 q6 -26 20 -22 q10 -10 20 6 v16 z" fill="#fff1c0" />
        {[880, 910, 940, 970].map((x) => <rect key={x} x={x} y={974} width={4} height={82} fill="#2b2f36" opacity={0.6} />)}
        <circle cx={980} cy={1014} r={6} fill="#8a8f98" />
        <rect x={830} y={1100} width={190} height={14} rx={4} fill="#2b2f36" />
        <circle cx={925} cy={1015} r={110} fill="#e06a2a" opacity={0.08} />
      </g>
      {/* пар над каменкой и под потолком */}
      <Steam x={820} y={680} s={0.9} o={0.55} />
      <Steam x={900} y={590} s={0.7} o={0.4} />
      <Steam x={700} y={680} s={0.6} o={0.3} />
      <Steam x={60} y={460} s={1.1} o={0.18} />
      <Steam x={360} y={420} s={1.3} o={0.14} />
      {/* пол: доски и деревянная решётка-трап */}
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill={palette.floor} />
      <rect x={0} y={FLOOR_Y} width={W} height={16} fill="#00000025" />
      {[1240, 1300, 1380, 1480, 1610, 1770].map((y) => <rect key={y} x={0} y={y} width={W} height={5} fill={shade(palette.floor, -0.18)} />)}
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${540 + (i - 4) * 120} ${FLOOR_Y} L${540 + (i - 4) * 360} ${H}`} stroke={shade(palette.floor, -0.1)} strokeWidth={3} opacity={0.5} />)}
      {[[160, 1290], [760, 1450], [380, 1700]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={60 + i * 10} ry={10} fill="#ffffff" opacity={0.06} />)}
      {/* лужица и брошенный берёзовый лист */}
      <ellipse cx={700} cy={1250} rx={70} ry={12} fill="#8fc3dc" opacity={0.35} />
      <ellipse cx={300} cy={1420} rx={14} ry={8} fill="#7a9a4a" transform="rotate(30 300 1420)" />
      <ellipse cx={880} cy={1600} rx={12} ry={7} fill="#86a456" transform="rotate(-20 880 1600)" />
    </Canvas>
  );
};
