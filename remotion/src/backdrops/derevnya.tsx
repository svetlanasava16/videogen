import { Canvas, Fence, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { Birds, LeafyTree, Puff, Tufts, Label, shade } from "./ulitsa";

/**
 * Фон «derevnya»: деревня; варианты forest, river-lake, farm, garden, mountain. Метки общие (content/locations/derevnya.json):
 * house 0.25, fence 0.55, tree 0.82, left/center/right — средний план; сидений нет.
 * Детализация — в небе, на дальнем плане и у линии стены (y ≤ 1190); земля ниже — трава, тропинки, цветы.
 */

const SKY = "#cfe4ee";
const WATER = "#8fc3dc";
const WOOD = "#a8774a";

const Sky = ({ sun = true }: { sun?: boolean }) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={SKY} />
    <rect x={0} y={600} width={W} height={300} fill={shade(SKY, 0.3)} />
    {sun && <circle cx={860} cy={540} r={96} fill="#fbe7a6" opacity={0.35} />}
    {sun && <circle cx={860} cy={540} r={66} fill="#fbe7a6" />}
    <Puff x={60} y={510} s={0.5} color="#ffffffe0" under="#eef5f8" />
    <Puff x={640} y={100} s={0.4} color="#ffffff99" under="#ffffff77" />
    <Puff x={460} y={690} s={0.25} color="#ffffffcc" />
    <Birds items={[[420, 560, 1], [456, 580, 0.8], [700, 470, 0.7]]} color="#5a6470" />
  </>
);

/** Ёлка из трёх ярусов с тенью; (x, y) — основание ствола. */
export const Pine = ({ x, y, s = 1, color = "#4f7a4a", trunk = "#6b4429", shadow }: { x: number; y: number; s?: number; color?: string; trunk?: string; shadow?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-14} y={-90} width={28} height={90} fill={trunk} />
    <path d="M0 -460 L90 -300 H-90 Z M0 -380 L120 -190 H-120 Z M0 -290 L150 -80 H-150 Z" fill={color} />
    {shadow && <path d="M0 -460 L90 -300 H20 Z M0 -380 L120 -190 H30 Z M0 -290 L150 -80 H40 Z" fill={shadow} />}
  </g>
);

