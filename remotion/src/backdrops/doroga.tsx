import { Canvas, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { depthScale, feetY, seatTopY } from "../world/depth";
import { SeatFront, dark, light } from "./samolet";
import { Bin, Birds, Cracks, LampPost, LeafyTree, Label, Manhole, Paving, Pigeon, Puff, Sign, Skyline, Tufts, Win, rnd } from "./ulitsa";

/**
 * Фон «doroga»: дорога и транспорт. По умолчанию — загородная трасса: машины (world/Vehicles.tsx) едут по ближней
 * полосе (передний план, z ≈ 0.1), пешеходы — на дальней обочине (дальний план). Сублокации (id = scene.place):
 * car / taxi (машина спереди через лобовое стекло, седоки сидят лицом к зрителю), bus, subway, tram (салоны),
 * bus-stop (остановка с навесом), gas-station (заправка). Метки — content/locations/doroga.json.
 * Сиденья под метками с seat: верх подушки = seatTopY(z) (world/depth.ts).
 */

const GRASS = "#8fb86a";
const WHEAT = "#e6c46a";
const DIRT = "#c9b08a";
const ASPHALT = "#5f5f5f";
const INK = "#2b2a2e";
const WHITE = "#f4f1ea";
const RED = "#c8553d";
const RAIL = "#b8bec6";

/** Дорога поперёк кадра: асфальт y0..y1, разметка посередине, бордюр/обочина. */
const Road = ({ y0, y1, color = ASPHALT, kerb, dashed = true, line }: { y0: number; y1: number; color?: string; kerb?: string; dashed?: boolean; line?: number }) => {
  const mid = line ?? (y0 + y1) / 2;
  return (
    <g>
      <rect x={0} y={y0} width={W} height={y1 - y0} fill={color} />
      <rect x={0} y={y0} width={W} height={10} fill="#00000022" />
      {dashed && [20, 300, 580, 860].map((x) => <rect key={x} x={x} y={mid - 8} width={180} height={16} rx={6} fill="#f2e6d0" opacity={0.8} />)}
      {kerb && <rect x={0} y={y0 - 14} width={W} height={16} fill={kerb} />}
    </g>
  );
};

const RoadSign = ({ x, y = FLOOR_Y - 10, top = 600 }: { x: number; y?: number; top?: number }) => (
  <g>
    <rect x={x - 8} y={top + 80} width={16} height={y - top - 80} fill="#8a8f98" />
    <path d={`M${x} ${top} L${x + 80} ${top + 140} L${x - 80} ${top + 140} Z`} fill={RED} />
    <path d={`M${x} ${top + 30} L${x + 54} ${top + 124} L${x - 54} ${top + 124} Z`} fill="#fff8ec" />
    {/* значок «корова на дороге» без текста */}
    <ellipse cx={x} cy={top + 102} rx={22} ry={12} fill="#2b1d14" />
    <circle cx={x - 22} cy={top + 94} r={8} fill="#2b1d14" />
    <rect x={x - 14} y={top + 108} width={5} height={10} fill="#2b1d14" />
    <rect x={x + 10} y={top + 108} width={5} height={10} fill="#2b1d14" />
  </g>
);

/** Телеграфный столб: (x, y) — низ, top — верх. */
const Pole2 = ({ x, y, top, s = 1, color = "#7a5a40" }: { x: number; y: number; top: number; s?: number; color?: string }) => (
  <g>
    <rect x={x - 7 * s} y={top} width={14 * s} height={y - top} fill={color} />
    <rect x={x - 44 * s} y={top + 20 * s} width={88 * s} height={10 * s} rx={3 * s} fill={color} />
    <rect x={x - 30 * s} y={top + 50 * s} width={60 * s} height={8 * s} rx={3 * s} fill={color} />
    {[-38, -14, 14, 38].map((d) => <rect key={d} x={x + d * s - 4 * s} y={top + 8 * s} width={8 * s} height={14 * s} rx={3 * s} fill="#e8e4d8" />)}
  </g>
);

/** Провода между столбами (по верхним изоляторам). */
const Wires = ({ pts, color = "#3a3a40" }: { pts: [number, number][]; color?: string }) => (
  <g stroke={color} strokeWidth={2.5} fill="none" opacity={0.7}>
    {[-38, 38, -14].map((d, k) => (
      <path key={d} d={pts.map(([x, y], i) => (i === 0 ? `M${x + d} ${y + k * 6}` : `Q${(pts[i - 1][0] + x) / 2 + d} ${Math.max(pts[i - 1][1], y) + 40 + k * 6} ${x + d} ${y + k * 6}`)).join(" ")} />
    ))}
  </g>
);

/** Маленький трактор (вид сбоку), (x, y) — земля. */
const Tractor = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-60} y={-80} width={90} height={44} rx={6} fill="#c8553d" />
    <rect x={-10} y={-130} width={50} height={56} rx={6} fill="#c8553d" />
    <rect x={-2} y={-122} width={34} height={28} rx={4} fill="#cfe6f5" />
    <rect x={-50} y={-106} width={8} height={30} fill="#3a3a40" />
    <circle cx={14} cy={-30} r={30} fill="#2b2a2e" />
    <circle cx={14} cy={-30} r={12} fill="#e0a030" />
    <circle cx={-48} cy={-18} r={18} fill="#2b2a2e" />
    <circle cx={-48} cy={-18} r={7} fill="#e0a030" />
  </g>
);

