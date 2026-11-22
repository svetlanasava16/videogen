import { Canvas, Room, W, H, FLOOR_Y, type BackdropProps, type Palette } from "./parts";
import { SeatAt, BenchAt } from "./gostinaya";
import { mix, dark, light, WallShade, FloorShade, FloorPlanks, Glow, Shadow, rnd } from "./bolnitsa";
import { depthScale, feetY, seatTopY } from "../world/depth";

const WOOD = "#8a5a3a";

/** Люстра: штанга, золотые рожки, лампочки-свечи с ореолом (над плашкой рассказчика). */
const Chandelier = ({ x, y = 0, len = 50, s = 1 }: { x: number; y?: number; len?: number; s?: number }) => (
  <g>
    <Glow cx={x} cy={y + len + 40 * s} rx={240 * s} ry={130 * s} opacity={0.55} />
    <rect x={x - 3} y={y} width={6} height={len} fill={dark(GOLD, 0.3)} />
    <path d={`M${x - 110 * s} ${y + len + 40 * s} Q${x} ${y + len + 100 * s} ${x + 110 * s} ${y + len + 40 * s}`} stroke={GOLD} strokeWidth={8 * s} fill="none" />
    <path d={`M${x - 60 * s} ${y + len + 50 * s} Q${x} ${y + len + 80 * s} ${x + 60 * s} ${y + len + 50 * s}`} stroke={GOLD} strokeWidth={6 * s} fill="none" />
    <ellipse cx={x} cy={y + len + 30 * s} rx={22 * s} ry={30 * s} fill={GOLD} />
    {[-110, -60, 0, 60, 110].map((dx, i) => {
      const yy = y + len + (i === 2 ? 60 : Math.abs(dx) > 100 ? 40 : 50) * s;
      return (
        <g key={dx}>
          <rect x={x + dx * s - 6 * s} y={yy - 30 * s} width={12 * s} height={30 * s} rx={3 * s} fill="#fbf6e4" />
          <ellipse cx={x + dx * s} cy={yy - 38 * s} rx={7 * s} ry={11 * s} fill="#fff1b0" />
          <ellipse cx={x + dx * s} cy={yy} rx={14 * s} ry={6 * s} fill={dark(GOLD, 0.15)} />
        </g>
      );
    })}
    {[-80, -30, 30, 80].map((dx) => <ellipse key={dx} cx={x + dx * s} cy={y + len + 92 * s} rx={5 * s} ry={9 * s} fill="#e8f2f8" opacity={0.8} />)}
  </g>
);

/** Флаг на древке: ткань свисает складками (цвета без конкретной страны). */
const Flag = ({ x, top, base, colors }: { x: number; top: number; base: number; colors: string[] }) => {
  const w = 110;
  const h = 210;
  const sh = h / colors.length;
  return (
    <g>
      <rect x={x - 5} y={top} width={10} height={base - top} fill={dark(GOLD, 0.25)} />
      <circle cx={x} cy={top - 6} r={11} fill={GOLD} />
      <ellipse cx={x} cy={base - 4} rx={34} ry={9} fill={dark(GOLD, 0.3)} />
      {colors.map((c, i) => (
        <path key={i} d={`M${x + 5} ${top + 14 + i * sh} q${w * 0.5} 12 ${w} 0 v${sh} q${-w * 0.5} 12 ${-w} 0 Z`} fill={c} />
      ))}
      {[0.3, 0.65].map((t) => <rect key={t} x={x + 5 + w * t} y={top + 18} width={6} height={h - 4} fill="#000000" opacity={0.1} />)}
    </g>
  );
};

/** Букет в вазе. */
const Bouquet = ({ x, y, s = 1, vase = "#d6ecf5" }: { x: number; y: number; s?: number; vase?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[[-26, -64, "#e86a6a"], [0, -78, "#f2c230"], [24, -62, "#ffffff"], [-12, -50, "#f2a0c0"], [14, -46, "#e86a6a"]].map(([dx, dy, c], i) => (
      <g key={i}>
        <line x1={0} y1={-20} x2={dx as number} y2={dy as number} stroke="#4f8a4a" strokeWidth={4} />
        <circle cx={dx as number} cy={dy as number} r={13} fill={c as string} />
        <circle cx={dx as number} cy={dy as number} r={5} fill="#f2d060" />
      </g>
    ))}
    <ellipse cx={-30} cy={-34} rx={8} ry={16} fill="#5b8c5a" transform="rotate(-40 -30 -34)" />
    <ellipse cx={30} cy={-30} rx={8} ry={16} fill="#5b8c5a" transform="rotate(40 30 -30)" />
    <path d="M-16 -24 h32 l-4 24 h-24 Z" fill={vase} />
  </g>
);

/**
 * Фон «zal»: актовый зал / зал заседаний — низкая сцена с трибуной и микрофоном, транспарант, ряды кресел внизу кадра.
 * Варианты (content/locations/zal.json → bible.variants): theater (сцена с красным занавесом и рампой),
 * museum (картины, статуя на постаменте, ограждение с канатом), cinema (кинозал: экран с лайнером, ряды красных кресел). Остальное — базовый зал (conference-hall).
 * Зал: сцена — дальний план (стопы на y 1190): президиум из трёх стульев (seat-1…3) и трибуна (lectern);
 * трибуна — передний слой (layer="front", content/locations/zal.json → front.z = 0.98): оратор на метке lectern (z 1)
 * скрыт ею ниже пояса, верх трибуны — поверхность для предметов (surfaces.top 247 → y 994).
 * средний и передний планы — пол зала перед сценой. Театр: передний ряд кресел зрителей (seat-1…4) на переднем плане.
 * Музей: банкетка посреди зала на среднем плане (bench-1, bench-2).
 * Кино: экран на дальней стене, средний ряд кресел (seat-1…4, z 0.5) и задний ряд (back-1…3, z 0.8),
 * проход слева (aisle), дверь с табличкой выхода (exit); массовка зрителей сидит у экрана.
 */

const GOLD = "#d9a630";

/** Ряды спинок кресел у нижнего края кадра (мы смотрим из зала). aisle — x прохода. */
const SeatRows = ({ color, aisle = 130, y1 = 1600, y2 = 1750 }: { color: string; aisle?: number; y1?: number; y2?: number }) => {
  const row = (y: number, w: number, h: number, gap: number, shift: number) => {
    const xs: number[] = [];
    for (let x = -w / 2 + shift; x < W + w; x += w + gap) if (Math.abs(x + w / 2 - aisle) > w * 0.7) xs.push(x);
    return xs.map((x) => (
      <g key={`${y}-${x}`}>
        <rect x={x} y={y} width={w} height={h} rx={w * 0.32} fill={color} />
        <rect x={x + w * 0.14} y={y + h * 0.14} width={w * 0.72} height={h * 0.5} rx={w * 0.22} fill={light(color, 0.12)} />
        <rect x={x} y={y + h - 26} width={w} height={26} fill={dark(color, 0.25)} />
      </g>
    ));
  };
  return (
    <g>
      {row(y1, 118, 140, 16, 30)}
      {row(y2, 156, 240, 18, 0)}
    </g>
  );
};