/** Берёза: белый ствол с чёрточками, свисающая крона в два тона. */
export const Birch = ({ x, y, s = 1, crown = "#8fbf5a" }: { x: number; y: number; s?: number; crown?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-12 0 L-8 -380 L8 -380 L12 0 Z" fill="#f2f2f2" />
    {[40, 90, 150, 210, 270, 330].map((yy, i) => <rect key={yy} x={i % 2 ? -10 : -2} y={-yy} width={12} height={6} rx={2} fill="#2b2a2e" />)}
    <path d="M0 -300 L-50 -360 M0 -250 L46 -320" stroke="#e8e8e8" strokeWidth={6} />
    <g fill={shade(crown, -0.15)}>
      <ellipse cx={-50} cy={-360} rx={70} ry={100} />
      <ellipse cx={50} cy={-340} rx={70} ry={100} />
    </g>
    <g fill={crown}>
      <ellipse cx={0} cy={-420} rx={80} ry={90} />
      <ellipse cx={-40} cy={-330} rx={50} ry={80} />
      <ellipse cx={46} cy={-320} rx={46} ry={70} />
    </g>
    <g fill={shade(crown, 0.25)}>
      <ellipse cx={-20} cy={-450} rx={26} ry={30} />
      <ellipse cx={36} cy={-380} rx={18} ry={24} />
    </g>
  </g>
);

const Sunflower = ({ x, y, h }: { x: number; y: number; h: number }) => (
  <g>
    <rect x={x - 5} y={y - h} width={10} height={h} fill="#5b8c5a" />
    <ellipse cx={x + 24} cy={y - h * 0.5} rx={26} ry={12} fill="#5b8c5a" transform={`rotate(-25 ${x + 24} ${y - h * 0.5})`} />
    <ellipse cx={x - 22} cy={y - h * 0.32} rx={22} ry={10} fill="#4f7d4e" transform={`rotate(25 ${x - 22} ${y - h * 0.32})`} />
    {Array.from({ length: 10 }).map((_, i) => (
      <ellipse key={i} cx={x} cy={y - h - 34} rx={11} ry={26} fill="#f2c230" transform={`rotate(${i * 36} ${x} ${y - h})`} />
    ))}
    <circle cx={x} cy={y - h} r={24} fill="#6b4429" />
    <circle cx={x} cy={y - h} r={14} fill="#5a3a20" />
  </g>
);

/** Курица (или петух) у линии стены; (x, y) — земля. */
const Hen = ({ x, y, s = 1, rooster = false, flip = false }: { x: number; y: number; s?: number; rooster?: boolean; flip?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    {rooster && <path d="M24 -46 q34 -30 30 -60 q-14 20 -34 30 q22 -36 6 -56 q-8 34 -26 50 z" fill="#2f6b4a" />}
    {rooster && <path d="M22 -50 q24 -10 26 -40 q-14 16 -30 24 z" fill="#c8553d" />}
    <ellipse cx={0} cy={-34} rx={34} ry={26} fill={rooster ? "#c8703a" : "#f4f1ea"} />
    <path d="M-6 -42 q18 -8 30 6 q-16 10 -30 -6 z" fill={rooster ? "#a85a2a" : "#e2dccb"} />
    <circle cx={-28} cy={-58} r={15} fill={rooster ? "#d88040" : "#f4f1ea"} />
    <path d="M-34 -74 q4 -10 8 0 q4 -10 8 0 q4 -8 6 2 z" fill="#c8553d" />
    <path d="M-42 -58 l-12 4 l12 4 z" fill="#e0a030" />
    <path d="M-36 -48 q-4 8 2 10 q4 -6 -2 -10 z" fill="#c8553d" />
    <circle cx={-32} cy={-61} r={3} fill="#2b1d14" />
    <path d="M-6 -8 v8 M6 -8 v8" stroke="#e0a030" strokeWidth={4} />
  </g>
);

/** Бревенчатая изба с резными наличниками, дымом из трубы. */
const Hut = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    {/* дым */}
    {[[280, -600, 22], [300, -650, 30], [330, -710, 38], [370, -770, 44]].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#ffffff" opacity={0.55 - i * 0.1} />
    ))}
    <rect x={250} y={-560} width={50} height={120} fill="#8a5a3a" />
    <rect x={244} y={-572} width={62} height={16} fill="#6b4429" />
    <rect x={0} y={-320} width={360} height={320} fill={WOOD} />
    {Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} x={0} y={-320 + i * 36 + 30} width={360} height={6} rx={3} fill={shade(WOOD, -0.18)} />
    ))}
    {Array.from({ length: 9 }).map((_, i) => (
      <g key={`e${i}`}>
        <circle cx={-6} cy={-320 + i * 36 + 18} r={16} fill={shade(WOOD, 0.12)} />
        <circle cx={-6} cy={-320 + i * 36 + 18} r={6} fill={shade(WOOD, -0.05)} />
        <circle cx={366} cy={-320 + i * 36 + 18} r={16} fill={shade(WOOD, 0.12)} />
        <circle cx={366} cy={-320 + i * 36 + 18} r={6} fill={shade(WOOD, -0.05)} />
      </g>
    ))}
    {/* крыша: тёс полосами, резной причелин */}
    <path d="M-50 -310 L180 -540 L410 -310 Z" fill="#6b4f3a" />
    {[-470, -420, -370].map((yy, i) => <path key={yy} d={`M${180 - (yy + 540) * 1} ${yy} L${180 + (yy + 540) * 1} ${yy}`} stroke={shade("#6b4f3a", -0.15)} strokeWidth={4} opacity={0.6 + i * 0.1} />)}
    <path d="M30 -320 L180 -470 L330 -320 Z" fill={shade(WOOD, 0.08)} />
    {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={60 + i * 44} y={-400 + Math.abs(i - 2.5) * 30} width={6} height={80 - Math.abs(i - 2.5) * 30} fill={shade(WOOD, -0.08)} />)}
    <circle cx={180} cy={-380} r={22} fill="#f2e6d0" />
    <circle cx={180} cy={-380} r={14} fill="#cfe6f5" />
    <path d="M-50 -310 L180 -540 L410 -310 L390 -296 L180 -506 L-30 -296 Z" fill="#f2e6d0" />
    {Array.from({ length: 9 }).map((_, i) => {
      const t = (i + 0.5) / 9;
      return (
        <g key={i} fill="#f2e6d0">
          <circle cx={-40 + t * 210} cy={-300 - t * 222} r={9} />
          <circle cx={400 - t * 210} cy={-300 - t * 222} r={9} />
        </g>
      );
    })}
    <path d="M168 -540 h24 v-30 l-12 -14 l-12 14 z" fill="#f2e6d0" />
    {/* окно со ставнями и резным наличником */}
    <rect x={56} y={-240} width={50} height={130} rx={6} fill="#4a6fa5" />
    <rect x={254} y={-240} width={50} height={130} rx={6} fill="#4a6fa5" />
    <path d="M66 -220 l15 20 l15 -20 M66 -150 l15 20 l15 -20 M264 -220 l15 20 l15 -20 M264 -150 l15 20 l15 -20" stroke="#f2e6d0" strokeWidth={5} fill="none" />
    <rect x={100} y={-256} width={160} height={162} rx={8} fill="#f2e6d0" />
    <rect x={114} y={-242} width={132} height={134} rx={4} fill="#cfe6f5" />
    <path d="M114 -170 L170 -242 H200 L130 -150 Z" fill="#ffffff" opacity={0.35} />
    <path d="M114 -242 h40 q-10 60 -6 134 h-34 z M246 -242 h-40 q10 60 6 134 h34 z" fill="#f6f0f0" opacity={0.85} />
    <rect x={177} y={-242} width={6} height={134} fill="#f2e6d0" />
    <rect x={114} y={-178} width={132} height={6} fill="#f2e6d0" />
    <path d="M88 -256 L180 -320 L272 -256 Z" fill="#f2e6d0" />
    <path d="M110 -262 L180 -304 L250 -262 Z" fill="#4a6fa5" />
    <circle cx={180} cy={-278} r={8} fill="#f2e6d0" />
    {[118, 150, 210, 242].map((cx) => <circle key={cx} cx={cx} cy={-84} r={8} fill="#f2e6d0" />)}
    <rect x={92} y={-98} width={176} height={14} rx={5} fill="#f2e6d0" />
    {/* герань на окне */}
    <rect x={128} y={-112} width={24} height={14} rx={3} fill="#c8553d" />
    <rect x={208} y={-112} width={24} height={14} rx={3} fill="#c8553d" />
    <circle cx={140} cy={-124} r={14} fill="#d8506a" />
    <circle cx={220} cy={-124} r={14} fill="#d8506a" />
    <circle cx={132} cy={-118} r={8} fill="#5b8c5a" />
    <circle cx={228} cy={-118} r={8} fill="#5b8c5a" />
    {/* завалинка */}
    <rect x={-20} y={-30} width={400} height={30} fill={shade(WOOD, -0.25)} />
  </g>
);

/** Колодец-сруб с двускатной крышкой и воротом; (x, y) — земля. */
const Well = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-80} y={-130} width={160} height={130} fill={WOOD} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={-86} y={-130 + i * 32} width={172} height={8} rx={4} fill={shade(WOOD, -0.18)} />)}
    <rect x={-70} y={-300} width={14} height={180} fill="#6b4429" />
    <rect x={56} y={-300} width={14} height={180} fill="#6b4429" />
    <path d="M-110 -290 L0 -370 L110 -290 Z" fill="#6b4f3a" />
    <path d="M-90 -292 L0 -352 L90 -292 Z" fill={shade(WOOD, 0.05)} />
    <rect x={-60} y={-232} width={120} height={18} rx={9} fill="#8a5a3a" />
    <path d="M70 -223 h24 v40 h20" stroke="#3a3a40" strokeWidth={6} fill="none" />
    <path d="M-10 -214 v40" stroke="#3a3a40" strokeWidth={3} />
    <path d="M-26 -174 h32 l-4 34 h-24 z" fill="#9aa3ad" />
  </g>
);

/** Мягкая тень земли у камеры (передний край кадра темнее) — не шумит под субтитрами. */
const GroundShade = () => (
  <g>
    <path d="M0 1540 Q270 1505 540 1545 T1080 1530 V1920 H0 Z" fill="#00000010" />
    <path d="M0 1740 Q300 1710 600 1748 T1080 1730 V1920 H0 Z" fill="#0000000c" />
  </g>
);