/* ---------- загородная трасса (по умолчанию) ---------- */
const Countryside = ({ palette }: BackdropProps) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
    <rect x={0} y={620} width={W} height={300} fill={light(palette.wall, 0.2)} />
    <circle cx={860} cy={560} r={90} fill="#fbe7a6" opacity={0.35} />
    <circle cx={860} cy={560} r={64} fill="#fbe7a6" />
    <Puff x={60} y={500} s={0.55} color="#ffffffdd" under="#eef3f6" />
    <Puff x={640} y={110} s={0.45} color="#ffffff88" under="#ffffff66" />
    <Puff x={420} y={690} s={0.28} color="#ffffffcc" />
    <Birds items={[[430, 560, 1], [470, 582, 0.8], [510, 612, 0.7], [300, 640, 0.6]]} color="#5a6470" />
    {/* дальние холмы с лесом, деревня с церковью */}
    <path d="M0 790 Q180 730 380 780 T760 760 T1080 770 V900 H0 Z" fill="#b9d0ae" />
    {Array.from({ length: 16 }).map((_, i) => (
      <path key={i} d={`M${i * 26 + 10} ${790 - (i % 3) * 6} l12 -38 l12 38 z`} fill="#8fb08a" />
    ))}
    <path d="M0 820 Q200 720 420 800 T820 780 T1080 800 V900 H0 Z" fill="#a9c79a" />
    <path d="M0 860 Q300 800 600 850 T1080 840 V900 H0 Z" fill="#9cbf84" />
    {[[600, 818, "#e8d5b0", RED], [640, 826, "#d8c8a0", "#7a5a40"], [690, 812, "#e8d5b0", RED]].map(([x, y, w, r], i) => (
      <g key={i}>
        <rect x={x as number} y={y as number} width={i === 2 ? 60 : 36} height={34} fill={w as string} />
        <path d={`M${(x as number) - 8} ${(y as number) + 3} L${(x as number) + (i === 2 ? 30 : 18)} ${(y as number) - 26} L${(x as number) + (i === 2 ? 68 : 44)} ${(y as number) + 3} Z`} fill={r as string} />
        <rect x={(x as number) + 8} y={(y as number) + 10} width={10} height={10} fill="#7fa8c8" />
      </g>
    ))}
    <g>
      <rect x={770} y={790} width={34} height={56} fill="#f2e6d0" />
      <rect x={778} y={764} width={18} height={30} fill="#f2e6d0" />
      <path d="M774 766 q13 -30 26 0 z" fill="#4a7fb0" />
      <rect x={786} y={726} width={3} height={18} fill="#c9a640" />
      <rect x={781} y={732} width={13} height={3} fill="#c9a640" />
      <path d="M766 792 L787 774 L808 792 Z" fill="#7a8a9a" />
    </g>
    {[300, 340, 820, 860, 900].map((x, i) => <circle key={x} cx={x} cy={838 - (i % 2) * 8} r={22} fill="#6f9e5a" />)}
    {/* поля: пшеница рядами, луг */}
    <path d="M0 870 H1080 V930 H0 Z" fill={WHEAT} />
    <path d="M380 870 H1080 V930 H300 Z" fill="#b9cf7a" />
    {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${400 + i * 80} 870 L${330 + i * 92} 930`} stroke="#a6bd68" strokeWidth={4} />)}
    <path d="M0 930 H1080 V1010 H0 Z" fill={GRASS} />
    <path d="M0 930 H520 L470 1010 H0 Z" fill="#d9b85a" />
    {Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M${i * 80} 930 L${i * 80 - 20} 1010`} stroke="#c9a548" strokeWidth={4} />)}
    <Tractor x={250} y={928} s={0.42} />
    <path d="M0 1010 H1080 V1120 H0 Z" fill="#a3c472" />
    <path d="M560 1000 Q600 900 640 1000 Z" fill="#d9b85a" />
    <path d="M590 930 q10 -20 22 0" stroke="#c9a548" strokeWidth={4} fill="none" />
    <path d="M555 1000 h90 v8 h-90 z" fill="#b8963e" />
    <path d="M660 1010 Q680 960 700 1010 Z" fill="#d9b85a" />
    {/* лесополоса за обочиной */}
    {[[40, 1080, 0.32], [150, 1090, 0.28], [880, 1085, 0.3], [990, 1080, 0.34]].map(([x, y, s2], i) => (
      <LeafyTree key={i} x={x} y={y} s={s2} tones={["#5f8f4c", "#76a862", "#94c37a"]} flip={i % 2 === 1} />
    ))}
    {/* столбы с проводами вдоль дальней обочины */}
    <Wires pts={[[-200, 790], [330, 800], [790, 800], [1300, 790]]} />
    <Pole2 x={330} y={1150} top={790} />
    <Pole2 x={790} y={1150} top={790} />
    {/* дальняя обочина (дальний план — пешеходы), дорога (передний план — машины), ближняя обочина */}
    <rect x={0} y={1110} width={W} height={130} fill={DIRT} />
    <rect x={0} y={1110} width={W} height={8} fill="#00000014" />
    {Array.from({ length: 30 }).map((_, i) => <ellipse key={i} cx={rnd(i + 5) * W} cy={1124 + rnd(i + 50) * 108} rx={5 + rnd(i) * 5} ry={3} fill={dark(DIRT, 0.12)} />)}
    <Road y0={1240} y1={1430} color={palette.floor} line={1300} />
    <rect x={0} y={1252} width={W} height={7} fill="#f2e6d0" opacity={0.7} />
    <rect x={0} y={1412} width={W} height={7} fill="#f2e6d0" opacity={0.7} />
    <Cracks items={[[120, 1350, 1.2], [700, 1390, 1], [420, 1280, 0.8]]} />
    <rect x={560} y={1330} width={140} height={46} rx={6} fill={dark(palette.floor, 0.08)} />
    <rect x={0} y={1430} width={W} height={40} fill={DIRT} />
    <rect x={0} y={1470} width={W} height={H - 1470} fill={GRASS} />
    <path d="M0 1480 Q540 1500 1080 1480 V1500 Q540 1520 0 1500 Z" fill="#7fa85a" />
    <Tufts color="#7aa858" items={[[60, 1560, 1.2], [300, 1640, 1], [760, 1600, 1.2], [980, 1700, 1.4], [500, 1780, 1.2], [140, 1840, 1.4]]} />
    {[[200, 1580, "#ffffff"], [880, 1650, "#e0a030"], [420, 1700, "#d8506a"], [1030, 1560, "#ffffff"]].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r={9} fill={c as string} />)}
    {/* столбики на обочине, кустики */}
    {[60, 420, 780].map((x) => (
      <g key={x}>
        <rect x={x} y={1150} width={16} height={60} rx={4} fill={WHITE} />
        <rect x={x} y={1162} width={16} height={10} fill={INK} />
      </g>
    ))}
    <g fill="#6f9e5a">
      <circle cx={250} cy={1112} r={34} />
      <circle cx={290} cy={1120} r={26} />
    </g>
    <circle cx={242} cy={1100} r={12} fill="#8fbf6a" />
    {/* указатель населённого пункта */}
    <g>
      <rect x={516} y={960} width={10} height={196} fill="#8a8f98" />
      <rect x={604} y={960} width={10} height={196} fill="#8a8f98" />
      <rect x={480} y={900} width={170} height={66} rx={6} fill="#ffffff" />
      <rect x={486} y={906} width={158} height={54} rx={4} fill="none" stroke={INK} strokeWidth={4} />
      <Label x={565} y={942} text="БЕРЁЗОВКА" size={22} color={INK} />
    </g>
    <RoadSign x={940} top={600} />
    <Pigeon x={980} y={1220} s={0.6} body="#3a3a40" />
  </>
);

