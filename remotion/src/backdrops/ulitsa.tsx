import type { ReactNode } from "react";
import { Canvas, Cloud, FLOOR_Y, Tree, W, H, type BackdropProps } from "./parts";
import { BenchAt, SeatAt } from "./gostinaya";
import { seatTopY } from "../world/depth";

/**
 * Фон «ulitsa»: улица; варианты park, cemetery, stadium, zoo. Скамейки нарисованы под метки bench-1/bench-2 (дальний план),
 * на стадионе — передний ряд трибуны (seat-1…seat-4).
 */

/** Осветлить (k>0) или затемнить (k<0) цвет #rrggbb. */
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const t = k < 0 ? 0 : 255;
  const p = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * p));
  return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
};

const SIDEWALK_TOP = 1100;
const CURB_Y = 1250;

const LampPost = ({ x, top = 560, y = FLOOR_Y, color = "#2f3a40", light = "#f7dc8a", glow = 0.16 }: { x: number; top?: number; y?: number; color?: string; light?: string; glow?: number }) => (
  <g>
    {glow > 0 && <circle cx={x} cy={top + 40} r={130} fill={light} opacity={glow} />}
    <rect x={x - 9} y={top + 60} width={18} height={y - top - 60} fill={color} />
    <rect x={x - 24} y={y - 46} width={48} height={46} rx={10} fill={color} />
    <rect x={x - 26} y={top + 8} width={52} height={60} rx={10} fill={light} />
    <path d={`M${x - 40} ${top + 14} L${x} ${top - 22} L${x + 40} ${top + 14} Z`} fill={color} />
    <rect x={x - 32} y={top + 62} width={64} height={12} rx={5} fill={color} />
  </g>
);

const Pigeon = ({ x, y, body = "#8d93a0" }: { x: number; y: number; body?: string }) => (
  <g>
    <ellipse cx={x} cy={y - 24} rx={30} ry={20} fill={body} />
    <path d={`M${x + 22} ${y - 30} l26 -6 l-6 18 z`} fill={shade(body, -0.25)} />
    <circle cx={x - 26} cy={y - 44} r={14} fill={shade(body, -0.1)} />
    <circle cx={x - 30} cy={y - 47} r={3} fill="#2b1d14" />
    <path d={`M${x - 40} ${y - 44} l-10 4 l10 3 z`} fill="#e0a030" />
    <rect x={x - 6} y={y - 6} width={4} height={8} fill="#c8553d" />
    <rect x={x + 6} y={y - 6} width={4} height={8} fill="#c8553d" />
  </g>
);

const Win = ({ x, y, w = 74, h = 104, frame = "#f2e6d0", glass = "#cfe6f5", children }: { x: number; y: number; w?: number; h?: number; frame?: string; glass?: string; children?: ReactNode }) => (
  <g>
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={6} fill={frame} />
    <rect x={x} y={y} width={w} height={h} rx={4} fill={glass} />
    {children}
    <rect x={x + w / 2 - 3} y={y} width={6} height={h} fill={frame} />
    <rect x={x - 10} y={y + h + 4} width={w + 20} height={10} rx={3} fill={shade(frame, -0.12)} />
  </g>
);

/** Фасад с сеткой окон; первый этаж (y 880…1100) отдаётся children. */
const Facade = ({ x, w, top, color, cols, children }: { x: number; w: number; top: number; color: string; cols: number[]; children?: ReactNode }) => {
  const rows: number[] = [];
  for (let y = top + 70; y + 110 < 860; y += 160) rows.push(y);
  return (
    <g>
      <rect x={x} y={top} width={w} height={SIDEWALK_TOP - top} fill={color} />
      <rect x={x - 8} y={top - 6} width={w + 16} height={22} rx={4} fill={shade(color, -0.18)} />
      <rect x={x} y={868} width={w} height={14} fill={shade(color, -0.12)} />
      {rows.map((ry) => cols.map((cx) => <Win key={`${ry}-${cx}`} x={x + cx} y={ry} />))}
      {children}
    </g>
  );
};

const Awning = ({ x, w, y, a, b }: { x: number; w: number; y: number; a: string; b: string }) => {
  const n = Math.round(w / 44);
  const sw = w / n;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <rect x={x + i * sw} y={y} width={sw} height={60} fill={i % 2 ? b : a} />
          <circle cx={x + i * sw + sw / 2} cy={y + 60} r={sw / 2} fill={i % 2 ? b : a} />
        </g>
      ))}
    </g>
  );
};

