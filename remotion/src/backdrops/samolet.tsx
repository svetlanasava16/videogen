import { Canvas, Room, Cloud, FLOOR_Y, W, H, type BackdropProps } from "./parts";

/** Фон «samolet»: салон самолёта (вид вдоль прохода); варианты train, ship, airport/train-station. */

const rgb = (c: string) => {
  const h = c.replace("#", "");
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
};
const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const dark = (c: string, t: number) => mix(c, "#000000", t);
const light = (c: string, t: number) => mix(c, "#ffffff", t);

const WHITE = "#f4f1ea";
const WOOD = "#b48a5e";
const INK = "#2b2a2e";
const RED = "#c8553d";
const SKY = "#bfe0f2";

type P = { wall: string; floor: string; accent: string };

// ---------- самолёт: простая перспектива к точке схода ----------
const VX = 540;
const VY = 720;
const pt = (X: number, Y: number, s: number) => `${VX + X * s},${VY + Y * s}`;
const poly = (pts: [number, number, number][]) => pts.map(([X, Y, s]) => pt(X, Y, s)).join(" ");
const NEAR = 3;
const FAR = 0.32;
const WX = 600; // стены
const CY = -560; // потолок
const FY = 520; // пол

const Seat = ({ X0, X1, s, color }: { X0: number; X1: number; s: number; color: string }) => {
  const x0 = VX + X0 * s;
  const x1 = VX + X1 * s;
  const top = VY + 110 * s;
  const bot = VY + FY * s;
  const w = x1 - x0;
  return (
    <g>
      <rect x={x0} y={top} width={w} height={bot - top} rx={34 * s} fill={color} />
      <rect x={x0 + 22 * s} y={top + 14 * s} width={w - 44 * s} height={70 * s} rx={14 * s} fill={WHITE} />
      <rect x={x0 + 30 * s} y={top + 180 * s} width={w - 60 * s} height={60 * s} rx={10 * s} fill={dark(color, 0.18)} />
    </g>
  );
};

const Plane = ({ wall, floor, accent }: P) => {
  const ceil = light(wall, 0.45);
  const binFront = light(wall, 0.6);
  const binBottom = dark(wall, 0.12);
  const seatColor = mix(accent, wall, 0.1);
  const rows = [0.36, 0.42, 0.5, 0.6, 0.73, 0.9];
  const windows = [0.38, 0.46, 0.55, 0.66, 0.8];
  const doors = [0.4, 0.5, 0.64];
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      {/* потолок, пол, задняя стена */}
      <polygon points={poly([[-WX, CY, NEAR], [WX, CY, NEAR], [WX, CY, FAR], [-WX, CY, FAR]])} fill={ceil} />
      <polygon points={poly([[-90, CY, NEAR], [90, CY, NEAR], [90, CY, FAR], [-90, CY, FAR]])} fill={light(ceil, 0.4)} />
      <polygon points={poly([[-WX, FY, NEAR], [WX, FY, NEAR], [WX, FY, FAR], [-WX, FY, FAR]])} fill={floor} />
      <polygon points={poly([[-170, FY, NEAR], [170, FY, NEAR], [170, FY, FAR], [-170, FY, FAR]])} fill={dark(accent, 0.25)} />
      <polygon points={poly([[-WX, CY, FAR], [WX, CY, FAR], [WX, FY, FAR], [-WX, FY, FAR]])} fill={light(wall, 0.25)} />
      {/* шторка в хвост и табличка выхода (без букв) */}
      <polygon points={poly([[-210, -330, FAR], [210, -330, FAR], [210, FY, FAR], [-210, FY, FAR]])} fill={accent} />
      {[-140, -70, 0, 70, 140].map((X) => (
        <polygon key={X} points={poly([[X - 12, -330, FAR], [X + 12, -330, FAR], [X + 12, FY, FAR], [X - 12, FY, FAR]])} fill={dark(accent, 0.15)} />
      ))}
      <polygon points={poly([[-90, -460, FAR], [90, -460, FAR], [90, -380, FAR], [-90, -380, FAR]])} fill="#3fae6a" />
      {/* иллюминаторы */}
      {[-1, 1].map((side) =>
        windows.map((s) => (
          <g key={`${side}${s}`}>
            <ellipse cx={VX + side * WX * s} cy={VY - 150 * s} rx={30 * s} ry={78 * s} fill={light(wall, 0.6)} />
            <ellipse cx={VX + side * WX * s} cy={VY - 150 * s} rx={19 * s} ry={60 * s} fill={SKY} />
          </g>
        )),
      )}
      {/* багажные полки */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <polygon points={poly([[side * WX, -330, NEAR], [side * 320, -330, NEAR], [side * 320, -330, FAR], [side * WX, -330, FAR]])} fill={binBottom} />
          <polygon points={poly([[side * 320, CY, NEAR], [side * 320, -330, NEAR], [side * 320, -330, FAR], [side * 320, CY, FAR]])} fill={binFront} />
          {doors.map((s) => (
            <line key={s} x1={VX + side * 320 * s} y1={VY + CY * s} x2={VX + side * 320 * s} y2={VY - 330 * s} stroke={dark(binFront, 0.15)} strokeWidth={5 * s} />
          ))}
          <polygon points={poly([[side * 320, -360, NEAR], [side * 320, -330, NEAR], [side * 320, -330, FAR], [side * 320, -360, FAR]])} fill={dark(binFront, 0.1)} />
        </g>
      ))}
      {/* ряды кресел: от дальних к ближним */}
      {rows.map((s) => (
        <g key={s}>
          <Seat X0={-585} X1={-382} s={s} color={seatColor} />
          <Seat X0={-372} X1={-180} s={s} color={seatColor} />
          <Seat X0={180} X1={372} s={s} color={seatColor} />
          <Seat X0={382} X1={585} s={s} color={seatColor} />
        </g>
      ))}
    </>
  );
};

