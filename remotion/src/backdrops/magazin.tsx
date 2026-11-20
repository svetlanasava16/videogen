import { Canvas, Room, Plant, FLOOR_Y, W, type BackdropProps, type Palette } from "./parts";

/**
 * Фон «magazin»: маленький магазин. Варианты (content/locations/magazin.json → bible.variants):
 * pharmacy, barbershop. Остальное — базовый магазин.
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
const TAG = "#fbf7ec";

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
        <rect key={i} x={x0 + off + i * step * 2 - 16} y={y + 4} width={32} height={18} rx={3} fill={TAG} />
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

/** Прилавок справа (верх ~y 985). */
const ShopCounter = ({ x0, x1, top = 985, body, topColor, stripe }: { x0: number; x1: number; top?: number; body: string; topColor: string; stripe: string }) => (
  <g>
    <rect x={x0} y={top} width={x1 - x0} height={26} rx={6} fill={topColor} />
    <rect x={x0 + 14} y={top + 26} width={x1 - x0 - 28} height={FLOOR_Y - top - 26} fill={body} />
    <rect x={x0 + 14} y={top + 50} width={x1 - x0 - 28} height={16} fill={stripe} />
  </g>
);

const SHOP_COLORS = ["#c8553d", "#d9a630", "#5b8c5a", "#4a7aa5", "#e08a5a", "#8a6a9a", "#e8dcc0"];

const BaseShop = ({ palette }: { palette: Palette }) => (
  <>
    <Room wall={palette.wall} floor={palette.floor} />
    {/* навес-маркиза у потолка */}
    <rect x={0} y={0} width={W} height={60} fill={shade(palette.accent, -0.2)} />
    {Array.from({ length: 9 }).map((_, i) => (
      <path key={i} d={`M${i * 120} 60 h120 v40 a60 30 0 0 1 -120 0 Z`} fill={i % 2 ? "#f6efe0" : palette.accent} />
    ))}
    {/* стеллаж во всю заднюю стену, верхние полки выше голов */}
    <Rack x0={60} x1={1020} ys={[600, 790]} colors={SHOP_COLORS} kinds={["box", "jar", "can", "bottle", "box", "can"]} back={shade(palette.wall, -0.08)} />
    <rect x={46} y={806} width={988} height={FLOOR_Y - 806} fill={shade(palette.wall, -0.04)} />
    {/* ящик с фруктами слева */}
    <rect x={40} y={1060} width={230} height={130} rx={8} fill={WOOD} />
    <rect x={40} y={1100} width={230} height={12} fill={WOOD_D} />
    {[80, 130, 180, 230, 105, 155, 205].map((x, i) => (
      <circle key={i} cx={x} cy={i < 4 ? 1050 : 1020} r={26} fill={i % 2 ? "#d9a630" : "#c8553d"} />
    ))}
    <rect x={130} y={1130} width={50} height={28} rx={4} fill={TAG} />
    {/* прилавок с кассой */}
    <ShopCounter x0={600} x1={1060} body={WOOD} topColor={WOOD_L} stripe={palette.accent} />
    <Register x={840} top={985} accent={palette.accent} />
    <rect x={660} y={950} width={60} height={35} rx={6} fill="#d9a630" />
    <rect x={730} y={960} width={70} height={25} rx={4} fill="#5b8c5a" />
  </>
);

/* ---------- pharmacy ---------- */