const Sidewalk = ({ asphalt }: { asphalt: string }) => (
  <g>
    <rect x={0} y={SIDEWALK_TOP} width={W} height={CURB_Y - SIDEWALK_TOP} fill="#bdb4a5" />
    <rect x={0} y={SIDEWALK_TOP} width={W} height={14} fill="#00000014" />
    {[150, 390, 630, 870].map((x) => <rect key={x} x={x} y={SIDEWALK_TOP + 14} width={4} height={CURB_Y - SIDEWALK_TOP - 14} fill="#0000000f" />)}
    <rect x={0} y={CURB_Y} width={W} height={24} fill="#d6cfc2" />
    <rect x={0} y={CURB_Y + 24} width={W} height={H - CURB_Y - 24} fill={asphalt} />
    {[60, 400, 740].map((x) => <rect key={x} x={x} y={1560} width={200} height={22} rx={8} fill="#ffffff" opacity={0.35} />)}
  </g>
);

const Street = ({ palette }: BackdropProps) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
    <Cloud x={780} y={470} s={0.5} color="#ffffffcc" />
    <Cloud x={60} y={120} s={0.6} color="#ffffff99" />
    {/* дальние дома */}
    <g fill={shade(palette.wall, -0.12)}>
      <rect x={-10} y={500} width={200} height={600} />
      <rect x={220} y={430} width={140} height={700} />
      <rect x={560} y={540} width={160} height={600} />
      <rect x={840} y={450} width={180} height={700} />
    </g>
    <Facade x={-20} w={320} top={560} color="#c8653d" cols={[60, 190]}>
      <Win x={30} y={930} w={130} h={120}>
        <rect x={30} y={1010} width={130} height={40} fill="#f2e6d0" />
      </Win>
      <rect x={20} y={1050} width={150} height={22} rx={6} fill="#8a5a3a" />
      {[40, 80, 120, 150].map((fx, i) => <circle key={fx} cx={fx} cy={1046} r={14} fill={i % 2 ? "#e0a030" : "#d8506a"} />)}
      <rect x={190} y={920} width={84} height={180} rx={6} fill="#6b4429" />
      <circle cx={260} cy={1015} r={6} fill="#e0a030" />
    </Facade>
    <Facade x={300} w={340} top={470} color="#ead7b2" cols={[50, 216]}>
      <rect x={300} y={882} width={340} height={218} fill="#d8c29a" />
      <Awning x={310} w={320} y={880} a={palette.accent} b="#fff4e0" />
      <rect x={326} y={985} width={190} height={115} rx={6} fill="#cfe6f5" />
      <path d="M340 1090 l70 -100 h30 l-70 100 z" fill="#ffffff" opacity={0.45} />
      {[380, 420, 460].map((ox) => <circle key={ox} cx={ox} cy={1078} r={18} fill={palette.accent} />)}
      <rect x={536} y={980} width={84} height={120} rx={6} fill="#8a5a3a" />
    </Facade>
    {/* кот в окне */}
    <g fill="#3a3030">
      <ellipse cx={376} cy={845} rx={22} ry={16} />
      <circle cx={376} cy={820} r={15} />
      <path d="M363 812 l2 -16 l10 10 z M389 812 l-2 -16 l-10 10 z" />
    </g>
    <Facade x={640} w={240} top={600} color="#d9a44a" cols={[30, 136]}>
      <Win x={660} y={930} w={110} h={120} />
      <rect x={790} y={920} width={70} height={180} rx={6} fill="#6b4429" />
    </Facade>
    <Facade x={880} w={220} top={520} color="#b98a63" cols={[40, 140]} />
    <Sidewalk asphalt={palette.floor} />
    <LampPost x={100} top={560} />
    <BenchAt x0={0.72} x1={0.96} />
    <Pigeon x={640} y={1236} />
  </>
);