const Village = ({ palette }: BackdropProps) => (
  <>
    <Sky />
    {/* дальний лес в два слоя и церковь на холме */}
    <g fill="#a8c8a8">
      {Array.from({ length: 22 }).map((_, i) => <path key={i} d={`M${i * 52 - 10} ${830 - (i % 3) * 10} l26 -70 l26 70 z`} />)}
    </g>
    <g>
      <rect x={600} y={770} width={56} height={60} fill="#f2ead8" />
      <rect x={612} y={730} width={32} height={42} fill="#f2ead8" />
      <path d="M606 734 q22 -44 44 0 z" fill="#4a7fb0" />
      <rect x={626} y={680} width={4} height={24} fill="#c9a640" />
      <rect x={620} y={688} width={16} height={4} fill="#c9a640" />
      <rect x={660} y={790} width={40} height={40} fill="#f2ead8" />
      <path d="M660 794 q20 -36 40 0 z" fill="#c9a640" />
    </g>
    <g fill="#7fae6a">
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={i * 100} cy={845 - (i % 3) * 14} r={52} />)}
    </g>
    <g fill="#94c27e">
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={i * 100 - 20} cy={812 - (i % 3) * 14} r={20} />)}
    </g>
    <rect x={0} y={860} width={W} height={H - 860} fill={palette.wall} />
    {/* речка с отражениями */}
    <path d="M0 885 Q280 866 520 888 T1080 878 V912 Q800 922 540 914 T0 918 Z" fill={WATER} />
    {[[80, 896, 80], [300, 902, 60], [620, 898, 90], [880, 894, 70]].map(([x, y, w]) => <rect key={x} x={x} y={y} width={w} height={4} rx={2} fill="#ffffff" opacity={0.5} />)}
    {[[160, 890, 30], [460, 896, 24], [760, 892, 34]].map(([x, y, w]) => <ellipse key={x} cx={x} cy={y + 6} rx={w} ry={5} fill="#6fa0b8" opacity={0.6} />)}
    {/* стог вдали */}
    <path d="M880 940 Q910 860 940 940 Z" fill="#d9b85a" />
    <rect x={908} y={856} width={4} height={20} fill="#7a5a40" />
    <path d="M0 1060 Q300 1030 600 1055 T1080 1045 V1920 H0 Z" fill={palette.floor} />
    {/* тропинка к избе */}
    <path d="M150 1150 Q200 1400 120 1920 H360 Q340 1400 230 1150 Z" fill="#c9b08a" opacity={0.55} />
    <Hut x={-20} y={1150} />
    <Well x={790} y={1120} s={0.62} />
    <Fence x0={360} x1={880} y={1150} h={120} color="#b08a5a" />
    {/* горшки на кольях */}
    {[420, 600, 760].map((x, i) => (
      <path key={x} d={`M${x - 4} ${1048 - (i % 2) * 6} h36 l-6 -30 h-24 z`} fill={i % 2 ? "#c8553d" : "#b0603a"} />
    ))}
    {/* кот на заборе */}
    <g fill="#e0a030">
      <ellipse cx={680} cy={1020} rx={26} ry={16} />
      <circle cx={656} cy={1004} r={14} />
      <path d="M645 996 l2 -14 l9 8 z M667 996 l-2 -14 l-9 8 z" />
      <path d="M704 1024 q20 10 14 40" stroke="#e0a030" strokeWidth={7} fill="none" strokeLinecap="round" />
    </g>
    <Sunflower x={420} y={1150} h={210} />
    <Sunflower x={486} y={1150} h={170} />
    <Birch x={930} y={1180} s={0.95} />
    <Birch x={1045} y={1150} s={0.8} crown="#7fb050" />
    {/* куры у забора */}
    <Hen x={560} y={FLOOR_Y} s={0.6} />
    <Hen x={620} y={FLOOR_Y + 6} s={0.55} flip />
    <Hen x={880} y={FLOOR_Y} s={0.7} rooster />
    {/* трава и цветы */}
    <GroundShade />
    <Tufts color={shade(palette.floor, -0.12)} items={[[60, 1300, 1.1], [300, 1460, 1], [700, 1380, 1.2], [960, 1500, 1.3], [160, 1700, 1.4], [820, 1760, 1.4], [520, 1260, 0.9]]} />
    {[[90, 1330], [160, 1380], [960, 1350], [1010, 1300], [460, 1560], [640, 1660]].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r={10} fill={i % 2 ? "#ffffff" : palette.accent} />
        <circle cx={x} cy={y} r={4} fill={i % 2 ? "#e0a030" : "#c8553d"} />
      </g>
    ))}
  </>
);

const Stump = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-70 0 L-56 -90 H56 L70 0 Z" fill="#7a5236" />
    <path d="M-70 0 q-20 -10 -30 4 h30 z M70 0 q20 -10 30 4 h-30 z" fill="#6b4429" />
    <rect x={-30} y={-80} width={6} height={70} fill="#6b4429" />
    <rect x={20} y={-70} width={6} height={60} fill="#6b4429" />
    <ellipse cx={0} cy={-90} rx={56} ry={20} fill="#d9b88a" />
    <ellipse cx={0} cy={-90} rx={34} ry={12} fill="#c9a272" />
    <ellipse cx={0} cy={-90} rx={12} ry={4} fill="#b8915f" />
    <path d="M-60 -60 q-14 -6 -10 -20 q10 4 10 20 z" fill="#5b8c5a" />
  </g>
);

const Mushroom = ({ x, y, s = 1, cap = "#c8553d" }: { x: number; y: number; s?: number; cap?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-8} y={-40} width={16} height={40} rx={6} fill="#f2e6d0" />
    <path d="M-34 -36 Q0 -86 34 -36 Z" fill={cap} />
    {cap === "#c8553d" && <circle cx={-12} cy={-52} r={5} fill="#fff" />}
    {cap === "#c8553d" && <circle cx={10} cy={-60} r={4} fill="#fff" />}
  </g>
);

