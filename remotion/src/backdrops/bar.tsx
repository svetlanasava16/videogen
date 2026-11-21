import { Canvas, Room, Plant, FLOOR_Y, W, H, type BackdropProps, type Palette } from "./parts";
import { feetY, seatTopY } from "../world/depth";
import { SeatAt, VShade, Glow, FloorBoards, FloorTiles, FloorRug, FloorShadow, PhotoFrame, CeilingLamp } from "./gostinaya";

/**
 * Фон «bar»: уютный бар. Варианты (content/locations/bar.json → bible.variants):
 * restaurant / cafe, party, hotel. Остальное — базовый бар.
 * Сиденья под метки: бар — 4 табурета у стойки (stool-1…4); ресторан — два столика по два стула (chair-1…4);
 * банкет — 4 стула за столом-мебелью (chair-1…4, средний план); гостиница — кресло в холле (armchair).
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

/** Неоновая вывеска: светящаяся надпись с ореолом. */
const Neon = ({ x, y, text, color, size = 64 }: { x: number; y: number; text: string; color: string; size?: number }) => (
  <g>
    <Glow cx={x} cy={y - size * 0.35} r={size * 2.4} rx={size * text.length * 0.55} ry={size * 1.1} color={color} opacity={0.45} />
    <text x={x} y={y} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={900} fontSize={size} fill="none" stroke={color} strokeWidth={size * 0.16} strokeLinejoin="round" opacity={0.55}>{text}</text>
    <text x={x} y={y} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={900} fontSize={size} fill="none" stroke="#fff6e8" strokeWidth={size * 0.05} strokeLinejoin="round">{text}</text>
  </g>
);

/** Мишень для дартса. */
const Dartboard = ({ x, y, r = 70 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x + 5} cy={y + 6} r={r + 8} fill="#00000030" />
    <circle cx={x} cy={y} r={r + 8} fill="#2b2b2b" />
    {Array.from({ length: 12 }).map((_, i) => (
      <path key={i} d={`M${x} ${y} L${x + r * Math.cos((i * Math.PI) / 6)} ${y + r * Math.sin((i * Math.PI) / 6)} A${r} ${r} 0 0 1 ${x + r * Math.cos(((i + 1) * Math.PI) / 6)} ${y + r * Math.sin(((i + 1) * Math.PI) / 6)} Z`} fill={i % 2 ? "#e8dcc0" : "#2b2b2b"} />
    ))}
    <circle cx={x} cy={y} r={r * 0.62} fill="none" stroke="#b4452f" strokeWidth={8} />
    <circle cx={x} cy={y} r={r * 0.95} fill="none" stroke="#5b8c5a" strokeWidth={8} />
    <circle cx={x} cy={y} r={10} fill="#b4452f" />
    <path d={`M${x + 20} ${y - 14} l40 -26`} stroke="#c9a24a" strokeWidth={5} />
    <path d={`M${x + 56} ${y - 44} l12 -4 l-4 12 Z`} fill="#c8553d" />
  </g>
);

/** Грифельная доска с меню. */
const Chalkboard = ({ x, y, w = 170, h = 230 }: { x: number; y: number; w?: number; h?: number }) => (
  <g>
    <rect x={x + 6} y={y + 8} width={w} height={h} rx={6} fill="#00000030" />
    <rect x={x} y={y} width={w} height={h} rx={6} fill={WOOD_D} />
    <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} rx={3} fill="#2f3a34" />
    <text x={x + w / 2} y={y + 52} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={800} fontSize={30} fill="#f2efe6">МЕНЮ</text>
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <rect x={x + 26} y={y + 80 + i * 26} width={70 - (i % 2) * 16} height={5} rx={2} fill="#e8e4d8" opacity={0.8} />
        <rect x={x + w - 56} y={y + 80 + i * 26} width={30} height={5} rx={2} fill="#e0b030" opacity={0.9} />
      </g>
    ))}
  </g>
);

