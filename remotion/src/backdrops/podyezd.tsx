import { Canvas, Room, W, H, FLOOR_Y, type BackdropProps, type Palette } from "./parts";
import { mix, dark, light, WOOD, VShade, Glow, FloorTiles, FloorShadow, WindowView, PotPlant, CeilingLamp } from "./gostinaya";

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

/** Почтовые ящики блоком. */
const Mailboxes = ({ x, y, cols = 2, rows = 4 }: { x: number; y: number; cols?: number; rows?: number }) => (
  <g>
    <rect x={x + 6} y={y + 8} width={cols * 46 + 10} height={rows * 46 + 10} rx={4} fill="#00000022" />
    <rect x={x} y={y} width={cols * 46 + 10} height={rows * 46 + 10} rx={4} fill="#5f7a8a" />
    {Array.from({ length: rows }).flatMap((_, r) =>
      Array.from({ length: cols }).map((__, c) => {
        const bx = x + 6 + c * 46;
        const by = y + 6 + r * 46;
        return (
          <g key={`${r}-${c}`}>
            <rect x={bx} y={by} width={42} height={42} rx={3} fill={(r + c) % 3 === 1 ? "#6f8a9a" : "#7b95a4"} />
            <rect x={bx + 6} y={by + 8} width={30} height={6} rx={3} fill="#2b3036" />
            <circle cx={bx + 32} cy={by + 30} r={3} fill="#d9c070" />
            {(r * 2 + c) % 3 === 0 && <rect x={bx + 8} y={by + 2} width={20} height={10} fill="#f2efe6" transform={`rotate(-8 ${bx + 18} ${by + 7})`} />}
          </g>
        );
      }),
    )}
  </g>
);

