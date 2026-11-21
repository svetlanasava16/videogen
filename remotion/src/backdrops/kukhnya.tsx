import { Canvas, Room, Table, W, H, FLOOR_Y, type BackdropProps } from "./parts";
import {
  mix, dark, light, WOOD, SeatAt,
  VShade, Glow, Ceiling, Skirting, FloorTiles, FloorShadow, WindowView, Curtains, WallClock, Calendar, PotPlant, Outlet, CeilingLamp,
} from "./gostinaya";

const ENAMEL = "#f3efe6";

/** Старый пузатый холодильник: магниты, записка, детский рисунок, радио сверху. */
const Fridge = ({ x, w = 230, h = 600, accent }: { x: number; w?: number; h?: number; accent: string }) => {
  const y = FLOOR_Y - h;
  return (
    <g>
      <FloorShadow cx={x + w / 2} w={w + 30} />
      <rect x={x + 14} y={y + 14} width={w} height={h - 14} rx={40} fill="#00000020" />
      <rect x={x} y={y} width={w} height={h - 16} rx={44} fill={ENAMEL} />
      <rect x={x + w - 40} y={y + 10} width={30} height={h - 40} rx={14} fill={dark(ENAMEL, 0.04)} />
      <rect x={x} y={y + 170} width={w} height={8} fill={dark(ENAMEL, 0.12)} />
      <rect x={x + w - 34} y={y + 70} width={14} height={80} rx={7} fill="#b9b4aa" />
      <rect x={x + w - 34} y={y + 220} width={14} height={120} rx={7} fill="#b9b4aa" />
      <rect x={x + 40} y={y + 40} width={60} height={14} rx={7} fill="#c9c4ba" />
      <text x={x + 70} y={y + 90} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontStyle="italic" fontWeight={800} fontSize={24} fill="#b9b4aa">ЗиЛ</text>
      <rect x={x + 18} y={FLOOR_Y - 18} width={30} height={18} fill="#5a5048" />
      <rect x={x + w - 48} y={FLOOR_Y - 18} width={30} height={18} fill="#5a5048" />
      {/* магнитики, записка, рисунок */}
      <circle cx={x + 60} cy={y + 250} r={14} fill="#c8553d" />
      <rect x={x + 96} y={y + 232} width={26} height={30} rx={5} fill={accent} />
      <circle cx={x + 80} cy={y + 300} r={12} fill="#e0b030" />
      <path d={`M${x + 140} ${y + 240} l14 -14 l14 14 l-14 14 Z`} fill="#4a6fa5" />
      <rect x={x + 48} y={y + 330} width={70} height={84} rx={4} fill="#ffffff" transform={`rotate(-6 ${x + 83} ${y + 372})`} />
      <g transform={`rotate(-6 ${x + 83} ${y + 372})`}>
        <circle cx={x + 96} cy={y + 350} r={10} fill="#e0b030" />
        <path d={`M${x + 58} ${y + 404} q12 -30 24 0 q12 -30 24 0`} stroke="#5b8c5a" strokeWidth={4} fill="none" />
        <rect x={x + 60} y={y + 360} width={20} height={20} fill="#c8553d" />
        <path d={`M${x + 56} ${y + 362} l14 -14 l14 14 Z`} fill="#4a6fa5" />
      </g>
      <circle cx={x + 83} cy={y + 330} r={7} fill="#c8553d" />
      <rect x={x + 130} y={y + 300} width={50} height={60} rx={3} fill="#fff6b0" transform={`rotate(5 ${x + 155} ${y + 330})`} />
      {[0, 1, 2].map((i) => <rect key={i} x={x + 138} y={y + 314 + i * 12} width={32 - i * 6} height={4} rx={2} fill="#8a8070" transform={`rotate(5 ${x + 155} ${y + 330})`} />)}
      {/* радиоприёмник и хлебница сверху */}
      <rect x={x + 30} y={y - 70} width={140} height={74} rx={14} fill={WOOD} />
      <rect x={x + 44} y={y - 56} width={70} height={46} rx={8} fill={dark(WOOD, 0.25)} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={x + 48} y={y - 50 + i * 10} width={62} height={4} fill={dark(WOOD, 0.4)} />)}
      <circle cx={x + 142} cy={y - 34} r={12} fill="#e0b030" />
      <path d={`M${x + 140} ${y - 70} l30 -60`} stroke="#5a5048" strokeWidth={4} />
    </g>
  );
};