/** Папоротник; (x, y) — земля. */
const Fern = ({ x, y, s = 1, color = "#4f8a4a" }: { x: number; y: number; s?: number; color?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    {[-60, -30, 0, 30, 60].map((a) => (
      <path key={a} d="M0 0 Q-10 -60 0 -130 Q16 -60 4 0 Z" transform={`rotate(${a})`} />
    ))}
  </g>
);

const Forest = () => {
  const ground = "#6b8a4a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#d8e8dc" />
      <rect x={0} y={500} width={W} height={520} fill="#e6f0e6" />
      <Birds items={[[300, 560, 0.8], [330, 576, 0.6]]} color="#6a7a70" />
      {/* дальние ряды: дымка, потом темнее */}
      {Array.from({ length: 14 }).map((_, i) => <Pine key={`m${i}`} x={i * 84 - 20} y={980} s={0.6 + (i % 3) * 0.08} color="#bcd2c0" trunk="#bcd2c0" />)}
      {Array.from({ length: 10 }).map((_, i) => <Pine key={`a${i}`} x={i * 120 + 10} y={1000} s={0.85 + (i % 3) * 0.12} color="#9dbba0" trunk="#9dbba0" />)}
      {/* лучи света */}
      <path d="M620 420 L760 420 L560 1040 L380 1040 Z" fill="#ffffff" opacity={0.14} />
      <path d="M820 420 L880 420 L760 1040 L660 1040 Z" fill="#ffffff" opacity={0.1} />
      {Array.from({ length: 8 }).map((_, i) => <Pine key={`b${i}`} x={i * 150 + 70} y={1030} s={1.0 + (i % 2) * 0.2} color="#6f9a70" trunk="#6b5a44" shadow="#628a64" />)}
      {/* берёзы среднего плана */}
      <Birch x={330} y={1040} s={0.8} crown="#8cb860" />
      <Birch x={730} y={1030} s={0.7} crown="#9cc46c" />
      <rect x={0} y={1020} width={W} height={H - 1020} fill={ground} />
      <rect x={0} y={1020} width={W} height={16} fill="#00000018" />
      {/* тропинка */}
      <path d="M500 1030 H580 Q700 1400 640 1920 H300 Q460 1400 500 1030 Z" fill="#8a7a50" opacity={0.45} />
      {/* поваленное бревно у линии стены */}
      <g>
        <rect x={580} y={1110} width={240} height={50} rx={25} fill="#7a5236" />
        <ellipse cx={820} cy={1135} rx={18} ry={25} fill="#d9b88a" />
        <ellipse cx={820} cy={1135} rx={8} ry={12} fill="#c9a272" />
        <path d="M620 1112 q20 -24 40 -30" stroke="#7a5236" strokeWidth={10} fill="none" />
        <ellipse cx={680} cy={1110} rx={40} ry={10} fill="#5b8c5a" />
      </g>
      <Fern x={150} y={1150} s={0.8} />
      <Fern x={470} y={1120} s={0.6} color="#5f9a56" />
      <Fern x={940} y={1140} s={0.7} />
      {/* кустик черники */}
      <g>
        <circle cx={420} cy={1180} r={34} fill="#4f7d4a" />
        <circle cx={450} cy={1172} r={26} fill="#5b8c5a" />
        {[[408, 1170], [430, 1186], [452, 1166], [440, 1150]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill="#3a4a8a" />)}
      </g>
      <Pine x={50} y={1230} s={1.9} color="#3f6b45" trunk="#5a3a26" shadow="#365e3c" />
      <Pine x={1040} y={1210} s={1.75} color="#456f48" trunk="#5a3a26" shadow="#3b6340" />
      {/* дятел на стволе и белка */}
      <g transform="translate(1030 1080)">
        <ellipse cx={-14} cy={0} rx={10} ry={18} fill="#2b2a2e" />
        <circle cx={-16} cy={-18} r={8} fill="#2b2a2e" />
        <rect x={-22} y={-26} width={10} height={6} fill="#c8553d" />
        <path d="M-24 -18 l-10 2 l10 3 z" fill="#8a8f98" />
      </g>
      <g transform="translate(90 1030)">
        <path d="M14 -10 q30 -10 26 -50 q-4 -20 -20 -8 q10 20 -10 40 z" fill="#b5651d" />
        <ellipse cx={0} cy={0} rx={14} ry={22} fill="#c9773a" />
        <circle cx={-4} cy={-24} r={10} fill="#c9773a" />
        <circle cx={-8} cy={-26} r={2} fill="#2b1d14" />
      </g>
      <Stump x={270} y={1170} />
      <Stump x={860} y={1120} s={0.7} />
      <Mushroom x={340} y={1180} s={0.9} />
      <Mushroom x={372} y={1186} s={0.6} />
      <Mushroom x={790} y={1128} s={0.6} />
      <Mushroom x={1000} y={1260} s={0.7} cap="#8a5a2a" />
      <Mushroom x={30} y={1300} s={0.6} cap="#8a5a2a" />
      {/* шишки, хвоя, трава */}
      {[[160, 1320], [920, 1360], [600, 1100], [760, 1500], [220, 1560]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx={14} ry={9} fill="#8a5a3a" />)}
      <GroundShade />
      <Tufts color="#5a7a3c" items={[[80, 1400, 1.2], [380, 1300, 1], [700, 1340, 1.1], [980, 1440, 1.3], [140, 1700, 1.4], [880, 1720, 1.4], [520, 1620, 1.1]]} />
    </>
  );
};

const Reeds = ({ x, flip = false }: { x: number; flip?: boolean }) => (
  <g transform={`translate(${x} ${FLOOR_Y - 60}) scale(${flip ? -1 : 1} 1)`}>
    {[0, 26, 52, 80, 104].map((dx, i) => (
      <g key={dx}>
        <path d={`M${dx} 0 Q${dx + 6 - i * 3} -150 ${dx + 14 - i * 6} ${-260 - (i % 2) * 70}`} stroke="#5b8c5a" strokeWidth={9} fill="none" strokeLinecap="round" />
        {i % 2 === 0 && <rect x={dx + 2 - i * 3} y={-230 - (i % 2) * 70} width={16} height={60} rx={8} fill="#7a4a2a" />}
      </g>
    ))}
    <path d="M-20 0 Q30 -120 -10 -200 Q40 -110 30 0 Z" fill="#6f9e5a" />
    <path d="M90 0 Q150 -100 170 -170 Q150 -80 130 0 Z" fill="#6f9e5a" />
  </g>
);

