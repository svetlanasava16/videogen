import { Canvas, Room, W, H, FLOOR_Y, type BackdropProps, type Palette } from "./parts";
import { mix, dark, light, WOOD } from "./gostinaya";

/**
 * Фон «podyezd»: лестничная площадка многоэтажки — двери квартир слева и справа, лифт, лестница наверх справа.
 * Вариант elevator — внутри тесной кабины лифта (кнопки, зеркало, поручень). Метки общие (content/locations/podyezd.json).
 * Середина пола свободна; стена покрашена «под панель»: снизу краска цвета wall, сверху побелка.
 */

const WHITEWASH = "#ece8de";
const STEEL = "#9aa5ad";

/** Квартирная дверь в дерматине с гвоздиками, глазком и номерком. */
const FlatDoor = ({ x, w, color, num }: { x: number; w: number; color: string; num: string }) => {
  const h = 540;
  const y = FLOOR_Y - h;
  return (
    <g>
      <rect x={x - 20} y={y - 20} width={w + 40} height={h + 20} rx={6} fill={dark(WHITEWASH, 0.12)} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill={color} />
      {Array.from({ length: 5 }).flatMap((_, r) =>
        Array.from({ length: 3 }).map((__, c) => <circle key={`${r}-${c}`} cx={x + w * (0.25 + c * 0.25)} cy={y + 70 + r * 96} r={6} fill={light(color, 0.25)} />),
      )}
      <circle cx={x + w / 2} cy={y + 150} r={8} fill="#d9c070" />
      <rect x={x + w / 2 - 26} y={y + 30} width={52} height={30} rx={4} fill="#d9c070" />
      <text x={x + w / 2} y={y + 53} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={800} fontSize={22} fill={dark(color, 0.2)}>{num}</text>
      <rect x={x + w - 46} y={y + 280} width={30} height={14} rx={7} fill="#d9c070" />
      <rect x={x + w - 40} y={y + 316} width={14} height={30} rx={5} fill="#b9a060" />
      {/* звонок и коврик */}
      <circle cx={x + w + 44} cy={y + 250} r={12} fill={dark(WHITEWASH, 0.2)} />
      <circle cx={x + w + 44} cy={y + 250} r={6} fill="#c8553d" />
      <rect x={x + 10} y={FLOOR_Y + 4} width={w - 20} height={30} rx={8} fill="#6b5a4a" />
    </g>
  );
};

/** Лифт: металлическая рама, раздвижные створки, табло этажа и кнопка вызова. */
const LiftDoors = ({ x, w }: { x: number; w: number }) => {
  const h = 560;
  const y = FLOOR_Y - h;
  return (
    <g>
      <rect x={x - 26} y={y - 26} width={w + 52} height={h + 26} rx={4} fill="#6f7a82" />
      <rect x={x} y={y} width={w / 2 - 3} height={h} fill={STEEL} />
      <rect x={x + w / 2 + 3} y={y} width={w / 2 - 3} height={h} fill={STEEL} />
      <rect x={x + w / 2 - 3} y={y} width={6} height={h} fill="#4a545c" />
      <rect x={x + 20} y={y + 30} width={w / 2 - 44} height={h - 60} rx={6} fill="#ffffff22" />
      <rect x={x + w / 2 + 24} y={y + 30} width={w / 2 - 44} height={h - 60} rx={6} fill="#ffffff22" />
      {/* табло со стрелкой */}
      <rect x={x + w / 2 - 50} y={y - 80} width={100} height={40} rx={6} fill="#2b3036" />
      <path d={`M${x + w / 2 - 12} ${y - 48} L${x + w / 2} ${y - 72} L${x + w / 2 + 12} ${y - 48} Z`} fill="#e0602a" />
      {/* кнопка вызова */}
      <rect x={x + w + 46} y={y + 250} width={34} height={60} rx={6} fill="#6f7a82" />
      <circle cx={x + w + 63} cy={y + 280} r={10} fill="#e0a030" />
    </g>
  );
};

