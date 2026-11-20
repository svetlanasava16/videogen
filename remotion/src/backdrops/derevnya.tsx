import { Canvas, Cloud, Fence, FLOOR_Y, Tree, W, H, type BackdropProps } from "./parts";

/** Осветлить (k>0) или затемнить (k<0) цвет #rrggbb. */
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const t = k < 0 ? 0 : 255;
  const p = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * p));
  return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
};

const SKY = "#cfe4ee";
const WATER = "#8fc3dc";
const WOOD = "#a8774a";

const Sky = ({ sun = true }: { sun?: boolean }) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={SKY} />
    {sun && <circle cx={860} cy={540} r={66} fill="#fbe7a6" />}
    <Cloud x={70} y={510} s={0.55} color="#ffffffd0" />
    <Cloud x={640} y={100} s={0.45} color="#ffffffa0" />
  </>
);

/** Ёлка из трёх ярусов; (x, y) — основание ствола. */
const Pine = ({ x, y, s = 1, color = "#4f7a4a", trunk = "#6b4429" }: { x: number; y: number; s?: number; color?: string; trunk?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-14} y={-90} width={28} height={90} fill={trunk} />
    <path d="M0 -460 L90 -300 H-90 Z M0 -380 L120 -190 H-120 Z M0 -290 L150 -80 H-150 Z" fill={color} />
  </g>
);

const Sunflower = ({ x, y, h }: { x: number; y: number; h: number }) => (
  <g>
    <rect x={x - 5} y={y - h} width={10} height={h} fill="#5b8c5a" />
    <ellipse cx={x + 24} cy={y - h * 0.5} rx={26} ry={12} fill="#5b8c5a" transform={`rotate(-25 ${x + 24} ${y - h * 0.5})`} />
    {Array.from({ length: 10 }).map((_, i) => (
      <ellipse key={i} cx={x} cy={y - h - 34} rx={11} ry={26} fill="#f2c230" transform={`rotate(${i * 36} ${x} ${y - h})`} />
    ))}
    <circle cx={x} cy={y - h} r={24} fill="#6b4429" />
  </g>
);

/** Бревенчатая изба. */
const Hut = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={250} y={-560} width={50} height={120} fill="#8a5a3a" />
    <rect x={0} y={-320} width={360} height={320} fill={WOOD} />
    {Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} x={0} y={-320 + i * 36 + 30} width={360} height={6} rx={3} fill={shade(WOOD, -0.18)} />
    ))}
    {Array.from({ length: 9 }).map((_, i) => (
      <g key={`e${i}`}>
        <circle cx={-6} cy={-320 + i * 36 + 18} r={16} fill={shade(WOOD, 0.12)} />
        <circle cx={366} cy={-320 + i * 36 + 18} r={16} fill={shade(WOOD, 0.12)} />
      </g>
    ))}
    <path d="M-50 -310 L180 -540 L410 -310 Z" fill="#6b4f3a" />
    <path d="M30 -320 L180 -470 L330 -320 Z" fill={shade(WOOD, 0.08)} />
    <circle cx={180} cy={-380} r={22} fill="#f2e6d0" />
    <path d="M-50 -310 L180 -540 L410 -310 L390 -296 L180 -506 L-30 -296 Z" fill="#f2e6d0" />
    {/* окно со ставнями */}
    <rect x={56} y={-240} width={50} height={130} rx={6} fill="#4a6fa5" />
    <rect x={254} y={-240} width={50} height={130} rx={6} fill="#4a6fa5" />
    <rect x={100} y={-256} width={160} height={162} rx={8} fill="#f2e6d0" />
    <rect x={114} y={-242} width={132} height={134} rx={4} fill="#cfe6f5" />
    <rect x={177} y={-242} width={6} height={134} fill="#f2e6d0" />
    <rect x={114} y={-178} width={132} height={6} fill="#f2e6d0" />
    <path d="M100 -256 L180 -300 L260 -256 Z" fill="#f2e6d0" />
    <rect x={92} y={-98} width={176} height={14} rx={5} fill="#f2e6d0" />
    {/* герань на окне */}
    <circle cx={140} cy={-124} r={14} fill="#d8506a" />
    <circle cx={220} cy={-124} r={14} fill="#d8506a" />
  </g>
);