const River = ({ palette }: BackdropProps) => (
  <>
    <Sky />
    {/* дальний берег: деревня с церковью, лес */}
    <g fill="#a8c8a8">
      {Array.from({ length: 22 }).map((_, i) => <path key={i} d={`M${i * 52 - 10} ${810 - (i % 3) * 10} l26 -60 l26 60 z`} />)}
    </g>
    <g>
      <rect x={700} y={770} width={40} height={50} fill="#f2ead8" />
      <rect x={708} y={740} width={24} height={32} fill="#f2ead8" />
      <path d="M704 744 q16 -32 32 0 z" fill="#4a7fb0" />
      <rect x={719} y={712} width={3} height={18} fill="#c9a640" />
      {[[560, 800], [610, 796], [790, 802]].map(([x, y]) => (
        <g key={x}>
          <rect x={x} y={y} width={36} height={24} fill="#d8b48a" />
          <path d={`M${x - 6} ${y + 2} L${x + 18} ${y - 18} L${x + 42} ${y + 2} Z`} fill="#8a5a3a" />
        </g>
      ))}
    </g>
    <g fill="#7fae6a">
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={i * 100} cy={830 - (i % 3) * 16} r={58} />)}
    </g>
    <rect x={0} y={850} width={W} height={40} fill="#9cbf84" />
    <rect x={0} y={880} width={W} height={H - 880} fill={WATER} />
    {/* отражение берега */}
    <g fill="#7fae6a" opacity={0.35}>
      {Array.from({ length: 12 }).map((_, i) => <ellipse key={i} cx={i * 100} cy={900 + (i % 3) * 8} rx={58} ry={22} />)}
    </g>
    <rect x={0} y={880} width={W} height={6} fill="#6fa0b8" opacity={0.5} />
    {[[120, 940, 120], [520, 920, 90], [760, 1000, 140], [300, 1040, 110], [880, 960, 70], [40, 1080, 90]].map(([x, y, w]) => (
      <rect key={x} x={x} y={y} width={w} height={8} rx={4} fill="#ffffff" opacity={0.45} />
    ))}
    {/* кувшинки */}
    {[[200, 1000], [250, 1020], [460, 1060]].map(([x, y], i) => (
      <g key={i}>
        <ellipse cx={x} cy={y} rx={30} ry={9} fill="#5b8c5a" />
        <path d={`M${x} ${y} l20 -6 l-6 10 z`} fill={WATER} />
        {i === 1 && <circle cx={x - 4} cy={y - 6} r={7} fill="#f6f0f0" />}
      </g>
    ))}
    {/* утка с утятами */}
    <g>
      <ellipse cx={330} cy={968} rx={40} ry={20} fill="#f2e6d0" />
      <circle cx={300} cy={942} r={16} fill="#5b8c5a" />
      <path d="M286 942 l-16 6 l16 4 z" fill={palette.accent} />
      <path d="M360 960 l18 -12 l-4 20 z" fill="#f2e6d0" />
      <ellipse cx={330} cy={990} rx={46} ry={5} fill="#ffffff" opacity={0.4} />
      {[400, 440].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={978} rx={14} ry={8} fill="#e0c060" />
          <circle cx={x - 10} cy={968} r={7} fill="#e0c060" />
        </g>
      ))}
    </g>
    {/* мостки и лодка */}
    <g>
      <path d="M620 1060 h150 l-20 30 h-110 z" fill="#4a7fb0" />
      <path d="M630 1060 h130 l-6 8 h-118 z" fill="#3a6090" />
      <path d="M640 1060 l40 -40" stroke="#8a5a3a" strokeWidth={5} />
      <path d="M600 1080 q30 14 200 6" stroke="#ffffff" strokeWidth={4} opacity={0.4} fill="none" />
      {[790, 880, 970, 1060].map((x) => <rect key={x} x={x} y={1060} width={18} height={90} fill="#6b4429" />)}
      {[790, 880, 970, 1060].map((x) => <rect key={`r${x}`} x={x} y={1150} width={18} height={6} fill="#ffffff" opacity={0.3} />)}
      <rect x={760} y={1050} width={340} height={30} fill={WOOD} />
      {[830, 900, 970, 1040].map((x) => <rect key={x} x={x} y={1050} width={4} height={30} fill="#00000022" />)}
      <path d="M770 1060 q-40 10 -60 0" stroke="#6b4429" strokeWidth={3} fill="none" />
    </g>
    {/* стрекоза */}
    <g>
      <rect x={520} y={830} width={30} height={5} rx={2} fill="#2f6b8a" />
      <ellipse cx={530} cy={826} rx={14} ry={5} fill="#ffffff" opacity={0.7} />
      <ellipse cx={540} cy={826} rx={14} ry={5} fill="#ffffff" opacity={0.7} />
    </g>
    {/* ближний берег */}
    <path d="M0 1120 Q260 1095 540 1120 T1080 1110 V1920 H0 Z" fill="#e3cfa0" />
    {[[200, 1130], [460, 1124], [700, 1136]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx={18} ry={8} fill="#c9b080" />)}
    <path d="M0 1160 Q300 1140 560 1160 T1080 1150 V1920 H0 Z" fill={palette.floor} />
    {/* удочка с поплавком */}
    <path d="M990 1190 L690 780" stroke="#4a3020" strokeWidth={9} strokeLinecap="round" />
    <circle cx={950} cy={1136} r={14} fill="#3a3a40" />
    <path d="M690 780 Q660 880 640 990" stroke="#2b1d14" strokeWidth={2} fill="none" />
    <circle cx={640} cy={994} r={11} fill="#c8553d" />
    <rect x={629} y={994} width={22} height={10} rx={4} fill="#fff" />
    <ellipse cx={640} cy={1006} rx={24} ry={5} fill="#ffffff" opacity={0.5} />
    <ellipse cx={640} cy={1008} rx={40} ry={8} fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.4} />
    {/* ведёрко */}
    <path d="M1000 1200 l-8 -60 h70 l-8 60 z" fill="#9aa3ad" />
    <rect x={986} y={1136} width={82} height={10} rx={5} fill="#b8bec6" />
    <path d="M1010 1140 q14 -20 30 0" stroke="#c8d0d8" strokeWidth={4} fill="none" />
    <Reeds x={20} />
    <Reeds x={340} flip />
    <GroundShade />
    <Tufts color={shade(palette.floor, -0.12)} items={[[100, 1360, 1.1], [420, 1460, 1], [780, 1400, 1.2], [1000, 1560, 1.3], [200, 1720, 1.4], [700, 1800, 1.3]]} />
  </>
);

const HayBale = ({ x, y, r = 90 }: { x: number; y: number; r?: number }) => (
  <g>
    <rect x={x - r * 1.1} y={y - r * 2} width={r * 1.1} height={r * 2} fill="#d9b85a" />
    {[0.3, 0.6, 0.9].map((k) => <rect key={k} x={x - r * 1.1} y={y - r * 2 + r * 2 * k - 2} width={r * 1.1} height={4} fill="#c9a548" />)}
    <ellipse cx={x - r * 1.1} cy={y - r} rx={r * 0.45} ry={r} fill="#c9a548" />
    <circle cx={x} cy={y - r} r={r} fill="#e6c46a" />
    <circle cx={x} cy={y - r} r={r * 0.62} fill="#d9b85a" />
    <circle cx={x} cy={y - r} r={r * 0.28} fill="#c9a548" />
  </g>
);

