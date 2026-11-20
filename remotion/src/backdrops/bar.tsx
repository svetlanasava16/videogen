import { Canvas, Room, HangingLamp, Plant, FLOOR_Y, W, type BackdropProps, type Palette } from "./parts";

/**
 * Фон «bar»: уютный бар. Варианты (content/locations/bar.json → bible.variants):
 * restaurant / cafe, party, hotel. Остальное — базовый бар.
 */

/** Смешать цвет с белым (t>0) или чёрным (t<0). */
const shade = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t)));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

const WOOD = "#8a5a3a";
const WOOD_D = "#6b4429";
const WOOD_L = "#a8744a";
const BOTTLES = ["#5b8c5a", "#b4452f", "#d9a630", "#7a4a8a", "#4a7a8a", "#c8763d", "#e8dcc0"];

/** Бутылка: тело + горлышко. */
const Bottle = ({ x, base, h, color }: { x: number; base: number; h: number; color: string }) => (
  <g fill={color}>
    <rect x={x - 17} y={base - h} width={34} height={h} rx={9} />
    <rect x={x - 6} y={base - h - 34} width={12} height={40} rx={4} />
    <rect x={x - 17} y={base - h * 0.6} width={34} height={h * 0.28} fill="#ffffff30" />
  </g>
);

/** Полка с бутылками. */
const BottleShelf = ({ x0, x1, y, seed = 0 }: { x0: number; x1: number; y: number; seed?: number }) => {
  const n = Math.floor((x1 - x0 - 40) / 56);
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <Bottle key={i} x={x0 + 40 + i * 56} base={y} h={70 + ((i * 7 + seed) % 3) * 16} color={shade(BOTTLES[(i + seed) % BOTTLES.length], -0.18)} />
      ))}
      <rect x={x0} y={y} width={x1 - x0} height={18} rx={4} fill={WOOD_L} />
      <rect x={x0} y={y + 18} width={x1 - x0} height={8} fill="#00000030" />
    </g>
  );
};

/** Барная стойка поперёк задней стены (верх ~y 975). */
const Counter = ({ accent, top = 975 }: { accent: string; top?: number }) => (
  <g>
    <rect x={0} y={top} width={W} height={30} rx={6} fill={WOOD_L} />
    <rect x={0} y={top + 30} width={W} height={FLOOR_Y - top - 30} fill={WOOD} />
    {Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} x={60 + i * 120} y={top + 30} width={8} height={FLOOR_Y - top - 30} fill="#00000018" />
    ))}
    <rect x={0} y={FLOOR_Y - 40} width={W} height={10} fill={accent} opacity={0.7} />
  </g>
);

/** Барный стул. */
const Stool = ({ x }: { x: number }) => (
  <g>
    <rect x={x - 6} y={1060} width={12} height={FLOOR_Y - 1060} fill="#2b1d14" />
    <rect x={x - 34} y={1130} width={68} height={8} rx={4} fill="#2b1d14" />
    <ellipse cx={x} cy={FLOOR_Y - 2} rx={36} ry={8} fill="#2b1d14" />
    <rect x={x - 52} y={1036} width={104} height={30} rx={14} fill="#b4452f" />
  </g>
);

/** Пивной кран и бокал на стойке. */
const Taps = ({ x, top = 975, accent }: { x: number; top?: number; accent: string }) => (
  <g>
    <rect x={x - 70} y={top - 26} width={140} height={26} rx={6} fill="#c9a24a" />
    {[-40, 0, 40].map((dx) => (
      <g key={dx}>
        <rect x={x + dx - 5} y={top - 86} width={10} height={60} fill="#c9a24a" />
        <rect x={x + dx - 9} y={top - 112} width={18} height={34} rx={6} fill={dx === 0 ? accent : "#2b1d14"} />
      </g>
    ))}
  </g>
);

const Mug = ({ x, top = 975 }: { x: number; top?: number }) => (
  <g>
    <rect x={x} y={top - 70} width={46} height={70} rx={6} fill="#e8b040" />
    <rect x={x} y={top - 80} width={46} height={18} rx={8} fill="#f6efe0" />
    <path d={`M${x + 46} ${top - 54} q22 0 22 20 q0 18 -22 18`} stroke="#e8b04099" strokeWidth={8} fill="none" />
  </g>
);

