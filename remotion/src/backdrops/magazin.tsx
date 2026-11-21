import { Canvas, Room, Plant, FLOOR_Y, W, H, type BackdropProps, type Palette } from "./parts";
import { VShade, Glow, FloorTiles, FloorShadow, CeilingLamp, PotPlant, WallClock } from "./gostinaya";
import { Label } from "./ulitsa";
import { feetY } from "../world/depth";
import { useSign } from "../i18n/signs";

/**
 * Фон «magazin»: маленький магазин. Варианты (content/locations/magazin.json → bible.variants):
 * pharmacy, barbershop. Остальное — базовый магазин.
 *
 * Глубина: прилавок магазина и аптеки — передний слой (layer="front", content/locations/magazin.json → front.z = 0.8):
 * продавец / фармацевт за ним (метка counter, z 0.95) скрыт по пояс, покупатели (z 0.5) — перед ним. Низ прилавка —
 * на полу плана 0.8 (FRONT_FEET), верх — y 1015; surfaces.top — середина столешницы. Парикмахерская без переднего слоя.
 */

const FRONT_FEET = feetY(0.8);
const COUNTER_TOP = 1015;

/** Смешать цвет с белым (t>0) или чёрным (t<0). */
const shade = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t)));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

const WOOD = "#8a5a3a";
const WOOD_D = "#6b4429";
const WOOD_L = "#a8744a";
const TAG = "#fbf7ec";
const PRICES = ["49", "120", "75", "18", "230", "99", "64", "35"];

type Good = "box" | "jar" | "can" | "bottle";

/** Товар на полке, стоящий на линии base. */
const Item = ({ kind, x, base, color }: { kind: Good; x: number; base: number; color: string }) => {
  switch (kind) {
    case "box":
      return (
        <g>
          <rect x={x - 26} y={base - 84} width={52} height={84} rx={4} fill={color} />
          <rect x={x - 26} y={base - 60} width={52} height={22} fill="#ffffff40" />
        </g>
      );
    case "jar":
      return (
        <g>
          <rect x={x - 22} y={base - 56} width={44} height={56} rx={10} fill={color} />
          <rect x={x - 24} y={base - 68} width={48} height={14} rx={4} fill={shade(color, -0.3)} />
        </g>
      );
    case "can":
      return (
        <g>
          <rect x={x - 20} y={base - 64} width={40} height={64} rx={6} fill={color} />
          <rect x={x - 20} y={base - 44} width={40} height={20} fill="#ffffff55" />
        </g>
      );
    default:
      return (
        <g fill={color}>
          <rect x={x - 16} y={base - 72} width={32} height={72} rx={9} />
          <rect x={x - 6} y={base - 100} width={12} height={32} rx={4} />
        </g>
      );
  }
};

/** Полка: товары, доска, ценники без текста. */
const GoodsShelf = ({ x0, x1, y, colors, kinds, step = 64, board = WOOD_L, seed = 0 }: { x0: number; x1: number; y: number; colors: string[]; kinds: Good[]; step?: number; board?: string; seed?: number }) => {
  const n = Math.floor((x1 - x0 - 20) / step);
  const off = (x1 - x0 - n * step) / 2 + step / 2;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <Item key={i} kind={kinds[(i + seed) % kinds.length]} x={x0 + off + i * step} base={y} color={colors[(i * 2 + seed) % colors.length]} />
      ))}
      <rect x={x0} y={y} width={x1 - x0} height={20} rx={3} fill={board} />
      {Array.from({ length: Math.ceil(n / 2) }).map((_, i) => (
        <g key={i}>
          <rect x={x0 + off + i * step * 2 - 18} y={y + 3} width={36} height={20} rx={3} fill={TAG} />
          <text x={x0 + off + i * step * 2} y={y + 18} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={800} fontSize={13} fill="#c8553d">{PRICES[(i + seed) % PRICES.length]}</text>
        </g>
      ))}
    </g>
  );
};