/* ---------- машина спереди: седоки сидят лицом к зрителю за лобовым стеклом ---------- */
const CarFront = ({ palette, taxi }: BackdropProps & { taxi: boolean }) => {
  const body = taxi ? "#f2c230" : "#4a7fb0";
  const trim = "#2e2826";
  const seat = taxi ? "#3d3a38" : "#8a5a3a";
  const ws = "M180 1300 L280 690 Q540 636 800 690 L900 1300 Z";
  const back = seatTopY(1);
  return (
    <>
      {/* улица за машиной */}
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <rect x={0} y={560} width={W} height={340} fill={light(palette.wall, 0.2)} />
      <Puff x={60} y={330} s={0.45} color="#ffffffcc" under="#eef3f6" />
      <Puff x={780} y={240} s={0.35} color="#ffffffaa" />
      <Birds items={[[880, 520, 1], [916, 540, 0.8], [160, 560, 0.7]]} color="#5a6470" />
      <path d="M0 830 Q200 770 420 810 T820 790 T1080 800 V900 H0 Z" fill="#b9d0ae" />
      <path d="M0 860 Q260 790 540 840 T1080 820 V960 H0 Z" fill="#a9c79a" />
      <rect x={0} y={900} width={W} height={H - 900} fill={GRASS} />
      <path d="M500 900 H580 L1000 1920 H80 Z" fill={palette.floor} />
      <path d="M536 900 h8 l14 120 h-36 z" fill="#f2e6d0" opacity={0.6} />
      {[140, 940].map((x) => <circle key={x} cx={x} cy={880} r={44} fill="#6f9e5a" />)}
      <LeafyTree x={20} y={1120} s={0.7} />
      <LeafyTree x={1060} y={1100} s={0.62} flip tones={["#386640", "#4f8350", "#78ac62"]} />
      {[[250, 900, 0.5], [830, 900, 0.5]].map(([x, y, s2]) => <rect key={x} x={x - 4} y={y - 200 * s2} width={8} height={200 * s2} fill="#7a5a40" />)}
      {/* тень под машиной */}
      <ellipse cx={540} cy={1800} rx={560} ry={50} fill="#00000033" />
      {/* колёса */}
      {[60, 860].map((x) => <rect key={x} x={x} y={1640} width={160} height={170} rx={30} fill="#1e1a18" />)}
      {/* кузов: крыша и стойки */}
      <path d="M110 1320 L230 650 Q540 570 850 650 L970 1320 Z" fill={body} />
      {taxi && (
        <g>
          <rect x={430} y={552} width={220} height={60} rx={12} fill="#f7e27a" />
          {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={440 + i * 20} y={(i % 2) * 20 + 562} width={20} height={20} fill={INK} />)}
          <rect x={470} y={604} width={140} height={14} fill={dark(body, 0.3)} />
        </g>
      )}
      {/* салон за лобовым стеклом */}
      <defs>
        <clipPath id="doroga-car-ws"><path d={ws} /></clipPath>
      </defs>
      <g clipPath="url(#doroga-car-ws)">
        <rect x={0} y={600} width={W} height={760} fill="#4a423e" />
        <rect x={0} y={600} width={W} height={110} fill="#5a524d" />
        {/* заднее стекло: дорога позади */}
        <rect x={330} y={720} width={420} height={170} rx={30} fill={trim} />
        <rect x={346} y={734} width={388} height={142} rx={22} fill={palette.wall} />
        <path d="M346 830 Q540 800 734 830 V876 H346 Z" fill="#a9c79a" />
        <path d="M520 820 H560 L640 876 H440 Z" fill={palette.floor} />
        {/* заднее сиденье (дальний план): back-left, back-right */}
        <rect x={300} y={back - 230} width={480} height={240} rx={40} fill={dark(seat, 0.12)} />
        <rect x={290} y={back - 10} width={500} height={40} rx={14} fill={light(seat, 0.1)} />
        <rect x={290} y={back + 30} width={500} height={60} fill={dark(seat, 0.3)} />
        {/* передние кресла (средний план): passenger слева, driver справа */}
        <SeatFront x={0.28} z={0.5} w={230} back={330} color={seat} head={dark(seat, 0.15)} base={trim} legs="box" r={50} />
        <SeatFront x={0.72} z={0.5} w={230} back={330} color={seat} head={dark(seat, 0.15)} base={trim} legs="box" r={50} />
        {/* солнцезащитные козырьки */}
        <rect x={250} y={668} width={230} height={44} rx={14} fill={dark(trim, 0.1)} />
        <rect x={600} y={668} width={230} height={44} rx={14} fill={dark(trim, 0.1)} />
        <rect x={290} y={676} width={70} height={26} rx={4} fill="#e8e4d8" opacity={0.6} />
        {/* торпедо: приборы, магнитола, бардачок, руль водителя, счётчик такси */}
        <rect x={0} y={1222} width={W} height={100} fill={trim} />
        <rect x={0} y={1222} width={W} height={14} fill={light(trim, 0.15)} />
        <rect x={110} y={1252} width={220} height={52} rx={10} fill={light(trim, 0.08)} />
        <rect x={210} y={1270} width={30} height={8} rx={4} fill={dark(trim, 0.3)} />
        <rect x={500} y={1248} width={90} height={56} rx={6} fill="#1e1a18" />
        <rect x={510} y={1256} width={46} height={16} rx={3} fill="#5fb878" opacity={0.8} />
        {[514, 534, 554, 574].map((x) => <rect key={x} x={x} y={1282} width={12} height={10} rx={2} fill="#8a8f98" />)}
        {[0, 1, 2].map((i) => <rect key={i} x={600 + i * 22} y={1246} width={14} height={30} rx={4} fill="#1e1a18" />)}
        {[730, 826].map((x) => (
          <g key={x}>
            <circle cx={x} cy={1262} r={24} fill="#1e1a18" />
            <circle cx={x} cy={1262} r={18} fill="#e8e4d8" />
            <path d={`M${x} 1262 L${x + 10} ${1250}`} stroke={RED} strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}
        <rect x={766} y={1180} width={24} height={60} fill="#1e1a18" />
        <circle cx={778} cy={1160} r={112} fill="none" stroke="#1e1a18" strokeWidth={24} />
        <rect x={680} y={1150} width={196} height={18} rx={9} fill="#1e1a18" />
        {taxi && (
          <g>
            <rect x={380} y={1186} width={110} height={44} rx={6} fill="#1e1a18" />
            <rect x={392} y={1196} width={60} height={22} rx={3} fill="#e0602a" />
            <circle cx={472} cy={1207} r={8} fill="#5fb878" />
          </g>
        )}
        {/* зеркало заднего вида и ёлочка */}
        <rect x={532} y={660} width={16} height={36} fill="#1e1a18" />
        <rect x={460} y={690} width={160} height={46} rx={18} fill="#1e1a18" />
        <rect x={470} y={698} width={140} height={30} rx={13} fill="#8fa8b8" />
        <rect x={538} y={736} width={4} height={44} fill="#1e1a18" />
        <path d="M540 776 l20 34 h-10 l15 26 h-50 l15 -26 h-10 z" fill="#5b8c5a" />
      </g>
      <path d={ws} fill="#ffffff" opacity={0.05} />
      <circle cx={850} cy={1200} r={26} fill="#f2e6d0" opacity={0.85} />
      <circle cx={850} cy={1200} r={18} fill={taxi ? "#5fb878" : "#4a7fb0"} opacity={0.85} />
      <path d={`M300 760 L360 700`} stroke="#ffffff" strokeWidth={14} opacity={0.25} strokeLinecap="round" />
      {/* зеркала, капот, решётка, фары, бампер, номер */}
      {[[70, 1220], [1010, 1220]].map(([x, y]) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={50} ry={34} fill={dark(body, 0.15)} />
          <ellipse cx={x} cy={y} rx={36} ry={22} fill="#8fa8b8" />
        </g>
      ))}
      <path d="M30 1300 H1050 L1060 1580 Q540 1620 20 1580 Z" fill={body} />
      <path d="M30 1300 H1050 V1330 H30 Z" fill={dark(body, 0.12)} />
      {[300, 780].map((x) => <path key={x} d={`M${x} 1330 L${x + (x < 540 ? -30 : 30)} 1560`} stroke={light(body, 0.25)} strokeWidth={10} strokeLinecap="round" />)}
      {/* дворники */}
      <path d="M260 1292 L470 1230 M620 1292 L830 1230" stroke="#1e1a18" strokeWidth={10} strokeLinecap="round" />
      {taxi && Array.from({ length: 26 }).map((_, i) => <rect key={i} x={30 + i * 40} y={1540 + (i % 2) * 18} width={40} height={18} fill={INK} />)}
      <rect x={330} y={1590} width={420} height={90} rx={24} fill="#2b2522" />
      {[0, 1, 2].map((i) => <rect key={i} x={350} y={1606 + i * 24} width={380} height={10} rx={5} fill="#4a423e" />)}
      {[170, 910].map((x) => (
        <g key={x}>
          <circle cx={x} cy={1630} r={66} fill={light(body, 0.3)} />
          <circle cx={x} cy={1630} r={48} fill="#fff4c8" />
        </g>
      ))}
      <rect x={20} y={1690} width={1040} height={50} rx={24} fill="#c9ccd2" />
      <rect x={460} y={1696} width={160} height={40} rx={6} fill={WHITE} />
      <Label x={540} y={1728} text="А 123 ВС" size={26} color="#2b2a2e" spacing={0} />
      <circle cx={540} cy={1440} r={26} fill={light(body, 0.35)} />
      <circle cx={540} cy={1440} r={16} fill={dark(body, 0.2)} />
      <path d="M540 1328 l-20 40 h40 z" fill={light(body, 0.3)} />
    </>
  );
};