const Park = ({ palette }: BackdropProps) => {
  const grass = "#8fbf6a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <circle cx={880} cy={560} r={70} fill="#fbe7a6" />
      <Cloud x={80} y={520} s={0.55} color="#ffffffcc" />
      {/* город вдалеке */}
      <g fill={shade(palette.wall, -0.1)}>
        <rect x={40} y={760} width={110} height={200} />
        <rect x={170} y={700} width={80} height={260} />
        <rect x={700} y={730} width={120} height={230} />
        <rect x={840} y={790} width={90} height={170} />
      </g>
      {/* полоса деревьев */}
      <g fill="#6fa25a">
        {[0, 120, 240, 360, 480, 600, 720, 840, 960, 1080].map((x, i) => <circle key={x} cx={x} cy={930 - (i % 3) * 25} r={95} />)}
      </g>
      <rect x={0} y={950} width={W} height={H - 950} fill={grass} />
      <rect x={0} y={950} width={W} height={20} fill="#00000012" />
      {/* дорожка */}
      <path d="M470 950 L610 950 L900 1920 L180 1920 Z" fill="#e6d3a5" />
      <path d="M470 950 L490 950 L230 1920 L180 1920 Z" fill="#00000010" />
      {/* кусты */}
      <g fill="#5f9a4c">
        <circle cx={300} cy={1010} r={50} />
        <circle cx={360} cy={1020} r={40} />
        <circle cx={760} cy={1015} r={46} />
      </g>
      <Tree x={90} y={1200} s={1.25} crown="#5b8c5a" trunk="#7a5236" />
      <Tree x={1000} y={1180} s={1.1} crown="#4f8350" trunk="#7a5236" />
      <LampPost x={250} top={720} y={1110} glow={0} />
      <BenchAt x0={0.66} x1={0.9} color="#b0703f" />
      {/* шарик, привязанный к скамейке */}
      <path d={`M960 ${seatTopY(1)} q-10 -150 -20 -290`} stroke="#2b1d14" strokeWidth={3} fill="none" />
      <ellipse cx={940} cy={800} rx={34} ry={42} fill="#d8506a" />
      <path d="M934 840 l6 10 l6 -10 z" fill="#d8506a" />
      {/* цветы */}
      {[[60, 1320, "#e0a030"], [110, 1360, "#d8506a"], [960, 1340, "#ffffff"], [1010, 1300, "#e0a030"], [150, 1420, "#ffffff"]].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x as number} cy={y as number} r={14} fill={c as string} />
          <circle cx={x as number} cy={y as number} r={5} fill="#c8553d" />
        </g>
      ))}
    </>
  );
};

const Gravestone = ({ x, y, s = 1, color = "#8c8fa0", cross = false }: { x: number; y: number; s?: number; color?: string; cross?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={90} ry={16} fill="#00000022" />
    {cross ? (
      <>
        <rect x={-16} y={-230} width={32} height={230} rx={6} fill={color} />
        <rect x={-70} y={-180} width={140} height={32} rx={6} fill={color} />
      </>
    ) : (
      <>
        <path d="M-60 0 V-130 a60 60 0 0 1 120 0 V0 Z" fill={color} />
        <path d="M30 0 V-160 a60 60 0 0 1 30 30 V0 Z" fill={shade(color, -0.18)} />
        <rect x={-30} y={-120} width={50} height={8} rx={4} fill={shade(color, -0.2)} />
        <rect x={-30} y={-100} width={50} height={8} rx={4} fill={shade(color, -0.2)} />
      </>
    )}
  </g>
);

const Cemetery = () => {
  const ground = "#4f5d4a";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill="#4a4270" />
      <rect x={0} y={520} width={W} height={200} fill="#68507f" />
      <rect x={0} y={720} width={W} height={150} fill="#9b6280" />
      <rect x={0} y={870} width={W} height={150} fill="#d28a6c" />
      <circle cx={800} cy={600} r={58} fill="#f3e3b5" />
      <circle cx={822} cy={588} r={50} fill="#68507f" />
      {/* холмы и ограда вдалеке */}
      <path d="M0 990 Q260 900 520 980 T1080 960 V1040 H0 Z" fill="#3e3a52" />
      <g fill="#2e2a3a">
        <rect x={0} y={985} width={W} height={8} />
        {Array.from({ length: 28 }).map((_, i) => <path key={i} d={`M${i * 40} 1030 v-60 l6 -10 l6 10 v60 z`} />)}
      </g>
      <rect x={0} y={1030} width={W} height={H - 1030} fill={ground} />
      <rect x={0} y={1030} width={W} height={16} fill="#00000018" />
      {/* дальний ряд */}
      {[[330, 1075], [470, 1070], [620, 1078], [760, 1072]].map(([x, y]) => <Gravestone key={x} x={x} y={y} s={0.38} color="#6f7183" />)}
      <Gravestone x={560} y={1090} s={0.4} color="#6f7183" cross />
      {/* голое дерево */}
      <g fill="none" stroke="#2a2430" strokeLinecap="round">
        <path d="M150 1200 C150 1000 170 850 140 640" strokeWidth={44} />
        <path d="M150 900 C210 840 260 820 330 760" strokeWidth={20} />
        <path d="M145 780 C100 730 80 690 40 660" strokeWidth={18} />
        <path d="M140 680 C170 620 200 590 250 560" strokeWidth={14} />
        <path d="M260 800 C280 760 300 740 330 700" strokeWidth={10} />
        <path d="M70 680 C60 640 70 610 60 580" strokeWidth={9} />
      </g>
      {/* ворона */}
      <g fill="#1e1a24">
        <ellipse cx={300} cy={755} rx={26} ry={16} />
        <circle cx={322} cy={740} r={12} />
        <path d="M332 740 l16 4 l-16 5 z" fill="#e0a030" />
        <path d="M278 752 l-26 10 l22 6 z" />
      </g>
      {/* скамейка у оградки (метки bench-1, bench-2) */}
      <BenchAt x0={0.26} x1={0.5} color="#5a4a3a" metal="#2a2430" />
      <Gravestone x={880} y={1200} s={1} color="#9a9cac" />
      <Gravestone x={1040} y={1170} s={0.8} color="#868899" cross />
      <Gravestone x={70} y={1220} s={0.85} color="#8c8fa0" />
      {/* букетик */}
      <rect x={846} y={1150} width={6} height={40} fill="#3f6b3a" />
      <circle cx={849} cy={1148} r={12} fill="#d8506a" />
      <circle cx={866} cy={1158} r={10} fill="#e0a030" />
    </>
  );
};

