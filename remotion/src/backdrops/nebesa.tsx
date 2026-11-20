import { Canvas, Cloud, W, H, type BackdropProps } from "./parts";

/** Осветлить (k>0) или затемнить (k<0) цвет #rrggbb. */
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const t = k < 0 ? 0 : 255;
  const p = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * p));
  return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
};

/** Детерминированный «шум». */
const rnd = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Облачный пол с бугристым краем. */
const CloudFloor = ({ top, color, shadow }: { top: number; color: string; shadow: string }) => (
  <g>
    <g fill={shadow}>
      {Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={i * 120 + 20} cy={top + 10 + (i % 2) * 14} r={70} />)}
    </g>
    <g fill={color}>
      {Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={i * 120 + 50} cy={top + 30 + (i % 2) * 18} r={66} />)}
      <rect x={0} y={top + 40} width={W} height={H - top - 40} />
    </g>
  </g>
);

const Rays = ({ cx, cy, color, n = 12, opacity = 0.1 }: { cx: number; cy: number; color: string; n?: number; opacity?: number }) => (
  <g fill={color} opacity={opacity}>
    {Array.from({ length: n }).map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      const b = a + Math.PI / n / 1.4;
      const R = 1400;
      return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R} L${cx + Math.cos(b) * R} ${cy + Math.sin(b) * R} Z`} />;
    })}
  </g>
);

const Heaven = ({ palette }: BackdropProps) => {
  const gold = palette.accent;
  const pearl = "#efe4d0";
  const bars = Array.from({ length: 9 }).map((_, i) => 360 + i * 45);
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <Rays cx={540} cy={760} color="#fff3c4" opacity={0.45} />
      <circle cx={540} cy={760} r={520} fill="#fff6d6" opacity={0.5} />
      <circle cx={540} cy={760} r={330} fill="#fff1c0" opacity={0.6} />
      <Cloud x={40} y={560} s={0.6} color="#ffffffe0" />
      <Cloud x={880} y={500} s={0.5} color="#ffffffe0" />
      <Cloud x={700} y={90} s={0.45} color="#ffffff90" />
      {/* дальние облака */}
      <g fill="#f1f6fc">
        {Array.from({ length: 8 }).map((_, i) => <circle key={i} cx={i * 150} cy={1060 - (i % 2) * 30} r={110} />)}
      </g>
      {/* врата */}
      <g>
        <path d="M330 640 Q540 470 750 640 V670 Q540 510 330 670 Z" fill={gold} />
        <circle cx={540} cy={530} r={30} fill={gold} />
        <circle cx={540} cy={530} r={16} fill="#fff6d6" />
        {bars.map((x) => {
          const t = (x - 540) / 210;
          const topY = 640 - 115 * (1 - t * t) + 30;
          return <rect key={x} x={x - 5} y={topY} width={10} height={1140 - topY} rx={5} fill={gold} opacity={0.8} />;
        })}
        <rect x={330} y={800} width={420} height={14} rx={7} fill={gold} opacity={0.8} />
        <rect x={330} y={1000} width={420} height={14} rx={7} fill={gold} opacity={0.8} />
        <rect x={535} y={600} width={10} height={540} fill={shade(gold, -0.2)} />
        {[250, 750].map((x) => (
          <g key={x}>
            <rect x={x} y={630} width={80} height={520} rx={14} fill={pearl} />
            <rect x={x + 56} y={640} width={14} height={500} rx={7} fill="#d9cbb2" />
            <rect x={x - 14} y={600} width={108} height={40} rx={14} fill={gold} />
            <circle cx={x + 40} cy={584} r={22} fill={pearl} />
            {[700, 760, 820].map((y) => <circle key={y} cx={x + 30} cy={y} r={9} fill="#ffffff" />)}
          </g>
        ))}
      </g>
      <CloudFloor top={1110} color="#ffffff" shadow="#e4edf7" />
      {/* пюпитр с книгой */}
      <g>
        <rect x={112} y={1040} width={20} height={140} fill={shade(gold, -0.25)} />
        <rect x={80} y={1172} width={84} height={18} rx={8} fill={shade(gold, -0.25)} />
        <path d="M60 1040 L184 1040 L196 1010 L48 1010 Z" fill={shade(gold, -0.15)} />
        <path d="M58 1012 Q90 990 122 1006 V1018 Q90 1004 58 1022 Z" fill="#fffaf0" />
        <path d="M122 1006 Q154 990 186 1012 V1022 Q154 1004 122 1018 Z" fill="#f2ead8" />
        <rect x={118} y={1010} width={6} height={50} fill="#c8553d" />
      </g>
    </>
  );
};

const Flame = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-60 0 C-80 -60 -30 -90 -20 -160 C10 -110 0 -80 20 -120 C40 -80 80 -60 60 0 Z" fill="#e0702a" />
    <path d="M-34 0 C-44 -40 -14 -60 -8 -100 C10 -70 10 -50 20 -70 C34 -46 46 -30 34 0 Z" fill="#f2b030" />
    <path d="M-14 0 C-18 -20 -4 -30 0 -48 C8 -30 14 -20 12 0 Z" fill="#fde29a" />
  </g>
);

const Hell = () => {
  const rock = "#3a1410";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#5a1f1a" />
      <ellipse cx={540} cy={900} rx={560} ry={460} fill="#7a2a20" />
      <ellipse cx={540} cy={1000} rx={380} ry={260} fill="#93372a" opacity={0.8} />
      {/* своды и сталактиты */}
      <path d="M0 0 H1080 V120 Q960 110 900 140 L870 230 L840 140 Q700 120 620 130 L590 190 L560 130 Q420 120 300 140 L270 220 L240 140 Q120 110 0 130 Z" fill={rock} />
      <path d="M0 0 H130 Q110 300 150 520 Q90 760 140 1000 Q80 1100 0 1150 Z" fill={rock} />
      <path d="M1080 0 H950 Q980 260 930 480 Q990 720 945 960 Q1000 1080 1080 1120 Z" fill={rock} />
      {/* огонь у стен */}
      <Flame x={190} y={1120} s={1.3} />
      <Flame x={300} y={1110} s={0.9} />
      <Flame x={110} y={1130} s={1.0} />
      <Flame x={980} y={1120} s={0.8} />
      {/* пол */}
      <path d="M0 1130 Q300 1100 540 1120 T1080 1110 V1920 H0 Z" fill="#4a1a14" />
      <path d="M0 1130 Q300 1100 540 1120 T1080 1110 V1146 Q800 1136 540 1150 T0 1160 Z" fill="#00000030" />
      <path d="M160 1230 l80 14 l50 -10 l60 20" stroke="#e0702a" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} />
      <path d="M740 1250 l50 -12 l70 16" stroke="#e0702a" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} />
      {/* котёл */}
      <g>
        <Flame x={850} y={1190} s={0.8} />
        <Flame x={930} y={1190} s={0.7} />
        <rect x={780} y={1110} width={16} height={80} fill="#1e1a1a" transform="rotate(12 788 1150)" />
        <rect x={990} y={1110} width={16} height={80} fill="#1e1a1a" transform="rotate(-12 998 1150)" />
        <path d="M760 980 H1040 Q1050 1130 900 1140 Q750 1130 760 980 Z" fill="#2a2424" />
        <rect x={740} y={960} width={320} height={36} rx={18} fill="#3a3232" />
        <ellipse cx={900} cy={966} rx={140} ry={14} fill="#e0702a" />
        <circle cx={860} cy={940} r={14} fill="#f2b030" />
        <circle cx={930} cy={926} r={10} fill="#f2b030" />
        <circle cx={900} cy={900} r={7} fill="#f2b030" opacity={0.8} />
        <rect x={800} y={1040} width={40} height={12} rx={6} fill="#ffffff" opacity={0.12} />
      </g>
      {/* вилы у стены */}
      <g transform="rotate(-10 150 1190)">
        <rect x={144} y={700} width={12} height={490} fill="#b08a5a" />
        <path d="M110 700 V640 h10 v50 h20 v-60 h20 v60 h20 v-50 h10 v60 Z" fill="#9aa3ad" />
      </g>
    </>
  );
};

const Eden = ({ palette }: BackdropProps) => {
  const leaf = "#4f8a4a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <circle cx={540} cy={700} r={460} fill="#fff6d6" opacity={0.5} />
      <Cloud x={60} y={520} s={0.5} color="#ffffffd0" />
      <path d="M0 880 Q260 760 540 850 T1080 820 V1000 H0 Z" fill="#a7d48a" />
      <path d="M0 950 Q300 880 620 940 T1080 920 V1100 H0 Z" fill="#8cc673" />
      {/* водопадик вдалеке */}
      <path d="M380 860 h40 v110 h-40 z" fill="#cfeaf5" />
      <ellipse cx={400} cy={975} rx={60} ry={14} fill="#cfeaf5" />
      <rect x={0} y={1040} width={W} height={H - 1040} fill="#7fb860" />
      {/* яблоня */}
      <g>
        <path d="M880 1190 C880 1060 900 960 870 860 H950 C930 960 950 1060 960 1190 Z" fill="#7a5236" />
        <path d="M900 920 C840 880 800 870 760 860 L770 840 C810 850 860 860 910 890 Z" fill="#7a5236" />
        <g fill={leaf}>
          <circle cx={910} cy={700} r={180} />
          <circle cx={760} cy={780} r={120} />
          <circle cx={1050} cy={790} r={130} />
          <circle cx={1000} cy={610} r={110} />
        </g>
        <g fill="#5d9a52">
          <circle cx={870} cy={640} r={90} />
          <circle cx={1010} cy={720} r={70} />
        </g>
        {[[800, 760], [880, 830], [960, 640], [1040, 800], [760, 860], [900, 720], [1000, 880], [850, 600]].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={22} fill="#d23c32" />
            <circle cx={x - 7} cy={y - 7} r={6} fill="#ffffff" opacity={0.5} />
          </g>
        ))}
        {/* змей на ветке */}
        <path d="M770 850 C760 900 800 910 790 950 C782 980 750 975 752 950" stroke="#6aa84f" strokeWidth={18} fill="none" strokeLinecap="round" />
        <ellipse cx={754} cy={944} rx={18} ry={13} fill="#6aa84f" />
        <circle cx={748} cy={940} r={3.5} fill="#2b1d14" />
        <path d="M738 952 l-14 4 l4 -6 l-4 -6 z" fill="#d23c32" />
      </g>
      {/* пышные кусты слева */}
      <g>
        <ellipse cx={60} cy={1130} rx={130} ry={110} fill="#4f8a4a" />
        <ellipse cx={190} cy={1150} rx={90} ry={70} fill="#5d9a52" />
        <path d="M40 1190 Q0 1000 70 920 Q60 1040 100 1190 Z" fill="#3f7a40" />
        <path d="M120 1190 Q170 1030 250 990 Q190 1080 160 1190 Z" fill="#3f7a40" />
      </g>
      {/* цветы */}
      {[[60, 1060, "#f2a0c0"], [200, 1090, "#ffffff"], [140, 1040, "#f2c230"], [300, 1170, "#f2a0c0"], [700, 1180, "#ffffff"], [60, 1310, "#f2c230"], [1000, 1320, "#f2a0c0"]].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={(x as number) + Math.cos((a * Math.PI) / 180) * 12} cy={(y as number) + Math.sin((a * Math.PI) / 180) * 12} r={10} fill={c as string} />
          ))}
          <circle cx={x as number} cy={y as number} r={7} fill={palette.accent} />
        </g>
      ))}
      {/* бабочка */}
      <g transform="translate(330 760)">
        <ellipse cx={-14} cy={0} rx={16} ry={22} fill="#f2a030" transform="rotate(-20)" />
        <ellipse cx={14} cy={0} rx={16} ry={22} fill="#f2a030" transform="rotate(20)" />
        <rect x={-3} y={-14} width={6} height={30} rx={3} fill="#2b1d14" />
      </g>
    </>
  );
};

const Space = () => {
  const stars = Array.from({ length: 90 }).map((_, i) => ({ x: rnd(i) * W, y: rnd(i + 500) * 1100, r: 2 + rnd(i + 900) * 4 }));
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#1d2340" />
      {stars
        .filter((s) => !(s.y > 140 && s.y < 430 && rnd(Math.round(s.x)) < 0.6))
        .map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={i % 7 === 0 ? "#f5d77a" : "#ffffff"} opacity={0.6 + (i % 3) * 0.15} />)}
      {/* планета с кольцом */}
      <g transform="translate(820 600)">
        <ellipse cx={0} cy={0} rx={190} ry={40} fill="none" stroke="#c8a07a" strokeWidth={14} transform="rotate(-15)" opacity={0.6} />
        <circle cx={0} cy={0} r={115} fill="#e0a030" />
        <path d="M-112 -30 Q0 -10 112 -40 V-20 Q0 10 -114 -6 Z" fill="#c8553d" opacity={0.6} />
        <path d="M-104 40 Q0 60 108 30 V48 Q0 80 -96 60 Z" fill="#c8553d" opacity={0.4} />
        <path d="M-190 0 A190 40 0 0 0 190 0" fill="none" stroke="#e8c49a" strokeWidth={14} transform="rotate(-15)" />
      </g>
      {/* Земля */}
      <g transform="translate(200 640)">
        <circle cx={0} cy={0} r={56} fill="#4a7fc0" />
        <path d="M-30 -40 Q-10 -30 -16 -6 Q-36 4 -44 -14 Z M10 0 Q36 -10 40 20 Q20 40 6 24 Z" fill="#6aa84f" />
        <circle cx={0} cy={0} r={56} fill="#ffffff" opacity={0.08} />
      </g>
      {/* лунная поверхность */}
      <path d="M0 1080 Q260 1040 520 1080 T1080 1060 V1920 H0 Z" fill="#9a9aa6" />
      <path d="M0 1160 Q300 1130 560 1150 T1080 1140 V1920 H0 Z" fill="#a9a9b4" />
      {[[300, 1100, 60], [760, 1090, 46], [920, 1210, 70], [120, 1230, 40]].map(([x, y, r]) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.28} fill="#7d7d8a" />
          <ellipse cx={x} cy={y + r * 0.06} rx={r * 0.8} ry={r * 0.2} fill="#8c8c98" />
        </g>
      ))}
      {/* ракетка */}
      <g transform="translate(150 1170)">
        <path d="M-50 0 L-30 -80 H30 L50 0 Z" fill="#c8553d" />
        <path d="M-30 -60 Q-34 -220 0 -280 Q34 -220 30 -60 Z" fill="#f2efe8" />
        <path d="M-18 -240 Q0 -290 18 -240 Z" fill="#c8553d" />
        <circle cx={0} cy={-160} r={18} fill="#4a6fa5" />
        <circle cx={0} cy={-160} r={10} fill="#a9c7d9" />
      </g>
    </>
  );
};

export const Nebesa = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "hell" ? (
      <Hell />
    ) : variant === "garden-of-eden" ? (
      <Eden palette={palette} />
    ) : variant === "space" ? (
      <Space />
    ) : (
      <Heaven palette={palette} />
    )}
  </Canvas>
);