/** Плита с чайником, кастрюлей и полотенцем на ручке духовки. */
const Stove = ({ x, w = 230, h = 300, accent }: { x: number; w?: number; h?: number; accent: string }) => {
  const y = FLOOR_Y - h;
  const kettle = dark(accent, 0.1);
  return (
    <g>
      <FloorShadow cx={x + w / 2} w={w + 30} />
      <rect x={x} y={y} width={w} height={h - 14} rx={14} fill={ENAMEL} />
      <rect x={x} y={y} width={w} height={22} rx={8} fill="#5a5048" />
      {[0, 1, 2, 3].map((k) => <circle key={k} cx={x + 40 + k * 50} cy={y + 52} r={11} fill="#5a5048" />)}
      <rect x={x + 22} y={y + 86} width={w - 44} height={h - 130} rx={12} fill={dark(ENAMEL, 0.1)} />
      <rect x={x + 46} y={y + 116} width={w - 92} height={90} rx={10} fill="#4a4038" />
      <Glow cx={x + w / 2} cy={y + 160} r={50} color="#ffb060" opacity={0.35} />
      <rect x={x + 40} y={y + 92} width={w - 80} height={10} rx={5} fill="#b9b4aa" />
      {/* полотенце на ручке */}
      <path d={`M${x + 70} ${y + 96} h60 v90 l-10 10 h-40 l-10 -10 Z`} fill="#f2ead8" />
      {[0, 1, 2].map((i) => <rect key={i} x={x + 70} y={y + 130 + i * 18} width={60} height={7} fill="#c8553d" />)}
      <rect x={x + 14} y={FLOOR_Y - 14} width={w - 28} height={14} fill="#5a5048" />
      {/* кастрюля с паром на заднем плане */}
      <rect x={x + 140} y={y - 64} width={76} height={64} rx={10} fill="#c9ccd4" />
      <rect x={x + 134} y={y - 72} width={88} height={12} rx={6} fill="#a9adb6" />
      <circle cx={x + 178} cy={y - 80} r={7} fill="#5a5048" />
      <path d={`M${x + 160} ${y - 100} q-14 -24 0 -44 q14 -20 0 -40 M${x + 196} ${y - 104} q-12 -20 0 -38`} stroke="#ffffff" strokeWidth={8} fill="none" opacity={0.5} strokeLinecap="round" />
      {/* чайник */}
      <path d={`M${x + 30} ${y} Q${x + 20} ${y - 110} ${x + 75} ${y - 110} Q${x + 130} ${y - 110} ${x + 120} ${y} Z`} fill={kettle} />
      <path d={`M${x + 116} ${y - 50} L${x + 160} ${y - 92} L${x + 166} ${y - 82} L${x + 122} ${y - 30} Z`} fill={kettle} />
      <path d={`M${x + 42} ${y - 106} Q${x + 75} ${y - 160} ${x + 108} ${y - 106}`} stroke="#3a3a3a" strokeWidth={7} fill="none" />
      <circle cx={x + 75} cy={y - 114} r={9} fill="#3a3a3a" />
      <circle cx={x + 58} cy={y - 60} r={10} fill={light(kettle, 0.5)} />
      <circle cx={x + 82} cy={y - 44} r={8} fill={light(kettle, 0.5)} />
    </g>
  );
};

const Cup = ({ x, color }: { x: number; color: string }) => {
  const y = FLOOR_Y - 254;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={34} ry={8} fill="#ffffff" />
      <path d={`M${x - 22} ${y - 46} L${x + 22} ${y - 46} L${x + 18} ${y - 4} L${x - 18} ${y - 4} Z`} fill={color} />
      <path d={`M${x + 20} ${y - 38} q20 4 14 22 q-4 8 -16 8`} stroke={color} strokeWidth={7} fill="none" />
    </g>
  );
};