const BaseBar = ({ palette }: { palette: Palette }) => {
  const panel = shade(palette.wall, 0.08);
  return (
    <>
      <Room wall={palette.wall} floor={palette.floor} />
      {/* стена — тёмные доски, кирпич по краям */}
      {Array.from({ length: 14 }).map((_, i) => <rect key={i} x={i * 80} y={0} width={4} height={FLOOR_Y} fill={shade(palette.wall, -0.18)} />)}
      {Array.from({ length: 9 }).flatMap((_, r) =>
        [0, 1].map((c) => <rect key={`${r}-${c}`} x={c === 0 ? 6 + (r % 2) * 20 : 980 + (r % 2) * 20} y={460 + r * 46} width={64} height={36} rx={4} fill={shade(palette.wall, 0.12)} />),
      )}
      <VShade y={0} h={720} from={0.45} to={0} />
      {/* полки с бутылками на зеркальной задней стенке */}
      <rect x={210} y={450} width={660} height={430} rx={16} fill={shade(WOOD_D, -0.2)} />
      <rect x={226} y={466} width={628} height={398} rx={10} fill={shade(panel, 0.18)} />
      <Glow cx={540} cy={680} r={360} rx={360} ry={220} color={palette.accent} opacity={0.35} />
      <BottleShelf x0={226} x1={854} y={600} seed={0} />
      <BottleShelf x0={226} x1={854} y={820} seed={3} />
      {/* неон, дартс, меню */}
      <Neon x={110} y={560} text="ПИВО" color="#ff6a8a" size={50} />
      <path d="M80 600 h50 v70 q0 16 -16 16 h-18 q-16 0 -16 -16 Z" fill="none" stroke="#ffd36a" strokeWidth={6} />
      <path d="M130 616 q24 0 24 22 q0 22 -24 22" fill="none" stroke="#ffd36a" strokeWidth={6} />
      <Glow cx={110} cy={640} r={100} color="#ffd36a" opacity={0.3} />
      <Chalkboard x={30} y={700} w={160} h={220} />
      <Dartboard x={970} y={610} r={64} />
      <PhotoFrame x={900} y={720} w={74} h={90} frame="#2b1d14" kind="portrait" tone="#c9b890" />
      <PhotoFrame x={986} y={736} w={70} h={80} frame="#c9a24a" kind="landscape" />
      <CeilingLamp x={250} y={0} len={70} kind="dish" color={palette.accent} glow={palette.accent} r={260} o={0.35} />
      <CeilingLamp x={830} y={0} len={70} kind="dish" color={palette.accent} glow={palette.accent} r={260} o={0.35} />
      {/* пол: тёмные доски */}
      <FloorBoards color={palette.floor} step={70} t={0.25} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.35} />
      <Glow cx={540} cy={FLOOR_Y + 30} r={500} rx={560} ry={80} color={palette.accent} opacity={0.18} />
      <Counter accent={palette.accent} />
      {/* латунная подножка, подставки, стаканы на стойке */}
      <rect x={0} y={FLOOR_Y - 70} width={W} height={10} rx={5} fill="#c9a24a" />
      {[120, 380, 640, 900].map((x) => <rect key={x} x={x} y={FLOOR_Y - 70} width={8} height={70} fill="#a8823a" />)}
      <Taps x={760} accent={palette.accent} />
      <Mug x={330} />
      <rect x={160} y={960} width={70} height={14} rx={3} fill="#b4452f" />
      <path d="M180 960 h30 l-4 -46 h-22 Z" fill="#e8dcc099" />
      <ellipse cx={560} cy={968} rx={40} ry={9} fill="#d9d4c8" />
      {[540, 556, 572, 548, 566].map((x, i) => <circle key={i} cx={x} cy={962 - (i > 2 ? 8 : 0)} r={6} fill="#c8963d" />)}
      <rect x={900} y={936} width={44} height={40} rx={6} fill="#c9ccd4" />
      {[908, 918, 928].map((x) => <rect key={x} x={x} y={926} width={4} height={14} fill="#f6efe0" />)}
      {[0.12, 0.3, 0.7, 0.88].map((x) => (
        <SeatAt key={x} x={x} z={1} kind="bar-stool" color="#b4452f" />
      ))}
    </>
  );
};

/* ---------- restaurant / cafe ---------- */