/** Стеллаж: боковины + несколько полок. */
const Rack = ({ x0, x1, ys, colors, kinds, frame = WOOD_D, back, board, seed = 0 }: { x0: number; x1: number; ys: number[]; colors: string[]; kinds: Good[]; frame?: string; back: string; board?: string; seed?: number }) => (
  <g>
    <rect x={x0} y={ys[0] - 140} width={x1 - x0} height={FLOOR_Y - ys[0] + 140} fill={back} />
    {ys.map((y, i) => (
      <GoodsShelf key={y} x0={x0} x1={x1} y={y} colors={colors} kinds={kinds} board={board} seed={seed + i * 3} />
    ))}
    <rect x={x0 - 14} y={ys[0] - 150} width={14} height={FLOOR_Y - ys[0] + 150} fill={frame} />
    <rect x={x1} y={ys[0] - 150} width={14} height={FLOOR_Y - ys[0] + 150} fill={frame} />
    <rect x={x0 - 14} y={ys[0] - 164} width={x1 - x0 + 28} height={18} rx={4} fill={frame} />
  </g>
);

/** Кассовый аппарат. */
const Register = ({ x, top, accent }: { x: number; top: number; accent: string }) => (
  <g>
    <rect x={x} y={top - 70} width={150} height={70} rx={10} fill="#5d6870" />
    <rect x={x + 10} y={top - 28} width={130} height={20} rx={4} fill="#49535a" />
    <path d={`M${x + 16} ${top - 70} L${x + 30} ${top - 118} L${x + 120} ${top - 118} L${x + 134} ${top - 70} Z`} fill="#6f7a82" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={x + 40 + c * 20} y={top - 110 + r * 13} width={14} height={9} rx={2} fill={c === 3 && r === 2 ? accent : "#d9dde0"} />),
    )}
    <rect x={x + 40} y={top - 146} width={70} height={30} rx={6} fill="#49535a" />
    <rect x={x + 48} y={top - 140} width={54} height={18} rx={3} fill="#9fd4a8" />
  </g>
);

/** Прилавок (верх COUNTER_TOP, низ — на полу плана 0.8). */
const ShopCounter = ({ x0, x1, top = COUNTER_TOP, bottom = FRONT_FEET, body, topColor, stripe }: { x0: number; x1: number; top?: number; bottom?: number; body: string; topColor: string; stripe: string }) => (
  <g>
    <rect x={x0} y={bottom - 8} width={x1 - x0} height={16} rx={6} fill="#00000030" />
    <rect x={x0 + 14} y={top + 26} width={x1 - x0 - 28} height={bottom - top - 26} fill={body} />
    <rect x={x0 + 14} y={top + 26} width={x1 - x0 - 28} height={12} fill="#00000020" />
    <rect x={x0 + 14} y={top + 50} width={x1 - x0 - 28} height={16} fill={stripe} />
    <rect x={x0 + 14} y={bottom - 14} width={x1 - x0 - 28} height={14} fill="#00000028" />
    <rect x={x0} y={top} width={x1 - x0} height={26} rx={6} fill={topColor} />
  </g>
);

const SHOP_COLORS = ["#c8553d", "#d9a630", "#5b8c5a", "#4a7aa5", "#e08a5a", "#8a6a9a", "#e8dcc0"];

/** Весы с циферблатом. */
const Scales = ({ x, top }: { x: number; top: number }) => (
  <g>
    <rect x={x - 50} y={top - 20} width={100} height={20} rx={6} fill="#e6e2d8" />
    <rect x={x - 16} y={top - 70} width={32} height={52} fill="#d8d4c8" />
    <circle cx={x} cy={top - 96} r={36} fill="#e6e2d8" />
    <circle cx={x} cy={top - 96} r={28} fill="#fbf7ec" />
    <rect x={x - 2} y={top - 120} width={4} height={26} fill="#c8553d" transform={`rotate(35 ${x} ${top - 96})`} />
    <ellipse cx={x} cy={top - 132} rx={58} ry={10} fill="#c9ccd4" />
    <rect x={x - 4} y={top - 132} width={8} height={10} fill="#a9adb6" />
  </g>
);

/** Счёты. */
const Abacus = ({ x, top }: { x: number; top: number }) => (
  <g transform={`rotate(-8 ${x + 50} ${top - 30})`}>
    <rect x={x} y={top - 60} width={100} height={60} rx={4} fill={WOOD} />
    <rect x={x + 6} y={top - 54} width={88} height={48} fill="#e8dcc0" />
    {[0, 1, 2, 3, 4].map((r) => (
      <g key={r}>
        <rect x={x + 6} y={top - 50 + r * 10} width={88} height={2} fill="#8a7454" />
        {[0, 1, 2, 3].map((k) => <rect key={k} x={x + 10 + k * 10 + (r % 2) * 40} y={top - 53 + r * 10} width={8} height={8} rx={3} fill={k % 4 === 3 ? "#c8553d" : "#4a3020"} />)}
      </g>
    ))}
  </g>
);