/** Навесной шкафчик со стеклянными дверцами и посудой. */
const WallCabinet = ({ x, y, w, h, accent }: { x: number; y: number; w: number; h: number; accent: string }) => (
  <g>
    <rect x={x + 10} y={y + 12} width={w} height={h} rx={6} fill="#00000020" />
    <rect x={x} y={y} width={w} height={h} rx={6} fill={ENAMEL} />
    <rect x={x + 14} y={y + 14} width={w / 2 - 20} height={h - 28} rx={4} fill="#d6e6ea" />
    <rect x={x + w / 2 + 6} y={y + 14} width={w / 2 - 20} height={h - 28} rx={4} fill="#d6e6ea" />
    <rect x={x + 14} y={y + h / 2 - 3} width={w - 28} height={6} fill={dark(ENAMEL, 0.12)} />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <path d={`M${x + 30 + i * 36} ${y + h / 2 - 3} h28 l-3 -30 h-22 Z`} fill={i === 1 ? accent : "#ffffff"} />
        <ellipse cx={x + w / 2 + 40 + i * 30} cy={y + h / 2 - 22} rx={12} ry={20} fill={i === 1 ? "#c8553d" : "#f6f1e6"} />
      </g>
    ))}
    {[0, 1, 2, 3].map((i) => <rect key={i} x={x + 28 + i * 54} y={y + h - 54} width={34} height={40} rx={6} fill={["#e0b030", "#c8553d", "#f6f1e6", accent][i]} />)}
    {[0, 1, 2, 3].map((i) => <rect key={i} x={x + 26 + i * 54} y={y + h - 60} width={38} height={10} rx={4} fill="#f6f1e6" />)}
    <rect x={x + w / 2 - 14} y={y + h / 2 + 20} width={8} height={30} rx={4} fill="#b9b4aa" />
    <rect x={x + w / 2 + 6} y={y + h / 2 + 20} width={8} height={30} rx={4} fill="#b9b4aa" />
  </g>
);