/* ---------- салоны: общие детали ---------- */
/** Поручень под потолком на плане z с ручками-петлями над xs (доли кадра). */
const Straps = ({ z, y, xs, color, x1 = W }: { z: number; y: number; xs: number[]; color: string; x1?: number }) => {
  const s = depthScale(z);
  return (
    <g>
      <rect x={0} y={y} width={x1} height={14 * s} rx={7 * s} fill={RAIL} />
      {xs.map((x) => (
        <g key={x}>
          <rect x={x * W - 5 * s} y={y + 8 * s} width={10 * s} height={70 * s} fill={color} />
          <path d={`M${x * W - 24 * s} ${y + 78 * s} H${x * W + 24 * s} L${x * W + 16 * s} ${y + 120 * s} H${x * W - 16 * s} Z`} fill="none" stroke={color} strokeWidth={9 * s} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
};

/** Вертикальный поручень от потолка до пола плана z. */
const Pole = ({ x, z, color = "#e0a030", top = 300 }: { x: number; z: number; color?: string; top?: number }) => {
  const s = depthScale(z);
  return <rect x={x * W - 9 * s} y={top} width={18 * s} height={feetY(z) - top} rx={9 * s} fill={color} />;
};

/** Пол салона: рифлёные полосы. */
const TransitFloor = ({ color, y0 = FLOOR_Y }: { color: string; y0?: number }) => (
  <g>
    <rect x={0} y={y0} width={W} height={H - y0} fill={color} />
    <rect x={0} y={y0} width={W} height={16} fill="#00000025" />
    {[60, 150, 260, 390, 540].map((d) => <rect key={d} x={0} y={y0 + d} width={W} height={4} fill="#00000018" />)}
  </g>
);

/** Окно с видом на улицу (дома с вывесками, дерево, фонарь, полосы движения), тоннель с кабелями или поле. */
const StreetView = ({ x, y, w, h, kind, frame, seed = 1 }: { x: number; y: number; w: number; h: number; kind: "street" | "tunnel" | "field"; frame: string; seed?: number }) => {
  const id = `doroga-win-${x}-${y}`;
  const houses = ["#d8b48a", "#c9a0a0", "#b9c4a0", "#d0c0a0", "#c8a87a"];
  const signs = ["ХЛЕБ", "КИНО", "ОБУВЬ", "КАФЕ", "ПОЧТА"];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={26} fill={frame} />
      <defs><clipPath id={id}><rect x={x + 14} y={y + 14} width={w - 28} height={h - 28} rx={18} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {kind === "tunnel" ? (
          <>
            <rect x={x} y={y} width={w} height={h} fill="#2b3a55" />
            <rect x={x} y={y} width={w} height={h * 0.5} fill="#263349" />
            {[0.34, 0.4, 0.46].map((k, i) => <path key={k} d={`M${x} ${y + h * k} Q${x + w / 2} ${y + h * k + 14} ${x + w} ${y + h * k}`} stroke="#151c28" strokeWidth={6 - i} fill="none" />)}
            <rect x={x} y={y + h * 0.3} width={w} height={10} fill="#f5d77a" opacity={0.5} />
            <rect x={x + 30} y={y + h * 0.75} width={w - 90} height={8} fill="#f5d77a" opacity={0.35} />
            <rect x={x + w * 0.2} y={y + h * 0.62} width={w * 0.5} height={4} fill="#ffffff" opacity={0.25} />
            <rect x={x + w * 0.55} y={y + h * 0.2} width={34} height={20} rx={4} fill="#f5d77a" opacity={0.6} />
          </>
        ) : (
          <>
            <rect x={x} y={y} width={w} height={h} fill="#a9c7d9" />
            <rect x={x + w * 0.1} y={y + h * 0.12} width={90} height={22} rx={11} fill="#ffffff" opacity={0.7} />
            {kind === "street" ? (
              <>
                {[0, 1, 2, 3].map((i) => {
                  const hx = x + 10 + i * (w / 4);
                  const hy = y + h * (0.3 + rnd(seed * 7 + i) * 0.16);
                  const c = houses[Math.floor(rnd(seed * 3 + i) * houses.length)];
                  return (
                    <g key={i}>
                      <rect x={hx} y={hy} width={w / 4 - 8} height={h} fill={c} />
                      <rect x={hx} y={hy} width={w / 4 - 8} height={8} fill={dark(c, 0.15)} />
                      {[0, 1].map((r) => <rect key={r} x={hx + 12} y={hy + 22 + r * 46} width={18} height={24} fill="#f2e6d0" opacity={0.85} />)}
                      {[0, 1].map((r) => <rect key={`b${r}`} x={hx + 40} y={hy + 22 + r * 46} width={18} height={24} fill="#f2e6d0" opacity={0.85} />)}
                      <rect x={hx + 6} y={y + h * 0.7} width={w / 4 - 20} height={18} rx={3} fill={["#c8553d", "#2f8a5a", "#4a7fb0", "#8a4a2a"][i]} />
                      <Label x={hx + (w / 4 - 8) / 2} y={y + h * 0.7 + 14} text={signs[(i + seed) % signs.length]} size={12} />
                    </g>
                  );
                })}
                <rect x={x} y={y + h * 0.82} width={w} height={h} fill="#8a8f98" />
                <rect x={x + w * 0.22} y={y + h * 0.2} width={6} height={h * 0.66} fill="#3a3f47" />
                <rect x={x + w * 0.22 - 12} y={y + h * 0.2} width={30} height={14} rx={4} fill="#f7dc8a" />
                <circle cx={x + w * 0.72} cy={y + h * 0.68} r={h * 0.16} fill="#6f9e5a" />
                <circle cx={x + w * 0.66} cy={y + h * 0.64} r={h * 0.09} fill="#86b96b" />
                <rect x={x + w * 0.72 - 4} y={y + h * 0.76} width={8} height={h * 0.1} fill="#6b4a32" />
                {[0.88, 0.94].map((k) => <rect key={k} x={x + 20} y={y + h * k} width={w * 0.5} height={4} rx={2} fill="#ffffff" opacity={0.35} />)}
              </>
            ) : (
              <>
                <rect x={x} y={y + h * 0.6} width={w} height={h} fill="#b9cf7a" />
                <rect x={x} y={y + h * 0.66} width={w} height={h} fill="#8fb86a" />
                <circle cx={x + 90} cy={y + h * 0.66} r={40} fill="#6f9e5a" />
                <rect x={x + w * 0.7} y={y + h * 0.4} width={5} height={h * 0.3} fill="#7a5a40" />
              </>
            )}
          </>
        )}
      </g>
      <rect x={x + 30} y={y + 26} width={60} height={12} rx={6} fill="#ffffff" opacity={0.35} />
      <rect x={x + 14} y={y + h * 0.46} width={w - 28} height={10} fill={frame} />
    </g>
  );
};

/** Рекламная наклейка в салоне. */
const Ad = ({ x, y, w, h, bg, text, fg = "#ffffff", icon }: { x: number; y: number; w: number; h: number; bg: string; text: string; fg?: string; icon?: string }) => (
  <g>
    <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={6} fill="#00000022" />
    <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} />
    {icon && <circle cx={x + h / 2 + 4} cy={y + h / 2} r={h * 0.32} fill={icon} />}
    <Label x={icon ? x + h + (w - h) / 2 : x + w / 2} y={y + h / 2 + h * 0.18} text={text} size={h * 0.46} color={fg} />
  </g>
);

/** Компостер/валидатор на поручне. */
const Validator = ({ x, y, color = "#e0a030" }: { x: number; y: number; color?: string }) => (
  <g>
    <rect x={x - 34} y={y} width={68} height={96} rx={10} fill={color} />
    <rect x={x - 24} y={y + 12} width={48} height={26} rx={4} fill="#1e1a18" />
    <rect x={x - 18} y={y + 18} width={20} height={8} rx={2} fill="#5fb878" />
    <rect x={x - 22} y={y + 50} width={44} height={30} rx={6} fill={dark(color, 0.2)} />
    <circle cx={x} cy={y + 65} r={8} fill="#f4f1ea" opacity={0.7} />
  </g>
);

/* ---------- автобус: кабина водителя слева, передняя дверь, сиденья у окон, поручни ---------- */
const BusInterior = () => {
  const wall = "#efe3c8";
  const seat = RED;
  const floor = "#6b6b6b";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      <rect x={0} y={0} width={W} height={330} fill={dark(wall, 0.1)} />
      <rect x={300} y={40} width={700} height={40} rx={20} fill="#fffbea" />
      {/* окна борта */}
      <StreetView x={440} y={470} w={300} h={330} kind="street" frame={dark(wall, 0.25)} seed={1} />
      <StreetView x={760} y={470} w={320} h={330} kind="street" frame={dark(wall, 0.25)} seed={2} />
      <rect x={430} y={830} width={650} height={16} fill={dark(wall, 0.15)} />
      {/* реклама и схема маршрута над окнами */}
      <Ad x={450} y={424} w={190} h={38} bg="#4a7fb0" text="МОЛОКО" icon="#f4f1ea" />
      <rect x={656} y={424} width={410} height={38} rx={4} fill={WHITE} />
      <Label x={690} y={451} text="12" size={24} color={RED} />
      <path d="M720 443 H1050" stroke={RED} strokeWidth={5} />
      {[740, 800, 860, 920, 980, 1040].map((x) => <circle key={x} cx={x} cy={443} r={6} fill={WHITE} stroke={RED} strokeWidth={4} />)}
      {/* молоток у окна, обогреватель под окнами */}
      <rect x={744} y={600} width={12} height={46} rx={4} fill={RED} />
      <rect x={734} y={590} width={32} height={14} rx={4} fill={RED} />
      <rect x={430} y={1112} width={650} height={40} rx={6} fill={dark(wall, 0.2)} />
      {Array.from({ length: 20 }).map((_, i) => <rect key={i} x={440 + i * 32} y={1118} width={14} height={28} rx={3} fill={dark(wall, 0.32)} />)}
      {/* кабина: лобовое стекло, приборы, руль, кресло водителя */}
      <path d="M0 360 H230 L250 980 H0 Z" fill={dark(wall, 0.3)} />
      <path d="M0 380 H212 L228 960 H0 Z" fill="#a9c7d9" />
      <rect x={0} y={760} width={228} height={200} fill="#8a8f98" />
      <rect x={0} y={860} width={228} height={30} fill="#f2e6d0" opacity={0.7} />
      <path d="M0 620 L80 560 L160 600 L228 570 V760 H0 Z" fill="#9fb0a0" />
      <rect x={20} y={640} width={60} height={120} fill="#c9a0a0" />
      <rect x={140} y={660} width={88} height={100} fill="#d8b48a" />
      <rect x={20} y={392} width={90} height={22} rx={6} fill="#1e1a18" />
      <rect x={24} y={396} width={82} height={14} rx={4} fill="#f2b84b" opacity={0.85} />
      <rect x={0} y={960} width={260} height={150} rx={10} fill="#3a3f47" />
      {[50, 120, 190].map((x) => <circle key={x} cx={x} cy={1010} r={22} fill="#e8e4d8" />)}
      <ellipse cx={173} cy={950} rx={120} ry={30} fill="none" stroke="#1e1a18" strokeWidth={18} />
      <SeatFront x={0.16} z={0.75} w={200} back={280} color="#4a4f58" head="#3a3f47" base="#1e1a18" legs="box" />
      {/* перегородка кабины */}
      <rect x={270} y={330} width={16} height={feetY(0.75) - 330} fill={RAIL} />
      {/* передняя дверь (гармошка) */}
      <rect x={292} y={520} width={140} height={FLOOR_Y - 520} fill="#3a3f47" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={300 + i * 66} y={530} width={58} height={FLOOR_Y - 540} rx={6} fill="#5a6470" />
          <rect x={308 + i * 66} y={545} width={42} height={290} rx={4} fill="#a9c7d9" />
          <rect x={308 + i * 66} y={850} width={42} height={290} rx={4} fill="#a9c7d9" />
        </g>
      ))}
      <circle cx={362} cy={700} r={20} fill="#e8e4d8" />
      <circle cx={362} cy={700} r={14} fill="#2f6fb0" />
      <path d="M356 692 h12 v14 h-12 z" fill="#e8e4d8" />
      {/* сиденья у борта (дальний план): seat-1, seat-2, seat-3 (+ четвёртое за краем) */}
      {[0.47, 0.62, 0.78, 0.93].map((x) => (
        <g key={x}>
          <SeatFront x={x} z={1} w={170} back={270} color={seat} head={light(seat, 0.2)} base="#5a5f68" />
          <path d={`M${x * W - 30} ${seatTopY(1) - 270 * 0.8 + 4} v-16 h60 v16`} stroke={RAIL} strokeWidth={8} fill="none" strokeLinejoin="round" />
        </g>
      ))}
      {/* поручни и ручки: средний и передний планы */}
      <Straps z={0.5} y={410} xs={[0.42, 0.7]} color={dark(seat, 0.2)} />
      <Straps z={0} y={330} xs={[0.3, 0.75]} color={dark(seat, 0.2)} />
      <Pole x={0.56} z={0.5} top={330} />
      <rect x={0.56 * W - 22} y={740} width={44} height={40} rx={8} fill={dark(RED, 0.2)} />
      <circle cx={0.56 * W} cy={760} r={16} fill={RED} />
      <Validator x={0.56 * W} y={880} />
      <TransitFloor color={floor} />
    </>
  );
};