/** Трибуна с гербом-кружком и микрофоном на гусиной шее; низ — на уровне base. */
const Lectern = ({ x, base, accent }: { x: number; base: number; accent: string }) => (
  <g>
    <path d={`M${x - 70} ${base} L${x - 58} ${base - 170} L${x + 58} ${base - 170} L${x + 70} ${base} Z`} fill={WOOD} />
    <path d={`M${x - 80} ${base - 168} L${x + 80} ${base - 168} L${x + 72} ${base - 196} L${x - 72} ${base - 196} Z`} fill={dark(WOOD, 0.2)} />
    <rect x={x - 44} y={base - 150} width={88} height={130} rx={8} fill={dark(WOOD, 0.12)} />
    <circle cx={x} cy={base - 96} r={30} fill={accent} />
    <circle cx={x} cy={base - 96} r={16} fill={GOLD} />
    {/* микрофон */}
    <path d={`M${x + 30} ${base - 196} Q${x + 34} ${base - 260} ${x + 4} ${base - 290}`} stroke="#2a2a30" strokeWidth={7} fill="none" strokeLinecap="round" />
    <rect x={x - 12} y={base - 320} width={22} height={40} rx={11} fill="#3d3d46" transform={`rotate(-40 ${x} ${base - 300})`} />
    {/* стакан воды */}
    <rect x={x - 60} y={base - 226} width={22} height={30} rx={4} fill="#d6ecf5" opacity={0.9} />
  </g>
);

/** Транспарант без букв: полоса цвета accent со светлыми «строками». */
const Banner = ({ x, y, w, accent }: { x: number; y: number; w: number; accent: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={96} rx={6} fill={accent} />
    <rect x={x} y={y + 84} width={w} height={12} fill={dark(accent, 0.25)} />
    {[0.08, 0.2, 0.33, 0.46, 0.6, 0.73, 0.86].map((t, i) => (
      <rect key={t} x={x + w * t} y={y + 28} width={w * (i % 2 ? 0.09 : 0.11)} height={30} rx={6} fill={light(accent, 0.75)} />
    ))}
    <rect x={x - 8} y={y - 6} width={16} height={108} rx={6} fill={GOLD} />
    <rect x={x + w - 8} y={y - 6} width={16} height={108} rx={6} fill={GOLD} />
  </g>
);

/** Боковая драпировка: панель с вертикальными складками. */
const Drape = ({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={color} />
    {Array.from({ length: Math.max(2, Math.round(w / 44)) }).map((_, i, a) => (
      <rect key={i} x={x + ((i + 0.5) / a.length) * w - 7} y={y} width={14} height={h} rx={7} fill={dark(color, 0.18)} />
    ))}
  </g>
);

/* ---------- базовый зал заседаний: сцена на дальнем плане ---------- */
const Hall = ({ palette: p }: { palette: Palette }) => {
  const stageTop = FLOOR_Y - 40; // настил сцены: дальний план стоит на нём (стопы y 1190)
  const stageBase = FLOOR_Y + 42; // фасад сцены, ниже — пол зала (средний и передний план)
  const stageWood = mix(WOOD, p.wall, 0.15);
  return (
    <>
      <Room wall={p.wall} floor={p.floor} floorY={stageBase} />
      <WallShade y1={stageBase} />
      <FloorPlanks color={p.floor} step={80} rows={9} y0={stageBase} />
      <FloorShade y0={stageBase} />
      {/* карниз и люстры */}
      <rect x={0} y={270} width={W} height={18} fill={light(p.wall, 0.3)} />
      <rect x={0} y={288} width={W} height={8} fill={dark(p.wall, 0.15)} />
      <Chandelier x={250} len={40} s={0.9} />
      <Chandelier x={830} len={40} s={0.9} />
      {/* высокие окна по краям */}
      {[16, 954].map((x) => (
        <g key={x}>
          <rect x={x} y={300} width={110} height={560} rx={55} fill={light(p.wall, 0.4)} />
          <rect x={x + 14} y={316} width={82} height={528} rx={41} fill="#cfe6f5" />
          <rect x={x + 50} y={316} width={10} height={528} fill={light(p.wall, 0.4)} />
          <rect x={x + 22} y={340} width={14} height={200} rx={7} fill="#ffffff" opacity={0.5} />
          <rect x={x - 6} y={850} width={122} height={16} rx={5} fill={light(p.wall, 0.3)} />
          <path d={`M${x + 14} 316 V844 L${x + 40} 844 Q${x + 30} 560 ${x + 50} 316 Z`} fill={light(p.accent, 0.1)} opacity={0.6} />
        </g>
      ))}
      {/* ниша сцены: стена чуть темнее, драпировки, ламбрекен */}
      <rect x={140} y={360} width={800} height={stageTop - 360} fill={dark(p.wall, 0.1)} />
      <Drape x={140} y={360} w={110} h={stageTop - 360} color={p.accent} />
      <Drape x={830} y={360} w={110} h={stageTop - 360} color={p.accent} />
      <path d={`M140 360 H940 V408 ${Array.from({ length: 8 }).map((_, i) => `Q${940 - i * 100 - 50} 452 ${940 - (i + 1) * 100} 408`).join(" ")} Z`} fill={dark(p.accent, 0.12)} />
      <Glow cx={540} cy={stageTop - 20} rx={420} ry={120} opacity={0.4} />
      <Banner x={280} y={470} w={520} accent={p.accent} />
      {/* эмблема-лавровый венок под транспарантом */}
      <circle cx={540} cy={640} r={40} fill={GOLD} opacity={0.9} />
      <circle cx={540} cy={640} r={26} fill={p.accent} />
      {[-1, 1].map((d) => [0, 1, 2, 3].map((i) => (
        <ellipse key={`${d}${i}`} cx={540 + d * (52 + i * 4)} cy={668 - i * 22} rx={8} ry={16} fill={GOLD} transform={`rotate(${d * (30 + i * 15)} ${540 + d * (52 + i * 4)} ${668 - i * 22})`} />
      )))}
      <Flag x={262} top={720} base={stageTop} colors={[light(p.accent, 0.85), p.accent, GOLD]} />
      <Flag x={790} top={720} base={stageTop} colors={[light(p.accent, 0.85), p.accent, GOLD]} />
      {/* сцена: настил и фасад во всю ширину, ступени слева */}
      <rect x={0} y={stageTop} width={W} height={46} fill={light(stageWood, 0.15)} />
      <rect x={0} y={stageTop + 40} width={W} height={stageBase - stageTop - 40} fill={dark(stageWood, 0.18)} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={20 + i * 108} y={stageTop + 52} width={84} height={stageBase - stageTop - 60} rx={6} fill={dark(stageWood, 0.26)} />
      ))}
      {/* столик президиума с графином слева */}
      <rect x={160} y={stageTop - 170} width={150} height={16} rx={5} fill={dark(WOOD, 0.1)} />
      <rect x={166} y={stageTop - 156} width={138} height={156} fill="#3f6b4f" />
      <path d={`M210 ${stageTop - 170} L204 ${stageTop - 200} Q204 ${stageTop - 216} 214 ${stageTop - 220} L214 ${stageTop - 236} L224 ${stageTop - 236} L224 ${stageTop - 220} Q234 ${stageTop - 216} 234 ${stageTop - 200} L228 ${stageTop - 170} Z`} fill="#d6ecf5" opacity={0.9} />
      <rect x={256} y={stageTop - 196} width={18} height={26} rx={4} fill="#d6ecf5" opacity={0.85} />
      <Bouquet x={288} y={stageTop - 170} s={0.8} />
      <rect x={166} y={stageTop - 156} width={138} height={14} fill={GOLD} opacity={0.8} />
      {/* президиум: три стула на сцене */}
      {[0.36, 0.47, 0.58].map((x) => (
        <SeatAt key={x} x={x} z={1} kind="chair" color={dark(WOOD, 0.05)} pad={p.accent} back={170} />
      ))}
      {/* трибуна (lectern) — передний слой: Zal layer="front" */}
      {/* цветы в горшках по углам сцены */}
      <Bouquet x={60} y={stageTop + 4} s={1.1} vase={dark(p.accent, 0.1)} />
      <Bouquet x={1030} y={stageTop + 4} s={1.1} vase={dark(p.accent, 0.1)} />
      {/* пол зала и кресла */}
      <rect x={0} y={stageBase} width={W} height={10} fill="#00000026" />
      <SeatRows color={dark(p.accent, 0.15)} />
    </>
  );
};

