import { Canvas, Cloud, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { depthScale, feetY, seatTopY } from "../world/depth";
import { SeatFront, dark, light } from "./samolet";

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

/* ---------- загородная трасса (по умолчанию) ---------- */
const Countryside = ({ palette }: BackdropProps) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
    <circle cx={860} cy={560} r={64} fill="#fbe7a6" />
    <Cloud x={70} y={500} s={0.6} color="#ffffffcc" />
    <Cloud x={620} y={110} s={0.5} color="#ffffff99" />
    <g fill="none" stroke="#5a6470" strokeWidth={5} strokeLinecap="round">
      <path d="M430 560 q14 -12 28 0 q14 -12 28 0" />
      <path d="M500 610 q10 -9 20 0 q10 -9 20 0" />
    </g>
    {/* холмы, хутор, поля */}
    <path d="M0 820 Q200 720 420 800 T820 780 T1080 800 V900 H0 Z" fill="#a9c79a" />
    <path d="M0 860 Q300 800 600 850 T1080 840 V900 H0 Z" fill="#9cbf84" />
    <rect x={690} y={812} width={60} height={40} fill="#e8d5b0" />
    <path d="M680 815 L720 784 L760 815 Z" fill={RED} />
    {[300, 340, 820, 860, 900].map((x, i) => <circle key={x} cx={x} cy={838 - (i % 2) * 8} r={22} fill="#6f9e5a" />)}
    <path d="M0 870 H1080 V930 H0 Z" fill={WHEAT} />
    <path d="M380 870 H1080 V930 H300 Z" fill="#b9cf7a" />
    <path d="M0 930 H1080 V1010 H0 Z" fill={GRASS} />
    <path d="M0 930 H520 L470 1010 H0 Z" fill="#d9b85a" />
    <path d="M0 1010 H1080 V1120 H0 Z" fill="#a3c472" />
    <path d="M560 1000 Q600 900 640 1000 Z" fill="#d9b85a" />
    <path d="M555 1000 h90 v8 h-90 z" fill="#b8963e" />
    {/* дальняя обочина (дальний план — пешеходы), дорога (передний план — машины), ближняя обочина */}
    <rect x={0} y={1110} width={W} height={130} fill={DIRT} />
    <rect x={0} y={1110} width={W} height={8} fill="#00000014" />
    <Road y0={1240} y1={1430} color={palette.floor} line={1300} />
    <rect x={0} y={1430} width={W} height={40} fill={DIRT} />
    <rect x={0} y={1470} width={W} height={H - 1470} fill={GRASS} />
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
    <RoadSign x={940} top={600} />
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
      <Cloud x={90} y={330} s={0.5} color="#ffffffcc" />
      <Cloud x={760} y={250} s={0.4} color="#ffffffaa" />
      <path d="M0 860 Q260 790 540 840 T1080 820 V960 H0 Z" fill="#a9c79a" />
      <rect x={0} y={900} width={W} height={H - 900} fill={GRASS} />
      <path d="M500 900 H580 L1000 1920 H80 Z" fill={palette.floor} />
      {[140, 940].map((x) => <circle key={x} cx={x} cy={880} r={44} fill="#6f9e5a" />)}
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
        {/* торпедо, руль водителя, счётчик такси */}
        <rect x={0} y={1222} width={W} height={100} fill={trim} />
        <rect x={0} y={1222} width={W} height={14} fill={light(trim, 0.15)} />
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
      <rect x={476} y={1708} width={128} height={14} rx={4} fill="#3a3f47" />
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

/** Окно с видом на улицу (дома, деревья) или тоннель. */
const StreetView = ({ x, y, w, h, kind, frame }: { x: number; y: number; w: number; h: number; kind: "street" | "tunnel" | "field"; frame: string }) => {
  const id = `doroga-win-${x}-${y}`;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={26} fill={frame} />
      <defs><clipPath id={id}><rect x={x + 14} y={y + 14} width={w - 28} height={h - 28} rx={18} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {kind === "tunnel" ? (
          <>
            <rect x={x} y={y} width={w} height={h} fill="#2b3a55" />
            <rect x={x} y={y + h * 0.3} width={w} height={10} fill="#f5d77a" opacity={0.5} />
            <rect x={x + 30} y={y + h * 0.75} width={w - 90} height={8} fill="#f5d77a" opacity={0.35} />
          </>
        ) : (
          <>
            <rect x={x} y={y} width={w} height={h} fill="#a9c7d9" />
            {kind === "street" ? (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <rect key={i} x={x + 10 + i * (w / 4)} y={y + h * (0.35 + (i % 2) * 0.12)} width={w / 4 - 16} height={h} fill={["#d8b48a", "#c9a0a0", "#b9c4a0", "#d0c0a0"][i]} />
                ))}
                {[0, 1, 2, 3].map((i) => (
                  <rect key={`w${i}`} x={x + 30 + i * (w / 4)} y={y + h * (0.5 + (i % 2) * 0.12)} width={20} height={26} fill="#f2e6d0" opacity={0.8} />
                ))}
                <circle cx={x + w * 0.7} cy={y + h * 0.75} r={h * 0.18} fill="#6f9e5a" />
              </>
            ) : (
              <>
                <rect x={x} y={y + h * 0.66} width={w} height={h} fill="#8fb86a" />
                <circle cx={x + 90} cy={y + h * 0.66} r={40} fill="#6f9e5a" />
              </>
            )}
          </>
        )}
      </g>
      <rect x={x + 30} y={y + 26} width={60} height={12} rx={6} fill="#ffffff" opacity={0.35} />
    </g>
  );
};

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
      <StreetView x={440} y={470} w={300} h={330} kind="street" frame={dark(wall, 0.25)} />
      <StreetView x={760} y={470} w={320} h={330} kind="street" frame={dark(wall, 0.25)} />
      <rect x={430} y={830} width={650} height={16} fill={dark(wall, 0.15)} />
      {/* кабина: лобовое стекло, приборы, руль, кресло водителя */}
      <path d="M0 360 H230 L250 980 H0 Z" fill={dark(wall, 0.3)} />
      <path d="M0 380 H212 L228 960 H0 Z" fill="#a9c7d9" />
      <rect x={0} y={760} width={228} height={200} fill="#8a8f98" />
      <rect x={0} y={860} width={228} height={30} fill="#f2e6d0" opacity={0.7} />
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
      {/* сиденья у борта (дальний план): seat-1, seat-2, seat-3 (+ четвёртое за краем) */}
      {[0.47, 0.62, 0.78, 0.93].map((x) => (
        <SeatFront key={x} x={x} z={1} w={170} back={270} color={seat} head={light(seat, 0.2)} base="#5a5f68" />
      ))}
      {/* поручни и ручки: средний и передний планы */}
      <Straps z={0.5} y={410} xs={[0.42, 0.7]} color={dark(seat, 0.2)} />
      <Straps z={0} y={330} xs={[0.3, 0.75]} color={dark(seat, 0.2)} />
      <Pole x={0.56} z={0.5} top={330} />
      <circle cx={0.56 * W} cy={760} r={16} fill={RED} />
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
      <rect x={330} y={400} width={420} height={44} rx={6} fill={WHITE} />
      <path d="M350 422 H730" stroke={RED} strokeWidth={8} />
      {[370, 450, 530, 610, 690].map((x) => <circle key={x} cx={x} cy={422} r={9} fill={WHITE} stroke={RED} strokeWidth={5} />)}
      {/* двери слева и справа */}
      {[70, 790].map((x) => (
        <g key={x}>
          <rect x={x} y={400} width={220} height={base - 400} rx={8} fill="#8a9099" />
          {[0, 1].map((i) => (
            <g key={i}>
              <rect x={x + 10 + i * 104} y={410} width={96} height={base - 420} rx={6} fill="#b8bec6" />
              <rect x={x + 22 + i * 104} y={440} width={72} height={330} rx={6} fill="#2b3a55" />
              <rect x={x + 22 + i * 104} y={560} width={72} height={8} fill="#f5d77a" opacity={0.5} />
            </g>
          ))}
          <rect x={x + 106} y={410} width={8} height={base - 420} fill="#5a6470" />
        </g>
      ))}
      {/* окна над диваном */}
      <StreetView x={330} y={470} w={420} h={330} kind="tunnel" frame={dark(wall, 0.25)} />
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
      <StreetView x={30} y={460} w={340} h={340} kind="street" frame={trim} />
      <StreetView x={390} y={460} w={340} h={340} kind="street" frame={trim} />
      <rect x={0} y={820} width={760} height={14} fill={dark(wall, 0.2)} />
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
      return (
        <g key={i}>
          <rect x={x as number} y={top} width={w as number} height={y - top} fill={c as string} />
          <rect x={x as number} y={top} width={w as number} height={20} fill={dark(c as string, 0.15)} />
          {Array.from({ length: 3 }).flatMap((_, r) =>
            Array.from({ length: Math.floor((w as number) / 90) }).map((__, k) => (
              <rect key={`${r}-${k}`} x={(x as number) + 30 + k * 90} y={top + 60 + r * 130} width={50} height={80} rx={6} fill="#f2e6d0" />
            )),
          )}
        </g>
      );
    })}
  </g>
);