/** Столик на одной ножке, по стулу слева и справа (метки на x ± 150 px, дальний план). */
const CafeTable = ({ x, cloth, hem, accent }: { x: number; cloth: string; hem: string; accent: string }) => {
  const top = 1040;
  return (
    <g>
      {[-150, 150].map((dx) => (
        <SeatAt key={dx} x={(x + dx) / W} z={1} kind="chair" color={WOOD_D} pad={shade(accent, -0.1)} back={190} />
      ))}
      <rect x={x - 6} y={top} width={12} height={FLOOR_Y - top} fill="#2b1d14" />
      <ellipse cx={x} cy={FLOOR_Y - 4} rx={44} ry={9} fill="#2b1d14" />
      <path d={`M${x - 84} ${top} L${x + 84} ${top} L${x + 96} ${top + 84} L${x - 96} ${top + 84} Z`} fill={cloth} />
      <rect x={x - 96} y={top + 72} width={192} height={14} rx={4} fill={hem} />
      {/* вазочка с цветком и свеча */}
      <rect x={x - 40} y={top - 40} width={22} height={40} rx={9} fill={shade(accent, -0.1)} />
      <rect x={x - 31} y={top - 82} width={4} height={44} fill="#5b8c5a" />
      <circle cx={x - 29} cy={top - 88} r={13} fill="#c8553d" />
      <Glow cx={x + 27} cy={top - 46} r={70} color="#ffd98a" opacity={0.5} />
      <rect x={x + 20} y={top - 36} width={14} height={36} rx={4} fill="#f6efe0" />
      <ellipse cx={x + 27} cy={top - 46} rx={6} ry={11} fill={accent} />
    </g>
  );
};

const Restaurant = ({ palette }: { palette: Palette }) => {
  const wall = shade(palette.wall, 0.12);
  const motif = shade(palette.wall, 0.2);
  const gold = "#c9a24a";
  return (
    <>
      <Room wall={wall} floor={palette.floor} />
      {/* обои с дамасским узором */}
      {Array.from({ length: 7 }).flatMap((_, r) =>
        Array.from({ length: 9 }).map((__, c) => {
          const x = c * 130 + (r % 2) * 65;
          const y = 470 + r * 70;
          if (y > 850) return null;
          return <path key={`${r}-${c}`} d={`M${x} ${y - 20} q14 14 0 34 q-14 -20 0 -34 Z M${x - 16} ${y + 2} q16 -2 16 12 q-16 4 -16 -12 Z M${x + 16} ${y + 2} q-16 -2 -16 12 q16 4 16 -12 Z`} fill={motif} />;
        }),
      )}
      <VShade y={0} h={700} from={0.4} to={0} />
      <rect x={0} y={0} width={W} height={60} fill={shade(palette.wall, -0.25)} />
      <rect x={0} y={60} width={W} height={12} fill={gold} opacity={0.5} />
      {/* обшивка низа стены с филёнками */}
      <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={WOOD_D} />
      <rect x={0} y={866} width={W} height={16} fill={WOOD_L} />
      {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={20 + i * 155} y={910} width={125} height={FLOOR_Y - 960} rx={4} fill={shade(WOOD_D, -0.12)} />)}
      {/* пол — паркет квадратами */}
      <FloorTiles a={palette.floor} b={shade(palette.floor, 0.08)} step={90} d={0.08} grout={shade(palette.floor, -0.25)} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.35} />
      {/* окно с вечерним городом в центре, ламбрекен и портьеры */}
      <rect x={350} y={440} width={380} height={340} rx={190} fill={shade(palette.wall, 0.35)} />
      <rect x={366} y={456} width={348} height={308} rx={174} fill="#2b3a55" />
      <path d="M366 764 v-80 h60 v-40 h50 v60 h60 v-90 h70 v70 h50 v-30 h58 v110 Z" fill="#1e2a40" />
      {[400, 446, 520, 560, 600, 660, 690].map((x, i) => <rect key={x} x={x} y={700 - (i % 3) * 30} width={12} height={12} fill={i % 2 ? palette.accent : "#f5d77a"} opacity={0.85} />)}
      <Glow cx={630} cy={540} r={70} color="#f5e6a8" opacity={0.4} />
      <circle cx={630} cy={540} r={22} fill="#f5e6a8" />
      <rect x={530} y={456} width={20} height={308} fill={shade(palette.wall, 0.35)} />
      <rect x={340} y={772} width={400} height={18} rx={5} fill={WOOD_L} />
      <path d="M320 430 Q540 520 760 430 L760 470 Q540 560 320 470 Z" fill={shade(palette.accent, -0.35)} />
      {[360, 450, 540, 630, 720].map((x) => <circle key={x} cx={x} cy={488 + Math.sin(((x - 320) / 440) * Math.PI) * 44} r={8} fill={gold} />)}
      <path d="M310 440 h70 q-30 160 10 300 q20 40 -10 80 h-70 Z" fill={shade(palette.accent, -0.3)} />
      <path d="M770 440 h-70 q30 160 -10 300 q-20 40 10 80 h70 Z" fill={shade(palette.accent, -0.3)} />
      <rect x={330} y={700} width={40} height={14} rx={7} fill={gold} />
      <rect x={710} y={700} width={40} height={14} rx={7} fill={gold} />
      {/* картины в золочёных рамах и бра */}
      {[100, 830].map((x, i) => (
        <g key={x}>
          <rect x={x - 10} y={470} width={170} height={210} rx={8} fill={gold} />
          <rect x={x} y={480} width={150} height={190} rx={6} fill={shade(gold, -0.25)} />
          <rect x={x + 14} y={494} width={122} height={162} fill="#f2e6d0" />
          {i === 0 ? (
            <>
              <rect x={x + 14} y={600} width={122} height={56} fill="#c9b890" />
              <ellipse cx={x + 75} cy={610} rx={40} ry={10} fill="#ffffff" />
              <rect x={x + 60} y={560} width={30} height={50} rx={6} fill="#5b2a3a" />
              <rect x={x + 70} y={530} width={10} height={34} fill="#5b2a3a" />
              <circle cx={x + 45} cy={600} r={14} fill="#c8553d" />
            </>
          ) : (
            <path d={`M${x + 30} 640 l40 -70 l30 40 l20 -24 l18 54 Z`} fill="#5b8c5a" />
          )}
        </g>
      ))}
      {[290, 790].map((x) => (
        <g key={x}>
          <Glow cx={x} cy={560} r={110} color="#ffd98a" opacity={0.4} />
          <rect x={x - 4} y={560} width={8} height={44} fill={gold} />
          <path d={`M${x - 22} 566 L${x + 22} 566 L${x + 14} 530 L${x - 14} 530 Z`} fill="#f6e6c0" />
        </g>
      ))}
      <CeilingLamp x={270} y={72} len={40} kind="dish" color={palette.accent} glow="#ffd98a" r={280} o={0.3} />
      <CeilingLamp x={810} y={72} len={40} kind="dish" color={palette.accent} glow="#ffd98a" r={280} o={0.3} />
      <FloorShadow cx={270} w={420} o={0.3} />
      <FloorShadow cx={810} w={420} o={0.3} />
      <CafeTable x={270} cloth="#f6efe0" hem="#b4452f" accent={palette.accent} />
      <CafeTable x={810} cloth="#f6efe0" hem="#b4452f" accent={palette.accent} />
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

