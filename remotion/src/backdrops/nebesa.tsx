import { Canvas, Cloud, W, H, type BackdropProps } from "./parts";
import { Glow } from "./bolnitsa";

/**
 * Фон «nebesa»: врата рая на облаках (Апостол Пётр с книгой), варианты hell (пещера с огнём и котлом),
 * garden-of-eden (сад с яблоней и змеем), space (космос и лунная поверхность),
 * crossroads (развилка в облаках: дорога вверх к вратам рая и вниз в огненный провал, указатель, весы и пюпитр судьи).
 * Метки — простые доли ширины (средний план, стопы y≈1275): у пюпитра слева, у врат по центру, на облаке справа.
 */

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

/** Вертикальный градиент на весь кадр (небо). stops: [offset, color][]. */
const Sky = ({ id, stops, y0 = 0, y1 = H }: { id: string; stops: [number, string][]; y0?: number; y1?: number }) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
      </linearGradient>
    </defs>
    <rect x={0} y={y0} width={W} height={y1 - y0} fill={`url(#${id})`} />
  </>
);

/** Искорка-звёздочка с четырьмя лучами. */
const Sparkle = ({ x, y, r = 14, color = "#fff6d0", o = 0.9 }: { x: number; y: number; r?: number; color?: string; o?: number }) => (
  <path d={`M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r} Z`} fill={color} opacity={o} />
);

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

/** Ряд пушистых облаков-«барашков» (полоса). */
const CloudBank = ({ y, color, r = 90, step = 140, seed = 0, o = 1 }: { y: number; color: string; r?: number; step?: number; seed?: number; o?: number }) => (
  <g fill={color} opacity={o}>
    {Array.from({ length: Math.ceil(W / step) + 2 }).map((_, i) => (
      <circle key={i} cx={i * step - step / 2 + rnd(i + seed) * 40} cy={y - rnd(i * 3 + seed) * r * 0.5} r={r * (0.75 + rnd(i * 7 + seed) * 0.4)} />
    ))}
    <rect x={0} y={y} width={W} height={r} />
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

/** Завиток (для ковки ворот). */
const Curl = ({ x, y, r, flip = 1, color, w = 6 }: { x: number; y: number; r: number; flip?: number; color: string; w?: number }) => (
  <path d={`M${x} ${y} q${flip * r} ${-r * 0.2} ${flip * r} ${-r} q0 ${-r * 0.6} ${-flip * r * 0.5} ${-r * 0.6} q${-flip * r * 0.35} 0 ${-flip * r * 0.3} ${r * 0.35}`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
);

const Heaven = ({ palette }: BackdropProps) => {
  const gold = palette.accent;
  const pearl = "#efe4d0";
  const bars = Array.from({ length: 9 }).map((_, i) => 360 + i * 45);
  return (
    <>
      <Sky id="heaven-sky" stops={[[0, "#b9d3f0"], [0.35, palette.wall], [0.62, "#fff4dc"], [1, "#ffffff"]]} />
      <Rays cx={540} cy={760} color="#fff3c4" opacity={0.45} />
      <Glow cx={540} cy={760} rx={620} color="#fff3c4" opacity={0.7} />
      <circle cx={540} cy={760} r={330} fill="#fff1c0" opacity={0.45} />
      {/* дальние облачные острова и голуби */}
      <Cloud x={40} y={560} s={0.6} color="#ffffffe0" />
      <Cloud x={880} y={500} s={0.5} color="#ffffffe0" />
      <Cloud x={700} y={90} s={0.45} color="#ffffff90" />
      <Cloud x={120} y={70} s={0.35} color="#ffffff80" />
      <g fill="#ffffff" opacity={0.9}>
        {[[180, 470, 1], [230, 500, 0.8], [860, 440, 0.9]].map(([x, y, s], i) => (
          <path key={i} d={`M${x} ${y} q${14 * s} ${-16 * s} ${28 * s} 0 q${14 * s} ${-16 * s} ${28 * s} 0 q${-14 * s} ${-4 * s} ${-28 * s} ${8 * s} q${-14 * s} ${-12 * s} ${-28 * s} ${-8 * s} Z`} />
        ))}
      </g>
      {/* дальние облака слоями */}
      <CloudBank y={1010} color="#e8f0fa" r={110} step={150} seed={3} />
      <CloudBank y={1060} color="#f4f8fd" r={90} step={130} seed={11} />
      {/* врата */}
      <g>
        <Glow cx={540} cy={820} rx={260} ry={380} color="#fff6d0" opacity={0.7} />
        <path d="M330 640 Q540 470 750 640 V670 Q540 510 330 670 Z" fill={gold} />
        <path d="M330 640 Q540 470 750 640" stroke={shade(gold, 0.45)} strokeWidth={4} fill="none" />
        {/* ковка: завитки над аркой */}
        {[-1, 1].map((d) => (
          <g key={d}>
            <Curl x={540 + d * 40} y={560} r={40} flip={d} color={gold} />
            <Curl x={540 + d * 110} y={590} r={34} flip={d} color={gold} />
            <Curl x={540 + d * 170} y={620} r={26} flip={d} color={gold} />
          </g>
        ))}
        <circle cx={540} cy={530} r={30} fill={gold} />
        <circle cx={540} cy={530} r={16} fill="#fff6d6" />
        <Sparkle x={540} y={530} r={36} o={0.8} />
        {bars.map((x) => {
          const t = (x - 540) / 210;
          const topY = 640 - 115 * (1 - t * t) + 30;
          return (
            <g key={x}>
              <rect x={x - 5} y={topY} width={10} height={1140 - topY} rx={5} fill={gold} opacity={0.85} />
              <path d={`M${x} ${topY - 22} l9 18 h-18 Z`} fill={gold} />
            </g>
          );
        })}
        <rect x={330} y={800} width={420} height={14} rx={7} fill={gold} opacity={0.85} />
        <rect x={330} y={1000} width={420} height={14} rx={7} fill={gold} opacity={0.85} />
        {[-1, 1].map((d) => (
          <g key={d}>
            <Curl x={540 + d * 60} y={1000} r={50} flip={d} color={gold} w={5} />
            <Curl x={540 + d * 160} y={1000} r={50} flip={-d} color={gold} w={5} />
          </g>
        ))}
        <rect x={535} y={600} width={10} height={540} fill={shade(gold, -0.2)} />
        <circle cx={540} cy={905} r={20} fill={shade(gold, -0.1)} />
        <rect x={536} y={898} width={8} height={18} rx={3} fill={shade(gold, -0.45)} />
        {[250, 750].map((x) => (
          <g key={x}>
            <rect x={x} y={630} width={80} height={520} rx={14} fill={pearl} />
            <rect x={x + 56} y={640} width={14} height={500} rx={7} fill="#d9cbb2" />
            <rect x={x + 10} y={640} width={10} height={500} rx={5} fill="#ffffff" opacity={0.6} />
            <rect x={x - 14} y={600} width={108} height={40} rx={14} fill={gold} />
            <rect x={x - 6} y={1100} width={92} height={30} rx={10} fill={gold} />
            <circle cx={x + 40} cy={584} r={22} fill={pearl} />
            <circle cx={x + 34} cy={578} r={7} fill="#ffffff" />
            {[690, 740, 790, 840, 890, 940, 990, 1040].map((y) => (
              <g key={y}>
                <circle cx={x + 38} cy={y} r={10} fill="#ffffff" />
                <circle cx={x + 35} cy={y - 3} r={3.5} fill="#f6efe2" />
              </g>
            ))}
          </g>
        ))}
      </g>
      {/* облачный пол и золотая дорожка к вратам */}
      <CloudFloor top={1110} color="#ffffff" shadow="#e4edf7" />
      <path d={`M430 1150 L650 1150 L820 ${H} L260 ${H} Z`} fill="#f7e6a8" opacity={0.32} />
      {[1180, 1250, 1340, 1460, 1620].map((y, i) => {
        const t = (y - 1150) / (H - 1150);
        const half = 110 + t * 170;
        return <rect key={y} x={540 - half} y={y} width={half * 2} height={6 + i * 2} rx={3} fill={gold} opacity={0.25} />;
      })}
      <Glow cx={540} cy={1200} rx={360} ry={90} color="#fff1c0" opacity={0.6} />
      {/* облачка-кочки на полу по краям */}
      <g fill="#eef4fb">
        <circle cx={-10} cy={1500} r={110} />
        <circle cx={1090} cy={1560} r={120} />
      </g>
      {/* искорки */}
      {[[120, 820], [960, 760], [300, 480], [800, 620], [60, 1000], [1020, 980], [680, 1080]].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} r={8 + (i % 3) * 5} o={0.85} />
      ))}
      {/* пюпитр с книгой, пером и чернильницей */}
      <g>
        <rect x={112} y={1040} width={20} height={140} fill={shade(gold, -0.25)} />
        <rect x={116} y={1040} width={6} height={140} fill="#ffffff" opacity={0.3} />
        <rect x={80} y={1172} width={84} height={18} rx={8} fill={shade(gold, -0.25)} />
        <path d="M60 1040 L184 1040 L196 1010 L48 1010 Z" fill={shade(gold, -0.15)} />
        <path d="M58 1012 Q90 990 122 1006 V1018 Q90 1004 58 1022 Z" fill="#fffaf0" />
        <path d="M122 1006 Q154 990 186 1012 V1022 Q154 1004 122 1018 Z" fill="#f2ead8" />
        {[0, 1, 2].map((i) => <path key={i} d={`M${66 + i * 4} ${1010 - i * 3} q22 -10 48 0`} stroke="#c9bfa8" strokeWidth={2} fill="none" />)}
        <rect x={118} y={1010} width={6} height={50} fill="#c8553d" />
        <ellipse cx={196} cy={1006} rx={10} ry={5} fill="#2b2a3a" />
        <path d="M196 1004 q20 -40 36 -56 q-6 24 -30 58 Z" fill="#ffffff" />
      </g>
    </>
  );
};