const GreenCross = ({ x, y, s = 1, color = "#3a9a5a" }: { x: number; y: number; s?: number; color?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={0} r={110} fill={color} opacity={0.15} />
    <path d="M-25 -75 h50 v50 h50 v50 h-50 v50 h-50 v-50 h-50 v-50 h50 Z" fill={color} />
  </g>
);

const Pharmacy = ({ palette }: { palette: Palette }) => {
  const green = "#3a9a5a";
  const wall = shade(palette.wall, 0.4);
  const meds = ["#ffffff", "#7ab8d9", "#3a9a5a", "#f2d27a", "#e89a8a", "#ffffff", "#b8d9c4"];
  return (
    <>
      <Room wall={wall} floor={shade(palette.floor, 0.25)} />
      <rect x={0} y={0} width={W} height={70} fill={green} />
      <rect x={0} y={70} width={W} height={10} fill="#00000014" />
      <Rack x0={50} x1={500} ys={[620, 800]} colors={meds} kinds={["box", "bottle", "jar", "box"]} frame="#e8eef0" back="#dce8ea" board="#f6fafa" />
      <Rack x0={760} x1={1030} ys={[620, 800]} colors={meds} kinds={["jar", "box", "bottle"]} frame="#e8eef0" back="#dce8ea" board="#f6fafa" seed={2} />
      <GreenCross x={630} y={540} s={0.85} color={green} />
      {/* шкафчики внизу */}
      <rect x={36} y={830} width={478} height={FLOOR_Y - 830} fill="#eef3f4" />
      <rect x={746} y={830} width={298} height={FLOOR_Y - 830} fill="#eef3f4" />
      {/* белый прилавок с зелёной полосой */}
      <ShopCounter x0={0} x1={W} top={990} body="#f6fafa" topColor="#dfe8ea" stripe={green} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={60 + i * 250} y={1080} width={210} height={90} rx={8} fill="#00000010" />)}
      <Register x={860} top={990} accent={green} />
      {/* коробочки и баночки на прилавке */}
      <rect x={120} y={940} width={70} height={50} rx={6} fill="#7ab8d9" />
      <rect x={120} y={956} width={70} height={12} fill="#ffffff" />
      <rect x={210} y={950} width={34} height={40} rx={8} fill="#e89a8a" />
      <rect x={206} y={942} width={42} height={12} rx={4} fill="#ffffff" />
      <Plant x={640} y={990} scale={0.45} pot={green} />
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
      <rect x={x - w / 2 - 8} y={y - 30} width={w + 16} height={34} rx={12} fill="#c9ccd4" />
      <rect x={x - w / 2 - 8} y={y + h - 4} width={w + 16} height={34} rx={12} fill="#c9ccd4" />
      <g clipPath="url(#barber-pole-clip)">
        <rect x={x - w / 2} y={y} width={w} height={h} fill="#f6efe0" />
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={i} d={`M${x - w / 2} ${y + i * 70 - 60} l${w} -50 v26 l${-w} 50 Z`} fill={i % 2 ? "#4a6fa5" : "#c8553d"} />
        ))}
      </g>
    </g>
  );
};

const BarberChair = ({ x, accent }: { x: number; accent: string }) => (
  <g>
    <ellipse cx={x} cy={FLOOR_Y - 6} rx={90} ry={14} fill="#9aa0a8" />
    <rect x={x - 16} y={1080} width={32} height={FLOOR_Y - 1086} fill="#9aa0a8" />
    {/* подлокотники, сиденье, спинка, подголовник */}
    <rect x={x - 100} y={1030} width={200} height={56} rx={22} fill={accent} />
    <rect x={x - 86} y={850} width={172} height={200} rx={34} fill={accent} />
    <rect x={x - 62} y={872} width={124} height={150} rx={24} fill={shade(accent, -0.12)} />
    <rect x={x - 110} y={990} width={40} height={20} rx={8} fill="#c9ccd4" />
    <rect x={x + 70} y={990} width={40} height={20} rx={8} fill="#c9ccd4" />
    <rect x={x - 40} y={808} width={80} height={46} rx={20} fill={shade(accent, -0.2)} />
    <rect x={x - 70} y={1100} width={60} height={12} rx={6} fill="#9aa0a8" />
  </g>
);

const Barbershop = ({ palette }: { palette: Palette }) => {
  const wall = "#e8ece6";
  return (
    <>
      <Room wall={wall} floor={palette.floor} />
      {/* плитка на полу у стены: простая полоса */}
      <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={shade(palette.accent, 0.55)} />
      <rect x={0} y={870} width={W} height={12} fill={shade(palette.accent, 0.2)} />
      {/* зеркало */}
      <rect x={530} y={440} width={380} height={460} rx={190} fill={WOOD} />
      <rect x={548} y={458} width={344} height={424} rx={172} fill="#cfe2ea" />
      <path d="M600 560 l60 -60 h40 l-100 100 Z" fill="#ffffff70" />
      <path d="M600 640 l120 -120 h20 l-140 140 Z" fill="#ffffff50" />
      {/* полочка под зеркалом с флаконами и ножницами */}
      <rect x={520} y={930} width={400} height={18} rx={4} fill={WOOD_L} />
      {[["#4a6fa5", 560, 60], ["#d9a630", 600, 44], ["#5b8c5a", 860, 54]].map(([c, x, h]) => (
        <rect key={x as number} x={x as number} y={930 - (h as number)} width={28} height={h as number} rx={8} fill={c as string} />
      ))}
      <rect x={884} y={884} width={6} height={30} fill="#333" />
      <BarberChair x={720} accent={palette.accent} />
      <BarberPole x={130} y={470} />
      {/* вешалка с полотенцами и стул ожидания */}
      <rect x={250} y={600} width={160} height={14} rx={7} fill={WOOD_D} />
      {[270, 320, 370].map((x, i) => <rect key={x} x={x} y={612} width={34} height={90} rx={8} fill={i === 1 ? palette.accent : "#f6efe0"} />)}
      <Plant x={990} scale={1.05} pot={WOOD} />
    </>
  );
};

export const Magazin = ({ palette, variant }: BackdropProps) => (
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