/** Длинный банкетный стол со скатертью и фестонами (свадьба, юбилей): позади кукол, верх ~FLOOR_Y-195. */
const BanquetTable = ({ colors }: { colors: string[] }) => {
  const top = FLOOR_Y - 195;
  const front = FLOOR_Y - 40;
  const x0 = 40;
  const x1 = W - 40;
  const cloth = "#f6efe0";
  const n = 8;
  const seg = (x1 - x0) / n;
  return (
    <g>
      <ellipse cx={W / 2} cy={front + 6} rx={(x1 - x0) / 2 + 20} ry={16} fill="#00000040" />
      <rect x={x0} y={top} width={x1 - x0} height={34} rx={10} fill={shade(cloth, 0.4)} />
      <rect x={x0} y={top + 28} width={x1 - x0} height={front - top - 28} fill={cloth} />
      {Array.from({ length: n * 2 }).map((_, i) => (
        <rect key={i} x={x0 + (i + 0.5) * (seg / 2) - 4} y={top + 34} width={8} height={front - top - 34} fill="#00000010" />
      ))}
      {/* фестоны и банты */}
      {Array.from({ length: n }).map((_, i) => {
        const a = x0 + i * seg;
        return (
          <g key={i}>
            <path d={`M${a} ${top + 34} Q${a + seg / 2} ${top + 110} ${a + seg} ${top + 34}`} stroke={colors[i % 2 ? 4 : 0]} strokeWidth={14} fill="none" />
            <circle cx={a} cy={top + 38} r={12} fill={colors[1]} />
          </g>
        );
      })}
      <circle cx={x1} cy={top + 38} r={12} fill={colors[1]} />
      {/* тарелки и бокалы */}
      {[130, 260, 380, 700, 820, 950].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy={top + 10} rx={40} ry={10} fill="#ffffff" stroke="#d8d0c0" strokeWidth={4} />
          <g fill="#f6efe0cc">
            <path d={`M${x + 34 - (i % 2) * 74} ${top - 50} h30 l-15 26 Z`} />
            <rect x={x + 47 - (i % 2) * 74} y={top - 26} width={4} height={30} />
          </g>
        </g>
      ))}
      {/* шампанское в ведёрке и букет */}
      <path d={`M300 ${top + 4} L306 ${top - 50} L354 ${top - 50} L360 ${top + 4} Z`} fill="#c9ccd4" />
      <rect x={322} y={top - 120} width={20} height={76} rx={8} fill="#2f5a3a" />
      <rect x={322} y={top - 122} width={20} height={18} rx={5} fill="#e0b030" />
      <rect x={760} y={top - 40} width={30} height={44} rx={8} fill="#cfe2ea" />
      {[[760, -70, colors[1]], [790, -78, colors[4]], [775, -96, colors[0]], [748, -92, "#ffffff"], [802, -100, "#ffffff"]].map(([x, dy, c], i) => (
        <circle key={i} cx={x as number} cy={top + (dy as number)} r={18} fill={c as string} />
      ))}
      {/* свадебный торт: три яруса, чуть правее центра */}
      <ellipse cx={630} cy={top + 4} rx={96} ry={12} fill="#ffffff" />
      <rect x={560} y={top - 70} width={140} height={72} rx={10} fill={cloth} />
      <rect x={580} y={top - 130} width={100} height={62} rx={10} fill={cloth} />
      <rect x={602} y={top - 178} width={56} height={50} rx={10} fill={cloth} />
      <rect x={560} y={top - 46} width={140} height={12} fill={colors[4]} />
      <rect x={580} y={top - 104} width={100} height={10} fill={colors[4]} />
      <circle cx={630} cy={top - 190} r={14} fill={colors[1]} />
    </g>
  );
};

