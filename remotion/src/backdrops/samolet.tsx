import { Canvas, Room, Cloud, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { depthScale, feetY, seatTopY } from "../world/depth";

/**
 * Фон «samolet»: салон самолёта (вид вдоль прохода, по умолчанию — старый вид для старых эпизодов);
 * сублокации: cabin (салон с ближним рядом кресел под героев), cockpit (кабина пилотов), train (купе),
 * ship (палуба), airport (зал ожидания вокзала/аэропорта). Метки — content/locations/samolet.json.
 *
 * Перспектива сублокаций согласована с планами глубины (world/depth.ts): горизонт y = 850, глаз камеры
 * на высоте 425 px (средний план), масштаб s = depthScale(z). Точка (X, h, s): x = vx + X·s, y = 850 + (425 − h)·s.
 * Сиденье под меткой с seat рисуется так, что верх подушки — ровно seatTopY(z) (h = 72).
 */

const rgb = (c: string) => {
  const h = c.replace("#", "");
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
};
export const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
export const dark = (c: string, t: number) => mix(c, "#000000", t);
export const light = (c: string, t: number) => mix(c, "#ffffff", t);

const WHITE = "#f4f1ea";
const WOOD = "#b48a5e";
const INK = "#2b2a2e";
const RED = "#c8553d";
const SKY = "#bfe0f2";

type P = { wall: string; floor: string; accent: string };

// ---------- перспектива планов глубины ----------
/** Горизонт и высота глаза камеры, которые следуют из feetY/depthScale: пол y = 850 + 425·s. */
export const HZ = 850;
export const EYE = 425;
/** Высота сиденья над полом (px среднего плана) — как SEAT_H движка. */
export const SEAT = 72;
type Pt = [number, number, number];
/** Перспектива с точкой схода по x = vx: P(X, h, s) → [x, y]; quad — строка points для polygon. */
export const persp = (vx: number) => {
  const P = (X: number, h: number, s: number): [number, number] => [vx + X * s, HZ + (EYE - h) * s];
  const quad = (pts: Pt[]) => pts.map(([X, h, s]) => P(X, h, s).map((v) => v.toFixed(1)).join(",")).join(" ");
  return { P, quad };
};

/**
 * Сиденье лицом к зрителю на метке (x — доля ширины кадра, z — план): верх подушки = seatTopY(z), ширина w·s.
 * back — высота спинки над подушкой; head — цвет чехла/подголовника; arms — подлокотники; base — цвет ножек.
 */
export const SeatFront = ({
  x, z, w = 200, back = 300, color, cushion, base = "#3a3f47", head, arms = false, legs = "post", r = 34,
}: {
  x: number; z: number; w?: number; back?: number; color: string; cushion?: string; base?: string; head?: string;
  arms?: boolean; legs?: "post" | "legs" | "box"; r?: number;
}) => {
  const s = depthScale(z);
  const cx = x * W;
  const top = seatTopY(z);
  const feet = feetY(z);
  const hw = (w * s) / 2;
  const bt = top - back * s;
  const cush = cushion ?? light(color, 0.18);
  return (
    <g>
      {/* спинка */}
      <rect x={cx - hw + 8 * s} y={bt} width={2 * hw - 16 * s} height={top - bt + 6 * s} rx={r * s} fill={color} />
      <rect x={cx - hw + 26 * s} y={bt + back * s * 0.42} width={2 * hw - 52 * s} height={back * s * 0.46} rx={18 * s} fill={dark(color, 0.08)} />
      {head && <rect x={cx - hw * 0.6} y={bt + 8 * s} width={hw * 1.2} height={62 * s} rx={16 * s} fill={head} />}
      {/* основание */}
      {legs === "box" ? (
        <rect x={cx - hw + 10 * s} y={top + 20 * s} width={2 * hw - 20 * s} height={feet - top - 20 * s} rx={8 * s} fill={base} />
      ) : legs === "legs" ? (
        <>
          <rect x={cx - hw + 16 * s} y={top + 20 * s} width={14 * s} height={feet - top - 20 * s} fill={base} />
          <rect x={cx + hw - 30 * s} y={top + 20 * s} width={14 * s} height={feet - top - 20 * s} fill={base} />
        </>
      ) : (
        <>
          <rect x={cx - 12 * s} y={top + 20 * s} width={24 * s} height={feet - top - 26 * s} fill={base} />
          <rect x={cx - hw * 0.7} y={feet - 10 * s} width={hw * 1.4} height={10 * s} rx={5 * s} fill={base} />
        </>
      )}
      {/* подушка: верхняя кромка = seatTopY(z) */}
      <rect x={cx - hw} y={top - 10 * s} width={2 * hw} height={36 * s} rx={14 * s} fill={cush} />
      <rect x={cx - hw} y={top + 12 * s} width={2 * hw} height={14 * s} rx={7 * s} fill={dark(cush, 0.12)} />
      {/* подлокотники */}
      {arms &&
        [-1, 1].map((k) => (
          <g key={k}>
            <rect x={cx + k * hw - 11 * s} y={top - 110 * s} width={22 * s} height={120 * s} rx={8 * s} fill={dark(color, 0.25)} />
            <rect x={cx + k * hw - 16 * s} y={top - 118 * s} width={32 * s} height={18 * s} rx={9 * s} fill={dark(color, 0.4)} />
          </g>
        ))}
    </g>
  );
};

// ---------- самолёт (вид по умолчанию, как в старых эпизодах): простая перспектива к точке схода ----------
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

// ---------- салон (cabin): ближний ряд кресел для героев, проход, дальние ряды за массовкой ----------
/** Кресло дальнего ряда в перспективе: Xc — центр, s — масштаб ряда. */
const RowSeat = ({ vx, Xc, s, color }: { vx: number; Xc: number; s: number; color: string }) => {
  const { P } = persp(vx);
  const [x0, yTop] = P(Xc - 104, 440, s);
  const [x1] = P(Xc + 104, 440, s);
  const [, yCush] = P(0, SEAT, s);
  const [, yFloor] = P(0, 0, s);
  const w = x1 - x0;
  return (
    <g>
      <rect x={x0 + 4 * s} y={yTop} width={w - 8 * s} height={yCush - yTop + 6 * s} rx={30 * s} fill={color} />
      <rect x={x0 + 26 * s} y={yTop + 8 * s} width={w - 52 * s} height={56 * s} rx={14 * s} fill={WHITE} />
      <rect x={x0} y={yCush - 10 * s} width={w} height={34 * s} rx={12 * s} fill={light(color, 0.16)} />
      <rect x={x0 + w / 2 - 12 * s} y={yCush + 24 * s} width={24 * s} height={yFloor - yCush - 24 * s} fill="#3a3f47" />
    </g>
  );
};

const CABIN_VX = 648; // проход по x = 0.6
const CABIN_COLS = [-430, -210, 210, 430]; // центры кресел (px среднего плана от прохода)

const Cabin = ({ wall, floor, accent }: P) => {
  const vx = CABIN_VX;
  const { P, quad } = persp(vx);
  const L = -560;
  const R = 560;
  const CEIL = 880;
  const BIN = 640;
  const BX = 290; // кромка полок
  const N = 2.6;
  const B = 0.28; // хвостовая перегородка
  const ceil = light(wall, 0.45);
  const binFront = light(wall, 0.6);
  const binBottom = dark(wall, 0.12);
  const side = light(wall, 0.12);
  const seat = mix(accent, wall, 0.1);
  const far = [0.58, 0.505, 0.445, 0.395, 0.355, 0.32];
  const winL = [1.08, 0.66, 0.58, 0.51, 0.45, 0.4, 0.36, 0.325];
  const winR = [0.66, 0.58, 0.51, 0.45, 0.4, 0.36, 0.325];
  const [bx0, by0] = P(L, CEIL, B);
  const [bx1, by1] = P(R, 0, B);
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      {/* потолок, стены, пол, ковровая дорожка */}
      <polygon points={quad([[L, CEIL, N], [R, CEIL, N], [R, CEIL, B], [L, CEIL, B]])} fill={ceil} />
      <polygon points={quad([[-70, CEIL, N], [70, CEIL, N], [70, CEIL, B], [-70, CEIL, B]])} fill={light(ceil, 0.4)} />
      <polygon points={quad([[L, 0, N], [L, CEIL, N], [L, CEIL, B], [L, 0, B]])} fill={side} />
      <polygon points={quad([[R, 0, N], [R, CEIL, N], [R, CEIL, B], [R, 0, B]])} fill={side} />
      <polygon points={quad([[L, 0, N], [R, 0, N], [R, 0, B], [L, 0, B]])} fill={floor} />
      <polygon points={quad([[-100, 0, N], [100, 0, N], [100, 0, B], [-100, 0, B]])} fill={dark(accent, 0.25)} />
      <polygon points={quad([[-70, 0, N], [70, 0, N], [70, 0, B], [-70, 0, B]])} fill={dark(accent, 0.12)} />
      {/* хвост: перегородка, шторка камбуза, табличка выхода */}
      <rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill={light(wall, 0.25)} />
      <polygon points={quad([[-150, 0, B], [150, 0, B], [150, 600, B], [-150, 600, B]])} fill={accent} />
      {[-100, -50, 0, 50, 100].map((X) => (
        <polygon key={X} points={quad([[X - 9, 0, B], [X + 9, 0, B], [X + 9, 600, B], [X - 9, 600, B]])} fill={dark(accent, 0.15)} />
      ))}
      <polygon points={quad([[-70, 680, B], [70, 680, B], [70, 740, B], [-70, 740, B]])} fill="#3fae6a" />
      {/* иллюминаторы */}
      {winL.map((s) => {
        const [x, y] = P(L, 560, s);
        return (
          <g key={`l${s}`}>
            <ellipse cx={x} cy={y} rx={24 * s} ry={80 * s} fill={light(wall, 0.6)} />
            <ellipse cx={x} cy={y} rx={15 * s} ry={62 * s} fill={SKY} />
          </g>
        );
      })}
      {winR.map((s) => {
        const [x, y] = P(R, 560, s);
        return (
          <g key={`r${s}`}>
            <ellipse cx={x} cy={y} rx={24 * s} ry={80 * s} fill={light(wall, 0.6)} />
            <ellipse cx={x} cy={y} rx={15 * s} ry={62 * s} fill={SKY} />
          </g>
        );
      })}
      {/* аварийный выход у ряда героев (слева) */}
      <polygon points={quad([[L, 0, 0.9], [L, 760, 0.9], [L, 760, 0.74], [L, 0, 0.74]])} fill={light(wall, 0.45)} />
      <polygon points={quad([[L, 40, 0.88], [L, 720, 0.88], [L, 720, 0.76], [L, 40, 0.76]])} fill={light(wall, 0.3)} />
      {(() => {
        const [x, y] = P(L, 520, 0.82);
        return (
          <g>
            <ellipse cx={x} cy={y} rx={16} ry={52} fill={SKY} />
            <rect x={x - 10} y={y + 110} width={20} height={70} rx={8} fill={RED} />
          </g>
        );
      })()}
      {/* багажные полки */}
      {[-1, 1].map((k) => {
        const Wl = k < 0 ? L : R;
        const Ex = k * BX;
        return (
          <g key={k}>
            <polygon points={quad([[Wl, BIN, N], [Ex, BIN, N], [Ex, BIN, B], [Wl, BIN, B]])} fill={binBottom} />
            <polygon points={quad([[Ex, BIN, N], [Ex, CEIL, N], [Ex, CEIL, B], [Ex, BIN, B]])} fill={binFront} />
            <polygon points={quad([[Ex, BIN, N], [Ex, BIN + 26, N], [Ex, BIN + 26, B], [Ex, BIN, B]])} fill={dark(binFront, 0.1)} />
            {[1.4, 0.9, 0.62, 0.47, 0.38].map((s) => {
              const [x, y0] = P(Ex, CEIL, s);
              const [, y1] = P(Ex, BIN, s);
              return <line key={s} x1={x} y1={y0} x2={x} y2={y1} stroke={dark(binFront, 0.15)} strokeWidth={5 * s} />;
            })}
          </g>
        );
      })}
      {/* дальние ряды: за массовкой (её стопы — y ≈ 1113) */}
      {[...far].reverse().map((s) => (
        <g key={s}>
          {CABIN_COLS.map((Xc) => <RowSeat key={Xc} vx={vx} Xc={Xc} s={s} color={seat} />)}
        </g>
      ))}
      {/* ближний ряд — кресла героев (средний план): window, seat-left | проход | seat-right */}
      {CABIN_COLS.map((Xc) => (
        <SeatFront key={Xc} x={(vx + Xc) / W} z={0.5} w={210} back={290} color={seat} head={WHITE} arms />
      ))}
    </>
  );
};