const Village = ({ palette }: BackdropProps) => (
  <>
    <Sky />
    <g fill="#7fae6a">
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={i * 100} cy={845 - (i % 3) * 14} r={52} />)}
    </g>
    <rect x={0} y={860} width={W} height={H - 860} fill={palette.wall} />
    <path d="M0 885 Q280 866 520 888 T1080 878 V900 Q800 910 540 902 T0 906 Z" fill={WATER} />
    <path d="M0 1060 Q300 1030 600 1055 T1080 1045 V1920 H0 Z" fill={palette.floor} />
    <Hut x={-20} y={1150} />
    <Fence x0={360} x1={880} y={1150} h={120} color="#b08a5a" />
    <Sunflower x={420} y={1150} h={210} />
    <Sunflower x={486} y={1150} h={170} />
    <Tree x={930} y={1180} s={1.15} kind="birch" crown="#8fbf5a" />
    <Tree x={1045} y={1150} s={0.95} kind="birch" crown="#7fb050" />
    {/* ведро */}
    <path d="M800 1190 l-10 -70 h80 l-10 70 z" fill="#9aa3ad" />
    <rect x={786} y={1116} width={88} height={12} rx={6} fill="#b8bec6" />
    {/* цветы в траве */}
    {[[90, 1330], [160, 1380], [960, 1350], [1010, 1300]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={10} fill={i % 2 ? "#ffffff" : palette.accent} />
    ))}
  </>
);

const Stump = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-70 0 L-56 -90 H56 L70 0 Z" fill="#7a5236" />
    <ellipse cx={0} cy={-90} rx={56} ry={20} fill="#d9b88a" />
    <ellipse cx={0} cy={-90} rx={34} ry={12} fill="#c9a272" />
    <ellipse cx={0} cy={-90} rx={12} ry={4} fill="#b8915f" />
  </g>
);

const Mushroom = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-8} y={-40} width={16} height={40} rx={6} fill="#f2e6d0" />
    <path d="M-34 -36 Q0 -86 34 -36 Z" fill="#c8553d" />
    <circle cx={-12} cy={-52} r={5} fill="#fff" />
    <circle cx={10} cy={-60} r={4} fill="#fff" />
  </g>
);

const Forest = () => {
  const ground = "#6b8a4a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#d8e8dc" />
      {/* дальний ряд */}
      {Array.from({ length: 10 }).map((_, i) => <Pine key={`a${i}`} x={i * 120 + 10} y={1000} s={0.85 + (i % 3) * 0.12} color="#9dbba0" trunk="#9dbba0" />)}
      {Array.from({ length: 8 }).map((_, i) => <Pine key={`b${i}`} x={i * 150 + 70} y={1030} s={1.0 + (i % 2) * 0.2} color="#6f9a70" trunk="#6b5a44" />)}
      <rect x={0} y={1020} width={W} height={H - 1020} fill={ground} />
      <rect x={0} y={1020} width={W} height={16} fill="#00000018" />
      <Pine x={50} y={1230} s={1.9} color="#3f6b45" trunk="#5a3a26" />
      <Pine x={1040} y={1210} s={1.75} color="#456f48" trunk="#5a3a26" />
      <Stump x={270} y={1170} />
      <Stump x={840} y={1120} s={0.7} />
      <Mushroom x={340} y={1180} s={0.9} />
      <Mushroom x={372} y={1186} s={0.6} />
      <Mushroom x={790} y={1128} s={0.6} />
      {/* шишки и трава */}
      {[[160, 1320], [920, 1360], [600, 1100]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx={14} ry={9} fill="#8a5a3a" />)}
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
    {/* дальний берег */}
    <g fill="#7fae6a">
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={i * 100} cy={830 - (i % 3) * 16} r={58} />)}
    </g>
    <rect x={0} y={850} width={W} height={40} fill="#9cbf84" />
    <rect x={0} y={880} width={W} height={H - 880} fill={WATER} />
    {[[120, 940, 120], [520, 920, 90], [760, 1000, 140], [300, 1040, 110]].map(([x, y, w]) => (
      <rect key={x} x={x} y={y} width={w} height={8} rx={4} fill="#ffffff" opacity={0.45} />
    ))}
    {/* утка */}
    <g>
      <ellipse cx={330} cy={968} rx={40} ry={20} fill="#f2e6d0" />
      <circle cx={300} cy={942} r={16} fill="#5b8c5a" />
      <path d="M286 942 l-16 6 l16 4 z" fill={palette.accent} />
      <path d="M360 960 l18 -12 l-4 20 z" fill="#f2e6d0" />
    </g>
    {/* мостки */}
    <g>
      {[790, 880, 970, 1060].map((x) => <rect key={x} x={x} y={1060} width={18} height={90} fill="#6b4429" />)}
      <rect x={760} y={1050} width={340} height={30} fill={WOOD} />
      {[830, 900, 970, 1040].map((x) => <rect key={x} x={x} y={1050} width={4} height={30} fill="#00000022" />)}
    </g>
    {/* ближний берег */}
    <path d="M0 1120 Q260 1095 540 1120 T1080 1110 V1920 H0 Z" fill="#e3cfa0" />
    <path d="M0 1160 Q300 1140 560 1160 T1080 1150 V1920 H0 Z" fill={palette.floor} />
    {/* удочка с поплавком */}
    <path d="M990 1190 L690 780" stroke="#4a3020" strokeWidth={9} strokeLinecap="round" />
    <path d="M690 780 Q660 880 640 990" stroke="#2b1d14" strokeWidth={2} fill="none" />
    <circle cx={640} cy={994} r={11} fill="#c8553d" />
    <rect x={629} y={994} width={22} height={10} rx={4} fill="#fff" />
    <ellipse cx={640} cy={1006} rx={24} ry={5} fill="#ffffff" opacity={0.5} />
    {/* ведёрко */}
    <path d="M1000 1200 l-8 -60 h70 l-8 60 z" fill="#9aa3ad" />
    <rect x={986} y={1136} width={82} height={10} rx={5} fill="#b8bec6" />
    <Reeds x={20} />
    <Reeds x={340} flip />
  </>
);