/** Колонка-динамик. */
const Speaker = ({ x, w = 90, h = 300 }: { x: number; w?: number; h?: number }) => (
  <g>
    <FloorShadow cx={x + w / 2} w={w + 20} o={0.35} />
    <rect x={x} y={FLOOR_Y - h} width={w} height={h} rx={8} fill="#232027" />
    <circle cx={x + w / 2} cy={FLOOR_Y - h * 0.72} r={w * 0.2} fill="#3a3640" />
    <circle cx={x + w / 2} cy={FLOOR_Y - h * 0.72} r={w * 0.08} fill="#141218" />
    <circle cx={x + w / 2} cy={FLOOR_Y - h * 0.32} r={w * 0.34} fill="#3a3640" />
    <circle cx={x + w / 2} cy={FLOOR_Y - h * 0.32} r={w * 0.14} fill="#141218" />
  </g>
);

/** Подарочная коробка с бантом. */
const Gift = ({ x, y, w, h, color, ribbon }: { x: number; y: number; w: number; h: number; color: string; ribbon: string }) => (
  <g>
    <rect x={x} y={y - h} width={w} height={h} rx={4} fill={color} />
    <rect x={x - 4} y={y - h} width={w + 8} height={h * 0.25} rx={4} fill={shade(color, 0.12)} />
    <rect x={x + w / 2 - 6} y={y - h} width={12} height={h} fill={ribbon} />
    <path d={`M${x + w / 2} ${y - h} q-24 -26 -30 -4 q4 10 30 4 q26 6 30 -4 q-6 -22 -30 4 Z`} fill={ribbon} />
  </g>
);

