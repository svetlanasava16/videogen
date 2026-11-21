import { Canvas, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { Birds, Label, Puff, rnd, shade } from "./ulitsa";

/**
 * Фон «plyazh»: морской пляж. Небо с солнцем и чайками, на горизонте мыс с маяком, парусники и теплоход, буйки;
 * море слоями до линии прибоя у дальнего плана, мокрый и сухой песок. Красный зонт слева (umbrella, x 0.2),
 * у воды — water (0.6), полотенце на песке справа (towel, 0.8). Все метки — средний план; песок ниже 1190 свободен.
 */

const SEA_FAR = "#3d7fb5";
const SEA = "#4f97c9";
const SEA_NEAR = "#6fbcd8";

/** Пляжный зонт: шест в песке у (x, y), купол в полоску. */
const Umbrella = ({ x, y, s = 1, a, b }: { x: number; y: number; s?: number; a: string; b: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={150} ry={16} fill="#00000014" />
    <rect x={-6} y={-480} width={12} height={480} fill="#f4f1ea" />
    <path d="M-200 -440 Q0 -620 200 -440 Z" fill={a} />
    {[-1, 1].map((k) => <path key={k} d={`M0 -560 Q${k * 70} -540 ${k * 120} -440 H${k * 40} Q${k * 30} -520 0 -560 Z`} fill={b} />)}
    {Array.from({ length: 6 }).map((_, i) => (
      <path key={i} d={`M${-200 + i * 80} -440 q20 18 40 0 q20 18 40 0`} fill={i % 2 ? a : b} />
    ))}
    <circle cx={0} cy={-566} r={10} fill={shade(a, -0.3)} />
  </g>
);

/** Парусник на горизонте. */
const Sail = ({ x, y, s = 1, c = "#ffffff" }: { x: number; y: number; s?: number; c?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-50 0 h100 l-14 16 h-72 z" fill="#f4f1ea" />
    <rect x={-2} y={-110} width={4} height={110} fill="#5a4636" />
    <path d="M4 -104 L52 -6 H4 Z" fill={c} />
    <path d="M-4 -86 L-40 -6 H-4 Z" fill={shade(c, -0.08)} />
  </g>
);

export const Plyazh = ({ palette }: BackdropProps) => {
  const sand = palette.floor;
  const sky = palette.wall;
  return (
    <Canvas>
      {/* небо */}
      <rect x={0} y={0} width={W} height={H} fill={sky} />
      <rect x={0} y={560} width={W} height={260} fill={shade(sky, 0.25)} />
      <circle cx={860} cy={520} r={130} fill="#f6d36b" opacity={0.18} />
      <circle cx={860} cy={520} r={90} fill="#f6d36b" />
      <Puff x={80} y={200} s={0.6} color="#ffffffcc" under="#ffffff99" />
      <Puff x={520} y={600} s={0.35} color="#ffffffdd" />
      <Puff x={-40} y={660} s={0.28} color="#ffffffcc" />
      <Birds items={[[380, 470, 1.2], [430, 500, 1], [300, 520, 0.8], [700, 640, 0.7]]} color="#5a6470" />
      {/* мыс с маяком и дальние горы */}
      <path d="M-20 822 Q80 740 200 780 Q300 720 420 822 Z" fill="#8fb0b8" />
      <path d="M700 822 Q800 760 900 770 Q1000 720 1100 760 V822 Z" fill="#7aa08a" />
      <g>
        <rect x={938} y={668} width={26} height={108} fill="#f4f1ea" />
        {[690, 730].map((y) => <rect key={y} x={938} y={y} width={26} height={18} fill="#d24b4b" />)}
        <rect x={932} y={648} width={38} height={22} rx={4} fill="#f6d36b" />
        <path d="M928 650 l23 -22 l23 22 z" fill="#d24b4b" />
        <path d="M970 658 L1080 620 V700 Z" fill="#fff6c8" opacity={0.35} />
      </g>
      {/* море слоями */}
      <rect x={0} y={820} width={W} height={320} fill={SEA} />
      <rect x={0} y={820} width={W} height={70} fill={SEA_FAR} />
      <rect x={0} y={820} width={W} height={6} fill={shade(SEA_FAR, 0.3)} />
      {/* теплоход и парусники */}
      <g>
        <path d="M480 818 h170 l-20 20 h-130 z" fill="#f4f1ea" />
        <rect x={510} y={796} width={110} height={22} fill="#f4f1ea" />
        <rect x={530} y={780} width={70} height={18} fill="#e8e4d8" />
        <rect x={588} y={760} width={18} height={22} fill="#d24b4b" />
        {[520, 540, 560, 580, 600].map((x) => <circle key={x} cx={x} cy={806} r={4} fill={SEA_FAR} />)}
      </g>
      <Sail x={260} y={870} s={0.7} />
      <Sail x={820} y={880} s={0.55} c="#f6d36b" />
      <Sail x={120} y={850} s={0.4} />
      {/* блики солнца на воде */}
      {[[780, 900, 120], [820, 930, 80], [760, 960, 140], [840, 1000, 70]].map(([x, y, w], i) => (
        <rect key={i} x={x} y={y} width={w} height={6} rx={3} fill="#fff6c8" opacity={0.55} />
      ))}
      {/* волны */}
      {Array.from({ length: 22 }).map((_, i) => {
        const x = rnd(i + 2) * W;
        const y = 900 + rnd(i + 30) * 200;
        const w = 40 + (y - 900) * 0.3;
        return <path key={i} d={`M${x} ${y} q${w / 4} -10 ${w / 2} 0 q${w / 4} 10 ${w / 2} 0`} stroke={shade(SEA, 0.35)} strokeWidth={5} fill="none" strokeLinecap="round" />;
      })}
      {/* буйки */}
      {[[150, 960], [470, 950], [700, 970], [1000, 955]].map(([x, y]) => (
        <g key={x}>
          <ellipse cx={x} cy={y + 12} rx={22} ry={5} fill={shade(SEA, -0.15)} />
          <path d={`M${x - 14} ${y + 12} q0 -30 14 -30 q14 0 14 30 z`} fill="#e0602a" />
          <rect x={x - 14} y={y} width={28} height={6} fill="#f4f1ea" />
        </g>
      ))}
      {/* ближняя вода и прибой */}
      <path d="M0 1060 Q200 1040 400 1062 T800 1056 T1080 1060 V1140 H0 Z" fill={SEA_NEAR} />
      <path d="M0 1110 Q180 1090 360 1112 T720 1106 T1080 1112 V1150 H0 Z" fill="#9fd6e6" />
      <path d="M0 1132 Q180 1112 360 1134 T720 1128 T1080 1134" stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.85} />
      {[[60, 1124], [420, 1122], [780, 1118], [960, 1126]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx={20} ry={6} fill="#ffffff" opacity={0.8} />)}
      {/* мокрый и сухой песок */}
      <path d="M0 1140 Q180 1124 360 1146 T720 1140 T1080 1146 V1200 H0 Z" fill={shade(sand, -0.14)} />
      <path d="M0 1186 Q300 1176 600 1190 T1080 1184 V1920 H0 Z" fill={sand} />
      {/* рябь на песке, ракушки, звёздочка */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = rnd(i + 70) * W;
        const y = 1300 + rnd(i + 90) * 600;
        return <path key={i} d={`M${x} ${y} q30 -8 60 0 q30 8 60 0`} stroke={shade(sand, -0.1)} strokeWidth={4} fill="none" opacity={0.7} />;
      })}
      {[[320, 1250], [600, 1230], [140, 1500], [900, 1640], [480, 1780]].map(([x, y], i) => (
        <path key={i} d={`M${x - 12} ${y} q12 -22 24 0 z`} fill={i % 2 ? "#f2d6c8" : "#f6efe0"} />
      ))}
      <path d="M1000 1500 l8 -20 l8 20 l20 2 l-16 12 l6 20 l-18 -10 l-18 10 l6 -20 l-16 -12 z" fill="#e0844a" />
      {/* дальние зонты и вышка спасателя */}
      <Umbrella x={420} y={1176} s={0.32} a="#4a7fb0" b="#f4f1ea" />
      <Umbrella x={700} y={1170} s={0.28} a="#f6d36b" b="#f4f1ea" />
      <g>
        {[606, 660].map((x) => <rect key={x} x={x} y={1000} width={8} height={176} fill="#c9a06a" />)}
        <path d="M606 1060 L668 1120 M668 1060 L606 1120" stroke="#c9a06a" strokeWidth={5} />
        <rect x={594} y={980} width={86} height={24} rx={4} fill="#f4f1ea" />
        <path d="M588 984 L637 944 L686 984 Z" fill="#d24b4b" />
        <rect x={604} y={986} width={66} height={12} fill="#d24b4b" />
        <rect x={670} y={920} width={4} height={60} fill="#5a4636" />
        <path d="M674 922 h30 l-8 10 l8 10 h-30 z" fill="#e0602a" />
      </g>
      {/* красный зонт (umbrella), лежак под ним */}
      <g>
        <rect x={60} y={1160} width={260} height={20} rx={8} fill="#c9a06a" />
        <rect x={60} y={1150} width={260} height={14} rx={6} fill="#f4f1ea" />
        {[80, 300].map((x) => <rect key={x} x={x} y={1176} width={10} height={20} fill="#a8804a" />)}
      </g>
      <Umbrella x={0.2 * W} y={FLOOR_Y} s={0.95} a={palette.accent} b="#f4f1ea" />
      {/* полотенца на песке (towel) */}
      <path d="M700 1240 L1000 1236 L1030 1310 L690 1316 Z" fill="#3d6fb3" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${740 + i * 70} 1239 L${730 + i * 74} 1314 L${750 + i * 74} 1314 L${760 + i * 70} 1239 Z`} fill="#f4f1ea" opacity={0.85} />)}
      <path d="M40 1260 L300 1256 L310 1312 L30 1316 Z" fill="#f2b33d" />
      <path d="M40 1276 L302 1272 M38 1296 L306 1292" stroke="#d24b4b" strokeWidth={8} />
      {/* шлёпанцы, мяч, ведёрко с совочком, замок из песка */}
      <ellipse cx={1050} cy={1290} rx={14} ry={24} fill="#d24b4b" />
      <ellipse cx={1030} cy={1300} rx={14} ry={24} fill="#d24b4b" />
      <g>
        <circle cx={480} cy={1196} r={26} fill="#f4f1ea" />
        <path d="M454 1196 a26 26 0 0 1 52 0 z" fill="#d24b4b" />
        <path d="M470 1172 q10 24 0 48" stroke="#3d6fb3" strokeWidth={8} fill="none" />
        <ellipse cx={480} cy={1224} rx={24} ry={5} fill="#00000018" />
      </g>
      <g transform="translate(-40 240)">
        <path d="M150 1470 h70 l-8 60 h-54 z" fill="#3fae6a" />
        <path d="M160 1472 q25 -30 50 0" stroke="#3fae6a" strokeWidth={4} fill="none" />
        <path d="M240 1530 l40 -60" stroke="#f6d36b" strokeWidth={8} strokeLinecap="round" />
        <ellipse cx={284} cy={1464} rx={14} ry={10} fill="#f6d36b" />
      </g>
      <g fill={shade(sand, -0.08)} transform="translate(0 300)">
        <rect x={860} y={1430} width={140} height={70} />
        {[860, 900, 940, 980].map((x) => <rect key={x} x={x} y={1418} width={20} height={14} />)}
        <rect x={900} y={1380} width={60} height={50} />
        {[900, 940].map((x) => <rect key={x} x={x} y={1368} width={20} height={14} />)}
        <rect x={922} y={1460} width={18} height={40} rx={9} fill={shade(sand, -0.22)} />
      </g>
      <rect x={928} y={1630} width={4} height={40} fill="#5a4636" />
      <path d="M932 1630 h26 l-6 8 l6 8 h-26 z" fill="#d24b4b" />
      {/* табличка спасателей у дальнего края */}
      <g>
        <rect x={360} y={1060} width={8} height={120} fill="#8a6a3a" />
        <rect x={316} y={1030} width={96} height={40} rx={6} fill="#f4f1ea" />
        <Label x={364} y={1057} text="ПЛЯЖ" size={20} color="#d24b4b" />
      </g>
      <rect x={0} y={H - 220} width={W} height={220} fill="#00000008" />
    </Canvas>
  );
};