/** Звезда-ярлык «Акция». */
const Starburst = ({ x, y, r = 50, color = "#e0402a", text }: { x: number; y: number; r?: number; color?: string; text: string }) => (
  <g transform={`rotate(-12 ${x} ${y})`}>
    <path d={Array.from({ length: 24 }).map((_, i) => { const a = (i * Math.PI) / 12; const rr = i % 2 ? r * 0.78 : r; return `${i ? "L" : "M"}${x + rr * Math.cos(a)} ${y + rr * Math.sin(a)}`; }).join(" ") + " Z"} fill={color} />
    <Label x={x} y={y + 6} text={text} size={r * 0.34} color="#fff6d8" maxW={r * 1.5} />
  </g>
);

const BaseShop = ({ palette }: { palette: Palette }) => {
  const t = useSign();
  return (
  <>
    <Room wall={palette.wall} floor={palette.floor} />
    <VShade y={0} h={700} from={0.12} to={0} />
    {/* навес-маркиза у потолка, лампы дневного света */}
    <rect x={0} y={0} width={W} height={60} fill={shade(palette.accent, -0.2)} />
    {Array.from({ length: 9 }).map((_, i) => (
      <path key={i} d={`M${i * 120} 60 h120 v40 a60 30 0 0 1 -120 0 Z`} fill={i % 2 ? "#f6efe0" : palette.accent} />
    ))}
    <CeilingLamp x={300} y={132} kind="tube" color="#d8d4c8" r={300} o={0.25} />
    <CeilingLamp x={800} y={132} kind="tube" color="#d8d4c8" r={300} o={0.25} />
    {/* пол — плитка */}
    <FloorTiles a={palette.floor} b={shade(palette.floor, 0.1)} step={104} d={0.09} grout={shade(palette.floor, -0.12)} />
    <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.28} />
    {/* стеллаж во всю заднюю стену, верхние полки выше голов */}
    <Rack x0={60} x1={1020} ys={[600, 790]} colors={SHOP_COLORS} kinds={["box", "jar", "can", "bottle", "box", "can"]} back={shade(palette.wall, -0.08)} />
    <rect x={46} y={806} width={988} height={FLOOR_Y - 806} fill={shade(palette.wall, -0.04)} />
    {/* нижние шкафчики и хлеб на нижней полке */}
    {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={66 + i * 160} y={1050} width={140} height={110} rx={6} fill={shade(palette.wall, -0.1)} />)}
    <rect x={46} y={1030} width={988} height={14} fill={WOOD_L} />
    {[290, 350, 410].map((x, i) => (
      <g key={x}>
        <ellipse cx={x} cy={1010} rx={36} ry={22} fill={i % 2 ? "#c8904a" : "#a8703a"} />
        {[-14, 0, 14].map((d) => <path key={d} d={`M${x + d - 6} 998 l10 -6`} stroke="#e8c088" strokeWidth={4} />)}
      </g>
    ))}
    <rect x={322} y={1030} width={58} height={22} rx={3} fill={TAG} />
    <Label x={351} y={1047} text={t("price-bread")} size={16} weight={800} color="#c8553d" spacing={0} maxW={54} />
    <Starburst x={1000} y={520} r={52} text={t("sale")} />
    {/* ящики с фруктами и капустой слева */}
    <FloorShadow cx={160} w={260} o={0.22} />
    <rect x={40} y={1060} width={230} height={130} rx={8} fill={WOOD} />
    <rect x={40} y={1100} width={230} height={12} fill={WOOD_D} />
    <rect x={40} y={1140} width={230} height={10} fill={WOOD_D} />
    {[80, 130, 180, 230, 105, 155, 205].map((x, i) => (
      <g key={i}>
        <circle cx={x} cy={i < 4 ? 1050 : 1020} r={26} fill={i % 2 ? "#d9a630" : "#c8553d"} />
        <circle cx={x - 8} cy={(i < 4 ? 1050 : 1020) - 10} r={6} fill="#ffffff" opacity={0.35} />
      </g>
    ))}
    <rect x={130} y={1130} width={60} height={30} rx={4} fill={TAG} />
    <Label x={160} y={1151} text={t("price-fruit")} size={17} weight={800} color="#c8553d" spacing={0} maxW={56} />
    {/* колбасы над хлебом */}
    <rect x={310} y={808} width={210} height={8} rx={4} fill="#8a8a8a" />
    {[[340, 110, "#a8503a"], [384, 130, "#8a3a2a"], [430, 96, "#c86a4a"], [480, 120, "#9a4a32"]].map(([x, h, c], i) => (
      <g key={i}>
        <rect x={(x as number) - 1} y={816} width={3} height={14} fill="#5a5048" />
        <rect x={(x as number) - 14} y={828} width={28} height={h as number} rx={14} fill={c as string} />
        <rect x={(x as number) - 14} y={850} width={28} height={4} fill="#f2e6d0" opacity={0.6} />
      </g>
    ))}
    {/* тень прилавка (сам прилавок — передний слой, ShopFront) */}
    <FloorShadow cx={740} y={FRONT_FEET - 6} w={660} o={0.25} />
  </>
  );
};