/* ---------- лестничная площадка ---------- */
const Landing = ({ palette: p }: { palette: Palette }) => {
  const paint = p.wall;
  return (
    <>
      <Room wall={WHITEWASH} floor={p.floor} />
      {/* побелка с подтёками, потолок с проводкой */}
      <VShade y={0} h={800} color="#6a6458" from={0.35} to={0} />
      <rect x={0} y={0} width={W} height={70} fill={dark(WHITEWASH, 0.18)} />
      <path d="M0 96 H498" stroke="#3a3a3a" strokeWidth={4} />
      {[80, 220, 360].map((x) => <rect key={x} x={x} y={90} width={8} height={12} fill="#f2efe6" />)}
      <ellipse cx={220} cy={130} rx={90} ry={26} fill="#b8ae98" opacity={0.35} />
      <path d="M180 130 q4 60 -4 90 M240 140 q6 40 0 70" stroke="#b8ae98" strokeWidth={6} opacity={0.35} fill="none" />
      {/* плитка пола: шахматка в перспективе */}
      <FloorTiles a={p.floor} b={light(p.floor, 0.1)} step={96} d={0.085} grout={dark(p.floor, 0.1)} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.3} />
      {/* окрашенная панель снизу с бордюрной полосой и облупленной краской */}
      <rect x={0} y={800} width={W} height={FLOOR_Y - 800} fill={paint} />
      <rect x={0} y={792} width={W} height={12} fill={dark(paint, 0.25)} />
      <rect x={0} y={830} width={W} height={8} fill={dark(paint, 0.12)} />
      {[[340, 1080, 38, 22], [880, 880, 26, 16], [620, 1140, 30, 14]].map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={light(paint, 0.35)} />)}
      <rect x={0} y={FLOOR_Y - 26} width={W} height={26} fill={dark(paint, 0.35)} />
      {/* надписи на стене */}
      <path d="M300 1000 q20 -30 40 0 q20 -30 40 0 l-40 46 z" fill="none" stroke={dark(paint, 0.35)} strokeWidth={5} />
      <path d="M470 1110 l30 -30 l20 24 l30 -36" fill="none" stroke={dark(paint, 0.3)} strokeWidth={5} strokeLinecap="round" />
      <text x={322} y={1120} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={900} fontSize={24} fill={dark(paint, 0.38)} transform="rotate(-6 322 1120)">ЦОЙ ЖИВ</text>
      {/* лампочка */}
      <CeilingLamp x={500} y={70} len={230} kind="bulb" glow="#f5e6a8" r={330} o={0.32} />
      {/* окно над лестницей: двор, герань и банка-пепельница на подоконнике */}
      <WindowView x={870} y={380} w={180} h={230} frame={dark(WHITEWASH, 0.15)} sill={false} />
      <rect x={862} y={606} width={196} height={16} rx={5} fill={dark(WHITEWASH, 0.2)} />
      <PotPlant x={900} y={606} s={0.5} pot="#c8553d" flower="#e0505a" />
      <rect x={1004} y={578} width={24} height={28} rx={3} fill="#a9b0b4" />
      <rect x={1012} y={570} width={4} height={10} fill="#f2efe6" transform="rotate(20 1014 575)" />
      {/* почтовые ящики, объявление, щиток */}
      <Mailboxes x={272} y={600} />
      <rect x={290} y={830} width={70} height={92} fill="#f8f4ea" transform="rotate(2 325 876)" />
      <rect x={298} y={840} width={54} height={8} fill="#3a3a3a" transform="rotate(2 325 876)" />
      {[0, 1, 2].map((i) => <rect key={i} x={298} y={856 + i * 10} width={50 - i * 8} height={4} fill="#9a968e" transform="rotate(2 325 876)" />)}
      {[0, 1, 2, 3, 4].map((i) => <rect key={`t${i}`} x={294 + i * 13} y={900} width={9} height={22} fill={i === 2 ? "none" : "#f8f4ea"} stroke="#c9c1b2" strokeWidth={1} transform="rotate(2 325 876)" />)}
      <rect x={720} y={470} width={120} height={120} rx={4} fill="#8a9a8a" />
      <rect x={728} y={478} width={104} height={104} rx={3} fill={dark("#8a9a8a", 0.12)} />
      <path d="M742 494 l10 14 l-8 0 l10 14" stroke="#e0b030" strokeWidth={5} fill="none" />
      <path d="M840 520 q30 10 20 60" stroke="#3a3a3a" strokeWidth={4} fill="none" />
      <FlatDoor x={40} w={210} color={dark(p.accent, 0.1)} num="12" />
      <FloorShadow cx={510} w={300} o={0.2} />
      <LiftDoors x={400} w={220} />
      <FlatDoor x={700} w={150} color={mix(p.accent, "#5a6a4a", 0.6)} num="13" />
      <Stairs x0={900} top={900} railColor={WOOD} />
      <Glow cx={500} cy={1250} r={400} rx={500} ry={120} color="#f5e6a8" opacity={0.12} />
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
      {/* текстура «под дерево» */}
      {Array.from({ length: 22 }).map((_, i) => {
        const x = 120 + i * 40 + (i % 3) * 7;
        return <path key={i} d={`M${x} 280 q${8 - (i % 4) * 4} 300 0 460 q-6 200 2 ${FLOOR_Y - 1000}`} stroke={dark(panel, 0.06)} strokeWidth={3} fill="none" />;
      })}
      <VShade y={260} h={FLOOR_Y - 260} from={0} to={0.18} />
      {/* потолок со светильником */}
      <rect x={0} y={0} width={W} height={260} fill={dark(panel, 0.35)} />
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={120 + i * 110} y={180} width={70} height={10} rx={5} fill={dark(panel, 0.5)} />)}
      <rect x={300} y={60} width={480} height={70} rx={14} fill="#f7f4ea" />
      <rect x={320} y={74} width={440} height={42} rx={10} fill="#ffffff" />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={360 + i * 120} cy={95} r={10} fill="#3a3530" opacity={0.25} />)}
      <Glow cx={540} cy={160} r={520} color="#fff4cf" opacity={0.3} />
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
      {/* табличка «паспорт лифта», объявление, динамик и кнопка вызова диспетчера */}
      <rect x={520} y={420} width={170} height={110} rx={4} fill="#d8d4c8" />
      <rect x={530} y={430} width={150} height={16} fill="#5a5048" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={534} y={456 + i * 16} width={140 - (i % 2) * 40} height={6} fill="#8a8478" />)}
      {[0, 1].map((i) => <circle key={i} cx={526 + i * 158} cy={426} r={4} fill="#8a8478" />)}
      <rect x={480} y={600} width={150} height={110} fill="#f8f4ea" transform="rotate(-3 555 655)" />
      <rect x={492} y={612} width={126} height={18} fill={p.accent} transform="rotate(-3 555 655)" />
      {[0, 1, 2].map((i) => <rect key={i} x={494} y={642 + i * 16} width={110 - i * 20} height={6} fill="#9a968e" transform="rotate(-3 555 655)" />)}
      <rect x={470} y={606} width={30} height={12} fill="#e8e0b0" opacity={0.8} transform="rotate(-30 485 612)" />
      <circle cx={880} cy={490} r={34} fill="#9aa1a6" />
      {[-16, -6, 4, 14].map((d) => <rect key={d} x={860} y={490 + d} width={40} height={4} rx={2} fill="#5a6066" />)}
      <rect x={846} y={1000} width={68} height={60} rx={8} fill="#c9ced2" />
      <circle cx={880} cy={1030} r={16} fill="#e0b030" />
      <path d="M872 1030 q8 -10 16 0" stroke="#5a5048" strokeWidth={3} fill="none" />
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