/* ---------- метро: двери, длинный диван под окнами, поручни; массовка стоит у стены за диваном ---------- */
const SubwayInterior = () => {
  const wall = "#d9dde2";
  const seat = "#4a6fa5";
  const floor = "#8c8f94";
  const base = 1095; // низ стены (стопы массовки — y ≈ 1113, перед стеной)
  const top = seatTopY(1);
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      <rect x={0} y={0} width={W} height={330} fill={dark(wall, 0.08)} />
      <rect x={60} y={50} width={960} height={40} rx={20} fill="#fffbea" />
      {/* схема линий над окнами */}
      <rect x={330} y={398} width={420} height={60} rx={6} fill={WHITE} />
      <path d="M350 420 H730" stroke={RED} strokeWidth={7} />
      <path d="M350 444 H520 L560 420 L600 444 H730" stroke="#2f8a5a" strokeWidth={5} fill="none" />
      <path d="M450 404 V452" stroke="#2f6fb0" strokeWidth={5} />
      {[370, 450, 530, 610, 690].map((x) => <circle key={x} cx={x} cy={420} r={8} fill={WHITE} stroke={RED} strokeWidth={4} />)}
      {[380, 640, 710].map((x) => <circle key={x} cx={x} cy={444} r={5} fill={WHITE} stroke="#2f8a5a" strokeWidth={3} />)}
      {/* рекламные плакаты по краям, динамики, наклейки на дверях */}
      <rect x={0} y={560} width={56} height={200} rx={4} fill="#c8553d" />
      <circle cx={24} cy={620} r={20} fill="#f2e6d0" />
      {[680, 700, 720].map((y) => <rect key={y} x={6} y={y} width={40} height={8} rx={4} fill="#f2e6d0" opacity={0.8} />)}
      <rect x={1024} y={560} width={56} height={200} rx={4} fill="#2f8a5a" />
      <path d="M1040 650 l20 -50 l20 50 z" fill="#f2e6d0" />
      {[680, 700, 720].map((y) => <rect key={y} x={1034} y={y} width={40} height={8} rx={4} fill="#f2e6d0" opacity={0.8} />)}
      {[180, 900].map((x) => (
        <g key={x}>
          <rect x={x - 40} y={330} width={80} height={22} rx={6} fill={dark(wall, 0.2)} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={x - 32 + i * 14} y={336} width={8} height={10} rx={2} fill={dark(wall, 0.4)} />)}
        </g>
      ))}
      {/* двери слева и справа */}
      {[70, 790].map((x) => (
        <g key={x}>
          <rect x={x} y={400} width={220} height={base - 400} rx={8} fill="#8a9099" />
          {[0, 1].map((i) => (
            <g key={i}>
              <rect x={x + 10 + i * 104} y={410} width={96} height={base - 420} rx={6} fill="#b8bec6" />
              <rect x={x + 22 + i * 104} y={440} width={72} height={330} rx={6} fill="#2b3a55" />
              <rect x={x + 22 + i * 104} y={560} width={72} height={8} fill="#f5d77a" opacity={0.5} />
              <path d={`M${x + 22 + i * 104} ${480 + i * 30} h72`} stroke="#151c28" strokeWidth={4} />
              <circle cx={x + 58 + i * 104} cy={830} r={16} fill="#e0a030" />
              <rect x={x + 50 + i * 104} y={824} width={16} height={12} rx={2} fill="#1e1a18" />
              <rect x={x + 10 + i * 104} y={base - 40} width={96} height={14} fill="#e0a030" opacity={0.8} />
            </g>
          ))}
          <rect x={x + 106} y={410} width={8} height={base - 420} fill="#5a6470" />
        </g>
      ))}
      {/* окна над диваном */}
      <StreetView x={330} y={470} w={420} h={330} kind="tunnel" frame={dark(wall, 0.25)} />
      {/* эмблема «М» и аварийная связь */}
      <circle cx={540} cy={850} r={22} fill={RED} />
      <Label x={540} y={860} text="М" size={28} />
      <rect x={300} y={600} width={24} height={60} rx={6} fill="#e8e4d8" />
      <circle cx={312} cy={616} r={6} fill={RED} />
      <rect x={306} y={630} width={12} height={20} rx={3} fill="#8a9099" />
      {/* спинка дивана на стене, пол у стены */}
      <rect x={310} y={880} width={460} height={190} rx={30} fill={dark(seat, 0.1)} />
      <rect x={0} y={base} width={W} height={FLOOR_Y - base} fill={dark(floor, 0.08)} />
      {/* диван (дальний план): верх сиденья = seatTopY(1) */}
      <rect x={292} y={top - 14} width={496} height={30} rx={12} fill={light(seat, 0.15)} />
      <rect x={292} y={top + 14} width={496} height={30} rx={10} fill={seat} />
      <rect x={312} y={top + 44} width={456} height={FLOOR_Y - top - 44} fill={dark(seat, 0.45)} />
      {/* поручни */}
      <rect x={0} y={360} width={W} height={14} rx={7} fill={RAIL} />
      <Pole x={0.27} z={0.5} color={RAIL} top={330} />
      <Pole x={0.73} z={0.5} color={RAIL} top={330} />
      <TransitFloor color={floor} />
      <rect x={0} y={FLOOR_Y + 30} width={W} height={14} fill="#e0a030" />
    </>
  );
};