/** Корова в профиль; (x, y) — земля, масштаб s. */
const Cow = ({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <rect x={-70} y={-110} width={140} height={70} rx={30} fill="#ffffff" />
    <circle cx={-20} cy={-90} r={18} fill="#2b2b2b" />
    <circle cx={34} cy={-74} r={14} fill="#2b2b2b" />
    {[-60, -40, 40, 56].map((dx) => <rect key={dx} x={dx} y={-50} width={14} height={50} fill="#ffffff" />)}
    <ellipse cx={-4} cy={-40} rx={14} ry={8} fill="#f0b8b8" />
    <rect x={-110} y={-140} width={50} height={46} rx={18} fill="#ffffff" />
    <rect x={-114} y={-112} width={40} height={20} rx={10} fill="#f0b8b8" />
    <path d="M-100 -140 l-8 -16 M-70 -140 l6 -16" stroke="#e8e4d8" strokeWidth={6} strokeLinecap="round" />
    <path d="M70 -100 q16 30 4 60" stroke="#ffffff" strokeWidth={6} fill="none" />
  </g>
);

const Sheep = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-36, -12, 12, 36].map((dx) => <rect key={dx} x={dx - 5} y={-36} width={10} height={36} fill="#3a3a40" />)}
    {[[-30, -60], [0, -70], [30, -60], [-14, -46], [16, -46]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={28} fill="#f4f1ea" />)}
    <ellipse cx={-58} cy={-66} rx={18} ry={14} fill="#3a3a40" />
  </g>
);

const Farm = ({ palette }: BackdropProps) => {
  const red = "#b5463a";
  return (
    <>
      <Sky />
      <path d="M0 820 Q260 760 520 810 T1080 800 V900 H0 Z" fill="#b9d0ae" />
      <path d="M0 860 Q300 780 620 850 T1080 830 V1000 H0 Z" fill={palette.wall} />
      {/* поля рядами */}
      <path d="M0 920 H1080 V990 H0 Z" fill="#e6c46a" opacity={0.7} />
      {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M${i * 100} 920 L${i * 100 - 40} 990`} stroke="#d0ae50" strokeWidth={4} opacity={0.7} />)}
      {/* водонапорная башня вдали */}
      <g>
        <rect x={120} y={760} width={14} height={160} fill="#8a8f98" />
        <rect x={160} y={760} width={14} height={160} fill="#8a8f98" />
        <path d="M120 800 L174 860 M174 800 L120 860" stroke="#8a8f98" strokeWidth={4} />
        <rect x={100} y={700} width={94} height={70} rx={10} fill="#b8bec6" />
        <path d="M100 702 q47 -40 94 0 z" fill="#9aa1a6" />
      </g>
      <rect x={0} y={980} width={W} height={H - 980} fill={palette.floor} />
      {/* коровы и овцы вдалеке */}
      <Cow x={470} y={970} s={0.45} />
      <Cow x={380} y={960} s={0.35} flip />
      <Sheep x={580} y={975} s={0.4} />
      <Sheep x={620} y={972} s={0.35} />
      {/* жерди забора */}
      <g fill={WOOD}>
        <rect x={0} y={1030} width={660} height={16} />
        <rect x={0} y={1070} width={660} height={16} />
        {[30, 170, 310, 450, 590].map((x) => <rect key={x} x={x} y={1010} width={18} height={110} rx={4} />)}
      </g>
      {/* амбар */}
      <g>
        <rect x={660} y={780} width={440} height={400} fill={red} />
        {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={680 + i * 44} y={780} width={4} height={400} fill="#00000014" />)}
        <path d="M640 790 L720 640 L880 560 L1040 640 L1120 790 Z" fill="#6b3a32" />
        <path d="M680 790 L745 670 L880 600 L1015 670 L1080 790 Z" fill={red} />
        <path d="M680 790 L745 670 L880 600 L1015 670 L1080 790" stroke="#f2e6d0" strokeWidth={10} fill="none" />
        {/* флюгер-петушок */}
        <rect x={877} y={500} width={6} height={60} fill="#3a3a40" />
        <path d="M866 500 q10 -30 30 -24 q-6 10 6 16 q-12 14 -36 8 z" fill="#3a3a40" />
        <path d="M860 520 h40" stroke="#3a3a40" strokeWidth={4} />
        <rect x={835} y={660} width={90} height={90} fill="#f2e6d0" />
        <rect x={847} y={672} width={66} height={78} fill="#e6c46a" />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M${850 + i * 18} 750 l8 -40`} stroke="#c9a548" strokeWidth={4} />)}
        <rect x={700} y={820} width={60} height={60} fill="#f2e6d0" />
        <rect x={708} y={828} width={44} height={44} fill="#5a3a30" />
        <path d="M708 828 L752 872 M752 828 L708 872" stroke="#f2e6d0" strokeWidth={6} />
        <rect x={770} y={920} width={220} height={260} fill="#f2e6d0" />
        <rect x={786} y={936} width={188} height={244} fill={shade(red, -0.12)} />
        <path d="M786 936 L974 1180 M974 936 L786 1180" stroke="#f2e6d0" strokeWidth={14} />
        <rect x={874} y={936} width={12} height={244} fill="#f2e6d0" />
        <rect x={830} y={1040} width={100} height={20} rx={4} fill="#5a3a30" />
        <path d="M1010 1060 h60 v120 h-60 z" fill="#8a5a3a" />
        <path d="M1000 1060 h80" stroke="#6b4429" strokeWidth={8} />
        <path d="M1020 1060 l40 120 M1060 1060 l-40 120" stroke="#6b4429" strokeWidth={6} />
      </g>
      <path d="M700 1180 Q740 1120 800 1180 Z" fill="#e6c46a" />
      {[710, 740, 770].map((x) => <path key={x} d={`M${x} 1180 l10 -40`} stroke="#c9a548" strokeWidth={3} />)}
      <HayBale x={250} y={1170} r={95} />
      <HayBale x={540} y={1090} r={48} />
      {/* вилы у тюка, куры и петух */}
      <path d="M380 1190 L420 960" stroke="#8a5a3a" strokeWidth={8} />
      <path d="M408 960 l4 -40 M420 960 l0 -42 M432 962 l-4 -40 M406 962 h28" stroke="#8a8f98" strokeWidth={5} fill="none" />
      <Hen x={470} y={FLOOR_Y} s={0.6} />
      <Hen x={530} y={FLOOR_Y + 6} s={0.55} flip />
      <Hen x={600} y={1040} s={0.55} rooster />
      <Birds items={[[640, 470, 0.8], [676, 488, 0.6]]} />
      <GroundShade />
      <Tufts color={shade(palette.floor, -0.12)} items={[[60, 1300, 1.1], [320, 1460, 1], [700, 1380, 1.2], [960, 1500, 1.3], [160, 1700, 1.4], [820, 1760, 1.4]]} />
      {[[120, 1360], [880, 1420], [480, 1640]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={30} ry={8} fill="#d9b85a" opacity={0.6} />)}
    </>
  );
};