const BaseBar = ({ palette }: { palette: Palette }) => (
  <>
    <Room wall={palette.wall} floor={palette.floor} />
    {/* тёплая подсветка стены за полками */}
    <rect x={60} y={450} width={960} height={420} rx={20} fill={shade(palette.wall, 0.08)} />
    <ellipse cx={540} cy={660} rx={440} ry={200} fill={palette.accent} opacity={0.08} />
    <BottleShelf x0={80} x1={1000} y={600} seed={0} />
    <BottleShelf x0={80} x1={1000} y={820} seed={3} />
    <HangingLamp x={250} len={70} color={palette.accent} />
    <HangingLamp x={830} len={70} color={palette.accent} />
    <Counter accent={palette.accent} />
    <Taps x={760} accent={palette.accent} />
    <Mug x={330} />
    <Stool x={110} />
    <Stool x={970} />
  </>
);

/* ---------- restaurant / cafe ---------- */

const CafeTable = ({ x, cloth, hem, accent }: { x: number; cloth: string; hem: string; accent: string }) => {
  const top = 1000;
  return (
    <g>
      {/* стулья за столом */}
      <rect x={x - 130} y={940} width={70} height={250} rx={14} fill={WOOD_D} />
      <rect x={x + 60} y={940} width={70} height={250} rx={14} fill={WOOD_D} />
      <rect x={x - 6} y={top} width={12} height={FLOOR_Y - top} fill="#2b1d14" />
      <ellipse cx={x} cy={FLOOR_Y - 4} rx={50} ry={10} fill="#2b1d14" />
      <path d={`M${x - 120} ${top} L${x + 120} ${top} L${x + 136} ${top + 110} L${x - 136} ${top + 110} Z`} fill={cloth} />
      <rect x={x - 136} y={top + 96} width={272} height={16} rx={4} fill={hem} />
      {/* вазочка с цветком и свеча */}
      <rect x={x - 46} y={top - 46} width={26} height={46} rx={10} fill={shade(accent, -0.1)} />
      <rect x={x - 35} y={top - 92} width={4} height={50} fill="#5b8c5a" />
      <circle cx={x - 33} cy={top - 98} r={14} fill="#c8553d" />
      <rect x={x + 22} y={top - 40} width={16} height={40} rx={4} fill="#f6efe0" />
      <ellipse cx={x + 30} cy={top - 52} rx={7} ry={12} fill={accent} />
    </g>
  );
};

const Restaurant = ({ palette }: { palette: Palette }) => {
  const wall = shade(palette.wall, 0.12);
  return (
    <>
      <Room wall={wall} floor={palette.floor} />
      {/* обшивка низа стены */}
      <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={WOOD_D} />
      <rect x={0} y={866} width={W} height={16} fill={WOOD_L} />
      {/* окно с вечерним городом в центре */}
      <rect x={350} y={440} width={380} height={340} rx={190} fill={shade(palette.wall, 0.35)} />
      <rect x={366} y={456} width={348} height={308} rx={174} fill="#2b3a55" />
      <path d="M366 764 v-80 h60 v-40 h50 v60 h60 v-90 h70 v70 h50 v-30 h58 v110 Z" fill="#1e2a40" />
      {[400, 520, 600, 660].map((x, i) => <rect key={x} x={x} y={700 - (i % 2) * 40} width={14} height={14} fill={palette.accent} opacity={0.8} />)}
      <circle cx={630} cy={540} r={22} fill="#f5e6a8" />
      <rect x={530} y={456} width={20} height={308} fill={shade(palette.wall, 0.35)} />
      {/* картинки по бокам */}
      <rect x={100} y={480} width={150} height={190} rx={8} fill={palette.accent} />
      <rect x={114} y={494} width={122} height={162} fill="#f2e6d0" />
      <circle cx={175} cy={560} r={34} fill="#c8553d" />
      <rect x={830} y={480} width={150} height={190} rx={8} fill={palette.accent} />
      <rect x={844} y={494} width={122} height={162} fill="#f2e6d0" />
      <path d="M860 640 l40 -70 l30 40 l20 -24 l18 54 Z" fill="#5b8c5a" />
      <HangingLamp x={190} len={60} color={palette.accent} />
      <HangingLamp x={890} len={60} color={palette.accent} />
      <CafeTable x={190} cloth="#f6efe0" hem="#b4452f" accent={palette.accent} />
      <CafeTable x={890} cloth="#f6efe0" hem="#b4452f" accent={palette.accent} />
    </>
  );
};