const HayBale = ({ x, y, r = 90 }: { x: number; y: number; r?: number }) => (
  <g>
    <rect x={x - r * 1.1} y={y - r * 2} width={r * 1.1} height={r * 2} fill="#d9b85a" />
    <ellipse cx={x - r * 1.1} cy={y - r} rx={r * 0.45} ry={r} fill="#c9a548" />
    <circle cx={x} cy={y - r} r={r} fill="#e6c46a" />
    <circle cx={x} cy={y - r} r={r * 0.62} fill="#d9b85a" />
    <circle cx={x} cy={y - r} r={r * 0.28} fill="#c9a548" />
  </g>
);

const Farm = ({ palette }: BackdropProps) => {
  const red = "#b5463a";
  return (
    <>
      <Sky />
      <path d="M0 860 Q300 780 620 850 T1080 830 V1000 H0 Z" fill={palette.wall} />
      <path d="M0 920 H1080 V990 H0 Z" fill="#e6c46a" opacity={0.7} />
      <rect x={0} y={980} width={W} height={H - 980} fill={palette.floor} />
      {/* корова вдалеке */}
      <g transform="translate(470 970) scale(0.45)">
        <rect x={-70} y={-110} width={140} height={70} rx={30} fill="#ffffff" />
        <circle cx={-20} cy={-90} r={18} fill="#2b2b2b" />
        <rect x={-60} y={-50} width={16} height={50} fill="#ffffff" />
        <rect x={40} y={-50} width={16} height={50} fill="#ffffff" />
        <rect x={-110} y={-140} width={50} height={46} rx={18} fill="#ffffff" />
        <rect x={-114} y={-112} width={40} height={20} rx={10} fill="#f0b8b8" />
      </g>
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
        <rect x={835} y={660} width={90} height={90} fill="#f2e6d0" />
        <rect x={847} y={672} width={66} height={78} fill="#e6c46a" />
        <rect x={770} y={920} width={220} height={260} fill="#f2e6d0" />
        <rect x={786} y={936} width={188} height={244} fill={shade(red, -0.12)} />
        <path d="M786 936 L974 1180 M974 936 L786 1180" stroke="#f2e6d0" strokeWidth={14} />
        <rect x={874} y={936} width={12} height={244} fill="#f2e6d0" />
      </g>
      <path d="M700 1180 Q740 1120 800 1180 Z" fill="#e6c46a" />
      <HayBale x={250} y={1170} r={95} />
      <HayBale x={540} y={1090} r={48} />
    </>
  );
};

const Cabbage = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={-26} cy={-20} rx={30} ry={20} fill="#6f9e5a" />
    <ellipse cx={26} cy={-20} rx={30} ry={20} fill="#6f9e5a" />
    <circle cx={0} cy={-30} r={28} fill="#a9cf7f" />
  </g>
);