/* ---------- трамвай: деревянные сиденья, компостер, дверь в кабину вагоновожатого справа ---------- */
const TramInterior = () => {
  const wall = "#ecdcb4";
  const seat = "#b07a4a";
  const trim = RED;
  const floor = "#7a6a5a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      <rect x={0} y={0} width={W} height={330} fill={dark(wall, 0.1)} />
      <rect x={0} y={318} width={W} height={14} fill={trim} />
      {[160, 560].map((x) => <rect key={x} x={x} y={60} width={300} height={36} rx={18} fill="#fffbea" />)}
      {/* окна: улица с рельсами */}
      <StreetView x={30} y={460} w={340} h={340} kind="street" frame={trim} seed={3} />
      <StreetView x={390} y={460} w={340} h={340} kind="street" frame={trim} seed={4} />
      {/* провода контактной сети за окнами */}
      <path d="M44 520 Q200 530 356 520 M404 520 Q560 530 716 520" stroke="#3a3f47" strokeWidth={3} fill="none" />
      <rect x={0} y={820} width={760} height={14} fill={dark(wall, 0.2)} />
      {/* реклама над окнами */}
      <Ad x={40} y={418} w={320} h={34} bg="#4a7fb0" text="ЦИРК" />
      <Ad x={400} y={418} w={320} h={34} bg="#e0a030" text="КИНО" fg="#2b2a2e" />
      {/* обшивка рейками под окнами */}
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={0} y={860 + i * 34} width={760} height={4} fill={dark(wall, 0.12)} />)}
      {/* кабина вагоновожатого: перегородка с окном, через него видно лобовое стекло и рельсы */}
      <rect x={760} y={330} width={320} height={FLOOR_Y - 330} fill={dark(trim, 0.1)} />
      <rect x={790} y={360} width={260} height={FLOOR_Y - 360} rx={8} fill={dark(trim, 0.25)} />
      <rect x={812} y={390} width={216} height={300} rx={10} fill="#3a3f47" />
      <rect x={824} y={402} width={192} height={200} rx={6} fill="#a9c7d9" />
      <path d="M824 602 V560 L920 520 L1016 560 V602 Z" fill="#8a8f98" />
      <path d="M900 602 L915 540 M940 602 L925 540" stroke="#d8dde3" strokeWidth={5} />
      <rect x={824} y={602} width={192} height={76} fill="#2b2f36" />
      <circle cx={870} cy={640} r={16} fill="#e8e4d8" />
      <rect x={930} y={628} width={60} height={22} rx={4} fill="#5fb878" />
      <rect x={1010} y={880} width={16} height={70} rx={6} fill="#d8dde3" />
      {/* номер маршрута и табличка на перегородке */}
      <rect x={830} y={720} width={180} height={60} rx={8} fill={WHITE} />
      <Label x={870} y={764} text="7" size={40} color={trim} />
      <Label x={950} y={758} text="ВАГОН" size={18} color="#2b2a2e" />
      <rect x={846} y={820} width={60} height={60} rx={30} fill="#2f6fb0" />
      <path d="M866 834 h20 v12 h-20 z M862 852 h28 v14 h-28 z" fill={WHITE} />
      {/* сиденья (дальний план): seat-1..seat-3 */}
      {[0.27, 0.42, 0.57].map((x) => (
        <SeatFront key={x} x={x} z={1} w={160} back={250} color={seat} cushion={light(seat, 0.12)} base="#3a3f47" legs="legs" r={18} />
      ))}
      {/* компостер на поручне, поручни, ручки */}
      <Pole x={0.15} z={0.5} color={RAIL} top={330} />
      <rect x={0.15 * W - 40} y={780} width={80} height={110} rx={10} fill={RED} />
      <rect x={0.15 * W - 26} y={800} width={52} height={10} rx={4} fill={INK} />
      <rect x={0.15 * W - 30} y={830} width={60} height={40} rx={6} fill={dark(RED, 0.2)} />
      <Straps z={0.5} y={410} xs={[0.4, 0.68]} color={dark(seat, 0.3)} x1={770} />
      <Straps z={0} y={340} xs={[0.3, 0.7]} color={dark(seat, 0.3)} x1={770} />
      <TransitFloor color={floor} />
    </>
  );
};

/* ---------- остановка: дома, тротуар с навесом и скамейкой, дорога на переднем плане ---------- */
const Facades = ({ y }: { y: number }) => (
  <g>
    {[
      [0, 260, "#d8b48a"], [250, 330, "#c9a0a0"], [560, 220, "#b9c4a0"], [770, 310, "#d0c0a0"],
    ].map(([x, w, c], i) => {
      const top = 380 + (i % 2) * 90;
      const X = x as number;
      const Wd = w as number;
      const C = c as string;
      return (
        <g key={i}>
          <rect x={X} y={top} width={Wd} height={y - top} fill={C} />
          <rect x={X - 6} y={top} width={Wd + 12} height={20} fill={dark(C, 0.15)} />
          {Array.from({ length: Math.floor(Wd / 26) }).map((_, k) => <rect key={k} x={X + 6 + k * 26} y={top + 20} width={12} height={8} fill={dark(C, 0.1)} />)}
          {i % 2 === 0 && <rect x={X + Wd * 0.7} y={top - 50} width={36} height={50} fill={dark(C, 0.25)} />}
          {i === 3 && <path d={`M${X + 60} ${top - 2} V${top - 70} M${X + 36} ${top - 60} H${X + 84} M${X + 44} ${top - 44} H${X + 76}`} stroke={dark(C, 0.45)} strokeWidth={5} />}
          {Array.from({ length: 3 }).flatMap((_, r) =>
            Array.from({ length: Math.floor(Wd / 90) }).map((__, k) => {
              const q = rnd(i * 17 + r * 5 + k);
              return (
                <Win key={`${r}-${k}`} x={X + 30 + k * 90} y={top + 60 + r * 130} w={50} h={80}
                  curtain={q > 0.4 ? ["#e8c4a0", "#c9d6e8", "#e0b0b0", "#f2e6d0"][Math.floor(q * 4)] : undefined}
                  flowers={q > 0.8 ? "#d8506a" : undefined} />
              );
            }),
          )}
        </g>
      );
    })}
    {/* балкон с бельём */}
    <rect x={330} y={668} width={150} height={14} rx={3} fill={dark("#c9a0a0", 0.25)} />
    <rect x={334} y={610} width={142} height={6} fill="#3a3a40" />
    {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={336 + i * 15} y={614} width={3} height={56} fill="#3a3a40" />)}
    {/* вывески первых этажей */}
    <Sign x={20} y={906} w={210} h={46} text="ПРОДУКТЫ" bg="#c8553d" size={26} />
    <Sign x={790} y={900} w={170} h={46} text="АПТЕКА" bg="#2f8a5a" size={26} />
    <circle cx={984} cy={923} r={22} fill="#ffffff" />
    <path d="M978 908 h12 v9 h9 v12 h-9 v9 h-12 v-9 h-9 v-12 h9 z" fill="#2f8a5a" />
    {[[30, 966, 200], [800, 960, 150]].map(([x, yy, w]) => (
      <g key={x}>
        <rect x={x} y={yy} width={w} height={y - yy - 10} rx={6} fill="#cfe6f5" />
        <path d={`M${x + 10} ${y - 20} l50 -${y - yy - 40} h24 l-50 ${y - yy - 40} z`} fill="#ffffff" opacity={0.4} />
      </g>
    ))}
  </g>
);