/** Лестничный марш наверх вдоль правой стены, с перилами. */
const Stairs = ({ x0, top, railColor }: { x0: number; top: number; railColor: string }) => {
  const n = 8;
  const stepW = (W - x0) / n;
  const stepH = (FLOOR_Y - top) / n;
  const step = "#a89c8e";
  return (
    <g>
      {/* боковина марша */}
      <path d={`M${x0} ${FLOOR_Y} L${W} ${top} L${W} ${FLOOR_Y} Z`} fill={dark(step, 0.2)} />
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <rect x={x0 + i * stepW} y={FLOOR_Y - (i + 1) * stepH} width={W - x0 - i * stepW} height={stepH} fill={i % 2 ? step : light(step, 0.08)} />
          <rect x={x0 + i * stepW} y={FLOOR_Y - (i + 1) * stepH} width={W - x0 - i * stepW} height={8} fill={light(step, 0.3)} />
        </g>
      ))}
      {/* балясины и поручень */}
      {Array.from({ length: n }).map((_, i) => {
        const bx = x0 + (i + 0.5) * stepW;
        const by = FLOOR_Y - (i + 1) * stepH;
        return <rect key={i} x={bx - 4} y={by - 230} width={8} height={230} fill="#4a4a4a" />;
      })}
      <path d={`M${x0 - 10} ${FLOOR_Y - 236} L${W + 10} ${top - 236}`} stroke={railColor} strokeWidth={18} strokeLinecap="round" />
      <rect x={x0 - 14} y={FLOOR_Y - 250} width={14} height={250} fill="#4a4a4a" />
    </g>
  );
};

/* ---------- лестничная площадка ---------- */
const Landing = ({ palette: p }: { palette: Palette }) => {
  const paint = p.wall;
  const tileA = p.floor;
  const tileB = light(p.floor, 0.1);
  return (
    <>
      <Room wall={WHITEWASH} floor={tileA} />
      {/* плитка пола: шахматка */}
      {Array.from({ length: 12 }).flatMap((_, r) =>
        Array.from({ length: 14 }).map((__, c) => ((r + c) % 2 ? <rect key={`${r}-${c}`} x={c * 80} y={FLOOR_Y + r * 64} width={80} height={64} fill={tileB} /> : null)),
      )}
      {/* окрашенная панель снизу */}
      <rect x={0} y={800} width={W} height={FLOOR_Y - 800} fill={paint} />
      <rect x={0} y={792} width={W} height={12} fill={dark(paint, 0.25)} />
      <rect x={0} y={FLOOR_Y - 18} width={W} height={18} fill="#00000022" />
      {/* надписи на стене */}
      <path d="M300 1000 q20 -30 40 0 q20 -30 40 0 l-40 46 z" fill="none" stroke={dark(paint, 0.35)} strokeWidth={5} />
      <path d="M470 1110 l30 -30 l20 24 l30 -36" fill="none" stroke={dark(paint, 0.3)} strokeWidth={5} strokeLinecap="round" />
      {/* лампочка и окно над лестницей */}
      <rect x={498} y={0} width={4} height={300} fill="#2b1d14" />
      <circle cx={500} cy={330} r={160} fill="#f5e6a8" opacity={0.12} />
      <rect x={490} y={296} width={20} height={18} fill="#5a5a5a" />
      <circle cx={500} cy={330} r={20} fill="#f5e6a8" />
      <rect x={870} y={380} width={180} height={230} rx={6} fill={dark(WHITEWASH, 0.15)} />
      <rect x={884} y={394} width={152} height={202} rx={4} fill="#a9c8dc" />
      <rect x={956} y={394} width={8} height={202} fill={dark(WHITEWASH, 0.15)} />
      <rect x={862} y={606} width={196} height={16} rx={5} fill={dark(WHITEWASH, 0.2)} />
      {/* почтовые ящики */}
      <rect x={300} y={650} width={60} height={110} rx={4} fill="#6f8a9a" />
      {[0, 1, 2].map((i) => <rect key={i} x={308} y={660 + i * 34} width={44} height={8} rx={3} fill="#2b3036" />)}
      <FlatDoor x={40} w={210} color={dark(p.accent, 0.1)} num="12" />
      <LiftDoors x={400} w={220} />
      <FlatDoor x={700} w={150} color={mix(p.accent, "#5a6a4a", 0.6)} num="13" />
      <Stairs x0={900} top={900} railColor={WOOD} />
    </>
  );
};