/** Передний слой магазина: прилавок от середины вправо (x 420…1060) с весами, счётами и кассой (продавец за ним — метка counter). */
const ShopFront = ({ palette }: { palette: Palette }) => (
  <>
    <ShopCounter x0={420} x1={1060} body={WOOD} topColor={WOOD_L} stripe={palette.accent} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={450 + i * 150} y={COUNTER_TOP + 90} width={130} height={FRONT_FEET - COUNTER_TOP - 120} rx={6} fill="#00000018" />)}
    <Scales x={670} top={COUNTER_TOP + 12} />
    <Abacus x={730} top={COUNTER_TOP + 14} />
    <Register x={900} top={COUNTER_TOP + 12} accent={palette.accent} />
  </>
);

/* ---------- pharmacy ---------- */

const GreenCross = ({ x, y, s = 1, color = "#3a9a5a" }: { x: number; y: number; s?: number; color?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Glow cx={0} cy={0} r={170} color={color} opacity={0.35} />
    <path d="M-25 -75 h50 v50 h50 v50 h-50 v50 h-50 v-50 h-50 v-50 h50 Z" fill={color} />
    <path d="M-17 -67 h34 v50 h50 v34 h-50 v50 h-34 v-50 h-50 v-34 h50 Z" fill={shade(color, 0.25)} />
  </g>
);

const Pharmacy = ({ palette }: { palette: Palette }) => {
  const green = "#3a9a5a";
  const wall = shade(palette.wall, 0.4);
  const meds = ["#ffffff", "#7ab8d9", "#3a9a5a", "#f2d27a", "#e89a8a", "#ffffff", "#b8d9c4"];
  return (
    <>
      <Room wall={wall} floor={shade(palette.floor, 0.25)} />
      <VShade y={0} h={700} from={0.1} to={0} />
      <rect x={0} y={0} width={W} height={70} fill={green} />
      <rect x={0} y={70} width={W} height={10} fill="#00000014" />
      <CeilingLamp x={300} y={100} kind="tube" color="#d8e0e0" r={300} o={0.25} />
      <CeilingLamp x={800} y={100} kind="tube" color="#d8e0e0" r={300} o={0.25} />
      <FloorTiles a={shade(palette.floor, 0.35)} b={shade(palette.floor, 0.45)} step={96} d={0.085} grout={shade(palette.floor, 0.2)} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.22} />
      <Rack x0={50} x1={500} ys={[620, 800]} colors={meds} kinds={["box", "bottle", "jar", "box"]} frame="#e8eef0" back="#dce8ea" board="#f6fafa" />
      <Rack x0={760} x1={1030} ys={[620, 800]} colors={meds} kinds={["jar", "box", "bottle"]} frame="#e8eef0" back="#dce8ea" board="#f6fafa" seed={2} />
      <GreenCross x={630} y={540} s={0.85} color={green} />
      {/* плакат «Мойте руки» */}
      <rect x={566} y={656} width={128} height={150} rx={4} fill="#ffffff" />
      <rect x={566} y={656} width={128} height={26} rx={4} fill={green} />
      <path d="M600 760 q-10 -40 6 -60 q6 -6 10 4 l2 -20 q4 -10 10 0 l2 20 l4 -24 q4 -10 10 0 l0 26 q10 -10 14 2 l-8 50 Z" fill="#f2c8a8" />
      {[612, 640, 668].map((x, i) => <circle key={x} cx={x} cy={712 + (i % 2) * 20} r={7} fill="#9fd0f0" />)}
      {[0, 1].map((i) => <rect key={i} x={580} y={776 + i * 12} width={100 - i * 30} height={5} fill="#9a968e" />)}
      {/* шкафчики с ящичками внизу */}
      <rect x={36} y={830} width={478} height={FLOOR_Y - 830} fill="#eef3f4" />
      <rect x={746} y={830} width={298} height={FLOOR_Y - 830} fill="#eef3f4" />
      {[[50, 470], [760, 270]].flatMap(([x0, w], k) =>
        Array.from({ length: Math.floor(w / 78) }).map((_, i) => (
          <g key={`${k}-${i}`}>
            <rect x={x0 + i * 78} y={850} width={70} height={60} rx={4} fill="#dfe8ea" />
            <rect x={x0 + i * 78 + 25} y={860} width={20} height={10} rx={3} fill="#fbfbf6" />
            <circle cx={x0 + i * 78 + 35} cy={892} r={5} fill="#b9c4c6" />
          </g>
        )),
      )}
      <FloorShadow cx={540} y={FRONT_FEET - 6} w={1100} o={0.18} />
    </>
  );
};

