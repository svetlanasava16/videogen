import { Canvas, Cloud, FLOOR_Y, W, H, type BackdropProps } from "./parts";

/** Осветлить (k>0) или затемнить (k<0) цвет #rrggbb. */
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const t = k < 0 ? 0 : 255;
  const p = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * p));
  return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
};

const GRASS = "#8fb86a";
const WHEAT = "#e6c46a";
const DIRT = "#c9b08a";

/** Старая легковушка, смотрит влево; (x, y) — левый край и линия колёс. */
const OldCar = ({ x, y, body, glass = "#cfe6f5" }: { x: number; y: number; body: string; glass?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={200} cy={0} rx={220} ry={16} fill="#00000022" />
    {/* багаж на крыше */}
    <rect x={150} y={-262} width={130} height={46} rx={10} fill="#8a5a3a" />
    <rect x={200} y={-262} width={12} height={46} fill="#6b4429" />
    <rect x={120} y={-218} width={190} height={10} rx={5} fill="#3a3a40" />
    {/* кузов */}
    <path d="M70 -110 C90 -200 120 -208 170 -208 H280 C330 -208 350 -190 370 -110 Z" fill={body} />
    <rect x={0} y={-130} width={410} height={100} rx={46} fill={body} />
    <path d="M110 -120 C125 -180 140 -188 180 -188 H218 V-120 Z" fill={glass} />
    <path d="M232 -120 V-188 H276 C312 -188 326 -170 340 -120 Z" fill={glass} />
    <rect x={20} y={-80} width={370} height={10} rx={5} fill={shade(body, -0.15)} />
    <rect x={238} y={-108} width={30} height={8} rx={4} fill={shade(body, -0.3)} />
    <circle cx={14} cy={-92} r={18} fill="#fff4c8" />
    <rect x={-10} y={-56} width={50} height={18} rx={9} fill="#c9ccd2" />
    <rect x={370} y={-56} width={50} height={18} rx={9} fill="#c9ccd2" />
    {[95, 320].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={-30} r={48} fill="#2f2a2a" />
        <circle cx={cx} cy={-30} r={20} fill="#c9ccd2" />
      </g>
    ))}
  </g>
);

const RoadSign = ({ x, y = FLOOR_Y - 20, top = 600 }: { x: number; y?: number; top?: number }) => (
  <g>
    <rect x={x - 8} y={top + 80} width={16} height={y - top - 80} fill="#8a8f98" />
    <path d={`M${x} ${top} L${x + 80} ${top + 140} L${x - 80} ${top + 140} Z`} fill="#c8553d" />
    <path d={`M${x} ${top + 30} L${x + 54} ${top + 124} L${x - 54} ${top + 124} Z`} fill="#fff8ec" />
    {/* значок «корова на дороге» без текста */}
    <ellipse cx={x} cy={top + 102} rx={22} ry={12} fill="#2b1d14" />
    <circle cx={x - 22} cy={top + 94} r={8} fill="#2b1d14" />
    <rect x={x - 14} y={top + 108} width={5} height={10} fill="#2b1d14" />
    <rect x={x + 10} y={top + 108} width={5} height={10} fill="#2b1d14" />
  </g>
);

const Countryside = ({ palette }: BackdropProps) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
    <circle cx={860} cy={560} r={64} fill="#fbe7a6" />
    <Cloud x={70} y={500} s={0.6} color="#ffffffcc" />
    <Cloud x={620} y={110} s={0.5} color="#ffffff99" />
    {/* птицы */}
    <g fill="none" stroke="#5a6470" strokeWidth={5} strokeLinecap="round">
      <path d="M430 560 q14 -12 28 0 q14 -12 28 0" />
      <path d="M500 610 q10 -9 20 0 q10 -9 20 0" />
    </g>
    {/* холмы */}
    <path d="M0 820 Q200 720 420 800 T820 780 T1080 800 V900 H0 Z" fill="#a9c79a" />
    <path d="M0 860 Q300 800 600 850 T1080 840 V900 H0 Z" fill="#9cbf84" />
    {/* дальний хутор и деревья */}
    <rect x={690} y={812} width={60} height={40} fill="#e8d5b0" />
    <path d="M680 815 L720 784 L760 815 Z" fill="#c8553d" />
    {[300, 340, 820, 860, 900].map((x, i) => <circle key={x} cx={x} cy={838 - (i % 2) * 8} r={22} fill="#6f9e5a" />)}
    {/* поля */}
    <path d="M0 870 H1080 V930 H0 Z" fill={WHEAT} />
    <path d="M380 870 H1080 V930 H300 Z" fill="#b9cf7a" />
    <path d="M0 930 H1080 V1010 H0 Z" fill={GRASS} />
    <path d="M0 930 H520 L470 1010 H0 Z" fill="#d9b85a" />
    <path d="M0 1010 H1080 V1110 H0 Z" fill="#a3c472" />
    {/* стог */}
    <path d="M560 1000 Q600 900 640 1000 Z" fill="#d9b85a" />
    <path d="M555 1000 h90 v8 h-90 z" fill="#b8963e" />
    {/* обочина и дорога */}
    <rect x={0} y={1100} width={W} height={40} fill={DIRT} />
    <rect x={0} y={1140} width={W} height={200} fill={palette.floor} />
    <rect x={0} y={1140} width={W} height={12} fill="#00000018" />
    {[40, 300, 560, 820].map((x) => <rect key={x} x={x} y={1236} width={160} height={16} rx={6} fill="#f2e6d0" opacity={0.75} />)}
    <rect x={0} y={1340} width={W} height={40} fill={DIRT} />
    <rect x={0} y={1380} width={W} height={H - 1380} fill={GRASS} />
    {/* кустики у обочины */}
    <g fill="#6f9e5a">
      <circle cx={250} cy={1100} r={34} />
      <circle cx={290} cy={1108} r={26} />
    </g>
    <RoadSign x={110} top={600} />
    <OldCar x={700} y={1196} body={palette.accent} />
  </>
);