// ---------- поезд: купе ----------
const Bunk = ({ x, w, y, accent, flip = false }: { x: number; w: number; y: number; accent: string; flip?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={26} rx={8} fill={dark(WOOD, 0.15)} />
    {/* свёрнутый матрас в полоску и подушка */}
    <rect x={flip ? x + 20 : x + w - 190} y={y - 70} width={170} height={70} rx={34} fill="#e6e1d6" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={(flip ? x + 20 : x + w - 190) + 26 + i * 36} y={y - 70} width={12} height={70} fill={light(accent, 0.45)} />
    ))}
    <rect x={flip ? x + w - 110 : x + 20} y={y - 44} width={90} height={44} rx={18} fill={WHITE} />
  </g>
);

const Sofa = ({ x, w, accent }: { x: number; w: number; accent: string }) => (
  <g>
    <rect x={x} y={FLOOR_Y - 400} width={w} height={230} rx={22} fill={dark(accent, 0.08)} />
    <rect x={x} y={FLOOR_Y - 190} width={w} height={60} rx={20} fill={accent} />
    <rect x={x} y={FLOOR_Y - 140} width={w} height={140} fill={dark(WOOD, 0.25)} />
    <rect x={x + 20} y={FLOOR_Y - 380} width={w - 40} height={12} rx={6} fill={light(accent, 0.25)} />
  </g>
);