const Cabbage = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={-26} cy={-20} rx={30} ry={20} fill="#6f9e5a" />
    <ellipse cx={26} cy={-20} rx={30} ry={20} fill="#6f9e5a" />
    <circle cx={0} cy={-30} r={28} fill="#a9cf7f" />
    <path d="M-10 -40 q10 10 20 0" stroke="#8cbc6a" strokeWidth={4} fill="none" />
  </g>
);

const Garden = ({ palette }: BackdropProps) => (
  <>
    <Sky />
    <g fill="#7fae6a">
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={i * 100} cy={860 - (i % 3) * 14} r={50} />)}
    </g>
    {/* дачный домик за забором */}
    <g>
      <rect x={560} y={820} width={170} height={130} fill="#e8d5b0" />
      <path d="M546 826 L645 740 L744 826 Z" fill="#4a7fb0" />
      <rect x={612} y={760} width={66} height={56} fill="#e8d5b0" />
      <rect x={622} y={770} width={46} height={36} fill="#cfe6f5" />
      <rect x={580} y={850} width={50} height={50} fill="#cfe6f5" />
      <rect x={600} y={850} width={8} height={50} fill="#e8d5b0" />
      <rect x={660} y={860} width={44} height={90} fill="#8a5a3a" />
    </g>
    <rect x={0} y={880} width={W} height={H - 880} fill={palette.wall} />
    {/* яблоня */}
    <LeafyTree x={470} y={1010} s={0.55} tones={["#4f8350", "#6a9e58", "#8cbf6e"]} />
    {[[420, 760], [470, 800], [510, 740], [440, 820], [520, 800]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill="#d8503a" />)}
    <Fence x0={0} x1={W} y={1010} h={130} color="#c4a272" />
    {/* скворечник на шесте */}
    <rect x={990} y={640} width={8} height={370} fill="#8a5a3a" />
    <rect x={966} y={600} width={56} height={60} fill={WOOD} />
    <path d="M958 604 L994 574 L1030 604 Z" fill="#6b4f3a" />
    <circle cx={994} cy={628} r={10} fill="#3a2a20" />
    {/* теплица с помидорами */}
    <g>
      <path d="M30 1020 V880 Q190 720 350 880 V1020 Z" fill="#dff0f5" opacity={0.85} />
      {[[80, 940], [140, 920], [240, 925], [300, 950]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 2} y={y} width={4} height={1020 - y} fill="#8a5a3a" />
          <ellipse cx={x} cy={y + 30} rx={24} ry={40} fill="#6f9e5a" opacity={0.85} />
          <circle cx={x - 8} cy={y + 40} r={9} fill="#c8553d" />
          <circle cx={x + 10} cy={y + 20} r={8} fill="#c8553d" />
        </g>
      ))}
      <path d="M30 1020 V880 Q190 720 350 880 V1020 Z M188 1020 V780 M30 880 H350" fill="none" stroke="#f2f2f2" strokeWidth={10} />
      <path d="M80 870 L140 800" stroke="#ffffff" strokeWidth={10} opacity={0.6} />
    </g>
    {/* пугало у дальнего края */}
    <g>
      <rect x={756} y={820} width={10} height={200} fill="#8a5a3a" />
      <rect x={700} y={870} width={122} height={10} fill="#8a5a3a" />
      <path d="M730 870 h62 l10 90 h-82 z" fill="#4a6fa5" />
      <rect x={740} y={890} width={14} height={14} fill="#e0a030" />
      <circle cx={761} cy={830} r={26} fill="#e8d5a0" />
      <path d="M726 820 h70 l-10 -26 h-50 z" fill="#6b4f3a" />
      <rect x={716} y={816} width={90} height={8} rx={4} fill="#6b4f3a" />
      <path d="M700 875 l-14 14 M822 875 l14 14" stroke="#e6c46a" strokeWidth={6} />
      <circle cx={752} cy={830} r={3} fill="#2b1d14" />
      <circle cx={770} cy={830} r={3} fill="#2b1d14" />
      <path d="M676 860 q8 -14 18 -6" stroke="#2b2a2e" strokeWidth={5} fill="none" />
    </g>
    <Sunflower x={820} y={1010} h={200} />
    <Sunflower x={900} y={1010} h={250} />
    <Sunflower x={980} y={1010} h={190} />
    <rect x={0} y={1040} width={W} height={H - 1040} fill={palette.floor} />
    {/* грядки: капуста, морковь, клубника */}
    <rect x={0} y={1060} width={W} height={70} rx={30} fill="#7a5236" />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={20 + i * 90} y={1068} width={50} height={4} rx={2} fill="#6b4429" />)}
    {[90, 230, 370, 710, 850, 990].map((x) => <Cabbage key={x} x={x} y={1100} s={0.9} />)}
    {[470, 520, 570, 620].map((x) => (
      <g key={x}>
        <path d={`M${x} 1090 l-10 -30 M${x} 1090 l0 -34 M${x} 1090 l10 -30`} stroke="#5b8c5a" strokeWidth={5} />
        <path d={`M${x - 8} 1092 h16 l-8 18 z`} fill="#e07a30" />
      </g>
    ))}
    {/* лопата и лейка, тачка */}
    <rect x={160} y={1000} width={12} height={200} fill="#8a5a3a" transform="rotate(-8 166 1200)" />
    <path d="M150 1200 h46 l-6 60 q-17 14 -34 0 z" fill="#8c8f98" transform="rotate(-8 166 1200)" />
    <g>
      <path d="M880 1190 v-90 h110 v90 z" fill="#5b8c5a" />
      <path d="M880 1120 L800 1070 l-8 14 l80 50 z" fill="#5b8c5a" />
      <path d="M990 1110 q50 0 40 60" stroke="#5b8c5a" strokeWidth={12} fill="none" />
      <circle cx={796} cy={1076} r={12} fill="#4a7a4a" />
    </g>
    <g>
      <path d="M330 1180 h150 l-20 -70 h-150 z" fill="#4a6fa5" />
      <circle cx={340} cy={1190} r={20} fill="#2b2a2e" />
      <path d="M470 1170 l60 20" stroke="#8a5a3a" strokeWidth={8} />
      <rect x={350} y={1094} width={110} height={20} rx={8} fill="#7a5236" />
    </g>
    <GroundShade />
    <Tufts color={shade(palette.floor, -0.12)} items={[[60, 1300, 1.1], [320, 1460, 1], [700, 1380, 1.2], [960, 1500, 1.3], [160, 1700, 1.4], [820, 1760, 1.4]]} />
    {[[120, 1360], [940, 1320]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill="#ffffff" />)}
  </>
);