/** Салон легковушки с заднего сиденья. */
const CarInterior = ({ palette }: BackdropProps) => {
  const trim = "#3d3633";
  const seat = "#8a5a3a";
  const ws = "M120 450 Q540 400 960 450 L1010 900 H70 Z";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={trim} />
      <rect x={0} y={0} width={W} height={420} fill="#4a423e" />
      {/* вид в лобовое стекло */}
      <clipPath id="doroga-ws"><path d={ws} /></clipPath>
      <g clipPath="url(#doroga-ws)">
        <rect x={0} y={400} width={W} height={520} fill={palette.wall} />
        <Cloud x={680} y={520} s={0.4} color="#ffffffcc" />
        <path d="M0 760 Q300 700 600 750 T1080 740 V920 H0 Z" fill="#a9c79a" />
        <rect x={0} y={770} width={W} height={150} fill={GRASS} />
        <path d="M0 790 H1080 V830 H0 Z" fill={WHEAT} opacity={0.8} />
        <path d="M520 770 H560 L860 920 H220 Z" fill={palette.floor} />
        {[[536, 790, 8, 14], [532, 820, 16, 24], [526, 862, 28, 40]].map(([x, y, w, h]) => <rect key={y} x={x} y={y} width={w} height={h} fill="#f2e6d0" />)}
        <rect x={830} y={720} width={8} height={70} fill="#8a8f98" />
        <path d="M834 690 l26 44 h-52 z" fill="#c8553d" />
        {[140, 220, 940].map((x) => <circle key={x} cx={x} cy={760} r={30} fill="#6f9e5a" />)}
      </g>
      <path d={ws} fill="#ffffff" opacity={0.06} />
      {/* зеркало и ёлочка-ароматизатор */}
      <rect x={530} y={420} width={20} height={40} fill="#2b2522" />
      <rect x={440} y={456} width={200} height={56} rx={22} fill="#2b2522" />
      <rect x={452} y={466} width={176} height={36} rx={16} fill="#8fa8b8" />
      <rect x={538} y={512} width={4} height={50} fill="#2b2522" />
      <path d="M540 556 l24 40 h-12 l18 30 h-60 l18 -30 h-12 z" fill="#5b8c5a" />
      {/* приборная панель */}
      <path d="M0 880 Q540 840 1080 880 V1010 H0 Z" fill="#544843" />
      <rect x={0} y={990} width={W} height={30} fill="#00000022" />
      <circle cx={270} cy={930} r={130} fill="none" stroke="#2b2522" strokeWidth={26} />
      <rect x={720} y={905} width={120} height={36} rx={10} fill="#2b2522" />
      {/* передние сиденья */}
      {[60, 690].map((x) => (
        <g key={x}>
          <rect x={x + 112} y={760} width={14} height={60} fill="#2b2522" />
          <rect x={x + 204} y={760} width={14} height={60} fill="#2b2522" />
          <rect x={x + 80} y={650} width={170} height={120} rx={46} fill={seat} />
          <rect x={x} y={800} width={330} height={400} rx={70} fill={seat} />
          <rect x={x + 40} y={840} width={250} height={300} rx={50} fill={shade(seat, 0.1)} />
          <rect x={x + 160} y={850} width={10} height={280} rx={5} fill={shade(seat, -0.12)} />
        </g>
      ))}
      {/* рычаг КПП */}
      <rect x={480} y={1010} width={120} height={180} rx={20} fill="#2b2522" />
      <rect x={532} y={960} width={16} height={80} fill="#1e1a18" />
      <circle cx={540} cy={956} r={24} fill="#1e1a18" />
      {/* пол */}
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill="#2e2826" />
      <rect x={0} y={FLOOR_Y} width={W} height={16} fill="#00000033" />
    </>
  );
};