// ---------- кабина пилотов (cockpit) ----------
const Cockpit = ({ wall, accent }: P) => {
  const shell = mix("#3d4552", wall, 0.15);
  const panel = "#2c313a";
  const screen = "#16202c";
  const sky = "#9fd0ef";
  const seat = mix("#4a5568", accent, 0.25);
  const winTop = 360;
  const winBot = 770;
  // стёкла: 4 секции, стойки
  const panes: [number, number, number, number][] = [
    [150, 300, 150, 300], // x0 top, x1 top, x0 bottom, x1 bottom
    [318, 531, 318, 531],
    [549, 762, 549, 762],
    [780, 930, 780, 930],
  ];
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={shell} />
      {/* потолок с верхней панелью */}
      <path d={`M0 0 H${W} V250 L930 ${winTop - 20} H150 L0 250 Z`} fill={dark(shell, 0.2)} />
      <rect x={330} y={130} width={420} height={180} rx={16} fill={panel} />
      {Array.from({ length: 3 }).flatMap((_, r) =>
        Array.from({ length: 9 }).map((__, c) => (
          <rect key={`${r}-${c}`} x={352 + c * 44} y={150 + r * 52} width={24} height={30} rx={5} fill={(r * 9 + c) % 7 === 3 ? "#f2b84b" : (r * 9 + c) % 5 === 1 ? "#5fb878" : "#8c94a0"} />
        )),
      )}
      {/* лобовое стекло: небо и облака */}
      <defs>
        <clipPath id="samolet-cockpit-ws">
          {panes.map(([a, b, c, d], i) => (
            <path key={i} d={`M${a} ${winTop + (i === 0 || i === 3 ? 30 : 0)} H${b} L${d} ${winBot} H${c} Z`} />
          ))}
        </clipPath>
      </defs>
      <rect x={130} y={winTop - 20} width={820} height={winBot - winTop + 40} rx={30} fill={dark(shell, 0.35)} />
      <g clipPath="url(#samolet-cockpit-ws)">
        <rect x={0} y={winTop - 40} width={W} height={winBot - winTop + 80} fill={sky} />
        <rect x={0} y={640} width={W} height={200} fill={light(sky, 0.35)} />
        <Cloud x={200} y={480} s={0.55} />
        <Cloud x={700} y={430} s={0.4} />
        <Cloud x={90} y={700} s={0.9} color="#f7fbff" />
        <Cloud x={420} y={720} s={1.1} color="#f7fbff" />
        <Cloud x={800} y={690} s={0.9} color="#f7fbff" />
        <circle cx={860} cy={420} r={34} fill="#fff4c8" />
      </g>
      {/* стойки рамы */}
      {[309, 540, 771].map((x) => <rect key={x} x={x - 10} y={winTop - 20} width={20} height={winBot - winTop + 30} fill={dark(shell, 0.35)} />)}
      {/* боковые стены: слева форточка, справа дверь в салон */}
      <path d={`M0 250 L130 ${winTop + 20} V1190 L0 1300 Z`} fill={dark(shell, 0.1)} />
      <path d={`M20 420 L110 450 V640 L20 650 Z`} fill={sky} />
      <path d={`M${W} 250 L950 ${winTop + 20} V1190 L${W} 1300 Z`} fill={dark(shell, 0.1)} />
      <path d={`M965 560 L1066 520 V1270 L965 1186 Z`} fill={mix(shell, "#8a96a6", 0.4)} />
      <path d={`M985 610 L1046 588 V700 L985 712 Z`} fill={dark(shell, 0.3)} />
      <rect x={1044} y={900} width={14} height={60} rx={6} fill="#d8dde3" />
      {/* козырёк с панелью автопилота */}
      <path d={`M120 ${winBot} Q540 ${winBot - 30} 960 ${winBot} V${winBot + 60} H120 Z`} fill={panel} />
      <rect x={380} y={winBot + 6} width={320} height={40} rx={8} fill="#3a404b" />
      {[400, 470, 560, 640].map((x) => <rect key={x} x={x} y={winBot + 16} width={46} height={20} rx={3} fill="#f2b84b" />)}
      {/* приборная доска: экраны, круглые приборы */}
      <path d={`M60 ${winBot + 60} H1020 V1090 Q540 1120 60 1090 Z`} fill={dark(panel, 0.1)} />
      {[150, 310, 630, 790].map((x, i) => (
        <g key={x}>
          <rect x={x} y={872} width={140} height={120} rx={10} fill={screen} />
          {i % 2 === 0 ? (
            <>
              <rect x={x + 10} y={882} width={120} height={50} fill="#3b82c4" />
              <rect x={x + 10} y={932} width={120} height={50} fill="#8a5a3a" />
              <rect x={x + 30} y={928} width={80} height={8} fill="#f2b84b" />
            </>
          ) : (
            <>
              <circle cx={x + 70} cy={932} r={44} fill="none" stroke="#5fb878" strokeWidth={5} />
              <path d={`M${x + 70} 932 L${x + 100} 906`} stroke="#ffffff" strokeWidth={5} />
              <rect x={x + 20} y={978} width={100} height={6} fill="#5fb878" />
            </>
          )}
        </g>
      ))}
      <rect x={470} y={870} width={140} height={150} rx={10} fill={screen} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={486} y={886 + i * 44} width={50} height={30} rx={4} fill="#5fb878" opacity={0.8} />
          <rect x={546} y={886 + i * 44} width={50} height={30} rx={4} fill="#5fb878" opacity={0.8} />
        </g>
      ))}
      {[100, 980].map((x) => (
        <g key={x}>
          <circle cx={x} cy={950} r={34} fill="#e8e4d8" />
          <circle cx={x} cy={950} r={26} fill={screen} />
          <path d={`M${x} 950 L${x + 16} 932`} stroke="#f2b84b" strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {/* штурвалы перед креслами (за пилотами) */}
      {[292, 788].map((x) => (
        <g key={x}>
          <rect x={x - 14} y={1040} width={28} height={150} fill="#1d2128" />
          <path d={`M${x - 110} 990 V1040 Q${x - 110} 1060 ${x - 90} 1060 H${x + 90} Q${x + 110} 1060 ${x + 110} 1040 V990`} stroke="#1d2128" strokeWidth={26} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* пол, пьедестал с РУДами между креслами */}
      <rect x={0} y={1100} width={W} height={H - 1100} fill={dark(shell, 0.45)} />
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill={dark(shell, 0.3)} />
      <path d={`M470 1050 H610 L640 ${feetY(0.5)} H440 Z`} fill={panel} />
      {[505, 545].map((x) => (
        <g key={x}>
          <rect x={x - 5} y={1000} width={10} height={60} fill="#9aa1a6" />
          <rect x={x - 18} y={986} width={36} height={22} rx={8} fill="#e8e4d8" />
        </g>
      ))}
      <rect x={580} y={1000} width={10} height={56} fill="#9aa1a6" />
      <circle cx={585} cy={994} r={14} fill={RED} />
      <rect x={470} y={1080} width={140} height={50} rx={8} fill={screen} />
      {/* кресла пилотов: captain (x 0.27) и copilot (x 0.73), средний план */}
      {[0.27, 0.73].map((x) => (
        <g key={x}>
          <SeatFront x={x} z={0.5} w={230} back={380} color={seat} cushion={light(seat, 0.12)} head={dark(seat, 0.2)} base="#1d2128" arms legs="box" r={44} />
          {/* ремни */}
          {[-1, 1].map((k) => {
            const cx = x * W;
            const top = seatTopY(0.5);
            return <rect key={k} x={cx + k * 56 - 9} y={top - 330} width={18} height={250} rx={6} fill="#c9a640" opacity={0.9} />;
          })}
        </g>
      ))}
    </>
  );
};

// ---------- поезд: купе в перспективе, нижние полки — диваны вдоль стен ----------
const Train = ({ wall, floor, accent }: P) => {
  const { P, quad } = persp(540);
  const WL = -400;
  const WR = 400;
  const IN = 210; // внутренняя кромка полок
  const CEIL = 900;
  const B = 0.72; // стена с окном
  const N = 2.6;
  const SN = 1.5; // ближний край диванов
  const panel = mix(WOOD, wall, 0.35);
  const sideWall = light(wall, 0.08);
  const sofa = accent;
  const [bx0, by0] = P(WL, CEIL, B);
  const [bx1, by1] = P(WR, 0, B);
  const [wx0, wy0] = P(-170, 640, B);
  const [wx1, wy1] = P(170, 340, B);
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      <polygon points={quad([[WL, CEIL, N], [WR, CEIL, N], [WR, CEIL, B], [WL, CEIL, B]])} fill={light(wall, 0.35)} />
      {[-1, 1].map((k) => {
        const X = k * 400;
        return (
          <g key={k}>
            <polygon points={quad([[X, 0, N], [X, CEIL, N], [X, CEIL, B], [X, 0, B]])} fill={sideWall} />
            <polygon points={quad([[X, 0, N], [X, 360, N], [X, 360, B], [X, 0, B]])} fill={panel} />
          </g>
        );
      })}
      <polygon points={quad([[WL, 0, N], [WR, 0, N], [WR, 0, B], [WL, 0, B]])} fill={dark(floor, 0.1)} />
      <polygon points={quad([[-130, 0, N], [130, 0, N], [130, 0, B], [-130, 0, B]])} fill={dark(accent, 0.3)} />
      <polygon points={quad([[-100, 0, N], [100, 0, N], [100, 0, B], [-100, 0, B]])} fill={dark(accent, 0.15)} />
      {/* стена с окном */}
      <rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill={wall} />
      <polygon points={quad([[WL, 0, B], [WR, 0, B], [WR, 360, B], [WL, 360, B]])} fill={panel} />
      <defs>
        <clipPath id="samolet-train-win">
          <rect x={wx0 + 10} y={wy0 + 10} width={wx1 - wx0 - 20} height={wy1 - wy0 - 20} rx={16} />
        </clipPath>
      </defs>
      <rect x={wx0} y={wy0} width={wx1 - wx0} height={wy1 - wy0} rx={20} fill={light(wall, 0.5)} />
      <g clipPath="url(#samolet-train-win)">
        <rect x={wx0} y={wy0} width={wx1 - wx0} height={wy1 - wy0} fill={SKY} />
        <ellipse cx={wx0 + 60} cy={wy1} rx={140} ry={80} fill="#8fbf7a" />
        <ellipse cx={wx1 - 40} cy={wy1 + 6} rx={150} ry={70} fill="#6fa765" />
        <rect x={wx0 + 150} y={wy1 - 110} width={5} height={90} fill="#6b4429" />
        <rect x={wx0 + 138} y={wy1 - 100} width={30} height={5} fill="#6b4429" />
        <Cloud x={wx0 + 50} y={wy0 + 60} s={0.25} />
      </g>
      {/* занавески */}
      <path d={`M${wx0 - 24} ${wy0 - 8} H${wx0 + 40} Q${wx0 + 16} ${(wy0 + wy1) / 2} ${wx0 + 34} ${wy1 - 10} Q${wx0} ${wy1 + 6} ${wx0 - 24} ${wy1 - 10} Z`} fill={accent} />
      <path d={`M${wx1 + 24} ${wy0 - 8} H${wx1 - 40} Q${wx1 - 16} ${(wy0 + wy1) / 2} ${wx1 - 34} ${wy1 - 10} Q${wx1} ${wy1 + 6} ${wx1 + 24} ${wy1 - 10} Z`} fill={accent} />
      <rect x={wx0 - 36} y={wy0 - 14} width={wx1 - wx0 + 72} height={10} rx={5} fill={dark(WOOD, 0.2)} />
      {/* столик у окна: стакан в подстаканнике */}
      <polygon points={quad([[-150, 300, B], [150, 300, B], [150, 300, 0.8], [-150, 300, 0.8]])} fill={WOOD} />
      <polygon points={quad([[-150, 280, 0.8], [150, 280, 0.8], [150, 300, 0.8], [-150, 300, 0.8]])} fill={dark(WOOD, 0.2)} />
      {(() => {
        const [cx, cy] = P(-60, 300, 0.76);
        const [px, py] = P(70, 300, 0.76);
        return (
          <g>
            <rect x={cx - 16} y={cy - 46} width={32} height={46} rx={5} fill="#c98b4a" opacity={0.85} />
            <rect x={cx - 19} y={cy - 28} width={38} height={28} rx={5} fill="#b7a27a" />
            <path d={`M${cx + 19} ${cy - 22} q13 3 0 16`} stroke="#b7a27a" strokeWidth={5} fill="none" />
            <rect x={cx + 2} y={cy - 58} width={3} height={32} fill="#d8d8d8" />
            <ellipse cx={px} cy={py - 2} rx={32} ry={7} fill={WHITE} />
          </g>
        );
      })()}
      {/* полки: нижние (диваны, сидят), верхние (матрасы) */}
      {[-1, 1].map((k) => {
        const Wx = k * 400;
        const Ix = k * IN;
        const Bx = k * 350; // лицо спинки
        return (
          <g key={k}>
            {/* верхняя полка */}
            <polygon points={quad([[Wx, 600, N], [Ix, 600, N], [Ix, 600, B], [Wx, 600, B]])} fill={dark(WOOD, 0.3)} />
            <polygon points={quad([[Ix, 600, N], [Ix, 628, N], [Ix, 628, B], [Ix, 600, B]])} fill={dark(WOOD, 0.15)} />
            {(() => {
              const [mx, my] = P(k * 300, 628, 0.8);
              return (
                <g>
                  <rect x={mx - 70} y={my - 60} width={140} height={60} rx={28} fill="#e6e1d6" />
                  {[0, 1, 2].map((i) => <rect key={i} x={mx - 48 + i * 36} y={my - 60} width={11} height={60} fill={light(accent, 0.45)} />)}
                </g>
              );
            })()}
            {/* спинка дивана на стене */}
            <polygon points={quad([[Wx, SEAT, SN], [Wx, 340, SN], [Wx, 340, B], [Wx, SEAT, B]])} fill={dark(sofa, 0.12)} />
            <polygon points={quad([[Bx, SEAT, SN], [Bx, 320, SN], [Bx, 320, B], [Bx, SEAT, B]])} fill={dark(sofa, 0.05)} />
            <polygon points={quad([[Wx, 340, SN], [Bx, 320, SN], [Bx, 320, B], [Wx, 340, B]])} fill={light(sofa, 0.2)} />
            {/* сиденье: верх на высоте SEAT */}
            <polygon points={quad([[Bx, SEAT, SN], [Ix, SEAT, SN], [Ix, SEAT, B], [Bx, SEAT, B]])} fill={light(sofa, 0.12)} />
            <polygon points={quad([[Ix, 0, SN], [Ix, SEAT, SN], [Ix, SEAT, B], [Ix, 0, B]])} fill={dark(WOOD, 0.25)} />
            <polygon points={quad([[Ix, SEAT - 16, SN], [Ix, SEAT, SN], [Ix, SEAT, B], [Ix, SEAT - 16, B]])} fill={sofa} />
          </g>
        );
      })}
    </>
  );
};

// ---------- корабль: палуба с леером и море ----------
const Ship = ({ floor, accent }: P) => {
  const sky = light(accent, 0.62);
  const sea = accent;
  const deck = mix(WOOD, floor, 0.25);
  const { P } = persp(540);
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
      {/* палуба: доски сходятся к горизонту */}
      <rect x={0} y={1060} width={W} height={H - 1060} fill={deck} />
      {Array.from({ length: 15 }).map((_, i) => {
        const X = (i - 7) * 170;
        const [x0, y0] = P(X, 0, 0.5);
        const [x1, y1] = P(X, 0, 2.6);
        const k = (1060 - y0) / (y1 - y0);
        return <line key={i} x1={x0 + (x1 - x0) * k} y1={1060} x2={x1} y2={y1} stroke={dark(deck, 0.1)} strokeWidth={4} />;
      })}
      <rect x={0} y={1060} width={W} height={20} fill={dark(deck, 0.2)} />
      {/* леер */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={30 + i * 120} y={905} width={14} height={160} fill={WHITE} />
      ))}
      <rect x={0} y={985} width={W} height={10} fill={WHITE} />
      <rect x={0} y={892} width={W} height={20} rx={8} fill={WOOD} />
      {/* спасательный круг */}
      <circle cx={985} cy={990} r={42} fill="none" stroke={WHITE} strokeWidth={26} />
      <circle cx={985} cy={990} r={42} fill="none" stroke={RED} strokeWidth={26} strokeDasharray="33 33" />
      <path d="M965 916 L985 948 L1005 916" stroke="#c9b48a" strokeWidth={5} fill="none" />
      {/* вентиляционный раструб */}
      <rect x={60} y={880} width={64} height={FLOOR_Y - 880} fill={WHITE} />
      <path d="M44 900 Q44 800 140 800 L170 800 L170 900 Q150 880 124 880 L124 900 Z" fill={WHITE} />
      <ellipse cx={164} cy={850} rx={24} ry={52} fill={RED} />
      <ellipse cx={168} cy={850} rx={14} ry={36} fill={dark(RED, 0.5)} />
      <rect x={50} y={FLOOR_Y - 24} width={84} height={24} rx={6} fill={dark(WHITE, 0.15)} />
      {/* скамья у леера (дальний план): bench-1, bench-2 */}
      <ShipBench x0={0.6} x1={0.75} z={1} />
      {/* шезлонг (средний план): deckchair */}
      <DeckChair x={0.3} z={0.5} stripe={RED} />
    </>
  );
};