const BusStop = ({ palette }: BackdropProps) => {
  const pave = "#cfc8bc";
  const glass = "#cfe6f5";
  const frame = "#5a6470";
  const top = seatTopY(1);
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <Cloud x={620} y={170} s={0.45} color="#ffffffcc" />
      <Facades y={1080} />
      {/* тротуар (дальний и средний планы) */}
      <rect x={0} y={1080} width={W} height={230} fill={pave} />
      {[1130, 1190, 1250].map((y) => <rect key={y} x={0} y={y} width={W} height={4} fill="#00000014" />)}
      {/* навес: задняя стеклянная стенка, боковая с плакатом, крыша */}
      <rect x={110} y={690} width={560} height={FLOOR_Y - 690} fill={glass} opacity={0.65} />
      <rect x={110} y={690} width={16} height={FLOOR_Y - 690} fill={frame} />
      <rect x={654} y={690} width={16} height={FLOOR_Y - 690} fill={frame} />
      <rect x={110} y={900} width={560} height={10} fill={frame} />
      <rect x={560} y={720} width={100} height={170} rx={6} fill="#e0a030" />
      <circle cx={610} cy={790} r={30} fill={WHITE} />
      <rect x={576} y={840} width={68} height={10} rx={4} fill={WHITE} />
      <rect x={80} y={650} width={620} height={46} rx={10} fill={frame} />
      <rect x={80} y={690} width={620} height={8} fill="#00000025" />
      {/* скамейка (дальний план): bench-1, bench-2 */}
      <rect x={0.3 * W - 110} y={top - 10} width={0.15 * W + 220} height={28} rx={10} fill="#b07a4a" />
      <rect x={0.3 * W - 110} y={top + 18} width={0.15 * W + 220} height={8} fill={dark("#b07a4a", 0.3)} />
      {[0.3 * W - 90, 0.45 * W + 70].map((x) => <rect key={x} x={x} y={top + 26} width={18} height={FLOOR_Y - top - 26} fill={frame} />)}
      {/* знак остановки */}
      <rect x={0.75 * W - 8} y={620} width={16} height={FLOOR_Y - 620} fill="#8a8f98" />
      <rect x={0.75 * W - 64} y={540} width={128} height={128} rx={14} fill="#2f6fb0" />
      <rect x={0.75 * W - 50} y={554} width={100} height={100} rx={10} fill={WHITE} />
      <rect x={0.75 * W - 40} y={576} width={80} height={48} rx={10} fill="#2f6fb0" />
      <rect x={0.75 * W - 32} y={584} width={64} height={16} rx={4} fill={WHITE} />
      <circle cx={0.75 * W - 22} cy={630} r={9} fill={INK} />
      <circle cx={0.75 * W + 22} cy={630} r={9} fill={INK} />
      {/* урна */}
      <path d={`M${0.88 * W - 40} ${FLOOR_Y - 120} H${0.88 * W + 40} L${0.88 * W + 30} ${FLOOR_Y} H${0.88 * W - 30} Z`} fill="#5a7a5a" />
      {/* бордюр, дорога (передний план), дальний тротуар */}
      <rect x={0} y={1296} width={W} height={18} fill="#e8e4d8" />
      <Road y0={1314} y1={1500} color={palette.floor} line={1400} />
      <rect x={0} y={1500} width={W} height={18} fill="#e8e4d8" />
      <rect x={0} y={1518} width={W} height={H - 1518} fill={pave} />
    </>
  );
};