/** Салон автобуса или вагона метро. */
const TransitInterior = ({ subway }: { subway: boolean }) => {
  const wall = subway ? "#d9dde2" : "#efe3c8";
  const seat = subway ? "#4a6fa5" : "#c8553d";
  const rail = "#b8bec6";
  const floor = subway ? "#8c8f94" : "#6b6b6b";
  const panes = [[50, 300], [390, 300], [730, 300]];
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      <rect x={0} y={0} width={W} height={430} fill={shade(wall, -0.08)} />
      {subway && <rect x={60} y={50} width={960} height={40} rx={20} fill="#fffbea" />}
      {/* окна */}
      {panes.map(([x, w]) => (
        <g key={x}>
          <rect x={x} y={470} width={w} height={320} rx={30} fill={shade(wall, -0.25)} />
          <rect x={x + 14} y={484} width={w - 28} height={292} rx={22} fill={subway ? "#2b3a55" : "#a9c7d9"} />
          {subway ? (
            <>
              <rect x={x + 14} y={560} width={w - 28} height={10} fill="#f5d77a" opacity={0.5} />
              <rect x={x + 40} y={690} width={w - 120} height={8} fill="#f5d77a" opacity={0.35} />
            </>
          ) : (
            <>
              <rect x={x + 14} y={680} width={w - 28} height={96} fill="#8fb86a" />
              <circle cx={x + 90} cy={680} r={40} fill="#6f9e5a" />
              <rect x={x + 160} y={620} width={70} height={60} fill="#e8d5b0" />
              <path d={`M${x + 150} ${625} l45 -36 l45 36 z`} fill="#c8553d" />
            </>
          )}
          <rect x={x + 30} y={496} width={60} height={12} rx={6} fill="#ffffff" opacity={0.35} />
        </g>
      ))}
      {/* поручень и ручки */}
      <rect x={0} y={440} width={W} height={16} rx={8} fill={rail} />
      {[230, 420, 660, 850].map((x) => (
        <g key={x}>
          <rect x={x - 6} y={448} width={12} height={70} fill={shade(seat, -0.2)} />
          <circle cx={x} cy={540} r={24} fill="none" stroke={shade(seat, -0.2)} strokeWidth={10} />
        </g>
      ))}
      {/* сиденья вдоль стены */}
      {subway ? (
        <g>
          <rect x={60} y={850} width={960} height={150} rx={30} fill={seat} />
          <rect x={40} y={990} width={1000} height={50} rx={20} fill={shade(seat, -0.15)} />
          <rect x={60} y={1040} width={960} height={150} fill={shade(wall, -0.15)} />
        </g>
      ) : (
        [70, 330, 590, 850].map((x) => (
          <g key={x}>
            <rect x={x} y={840} width={180} height={170} rx={34} fill={seat} />
            <rect x={x + 30} y={860} width={120} height={20} rx={10} fill={shade(seat, 0.15)} />
            <rect x={x - 10} y={1000} width={200} height={44} rx={18} fill={shade(seat, -0.15)} />
            <rect x={x + 70} y={1044} width={40} height={146} fill="#5a5f68" />
          </g>
        ))
      )}
      {/* вертикальные поручни */}
      {[100, 980].map((x) => (
        <g key={x}>
          <rect x={x - 9} y={440} width={18} height={FLOOR_Y - 440} fill={rail} />
          {!subway && x === 980 && <circle cx={x} cy={760} r={20} fill="#c8553d" />}
        </g>
      ))}
      {/* пол */}
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill={floor} />
      <rect x={0} y={FLOOR_Y} width={W} height={16} fill="#00000025" />
      {subway ? <rect x={0} y={FLOOR_Y + 30} width={W} height={14} fill="#e0a030" /> : [1240, 1290].map((y) => <rect key={y} x={0} y={y} width={W} height={4} fill="#00000018" />)}
    </>
  );
};

export const Doroga = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "car" ? (
      <CarInterior palette={palette} />
    ) : variant === "bus" || variant === "subway" ? (
      <TransitInterior subway={variant === "subway"} />
    ) : (
      <Countryside palette={palette} />
    )}
  </Canvas>
);