const Garden = ({ palette }: BackdropProps) => (
  <>
    <Sky />
    <g fill="#7fae6a">
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={i * 100} cy={860 - (i % 3) * 14} r={50} />)}
    </g>
    <rect x={0} y={880} width={W} height={H - 880} fill={palette.wall} />
    <Fence x0={0} x1={W} y={1010} h={130} color="#c4a272" />
    {/* теплица */}
    <g>
      <path d="M30 1020 V880 Q190 720 350 880 V1020 Z" fill="#dff0f5" opacity={0.85} />
      <path d="M30 1020 V880 Q190 720 350 880 V1020 Z M188 1020 V780" fill="none" stroke="#f2f2f2" strokeWidth={10} />
      <rect x={30} y={950} width={320} height={10} fill="#f2f2f2" />
      <circle cx={120} cy={990} r={22} fill="#c8553d" />
      <circle cx={260} cy={985} r={20} fill="#c8553d" />
    </g>
    <Sunflower x={820} y={1010} h={200} />
    <Sunflower x={900} y={1010} h={250} />
    <Sunflower x={980} y={1010} h={190} />
    <rect x={0} y={1040} width={W} height={H - 1040} fill={palette.floor} />
    {/* грядка */}
    <rect x={0} y={1060} width={W} height={70} rx={30} fill="#7a5236" />
    {[90, 230, 370, 710, 850, 990].map((x) => <Cabbage key={x} x={x} y={1100} s={0.9} />)}
    {/* лопата и лейка */}
    <rect x={160} y={1000} width={12} height={200} fill="#8a5a3a" transform="rotate(-8 166 1200)" />
    <path d="M150 1200 h46 l-6 60 q-17 14 -34 0 z" fill="#8c8f98" transform="rotate(-8 166 1200)" />
    <g>
      <path d="M880 1190 v-90 h110 v90 z" fill="#5b8c5a" />
      <path d="M880 1120 L800 1070 l-8 14 l80 50 z" fill="#5b8c5a" />
      <path d="M990 1110 q50 0 40 60" stroke="#5b8c5a" strokeWidth={12} fill="none" />
    </g>
  </>
);

const Mountain = ({ palette }: BackdropProps) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill="#cfe0ee" />
    <Cloud x={720} y={440} s={0.4} color="#ffffffd0" />
    {/* дальний хребет */}
    <path d="M-40 900 L180 560 L330 740 L520 480 L760 780 L900 600 L1120 900 Z" fill="#a8b8cc" />
    <path d="M180 560 L230 637 L205 625 L175 650 L150 606 Z M520 480 L580 572 L548 560 L520 590 L490 562 L465 565 Z M900 600 L950 670 L920 660 L895 680 L870 645 Z" fill="#ffffff" />
    {/* ближний */}
    <path d="M-80 1000 L240 700 L470 940 L760 640 L1160 1000 Z" fill="#7f93a8" />
    <path d="M240 700 L300 756 L270 748 L240 772 L210 744 L185 752 Z M760 640 L840 715 L800 705 L765 735 L730 708 L700 697 Z" fill="#f4f6fa" />
    {/* альпийский луг */}
    <path d="M0 960 Q300 920 600 955 T1080 940 V1920 H0 Z" fill={palette.wall} />
    <path d="M0 1080 Q340 1050 640 1075 T1080 1065 V1920 H0 Z" fill={palette.floor} />
    <Pine x={60} y={1150} s={1.3} color="#3f6b45" trunk="#5a3a26" />
    <Pine x={150} y={1060} s={0.8} color="#4f7a4a" trunk="#5a3a26" />
    <Pine x={1020} y={1120} s={1.1} color="#3f6b45" trunk="#5a3a26" />
    {/* валун */}
    <path d="M800 1190 Q800 1090 880 1080 Q960 1075 970 1190 Z" fill="#9a9ca6" />
    <path d="M900 1190 Q930 1110 920 1082 Q965 1095 970 1190 Z" fill="#82848e" />
    {[[260, 1300], [320, 1340], [780, 1320], [950, 1290]].map(([x, y]) => (
      <g key={x}>
        <circle cx={x} cy={y} r={11} fill="#ffffff" />
        <circle cx={x} cy={y} r={4} fill={palette.accent} />
      </g>
    ))}
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