/* ---------- party ---------- */

const Balloon = ({ x, y, color, r = 46 }: { x: number; y: number; color: string; r?: number }) => (
  <g>
    <path d={`M${x} ${y + r * 1.15} q-14 60 8 120`} stroke="#f6efe0" strokeWidth={3} fill="none" opacity={0.7} />
    <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={color} />
    <path d={`M${x - 8} ${y + r * 1.15} h16 l-8 10 Z`} fill={color} />
    <ellipse cx={x - r * 0.35} cy={y - r * 0.45} rx={r * 0.18} ry={r * 0.28} fill="#ffffff55" />
  </g>
);

const Bunting = ({ y, colors }: { y: number; colors: string[] }) => {
  const n = 12;
  const step = W / n;
  const sag = (i: number) => y + Math.sin((i / n) * Math.PI) * 50;
  return (
    <g>
      <path d={`M0 ${y} Q${W / 2} ${y + 100} ${W} ${y}`} stroke="#f6efe0" strokeWidth={4} fill="none" opacity={0.8} />
      {Array.from({ length: n }).map((_, i) => {
        const x = i * step + step / 2;
        const yy = sag(i + 0.5);
        return <path key={i} d={`M${x - 30} ${yy - 4} L${x + 30} ${yy - 4} L${x} ${yy + 56} Z`} fill={colors[i % colors.length]} />;
      })}
    </g>
  );
};

const Party = ({ palette }: { palette: Palette }) => {
  const colors = [palette.accent, "#c8553d", "#5b8c5a", "#4a7aa5", "#c86fa0"];
  const spots = [
    [120, 520, colors[1]], [300, 700, colors[2]], [470, 560, colors[3]], [650, 690, colors[4]], [820, 540, colors[0]],
    [960, 760, colors[2]], [210, 880, colors[0]], [560, 840, colors[1]], [880, 900, colors[3]], [380, 980, colors[4]],
  ] as const;
  return (
    <>
      <Room wall={shade(palette.wall, -0.1)} floor={palette.floor} />
      {/* пятна диско-света */}
      {spots.map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r={34 + (i % 3) * 10} fill={c} opacity={0.28} />)}
      {/* диско-шар */}
      <rect x={537} y={0} width={6} height={60} fill="#2b1d14" />
      <circle cx={540} cy={110} r={52} fill="#c9ccd4" />
      {[-30, -10, 10, 30].map((dy) => <rect key={dy} x={492} y={110 + dy - 3} width={96} height={6} fill="#9a9ea8" />)}
      <circle cx={522} cy={92} r={12} fill="#ffffff" />
      <path d="M520 160 L360 450 L460 450 Z" fill="#fff4cf" opacity={0.08} />
      <path d="M560 160 L720 450 L620 450 Z" fill="#fff4cf" opacity={0.08} />
      <Bunting y={440} colors={colors} />
      {/* связки шаров по углам */}
      <Balloon x={60} y={560} color={colors[1]} />
      <Balloon x={140} y={620} color={colors[0]} r={42} />
      <Balloon x={70} y={680} color={colors[3]} r={40} />
      <Balloon x={1020} y={560} color={colors[2]} />
      <Balloon x={940} y={620} color={colors[4]} r={42} />
      <Balloon x={1010} y={690} color={colors[0]} r={40} />
      <Counter accent={palette.accent} top={1010} />
      {/* торт и бокалы на стойке */}
      <rect x={760} y={940} width={130} height={70} rx={10} fill="#f6efe0" />
      <rect x={760} y={962} width={130} height={14} fill="#c86fa0" />
      {[790, 825, 860].map((x) => <rect key={x} x={x - 4} y={910} width={8} height={30} rx={3} fill={colors[(x / 5) % 5 | 0]} />)}
      {[200, 260].map((x) => (
        <g key={x} fill="#f6efe0aa">
          <path d={`M${x - 20} 930 h40 l-20 30 Z`} />
          <rect x={x - 3} y={958} width={6} height={44} />
          <rect x={x - 16} y={1000} width={32} height={8} rx={4} />
        </g>
      ))}
      {/* конфетти на полу */}
      {[[150, 1230, colors[0]], [420, 1260, colors[2]], [700, 1240, colors[1]], [930, 1270, colors[3]]].map(([x, y, c], i) => (
        <rect key={i} x={x as number} y={y as number} width={18} height={10} rx={2} fill={c as string} transform={`rotate(${i * 40} ${x} ${y})`} />
      ))}
    </>
  );
};