/* ---------- кабина лифта ---------- */
const Elevator = ({ palette: p }: { palette: Palette }) => {
  const panel = mix("#b08a62", p.wall, 0.15);
  const side = dark(panel, 0.22);
  const floor = "#4a4a4c";
  return (
    <>
      <Room wall={panel} floor={floor} />
      {/* стыки панелей «под дерево» */}
      {[200, 380, 560, 740, 920].map((x) => <rect key={x} x={x} y={260} width={6} height={FLOOR_Y - 260} fill={dark(panel, 0.12)} />)}
      {/* потолок со светильником */}
      <rect x={0} y={0} width={W} height={260} fill={dark(panel, 0.35)} />
      <rect x={300} y={60} width={480} height={70} rx={14} fill="#f7f4ea" />
      <circle cx={540} cy={120} r={320} fill="#fff4cf" opacity={0.08} />
      <rect x={0} y={250} width={W} height={14} fill={dark(panel, 0.45)} />
      {/* боковые стены в перспективе */}
      <path d={`M0 0 L110 264 L110 ${FLOOR_Y} L0 ${FLOOR_Y + 130} Z`} fill={side} />
      <path d={`M${W} 0 L${W - 110} 264 L${W - 110} ${FLOOR_Y} L${W} ${FLOOR_Y + 130} Z`} fill={side} />
      <path d={`M0 ${FLOOR_Y + 130} L110 ${FLOOR_Y} L${W - 110} ${FLOOR_Y} L${W} ${FLOOR_Y + 130} V${H} H0 Z`} fill={floor} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={0} y={FLOOR_Y + 40 + i * 70} width={W} height={8} fill={light(floor, 0.08)} />
      ))}
      {/* зеркало */}
      <rect x={150} y={420} width={290} height={480} rx={18} fill={dark(panel, 0.3)} />
      <rect x={164} y={434} width={262} height={452} rx={12} fill="#cfe2ea" />
      <rect x={200} y={470} width={30} height={180} rx={15} fill="#ffffff" opacity={0.6} transform="rotate(20 215 560)" />
      <rect x={250} y={470} width={14} height={120} rx={7} fill="#ffffff" opacity={0.5} transform="rotate(20 257 530)" />
      {/* поручень */}
      <rect x={110} y={950} width={W - 220} height={18} rx={9} fill="#c9ced2" />
      {[150, W - 150].map((x) => <rect key={x} x={x - 6} y={950} width={12} height={46} fill="#9aa1a6" />)}
      {/* панель с кнопками; одна прожжена */}
      <rect x={820} y={560} width={120} height={360} rx={10} fill="#c9ced2" />
      <rect x={840} y={580} width={80} height={44} rx={6} fill="#2b3036" />
      <rect x={866} y={590} width={28} height={24} rx={3} fill="#e0602a" />
      {Array.from({ length: 10 }).map((_, i) => (
        <circle key={i} cx={858 + (i % 2) * 44} cy={660 + Math.floor(i / 2) * 50} r={15} fill={i === 7 ? "#2b2b2b" : "#f2efe6"} stroke="#8a9096" strokeWidth={4} />
      ))}
      <rect x={846} y={900 - 10} width={68} height={6} rx={3} fill="#c8553d" />
      {/* каракули на стене */}
      <path d="M600 760 q20 -24 40 0 q20 24 40 0" fill="none" stroke={dark(panel, 0.35)} strokeWidth={4} />
      <path d="M560 840 l60 0 M590 820 l0 40" stroke={dark(panel, 0.3)} strokeWidth={4} />
    </>
  );
};

/** Подъезд: площадка (stairwell) + кабина лифта (elevator). */
export const Podyezd = ({ palette, variant }: BackdropProps) => (
  <Canvas>{variant === "elevator" ? <Elevator palette={palette} /> : <Landing palette={palette} />}</Canvas>
);