/* ---------- заправка: навес с колонками, магазинчик, дорога на переднем плане ---------- */
const Pump = ({ x, color }: { x: number; color: string }) => (
  <g>
    <rect x={x - 10} y={FLOOR_Y - 20} width={140} height={20} rx={6} fill="#b8b2a6" />
    <rect x={x} y={FLOOR_Y - 300} width={120} height={280} rx={14} fill={color} />
    <rect x={x + 14} y={FLOOR_Y - 280} width={92} height={60} rx={6} fill="#1e1a18" />
    <rect x={x + 24} y={FLOOR_Y - 268} width={50} height={16} rx={3} fill="#5fb878" />
    <rect x={x + 24} y={FLOOR_Y - 246} width={70} height={12} rx={3} fill="#e0a030" />
    <rect x={x + 14} y={FLOOR_Y - 200} width={92} height={70} rx={6} fill={WHITE} />
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
      <Cloud x={80} y={260} s={0.5} color="#ffffffcc" />
      <path d="M0 900 Q260 820 540 880 T1080 860 V1000 H0 Z" fill="#a9c79a" />
      <rect x={0} y={960} width={W} height={130} fill="#9cbf84" />
      {/* магазин справа */}
      <rect x={720} y={760} width={360} height={FLOOR_Y - 760} fill="#e8e0d0" />
      <rect x={700} y={730} width={400} height={50} rx={8} fill={brand} />
      <rect x={750} y={820} width={140} height={160} rx={8} fill="#a9c7d9" />
      <rect x={920} y={820} width={130} height={FLOOR_Y - 820} rx={6} fill="#6f8a9a" />
      <rect x={932} y={840} width={106} height={200} rx={4} fill="#a9c7d9" />
      {/* бетонная площадка */}
      <rect x={0} y={1080} width={W} height={220} fill={conc} />
      {[0, 200, 400, 600, 800, 1000].map((x) => <rect key={x} x={x} y={1080} width={4} height={220} fill="#00000012" />)}
      <rect x={0} y={1180} width={W} height={4} fill="#00000012" />
      {/* навес на столбах, колонки (дальний план) */}
      <rect x={60} y={560} width={640} height={70} rx={10} fill={WHITE} />
      <rect x={60} y={610} width={640} height={20} fill={brand} />
      {[120, 620].map((x) => <rect key={x} x={x} y={630} width={24} height={FLOOR_Y - 630} fill="#c9ccd2" />)}
      <circle cx={380} cy={480} r={70} fill={brand} />
      <path d="M380 440 q34 44 0 76 q-34 -32 0 -76 z" fill="#f7e27a" />
      <rect x={374} y={548} width={12} height={20} fill="#8a8f98" />
      <Pump x={0.3 * W - 60} color={RED} />
      <Pump x={0.52 * W - 60} color="#4a7fb0" />
      {/* бордюр, дорога (передний план), обочина */}
      <rect x={0} y={1296} width={W} height={18} fill="#e8e4d8" />
      <Road y0={1314} y1={1500} color={palette.floor} line={1400} />
      <rect x={0} y={1500} width={W} height={40} fill={DIRT} />
      <rect x={0} y={1540} width={W} height={H - 1540} fill={GRASS} />
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