/** Кухня: дверной проём слева (door), холодильник, стол с чаем у окна и две табуретки по бокам (stool-1, stool-2), плита справа. */
export const Kukhnya = ({ palette: p }: BackdropProps) => {
  const lower = mix(p.wall, p.accent, 0.45);
  const curtain = light(p.accent, 0.55);
  const cloth = light(p.accent, 0.7);
  const tile = light(p.wall, 0.55);
  return (
    <Canvas>
      <Room wall={p.wall} floor={p.floor} />
      <VShade y={0} h={700} from={0.14} to={0} />
      <Ceiling color={light(p.wall, 0.35)} h={70} />
      {/* линолеум «под плитку» */}
      <FloorTiles a={p.floor} b={light(p.floor, 0.08)} step={104} d={0.09} grout={dark(p.floor, 0.08)} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.28} />
      {/* панель масляной краской */}
      <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={lower} />
      <rect x={0} y={872} width={W} height={14} fill={dark(lower, 0.15)} />
      <Skirting color={dark(lower, 0.35)} h={24} />
      <CeilingLamp x={540} y={87} len={40} kind="dish" color={light(p.accent, 0.35)} r={320} o={0.3} />
      {/* окно во двор, тюль, занавески на подхватах, подоконник с цветами и банкой */}
      <WindowView x={400} y={450} w={280} h={300} frame="#f7f2e8" sill={false} />
      <Curtains x0={372} x1={708} y={440} h={330} color={curtain} tie={p.accent} rod={WOOD} part={0.26} />
      <rect x={376} y={746} width={328} height={20} rx={6} fill="#f7f2e8" />
      <rect x={376} y={766} width={328} height={8} fill="#00000018" />
      <PotPlant x={455} y={748} s={0.55} pot="#c8553d" leaf={p.accent} flower="#e0b030" />
      <rect x={580} y={676} width={56} height={72} rx={12} fill="#cfe2ea" opacity={0.85} />
      <rect x={584} y={700} width={48} height={44} rx={8} fill="#d9a35a" opacity={0.85} />
      <rect x={578} y={668} width={60} height={12} rx={4} fill="#f2ead8" />
      <rect x={650} y={716} width={26} height={32} rx={6} fill="#ffffff" />
      <path d="M656 716 q8 -26 2 -40 M666 716 q6 -24 12 -34" stroke={p.accent} strokeWidth={4} fill="none" />
      {/* часы и календарь */}
      <WallClock x={145} y={520} r={50} frame={WOOD} t={0.6} />
      <Calendar x={726} y={480} accent="#c8553d" />
      {/* кафель за плитой, навесной шкафчик, рейлинг с половником */}
      <rect x={800} y={700} width={280} height={180} fill={dark(tile, 0.06)} />
      {Array.from({ length: 3 }).flatMap((_, r) =>
        Array.from({ length: 5 }).map((__, c) => <rect key={`${r}-${c}`} x={806 + c * 56} y={706 + r * 56} width={50} height={50} rx={4} fill={(r + c) % 4 === 1 ? light(p.accent, 0.6) : tile} />),
      )}
      <WallCabinet x={826} y={450} w={244} h={200} accent={p.accent} />
      <rect x={820} y={676} width={250} height={8} rx={4} fill="#b9b4aa" />
      {[860, 900, 940, 990].map((x, i) => <rect key={x} x={x - 2} y={676} width={4} height={18} fill="#8a8a8a" />)}
      <path d="M858 694 v60 q0 20 -16 20 q-16 0 -16 -14" stroke="#9aa1a6" strokeWidth={6} fill="none" />
      <rect x={894} y={694} width={12} height={46} rx={4} fill={WOOD} />
      <rect x={888} y={738} width={24} height={30} rx={4} fill="#5a5048" />
      <circle cx={940} cy={736} r={28} fill="#9aa1a6" />
      <circle cx={940} cy={736} r={8} fill="#5a5048" />
      <path d={`M990 694 q-10 30 0 50 q10 20 0 40`} stroke="#e8d8a8" strokeWidth={10} fill="none" />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={990 + (i % 2 ? 6 : -6)} cy={712 + i * 20} r={10} fill="#f2e6c8" />)}
      <Outlet x={770} y={1010} />
      {/* дверной проём в коридор: наличник, свет из коридора, вешалка */}
      <rect x={0} y={FLOOR_Y - 556} width={168} height={556} fill={light(p.wall, 0.4)} />
      <rect x={0} y={FLOOR_Y - 536} width={146} height={536} fill={dark(p.wall, 0.42)} />
      <Glow cx={60} cy={FLOOR_Y - 420} r={140} color="#ffe9b0" opacity={0.35} />
      <rect x={0} y={FLOOR_Y - 536} width={146} height={536} fill={dark(p.floor, 0.2)} opacity={0.3} />
      <rect x={20} y={FLOOR_Y - 420} width={60} height={90} rx={6} fill={dark(p.wall, 0.3)} />
      <rect x={28} y={FLOOR_Y - 412} width={44} height={74} rx={4} fill={dark(p.wall, 0.15)} />
      <rect x={0} y={FLOOR_Y - 40} width={146} height={40} fill={dark(p.floor, 0.35)} />
      <Fridge x={170} w={210} accent={p.accent} />
      <Stove x={830} accent={p.accent} />
      {/* стол с клеёнкой в клетку и чаем, табуретки по бокам */}
      <FloorShadow cx={590} w={240} />
      <Table x={480} w={220} h={250} top={WOOD} legs={dark(WOOD, 0.2)} />
      <rect x={462} y={FLOOR_Y - 254} width={256} height={86} rx={10} fill={cloth} />
      {[0, 1, 2, 3].map((k) => <rect key={k} x={480 + k * 62} y={FLOOR_Y - 254} width={22} height={86} fill={light(p.accent, 0.45)} />)}
      {[0, 1, 2].map((k) => <rect key={`h${k}`} x={462} y={FLOOR_Y - 236 + k * 26} width={256} height={10} fill={light(p.accent, 0.45)} opacity={0.6} />)}
      <SeatAt x={0.395} z={1} kind="stool" color={dark(p.accent, 0.15)} />
      <SeatAt x={0.705} z={1} kind="stool" color={dark(p.accent, 0.15)} />
      <g transform="translate(50 0)">
        <Cup x={450} color="#ffffff" />
        <Cup x={630} color="#ffffff" />
        <circle cx={450} cy={FLOOR_Y - 280} r={10} fill="#c8553d" />
        <circle cx={630} cy={FLOOR_Y - 280} r={10} fill="#c8553d" />
        {/* заварочный чайник */}
        <ellipse cx={540} cy={FLOOR_Y - 300} rx={50} ry={46} fill="#ffffff" />
        <path d="M582 900 Q616 884 626 850 L638 856 Q630 892 590 914 Z" fill="#ffffff" />
        <ellipse cx={540} cy={FLOOR_Y - 342} rx={28} ry={10} fill="#e9e4da" />
        <circle cx={540} cy={FLOOR_Y - 354} r={9} fill="#c8553d" />
        <circle cx={522} cy={FLOOR_Y - 300} r={12} fill="#c8553d" />
        <circle cx={556} cy={FLOOR_Y - 290} r={9} fill="#c8553d" />
      </g>
    </Canvas>
  );
};
