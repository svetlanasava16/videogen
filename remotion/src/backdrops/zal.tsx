import { Canvas, Room, W, H, FLOOR_Y, type BackdropProps, type Palette } from "./parts";
import { mix, dark, light, WOOD } from "./gostinaya";

/**
 * Фон «zal»: актовый зал / зал заседаний — низкая сцена с трибуной и микрофоном, транспарант, ряды кресел внизу кадра.
 * Варианты (content/locations/zal.json → bible.variants): theater (сцена с красным занавесом и рампой),
 * museum (картины, статуя на постаменте, ограждение с канатом). Остальное — базовый зал (conference-hall).
 * Середина пола (x 120…960) свободна: куклы стоят перед сценой / на сцене.
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

/* ---------- базовый зал заседаний ---------- */
const Hall = ({ palette: p }: { palette: Palette }) => {
  const stageTop = 960;
  const stageBase = 1110;
  const stageWood = mix(WOOD, p.wall, 0.15);
  return (
    <>
      <Room wall={p.wall} floor={p.floor} floorY={stageBase} />
      {/* высокие окна по краям */}
      {[16, 954].map((x) => (
        <g key={x}>
          <rect x={x} y={300} width={110} height={560} rx={55} fill={light(p.wall, 0.4)} />
          <rect x={x + 14} y={316} width={82} height={528} rx={41} fill="#cfe6f5" />
          <rect x={x + 50} y={316} width={10} height={528} fill={light(p.wall, 0.4)} />
        </g>
      ))}
      {/* ниша сцены: стена чуть темнее, драпировки, ламбрекен */}
      <rect x={140} y={360} width={800} height={stageTop - 360} fill={dark(p.wall, 0.1)} />
      <Drape x={140} y={360} w={110} h={stageTop - 360} color={p.accent} />
      <Drape x={830} y={360} w={110} h={stageTop - 360} color={p.accent} />
      <path d={`M140 360 H940 V408 ${Array.from({ length: 8 }).map((_, i) => `Q${940 - i * 100 - 50} 452 ${940 - (i + 1) * 100} 408`).join(" ")} Z`} fill={dark(p.accent, 0.12)} />
      <Banner x={280} y={470} w={520} accent={p.accent} />
      {/* президиум: стол под зелёным сукном с графином */}
      <rect x={300} y={880} width={330} height={20} rx={6} fill={dark(WOOD, 0.1)} />
      <rect x={306} y={898} width={318} height={stageTop - 898} fill="#3f6b4f" />
      <rect x={306} y={898} width={318} height={14} fill={dark("#3f6b4f", 0.2)} />
      <path d="M380 880 L372 840 Q372 816 386 810 L386 790 L398 790 L398 810 Q412 816 412 840 L404 880 Z" fill="#d6ecf5" opacity={0.9} />
      <rect x={440} y={846} width={20} height={34} rx={4} fill="#d6ecf5" opacity={0.85} />
      <rect x={500} y={862} width={90} height={18} rx={3} fill="#f4efe2" />
      {/* сцена: настил, фасад, ступени слева */}
      <rect x={160} y={stageTop} width={W - 160} height={30} fill={light(stageWood, 0.15)} />
      <rect x={160} y={stageTop + 30} width={W - 160} height={stageBase - stageTop - 30} fill={dark(stageWood, 0.18)} />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={190 + i * 112} y={stageTop + 50} width={86} height={stageBase - stageTop - 70} rx={6} fill={dark(stageWood, 0.26)} />
      ))}
      {[0, 1, 2].map((i) => {
        const y = stageTop + 6 + i * 48;
        return (
          <g key={i}>
            <rect x={110 - i * 50} y={y} width={50} height={stageBase - y} fill={dark(stageWood, 0.1 + i * 0.04)} />
            <rect x={110 - i * 50} y={y} width={50} height={12} fill={light(stageWood, 0.15)} />
          </g>
        );
      })}
      <Lectern x={800} base={stageTop + 4} accent={p.accent} />
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
      <circle cx={720} cy={520} r={62} fill="#f2e6b8" />
      <path d={`M120 ${FLOOR_Y - 230} Q330 ${FLOOR_Y - 400} 560 ${FLOOR_Y - 240} Q760 ${FLOOR_Y - 360} 960 ${FLOOR_Y - 220} V${FLOOR_Y} H120 Z`} fill="#4f7a5a" />
      <path d={`M120 ${FLOOR_Y - 120} Q400 ${FLOOR_Y - 230} 700 ${FLOOR_Y - 120} Q840 ${FLOOR_Y - 170} 960 ${FLOOR_Y - 110} V${FLOOR_Y} H120 Z`} fill="#3f6a4a" />
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
      <rect x={0} y={0} width={W} height={170} fill={red} />
      <path d={`M0 170 ${Array.from({ length: 9 }).map((_, i) => `Q${i * 120 + 60} 280 ${(i + 1) * 120} 170`).join(" ")} V150 H0 Z`} fill={red} />
      {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={i * 120 + 60} cy={232} r={10} fill={GOLD} />)}
      <rect x={0} y={150} width={W} height={14} fill={GOLD} />
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
      <SeatRows color={dark(red, 0.2)} aisle={-400} y1={1610} y2={1760} />
    </>
  );
};

/* ---------- museum: картины, статуя, канат ---------- */
const Painting = ({ x, y, w, h, kind }: { x: number; y: number; w: number; h: number; kind: "landscape" | "portrait" | "still" }) => (
  <g>
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={8} fill={dark(GOLD, 0.2)} />
    <rect x={x} y={y} width={w} height={h} rx={6} fill={GOLD} />
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
      {/* карниз, плинтус, паркет */}
      <rect x={0} y={330} width={W} height={20} fill={dark(wall, 0.12)} />
      <rect x={0} y={FLOOR_Y - 30} width={W} height={30} fill={dark(wall, 0.25)} />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d={`M${i * 100 - 40} ${H} L${i * 100 + 20} ${FLOOR_Y} L${i * 100 + 26} ${FLOOR_Y} L${i * 100 - 30} ${H} Z`} fill={dark(floor, 0.1)} />
      ))}
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
      {/* ограждение с канатом перед пейзажем */}
      <Stanchion x={80} />
      <Stanchion x={410} />
      <path d={`M80 ${FLOOR_Y - 180} Q245 ${FLOOR_Y - 110} 410 ${FLOOR_Y - 180}`} stroke="#b4452f" strokeWidth={13} fill="none" strokeLinecap="round" />
      {/* статуя на постаменте */}
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
    </>
  );
};

/** Актовый зал: базовый вид (conference-hall) + театр (theater) + музей (museum). */
export const Zal = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "theater" ? <Theater palette={palette} /> : variant === "museum" ? <Museum palette={palette} /> : <Hall palette={palette} />}
  </Canvas>
);