/**
 * Передний слой аптеки: белый прилавок во всю ширину и стеклянная перегородка над ним (полупрозрачная — фармацевт
 * за ней виден, метка counter x 0.68), касса справа, коробочки, блистер, ступка и цветок слева от фармацевта.
 */
const PharmacyFront = () => {
  const green = "#3a9a5a";
  const top = COUNTER_TOP;
  return (
    <>
      <ShopCounter x0={0} x1={W} body="#f6fafa" topColor="#dfe8ea" stripe={green} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={60 + i * 250} y={top + 90} width={210} height={FRONT_FEET - top - 120} rx={8} fill="#00000010" />)}
      {/* стекло с рамой: верхняя планка и стойки; окошко между стойками 280…800 */}
      <rect x={20} y={834} width={W - 40} height={top - 834} fill="#cfe6ee" opacity={0.28} />
      <rect x={20} y={826} width={W - 40} height={8} fill="#b9c4c6" />
      {[20, 280, 800, W - 26].map((x) => <rect key={x} x={x} y={826} width={6} height={top - 826} fill="#b9c4c6" />)}
      <path d={`M320 834 l60 0 l-170 ${top - 834} l-60 0 Z`} fill="#ffffff" opacity={0.18} />
      <path d={`M880 834 l30 0 l-90 ${top - 834} l-30 0 Z`} fill="#ffffff" opacity={0.15} />
      <Register x={880} top={top + 10} accent={green} />
      {/* коробочки, блистер, ступка, цветок */}
      <rect x={120} y={top - 40} width={70} height={50} rx={6} fill="#7ab8d9" />
      <rect x={120} y={top - 24} width={70} height={12} fill="#ffffff" />
      <rect x={210} y={top - 30} width={34} height={40} rx={8} fill="#e89a8a" />
      <rect x={206} y={top - 38} width={42} height={12} rx={4} fill="#ffffff" />
      <rect x={300} y={top - 12} width={60} height={22} rx={4} fill="#d8dde0" />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={312 + i * 12} cy={top - 1} r={4} fill="#ffffff" />)}
      <path d={`M420 ${top - 30} h70 q0 40 -35 40 q-35 0 -35 -40 Z`} fill="#e6e2d8" />
      <rect x={446} y={top - 80} width={14} height={60} rx={7} fill="#c9c4b8" transform={`rotate(20 453 ${top - 50})`} />
      <PotPlant x={570} y={top + 10} s={0.7} pot={green} />
    </>
  );
};

/* ---------- barbershop ---------- */