/* ---------- hotel ---------- */

const KeyBoard = ({ x, y, accent }: { x: number; y: number; accent: string }) => (
  <g>
    <rect x={x} y={y} width={300} height={220} rx={10} fill={WOOD_D} />
    <rect x={x + 12} y={y + 12} width={276} height={196} rx={6} fill={WOOD} />
    {Array.from({ length: 12 }).map((_, i) => {
      const cx = x + 50 + (i % 4) * 66;
      const cy = y + 40 + Math.floor(i / 4) * 62;
      const hasKey = i !== 5 && i !== 10;
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r={5} fill="#c9a24a" />
          {hasKey && (
            <>
              <rect x={cx - 3} y={cy} width={6} height={22} fill="#c9a24a" />
              <rect x={cx - 11} y={cy + 20} width={22} height={24} rx={5} fill={i % 3 ? accent : "#b4452f"} />
            </>
          )}
        </g>
      );
    })}
  </g>
);

const Hotel = ({ palette }: { palette: Palette }) => {
  const paper = shade(palette.wall, 0.18);
  return (
    <>
      <Room wall={paper} floor={palette.floor} />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={i * 90 + 30} y={0} width={30} height={FLOOR_Y} fill={shade(palette.wall, 0.24)} />
      ))}
      {/* бра */}
      {[90, 990].map((x) => (
        <g key={x}>
          <circle cx={x} cy={560} r={110} fill={palette.accent} opacity={0.12} />
          <rect x={x - 6} y={560} width={12} height={50} fill="#c9a24a" />
          <path d={`M${x - 40} 570 L${x + 40} 570 L${x + 28} 510 L${x - 28} 510 Z`} fill={palette.accent} />
        </g>
      ))}
      {/* часы трёх городов */}
      {[300, 400, 500].map((x) => (
        <g key={x}>
          <circle cx={x} cy={500} r={38} fill="#f4f1ea" />
          <circle cx={x} cy={500} r={38} fill="none" stroke="#c9a24a" strokeWidth={7} />
          <rect x={x - 3} y={474} width={6} height={28} rx={3} fill="#333" transform={`rotate(${(x - 300) * 1.3} ${x} 500)`} />
        </g>
      ))}
      <KeyBoard x={640} y={440} accent={palette.accent} />
      {/* стойка ресепшен */}
      <rect x={160} y={970} width={760} height={30} rx={8} fill={shade(WOOD_L, 0.1)} />
      <rect x={176} y={1000} width={728} height={FLOOR_Y - 1000} fill={WOOD} />
      <rect x={176} y={1040} width={728} height={18} fill={palette.accent} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={210 + i * 175} y={1080} width={140} height={80} rx={6} fill="#00000018" />)}
      {/* звонок и журнал */}
      <ellipse cx={760} cy={968} rx={40} ry={8} fill="#8a6a2a" />
      <path d="M726 966 a34 34 0 0 1 68 0 Z" fill="#c9a24a" />
      <circle cx={760} cy={928} r={7} fill="#c9a24a" />
      <rect x={330} y={952} width={150} height={18} rx={3} fill="#f6efe0" />
      <rect x={400} y={952} width={8} height={18} fill="#b4452f" />
      <Plant x={80} scale={1.1} pot={WOOD_D} />
      <Plant x={1000} scale={1.1} pot={WOOD_D} />
    </>
  );
};

export const Bar = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "restaurant" || variant === "cafe" ? (
      <Restaurant palette={palette} />
    ) : variant === "party" ? (
      <Party palette={palette} />
    ) : variant === "hotel" ? (
      <Hotel palette={palette} />
    ) : (
      <BaseBar palette={palette} />
    )}
  </Canvas>
);