/** Детерминированный «шум» для толпы. */
const rnd = (i: number) => {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const Stadium = ({ palette }: BackdropProps) => {
  const crowd = ["#c8553d", "#e0a030", "#4a6fa5", "#f2e6d0", "#5b8c5a", "#8a5a3a"];
  const tiers = [620, 690, 760, 830, 900];
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      {/* прожекторы */}
      {[80, 1000].map((x) => (
        <g key={x}>
          <rect x={x - 8} y={500} width={16} height={500} fill="#4a4f5a" />
          <rect x={x - 50} y={450} width={100} height={64} rx={8} fill="#4a4f5a" />
          {[-30, 0, 30].map((dx) => <circle key={dx} cx={x + dx} cy={482} r={11} fill="#fff4c8" />)}
        </g>
      ))}
      {/* трибуны */}
      <path d="M0 580 L1080 580 L1080 1000 L0 1000 Z" fill="#7d8796" />
      <rect x={0} y={560} width={W} height={40} fill="#5d6574" />
      {tiers.map((ty, ti) => (
        <g key={ty}>
          <rect x={0} y={ty} width={W} height={60} fill={ti % 2 ? "#8b95a4" : "#97a1b0"} />
          {Array.from({ length: 27 }).map((_, i) => {
            const k = ti * 31 + i;
            if (rnd(k) < 0.18) return null;
            return (
              <g key={i}>
                <rect x={i * 40 + 8 + (ti % 2) * 20} y={ty + 26} width={26} height={30} rx={10} fill={crowd[Math.floor(rnd(k + 7) * crowd.length)]} />
                <circle cx={i * 40 + 21 + (ti % 2) * 20} cy={ty + 18} r={11} fill={rnd(k + 3) < 0.5 ? "#f1c9a5" : "#c99872"} />
              </g>
            );
          })}
        </g>
      ))}
      <rect x={0} y={580} width={W} height={390} fill={palette.wall} opacity={0.45} />
      {/* рекламный борт без текста */}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={i * 180} y={960} width={180} height={50} fill={[palette.accent, "#c8553d", "#f2e6d0"][i % 3]} />
      ))}
      {/* поле */}
      <rect x={0} y={1010} width={W} height={H - 1010} fill="#5f9e4f" />
      {[1010, 1090, 1190, 1310, 1460, 1640].map((y, i) => i % 2 ? <rect key={y} x={0} y={y} width={W} height={[80, 100, 120, 150, 180, 280][i]} fill="#6aa95a" /> : null)}
      <rect x={0} y={1010} width={W} height={14} fill="#00000018" />
      <rect x={0} y={1290} width={W} height={10} fill="#ffffff" opacity={0.7} />
      {/* передний ряд трибуны: бетонная ступень и пластиковые кресла (метки seat-1…seat-4 — через одно) */}
      <rect x={0} y={1024} width={W} height={FLOOR_Y - 1024} fill="#9aa3b0" />
      <rect x={0} y={1024} width={W} height={12} fill="#b4bcc8" />
      <rect x={0} y={FLOOR_Y - 8} width={W} height={8} fill="#00000022" />
      {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((x, i) => (
        <SeatAt key={x} x={x} z={1} kind="theater" color={i % 2 ? palette.accent : "#c8553d"} back={80} />
      ))}
      {/* мяч */}
      <circle cx={880} cy={1330} r={30} fill="#ffffff" />
      <path d="M880 1314 l14 10 l-6 16 h-16 l-6 -16 z" fill="#2b2b2b" />
    </>
  );
};