const BarberPole = ({ x, y, h = 340 }: { x: number; y: number; h?: number }) => {
  const w = 64;
  return (
    <g>
      <defs>
        <clipPath id="barber-pole-clip">
          <rect x={x - w / 2} y={y} width={w} height={h} rx={14} />
        </clipPath>
      </defs>
      <Glow cx={x} cy={y + h / 2} r={120} rx={110} ry={220} color="#fff1e0" opacity={0.4} />
      <rect x={x - w / 2 - 8} y={y - 30} width={w + 16} height={34} rx={12} fill="#c9ccd4" />
      <rect x={x - w / 2 - 8} y={y + h - 4} width={w + 16} height={34} rx={12} fill="#c9ccd4" />
      <g clipPath="url(#barber-pole-clip)">
        <rect x={x - w / 2} y={y} width={w} height={h} fill="#f6efe0" />
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={i} d={`M${x - w / 2} ${y + i * 70 - 60} l${w} -50 v26 l${-w} 50 Z`} fill={i % 2 ? "#4a6fa5" : "#c8553d"} />
        ))}
        <rect x={x - w / 2 + 8} y={y} width={10} height={h} fill="#ffffff" opacity={0.4} />
      </g>
    </g>
  );
};

const BarberChair = ({ x, accent }: { x: number; accent: string }) => (
  <g>
    <FloorShadow cx={x} w={220} o={0.25} />
    <ellipse cx={x} cy={FLOOR_Y - 6} rx={90} ry={14} fill="#9aa0a8" />
    <rect x={x - 16} y={1080} width={32} height={FLOOR_Y - 1086} fill="#9aa0a8" />
    {/* подлокотники, сиденье, спинка, подголовник */}
    <rect x={x - 100} y={1030} width={200} height={56} rx={22} fill={accent} />
    <rect x={x - 86} y={850} width={172} height={200} rx={34} fill={accent} />
    <rect x={x - 62} y={872} width={124} height={150} rx={24} fill={shade(accent, -0.12)} />
    {Array.from({ length: 3 }).map((_, i) => <rect key={i} x={x - 62} y={900 + i * 40} width={124} height={4} fill={shade(accent, -0.22)} />)}
    <rect x={x - 110} y={990} width={40} height={20} rx={8} fill="#c9ccd4" />
    <rect x={x + 70} y={990} width={40} height={20} rx={8} fill="#c9ccd4" />
    <rect x={x - 40} y={808} width={80} height={46} rx={20} fill={shade(accent, -0.2)} />
    <rect x={x - 70} y={1100} width={60} height={12} rx={6} fill="#9aa0a8" />
  </g>
);

/** Плакат с причёской. */
const StylePoster = ({ x, y, hair, suit }: { x: number; y: number; hair: "flat" | "side" | "pomp"; suit: string }) => (
  <g>
    <rect x={x + 5} y={y + 6} width={100} height={130} rx={4} fill="#00000020" />
    <rect x={x} y={y} width={100} height={130} rx={4} fill="#2b2b2b" />
    <rect x={x + 8} y={y + 8} width={84} height={114} fill="#e8dcc0" />
    <circle cx={x + 50} cy={y + 60} r={24} fill="#e8c8a8" />
    <rect x={x + 22} y={y + 92} width={56} height={30} rx={14} fill={suit} />
    {hair === "flat" && <rect x={x + 26} y={y + 30} width={48} height={18} rx={3} fill="#3a2a20" />}
    {hair === "side" && <path d={`M${x + 26} ${y + 56} q0 -30 26 -30 q24 0 24 26 q-20 -16 -50 4 Z`} fill="#5a3a20" />}
    {hair === "pomp" && <path d={`M${x + 26} ${y + 54} q-4 -40 36 -36 q18 2 14 28 q-26 -10 -50 8 Z`} fill="#2b2b2b" />}
  </g>
);