const Party = ({ palette }: { palette: Palette }) => {
  const colors = [palette.accent, "#c8553d", "#5b8c5a", "#4a7aa5", "#c86fa0"];
  const spots = [
    [120, 520, colors[1]], [300, 700, colors[2]], [470, 560, colors[3]], [650, 690, colors[4]], [820, 540, colors[0]],
    [960, 760, colors[2]], [210, 880, colors[0]], [560, 840, colors[1]], [880, 900, colors[3]], [380, 980, colors[4]],
  ] as const;
  const wall = shade(palette.wall, -0.1);
  return (
    <>
      <Room wall={wall} floor={palette.floor} />
      {/* обшивка стены вертикальными панелями */}
      {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 120 + 60} y={0} width={6} height={FLOOR_Y} fill={shade(wall, -0.18)} />)}
      <VShade y={0} h={720} from={0.5} to={0} />
      {/* лучи прожекторов и пятна диско-света */}
      {[[100, colors[4], 260], [980, colors[3], 800], [540, colors[0], 420]].map(([x, c, tx], i) => (
        <path key={i} d={`M${x as number} 60 L${(tx as number) - 90} ${FLOOR_Y} L${(tx as number) + 90} ${FLOOR_Y} Z`} fill={c as string} opacity={0.08} />
      ))}
      {spots.map(([x, y, c], i) => <Glow key={i} cx={x} cy={y} r={60 + (i % 3) * 14} color={c} opacity={0.55} />)}
      <rect x={0} y={0} width={W} height={60} fill={shade(wall, -0.3)} />
      {[100, 980].map((x) => <path key={x} d={`M${x - 26} 40 h52 l-10 40 h-32 Z`} fill="#3a3640" />)}
      {/* диско-шар */}
      <rect x={537} y={0} width={6} height={60} fill="#2b1d14" />
      <Glow cx={540} cy={110} r={140} color="#ffffff" opacity={0.35} />
      <circle cx={540} cy={110} r={52} fill="#c9ccd4" />
      {[-30, -10, 10, 30].map((dy) => <rect key={dy} x={492} y={110 + dy - 3} width={96} height={6} fill="#9a9ea8" />)}
      {[-30, -10, 10, 30].map((dx) => <rect key={`v${dx}`} x={540 + dx - 2} y={62} width={4} height={96} fill="#9a9ea8" opacity={0.7} />)}
      <circle cx={522} cy={92} r={12} fill="#ffffff" />
      <path d="M520 160 L360 450 L460 450 Z" fill="#fff4cf" opacity={0.08} />
      <path d="M560 160 L720 450 L620 450 Z" fill="#fff4cf" opacity={0.08} />
      {/* серпантин с потолка */}
      {[200, 330, 760, 890].map((x, i) => (
        <path key={x} d={`M${x} 60 q20 30 0 60 q-20 30 0 60 q20 30 0 60 q-20 30 0 60`} stroke={colors[(i + 1) % colors.length]} strokeWidth={6} fill="none" />
      ))}
      <Bunting y={440} colors={colors} />
      <g transform="translate(0 110)">
        <Bunting y={440} colors={[colors[3], colors[0], colors[4], colors[2], colors[1]]} />
      </g>
      {/* связки шаров по углам */}
      <Balloon x={60} y={560} color={colors[1]} />
      <Balloon x={140} y={620} color={colors[0]} r={42} />
      <Balloon x={70} y={680} color={colors[3]} r={40} />
      <Balloon x={1020} y={560} color={colors[2]} />
      <Balloon x={940} y={620} color={colors[4]} r={42} />
      <Balloon x={1010} y={690} color={colors[0]} r={40} />
      {/* танцпол: плитка с цветными отсветами */}
      <FloorTiles a={palette.floor} b={shade(palette.floor, 0.08)} step={110} d={0.09} grout={shade(palette.floor, -0.3)} />
      {[[300, 1300, colors[4]], [760, 1260, colors[3]], [540, 1480, colors[0]], [180, 1600, colors[2]], [900, 1560, colors[1]]].map(([x, y, c], i) => (
        <Glow key={i} cx={x as number} cy={y as number} r={150} rx={190} ry={60} color={c as string} opacity={0.3} />
      ))}
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.3} />
      {/* колонки по углам, подарки на левой */}
      <Speaker x={-10} w={80} h={320} />
      <Speaker x={1010} w={80} h={320} />
      <Gift x={0} y={FLOOR_Y - 320} w={60} h={50} color={colors[3]} ribbon="#e0b030" />
      <Gift x={14} y={FLOOR_Y - 370} w={36} h={30} color={colors[1]} ribbon="#f6efe0" />
      {/* банкетный стол — мебель варианта перед куклами (locations/bar.json → set); за ним 4 стула на среднем плане */}
      {[0.2, 0.4, 0.6, 0.8].map((x) => (
        <SeatAt key={x} x={x} z={0.5} kind="chair" color={shade(palette.wall, -0.35)} pad={palette.accent} back={190} />
      ))}
      {/* бантики на спинках */}
      {[0.2, 0.4, 0.6, 0.8].map((x, i) => (
        <path key={x} d={`M${x * W} ${seatTopY(0.5) - 160} l-26 -14 v28 Z M${x * W} ${seatTopY(0.5) - 160} l26 -14 v28 Z`} fill={colors[(i + 1) % colors.length]} />
      ))}
      {/* конфетти на полу */}
      {[[150, 1230, colors[0]], [420, 1260, colors[2]], [700, 1240, colors[1]], [930, 1270, colors[3]], [260, 1215, colors[4]], [830, 1215, colors[0]], [560, 1222, colors[3]]].map(([x, y, c], i) => (
        <rect key={i} x={x as number} y={y as number} width={18} height={10} rx={2} fill={c as string} transform={`rotate(${i * 40} ${x} ${y})`} />
      ))}
    </>
  );
};

