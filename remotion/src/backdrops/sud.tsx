import { Canvas, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { depthScale, feetY, seatTopY } from "../world/depth";
import { Label, shade } from "./ulitsa";
import { useSign } from "../i18n/signs";

/**
 * Фон «sud»: зал суда. По центру — судейская трибуна на подиуме с высоким креслом и нейтральным гербом (щит с весами,
 * лавровый венок) между бархатными портьерами (judge, x 0.5, дальний план); слева — клетка подсудимого с лавкой (dock, 0.14,
 * верх лавки = seatTopY(1)); справа — трибуна свидетеля с микрофоном (witness, 0.87). Стены — деревянные панели, высокие окна.
 *
 * Глубина (content/locations/sud.json → front.z = 0.8): судейский стол с подиумом, передняя решётка и барьер клетки, трибуна
 * свидетеля — передний слой (layer="front"): судья, подсудимый и свидетель (z 1) за ними, адвокат и прокурор (z 0.5) — перед.
 * Низ — на полу плана 0.8 (FRONT_FEET). Стол судьи — поверхность для предметов (surfaces).
 */

const FRONT_FEET = feetY(0.8);
const BENCH_TOP = 950;

const GOLD = "#d9a94a";

/** Нейтральный герб: щит с весами в лавровом венке. */
const Emblem = ({ x, y, s = 1, accent }: { x: number; y: number; s?: number; accent: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* венок */}
    {[-1, 1].map((k) => (
      <g key={k}>
        <path d={`M${k * 20} 120 Q${k * 120} 90 ${k * 110} -40`} stroke="#8a6a2a" strokeWidth={6} fill="none" />
        {Array.from({ length: 7 }).map((_, i) => {
          const t = i / 6;
          const px = k * (20 + 100 * Math.sin(t * 1.4));
          const py = 110 - t * 150;
          return <ellipse key={i} cx={px} cy={py} rx={10} ry={22} fill={i % 2 ? GOLD : shade(GOLD, -0.12)} transform={`rotate(${k * (60 - i * 12)} ${px} ${py})`} />;
        })}
      </g>
    ))}
    <path d="M-20 124 l40 -10 M20 124 l-40 -10" stroke={accent} strokeWidth={8} strokeLinecap="round" />
    {/* щит */}
    <path d="M-70 -70 H70 V20 Q70 90 0 120 Q-70 90 -70 20 Z" fill={GOLD} />
    <path d="M-58 -58 H58 V18 Q58 78 0 104 Q-58 78 -58 18 Z" fill={accent} />
    {/* весы */}
    <g fill={GOLD} stroke={GOLD}>
      <rect x={-3} y={-44} width={6} height={110} stroke="none" />
      <rect x={-22} y={62} width={44} height={8} rx={3} stroke="none" />
      <rect x={-44} y={-34} width={88} height={6} rx={3} stroke="none" />
      <circle cx={0} cy={-48} r={7} stroke="none" />
      <path d="M-40 -28 L-54 12 M-40 -28 L-26 12 M40 -28 L26 12 M40 -28 L54 12" strokeWidth={2} fill="none" />
      <path d="M-58 12 H-22 Q-40 32 -58 12 Z M22 12 H58 Q40 32 22 12 Z" stroke="none" />
    </g>
    <path d="M-70 -70 H70 V-56 H-70 Z" fill={shade(GOLD, 0.2)} />
  </g>
);

/** Высокое окно с бархатными портьерами. */
const TallWindow = ({ x, accent }: { x: number; accent: string }) => (
  <g>
    <rect x={x - 6} y={424} width={232} height={372} rx={110} fill="#00000018" />
    <path d={`M${x} 800 V530 a110 110 0 0 1 220 0 V800 Z`} fill="#f2e6d0" />
    <path d={`M${x + 16} 784 V534 a94 94 0 0 1 188 0 V784 Z`} fill="#bcd8e8" />
    <path d={`M${x + 30} 700 L${x + 130} 470 H${x + 160} L${x + 60} 720 Z`} fill="#ffffff" opacity={0.3} />
    <rect x={x + 106} y={440} width={8} height={344} fill="#f2e6d0" />
    <rect x={x + 16} y={620} width={188} height={8} fill="#f2e6d0" />
    <rect x={x - 20} y={800} width={260} height={18} rx={4} fill={shade("#f2e6d0", -0.15)} />
    {/* портьеры */}
    <path d={`M${x - 30} 420 H${x + 40} Q${x + 20} 620 ${x + 50} 820 H${x - 30} Z`} fill={accent} />
    <path d={`M${x + 250} 420 H${x + 180} Q${x + 200} 620 ${x + 170} 820 H${x + 250} Z`} fill={accent} />
    <path d={`M${x - 10} 420 Q${x} 620 ${x + 10} 820`} stroke={shade(accent, -0.25)} strokeWidth={6} fill="none" />
    <path d={`M${x + 230} 420 Q${x + 220} 620 ${x + 210} 820`} stroke={shade(accent, -0.25)} strokeWidth={6} fill="none" />
    <rect x={x - 40} y={410} width={300} height={16} rx={8} fill={GOLD} />
    <rect x={x + 14} y={640} width={26} height={10} rx={5} fill={GOLD} />
    <rect x={x + 180} y={640} width={26} height={10} rx={5} fill={GOLD} />
  </g>
);

/** Передний слой: судейский стол на подиуме, передняя решётка и деревянный барьер клетки, трибуна свидетеля. */
const SudFront = ({ wood }: { wood: string }) => {
  const t = useSign();
  const dockX = 0.14 * W;
  const b = FRONT_FEET;
  const top = BENCH_TOP;
  const wx = 0.87 * W;
  return (
    <>
      {/* подиум и судейский стол */}
      <rect x={300} y={b - 74} width={480} height={74} fill={shade(wood, -0.15)} />
      <rect x={300} y={b - 74} width={480} height={10} fill={shade(wood, 0.15)} />
      <rect x={280} y={top + 20} width={520} height={b - 74 - top - 20} fill={wood} />
      <rect x={280} y={top + 20} width={520} height={12} fill="#00000025" />
      {[300, 460, 620].map((x) => <rect key={x} x={x + 14} y={top + 54} width={130} height={b - 74 - top - 84} rx={6} fill={shade(wood, -0.12)} />)}
      <circle cx={540} cy={top + 120} r={40} fill={GOLD} opacity={0.85} />
      <path d={`M520 ${top + 120} h40 M540 ${top + 100} v40`} stroke={shade(GOLD, -0.3)} strokeWidth={6} />
      <rect x={270} y={top} width={540} height={34} rx={8} fill={shade(wood, 0.15)} />
      <rect x={270} y={top} width={540} height={8} rx={4} fill="#ffffff22" />
      {/* на столе: молоток на подставке (слева), папки (справа), табличка у кромки */}
      <rect x={300} y={top - 14} width={80} height={16} rx={4} fill={shade(wood, -0.3)} />
      <rect x={322} y={top - 34} width={46} height={20} rx={8} fill="#5a3a20" transform={`rotate(-12 345 ${top - 24})`} />
      <rect x={340} y={top - 42} width={70} height={8} rx={4} fill="#5a3a20" transform={`rotate(-12 345 ${top - 24})`} />
      <rect x={670} y={top - 24} width={110} height={26} rx={3} fill="#e8e4d8" />
      <rect x={678} y={top - 34} width={100} height={12} rx={3} fill="#d8506a" />
      <rect x={682} y={top - 44} width={92} height={12} rx={3} fill="#4a7fb0" />
      <rect x={430} y={top + 40} width={220} height={36} rx={4} fill="#2b2a2e" />
      <Label x={540} y={top + 66} text={t("judge")} size={22} color={GOLD} spacing={3} maxW={200} />
      {/* клетка: верхняя рама, передние прутья, барьер, замок */}
      <rect x={dockX - 160} y={680} width={320} height={16} rx={6} fill="#5a5f68" />
      {Array.from({ length: 11 }).map((_, i) => <rect key={i} x={dockX - 156 + i * 31} y={690} width={8} height={b - 690} fill="#5a5f68" />)}
      {Array.from({ length: 11 }).map((_, i) => <rect key={`h${i}`} x={dockX - 154 + i * 31} y={690} width={3} height={b - 690} fill="#ffffff" opacity={0.18} />)}
      <rect x={dockX - 160} y={940} width={320} height={10} fill="#5a5f68" />
      <rect x={dockX - 166} y={1090} width={332} height={b - 1090} rx={4} fill={shade(wood, -0.2)} />
      <rect x={dockX - 166} y={1090} width={332} height={12} rx={4} fill={shade(wood, 0.1)} />
      <rect x={dockX - 146} y={1116} width={292} height={b - 1136} rx={4} fill={shade(wood, -0.3)} />
      <rect x={dockX + 110} y={980} width={22} height={34} rx={4} fill="#8a8f98" />
      {/* трибуна свидетеля (witness) */}
      <rect x={wx - 110} y={1000} width={220} height={b - 1000} rx={6} fill={wood} />
      <rect x={wx - 90} y={1036} width={180} height={b - 1070} rx={6} fill={shade(wood, -0.12)} />
      <rect x={wx - 120} y={986} width={240} height={26} rx={8} fill={shade(wood, 0.15)} />
      <path d={`M${wx + 60} 986 q20 -60 -10 -90`} stroke="#2b2a2e" strokeWidth={6} fill="none" />
      <ellipse cx={wx + 46} cy={892} rx={12} ry={16} fill="#2b2a2e" />
      <rect x={wx - 60} y={970} width={60} height={16} rx={3} fill="#e8e4d8" />
      <rect x={wx - 80} y={950} width={22} height={36} rx={4} fill="#bcd8e8" opacity={0.8} />
    </>
  );
};

export const Sud = ({ palette, layer = "back" }: BackdropProps) => {
  if (layer === "front") return <Canvas><SudFront wood="#7a4f30" /></Canvas>;
  const wall = palette.wall;
  const wood = "#7a4f30";
  const panel = "#8a5a36";
  const accent = palette.accent;
  const s1 = depthScale(1);
  const top = seatTopY(1);
  const dockX = 0.14 * W;
  return (
    <Canvas>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      {/* потолочный карниз и лепнина */}
      <rect x={0} y={360} width={W} height={20} fill={shade(wall, -0.1)} />
      {Array.from({ length: 27 }).map((_, i) => <rect key={i} x={i * 40 + 8} y={380} width={20} height={14} fill={shade(wall, -0.08)} />)}
      {/* пилястры */}
      {[60, 350, 730, 1020].map((x) => (
        <g key={x}>
          <rect x={x - 20} y={394} width={40} height={470} fill={shade(wall, 0.08)} />
          <rect x={x - 26} y={394} width={52} height={20} fill={shade(wall, -0.05)} />
        </g>
      ))}
      <TallWindow x={110} accent={accent} />
      <TallWindow x={750} accent={accent} />
      {/* портьеры за судьёй и герб */}
      <path d="M380 400 H700 V880 H380 Z" fill={shade(accent, -0.15)} />
      {[400, 440, 480, 520, 560, 600, 640, 680].map((x) => <rect key={x} x={x} y={400} width={10} height={480} fill={shade(accent, -0.28)} />)}
      <path d="M370 400 H710 V440 Q540 480 370 440 Z" fill={accent} />
      {[390, 450, 510, 570, 630, 690].map((x) => <circle key={x} cx={x} cy={446} r={8} fill={GOLD} />)}
      <Emblem x={540} y={560} s={0.9} accent={accent} />
      {/* деревянные панели нижней части стены */}
      <rect x={0} y={860} width={W} height={FLOOR_Y - 860} fill={panel} />
      <rect x={0} y={860} width={W} height={18} fill={shade(panel, 0.2)} />
      <rect x={0} y={878} width={W} height={6} fill={shade(panel, -0.3)} />
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={i}>
          <rect x={i * 160 + 14} y={904} width={132} height={250} rx={6} fill={shade(panel, -0.12)} />
          <rect x={i * 160 + 24} y={914} width={112} height={230} rx={4} fill={shade(panel, 0.05)} />
        </g>
      ))}
      <rect x={0} y={FLOOR_Y - 26} width={W} height={26} fill={shade(panel, -0.35)} />
      {/* высокое кресло судьи (стол и подиум — передний слой) */}
      <g>
        <rect x={440} y={640} width={200} height={300} rx={40} fill="#6a1d16" />
        <rect x={456} y={656} width={168} height={270} rx={30} fill="#8a2a20" />
        {[480, 520, 560, 600].map((x) => [700, 760, 820].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={5} fill="#5a1610" />))}
        <rect x={430} y={630} width={220} height={24} rx={12} fill={wood} />
        <circle cx={540} cy={624} r={14} fill={GOLD} />
      </g>
      {/* клетка подсудимого: задняя решётка и лавка (dock); передняя решётка и барьер — передний слой */}
      <g>
        <rect x={dockX - 160} y={680} width={320} height={FLOOR_Y - 680} fill="#00000022" />
        {Array.from({ length: 11 }).map((_, i) => <rect key={i} x={dockX - 156 + i * 31} y={690} width={6} height={FLOOR_Y - 690} fill="#4a4f58" opacity={0.6} />)}
        <rect x={dockX - 140} y={top + 24 * s1} width={280} height={FLOOR_Y - top - 24 * s1} fill={shade(wood, -0.35)} />
        <rect x={dockX - 150} y={top - 4} width={300} height={28 * s1} rx={6} fill={shade(wood, 0.1)} />
        <rect x={dockX - 150} y={top - 4} width={300} height={7} rx={3} fill={shade(wood, 0.3)} />
      </g>
      {/* пол: паркет «ёлочкой» и ковровая дорожка */}
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill={palette.floor} />
      <rect x={0} y={FLOOR_Y} width={W} height={14} fill="#00000025" />
      {Array.from({ length: 8 }).flatMap((_, r) =>
        Array.from({ length: 14 }).map((__, c) => {
          const y = FLOOR_Y + 20 + r * 92;
          const x = c * 80 + (r % 2) * 40 - 40;
          return <path key={`${r}-${c}`} d={`M${x} ${y} l40 20 l40 -20`} stroke={shade(palette.floor, -0.12)} strokeWidth={4} fill="none" />;
        }),
      )}
      <path d={`M400 ${FLOOR_Y} H680 L860 ${H} H220 Z`} fill={shade(accent, -0.1)} />
      <path d={`M420 ${FLOOR_Y} H660 L830 ${H} H250 Z`} fill={accent} />
      <path d={`M440 ${FLOOR_Y} H640 L800 ${H} H280 Z`} fill="none" stroke={GOLD} strokeWidth={6} opacity={0.6} />
    </Canvas>
  );
};