const BusStop = ({ palette }: BackdropProps) => {
  const pave = "#cfc8bc";
  const glass = "#cfe6f5";
  const frame = "#5a6470";
  const top = seatTopY(1);
  const sx = 0.75 * W;
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <Puff x={640} y={170} s={0.4} color="#ffffffaa" />
      <Puff x={-40} y={300} s={0.3} color="#ffffff99" />
      <Birds items={[[520, 330, 0.8], [556, 350, 0.7]]} color="#5a6470" />
      <Skyline y={430} color={dark(palette.wall, 0.04)} win={dark(palette.wall, 0.04)} seed={9} dome={false} />
      <Facades y={1080} />
      {/* тротуар (дальний и средний планы) */}
      <Paving y0={1080} y1={1296} color={pave} cell={96} seed={7} />
      {/* навес: задняя стеклянная стенка, боковая с плакатом, крыша */}
      <rect x={110} y={690} width={560} height={FLOOR_Y - 690} fill={glass} opacity={0.6} />
      <path d="M140 1180 L300 700 H340 L180 1180 Z" fill="#ffffff" opacity={0.25} />
      <rect x={110} y={690} width={16} height={FLOOR_Y - 690} fill={frame} />
      <rect x={654} y={690} width={16} height={FLOOR_Y - 690} fill={frame} />
      <rect x={380} y={690} width={10} height={FLOOR_Y - 690} fill={frame} opacity={0.7} />
      <rect x={110} y={900} width={560} height={10} fill={frame} />
      {/* рекламный плакат «Море» */}
      <rect x={540} y={716} width={110} height={176} rx={6} fill={frame} />
      <rect x={548} y={724} width={94} height={160} rx={4} fill="#8fd0ef" />
      <circle cx={620} cy={758} r={16} fill="#fbe7a6" />
      <path d="M548 800 q12 -10 24 0 t24 0 t24 0 t22 0 V884 H548 Z" fill="#3d8fc4" />
      <rect x={548} y={846} width={94} height={38} fill="#ecd9a5" />
      <Label x={595} y={872} text="МОРЕ" size={20} color="#c8553d" />
      {/* крыша с названием остановки */}
      <rect x={80} y={650} width={620} height={46} rx={10} fill={frame} />
      <rect x={80} y={690} width={620} height={8} fill="#00000025" />
      <Label x={390} y={683} text="УЛ. САДОВАЯ" size={26} color="#f4f1ea" />
      {/* скамейка (дальний план): bench-1, bench-2 */}
      <rect x={0.3 * W - 110} y={top - 10} width={0.15 * W + 220} height={28} rx={10} fill="#b07a4a" />
      {Array.from({ length: 5 }).map((_, i) => <rect key={i} x={0.3 * W - 100 + i * 80} y={top - 8} width={3} height={24} fill={dark("#b07a4a", 0.2)} />)}
      <rect x={0.3 * W - 110} y={top + 18} width={0.15 * W + 220} height={8} fill={dark("#b07a4a", 0.3)} />
      {[0.3 * W - 90, 0.45 * W + 70].map((x) => <rect key={x} x={x} y={top + 26} width={18} height={FLOOR_Y - top - 26} fill={frame} />)}
      {/* знак остановки с расписанием */}
      <rect x={sx - 8} y={620} width={16} height={FLOOR_Y - 620} fill="#8a8f98" />
      <rect x={sx - 64} y={540} width={128} height={128} rx={14} fill="#2f6fb0" />
      <rect x={sx - 50} y={554} width={100} height={100} rx={10} fill={WHITE} />
      <rect x={sx - 40} y={576} width={80} height={48} rx={10} fill="#2f6fb0" />
      <rect x={sx - 32} y={584} width={64} height={16} rx={4} fill={WHITE} />
      <circle cx={sx - 22} cy={630} r={9} fill={INK} />
      <circle cx={sx + 22} cy={630} r={9} fill={INK} />
      <rect x={sx - 44} y={676} width={88} height={36} rx={6} fill="#e0a030" />
      <Label x={sx} y={704} text="12  7" size={26} color={INK} spacing={0} />
      <rect x={sx - 66} y={724} width={132} height={150} rx={8} fill={WHITE} />
      <rect x={sx - 66} y={724} width={132} height={28} rx={8} fill="#2f6fb0" />
      <Label x={sx} y={744} text="РАСПИСАНИЕ" size={14} />
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <rect x={sx - 56} y={762 + i * 18} width={30} height={10} rx={3} fill="#8a8f98" />
          <rect x={sx - 18} y={762 + i * 18} width={66} height={10} rx={3} fill="#c9ccd2" />
        </g>
      ))}
      {/* урна, фонарь */}
      <Bin x={0.88 * W} y={FLOOR_Y} s={1} color="#5a7a5a" />
      <LampPost x={1030} top={640} y={FLOOR_Y} glow={0} />
      <Pigeon x={260} y={1240} s={0.7} />
      {/* бордюр, дорога (передний план) с жёлтой разметкой остановки, дальний тротуар */}
      <rect x={0} y={1296} width={W} height={18} fill="#e8e4d8" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={i * 96} y={1296} width={3} height={18} fill="#00000018" />)}
      <Road y0={1314} y1={1500} color={palette.floor} line={1400} />
      <path d={`M60 1340 ${Array.from({ length: 10 }).map((_, i) => `L${100 + i * 60} ${i % 2 ? 1340 : 1368}`).join(" ")}`} stroke="#e8c030" strokeWidth={7} fill="none" strokeLinejoin="round" opacity={0.85} />
      <Cracks items={[[860, 1450, 1], [300, 1470, 0.8]]} />
      <Manhole x={880} y={1360} s={0.8} color={dark(palette.floor, 0.1)} />
      <rect x={0} y={1500} width={W} height={18} fill="#e8e4d8" />
      <Paving y0={1518} y1={H} color={pave} cell={110} seed={4} />
    </>
  );
};

/* ---------- заправка: навес с колонками, магазинчик, дорога на переднем плане ---------- */
const Pump = ({ x, color, num }: { x: number; color: string; num: string }) => (
  <g>
    <rect x={x - 10} y={FLOOR_Y - 20} width={140} height={20} rx={6} fill="#b8b2a6" />
    <rect x={x} y={FLOOR_Y - 300} width={120} height={280} rx={14} fill={color} />
    <rect x={x + 8} y={FLOOR_Y - 300} width={8} height={280} fill={light(color, 0.15)} />
    <rect x={x + 14} y={FLOOR_Y - 280} width={92} height={60} rx={6} fill="#1e1a18" />
    <rect x={x + 24} y={FLOOR_Y - 268} width={50} height={16} rx={3} fill="#5fb878" />
    <rect x={x + 24} y={FLOOR_Y - 246} width={70} height={12} rx={3} fill="#e0a030" />
    <rect x={x + 14} y={FLOOR_Y - 206} width={92} height={50} rx={6} fill={WHITE} />
    <Label x={x + 60} y={FLOOR_Y - 170} text={num} size={30} color={color} />
    {[0, 1, 2].map((i) => <rect key={i} x={x + 20 + i * 28} y={FLOOR_Y - 144} width={22} height={14} rx={3} fill={dark(color, 0.25)} />)}
    <path d={`M${x + 120} ${FLOOR_Y - 180} q40 0 40 60 v60`} stroke="#1e1a18" strokeWidth={10} fill="none" />
    <rect x={x + 140} y={FLOOR_Y - 70} width={36} height={22} rx={6} fill="#1e1a18" />
  </g>
);