/* ---------- hotel ---------- */

const KeyBoard = ({ x, y, accent }: { x: number; y: number; accent: string }) => (
  <g>
    <rect x={x + 8} y={y + 10} width={300} height={220} rx={10} fill="#00000025" />
    <rect x={x} y={y} width={300} height={220} rx={10} fill={WOOD_D} />
    <rect x={x + 12} y={y + 12} width={276} height={196} rx={6} fill={WOOD} />
    {Array.from({ length: 12 }).map((_, i) => {
      const cx = x + 50 + (i % 4) * 66;
      const cy = y + 40 + Math.floor(i / 4) * 62;
      const hasKey = i !== 5 && i !== 10;
      return (
        <g key={i}>
          <rect x={cx - 26} y={cy - 20} width={52} height={58} rx={3} fill={shade(WOOD, -0.08)} />
          <circle cx={cx} cy={cy} r={5} fill="#c9a24a" />
          {hasKey && (
            <>
              <rect x={cx - 3} y={cy} width={6} height={22} fill="#c9a24a" />
              <rect x={cx - 11} y={cy + 20} width={22} height={24} rx={5} fill={i % 3 ? accent : "#b4452f"} />
            </>
          )}
          {i === 7 && <rect x={cx - 14} y={cy + 4} width={28} height={18} fill="#f6efe0" transform={`rotate(-8 ${cx} ${cy + 13})`} />}
        </g>
      );
    })}
  </g>
);

