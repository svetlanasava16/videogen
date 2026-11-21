/**
 * Карта городка «Анекдотск» кодом: небеса сверху, деревня за рекой, кварталы, дорога и порт, ад под землёй.
 * Рисуется в координатах content/world/town.json; камера (viewBox) задаётся снаружи — для пролётов и заставки.
 * Стиль тот же: плоские формы без контуров, тёплая палитра.
 */
import type { Locale } from "@jf/core";
import { town, type Building } from "./town";
import { FONT } from "../fonts";

const W = town.size.w;
const H = town.size.h;
const RIVER = town.riverY;

const C = {
  sky: "#cfe3ef", cloud: "#ffffff", grass: "#8fbf6a", grass2: "#7fb05c", field: "#d9c27a", river: "#6fa8d6",
  road: "#8a8f99", roadLine: "#f2e6d0", wall: "#efe2c8", wall2: "#e6d3ad", roof: "#c8553d", roof2: "#8a5a3a",
  roof3: "#3d6fb3", gold: "#e0a030", ink: "#2b1d14", dark: "#3a2a20", hell: "#7a1f14", lava: "#e0602a", space: "#1f2a44",
};

const House = ({ w = 160, h = 110, wall = C.wall, roof = C.roof }: { w?: number; h?: number; wall?: string; roof?: string }) => (
  <g>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={wall} />
    <path d={`M${-w / 2 - 14} ${-h + 4} L0 ${-h - w * 0.42} L${w / 2 + 14} ${-h + 4} Z`} fill={roof} />
    <rect x={-w * 0.12} y={-h * 0.55} width={w * 0.24} height={h * 0.55} rx={3} fill={C.roof2} />
    <rect x={-w * 0.4} y={-h * 0.75} width={w * 0.18} height={h * 0.22} rx={3} fill="#9cc7e4" />
    <rect x={w * 0.22} y={-h * 0.75} width={w * 0.18} height={h * 0.22} rx={3} fill="#9cc7e4" />
  </g>
);

const Tree = ({ x, y, s = 1, pine = false }: { x: number; y: number; s?: number; pine?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-6} y={-30} width={12} height={30} fill={C.roof2} />
    {pine ? <path d="M0 -110 L38 -26 L-38 -26 Z" fill="#4f7d4a" /> : <circle cx={0} cy={-52} r={34} fill="#5f9a52" />}
  </g>
);