const Mountain = ({ palette }: BackdropProps) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill="#cfe0ee" />
    <rect x={0} y={560} width={W} height={400} fill="#e0ebf4" />
    <Puff x={720} y={440} s={0.38} color="#ffffffd0" />
    <Puff x={40} y={130} s={0.4} color="#ffffff88" under="#ffffff66" />
    {/* орёл */}
    <path d="M520 520 q-40 -24 -80 -10 q40 0 60 20 q20 -20 60 -20 q-40 -14 -80 10" fill="#4a4040" />
    <Birds items={[[300, 600, 0.6]]} />
    {/* самый дальний хребет */}
    <path d="M-40 860 L90 700 L210 800 L380 640 L520 780 L640 690 L800 820 L980 660 L1120 860 Z" fill="#c4d0de" />
    {/* дальний хребет */}
    <path d="M-40 900 L180 560 L330 740 L520 480 L760 780 L900 600 L1120 900 Z" fill="#a8b8cc" />
    <path d="M180 560 L230 637 L205 625 L175 650 L150 606 Z M520 480 L580 572 L548 560 L520 590 L490 562 L465 565 Z M900 600 L950 670 L920 660 L895 680 L870 645 Z" fill="#ffffff" />
    <path d="M520 480 L580 572 L548 560 L520 590 Z" fill="#e6eef6" />
    {/* облако между вершинами */}
    <rect x={560} y={700} width={300} height={36} rx={18} fill="#ffffff" opacity={0.85} />
    <rect x={620} y={680} width={160} height={30} rx={15} fill="#ffffff" opacity={0.85} />
    {/* ближний хребет с водопадом */}
    <path d="M-80 1000 L240 700 L470 940 L760 640 L1160 1000 Z" fill="#7f93a8" />
    <path d="M760 640 L1160 1000 H900 L800 760 Z" fill="#72869b" />
    <path d="M240 700 L300 756 L270 748 L240 772 L210 744 L185 752 Z M760 640 L840 715 L800 705 L765 735 L730 708 L700 697 Z" fill="#f4f6fa" />
    <path d="M610 800 q-10 80 4 180" stroke="#e8f4fa" strokeWidth={16} fill="none" />
    <path d="M610 800 q-10 80 4 180" stroke="#ffffff" strokeWidth={5} fill="none" />
    <ellipse cx={614} cy={980} rx={30} ry={10} fill="#ffffff" opacity={0.8} />
    {/* альпийский луг, хижина, указатель */}
    <path d="M0 960 Q300 920 600 955 T1080 940 V1920 H0 Z" fill={palette.wall} />
    <g>
      <rect x={360} y={920} width={90} height={60} fill="#8a5a3a" />
      <path d="M350 924 L405 880 L460 924 Z" fill="#6b4f3a" />
      <rect x={380} y={940} width={20} height={18} fill="#cfe6f5" />
      <rect x={420} y={944} width={18} height={36} fill="#5a3a20" />
    </g>
    {Array.from({ length: 8 }).map((_, i) => <Pine key={i} x={660 + i * 34} y={960 + (i % 2) * 6} s={0.22} color="#4f7a4a" trunk="#5a3a26" />)}
    <path d="M0 1080 Q340 1050 640 1075 T1080 1065 V1920 H0 Z" fill={palette.floor} />
    {/* тропа */}
    <path d="M560 1075 Q520 1300 600 1920 H760 Q640 1300 600 1075 Z" fill="#b8a888" opacity={0.5} />
    <g>
      <rect x={316} y={1000} width={10} height={170} fill="#8a5a3a" />
      <path d="M326 1010 h120 l18 18 l-18 18 h-120 z" fill="#c8553d" />
      <Label x={388} y={1036} text="ВЕРШИНА" size={18} />
      <path d="M316 1060 h-110 l-16 16 l16 16 h110 z" fill="#e0a030" />
      <Label x={256} y={1084} text="ДОМ" size={18} color="#2b2a2e" />
    </g>
    <Pine x={60} y={1150} s={1.3} color="#3f6b45" trunk="#5a3a26" shadow="#365e3c" />
    <Pine x={150} y={1060} s={0.8} color="#4f7a4a" trunk="#5a3a26" shadow="#456c42" />
    <Pine x={1020} y={1120} s={1.1} color="#3f6b45" trunk="#5a3a26" shadow="#365e3c" />
    {/* валуны и камешки */}
    <path d="M800 1190 Q800 1090 880 1080 Q960 1075 970 1190 Z" fill="#9a9ca6" />
    <path d="M900 1190 Q930 1110 920 1082 Q965 1095 970 1190 Z" fill="#82848e" />
    <path d="M840 1120 q20 -16 40 -10" stroke="#b0b2bc" strokeWidth={6} fill="none" />
    <path d="M720 1190 Q730 1150 770 1150 Q800 1160 800 1190 Z" fill="#8a8c96" />
    {[[480, 1240], [130, 1400], [900, 1440], [380, 1700]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={22} ry={10} fill="#9a9ca6" />)}
    {/* эдельвейсы и колокольчики */}
    {[[260, 1300], [320, 1340], [780, 1320], [950, 1290], [180, 1560], [860, 1620]].map(([x, y], i) => (
      <g key={x}>
        <circle cx={x} cy={y} r={11} fill={i % 2 ? "#ffffff" : "#8a7ac8"} />
        <circle cx={x} cy={y} r={4} fill={palette.accent} />
      </g>
    ))}
    <GroundShade />
    <Tufts color={shade(palette.floor, -0.12)} items={[[60, 1300, 1.1], [420, 1460, 1], [700, 1380, 1.2], [1000, 1520, 1.3], [260, 1760, 1.4]]} />
  </>
);

export const Derevnya = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "forest" ? (
      <Forest />
    ) : variant === "river-lake" ? (
      <River palette={palette} />
    ) : variant === "farm" ? (
      <Farm palette={palette} />
    ) : variant === "garden" ? (
      <Garden palette={palette} />
    ) : variant === "mountain" ? (
      <Mountain palette={palette} />
    ) : (
      <Village palette={palette} />
    )}
  </Canvas>
);