/** Деревянная скамья со спинкой лицом к зрителю: сиденья на x0 и x1 (доли кадра), план z. */
const ShipBench = ({ x0, x1, z }: { x0: number; x1: number; z: number }) => {
  const s = depthScale(z);
  const top = seatTopY(z);
  const feet = feetY(z);
  const l = x0 * W - 90 * s;
  const r = x1 * W + 90 * s;
  return (
    <g>
      {[0, 1, 2].map((i) => <rect key={i} x={l} y={top - (190 - i * 56) * s} width={r - l} height={34 * s} rx={10 * s} fill={i % 2 ? dark(WOOD, 0.08) : WOOD} />)}
      {[l + 20 * s, r - 40 * s].map((x) => <rect key={x} x={x} y={top - 200 * s} width={20 * s} height={feet - top + 200 * s} fill="#5a4636" />)}
      <rect x={l - 8 * s} y={top - 10 * s} width={r - l + 16 * s} height={30 * s} rx={8 * s} fill={light(WOOD, 0.12)} />
      <rect x={l - 8 * s} y={top + 14 * s} width={r - l + 16 * s} height={8 * s} fill={dark(WOOD, 0.25)} />
    </g>
  );
};

/** Шезлонг в полоску лицом к зрителю. */
const DeckChair = ({ x, z, stripe }: { x: number; z: number; stripe: string }) => {
  const s = depthScale(z);
  const cx = x * W;
  const top = seatTopY(z);
  const feet = feetY(z);
  const hw = 100 * s;
  return (
    <g>
      <path d={`M${cx - hw + 10 * s} ${top} L${cx - hw + 30 * s} ${top - 300 * s} M${cx + hw - 10 * s} ${top} L${cx + hw - 30 * s} ${top - 300 * s}`} stroke={WOOD} strokeWidth={18 * s} strokeLinecap="round" />
      <path d={`M${cx - hw + 30 * s} ${top - 290 * s} H${cx + hw - 30 * s} L${cx + hw - 14 * s} ${top} H${cx - hw + 14 * s} Z`} fill={WHITE} />
      {[-2, 0, 2].map((k) => (
        <path key={k} d={`M${cx + (k * 26 - 13) * s} ${top - 290 * s} H${cx + (k * 26 + 13) * s} L${cx + (k * 30 + 15) * s} ${top} H${cx + (k * 30 - 15) * s} Z`} fill={stripe} />
      ))}
      <path d={`M${cx - hw} ${feet} L${cx + hw - 20 * s} ${top} M${cx + hw} ${feet} L${cx - hw + 20 * s} ${top}`} stroke={dark(WOOD, 0.15)} strokeWidth={14 * s} strokeLinecap="round" />
      <rect x={cx - hw} y={top - 10 * s} width={2 * hw} height={24 * s} rx={8 * s} fill={dark(WOOD, 0.05)} />
    </g>
  );
};