/* ---------- theater: сцена с красным занавесом и рампой ---------- */
const Theater = ({ palette: p }: { palette: Palette }) => {
  const red = mix(p.accent, "#b3261e", 0.5);
  const back = "#2f2a3a";
  const boards = "#9a6a42";
  const edge = 1300;
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={back} />
      {/* расписной задник: небо, луна, холмы */}
      <rect x={120} y={330} width={840} height={FLOOR_Y - 330} fill="#5a7a9a" />
      <rect x={120} y={330} width={840} height={260} fill="#4a6a8c" />
      {Array.from({ length: 26 }).map((_, i) => {
        const x = 140 + rnd(i) * 800;
        const y = 440 + rnd(i + 50) * 300;
        return <circle key={i} cx={x} cy={y} r={2 + rnd(i + 9) * 3} fill="#fff6d6" opacity={0.75} />;
      })}
      <Glow cx={720} cy={520} rx={170} opacity={0.5} />
      <circle cx={720} cy={520} r={62} fill="#f2e6b8" />
      <circle cx={700} cy={505} r={12} fill="#e0d4a0" />
      <circle cx={735} cy={540} r={8} fill="#e0d4a0" />
      <path d="M260 600 q30 -24 70 -6 q30 -20 60 2 q20 14 -10 18 h-110 q-30 -2 -10 -14 Z" fill="#7a96b4" opacity={0.8} />
      {/* замок на холме */}
      <g fill="#3e5a78">
        <rect x={300} y={FLOOR_Y - 400} width={150} height={120} />
        <rect x={290} y={FLOOR_Y - 470} width={40} height={190} />
        <rect x={420} y={FLOOR_Y - 450} width={40} height={170} />
      </g>
      <path d={`M284 ${FLOOR_Y - 470} l26 -50 l26 50 Z M414 ${FLOOR_Y - 450} l26 -46 l26 46 Z`} fill="#3e5a78" />
      {[0, 1, 2].map((i) => <rect key={i} x={318 + i * 40} y={FLOOR_Y - 370} width={14} height={22} rx={7} fill="#f2d68a" />)}
      <rect x={302} y={FLOOR_Y - 440} width={14} height={20} rx={7} fill="#f2d68a" />
      <path d={`M120 ${FLOOR_Y - 230} Q330 ${FLOOR_Y - 400} 560 ${FLOOR_Y - 240} Q760 ${FLOOR_Y - 360} 960 ${FLOOR_Y - 220} V${FLOOR_Y} H120 Z`} fill="#4f7a5a" />
      <path d={`M120 ${FLOOR_Y - 120} Q400 ${FLOOR_Y - 230} 700 ${FLOOR_Y - 120} Q840 ${FLOOR_Y - 170} 960 ${FLOOR_Y - 110} V${FLOOR_Y} H120 Z`} fill="#3f6a4a" />
      {/* бутафорские деревья-кулисы на подпорках */}
      {[[200, 1], [880, -1]].map(([x, d]) => (
        <g key={x}>
          <path d={`M${x} ${FLOOR_Y - 40} L${x + 40 * d} ${FLOOR_Y - 120}`} stroke="#6b4a32" strokeWidth={10} />
          <rect x={x - 14} y={FLOOR_Y - 340} width={28} height={300} fill="#4a3a2a" />
          <circle cx={x} cy={FLOOR_Y - 420} r={90} fill="#2f5a3a" />
          <circle cx={x - 60} cy={FLOOR_Y - 360} r={60} fill="#2f5a3a" />
          <circle cx={x + 60} cy={FLOOR_Y - 370} r={64} fill="#2f5a3a" />
          <circle cx={x - 20} cy={FLOOR_Y - 450} r={40} fill="#3a6a46" />
        </g>
      ))}
      {/* сцена: доски до края рампы */}
      <rect x={0} y={FLOOR_Y - 40} width={W} height={edge - FLOOR_Y + 40} fill={boards} />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={0} y={FLOOR_Y - 20 + i * 22} width={W} height={3} fill={dark(boards, 0.2)} />
      ))}
      {/* пятно софита */}
      <ellipse cx={W / 2} cy={FLOOR_Y + 30} rx={420} ry={60} fill="#fff4cf" opacity={0.18} />
      <path d={`M440 0 L180 ${FLOOR_Y + 30} L900 ${FLOOR_Y + 30} L640 0 Z`} fill="#fff4cf" opacity={0.06} />
      {/* занавес: кулисы по бокам, ламбрекен сверху */}
      <Drape x={0} y={0} w={150} h={FLOOR_Y} color={red} />
      <Drape x={W - 150} y={0} w={150} h={FLOOR_Y} color={red} />
      <path d={`M150 0 Q170 ${FLOOR_Y * 0.55} 110 ${FLOOR_Y} H150 Z`} fill={dark(red, 0.25)} />
      <path d={`M${W - 150} 0 Q${W - 170} ${FLOOR_Y * 0.55} ${W - 110} ${FLOOR_Y} H${W - 150} Z`} fill={dark(red, 0.25)} />
      <rect x={60} y={720} width={110} height={26} rx={12} fill={GOLD} />
      <rect x={W - 170} y={720} width={110} height={26} rx={12} fill={GOLD} />
      {[150, W - 150].map((x) => (
        <g key={x}>
          <path d={`M${x} 746 q-6 30 0 60`} stroke={GOLD} strokeWidth={6} fill="none" />
          <path d={`M${x - 14} 800 h28 l-6 40 h-16 Z`} fill={GOLD} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={x - 12 + i * 7} y={838} width={4} height={26} fill={dark(GOLD, 0.15)} />)}
        </g>
      ))}
      <rect x={0} y={0} width={W} height={170} fill={red} />
      <path d={`M0 170 ${Array.from({ length: 9 }).map((_, i) => `Q${i * 120 + 60} 280 ${(i + 1) * 120} 170`).join(" ")} V150 H0 Z`} fill={red} />
      {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={i * 120 + 60} cy={232} r={10} fill={GOLD} />)}
      <rect x={0} y={150} width={W} height={14} fill={GOLD} />
      <rect x={0} y={0} width={W} height={18} fill={dark(red, 0.3)} />
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${i * 120 + 60} 240 l-10 30 h20 Z`} fill={GOLD} />)}
      {/* край сцены и рампа */}
      <rect x={0} y={edge} width={W} height={34} fill={dark(boards, 0.35)} />
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 60 + i * 120;
        return (
          <g key={i}>
            <circle cx={x} cy={edge - 4} r={46} fill="#fff4cf" opacity={0.14} />
            <path d={`M${x - 26} ${edge + 2} Q${x} ${edge - 30} ${x + 26} ${edge + 2} Z`} fill="#fff0b8" />
            <rect x={x - 30} y={edge} width={60} height={12} rx={4} fill="#3a3030" />
          </g>
        );
      })}
      {/* зал: тёмная яма и кресла */}
      <rect x={0} y={edge + 34} width={W} height={H - edge - 34} fill="#1e1a24" />
      <Glow cx={W / 2} cy={edge + 40} rx={600} ry={90} color="#fff0b8" opacity={0.18} />
      <SeatRows color={dark(red, 0.2)} aisle={-400} y1={1610} y2={1760} />
      {/* передний ряд кресел зрителей у рампы (метки seat-1…seat-4, передний план) */}
      {[0.28, 0.44, 0.6, 0.76].map((x) => (
        <SeatAt key={x} x={x} z={0} kind="theater" color={dark(red, 0.1)} back={46} />
      ))}
    </>
  );
};

/* ---------- museum: картины, статуя, канат ---------- */
const Painting = ({ x, y, w, h, kind }: { x: number; y: number; w: number; h: number; kind: "landscape" | "portrait" | "still" }) => (
  <g>
    <rect x={x + 4} y={y + 12} width={w + 12} height={h + 12} rx={8} fill="#000000" opacity={0.15} />
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={8} fill={dark(GOLD, 0.2)} />
    <rect x={x} y={y} width={w} height={h} rx={6} fill={GOLD} />
    <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={4} fill="none" stroke={light(GOLD, 0.35)} strokeWidth={3} />
    {[[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={9} fill={light(GOLD, 0.2)} />)}
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} fill={kind === "portrait" ? "#5a4a3a" : kind === "still" ? "#3d4f5f" : "#a9cbe0"} />
    {kind === "landscape" && (
      <>
        <circle cx={x + w * 0.72} cy={y + h * 0.32} r={h * 0.1} fill="#f2e6b8" />
        <path d={`M${x + 16} ${y + h - 16} L${x + w * 0.35} ${y + h * 0.45} L${x + w * 0.55} ${y + h * 0.7} L${x + w * 0.72} ${y + h * 0.5} L${x + w - 16} ${y + h - 16} Z`} fill="#5b8c5a" />
      </>
    )}
    {kind === "portrait" && (
      <>
        <path d={`M${x + w * 0.2} ${y + h - 16} Q${x + w / 2} ${y + h * 0.5} ${x + w * 0.8} ${y + h - 16} Z`} fill="#2f2620" />
        <ellipse cx={x + w / 2} cy={y + h * 0.42} rx={w * 0.17} ry={h * 0.14} fill="#e0b896" />
        <path d={`M${x + w * 0.32} ${y + h * 0.38} Q${x + w / 2} ${y + h * 0.18} ${x + w * 0.68} ${y + h * 0.38} Z`} fill="#2f2620" />
      </>
    )}
    {kind === "still" && (
      <>
        <rect x={x + w * 0.3} y={y + h * 0.35} width={w * 0.14} height={h * 0.4} rx={10} fill="#7fa36a" />
        <circle cx={x + w * 0.6} cy={y + h * 0.66} r={h * 0.1} fill="#c8553d" />
        <circle cx={x + w * 0.72} cy={y + h * 0.7} r={h * 0.08} fill="#e0a030" />
        <rect x={x + 16} y={y + h * 0.76} width={w - 32} height={h * 0.24 - 16} fill="#6b4a32" />
      </>
    )}
    <rect x={x + w / 2 - 30} y={y + h + 30} width={60} height={22} rx={3} fill="#f4efe2" />
  </g>
);

const Stanchion = ({ x }: { x: number }) => (
  <g fill={GOLD}>
    <ellipse cx={x} cy={FLOOR_Y - 4} rx={30} ry={9} />
    <rect x={x - 5} y={FLOOR_Y - 180} width={10} height={176} />
    <circle cx={x} cy={FLOOR_Y - 184} r={11} />
  </g>
);

const Museum = ({ palette: p }: { palette: Palette }) => {
  const wall = mix(p.wall, "#efe8da", 0.6);
  const floor = mix(p.floor, "#9a7a58", 0.5);
  const stone = "#e4e0d6";
  const stoneD = "#c9c3b6";
  return (
    <>
      <Room wall={wall} floor={floor} />
      <WallShade />
      {/* потолок с фонарём-световым люком, карниз */}
      <rect x={0} y={0} width={W} height={130} fill={light(wall, 0.25)} />
      <Glow cx={540} cy={90} rx={500} ry={160} opacity={0.5} />
      <rect x={240} y={10} width={600} height={90} rx={8} fill={dark(wall, 0.12)} />
      <rect x={252} y={20} width={576} height={70} rx={4} fill="#dcecf4" />
      {[1, 2, 3, 4, 5].map((i) => <rect key={i} x={252 + i * 96} y={20} width={6} height={70} fill={dark(wall, 0.12)} />)}
      <rect x={0} y={130} width={W} height={14} fill={dark(wall, 0.1)} />
      <rect x={0} y={330} width={W} height={20} fill={dark(wall, 0.12)} />
      {/* панели нижней части стены и плинтус */}
      <rect x={0} y={930} width={W} height={FLOOR_Y - 930} fill={dark(wall, 0.05)} />
      <rect x={0} y={922} width={W} height={10} fill={dark(wall, 0.14)} />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={i * 180 + 20} y={956} width={140} height={FLOOR_Y - 1010} rx={4} fill="none" stroke={dark(wall, 0.12)} strokeWidth={5} />
      ))}
      <rect x={0} y={FLOOR_Y - 30} width={W} height={30} fill={dark(wall, 0.25)} />
      {/* паркет ёлочкой: короткие плашки в перспективе */}
      <FloorPlanks color={floor} step={60} rows={14} o={0.2} />
      <FloorShade />
      {/* камера наблюдения в углу */}
      <rect x={0} y={420} width={30} height={14} fill="#3a3a40" />
      <rect x={20} y={428} width={60} height={30} rx={8} fill="#e8e8e4" transform="rotate(-20 30 440)" />
      <circle cx={78} cy={418} r={6} fill="#c8352d" />
      {/* трековые светильники над картинами */}
      <rect x={0} y={372} width={W} height={10} fill="#3a3a40" />
      {[245, 540, 820].map((x) => (
        <g key={x}>
          <rect x={x - 14} y={380} width={28} height={36} rx={6} fill="#3a3a40" />
          <path d={`M${x - 14} 416 L${x - 140} 800 L${x + 140} 800 L${x + 14} 416 Z`} fill="#fff4cf" opacity={0.1} />
        </g>
      ))}
      <Painting x={90} y={470} w={310} h={230} kind="landscape" />
      <Painting x={470} y={440} w={150} h={210} kind="portrait" />
      <Painting x={690} y={480} w={240} h={180} kind="still" />
      {/* амфора на тумбе между портретом и натюрмортом */}
      <Shadow cx={655} w={110} />
      <rect x={615} y={FLOOR_Y - 190} width={80} height={190} fill={stoneD} />
      <rect x={605} y={FLOOR_Y - 204} width={100} height={18} rx={3} fill={stone} />
      <path d={`M640 ${FLOOR_Y - 204} q-30 -40 -6 -90 q-10 -10 4 -18 h44 q14 8 4 18 q24 50 -6 90 Z`} fill="#b86a3a" />
      <path d={`M632 ${FLOOR_Y - 270} h46 v18 h-46 Z`} fill="#2b1d14" opacity={0.75} />
      <path d={`M640 ${FLOOR_Y - 262} l8 -8 l8 8 l8 -8 l8 8 l8 -8`} stroke="#e8b48a" strokeWidth={3} fill="none" />
      <path d={`M624 ${FLOOR_Y - 300} q-20 10 -6 34 M686 ${FLOOR_Y - 300} q20 10 6 34`} stroke="#b86a3a" strokeWidth={7} fill="none" />
      {/* ограждение с канатом перед пейзажем */}
      <Shadow cx={80} w={70} o={0.2} />
      <Shadow cx={410} w={70} o={0.2} />
      <Stanchion x={80} />
      <Stanchion x={410} />
      <path d={`M80 ${FLOOR_Y - 180} Q245 ${FLOOR_Y - 110} 410 ${FLOOR_Y - 180}`} stroke="#b4452f" strokeWidth={13} fill="none" strokeLinecap="round" />
      {/* статуя на постаменте */}
      <Shadow cx={965} w={240} o={0.2} />
      <rect x={880} y={FLOOR_Y - 250} width={170} height={250} fill={stoneD} />
      <rect x={866} y={FLOOR_Y - 270} width={198} height={28} rx={4} fill={stone} />
      <rect x={866} y={FLOOR_Y - 26} width={198} height={26} fill={stone} />
      <rect x={925} y={FLOOR_Y - 190} width={80} height={24} rx={3} fill={GOLD} />
      <g fill={stone}>
        <rect x={918} y={FLOOR_Y - 300} width={94} height={30} rx={6} />
        <path d={`M935 ${FLOOR_Y - 300} L940 ${FLOOR_Y - 420} L990 ${FLOOR_Y - 420} L998 ${FLOOR_Y - 300} Z`} />
        <path d={`M925 ${FLOOR_Y - 540} Q965 ${FLOOR_Y - 560} 1005 ${FLOOR_Y - 540} L998 ${FLOOR_Y - 410} L932 ${FLOOR_Y - 410} Z`} />
        <circle cx={965} cy={FLOOR_Y - 590} r={38} />
        <rect x={1000} y={FLOOR_Y - 640} width={22} height={110} rx={11} transform={`rotate(25 1011 ${FLOOR_Y - 530})`} />
      </g>
      <path d={`M944 ${FLOOR_Y - 420} L940 ${FLOOR_Y - 300}`} stroke={stoneD} strokeWidth={6} />
      <circle cx={952} cy={FLOOR_Y - 600} r={6} fill={stoneD} />
      {/* банкетка посреди зала (метки bench-1, bench-2, средний план) */}
      <Shadow cx={540} w={300} y={1275} o={0.18} />
      <BenchAt x0={0.38} x1={0.62} z={0.5} color="#7a4a3a" back={false} plinth />
    </>
  );
};

/* ---------- cinema: тёмный кинозал, экран с лайнером в море, ряды красных кресел ---------- */
const PLUSH = "#8a2a2a";

/** Кресло кинотеатра под меткой (x — доля кадра, z — план): верх подушки на seatTopY(z). */
const CinemaSeat = ({ x, z, color = PLUSH }: { x: number; z: number; color?: string }) => {
  const s = depthScale(z);
  const cx = x * W;
  const top = seatTopY(z);
  const fy = feetY(z);
  const hw = 60 * s;
  const bh = 92 * s;
  return (
    <g>
      <rect x={cx - hw + 4 * s} y={top - bh} width={hw * 2 - 8 * s} height={bh + 12 * s} rx={26 * s} fill={dark(color, 0.18)} />
      <rect x={cx - hw + 16 * s} y={top - bh + 12 * s} width={hw * 2 - 32 * s} height={bh * 0.62} rx={18 * s} fill={color} />
      {[-1, 0, 1].map((d) => <rect key={d} x={cx + d * hw * 0.42 - 3 * s} y={top - bh + 18 * s} width={6 * s} height={bh * 0.5} rx={3 * s} fill={dark(color, 0.14)} />)}
      <rect x={cx - hw + 16 * s} y={top - bh + 12 * s} width={hw * 2 - 32 * s} height={8 * s} rx={4 * s} fill={light(color, 0.18)} />
      <rect x={cx - 12 * s} y={top + 20 * s} width={24 * s} height={fy - top - 20 * s} fill="#1e1416" />
      <rect x={cx - hw + 8 * s} y={top + 16 * s} width={hw * 2 - 16 * s} height={(fy - top) * 0.32} rx={8 * s} fill={dark(color, 0.4)} />
      <rect x={cx - hw} y={top} width={hw * 2} height={24 * s} rx={10 * s} fill={color} />
      <rect x={cx - hw} y={top} width={hw * 2} height={8 * s} rx={5 * s} fill={light(color, 0.16)} />
    </g>
  );
};

/** Подлокотник-столик между креслами (от x0 до x1 в px), с подстаканником; cup — стакан попкорна. */
const ArmConsole = ({ x0, x1, z, cup = false }: { x0: number; x1: number; z: number; cup?: boolean }) => {
  const s = depthScale(z);
  const top = seatTopY(z) - 30 * s;
  const fy = feetY(z);
  const mid = (x0 + x1) / 2;
  return (
    <g>
      <rect x={x0} y={top} width={x1 - x0} height={fy - top} rx={8 * s} fill="#2a1c1e" />
      <rect x={x0 - 4 * s} y={top - 4 * s} width={x1 - x0 + 8 * s} height={16 * s} rx={8 * s} fill="#3a2a2c" />
      <ellipse cx={mid} cy={top + 3 * s} rx={14 * s} ry={5 * s} fill="#120c0d" />
      {cup && (
        <g>
          <path d={`M${mid - 22 * s} ${top - 64 * s} L${mid + 22 * s} ${top - 64 * s} L${mid + 15 * s} ${top + 2 * s} L${mid - 15 * s} ${top + 2 * s} Z`} fill="#f4efe2" />
          {[-1, 0, 1].map((d) => <path key={d} d={`M${mid + d * 15 * s - 4 * s} ${top - 64 * s} h${8 * s} l${-1.5 * s} ${66 * s} h${-5 * s} Z`} fill="#c8352d" />)}
          {[[-16, -70], [-4, -76], [8, -72], [18, -66], [-10, -64], [4, -66]].map(([dx, dy], i) => (
            <circle key={i} cx={mid + dx * s} cy={top + dy * s} r={9 * s} fill={i % 2 ? "#fbe7a0" : "#fff6d6"} />
          ))}
        </g>
      )}
    </g>
  );
};

/** Ряд кресел: кресла на xs (доли кадра), между соседними — подлокотники-столики; по краям — торцы. */
const CinemaRow = ({ xs, z, cups = [] as number[], color = PLUSH }: { xs: number[]; z: number; cups?: number[]; color?: string }) => {
  const s = depthScale(z);
  const hw = 60 * s;
  return (
    <g>
      <Shadow cx={((xs[0] + xs[xs.length - 1]) / 2) * W} w={(xs[xs.length - 1] - xs[0]) * W + 200} y={feetY(z)} o={0.3} h={10} />
      {xs.map((x, i) => {
        const l = x * W + hw;
        const r = i < xs.length - 1 ? xs[i + 1] * W - hw : l + 26 * s;
        return <ArmConsole key={`c${x}`} x0={l} x1={r} z={z} cup={cups.includes(i)} />;
      })}
      <ArmConsole x0={xs[0] * W - hw - 26 * s} x1={xs[0] * W - hw} z={z} />
      {xs.map((x) => <CinemaSeat key={x} x={x} z={z} color={color} />)}
    </g>
  );
};

/** Лайнер в море на экране (кадр фильма; без названий). Экран — прямоугольник x0..x1, y0..y1. */
const ScreenFilm = ({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) => {
  const w = x1 - x0;
  const h = y1 - y0;
  const hz = y0 + h * 0.6; // горизонт
  const X = (t: number) => x0 + w * t;
  const hullY = hz + h * 0.04;
  return (
    <g>
      <defs>
        <linearGradient id="cine-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f8fc4" />
          <stop offset="0.55" stopColor="#f0b08a" />
          <stop offset="1" stopColor="#fbd99a" />
        </linearGradient>
        <linearGradient id="cine-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a6a9a" />
          <stop offset="1" stopColor="#1f3a5a" />
        </linearGradient>
        <clipPath id="cine-screen">
          <rect x={x0} y={y0} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath="url(#cine-screen)">
        <rect x={x0} y={y0} width={w} height={hz - y0} fill="url(#cine-sky)" />
        <circle cx={X(0.78)} cy={hz - h * 0.06} r={h * 0.13} fill="#fde6a8" />
        <Glow cx={X(0.78)} cy={hz - h * 0.06} rx={h * 0.4} color="#ffe2a0" opacity={0.5} />
        {[[0.12, 0.16, 0.16], [0.42, 0.1, 0.12], [0.62, 0.22, 0.1]].map(([t, v, r], i) => (
          <g key={i} fill="#fbe3d0" opacity={0.75}>
            <ellipse cx={X(t)} cy={y0 + h * v} rx={w * r} ry={h * 0.035} />
            <ellipse cx={X(t) + w * 0.03} cy={y0 + h * v - h * 0.03} rx={w * r * 0.5} ry={h * 0.035} />
          </g>
        ))}
        <rect x={x0} y={hz} width={w} height={y1 - hz} fill="url(#cine-sea)" />
        <path d={`M${X(0.66)} ${hz + 4} L${X(0.9)} ${hz + 4} L${X(0.84)} ${y1} L${X(0.72)} ${y1} Z`} fill="#fde6a8" opacity={0.25} />
        {Array.from({ length: 9 }).map((_, i) => {
          const y = hz + 16 + i * ((y1 - hz) / 9);
          return <path key={i} d={`M${X(0.05 + rnd(i) * 0.5)} ${y} q14 -8 28 0 q14 -8 28 0 M${X(0.5 + rnd(i + 9) * 0.4)} ${y + 8} q12 -7 24 0 q12 -7 24 0`} stroke="#a9cbe0" strokeWidth={3} fill="none" opacity={0.6} />;
        })}
        {/* айсберг на горизонте */}
        <path d={`M${X(0.86)} ${hz + 2} L${X(0.9)} ${hz - h * 0.09} L${X(0.92)} ${hz - h * 0.06} L${X(0.95)} ${hz - h * 0.12} L${X(1.0)} ${hz + 2} Z`} fill="#eaf4fb" />
        <path d={`M${X(0.92)} ${hz - h * 0.06} L${X(0.95)} ${hz - h * 0.12} L${X(1.0)} ${hz + 2} L${X(0.94)} ${hz + 2} Z`} fill="#b8d4e8" />
        {/* дым из труб */}
        {[0.3, 0.38, 0.46, 0.54].map((t, i) => (
          <g key={t} fill="#8a8a96" opacity={0.45}>
            <ellipse cx={X(t) - 30} cy={hullY - h * 0.33} rx={30} ry={14} />
            <ellipse cx={X(t) - 75 - i * 5} cy={hullY - h * 0.37} rx={38} ry={16} />
            <ellipse cx={X(t) - 130 - i * 8} cy={hullY - h * 0.4} rx={44} ry={16} opacity={0.6} />
          </g>
        ))}
        {/* лайнер: чёрный корпус, белые палубы, четыре трубы; плывёт вправо */}
        <g>
          <path d={`M${X(0.16)} ${hullY - h * 0.1} L${X(0.7)} ${hullY - h * 0.1} L${X(0.66)} ${hullY + h * 0.06} L${X(0.2)} ${hullY + h * 0.06} Z`} fill="#1e1e26" />
          <rect x={X(0.2)} y={hullY + h * 0.03} width={w * 0.46} height={h * 0.03} fill="#a8302a" />
          <rect x={X(0.22)} y={hullY - h * 0.16} width={w * 0.4} height={h * 0.06} fill="#f4efe2" />
          <rect x={X(0.26)} y={hullY - h * 0.2} width={w * 0.3} height={h * 0.04} fill="#efe8d8" />
          {Array.from({ length: 22 }).map((_, i) => (
            <circle key={i} cx={X(0.2 + i * 0.022)} cy={hullY - h * 0.06} r={3} fill="#fde6a8" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={X(0.235 + i * 0.024)} y={hullY - h * 0.145} width={8} height={7} fill="#7a8aa0" />
          ))}
          {[0.3, 0.38, 0.46, 0.54].map((t) => (
            <g key={t}>
              <path d={`M${X(t) - 14} ${hullY - h * 0.2} L${X(t) - 8} ${hullY - h * 0.32} L${X(t) + 18} ${hullY - h * 0.32} L${X(t) + 14} ${hullY - h * 0.2} Z`} fill="#e0a040" />
              <path d={`M${X(t) - 8} ${hullY - h * 0.32} L${X(t) - 7} ${hullY - h * 0.29} L${X(t) + 17} ${hullY - h * 0.29} L${X(t) + 18} ${hullY - h * 0.32} Z`} fill="#1e1e26" />
            </g>
          ))}
          <path d={`M${X(0.21)} ${hullY - h * 0.16} L${X(0.215)} ${hullY - h * 0.36} M${X(0.64)} ${hullY - h * 0.1} L${X(0.635)} ${hullY - h * 0.34}`} stroke="#2a2a32" strokeWidth={3} />
          <path d={`M${X(0.215)} ${hullY - h * 0.36} L${X(0.635)} ${hullY - h * 0.34}`} stroke="#2a2a32" strokeWidth={1.5} opacity={0.7} />
          {/* носовая волна и пенный след */}
          <path d={`M${X(0.66)} ${hullY + h * 0.06} q${w * 0.04} -10 ${w * 0.07} 4 q-${w * 0.03} 8 -${w * 0.07} 4 Z`} fill="#ffffff" opacity={0.85} />
          <path d={`M${X(0.2)} ${hullY + h * 0.06} q-${w * 0.08} -6 -${w * 0.16} 6`} stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.6} strokeLinecap="round" />
        </g>
      </g>
      {/* свет экрана: лёгкая виньетка по краям */}
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke="#000000" strokeWidth={18} opacity={0.18} />
    </g>
  );
};

/** Табличка выхода: зелёный светящийся короб, бегущий человечек и стрелка. */
const ExitSign = ({ x, y, w = 130, h = 54 }: { x: number; y: number; w?: number; h?: number }) => (
  <g>
    <Glow cx={x + w / 2} cy={y + h / 2} rx={w * 1.1} ry={h * 1.8} color="#5af08a" opacity={0.35} />
    <rect x={x} y={y} width={w} height={h} rx={6} fill="#1d8a4a" />
    <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={4} fill="#2fbf68" />
    {/* человечек бежит в дверь */}
    <g fill="#f4fff6" stroke="#f4fff6" strokeLinecap="round">
      <circle cx={x + 26} cy={y + 14} r={5} stroke="none" />
      <path d={`M${x + 24} ${y + 20} L${x + 20} ${y + 33} M${x + 24} ${y + 22} L${x + 32} ${y + 28} M${x + 23} ${y + 22} L${x + 14} ${y + 26} M${x + 20} ${y + 33} L${x + 28} ${y + 44} M${x + 20} ${y + 33} L${x + 12} ${y + 42}`} strokeWidth={5} fill="none" />
    </g>
    <rect x={x + 44} y={y + 10} width={26} height={h - 20} fill="none" stroke="#f4fff6" strokeWidth={4} />
    <path d={`M${x + 82} ${y + h / 2} h${w - 104} M${x + w - 34} ${y + h / 2 - 10} l12 10 l-12 10`} stroke="#f4fff6" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** Бархатная штора у экрана: складки и подсветка снизу. */
const Curtain = ({ x, w, y0, y1, color }: { x: number; w: number; y0: number; y1: number; color: string }) => (
  <g>
    <rect x={x} y={y0} width={w} height={y1 - y0} fill={color} />
    {Array.from({ length: Math.max(2, Math.round(w / 30)) }).map((_, i, a) => (
      <rect key={i} x={x + ((i + 0.5) / a.length) * w - 5} y={y0} width={10} height={y1 - y0} rx={5} fill={dark(color, 0.3)} />
    ))}
    <rect x={x} y={y1 - 60} width={w} height={60} fill={light(color, 0.1)} opacity={0.4} />
  </g>
);

const Cinema = ({ palette: p }: { palette: Palette }) => {
  const wall = "#1e1820";
  const carpet = "#3a2228";
  const red = mix(p.accent, "#7a1e22", 0.6);
  const sx0 = 150;
  const sx1 = 930;
  const sy0 = 450;
  const sy1 = 880;
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      {/* потолок: тёмный, с точками-звёздочками */}
      <rect x={0} y={0} width={W} height={300} fill="#141018" />
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={rnd(i + 3) * W} cy={20 + rnd(i + 70) * 260} r={1.5 + rnd(i + 11) * 2} fill="#fff1c4" opacity={0.25 + rnd(i) * 0.4} />
      ))}
      <rect x={0} y={300} width={W} height={10} fill="#2a2228" />
      {/* стены: мягкие акустические панели, бра */}
      {Array.from({ length: 9 }).map((_, i) => (
        <g key={i}>
          <rect x={i * 120 + 6} y={330} width={108} height={FLOOR_Y - 360} rx={10} fill="#261d26" />
          <rect x={i * 120 + 14} y={340} width={92} height={FLOOR_Y - 380} rx={8} fill="#2c2230" />
        </g>
      ))}
      {[60, 1020].map((x) => (
        <g key={x}>
          <Glow cx={x} cy={420} rx={90} ry={120} color="#ffcf80" opacity={0.35} />
          <path d={`M${x - 20} 440 L${x - 14} 400 L${x + 14} 400 L${x + 20} 440 Z`} fill="#c89a5a" />
          <rect x={x - 4} y={440} width={8} height={18} fill="#6a5040" />
        </g>
      ))}
      {/* свет от экрана на стенах и полу */}
      <Glow cx={540} cy={(sy0 + sy1) / 2} rx={640} ry={420} color="#9ab8e0" opacity={0.28} />
      {/* занавес и ламбрекен вокруг экрана */}
      <rect x={sx0 - 20} y={sy0 - 20} width={sx1 - sx0 + 40} height={sy1 - sy0 + 40} fill="#08080a" />
      <ScreenFilm x0={sx0} y0={sy0} x1={sx1} y1={sy1} />
      <Curtain x={70} w={90} y0={sy0 - 70} y1={FLOOR_Y - 70} color={red} />
      <Curtain x={920} w={90} y0={sy0 - 70} y1={FLOOR_Y - 70} color={red} />
      <rect x={60} y={sy0 - 96} width={960} height={40} fill={dark(red, 0.1)} />
      <path d={`M60 ${sy0 - 56} ${Array.from({ length: 8 }).map((_, i) => `Q${60 + i * 120 + 60} ${sy0 - 20} ${60 + (i + 1) * 120} ${sy0 - 56}`).join(" ")} Z`} fill={dark(red, 0.1)} />
      <rect x={60} y={sy0 - 100} width={960} height={8} fill={GOLD} opacity={0.7} />
      {/* луч проектора из-за спины: от окошка аппаратной к экрану, пылинки */}
      <path d={`M500 0 L580 0 L${sx1} ${sy0} L${sx0} ${sy0} Z`} fill="#dfeaff" opacity={0.07} />
      <path d={`M520 0 L560 0 L${sx1 - 120} ${sy0} L${sx0 + 120} ${sy0} Z`} fill="#eef4ff" opacity={0.07} />
      <path d={`M530 0 L550 0 L${640} ${sy0} L${440} ${sy0} Z`} fill="#ffffff" opacity={0.06} />
      <Glow cx={540} cy={0} rx={120} ry={60} color="#eef4ff" opacity={0.6} />
      {Array.from({ length: 30 }).map((_, i) => {
        const t = rnd(i + 21);
        const y = 20 + t * (sy0 - 40);
        const half = 40 + t * ((sx1 - sx0) / 2 - 40);
        return <circle key={i} cx={540 + (rnd(i + 5) * 2 - 1) * half * 0.9} cy={y} r={1.5 + rnd(i + 8) * 2} fill="#ffffff" opacity={0.35} />;
      })}
      {/* под экраном: невысокая сцена, колонки по бокам */}
      <rect x={0} y={sy1 + 20} width={W} height={FLOOR_Y - sy1 - 20} fill="#18131a" />
      <rect x={160} y={FLOOR_Y - 90} width={760} height={90} fill="#221a22" />
      <rect x={160} y={FLOOR_Y - 96} width={760} height={10} fill="#3a2c34" />
      {[250, 830].map((x) => (
        <g key={x}>
          <rect x={x - 40} y={FLOOR_Y - 250} width={80} height={160} rx={8} fill="#121014" />
          <circle cx={x} cy={FLOOR_Y - 205} r={22} fill="#26222a" />
          <circle cx={x} cy={FLOOR_Y - 140} r={30} fill="#26222a" />
          <circle cx={x} cy={FLOOR_Y - 140} r={10} fill="#121014" />
        </g>
      ))}
      {/* дверь выхода слева у дальней стены и табличка над ней */}
      <rect x={6} y={FLOOR_Y - 300} width={118} height={300} rx={4} fill="#120e12" />
      <rect x={14} y={FLOOR_Y - 292} width={102} height={292} fill="#2e2630" />
      <rect x={20} y={FLOOR_Y - 286} width={44} height={286} fill="#342a36" />
      <rect x={66} y={FLOOR_Y - 286} width={44} height={286} fill="#2a222c" />
      <rect x={30} y={FLOOR_Y - 160} width={70} height={10} rx={5} fill="#8a8a96" />
      <ExitSign x={0} y={FLOOR_Y - 372} />
      <Glow cx={64} cy={FLOOR_Y - 200} rx={110} ry={180} color="#5af08a" opacity={0.12} />
      {/* пол: ковёр с узором, подсветка ступенек в проходе слева */}
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill={carpet} />
      <FloorShade strength={0.4} />
      {Array.from({ length: 10 }).map((_, i) => {
        const y = FLOOR_Y + 30 + i * i * 9 + i * 30;
        return <rect key={i} x={0} y={y} width={W} height={3 + i * 0.6} fill="#000000" opacity={0.12} />;
      })}
      {Array.from({ length: 6 }).map((_, i) => {
        const y = FLOOR_Y + 24 + i * 70 + i * i * 6;
        return (
          <g key={i}>
            <Glow cx={66} cy={y} rx={50} ry={14} color="#ffd88a" opacity={0.5} />
            <rect x={44} y={y - 3} width={44} height={6} rx={3} fill="#ffe2a0" />
          </g>
        );
      })}
      {/* дальние ряды у экрана: спинки кресел (за ними сидит массовка зрителей) */}
      {[FLOOR_Y - 60, FLOOR_Y - 20].map((y, ri) => (
        <g key={y}>
          {Array.from({ length: 9 }).map((_, i) => {
            const w = 84 + ri * 8;
            const x = 150 + i * (w + 8) + (ri ? -20 : 20);
            if (x + w > 1000) return null;
            return (
              <g key={i}>
                <rect x={x} y={y} width={w} height={70} rx={20} fill={dark(PLUSH, 0.25 - ri * 0.08)} />
                <rect x={x + 10} y={y + 8} width={w - 20} height={30} rx={12} fill={dark(PLUSH, 0.1 - ri * 0.05)} />
              </g>
            );
          })}
        </g>
      ))}
      {/* задний ряд (back-1…3, z 0.8) и средний ряд (seat-1…4, z 0.5) */}
      <CinemaRow xs={[0.3, 0.5, 0.7, 0.9]} z={0.8} cups={[2]} />
      <CinemaRow xs={[0.2, 0.4, 0.6, 0.8, 1.0]} z={0.5} cups={[3]} />
      {/* ближние ряды: спинки кресел у нижнего края кадра */}
      <SeatRows color={dark(PLUSH, 0.3)} aisle={60} y1={1620} y2={1770} />
    </>
  );
};

/** x центра трибуны: оратор на метке lectern (x 0.7) стоит за ней; левый край не заходит на стул seat-3 (x 0.58). */
const LECTERN_X = 768;

/** Актовый зал: базовый вид (conference-hall) + театр (theater) + музей (museum) + кинозал (cinema). */
export const Zal = ({ palette, variant, layer = "back" }: BackdropProps) => {
  if (layer === "front") {
    // передний слой только у базового зала: трибуна перед оратором (content/locations/zal.json → front.z = 0.98)
    if (variant === "theater" || variant === "museum" || variant === "cinema") return null;
    return <Canvas><Lectern x={LECTERN_X} base={FLOOR_Y} accent={palette.accent} /></Canvas>;
  }
  return (
    <Canvas>
      {variant === "theater" ? (
        <Theater palette={palette} />
      ) : variant === "museum" ? (
        <Museum palette={palette} />
      ) : variant === "cinema" ? (
        <Cinema palette={palette} />
      ) : (
        <Hall palette={palette} />
      )}
    </Canvas>
  );
};
