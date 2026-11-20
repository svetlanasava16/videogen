import { Canvas, Room, Window, Shelf, HangingLamp, Table, Plant, W, FLOOR_Y, type BackdropProps } from "./parts";
import { mix, dark, light, Plinth, WOOD } from "./gostinaya";

const ENAMEL = "#f3efe6";

/** Старый пузатый холодильник. */
const Fridge = ({ x, w = 230, h = 600, accent }: { x: number; w?: number; h?: number; accent: string }) => {
  const y = FLOOR_Y - h;
  return (
    <g>
      <rect x={x + 14} y={y + 14} width={w} height={h - 14} rx={40} fill="#00000020" />
      <rect x={x} y={y} width={w} height={h - 16} rx={44} fill={ENAMEL} />
      <rect x={x} y={y + 170} width={w} height={8} fill={dark(ENAMEL, 0.12)} />
      <rect x={x + w - 34} y={y + 70} width={14} height={80} rx={7} fill="#b9b4aa" />
      <rect x={x + w - 34} y={y + 220} width={14} height={120} rx={7} fill="#b9b4aa" />
      <rect x={x + 40} y={y + 40} width={60} height={14} rx={7} fill="#c9c4ba" />
      <rect x={x + 18} y={FLOOR_Y - 18} width={30} height={18} fill="#5a5048" />
      <rect x={x + w - 48} y={FLOOR_Y - 18} width={30} height={18} fill="#5a5048" />
      {/* магнитики */}
      <circle cx={x + 60} cy={y + 250} r={14} fill="#c8553d" />
      <rect x={x + 96} y={y + 232} width={26} height={30} rx={5} fill={accent} />
      <circle cx={x + 80} cy={y + 300} r={12} fill="#e0b030" />
      <rect x={x + 48} y={y + 330} width={70} height={84} rx={4} fill="#ffffff" transform={`rotate(-6 ${x + 83} ${y + 372})`} />
      {/* радиоприёмник сверху */}
      <rect x={x + 40} y={y - 70} width={140} height={74} rx={14} fill={WOOD} />
      <rect x={x + 54} y={y - 56} width={70} height={46} rx={8} fill={dark(WOOD, 0.25)} />
      <circle cx={x + 152} cy={y - 34} r={12} fill="#e0b030" />
    </g>
  );
};

/** Плита с чайником. */
const Stove = ({ x, w = 230, h = 300, accent }: { x: number; w?: number; h?: number; accent: string }) => {
  const y = FLOOR_Y - h;
  const kettle = dark(accent, 0.1);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h - 14} rx={14} fill={ENAMEL} />
      <rect x={x} y={y} width={w} height={22} rx={8} fill="#5a5048" />
      {[0, 1, 2, 3].map((k) => <circle key={k} cx={x + 40 + k * 50} cy={y + 52} r={11} fill="#5a5048" />)}
      <rect x={x + 22} y={y + 86} width={w - 44} height={h - 130} rx={12} fill={dark(ENAMEL, 0.1)} />
      <rect x={x + 46} y={y + 116} width={w - 92} height={90} rx={10} fill="#4a4038" />
      <rect x={x + 40} y={y + 92} width={w - 80} height={10} rx={5} fill="#b9b4aa" />
      <rect x={x + 14} y={FLOOR_Y - 14} width={w - 28} height={14} fill="#5a5048" />
      {/* чайник */}
      <path d={`M${x + 70} ${y} Q${x + 60} ${y - 110} ${x + 115} ${y - 110} Q${x + 170} ${y - 110} ${x + 160} ${y} Z`} fill={kettle} />
      <path d={`M${x + 156} ${y - 50} L${x + 200} ${y - 92} L${x + 206} ${y - 82} L${x + 162} ${y - 30} Z`} fill={kettle} />
      <path d={`M${x + 82} ${y - 106} Q${x + 115} ${y - 160} ${x + 148} ${y - 106}`} stroke="#3a3a3a" strokeWidth={7} fill="none" />
      <circle cx={x + 115} cy={y - 114} r={9} fill="#3a3a3a" />
      <circle cx={x + 98} cy={y - 60} r={10} fill={light(kettle, 0.5)} />
    </g>
  );
};