const Zoo = ({ palette }: BackdropProps) => {
  const sand = "#dcc38e";
  const bar = "#4f5562";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={palette.wall} />
      <Cloud x={720} y={480} s={0.5} color="#ffffffcc" />
      <g fill="#7fae62">
        {[0, 140, 280, 420, 560, 700, 840, 980].map((x, i) => <circle key={x} cx={x} cy={940 - (i % 2) * 30} r={100} />)}
      </g>
      {/* жираф за низким забором */}
      <g>
        <rect x={160} y={720} width={44} height={300} rx={20} fill="#e3b04b" transform="rotate(12 182 1000)" />
        <ellipse cx={190} cy={960} rx={110} ry={60} fill="#e3b04b" />
        <g transform="rotate(12 182 1000)">
          <ellipse cx={172} cy={700} rx={44} ry={28} fill="#e3b04b" />
          <rect x={150} y={658} width={8} height={26} rx={4} fill="#8a5a3a" />
          <rect x={174} y={656} width={8} height={26} rx={4} fill="#8a5a3a" />
          <circle cx={150} cy={696} r={5} fill="#2b1d14" />
          <ellipse cx={136} cy={712} rx={14} ry={10} fill="#d4a040" />
        </g>
        {[[150, 950], [230, 940], [200, 980], [120, 975], [195, 860], [205, 780]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={12} fill="#a8673f" />
        ))}
      </g>
      <rect x={0} y={990} width={W} height={H - 990} fill={sand} />
      <rect x={0} y={990} width={W} height={14} fill="#00000012" />
      {/* низкий деревянный забор */}
      <g fill="#a8774a">
        <rect x={0} y={1000} width={400} height={16} />
        <rect x={0} y={1040} width={400} height={16} />
        {[20, 110, 200, 290, 380].map((x) => <rect key={x} x={x} y={985} width={18} height={95} rx={4} />)}
      </g>
      {/* клетка со львом */}
      <rect x={600} y={640} width={480} height={460} fill="#00000014" />
      <rect x={590} y={1080} width={500} height={40} rx={6} fill="#9a8a6a" />
      <g>
        <ellipse cx={900} cy={1050} rx={120} ry={45} fill="#d79a3e" />
        <rect x={990} y={1000} width={70} height={14} rx={7} fill="#d79a3e" transform="rotate(-20 990 1000)" />
        <circle cx={790} cy={1000} r={70} fill="#9a5a2a" />
        <circle cx={790} cy={1008} r={44} fill="#e0aa4e" />
        <circle cx={776} cy={998} r={5} fill="#2b1d14" />
        <circle cx={804} cy={998} r={5} fill="#2b1d14" />
        <ellipse cx={790} cy={1020} rx={10} ry={7} fill="#5a3a2a" />
      </g>
      <rect x={590} y={630} width={500} height={24} rx={6} fill={bar} />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={610 + i * 42} y={650} width={10} height={440} fill={bar} />)}
      {/* табличка-лапка */}
      <rect x={496} y={1000} width={10} height={130} fill="#6b4429" />
      <rect x={446} y={940} width={110} height={80} rx={10} fill="#f2e6d0" />
      <g fill="#8a5a3a">
        <ellipse cx={501} cy={990} rx={16} ry={13} />
        <circle cx={482} cy={968} r={7} />
        <circle cx={496} cy={960} r={7} />
        <circle cx={510} cy={960} r={7} />
        <circle cx={522} cy={968} r={7} />
      </g>
    </>
  );
};

export const Ulitsa = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "park" ? (
      <Park palette={palette} />
    ) : variant === "cemetery" ? (
      <Cemetery />
    ) : variant === "stadium" ? (
      <Stadium palette={palette} />
    ) : variant === "zoo" ? (
      <Zoo palette={palette} />
    ) : (
      <Street palette={palette} />
    )}
  </Canvas>
);