/** Иконка здания по типу; (0,0) — низ по центру. */
function Icon({ b }: { b: Building }) {
  switch (b.type) {
    case "home":
      return <g><g transform="translate(-70 0)"><House /></g><g transform="translate(90 0)"><House w={130} h={150} roof={C.roof3} /></g></g>;
    case "church":
      return (
        <g transform="scale(0.82)">
          <rect x={-70} y={-170} width={140} height={170} rx={6} fill={C.wall} />
          <path d="M-84 -166 L0 -250 L84 -166 Z" fill={C.roof3} />
          <rect x={-22} y={-330} width={44} height={90} fill={C.wall2} />
          <path d="M-30 -326 L0 -380 L30 -326 Z" fill={C.gold} />
          <rect x={-4} y={-420} width={8} height={44} fill={C.gold} /><rect x={-16} y={-408} width={32} height={8} fill={C.gold} />
          <path d="M-20 0 L-20 -60 Q0 -86 20 -60 L20 0 Z" fill={C.roof2} />
        </g>
      );
    case "school":
      return (
        <g>
          <rect x={-130} y={-150} width={260} height={150} rx={6} fill="#e8c9a0" />
          <rect x={-140} y={-170} width={280} height={24} fill={C.roof} />
          {[-90, -30, 30, 90].map((x) => <rect key={x} x={x - 18} y={-120} width={36} height={40} rx={3} fill="#9cc7e4" />)}
          <rect x={-20} y={-60} width={40} height={60} fill={C.roof2} />
          <rect x={-2} y={-240} width={4} height={70} fill={C.dark} /><rect x={2} y={-240} width={40} height={24} fill={C.roof} />
        </g>
      );
    case "bar":
      return (
        <g>
          <rect x={-110} y={-140} width={220} height={140} rx={6} fill={C.dark} />
          <rect x={-120} y={-158} width={240} height={22} fill={C.roof} />
          <rect x={-80} y={-110} width={60} height={50} rx={4} fill={C.gold} opacity={0.85} /><rect x={20} y={-110} width={60} height={50} rx={4} fill={C.gold} opacity={0.85} />
          <path d="M-14 -210 L14 -210 L6 -176 L-6 -176 Z" fill={C.gold} /><rect x={-2} y={-176} width={4} height={18} fill={C.gold} />
        </g>
      );
    case "shop":
      return (
        <g>
          <rect x={-110} y={-130} width={220} height={130} rx={6} fill={C.wall} />
          {[-110, -66, -22, 22, 66].map((x, i) => <path key={x} d={`M${x} -150 h44 v24 q-22 18 -44 0 z`} fill={i % 2 ? "#f2e6d0" : C.roof} />)}
          <rect x={-80} y={-100} width={110} height={70} rx={4} fill="#9cc7e4" /><rect x={45} y={-90} width={40} height={90} fill={C.roof2} />
        </g>
      );
    case "office":
      return (
        <g>
          <rect x={-90} y={-330} width={180} height={330} rx={6} fill="#9aa8b8" />
          {Array.from({ length: 6 }).flatMap((_, r) => [-55, 0, 55].map((x) => <rect key={`${r}-${x}`} x={x - 18} y={-305 + r * 48} width={36} height={30} rx={3} fill="#d6e6f2" />))}
        </g>
      );
    case "hospital":
      return (
        <g>
          <rect x={-130} y={-200} width={260} height={200} rx={6} fill="#f6f2e8" />
          <rect x={-30} y={-260} width={60} height={60} rx={8} fill="#f6f2e8" />
          <rect x={-8} y={-252} width={16} height={44} fill="#d24b4b" /><rect x={-22} y={-238} width={44} height={16} fill="#d24b4b" />
          {[-90, -40, 40, 90].map((x) => <rect key={x} x={x - 16} y={-160} width={32} height={34} rx={3} fill="#9cc7e4" />)}
          <rect x={-22} y={-70} width={44} height={70} fill="#9cc7e4" />
        </g>
      );
    case "park":
      return <g><ellipse cx={0} cy={-20} rx={170} ry={60} fill={C.grass2} /><Tree x={-100} y={-10} /><Tree x={-20} y={-40} s={1.2} /><Tree x={80} y={-5} /><rect x={20} y={-30} width={70} height={12} rx={4} fill={C.roof2} /></g>;
    case "square":
      return (
        <g>
          <g transform="translate(-110 0)"><House w={120} h={170} wall="#d98c5f" roof={C.roof2} /></g>
          <g transform="translate(20 0)"><House w={110} h={210} wall="#e8c9a0" roof={C.roof} /></g>
          <g transform="translate(140 0)"><House w={110} h={150} wall="#c9a46e" roof={C.roof2} /></g>
          <rect x={-6} y={-150} width={8} height={150} fill={C.dark} transform="translate(-200 0)" /><circle cx={-198} cy={-156} r={14} fill="#f5e6a8" />
        </g>
      );
    case "stadium":
      return <g><ellipse cx={0} cy={-50} rx={180} ry={80} fill="#c9cfd6" /><ellipse cx={0} cy={-50} rx={140} ry={56} fill={C.grass} /><rect x={-2} y={-100} width={4} height={100} fill="#fff" opacity={0.7} /><circle cx={0} cy={-50} r={18} fill="none" stroke="#fff" strokeWidth={4} opacity={0.7} /></g>;
    case "cemetery":
      return <g>{[-90, -30, 30, 90].map((x, i) => <path key={x} d={`M${x - 18} 0 v-50 q18 -24 36 0 v50 z`} fill="#a9afb5" transform={`translate(0 ${i % 2 ? -30 : 0})`} />)}<Tree x={130} y={0} s={0.9} /></g>;
    case "road":
      return <g><rect x={-60} y={-130} width={120} height={70} rx={20} fill="#f2b33d" /><rect x={-40} y={-118} width={80} height={30} rx={8} fill="#9cc7e4" /><circle cx={-34} cy={-56} r={16} fill={C.ink} /><circle cx={34} cy={-56} r={16} fill={C.ink} /></g>;
    case "airport":
      return (
        <g>
          <rect x={-170} y={-120} width={340} height={120} rx={8} fill="#c9cfd6" />
          <rect x={-150} y={-100} width={300} height={40} rx={4} fill="#9cc7e4" />
          <rect x={110} y={-260} width={30} height={140} fill="#9aa8b8" /><rect x={95} y={-290} width={60} height={34} rx={6} fill="#9cc7e4" />
          <path d="M-150 -220 l120 0 l30 -14 l10 0 l-14 14 l30 0 l0 10 l-56 0 l-40 28 l-14 0 l18 -28 l-84 0 z" fill="#f6f2e8" />
        </g>
      );
    case "port":
      return <g><rect x={-170} y={-20} width={340} height={20} fill={C.roof2} /><path d="M-110 -40 L110 -40 L90 0 L-90 0 Z" fill="#f6f2e8" /><rect x={-40} y={-110} width={80} height={70} rx={6} fill="#d24b4b" /><rect x={-10} y={-150} width={20} height={40} fill={C.ink} /></g>;
    case "farm":
      return <g><rect x={-200} y={-30} width={400} height={30} fill={C.field} /><rect x={-60} y={-170} width={120} height={150} fill="#b3261e" /><path d="M-76 -166 L0 -230 L76 -166 Z" fill="#7a1f14" /><path d="M-30 -20 L30 -90 M30 -20 L-30 -90" stroke="#f6f2e8" strokeWidth={8} /></g>;
    case "village":
      return <g><g transform="translate(-90 0)"><House w={120} h={90} wall="#c9a46e" roof={C.roof2} /></g><g transform="translate(70 10)"><House w={110} h={80} wall="#d9b98a" roof={C.roof} /></g><rect x={-200} y={-14} width={400} height={8} fill="#b08a5a" /></g>;
    case "garden":
      return <g><rect x={-130} y={-50} width={260} height={50} rx={10} fill="#8a6a44" />{[-90, -45, 0, 45, 90].map((x) => <circle key={x} cx={x} cy={-60} r={16} fill="#5f9a52" />)}<circle cx={110} cy={-110} r={22} fill="#f2b33d" /></g>;
    case "forest":
      return <g>{[-150, -90, -30, 30, 90, 150].map((x, i) => <Tree key={x} x={x} y={i % 2 ? -10 : 10} s={1.4} pine />)}</g>;
    case "mountain":
      return <g><path d="M-220 0 L-80 -260 L40 0 Z" fill="#9aa8b8" /><path d="M-60 0 L90 -330 L240 0 Z" fill="#8494a6" /><path d="M64 -270 L90 -330 L116 -270 Z" fill="#fff" /></g>;
    case "lake":
      return <g><ellipse cx={0} cy={-30} rx={190} ry={60} fill={C.river} /><path d="M-60 -40 l40 0" stroke="#fff" strokeWidth={4} opacity={0.6} /><rect x={90} y={-60} width={80} height={10} fill={C.roof2} /></g>;
    case "heaven":
      return (
        <g>
          <ellipse cx={0} cy={-10} rx={260} ry={60} fill={C.cloud} />
          <rect x={-110} y={-230} width={220} height={220} fill="none" />
          {[-90, -60, -30, 0, 30, 60, 90].map((x) => <rect key={x} x={x - 4} y={-200} width={8} height={190} fill={C.gold} />)}
          <path d="M-110 -200 Q0 -280 110 -200" fill="none" stroke={C.gold} strokeWidth={14} />
          <circle cx={0} cy={-120} r={140} fill="#fff6c8" opacity={0.25} />
        </g>
      );
    case "eden":
      return <g><ellipse cx={0} cy={-10} rx={220} ry={50} fill={C.cloud} /><ellipse cx={0} cy={-30} rx={150} ry={30} fill={C.grass} /><Tree x={10} y={-30} s={1.4} /><circle cx={-6} cy={-118} r={8} fill="#d24b4b" /><circle cx={22} cy={-98} r={8} fill="#d24b4b" /></g>;
    case "space":
      return <g><circle cx={0} cy={-90} r={70} fill="#e0a030" /><ellipse cx={0} cy={-90} rx={120} ry={22} fill="none" stroke="#f2d38a" strokeWidth={10} /><path d="M140 -40 l14 -60 l14 60 z" fill="#f6f2e8" /></g>;
    case "hell":
      return <g><path d="M-200 0 Q-180 -160 0 -180 Q180 -160 200 0 Z" fill="#a8321f" />{[-120, -40, 40, 120].map((x) => <path key={x} d={`M${x - 20} 0 q20 -90 40 0 z`} fill={C.lava} />)}<path d="M-30 -60 h60 v40 q-30 20 -60 0 z" fill={C.ink} /></g>;
    case "court":
      return (
        <g>
          <rect x={-120} y={-40} width={240} height={40} fill={C.wall2} />
          {[-90, -45, 0, 45, 90].map((x) => <rect key={x} x={x - 10} y={-170} width={20} height={130} fill={C.wall} />)}
          <rect x={-130} y={-190} width={260} height={24} fill={C.wall2} /><path d="M-140 -188 L0 -260 L140 -188 Z" fill={C.wall} />
        </g>
      );
    case "hall":
      return (
        <g>
          <rect x={-120} y={-190} width={240} height={190} rx={6} fill="#e8c9a0" />
          <rect x={-130} y={-206} width={260} height={22} fill={C.wall2} />
          <rect x={-90} y={-180} width={180} height={34} rx={4} fill="#b3261e" />
          {[-60, -20, 20, 60].map((x) => <rect key={x} x={x - 12} y={-172} width={24} height={14} rx={3} fill="#f2e6d0" />)}
          {[-95, -35, 35, 95].map((x) => <rect key={x} x={x - 10} y={-140} width={20} height={140} fill={C.wall} />)}
          <path d="M-20 0 V-70 Q0 -96 20 -70 V0 Z" fill={C.roof2} />
          <rect x={-2} y={-290} width={4} height={86} fill={C.dark} /><path d="M2 -290 h44 l-10 13 l10 13 h-44 z" fill="#b3261e" />
        </g>
      );
    case "banya":
      return <g><rect x={-80} y={-90} width={160} height={90} rx={6} fill="#a87a4a" />{[-70, -45, -20].map((y) => <rect key={y} x={-80} y={y} width={160} height={6} fill="#8a5a3a" />)}<path d="M-94 -86 L0 -140 L94 -86 Z" fill={C.roof2} /><circle cx={50} cy={-170} r={18} fill="#fff" opacity={0.8} /><circle cx={70} cy={-205} r={24} fill="#fff" opacity={0.7} /></g>;
    case "beach":
      return <g><ellipse cx={0} cy={-10} rx={130} ry={34} fill="#ecd9a5" /><rect x={-4} y={-150} width={8} height={140} fill={C.roof2} /><path d="M-80 -140 Q0 -210 80 -140 Z" fill="#d24b4b" /></g>;
    default:
      return <House />;
  }
}