const GasStation = ({ palette }: BackdropProps) => {
  const conc = "#d2ccc0";
  const brand = "#2f8a5a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <rect x={0} y={640} width={W} height={300} fill={light(palette.wall, 0.2)} />
      <Puff x={60} y={260} s={0.45} color="#ffffffcc" under="#eef3f6" />
      <Puff x={760} y={150} s={0.35} color="#ffffff88" />
      <Birds items={[[560, 300, 0.8], [596, 318, 0.7], [180, 460, 0.7]]} color="#5a6470" />
      <path d="M0 860 Q200 800 420 840 T820 820 T1080 830 V960 H0 Z" fill="#b9d0ae" />
      <path d="M0 900 Q260 820 540 880 T1080 860 V1000 H0 Z" fill="#a9c79a" />
      <rect x={0} y={960} width={W} height={130} fill="#9cbf84" />
      {[[-10, 1000, 0.42], [600, 990, 0.3], [700, 985, 0.34]].map(([x, y, s2], i) => <LeafyTree key={i} x={x} y={y} s={s2} flip={i % 2 === 1} tones={["#5f8f4c", "#76a862", "#94c37a"]} />)}
      {/* стела с ценами за магазином */}
      <g>
        <rect x={1000} y={560} width={70} height={220} fill="#3a3f47" />
        <rect x={990} y={470} width={90} height={230} rx={8} fill={brand} />
        <circle cx={1035} cy={510} r={28} fill={WHITE} />
        <path d="M1035 490 q20 26 0 42 q-20 -16 0 -42 z" fill="#f2c230" />
        {[["92", "52.4"], ["95", "57.8"], ["ДТ", "68.9"]].map(([f, p], i) => (
          <g key={f}>
            <rect x={998} y={550 + i * 46} width={74} height={38} rx={4} fill="#14181e" />
            <Label x={1016} y={576 + i * 46} text={f} size={16} color={WHITE} />
            <Label x={1052} y={576 + i * 46} text={p} size={16} color="#f2b84b" spacing={0} />
          </g>
        ))}
      </g>
      {/* магазин справа */}
      <rect x={720} y={760} width={360} height={FLOOR_Y - 760} fill="#e8e0d0" />
      <rect x={720} y={1150} width={360} height={40} fill="#c9c0b0" />
      <rect x={700} y={730} width={400} height={50} rx={8} fill={brand} />
      <Label x={860} y={767} text="МАГАЗИН 24" size={28} color={WHITE} />
      <rect x={750} y={820} width={140} height={160} rx={8} fill="#a9c7d9" />
      {[860, 900, 940].map((y) => <rect key={y} x={758} y={y} width={124} height={6} fill="#8a8f98" />)}
      {[0, 1, 2].flatMap((r) => [0, 1, 2, 3, 4].map((k) => (
        <rect key={`${r}-${k}`} x={764 + k * 24} y={[836, 876, 916][r] + (k % 2) * 4} width={16} height={[22, 22, 18][r]} rx={3} fill={["#c8553d", "#e0a030", "#4a7fb0", "#5fb878", "#f2e6d0"][(r + k) % 5]} />
      )))}
      <rect x={758} y={950} width={124} height={22} rx={3} fill="#f2e6d0" opacity={0.7} />
      <rect x={920} y={820} width={130} height={FLOOR_Y - 820} rx={6} fill="#6f8a9a" />
      <rect x={932} y={840} width={106} height={200} rx={4} fill="#a9c7d9" />
      <path d="M940 1030 l40 -180 h20 l-40 180 z" fill="#ffffff" opacity={0.35} />
      <rect x={1022} y={960} width={8} height={40} rx={4} fill="#d8dde3" />
      {/* бетонная площадка */}
      <rect x={0} y={1080} width={W} height={220} fill={conc} />
      {[0, 200, 400, 600, 800, 1000].map((x) => <rect key={x} x={x} y={1080} width={4} height={220} fill="#00000012" />)}
      <rect x={0} y={1180} width={W} height={4} fill="#00000012" />
      {[[260, 1250, 60], [610, 1230, 40], [120, 1140, 30]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx={r} ry={r * 0.25} fill="#00000014" />)}
      {/* масло и шины у магазина */}
      {[[740, 0], [772, 0], [804, 0], [756, 1], [788, 1]].map(([x, r]) => (
        <g key={`${x}-${r}`}>
          <rect x={x} y={FLOOR_Y - 36 - r * 36} width={28} height={36} rx={4} fill={r ? "#e0a030" : "#c8553d"} />
          <rect x={x + 8} y={FLOOR_Y - 42 - r * 36} width={10} height={8} fill="#3a3f47" />
        </g>
      ))}
      {[0, 1, 2].map((i) => <rect key={i} x={866} y={FLOOR_Y - 26 - i * 24} width={48} height={24} rx={10} fill={i % 2 ? "#3a3a40" : "#2b2a2e"} />)}
      {/* навес на столбах, колонки (дальний план) */}
      <rect x={60} y={560} width={640} height={70} rx={10} fill={WHITE} />
      <rect x={60} y={610} width={640} height={20} fill={brand} />
      <rect x={60} y={630} width={640} height={10} fill="#00000018" />
      {[150, 270, 390, 510, 630].map((x) => <rect key={x} x={x - 30} y={640} width={60} height={8} rx={4} fill="#fff8e0" />)}
      {[120, 620].map((x) => (
        <g key={x}>
          <rect x={x} y={630} width={24} height={FLOOR_Y - 630} fill="#c9ccd2" />
          <rect x={x} y={FLOOR_Y - 60} width={24} height={60} fill="#e0a030" />
          {[0, 1, 2].map((i) => <rect key={i} x={x} y={FLOOR_Y - 54 + i * 20} width={24} height={8} fill={INK} />)}
        </g>
      ))}
      <circle cx={380} cy={480} r={70} fill={brand} />
      <circle cx={380} cy={480} r={58} fill="none" stroke={WHITE} strokeWidth={4} />
      <path d="M380 440 q34 44 0 76 q-34 -32 0 -76 z" fill="#f7e27a" />
      <rect x={374} y={548} width={12} height={20} fill="#8a8f98" />
      <Pump x={0.3 * W - 60} color={RED} num="92" />
      <Pump x={0.52 * W - 60} color="#4a7fb0" num="95" />
      {/* колонка «Воздух» и урна */}
      <rect x={14} y={FLOOR_Y - 170} width={50} height={170} rx={8} fill="#4a7fb0" />
      <rect x={20} y={FLOOR_Y - 160} width={38} height={26} rx={4} fill="#1e1a18" />
      <circle cx={39} cy={FLOOR_Y - 100} r={12} fill="#e8e4d8" />
      <path d="M64 1100 q30 10 20 50" stroke="#1e1a18" strokeWidth={6} fill="none" />
      <Bin x={680} y={FLOOR_Y} s={0.7} color="#5a7a5a" />
      {/* бордюр, дорога (передний план), обочина */}
      <rect x={0} y={1296} width={W} height={18} fill="#e8e4d8" />
      <Road y0={1314} y1={1500} color={palette.floor} line={1400} />
      <rect x={0} y={1326} width={W} height={6} fill="#f2e6d0" opacity={0.6} />
      <rect x={0} y={1484} width={W} height={6} fill="#f2e6d0" opacity={0.6} />
      <Cracks items={[[200, 1450, 1], [780, 1360, 0.8]]} />
      <rect x={0} y={1500} width={W} height={40} fill={DIRT} />
      <rect x={0} y={1540} width={W} height={H - 1540} fill={GRASS} />
      <Tufts color="#7aa858" items={[[80, 1600, 1.2], [420, 1680, 1], [860, 1620, 1.2], [600, 1820, 1.4]]} />
    </>
  );
};

export const Doroga = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "car" || variant === "taxi" ? (
      <CarFront palette={palette} taxi={variant === "taxi"} />
    ) : variant === "bus" ? (
      <BusInterior />
    ) : variant === "subway" ? (
      <SubwayInterior />
    ) : variant === "tram" ? (
      <TramInterior />
    ) : variant === "bus-stop" ? (
      <BusStop palette={palette} />
    ) : variant === "gas-station" ? (
      <GasStation palette={palette} />
    ) : (
      <Countryside palette={palette} />
    )}
  </Canvas>
);