const Train = ({ wall, floor, accent }: P) => {
  const panel = mix(WOOD, wall, 0.35);
  return (
    <>
      <Room wall={wall} floor={dark(floor, 0.1)} />
      <rect x={0} y={760} width={W} height={FLOOR_Y - 760} fill={panel} />
      {/* окно с пейзажем */}
      <defs>
        <clipPath id="samolet-train-win">
          <rect x={336} y={446} width={408} height={268} rx={24} />
        </clipPath>
      </defs>
      <rect x={320} y={430} width={440} height={300} rx={32} fill={light(wall, 0.5)} />
      <g clipPath="url(#samolet-train-win)">
        <rect x={336} y={446} width={408} height={268} fill={SKY} />
        <ellipse cx={420} cy={720} rx={200} ry={110} fill="#8fbf7a" />
        <ellipse cx={680} cy={730} rx={220} ry={90} fill="#6fa765" />
        <rect x={600} y={560} width={6} height={110} fill="#6b4429" />
        <rect x={586} y={572} width={34} height={6} fill="#6b4429" />
        <Cloud x={420} y={520} s={0.35} />
      </g>
      <rect x={320} y={598} width={440} height={12} fill={light(wall, 0.5)} />
      {/* занавески */}
      <path d="M300 420 H380 Q350 560 372 700 Q340 720 300 700 Z" fill={accent} />
      <path d="M780 420 H700 Q730 560 708 700 Q740 720 780 700 Z" fill={accent} />
      <rect x={290} y={414} width={500} height={12} rx={6} fill={dark(WOOD, 0.2)} />
      {/* столик: стакан в подстаканнике */}
      <rect x={430} y={770} width={220} height={20} rx={6} fill={WOOD} />
      <path d="M470 790 L540 840 L610 790 Z" fill={dark(WOOD, 0.2)} />
      <rect x={480} y={714} width={40} height={56} rx={6} fill="#c98b4a" opacity={0.85} />
      <rect x={476} y={736} width={48} height={34} rx={6} fill="#b7a27a" />
      <path d="M524 744 q16 4 0 20" stroke="#b7a27a" strokeWidth={6} fill="none" />
      <rect x={506} y={700} width={4} height={40} fill="#d8d8d8" />
      <ellipse cx={590} cy={768} rx={40} ry={8} fill={WHITE} />
      {/* полки и диваны по бокам */}
      <Sofa x={0} w={260} accent={accent} />
      <Sofa x={820} w={260} accent={accent} />
      <Bunk x={0} w={270} y={540} accent={accent} />
      <Bunk x={810} w={270} y={540} accent={accent} flip />
      <rect x={250} y={566} width={14} height={60} fill={dark(WOOD, 0.3)} />
      <rect x={816} y={566} width={14} height={60} fill={dark(WOOD, 0.3)} />
      {/* дорожка на полу */}
      <rect x={300} y={FLOOR_Y} width={480} height={H - FLOOR_Y} fill={dark(accent, 0.3)} />
      <rect x={330} y={FLOOR_Y} width={420} height={H - FLOOR_Y} fill={dark(accent, 0.15)} />
    </>
  );
};

// ---------- корабль: палуба с леером и море ----------
const Ship = ({ floor, accent }: P) => {
  const sky = light(accent, 0.62);
  const sea = accent;
  const deck = mix(WOOD, floor, 0.25);
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={sky} />
      <circle cx={850} cy={540} r={64} fill="#f7e3a0" />
      <Cloud x={90} y={560} s={0.55} color={light(sky, 0.6)} />
      <path d="M300 660 q20 -22 40 0 q20 -22 40 0" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M640 620 q14 -16 28 0 q14 -16 28 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <rect x={0} y={820} width={W} height={260} fill={sea} />
      <rect x={0} y={820} width={W} height={10} fill={light(sea, 0.25)} />
      {[[120, 880], [420, 860], [760, 900], [260, 960], [600, 990], [920, 950]].map(([x, y]) => (
        <rect key={`${x}`} x={x} y={y} width={70} height={8} rx={4} fill={light(sea, 0.45)} />
      ))}
      {/* палуба */}
      <rect x={0} y={1060} width={W} height={H - 1060} fill={deck} />
      <rect x={0} y={1060} width={W} height={20} fill={dark(deck, 0.2)} />
      <rect x={0} y={1180} width={W} height={6} fill={dark(deck, 0.08)} />
      {/* леер */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={30 + i * 120} y={905} width={14} height={160} fill={WHITE} />
      ))}
      <rect x={0} y={985} width={W} height={10} fill={WHITE} />
      <rect x={0} y={892} width={W} height={20} rx={8} fill={WOOD} />
      {/* спасательный круг */}
      <circle cx={900} cy={990} r={46} fill="none" stroke={WHITE} strokeWidth={28} />
      <circle cx={900} cy={990} r={46} fill="none" stroke={RED} strokeWidth={28} strokeDasharray="36.1 36.1" />
      <path d="M880 912 L900 944 L920 912" stroke="#c9b48a" strokeWidth={5} fill="none" />
      {/* вентиляционный раструб */}
      <rect x={60} y={880} width={64} height={FLOOR_Y - 880} fill={WHITE} />
      <path d="M44 900 Q44 800 140 800 L170 800 L170 900 Q150 880 124 880 L124 900 Z" fill={WHITE} />
      <ellipse cx={164} cy={850} rx={24} ry={52} fill={RED} />
      <ellipse cx={168} cy={850} rx={14} ry={36} fill={dark(RED, 0.5)} />
      <rect x={50} y={FLOOR_Y - 24} width={84} height={24} rx={6} fill={dark(WHITE, 0.15)} />
    </>
  );
};