const Flame = ({ x, y, s = 1, o = 1 }: { x: number; y: number; s?: number; o?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M-60 0 C-80 -60 -30 -90 -20 -160 C10 -110 0 -80 20 -120 C40 -80 80 -60 60 0 Z" fill="#e0702a" />
    <path d="M-34 0 C-44 -40 -14 -60 -8 -100 C10 -70 10 -50 20 -70 C34 -46 46 -30 34 0 Z" fill="#f2b030" />
    <path d="M-14 0 C-18 -20 -4 -30 0 -48 C8 -30 14 -20 12 0 Z" fill="#fde29a" />
  </g>
);

/** Цепь из звеньев (свисает сверху). */
const Chain = ({ x, y0, y1 }: { x: number; y0: number; y1: number }) => (
  <g>
    {Array.from({ length: Math.floor((y1 - y0) / 26) }).map((_, i) => (
      <rect key={i} x={x - (i % 2 ? 3 : 9)} y={y0 + i * 26} width={i % 2 ? 6 : 18} height={32} rx={9} fill="none" stroke="#2a1614" strokeWidth={6} />
    ))}
    <path d={`M${x} ${y1} q0 30 -20 30 q-14 0 -14 -14`} stroke="#3a2a28" strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);

const Hell = () => {
  const rock = "#3a1410";
  return (
    <>
      <Sky id="hell-sky" stops={[[0, "#2a0c0a"], [0.45, "#5a1f1a"], [0.6, "#7a2a1c"], [1, "#2a0e0a"]]} />
      <Glow cx={540} cy={980} rx={620} ry={420} color="#e0602a" opacity={0.45} />
      <ellipse cx={540} cy={900} rx={560} ry={460} fill="#7a2a20" opacity={0.7} />
      <ellipse cx={540} cy={1000} rx={380} ry={260} fill="#93372a" opacity={0.6} />
      {/* дальние скалы и лавопады */}
      <path d="M150 1110 L220 820 L290 900 L340 760 L420 1110 Z" fill="#4a1812" />
      <path d="M640 1110 L700 800 L760 880 L830 740 L930 1110 Z" fill="#4a1812" />
      {[[330, 770, 120], [818, 750, 140]].map(([x, y, h], i) => (
        <g key={i}>
          <Glow cx={x} cy={y + h} rx={80} ry={h} color="#ff8a2a" opacity={0.5} />
          <path d={`M${x - 14} ${y} Q${x - 30} ${y + h} ${x - 34} ${y + h + 300} H${x + 30} Q${x + 24} ${y + h} ${x + 12} ${y} Z`} fill="#e0702a" />
          <path d={`M${x - 6} ${y + 6} Q${x - 16} ${y + h} ${x - 16} ${y + h + 290} H${x + 12} Q${x + 10} ${y + h} ${x + 5} ${y + 6} Z`} fill="#f2b030" />
          <path d={`M${x - 2} ${y + 20} Q${x - 6} ${y + h} ${x - 4} ${y + h + 280} H${x + 3} Q${x + 3} ${y + h} ${x + 1} ${y + 20} Z`} fill="#fde29a" />
        </g>
      ))}
      {/* лавовое озеро вдали */}
      <ellipse cx={540} cy={1112} rx={420} ry={30} fill="#f2902a" />
      <ellipse cx={540} cy={1106} rx={330} ry={16} fill="#fde29a" opacity={0.8} />
      <Glow cx={540} cy={1100} rx={480} ry={120} color="#ffb04a" opacity={0.5} />
      {/* своды и сталактиты */}
      <path d="M0 0 H1080 V120 Q960 110 900 140 L870 230 L840 140 Q700 120 620 130 L590 190 L560 130 Q420 120 300 140 L270 220 L240 140 Q120 110 0 130 Z" fill={rock} />
      <path d="M0 0 H130 Q110 300 150 520 Q90 760 140 1000 Q80 1100 0 1150 Z" fill={rock} />
      <path d="M1080 0 H950 Q980 260 930 480 Q990 720 945 960 Q1000 1080 1080 1120 Z" fill={rock} />
      {/* трещины в стенах с отсветом */}
      <path d="M40 300 l30 60 l-10 50 l40 70 M1040 380 l-30 50 l14 60 l-36 60" stroke="#f2902a" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
      <Chain x={60} y0={0} y1={130} />
      <Chain x={1010} y0={0} y1={110} />
      {/* огонь у стен */}
      <Glow cx={200} cy={1080} rx={260} ry={200} color="#ff8a2a" opacity={0.45} />
      <Flame x={250} y={1110} s={0.7} o={0.8} />
      <Flame x={190} y={1120} s={1.3} />
      <Flame x={300} y={1110} s={0.9} />
      <Flame x={110} y={1130} s={1.0} />
      <Flame x={980} y={1120} s={0.8} />
      <Flame x={1050} y={1125} s={1.1} />
      {/* пол */}
      <path d="M0 1130 Q300 1100 540 1120 T1080 1110 V1920 H0 Z" fill="#4a1a14" />
      <path d="M0 1130 Q300 1100 540 1120 T1080 1110 V1146 Q800 1136 540 1150 T0 1160 Z" fill="#00000030" />
      {/* каменные плиты пола и светящиеся трещины */}
      <g fill="#3a140f" opacity={0.6}>
        {[[90, 1420, 120], [880, 1460, 140], [300, 1640, 160], [760, 1720, 150], [520, 1300, 90]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.22} />
        ))}
      </g>
      {[
        "M160 1230 l80 14 l50 -10 l60 20",
        "M740 1250 l50 -12 l70 16",
        "M40 1540 l90 20 l40 -14 l70 26",
        "M640 1580 l60 -16 l80 22 l60 -10",
        "M420 1820 l70 -20 l60 16",
      ].map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#ff8a2a" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.25} />
          <path d={d} stroke="#f2b030" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
        </g>
      ))}
      <rect x={0} y={1130} width={W} height={H - 1130} fill="#000000" opacity={0.12} />
      {/* котёл */}
      <g>
        <Glow cx={890} cy={1180} rx={220} ry={90} color="#ff8a2a" opacity={0.6} />
        <Flame x={850} y={1190} s={0.8} />
        <Flame x={930} y={1190} s={0.7} />
        <rect x={780} y={1110} width={16} height={80} fill="#1e1a1a" transform="rotate(12 788 1150)" />
        <rect x={990} y={1110} width={16} height={80} fill="#1e1a1a" transform="rotate(-12 998 1150)" />
        <path d="M760 980 H1040 Q1050 1130 900 1140 Q750 1130 760 980 Z" fill="#2a2424" />
        <path d="M780 1000 Q790 1100 860 1124" stroke="#ffffff" strokeWidth={8} fill="none" opacity={0.08} />
        <rect x={740} y={960} width={320} height={36} rx={18} fill="#3a3232" />
        <ellipse cx={900} cy={966} rx={140} ry={14} fill="#e0702a" />
        <ellipse cx={880} cy={964} rx={70} ry={6} fill="#f2b030" />
        <circle cx={860} cy={940} r={14} fill="#f2b030" />
        <circle cx={930} cy={926} r={10} fill="#f2b030" />
        <circle cx={900} cy={900} r={7} fill="#f2b030" opacity={0.8} />
        <path d="M850 880 q-20 -40 10 -80 q30 -40 0 -80" stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.08} strokeLinecap="round" />
        <path d="M940 890 q20 -30 -6 -70" stroke="#ffffff" strokeWidth={8} fill="none" opacity={0.07} strokeLinecap="round" />
        <rect x={800} y={1040} width={40} height={12} rx={6} fill="#ffffff" opacity={0.12} />
      </g>
      {/* вилы у стены */}
      <g transform="rotate(-10 150 1190)">
        <rect x={144} y={700} width={12} height={490} fill="#b08a5a" />
        <path d="M110 700 V640 h10 v50 h20 v-60 h20 v60 h20 v-50 h10 v60 Z" fill="#9aa3ad" />
      </g>
      {/* искры в воздухе */}
      {Array.from({ length: 34 }).map((_, i) => {
        const x = rnd(i + 3) * W;
        const y = 500 + rnd(i + 77) * 700;
        if (y > 150 && y < 430) return null;
        return <circle key={i} cx={x} cy={y} r={2 + rnd(i + 5) * 4} fill={i % 3 ? "#f2b030" : "#ff7a3a"} opacity={0.5 + rnd(i) * 0.5} />;
      })}
    </>
  );
};