/** Карта целиком; highlight — здание, к которому летим (подсветка). */
export const TownMap = ({ viewBox, locale, highlight, labels = true }: { viewBox: string; locale: Locale; highlight?: string; labels?: boolean }) => (
  <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
    {/* небо и облака небес */}
    <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={C.sky} />
    <rect x={-W} y={480} width={W * 3} height={RIVER - 480} fill={C.grass2} />
    <rect x={-W} y={RIVER + 60} width={W * 3} height={3200 - RIVER - 60} fill={C.grass} />
    <ellipse cx={W / 2} cy={480} rx={W} ry={80} fill={C.cloud} />
    {[[200, 120], [700, 80], [1350, 110], [1850, 70]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx={120} ry={40} fill={C.cloud} opacity={0.9} />)}
    <rect x={0} y={0} width={640} height={440} fill={C.space} rx={40} />
    {[[80, 60], [160, 180], [420, 90], [520, 300], [90, 340], [300, 390]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={5} fill="#fff" />)}
    {/* поля деревни */}
    <rect x={120} y={760} width={520} height={160} rx={30} fill={C.field} opacity={0.6} />
    {/* река и мост */}
    <path d={`M${-W} ${RIVER} C ${W * 0.3} ${RIVER - 60}, ${W * 0.7} ${RIVER + 80}, ${W * 2} ${RIVER}`} stroke={C.river} strokeWidth={90} fill="none" />
    <rect x={W / 2 - 70} y={RIVER - 60} width={140} height={120} fill={C.roof2} />
    {/* дороги */}
    {[1720, 2180, 2640].map((y) => <rect key={y} x={0} y={y} width={W} height={60} fill={C.road} />)}
    <rect x={W / 2 - 30} y={RIVER + 60} width={60} height={3000 - RIVER} fill={C.road} />
    {[1720, 2180, 2640].map((y) => Array.from({ length: 12 }).map((_, i) => <rect key={`${y}-${i}`} x={40 + i * 170} y={y + 27} width={80} height={6} fill={C.roadLine} />))}
    {/* подземелье */}
    <rect x={-W} y={3200} width={W * 3} height={H} fill={C.hell} />
    <path d={`M${-W} 3200 Q ${W / 2} 3150 ${W * 2} 3200`} fill={C.dark} />
    {/* деревья для уюта */}
    {[[150, 1480], [1900, 1500], [150, 1950], [1950, 2400], [700, 2800], [1300, 2820]].map(([x, y]) => <Tree key={`${x}${y}`} x={x} y={y} s={1.2} />)}
    {/* здания */}
    {town.buildings.map((b) => (
      <g key={b.id} transform={`translate(${b.x} ${b.y})`}>
        {highlight === b.id && <ellipse cx={0} cy={-6} rx={240} ry={70} fill="#fff6c8" opacity={0.55} />}
        <Icon b={b} />
        {labels && (
          <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44}
            fill={b.type === "hell" || b.type === "space" ? "#fff" : C.ink} stroke={b.type === "hell" || b.type === "space" ? C.ink : "#fff"} strokeWidth={10} paintOrder="stroke">
            {b.name[locale]}
          </text>
        )}
      </g>
    ))}
  </svg>
);

export const TOWN_W = W;
export const TOWN_H = H;