const Barbershop = ({ palette }: { palette: Palette }) => {
  const wall = "#e8ece6";
  return (
    <>
      <Room wall={wall} floor={palette.floor} />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={i * 96 + 20} y={0} width={40} height={880} fill="#e0e6de" />)}
      <VShade y={0} h={700} from={0.15} to={0} />
      <rect x={0} y={0} width={W} height={70} fill="#d6dcd4" />
      <rect x={0} y={70} width={W} height={10} fill={shade(palette.accent, 0.2)} />
      {/* пол — классическая шахматка */}
      <FloorTiles a={palette.floor} b={shade(palette.floor, 0.18)} step={96} d={0.085} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.28} />
      {/* плитка на стене снизу */}
      <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={shade(palette.accent, 0.55)} />
      {Array.from({ length: 4 }).flatMap((_, r) =>
        Array.from({ length: 14 }).map((__, c) => ((r + c) % 2 ? <rect key={`${r}-${c}`} x={c * 80} y={884 + r * 78} width={78} height={76} fill={shade(palette.accent, 0.68)} /> : null)),
      )}
      <rect x={0} y={870} width={W} height={12} fill={shade(palette.accent, 0.2)} />
      <rect x={0} y={FLOOR_Y - 24} width={W} height={24} fill={shade(palette.accent, -0.1)} />
      <CeilingLamp x={720} y={80} len={120} kind="dish" color="#f6efe0" r={320} o={0.3} />
      {/* плакаты с причёсками и часы */}
      <StylePoster x={220} y={450} hair="flat" suit="#4a6fa5" />
      <StylePoster x={340} y={450} hair="side" suit={palette.accent} />
      <WallClock x={470} y={800} r={36} frame="#2b2b2b" t={0.15} />
      {/* зеркало */}
      <rect x={536} y={448} width={380} height={460} rx={190} fill="#00000020" />
      <rect x={530} y={440} width={380} height={460} rx={190} fill={WOOD} />
      <rect x={548} y={458} width={344} height={424} rx={172} fill="#cfe2ea" />
      <path d="M600 560 l60 -60 h40 l-100 100 Z" fill="#ffffff70" />
      <path d="M600 640 l120 -120 h20 l-140 140 Z" fill="#ffffff50" />
      {/* полочка под зеркалом: флаконы, банка с синей жидкостью и расчёсками, машинка */}
      <rect x={520} y={930} width={400} height={18} rx={4} fill={WOOD_L} />
      {[["#4a6fa5", 560, 60], ["#d9a630", 600, 44], ["#5b8c5a", 860, 54]].map(([c, x, h]) => (
        <rect key={x as number} x={x as number} y={930 - (h as number)} width={28} height={h as number} rx={8} fill={c as string} />
      ))}
      <rect x={640} y={870} width={40} height={60} rx={6} fill="#7ac0e8" opacity={0.85} />
      {[648, 660, 670].map((x) => <rect key={x} x={x} y={846} width={5} height={60} fill="#2b2b2b" />)}
      <rect x={790} y={896} width={50} height={34} rx={10} fill="#5a5a5a" />
      <rect x={834} y={904} width={10} height={14} fill="#c9ccd4" />
      <path d="M800 930 q-20 30 10 60" stroke="#2b2b2b" strokeWidth={4} fill="none" />
      <rect x={884} y={884} width={6} height={30} fill="#333" />
      <BarberChair x={720} accent={palette.accent} />
      {/* состриженные волосы у кресла */}
      {[[640, 1206], [668, 1214], [770, 1210], [812, 1200], [700, 1222]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q8 -6 16 0 q8 6 16 0`} stroke="#4a3a2a" strokeWidth={3} fill="none" />
      ))}
      <BarberPole x={130} y={470} />
      {/* вешалка с полотенцами */}
      <rect x={250} y={640} width={160} height={14} rx={7} fill={WOOD_D} />
      {[270, 320, 370].map((x, i) => <rect key={x} x={x} y={652} width={34} height={90} rx={8} fill={i === 1 ? palette.accent : "#f6efe0"} />)}
      <Plant x={990} scale={1.05} pot={WOOD} />
    </>
  );
};

export const Magazin = ({ palette, variant, layer = "back" }: BackdropProps) => {
  if (layer === "front") {
    // прилавок есть у магазина и аптеки; парикмахерская без переднего слоя
    if (variant === "barbershop") return null;
    return <Canvas>{variant === "pharmacy" ? <PharmacyFront /> : <ShopFront palette={palette} />}</Canvas>;
  }
  return (
    <Canvas>
      {variant === "pharmacy" ? (
        <Pharmacy palette={palette} />
      ) : variant === "barbershop" ? (
        <Barbershop palette={palette} />
      ) : (
        <BaseShop palette={palette} />
      )}
    </Canvas>
  );
};