/** Круглое дерево вдали (силуэт). */
const FarTree = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-6} y={-40} width={12} height={40} fill="#7a6a4a" opacity={0.8} />
    <circle cx={0} cy={-70} r={46} fill={c} />
    <circle cx={-26} cy={-54} r={30} fill={c} />
    <circle cx={26} cy={-56} r={32} fill={c} />
  </g>
);

const Eden = ({ palette }: BackdropProps) => {
  const leaf = "#4f8a4a";
  return (
    <>
      <Sky id="eden-sky" stops={[[0, "#a8d4f0"], [0.4, palette.wall], [0.55, "#f4f6e0"], [1, "#f4f6e0"]]} y1={1100} />
      <Glow cx={540} cy={700} rx={560} color="#fff6d0" opacity={0.8} />
      {/* радуга */}
      {["#f2a0a0", "#f2d08a", "#b8e0a0", "#a0c8f0"].map((c, i) => (
        <path key={c} d={`M${80 + i * 22} 900 A${460 - i * 22} ${460 - i * 22} 0 0 1 ${1000 - i * 22} 900`} stroke={c} strokeWidth={22} fill="none" opacity={0.28} />
      ))}
      <Cloud x={60} y={520} s={0.5} color="#ffffffd0" />
      <Cloud x={640} y={470} s={0.4} color="#ffffffb0" />
      {/* горы и холмы слоями */}
      <path d="M0 860 L140 700 L260 800 L420 640 L560 790 L700 680 L860 800 L1000 700 L1080 760 V920 H0 Z" fill="#c4d8e0" />
      <path d="M420 640 L460 690 L440 700 L400 668 Z M700 680 L730 714 L690 712 Z" fill="#ffffff" opacity={0.8} />
      <path d="M0 880 Q260 760 540 850 T1080 820 V1000 H0 Z" fill="#a7d48a" />
      {[[120, 870, 0.5], [190, 860, 0.4], [620, 860, 0.45], [680, 850, 0.38], [1000, 840, 0.5]].map(([x, y, s], i) => (
        <FarTree key={i} x={x} y={y} s={s} c="#86bb70" />
      ))}
      <path d="M0 950 Q300 880 620 940 T1080 920 V1100 H0 Z" fill="#8cc673" />
      {/* речка и водопадик вдалеке */}
      <path d="M380 860 h40 v110 h-40 z" fill="#cfeaf5" />
      <rect x={388} y={870} width={6} height={90} fill="#ffffff" opacity={0.7} />
      <ellipse cx={400} cy={975} rx={60} ry={14} fill="#cfeaf5" />
      <path d="M340 975 Q300 1000 330 1020 T260 1040 L180 1040 Q250 1020 230 1000 T300 975 Z" fill="#b8e0f0" />
      {/* олень на холме (силуэт) */}
      <g fill="#a07a50" transform="translate(560 905)">
        <ellipse cx={0} cy={0} rx={34} ry={16} />
        <rect x={-26} y={6} width={6} height={30} />
        <rect x={20} y={6} width={6} height={30} />
        <rect x={-12} y={8} width={6} height={28} />
        <rect x={8} y={8} width={6} height={28} />
        <path d="M24 -6 L38 -34 L48 -30 L34 -2 Z" />
        <ellipse cx={46} cy={-36} rx={12} ry={8} />
        <path d="M40 -42 l-6 -18 M40 -50 l-10 -4 M46 -42 l6 -18 M48 -52 l8 -4" stroke="#a07a50" strokeWidth={3} />
      </g>
      <rect x={0} y={1040} width={W} height={H - 1040} fill="#7fb860" />
      {/* трава: штрихи на лугу, темнее к камере */}
      <defs>
        <linearGradient id="eden-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.12} />
          <stop offset="0.3" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#1f4a20" stopOpacity={0.28} />
        </linearGradient>
      </defs>
      <rect x={0} y={1040} width={W} height={H - 1040} fill="url(#eden-grass)" />
      <g stroke="#5f9a48" strokeWidth={4} strokeLinecap="round" opacity={0.6}>
        {Array.from({ length: 60 }).map((_, i) => {
          const x = rnd(i + 1) * W;
          const y = 1080 + rnd(i + 40) * 820;
          if (y > 1370 && y < 1610 && x > 120 && x < 960) return null;
          const s = 0.6 + (y - 1080) / 600;
          return <path key={i} d={`M${x} ${y} l${-6 * s} ${-16 * s} M${x} ${y} l0 ${-20 * s} M${x} ${y} l${6 * s} ${-16 * s}`} />;
        })}
      </g>
      {/* яблоня */}
      <g>
        <ellipse cx={910} cy={1192} rx={140} ry={20} fill="#000000" opacity={0.14} />
        <path d="M880 1190 C880 1060 900 960 870 860 H950 C930 960 950 1060 960 1190 Z" fill="#7a5236" />
        <path d="M890 1150 q10 -60 0 -120 M930 1120 q-6 -40 4 -80" stroke="#5a3a24" strokeWidth={5} fill="none" opacity={0.6} />
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
          <circle cx={790} cy={740} r={50} />
        </g>
        <g fill="#6aaa5e" opacity={0.7}>
          <circle cx={850} cy={600} r={40} />
          <circle cx={980} cy={570} r={36} />
        </g>
        {[[800, 760], [880, 830], [960, 640], [1040, 800], [760, 860], [900, 720], [1000, 880], [850, 600], [1060, 700], [930, 560]].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={22} fill="#d23c32" />
            <circle cx={x - 7} cy={y - 7} r={6} fill="#ffffff" opacity={0.5} />
            <rect x={x - 1} y={y - 30} width={3} height={10} fill="#5a3a24" />
          </g>
        ))}
        {/* упавшие яблоки у корней */}
        <circle cx={840} cy={1180} r={14} fill="#d23c32" />
        <circle cx={990} cy={1186} r={12} fill="#c23028" />
        {/* змей на ветке */}
        <path d="M770 850 C760 900 800 910 790 950 C782 980 750 975 752 950" stroke="#6aa84f" strokeWidth={18} fill="none" strokeLinecap="round" />
        <path d="M770 860 C764 900 796 912 788 946" stroke="#f2d060" strokeWidth={4} fill="none" strokeDasharray="6 10" />
        <ellipse cx={754} cy={944} rx={18} ry={13} fill="#6aa84f" />
        <circle cx={748} cy={940} r={3.5} fill="#2b1d14" />
        <path d="M738 952 l-14 4 l4 -6 l-4 -6 z" fill="#d23c32" />
      </g>
      {/* пышные кусты слева и лианы */}
      <g>
        <ellipse cx={60} cy={1130} rx={130} ry={110} fill="#4f8a4a" />
        <ellipse cx={190} cy={1150} rx={90} ry={70} fill="#5d9a52" />
        <ellipse cx={120} cy={1100} rx={60} ry={40} fill="#6aaa5e" opacity={0.7} />
        <path d="M40 1190 Q0 1000 70 920 Q60 1040 100 1190 Z" fill="#3f7a40" />
        <path d="M120 1190 Q170 1030 250 990 Q190 1080 160 1190 Z" fill="#3f7a40" />
        <path d="M-10 1060 Q40 1000 20 940" stroke="#3f7a40" strokeWidth={10} fill="none" strokeLinecap="round" />
        {[[150, 1110, "#f2a0c0"], [80, 1080, "#ffffff"], [210, 1130, "#f2c230"]].map(([x, y, c], i) => (
          <circle key={i} cx={x as number} cy={y as number} r={9} fill={c as string} />
        ))}
      </g>
      {/* кролик в траве */}
      <g transform="translate(330 1180)" fill="#e8e0d4">
        <ellipse cx={0} cy={0} rx={26} ry={18} />
        <circle cx={22} cy={-14} r={13} />
        <ellipse cx={20} cy={-36} rx={5} ry={15} />
        <ellipse cx={30} cy={-34} rx={5} ry={14} transform="rotate(15 30 -34)" />
        <circle cx={-24} cy={-4} r={7} fill="#ffffff" />
        <circle cx={26} cy={-16} r={2.5} fill="#2b1d14" />
      </g>
      {/* цветы */}
      {[[60, 1060, "#f2a0c0"], [200, 1090, "#ffffff"], [140, 1040, "#f2c230"], [300, 1170, "#f2a0c0"], [700, 1180, "#ffffff"], [60, 1310, "#f2c230"], [1000, 1320, "#f2a0c0"], [460, 1150, "#f2c230"], [610, 1160, "#c8a0f0"], [40, 1700, "#f2a0c0"], [1040, 1760, "#ffffff"], [1020, 1250, "#f2c230"]].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <line x1={x as number} y1={y as number} x2={x as number} y2={(y as number) + 20} stroke="#4f8a4a" strokeWidth={4} />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={(x as number) + Math.cos((a * Math.PI) / 180) * 12} cy={(y as number) + Math.sin((a * Math.PI) / 180) * 12} r={10} fill={c as string} />
          ))}
          <circle cx={x as number} cy={y as number} r={7} fill={palette.accent} />
        </g>
      ))}
      {/* бабочки и птицы */}
      {[[330, 760, "#f2a030", 0], [200, 980, "#f2a0c0", -10]].map(([x, y, c, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${i ? 0.7 : 1})`}>
          <ellipse cx={-14} cy={0} rx={16} ry={22} fill={c as string} transform="rotate(-20)" />
          <ellipse cx={14} cy={0} rx={16} ry={22} fill={c as string} transform="rotate(20)" />
          <rect x={-3} y={-14} width={6} height={30} rx={3} fill="#2b1d14" />
        </g>
      ))}
      <g stroke="#4a5a6a" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7}>
        <path d="M260 600 q12 -12 24 0 q12 -12 24 0" />
        <path d="M320 630 q9 -9 18 0 q9 -9 18 0" />
      </g>
    </>
  );
};

const Space = () => {
  const stars = Array.from({ length: 140 }).map((_, i) => ({ x: rnd(i) * W, y: rnd(i + 500) * 1120, r: 1.5 + rnd(i + 900) * 3.5 }));
  return (
    <>
      <Sky id="space-sky" stops={[[0, "#0f1328"], [0.5, "#1d2340"], [1, "#2a2650"]]} y1={1200} />
      {/* туманности и Млечный путь */}
      <Glow cx={260} cy={900} rx={420} ry={260} color="#8a5ac8" opacity={0.35} />
      <Glow cx={860} cy={420} rx={360} ry={240} color="#3a8ac8" opacity={0.3} />
      <Glow cx={640} cy={980} rx={300} ry={160} color="#c85a8a" opacity={0.22} />
      <path d="M-100 1050 Q400 700 1180 300 L1180 460 Q500 820 -100 1180 Z" fill="#ffffff" opacity={0.05} />
      <path d="M-100 1090 Q420 760 1180 360 L1180 410 Q460 800 -100 1130 Z" fill="#ffffff" opacity={0.05} />
      {stars
        .filter((s) => !(s.y > 140 && s.y < 430 && rnd(Math.round(s.x)) < 0.6))
        .map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={i % 7 === 0 ? "#f5d77a" : i % 11 === 0 ? "#a8c8ff" : "#ffffff"} opacity={0.5 + (i % 3) * 0.17} />)}
      {[[90, 520], [980, 860], [430, 760], [700, 1000], [300, 100], [1000, 120]].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} r={10 + (i % 2) * 6} color="#ffffff" o={0.9} />
      ))}
      {/* далёкая спиральная галактика */}
      <g transform="translate(470 560) rotate(-25)" opacity={0.8}>
        <ellipse cx={0} cy={0} rx={70} ry={22} fill="#c8b8ff" opacity={0.25} />
        <path d="M0 0 q40 -20 70 0 q-30 -30 -70 -8 q-40 20 -70 0 q30 30 70 8 Z" fill="#e8deff" opacity={0.5} />
        <circle cx={0} cy={0} r={8} fill="#ffffff" />
      </g>
      {/* падающая звезда */}
      <path d="M560 850 L740 780" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      <circle cx={740} cy={780} r={6} fill="#ffffff" />
      {/* планета с кольцом */}
      <g transform="translate(820 600)">
        <Glow cx={0} cy={0} rx={200} color="#e0a030" opacity={0.3} />
        <ellipse cx={0} cy={0} rx={190} ry={40} fill="none" stroke="#c8a07a" strokeWidth={14} transform="rotate(-15)" opacity={0.6} />
        <circle cx={0} cy={0} r={115} fill="#e0a030" />
        <path d="M-112 -30 Q0 -10 112 -40 V-20 Q0 10 -114 -6 Z" fill="#c8553d" opacity={0.6} />
        <path d="M-104 40 Q0 60 108 30 V48 Q0 80 -96 60 Z" fill="#c8553d" opacity={0.4} />
        <path d="M-90 -70 Q0 -84 80 -78" stroke="#f2c860" strokeWidth={10} fill="none" opacity={0.5} />
        <path d="M30 -115 A115 115 0 0 1 115 0 A115 115 0 0 1 0 115 A150 150 0 0 0 30 -115 Z" fill="#000000" opacity={0.18} />
        <path d="M-190 0 A190 40 0 0 0 190 0" fill="none" stroke="#e8c49a" strokeWidth={14} transform="rotate(-15)" />
        <circle cx={-160} cy={-110} r={18} fill="#b8b0a8" />
        <circle cx={-164} cy={-114} r={5} fill="#9a928a" />
      </g>
      {/* Земля с облаками и сиянием атмосферы */}
      <g transform="translate(200 640)">
        <Glow cx={0} cy={0} rx={100} color="#7ab8ff" opacity={0.5} />
        <circle cx={0} cy={0} r={56} fill="#4a7fc0" />
        <path d="M-30 -40 Q-10 -30 -16 -6 Q-36 4 -44 -14 Z M10 0 Q36 -10 40 20 Q20 40 6 24 Z" fill="#6aa84f" />
        <path d="M-40 10 q20 -6 40 4 M0 -30 q20 -6 30 6" stroke="#ffffff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
        <path d="M20 -52 A56 56 0 0 1 20 52 A70 70 0 0 0 20 -52 Z" fill="#000000" opacity={0.2} />
      </g>
      {/* спутник */}
      <g transform="translate(620 470) rotate(20)">
        <rect x={-14} y={-10} width={28} height={20} rx={3} fill="#c8c8d0" />
        <rect x={-60} y={-8} width={40} height={16} fill="#3a5a9a" />
        <rect x={20} y={-8} width={40} height={16} fill="#3a5a9a" />
        {[-50, -38, 30, 42].map((x) => <rect key={x} x={x} y={-8} width={2} height={16} fill="#8ab0e0" />)}
        <path d="M0 -10 v-14" stroke="#c8c8d0" strokeWidth={3} />
        <circle cx={0} cy={-26} r={4} fill="#f2c230" />
      </g>
      {/* лунная поверхность */}
      <path d="M0 1080 Q260 1040 520 1080 T1080 1060 V1920 H0 Z" fill="#9a9aa6" />
      <path d="M0 1080 Q260 1040 520 1080 T1080 1060 V1080 Q800 1090 520 1100 T0 1100 Z" fill="#ffffff" opacity={0.12} />
      <path d="M0 1160 Q300 1130 560 1150 T1080 1140 V1920 H0 Z" fill="#a9a9b4" />
      <defs>
        <linearGradient id="moon-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#1d1d30" stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <rect x={0} y={1140} width={W} height={H - 1140} fill="url(#moon-shade)" />
      {[[300, 1100, 60], [760, 1090, 46], [920, 1210, 70], [120, 1230, 40], [80, 1560, 90], [1000, 1700, 110], [620, 1110, 26]].map(([x, y, r]) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.28} fill="#7d7d8a" />
          <ellipse cx={x} cy={y + r * 0.06} rx={r * 0.8} ry={r * 0.2} fill="#8c8c98" />
          <path d={`M${x - r} ${y} A${r} ${r * 0.28} 0 0 0 ${x + r} ${y}`} stroke="#c4c4ce" strokeWidth={4} fill="none" opacity={0.6} />
        </g>
      ))}
      {/* камни */}
      {[[440, 1150, 22], [980, 1130, 30], [30, 1180, 26], [700, 1170, 14]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + r * 0.4} rx={r * 1.2} ry={r * 0.25} fill="#000000" opacity={0.15} />
          <path d={`M${x - r} ${y + r * 0.4} Q${x - r} ${y - r * 0.6} ${x} ${y - r * 0.7} Q${x + r} ${y - r * 0.5} ${x + r} ${y + r * 0.4} Z`} fill="#8a8a96" />
          <path d={`M${x - r * 0.6} ${y - r * 0.2} Q${x - r * 0.2} ${y - r * 0.6} ${x + r * 0.3} ${y - r * 0.55}`} stroke="#b8b8c4" strokeWidth={4} fill="none" />
        </g>
      ))}
      {/* следы от ракеты к флажку */}
      <g fill="#8a8a96" opacity={0.7}>
        {Array.from({ length: 7 }).map((_, i) => (
          <ellipse key={i} cx={240 + i * 46} cy={1196 + (i % 2) * 14 + i * 4} rx={10} ry={5} />
        ))}
      </g>
      <g>
        <rect x={570} y={1050} width={5} height={150} fill="#c8c8d0" />
        <rect x={575} y={1052} width={70} height={44} fill="#c8553d" />
        <rect x={575} y={1066} width={70} height={14} fill="#f4f1ea" />
        <ellipse cx={572} cy={1200} rx={16} ry={4} fill="#000000" opacity={0.2} />
      </g>
      {/* ракетка */}
      <g transform="translate(150 1170)">
        <ellipse cx={0} cy={4} rx={70} ry={12} fill="#000000" opacity={0.2} />
        <path d="M-50 0 L-30 -80 H30 L50 0 Z" fill="#c8553d" />
        <path d="M-30 -60 Q-34 -220 0 -280 Q34 -220 30 -60 Z" fill="#f2efe8" />
        <path d="M-12 -70 Q-16 -200 0 -260" stroke="#ffffff" strokeWidth={6} fill="none" />
        <path d="M30 -60 Q34 -200 0 -280 Q20 -200 18 -60 Z" fill="#000000" opacity={0.08} />
        <path d="M-18 -240 Q0 -290 18 -240 Z" fill="#c8553d" />
        <circle cx={0} cy={-160} r={18} fill="#4a6fa5" />
        <circle cx={0} cy={-160} r={10} fill="#a9c7d9" />
        <rect x={-34} y={-110} width={68} height={8} fill="#c8553d" />
      </g>
    </>
  );
};

/* ---------- crossroads: развилка в облаках — дорога вверх к вратам рая и вниз к аду ---------- */

/** Лента дороги по осевым точкам {x, y, w}: многоугольник из левого и правого края. */
const ribbon = (pts: { x: number; y: number; w: number }[]) => {
  const L: string[] = [];
  const R: string[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    L.push(`${(p.x + (nx * p.w) / 2).toFixed(1)} ${(p.y + (ny * p.w) / 2).toFixed(1)}`);
    R.push(`${(p.x - (nx * p.w) / 2).toFixed(1)} ${(p.y - (ny * p.w) / 2).toFixed(1)}`);
  });
  return `M${L.join(" L")} L${R.reverse().join(" L")} Z`;
};

/** Поперечные ступени-полоски вдоль дороги (между соседними осевыми точками, k — доля). */
const rungs = (pts: { x: number; y: number; w: number }[], per = 2) => {
  const out: { x1: number; y1: number; x2: number; y2: number; w: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = 0; j < per; j++) {
      const t = (j + 0.5) / per;
      const a = pts[i];
      const b = pts[i + 1];
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const w = (a.w + (b.w - a.w) * t) * 0.86;
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = -(b.y - a.y) / len;
      const ny = (b.x - a.x) / len;
      out.push({ x1: x + (nx * w) / 2, y1: y + (ny * w) / 2, x2: x - (nx * w) / 2, y2: y - (ny * w) / 2, w });
    }
  }
  return out;
};

/** Нимб (значок рая на указателе): золотое кольцо с крылышками. */
const HaloIcon = ({ x, y, s = 1, gold }: { x: number; y: number; s?: number; gold: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-14 4 q-22 -4 -34 -22 q14 4 22 0 q-12 -6 -16 -16 q14 8 28 12 Z" fill="#ffffff" />
    <path d="M14 4 q22 -4 34 -22 q-14 4 -22 0 q12 -6 16 -16 q-14 8 -28 12 Z" fill="#ffffff" />
    <ellipse cx={0} cy={0} rx={22} ry={9} fill="none" stroke={gold} strokeWidth={7} />
    <ellipse cx={0} cy={-2} rx={22} ry={9} fill="none" stroke={shade(gold, 0.5)} strokeWidth={2} />
  </g>
);

const Crossroads = ({ palette }: BackdropProps) => {
  const gold = palette.accent;
  const pearl = "#efe4d0";
  // ось ствола дороги (от зрителя к развилке) и двух ветвей
  const trunk = [
    { x: 540, y: H + 20, w: 520 },
    { x: 540, y: 1560, w: 400 },
    { x: 540, y: 1330, w: 300 },
    { x: 540, y: 1215, w: 230 },
  ];
  const up = [
    { x: 500, y: 1215, w: 170 },
    { x: 380, y: 1203, w: 150 },
    { x: 240, y: 1180, w: 128 },
    { x: 165, y: 1125, w: 100 },
    { x: 175, y: 1050, w: 80 },
    { x: 225, y: 985, w: 64 },
    { x: 270, y: 935, w: 52 },
    { x: 290, y: 905, w: 46 },
  ];
  const down = [
    { x: 580, y: 1215, w: 170 },
    { x: 700, y: 1205, w: 150 },
    { x: 820, y: 1182, w: 126 },
    { x: 880, y: 1152, w: 104 },
    { x: 868, y: 1126, w: 88 },
  ];
  // провал в облачном полу справа: дорога доходит до ближнего края и уходит вниз
  const hole = { cx: 850, cy: 1084, rx: 180, ry: 46 };
  return (
    <>
      <Sky id="cross-sky" stops={[[0, "#a9c6ea"], [0.3, palette.wall], [0.55, "#fff1dc"], [1, "#ffffff"]]} />
      {/* слева — золотой свет рая, справа внизу — красный отсвет ада */}
      <Rays cx={290} cy={760} color="#fff3c4" n={14} opacity={0.4} />
      <Glow cx={290} cy={760} rx={520} color="#fff3c4" opacity={0.7} />
      <Glow cx={850} cy={1060} rx={420} ry={260} color="#e0502a" opacity={0.45} />
      <Cloud x={720} y={540} s={0.5} color="#ffffffd0" />
      <Cloud x={560} y={470} s={0.32} color="#ffffffb0" />
      <Cloud x={40} y={90} s={0.35} color="#ffffff80" />
      <Cloud x={800} y={80} s={0.4} color="#ffffff80" />
      {/* голуби у врат */}
      <g fill="#ffffff" opacity={0.9}>
        {[[420, 600, 0.9], [470, 630, 0.7], [110, 560, 0.8]].map(([x, y, s], i) => (
          <path key={i} d={`M${x} ${y} q${14 * s} ${-16 * s} ${28 * s} 0 q${14 * s} ${-16 * s} ${28 * s} 0 q${-14 * s} ${-4 * s} ${-28 * s} ${8 * s} q${-14 * s} ${-12 * s} ${-28 * s} ${-8 * s} Z`} />
        ))}
      </g>
      {/* дальние облака: справа облака темнеют и краснеют снизу */}
      <CloudBank y={1000} color="#e8f0fa" r={100} step={150} seed={5} />
      <CloudBank y={1050} color="#f4f8fd" r={80} step={130} seed={17} />
      <Glow cx={860} cy={1040} rx={300} ry={110} color="#ff7a3a" opacity={0.35} />
      {/* врата рая вдали слева на облачном островке */}
      <g>
        <Glow cx={290} cy={780} rx={200} ry={260} color="#fff6d0" opacity={0.8} />
        <g fill="#ffffff">
          <circle cx={200} cy={915} r={60} />
          <circle cx={290} cy={900} r={74} />
          <circle cx={380} cy={918} r={58} />
          <rect x={150} y={915} width={280} height={40} rx={20} />
        </g>
        <path d="M190 720 Q290 620 390 720 V736 Q290 640 190 736 Z" fill={gold} />
        {[-1, 1].map((d) => <Curl key={d} x={290 + d * 24} y={672} r={24} flip={d} color={gold} w={4} />)}
        <circle cx={290} cy={650} r={15} fill={gold} />
        <Sparkle x={290} y={650} r={22} o={0.85} />
        {Array.from({ length: 7 }).map((_, i) => {
          const x = 218 + i * 24;
          const t = (x - 290) / 100;
          const topY = 726 - 60 * (1 - t * t) + 16;
          return (
            <g key={i}>
              <rect x={x - 3} y={topY} width={6} height={900 - topY} rx={3} fill={gold} opacity={0.85} />
              <path d={`M${x} ${topY - 12} l5 10 h-10 Z`} fill={gold} />
            </g>
          );
        })}
        <rect x={204} y={800} width={172} height={8} rx={4} fill={gold} opacity={0.85} />
        <rect x={287} y={690} width={6} height={210} fill={shade(gold, -0.2)} />
        {[160, 380].map((x) => (
          <g key={x}>
            <rect x={x} y={716} width={42} height={190} rx={8} fill={pearl} />
            <rect x={x + 28} y={722} width={8} height={180} rx={4} fill="#d9cbb2" />
            <rect x={x - 8} y={700} width={58} height={22} rx={8} fill={gold} />
            <circle cx={x + 21} cy={690} r={12} fill={pearl} />
            {[750, 785, 820, 855].map((y) => <circle key={y} cx={x + 20} cy={y} r={6} fill="#ffffff" />)}
          </g>
        ))}
      </g>
      {/* дым и искры над провалом справа */}
      <g fill="#6a5a5a" opacity={0.26}>
        <ellipse cx={830} cy={1000} rx={64} ry={26} />
        <ellipse cx={870} cy={948} rx={78} ry={30} />
        <ellipse cx={836} cy={890} rx={58} ry={24} />
      </g>
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={720 + rnd(i + 40) * 240} cy={860 + rnd(i + 90) * 200} r={2 + rnd(i) * 3} fill={i % 2 ? "#f2b030" : "#ff7a3a"} opacity={0.8} />
      ))}
      {/* облачный пол */}
      <CloudFloor top={1110} color="#ffffff" shadow="#e4edf7" />
      <Glow cx={870} cy={1150} rx={260} ry={70} color="#ff8a5a" opacity={0.35} />
      {/* огненный провал: тёмный обожжённый край, раскалённое нутро, ступени вниз, языки пламени */}
      <g>
        <ellipse cx={hole.cx} cy={hole.cy + 4} rx={hole.rx + 16} ry={hole.ry + 10} fill="#d8b8b0" />
        <ellipse cx={hole.cx} cy={hole.cy} rx={hole.rx} ry={hole.ry} fill="#3a1410" />
        <ellipse cx={hole.cx} cy={hole.cy + 8} rx={hole.rx * 0.86} ry={hole.ry * 0.7} fill="#8a2a1c" />
        <ellipse cx={hole.cx} cy={hole.cy + 14} rx={hole.rx * 0.62} ry={hole.ry * 0.42} fill="#e0602a" />
        <ellipse cx={hole.cx} cy={hole.cy + 18} rx={hole.rx * 0.34} ry={hole.ry * 0.2} fill="#f2b030" />
        {/* ступени дороги, уходящие в глубину */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={hole.cx - 6 - 40 + i * 9} y={hole.cy + 34 - i * 12} width={80 - i * 18} height={8} rx={3} fill="#2a0c0a" opacity={0.85 - i * 0.15} />
        ))}
        <Flame x={hole.cx - 110} y={hole.cy + 10} s={0.36} o={0.95} />
        <Flame x={hole.cx + 50} y={hole.cy + 6} s={0.5} o={0.95} />
        <Flame x={hole.cx + 130} y={hole.cy + 8} s={0.3} o={0.9} />
        <Glow cx={hole.cx} cy={hole.cy - 20} rx={240} ry={90} color="#ff6a2a" opacity={0.4} />
        <path d={`M${hole.cx - hole.rx} ${hole.cy} Q${hole.cx} ${hole.cy - hole.ry * 1.5} ${hole.cx + hole.rx} ${hole.cy}`} stroke="#5a2a24" strokeWidth={6} fill="none" opacity={0.5} />
      </g>
      {/* ствол дороги: души приходят снизу к развилке */}
      <path d={ribbon(trunk)} fill="#f4ecd6" />
      <path d={ribbon(trunk.map((p) => ({ ...p, w: p.w * 0.7 })))} fill="#f8f1de" />
      {rungs(trunk, 3).map((r, i) => <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#e0d2b0" strokeWidth={4 + i * 0.6} opacity={0.6} />)}
      {/* ветка вверх к раю: светлая золотая лестница */}
      <path d={ribbon(up.map((p) => ({ ...p, w: p.w + 16 })))} fill="#ffffff" opacity={0.8} />
      <path d={ribbon(up)} fill="#f7e2a0" />
      {rungs(up, 2).map((r, i) => <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={gold} strokeWidth={Math.max(2, r.w / 22)} opacity={0.7} strokeLinecap="round" />)}
      <path d={ribbon(up.map((p) => ({ ...p, w: p.w * 0.25 })))} fill="#fffaf0" opacity={0.6} />
      {/* ветка вниз к аду: тёмная потрескавшаяся брусчатка */}
      <path d={ribbon(down)} fill="#6a4a46" />
      {rungs(down, 2).map((r, i) => <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#3a2422" strokeWidth={Math.max(2, r.w / 20)} opacity={0.8} strokeLinecap="round" />)}
      <path d={ribbon(down.map((p) => ({ ...p, w: p.w * 0.18 })))} fill="#e0602a" opacity={0.35} />
      <path d="M640 1212 l30 -6 l18 8 l26 -10 M780 1192 l24 -2 l14 -10 l20 4 M880 1150 l18 -10 l4 -16" stroke="#ff8a2a" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.85} />
      {/* ближний край провала: дорога переваливает через него и уходит вниз */}
      <path d={`M${hole.cx - hole.rx * 0.5} ${hole.cy + hole.ry * 0.9} Q${hole.cx} ${hole.cy + hole.ry * 1.25} ${hole.cx + hole.rx * 0.5} ${hole.cy + hole.ry * 0.9}`} stroke="#ff8a2a" strokeWidth={5} fill="none" opacity={0.7} strokeLinecap="round" />
      {/* весы суда на облачной тумбе слева от судьи */}
      <g>
        <ellipse cx={378} cy={1188} rx={70} ry={12} fill="#c9d6e6" opacity={0.6} />
        <g fill="#ffffff">
          <circle cx={350} cy={1150} r={34} />
          <circle cx={406} cy={1150} r={34} />
          <circle cx={378} cy={1130} r={36} />
          <rect x={320} y={1150} width={116} height={36} rx={16} />
        </g>
        <rect x={374} y={960} width={8} height={170} fill={gold} />
        <circle cx={378} cy={954} r={10} fill={gold} />
        <path d="M318 976 Q378 962 438 976" stroke={gold} strokeWidth={7} fill="none" strokeLinecap="round" />
        {[[318, 1], [438, -1]].map(([x, d]) => (
          <g key={x}>
            <path d={`M${x} 978 L${x - 22} 1034 M${x} 978 L${x + 22} 1034`} stroke={shade(gold, -0.2)} strokeWidth={2.5} />
            <path d={`M${x - 30} 1034 Q${x} ${1060 + d * 4} ${x + 30} 1034 Z`} fill={gold} />
          </g>
        ))}
        <Sparkle x={420} y={940} r={10} o={0.8} />
      </g>
      {/* указатель на развилке, за судьёй: вверх-влево — нимб (рай), вниз-вправо — пламя (ад) */}
      <g>
        <rect x={533} y={440} width={14} height={760} rx={6} fill="#c9b48a" />
        <rect x={536} y={440} width={4} height={760} fill="#ffffff" opacity={0.4} />
        <circle cx={540} cy={436} r={12} fill={gold} />
        <g transform="rotate(-8 540 500)">
          <path d="M556 466 H396 L360 502 L396 538 H556 Z" fill="#fbf6e8" />
          <path d="M556 466 H396 L360 502 L396 538 H556 Z" fill="none" stroke={gold} strokeWidth={6} strokeLinejoin="round" />
          <HaloIcon x={460} y={506} s={1.1} gold={gold} />
        </g>
        <g transform="rotate(10 540 600)">
          <path d="M524 566 H684 L720 602 L684 638 H524 Z" fill="#5a1a14" />
          <path d="M524 566 H684 L720 602 L684 638 H524 Z" fill="none" stroke="#2a0c0a" strokeWidth={6} strokeLinejoin="round" />
          <Flame x={622} y={628} s={0.34} />
        </g>
        <rect x={528} y={1186} width={24} height={10} rx={4} fill="#a89470" />
      </g>
      {/* пюпитр судьи с раскрытой книгой душ и пером, справа от метки judge */}
      <g>
        <ellipse cx={658} cy={1190} rx={56} ry={10} fill="#c9d6e6" opacity={0.7} />
        <rect x={644} y={1010} width={28} height={176} fill={shade(gold, -0.2)} />
        <rect x={650} y={1010} width={7} height={176} fill="#ffffff" opacity={0.3} />
        <path d="M620 1186 h76 l-10 -14 h-56 Z" fill={shade(gold, -0.3)} />
        <path d="M594 1012 L722 1012 L734 980 L582 980 Z" fill={gold} />
        <path d="M590 984 Q624 962 658 978 V992 Q624 976 590 996 Z" fill="#fffaf0" />
        <path d="M658 978 Q692 962 726 984 V996 Q692 976 658 992 Z" fill="#f2ead8" />
        {[0, 1, 2].map((i) => <path key={i} d={`M${600 + i * 4} ${982 - i * 3} q22 -10 48 0`} stroke="#c9bfa8" strokeWidth={2} fill="none" />)}
        {[0, 1, 2].map((i) => <path key={i} d={`M${668 + i * 4} ${976 - i * 2} q22 -6 46 4`} stroke="#c9bfa8" strokeWidth={2} fill="none" />)}
        <rect x={655} y={984} width={6} height={44} fill="#c8553d" />
        <ellipse cx={734} cy={976} rx={9} ry={5} fill="#2b2a3a" />
        <path d="M734 974 q18 -38 34 -54 q-6 22 -28 56 Z" fill="#ffffff" />
      </g>
      {/* облачные кочки у краёв и искорки */}
      <g fill="#eef4fb">
        <circle cx={-20} cy={1520} r={120} />
        <circle cx={1100} cy={1580} r={130} />
      </g>
      {/* облачка по краям ствола дороги */}
      <g fill="#ffffff" opacity={0.9}>
        {[[350, 1470, 54], [380, 1420, 36], [732, 1480, 56], [706, 1428, 36], [290, 1800, 70], [800, 1810, 74], [340, 1760, 44]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      {[[120, 820], [470, 760], [80, 1000], [620, 860], [440, 1080], [160, 1300]].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} r={8 + (i % 3) * 5} o={0.85} />
      ))}
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
    ) : variant === "crossroads" ? (
      <Crossroads palette={palette} />
    ) : (
      <Heaven palette={palette} />
    )}
  </Canvas>
);