// ---------- вокзал / аэропорт: табло и скамейки ----------
const Bench = ({ x, n, accent }: { x: number; n: number; accent: string }) => (
  <g>
    <rect x={x + 20} y={FLOOR_Y - 120} width={n * 96 - 40} height={14} rx={6} fill={dark(INK, 0) } opacity={0.75} />
    <rect x={x + 36} y={FLOOR_Y - 110} width={14} height={110} fill={INK} opacity={0.75} />
    <rect x={x + n * 96 - 50} y={FLOOR_Y - 110} width={14} height={110} fill={INK} opacity={0.75} />
    {Array.from({ length: n }).map((_, i) => (
      <g key={i}>
        <rect x={x + i * 96 + 6} y={FLOOR_Y - 290} width={84} height={140} rx={18} fill={accent} />
        <rect x={x + i * 96 + 2} y={FLOOR_Y - 170} width={92} height={44} rx={14} fill={dark(accent, 0.15)} />
      </g>
    ))}
  </g>
);

const Hall = ({ wall, floor, accent }: P) => {
  const board = "#2b2f36";
  const rowsY = [500, 534, 568, 602, 636];
  return (
    <>
      <Room wall={wall} floor={floor} />
      <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={dark(wall, 0.07)} />
      {/* большие окна к перрону/лётному полю */}
      {[40, 860].map((xx) => (
        <g key={xx}>
          <rect x={xx} y={720} width={180} height={300} rx={8} fill={light(wall, 0.4)} />
          <rect x={xx + 14} y={734} width={152} height={272} rx={4} fill={SKY} />
          <rect x={xx + 84} y={734} width={12} height={272} fill={light(wall, 0.4)} />
        </g>
      ))}
      {/* табло отправлений: пустые строки */}
      <rect x={188} y={438} width={720} height={240} rx={14} fill="#00000025" />
      <rect x={180} y={430} width={720} height={240} rx={14} fill={board} />
      <rect x={196} y={446} width={688} height={36} rx={6} fill={accent} />
      {rowsY.map((y, i) => (
        <g key={y}>
          <rect x={206} y={y} width={80} height={20} rx={4} fill="#f2b84b" />
          <rect x={302} y={y} width={300} height={20} rx={4} fill="#e8e4d8" opacity={0.85} />
          <rect x={618} y={y} width={60} height={20} rx={4} fill="#e8e4d8" opacity={0.6} />
          <rect x={700} y={y} width={170} height={20} rx={10} fill={i === 1 ? RED : i === 3 ? "#f2b84b" : "#5fb878"} opacity={0.9} />
        </g>
      ))}
      {/* часы */}
      <circle cx={990} cy={520} r={56} fill={INK} />
      <circle cx={990} cy={520} r={46} fill="#f7f3e8" />
      <path d="M990 520 L990 488 M990 520 L1014 530" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {/* скамейки по бокам, чемодан */}
      <Bench x={0} n={3} accent={accent} />
      <Bench x={792} n={3} accent={accent} />
      <rect x={300} y={FLOOR_Y - 190} width={110} height={180} rx={16} fill={RED} />
      <rect x={300} y={FLOOR_Y - 130} width={110} height={10} fill={dark(RED, 0.2)} />
      <rect x={340} y={FLOOR_Y - 250} width={8} height={60} fill={INK} />
      <rect x={362} y={FLOOR_Y - 250} width={8} height={60} fill={INK} />
      <rect x={340} y={FLOOR_Y - 254} width={30} height={10} rx={4} fill={INK} />
      <circle cx={318} cy={FLOOR_Y - 6} r={10} fill={INK} />
      <circle cx={392} cy={FLOOR_Y - 6} r={10} fill={INK} />
    </>
  );
};

export const Samolet = ({ palette, variant }: BackdropProps) => {
  const p = palette;
  return (
    <Canvas>
      {variant === "train" ? (
        <Train {...p} />
      ) : variant === "ship" ? (
        <Ship {...p} />
      ) : variant === "airport" || variant === "train-station" ? (
        <Hall {...p} />
      ) : (
        <Plane {...p} />
      )}
    </Canvas>
  );
};