const Cup = ({ x, color }: { x: number; color: string }) => {
  const y = FLOOR_Y - 252;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={34} ry={8} fill="#ffffff" />
      <path d={`M${x - 22} ${y - 46} L${x + 22} ${y - 46} L${x + 18} ${y - 4} L${x - 18} ${y - 4} Z`} fill={color} />
      <path d={`M${x + 20} ${y - 38} q20 4 14 22 q-4 8 -16 8`} stroke={color} strokeWidth={7} fill="none" />
    </g>
  );
};

/** Кухня: стол с чаем, холодильник, плита, окно с занавесками. */
export const Kukhnya = ({ palette: p }: BackdropProps) => {
  const lower = mix(p.wall, p.accent, 0.45);
  const curtain = light(p.accent, 0.55);
  const cloth = light(p.accent, 0.7);
  return (
    <Canvas>
      <Room wall={p.wall} floor={p.floor} />
      {/* панель масляной краской */}
      <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={lower} />
      <rect x={0} y={872} width={W} height={14} fill={dark(lower, 0.15)} />
      <Plinth color={dark(lower, 0.35)} />
      <HangingLamp x={540} len={40} color="#e0a030" />
      {/* окно, занавески, подоконник */}
      <Window x={400} y={450} w={280} h={300} frame="#f7f2e8" />
      <rect x={350} y={432} width={380} height={12} rx={6} fill={WOOD} />
      <path d="M360 440 L440 440 Q430 600 452 770 L360 770 Z" fill={curtain} />
      <path d="M720 440 L640 440 Q650 600 628 770 L720 770 Z" fill={curtain} />
      <rect x={376} y={746} width={328} height={20} rx={6} fill="#f7f2e8" />
      <Plant x={455} y={746} scale={0.42} pot="#c8553d" leaf={p.accent} />
      <rect x={600} y={700} width={36} height={46} rx={8} fill="#e0b030" opacity={0.85} />
      {/* часы */}
      <circle cx={145} cy={520} r={50} fill={WOOD} />
      <circle cx={145} cy={520} r={38} fill="#f7f2e8" />
      <rect x={142} y={492} width={6} height={30} rx={3} fill="#3a3a3a" />
      <rect x={145} y={517} width={24} height={6} rx={3} fill="#3a3a3a" />
      {/* кафель за плитой и полка */}
      {Array.from({ length: 3 }).flatMap((_, r) =>
        Array.from({ length: 5 }).map((__, c) => <rect key={`${r}-${c}`} x={806 + c * 56} y={706 + r * 56} width={50} height={50} rx={4} fill={light(p.wall, 0.55)} />),
      )}
      <Shelf x={800} y={640} w={270} color={WOOD} items={["#c8553d", "#e0b030", p.accent, "#c8553d"]} />
      <Fridge x={30} accent={p.accent} />
      <Stove x={830} accent={p.accent} />
      {/* стол с клеёнкой и чаем */}
      <Table x={370} w={340} h={250} top={WOOD} legs={dark(WOOD, 0.2)} />
      <rect x={350} y={FLOOR_Y - 254} width={380} height={86} rx={10} fill={cloth} />
      {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={370 + k * 62} y={FLOOR_Y - 254} width={22} height={86} fill={light(p.accent, 0.45)} />)}
      <Cup x={420} color="#ffffff" />
      <Cup x={660} color="#ffffff" />
      <circle cx={420} cy={FLOOR_Y - 280} r={10} fill="#c8553d" />
      <circle cx={660} cy={FLOOR_Y - 280} r={10} fill="#c8553d" />
      {/* заварочный чайник */}
      <ellipse cx={540} cy={FLOOR_Y - 300} rx={56} ry={50} fill="#ffffff" />
      <path d="M588 900 Q622 884 632 850 L644 856 Q636 892 596 914 Z" fill="#ffffff" />
      <ellipse cx={540} cy={FLOOR_Y - 346} rx={30} ry={10} fill="#e9e4da" />
      <circle cx={540} cy={FLOOR_Y - 358} r={9} fill="#c8553d" />
      <circle cx={522} cy={FLOOR_Y - 300} r={12} fill="#c8553d" />
      <circle cx={556} cy={FLOOR_Y - 290} r={9} fill="#c8553d" />
    </Canvas>
  );
};