// ---------- вокзал / аэропорт: табло и ряды сидений у стены ----------
/** Ряд пластиковых кресел на балке (дальний план): xs — центры сидений (доли кадра). */
const SeatRow = ({ xs, z, accent }: { xs: number[]; z: number; accent: string }) => {
  const s = depthScale(z);
  const top = seatTopY(z);
  const feet = feetY(z);
  const half = 74 * s;
  const l = xs[0] * W - half;
  const r = xs[xs.length - 1] * W + half;
  return (
    <g>
      <rect x={l + 10} y={top + 30 * s} width={r - l - 20} height={12 * s} fill={INK} opacity={0.8} />
      {[l + 24 * s, r - 38 * s].map((x) => <rect key={x} x={x} y={top + 30 * s} width={14 * s} height={feet - top - 30 * s} fill={INK} opacity={0.8} />)}
      {xs.map((x) => {
        const cx = x * W;
        return (
          <g key={x}>
            <rect x={cx - half + 6 * s} y={top - 220 * s} width={2 * half - 12 * s} height={210 * s} rx={26 * s} fill={accent} />
            <rect x={cx - half} y={top - 10 * s} width={2 * half} height={34 * s} rx={14 * s} fill={dark(accent, 0.15)} />
            <rect x={cx - 6 * s} y={top + 24 * s} width={12 * s} height={10 * s} fill={INK} />
          </g>
        );
      })}
    </g>
  );
};

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
          <rect x={xx} y={700} width={180} height={300} rx={8} fill={light(wall, 0.4)} />
          <rect x={xx + 14} y={714} width={152} height={272} rx={4} fill={SKY} />
          <rect x={xx + 84} y={714} width={12} height={272} fill={light(wall, 0.4)} />
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
      {/* ряды кресел у стены (дальний план): bench-1, bench-2 слева, bench-3, bench-4 справа */}
      <SeatRow xs={[0.18, 0.32]} z={1} accent={accent} />
      <SeatRow xs={[0.68, 0.82]} z={1} accent={accent} />
      {/* чемодан у ряда кресел */}
      <g transform={`translate(440 ${FLOOR_Y}) scale(0.8)`}>
        <rect x={0} y={-190} width={110} height={180} rx={16} fill={RED} />
        <rect x={0} y={-130} width={110} height={10} fill={dark(RED, 0.2)} />
        <rect x={40} y={-250} width={8} height={60} fill={INK} />
        <rect x={62} y={-250} width={8} height={60} fill={INK} />
        <rect x={40} y={-254} width={30} height={10} rx={4} fill={INK} />
        <circle cx={18} cy={-6} r={10} fill={INK} />
        <circle cx={92} cy={-6} r={10} fill={INK} />
      </g>
    </>
  );
};

export const Samolet = ({ palette, variant }: BackdropProps) => {
  const p = palette;
  return (
    <Canvas>
      {variant === "cabin" ? (
        <Cabin {...p} />
      ) : variant === "cockpit" ? (
        <Cockpit {...p} />
      ) : variant === "train" ? (
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