const Hotel = ({ palette }: { palette: Palette }) => {
  const paper = shade(palette.wall, 0.18);
  const gold = "#c9a24a";
  return (
    <>
      <Room wall={paper} floor={palette.floor} />
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i}>
          <rect x={i * 90 + 30} y={0} width={30} height={FLOOR_Y} fill={shade(palette.wall, 0.24)} />
          <rect x={i * 90 + 44} y={0} width={2} height={FLOOR_Y} fill={shade(palette.wall, 0.08)} />
        </g>
      ))}
      <VShade y={0} h={700} from={0.3} to={0} />
      <rect x={0} y={0} width={W} height={70} fill={shade(palette.wall, 0.35)} />
      <rect x={0} y={70} width={W} height={10} fill={gold} opacity={0.6} />
      {/* низ стены — мраморная панель */}
      <rect x={0} y={900} width={W} height={FLOOR_Y - 900} fill={shade(palette.wall, -0.15)} />
      <rect x={0} y={892} width={W} height={12} fill={gold} />
      {[[120, 960], [420, 1050], [780, 980], [980, 1100]].map(([x, y], i) => <path key={i} d={`M${x} ${y} q40 20 60 -10 q30 -20 70 10`} stroke={shade(palette.wall, -0.05)} strokeWidth={4} fill="none" />)}
      {/* пол — мраморная шахматка и дорожка к стойке */}
      <FloorTiles a={shade(palette.floor, 0.15)} b={shade(palette.floor, 0.3)} step={120} d={0.1} />
      <FloorRug x0={390} x1={690} y0={1196} y1={H} color="#6e2c2c" border="#4c1f1f" inner="#7a3430" fringe={gold} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.3} />
      <CeilingLamp x={540} y={80} len={60} kind="arms" color="#f6e6c0" r={420} o={0.3} />
      {/* бра */}
      {[90, 990].map((x) => (
        <g key={x}>
          <Glow cx={x} cy={560} r={130} color={palette.accent} opacity={0.4} />
          <rect x={x - 6} y={560} width={12} height={50} fill={gold} />
          <path d={`M${x - 40} 570 L${x + 40} 570 L${x + 28} 510 L${x - 28} 510 Z`} fill={palette.accent} />
        </g>
      ))}
      {/* часы трёх городов с табличками */}
      {[300, 400, 500].map((x, i) => (
        <g key={x}>
          <circle cx={x + 3} cy={504} r={38} fill="#00000020" />
          <circle cx={x} cy={500} r={38} fill="#f4f1ea" />
          <circle cx={x} cy={500} r={38} fill="none" stroke={gold} strokeWidth={7} />
          <rect x={x - 3} y={474} width={6} height={28} rx={3} fill="#333" transform={`rotate(${(x - 300) * 1.3} ${x} 500)`} />
          <rect x={x - 2} y={468} width={4} height={34} rx={2} fill="#333" transform={`rotate(${i * 130 + 40} ${x} 500)`} />
          <rect x={x - 34} y={550} width={68} height={18} rx={3} fill={gold} />
          <rect x={x - 24} y={557} width={48} height={4} fill={shade(gold, -0.4)} />
        </g>
      ))}
      <PhotoFrame x={300} y={610} w={200} h={150} frame={gold} kind="landscape" tone="#bcd4e0" />
      <KeyBoard x={640} y={440} accent={palette.accent} />
      {/* звёзды над стойкой */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${740 + i * 50} 690 l8 18 l20 2 l-15 13 l5 20 l-18 -11 l-18 11 l5 -20 l-15 -13 l20 -2 Z`} fill={gold} />
      ))}
      {/* стойка ресепшен: лампа, монитор, звонок, журнал, буклеты */}
      <FloorShadow cx={540} w={780} o={0.3} />
      <rect x={160} y={970} width={760} height={30} rx={8} fill={shade(WOOD_L, 0.1)} />
      <rect x={176} y={1000} width={728} height={FLOOR_Y - 1000} fill={WOOD} />
      <rect x={176} y={1040} width={728} height={18} fill={palette.accent} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={210 + i * 175} y={1080} width={140} height={80} rx={6} fill="#00000018" />)}
      <text x={540} y={1130} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={800} fontSize={30} letterSpacing={6} fill={gold}>РЕСЕПШН</text>
      <Glow cx={240} cy={930} r={90} color="#ffe9a8" opacity={0.45} />
      <rect x={236} y={920} width={8} height={50} fill={gold} />
      <ellipse cx={240} cy={968} rx={30} ry={6} fill={gold} />
      <path d="M200 932 q40 -40 80 0 Z" fill="#2f6a4a" />
      <rect x={560} y={890} width={100} height={70} rx={8} fill="#d8d4c8" />
      <rect x={570} y={898} width={80} height={52} rx={4} fill="#4a6a8a" />
      <rect x={596} y={960} width={28} height={12} fill="#b8b4a8" />
      <ellipse cx={760} cy={968} rx={40} ry={8} fill="#8a6a2a" />
      <path d="M726 966 a34 34 0 0 1 68 0 Z" fill={gold} />
      <circle cx={760} cy={928} r={7} fill={gold} />
      <rect x={330} y={952} width={150} height={18} rx={3} fill="#f6efe0" />
      <rect x={400} y={952} width={8} height={18} fill="#b4452f" />
      <rect x={850} y={924} width={50} height={46} rx={3} fill={gold} />
      {[0, 1, 2].map((i) => <rect key={i} x={856 + i * 14} y={914 - (i % 2) * 6} width={12} height={40} rx={2} fill={["#4a7aa5", "#c8553d", "#5b8c5a"][i]} />)}
      <Plant x={80} scale={1.1} pot={WOOD_D} />
      <Plant x={1000} scale={1.1} pot={WOOD_D} />
      {/* кресло для гостей в холле (метка armchair, средний план) */}
      <FloorShadow cx={0.86 * W} y={feetY(0.5)} w={230} o={0.25} />
      <SeatAt x={0.86} z={0.5} kind="armchair" color={palette.accent} />
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
