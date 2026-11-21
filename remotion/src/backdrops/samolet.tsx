import { Canvas, Room, Cloud, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { Birds, Label, Puff } from "./ulitsa";
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
      <rect x={x0 + 30 * s} y={top + 150 * s} width={w - 60 * s} height={8 * s} rx={4 * s} fill={dark(color, 0.3)} />
      <rect x={x0 + 44 * s} y={top + 160 * s} width={50 * s} height={34 * s} rx={3 * s} fill={WHITE} />
      <rect x={x0 + 50 * s} y={top + 166 * s} width={38 * s} height={6 * s} fill={RED} />
      <rect x={x0 + w / 2 - 30 * s} y={top + 260 * s} width={60 * s} height={12 * s} rx={6 * s} fill={dark(color, 0.3)} />
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
      <text x={VX} y={VY - 408 * FAR} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={900} fontSize={70 * FAR} fill="#ffffff">ВЫХОД</text>
      {/* иллюминаторы */}
      {[-1, 1].map((side) =>
        windows.map((s) => (
          <g key={`${side}${s}`}>
            <ellipse cx={VX + side * WX * s} cy={VY - 150 * s} rx={30 * s} ry={78 * s} fill={light(wall, 0.6)} />
            <ellipse cx={VX + side * WX * s} cy={VY - 150 * s} rx={19 * s} ry={60 * s} fill={SKY} />
            <ellipse cx={VX + side * WX * s} cy={VY - 120 * s} rx={16 * s} ry={14 * s} fill="#ffffff" />
            <rect x={VX + side * WX * s - 19 * s} y={VY - 210 * s} width={38 * s} height={16 * s} fill={light(wall, 0.4)} />
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
      {/* лампы для чтения и сопла под полками, светильники на потолке */}
      {[-1, 1].map((side) => [0.4, 0.5, 0.64, 0.86, 1.2].map((s) => (
        <g key={`${side}${s}`}>
          <circle cx={VX + side * 420 * s} cy={VY - 330 * s + 10 * s} r={9 * s} fill="#fff4c8" />
          <circle cx={VX + side * 470 * s} cy={VY - 330 * s + 10 * s} r={7 * s} fill={dark(binBottom, 0.25)} />
          <rect x={VX + side * 380 * s - 8 * s} y={VY - 330 * s + 4 * s} width={16 * s} height={10 * s} rx={3 * s} fill="#3a7fc4" />
        </g>
      )))}
      {[0.4, 0.5, 0.64, 0.86, 1.2, 1.8].map((s) => <rect key={s} x={VX - 60 * s} y={VY + CY * s + 4 * s} width={120 * s} height={14 * s} rx={7 * s} fill="#fffbea" />)}
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
      {[2.2, 1.5, 1.05, 0.78, 0.6, 0.48, 0.4, 0.34].map((s) => {
        const [x, y] = P(0, 0, s);
        return <ellipse key={s} cx={x} cy={y} rx={30 * s} ry={6 * s} fill={light(accent, 0.15)} opacity={0.35} />;
      })}
      {[2.2, 1.4, 0.95, 0.7, 0.55, 0.45, 0.38, 0.32].map((s) => {
        const [x, y] = P(0, CEIL, s);
        return <rect key={`c${s}`} x={x - 40 * s} y={y + 2} width={80 * s} height={10 * s} rx={5 * s} fill="#fffbea" />;
      })}
      {/* хвост: перегородка, шторка камбуза, табличка выхода */}
      <rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill={light(wall, 0.25)} />
      <polygon points={quad([[-150, 0, B], [150, 0, B], [150, 600, B], [-150, 600, B]])} fill={accent} />
      {[-100, -50, 0, 50, 100].map((X) => (
        <polygon key={X} points={quad([[X - 9, 0, B], [X + 9, 0, B], [X + 9, 600, B], [X - 9, 600, B]])} fill={dark(accent, 0.15)} />
      ))}
      <polygon points={quad([[-70, 680, B], [70, 680, B], [70, 740, B], [-70, 740, B]])} fill="#3fae6a" />
      {(() => {
        const [x, y] = P(0, 694, B);
        return <text x={x} y={y} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={900} fontSize={40 * B} fill="#ffffff">ВЫХОД</text>;
      })()}
      {/* табло «пристегните ремни» и тележка у шторки */}
      {[-260, 260].map((X) => {
        const [x, y] = P(X, 760, B);
        return (
          <g key={X}>
            <rect x={x - 30} y={y - 12} width={60} height={24} rx={6} fill="#2b2f36" />
            <circle cx={x - 14} cy={y} r={7} fill="#f2b84b" />
            <rect x={x + 2} y={y - 6} width={18} height={12} rx={3} fill="#f2b84b" opacity={0.6} />
          </g>
        );
      })}
      {(() => {
        const [x0, y0] = P(-170, 300, B);
        const [x1, y1] = P(-60, 0, B);
        return (
          <g>
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={4} fill="#c9ccd2" />
            <rect x={x0 + 4} y={y0 + 6} width={x1 - x0 - 8} height={4} fill="#8a8f98" />
            <rect x={x0 + 4} y={y0 + (y1 - y0) * 0.5} width={x1 - x0 - 8} height={3} fill="#8a8f98" />
            <rect x={x0 + 6} y={y0 - 10} width={8} height={10} rx={2} fill={RED} />
            <rect x={x0 + 16} y={y0 - 12} width={8} height={12} rx={2} fill="#4a7fb0" />
          </g>
        );
      })()}
      {/* иллюминаторы */}
      {winL.map((s) => {
        const [x, y] = P(L, 560, s);
        return (
          <g key={`l${s}`}>
            <ellipse cx={x} cy={y} rx={24 * s} ry={80 * s} fill={light(wall, 0.6)} />
            <ellipse cx={x} cy={y} rx={15 * s} ry={62 * s} fill={SKY} />
            <ellipse cx={x} cy={y + 26 * s} rx={13 * s} ry={14 * s} fill="#ffffff" />
            <rect x={x - 15 * s} y={y - 66 * s} width={30 * s} height={18 * s} fill={light(wall, 0.45)} />
          </g>
        );
      })}
      {winR.map((s) => {
        const [x, y] = P(R, 560, s);
        return (
          <g key={`r${s}`}>
            <ellipse cx={x} cy={y} rx={24 * s} ry={80 * s} fill={light(wall, 0.6)} />
            <ellipse cx={x} cy={y} rx={15 * s} ry={62 * s} fill={SKY} />
            <ellipse cx={x} cy={y + 26 * s} rx={13 * s} ry={14 * s} fill="#ffffff" />
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
            <rect x={x - 26} y={y - 120} width={52} height={22} rx={4} fill="#3fae6a" />
            <path d={`M${x - 16} ${y - 109} h14 m-6 -6 l6 6 l-6 6`} stroke="#ffffff" strokeWidth={3} fill="none" />
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
            {[1.1, 0.75, 0.54, 0.42].map((s) => {
              const [x, y] = P(Ex, (BIN + CEIL) / 2, s);
              return <rect key={`h${s}`} x={x - 6 * s} y={y - 22 * s} width={12 * s} height={44 * s} rx={6 * s} fill={dark(binFront, 0.22)} />;
            })}
            {[1.6, 1.0, 0.7, 0.52, 0.42, 0.35].map((s) => {
              const [x, y] = P((Wl + Ex) / 2, BIN, s);
              const [xv] = P((Wl + Ex) / 2 + k * 60, BIN, s);
              return (
                <g key={`l${s}`}>
                  <circle cx={x} cy={y + 6 * s} r={9 * s} fill="#fff4c8" />
                  <circle cx={xv} cy={y + 6 * s} r={7 * s} fill={dark(binBottom, 0.3)} />
                </g>
              );
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
        <circle cx={860} cy={420} r={120} fill="#fff8dc" opacity={0.25} />
        <circle cx={860} cy={420} r={70} fill="#fff8dc" opacity={0.35} />
        <circle cx={860} cy={420} r={34} fill="#fff4c8" />
        <path d="M860 420 L560 700" stroke="#ffffff" strokeWidth={3} opacity={0.4} />
        {[[740, 530, 16], [660, 605, 10], [610, 652, 22]].map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="none" stroke="#fff8dc" strokeWidth={3} opacity={0.5} />)}
        {/* земля далеко внизу в разрывах облаков */}
        <rect x={0} y={760} width={W} height={20} fill="#8fb8a0" opacity={0.5} />
        <Birds items={[[260, 600, 0.9], [292, 616, 0.7]]} color="#5a6a80" />
      </g>
      {/* блик на стекле */}
      <path d="M190 740 L300 380 H330 L220 740 Z" fill="#ffffff" opacity={0.12} />
      <path d="M590 740 L700 380 H716 L606 740 Z" fill="#ffffff" opacity={0.1} />
      {/* стойки рамы */}
      {[309, 540, 771].map((x) => <rect key={x} x={x - 10} y={winTop - 20} width={20} height={winBot - winTop + 30} fill={dark(shell, 0.35)} />)}
      {/* резервный компас по центру рамы */}
      <rect x={520} y={winTop - 18} width={40} height={30} rx={6} fill="#1d2128" />
      <circle cx={540} cy={winTop - 2} r={10} fill="#e8e4d8" />
      {/* боковые стены: слева форточка, справа дверь в салон */}
      <path d={`M0 250 L130 ${winTop + 20} V1190 L0 1300 Z`} fill={dark(shell, 0.1)} />
      <path d={`M20 420 L110 450 V640 L20 650 Z`} fill={sky} />
      <path d={`M20 560 L110 540 V640 L20 650 Z`} fill="#f7fbff" opacity={0.7} />
      {/* панель с тумблерами и планшет с картой на левой стене */}
      <path d="M16 700 L116 690 V880 L16 900 Z" fill={panel} />
      {Array.from({ length: 4 }).flatMap((_, r) => [0, 1, 2].map((c) => (
        <g key={`${r}-${c}`}>
          <rect x={30 + c * 28} y={712 + r * 44} width={14} height={22} rx={4} fill="#8c94a0" />
          <rect x={33 + c * 28} y={708 + r * 44 + ((r + c) % 2) * 12} width={8} height={10} rx={3} fill={(r + c) % 3 === 0 ? "#f2b84b" : "#e8e4d8"} />
        </g>
      )))}
      <path d="M20 930 L110 920 V1060 L20 1076 Z" fill="#e8e4d8" />
      <path d="M28 944 L102 936 V950 L28 958 Z" fill="#c8553d" />
      {[970, 990, 1010, 1030].map((y) => <path key={y} d={`M30 ${y} L98 ${y - 8}`} stroke="#8c94a0" strokeWidth={4} />)}
      <rect x={58} y={914} width={20} height={14} rx={3} fill="#9aa1a6" />
      {/* наушники на крючке */}
      <path d="M80 1100 q-34 0 -34 40 v20 M80 1100 q34 0 34 40 v20" stroke="#1d2128" strokeWidth={8} fill="none" />
      <rect x={34} y={1150} width={24} height={36} rx={8} fill="#1d2128" />
      <rect x={102} y={1150} width={24} height={36} rx={8} fill="#1d2128" />
      <path d={`M${W} 250 L950 ${winTop + 20} V1190 L${W} 1300 Z`} fill={dark(shell, 0.1)} />
      <path d={`M965 560 L1066 520 V1270 L965 1186 Z`} fill={mix(shell, "#8a96a6", 0.4)} />
      <path d={`M985 610 L1046 588 V700 L985 712 Z`} fill={dark(shell, 0.3)} />
      <rect x={1044} y={900} width={14} height={60} rx={6} fill="#d8dde3" />
      <rect x={990} y={760} width={50} height={70} rx={4} fill="#e8e4d8" />
      <path d="M1000 772 h30 M1000 786 h30 M1000 800 h22" stroke="#8c94a0" strokeWidth={4} />
      <circle cx={1015} cy={1100} r={14} fill="#c8553d" />
      <rect x={1000} y={1124} width={30} height={50} rx={6} fill="#c8553d" />
      {/* козырёк с панелью автопилота */}
      <path d={`M120 ${winBot} Q540 ${winBot - 30} 960 ${winBot} V${winBot + 60} H120 Z`} fill={panel} />
      <rect x={380} y={winBot + 6} width={320} height={40} rx={8} fill="#3a404b" />
      {[400, 470, 560, 640].map((x) => <rect key={x} x={x} y={winBot + 16} width={46} height={20} rx={3} fill="#f2b84b" />)}
      {[200, 240, 280, 800, 840, 880].map((x, i) => <circle key={x} cx={x} cy={winBot + 30} r={9} fill={i % 2 ? "#e8e4d8" : "#8c94a0"} />)}
      <rect x={724} y={winBot - 6} width={30} height={34} rx={5} fill="#f4f1ea" />
      <path d={`M754 ${winBot + 2} q14 4 0 18`} stroke="#f4f1ea" strokeWidth={5} fill="none" />
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
      {[160, 220, 280, 800, 860, 920].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={1040} r={22} fill="#e8e4d8" />
          <circle cx={x} cy={1040} r={17} fill={screen} />
          <path d={`M${x} 1040 L${x + (i % 2 ? 12 : -8)} ${1030 - (i % 3) * 3}`} stroke={i % 3 === 0 ? "#5fb878" : "#f2b84b"} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={340 + i * 52} y={1072} width={30} height={14} rx={4} fill={i % 3 === 1 ? "#f2b84b" : "#8c94a0"} />)}
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
      <polygon points={quad([[-80, 0, N], [-70, 0, N], [-70, 0, B], [-80, 0, B]])} fill={light(accent, 0.2)} />
      <polygon points={quad([[70, 0, N], [80, 0, N], [80, 0, B], [70, 0, B]])} fill={light(accent, 0.2)} />
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
        {/* столбы с проводами, берёзы, смазанные полосы движения */}
        <path d={`M${wx0} ${wy0 + 90} Q${(wx0 + wx1) / 2} ${wy0 + 112} ${wx1} ${wy0 + 90} M${wx0} ${wy0 + 104} Q${(wx0 + wx1) / 2} ${wy0 + 126} ${wx1} ${wy0 + 104}`} stroke="#3a3a40" strokeWidth={2} fill="none" />
        <rect x={wx1 - 70} y={wy0 + 80} width={6} height={wy1 - wy0} fill="#7a5a40" />
        <rect x={wx1 - 84} y={wy0 + 86} width={34} height={5} fill="#7a5a40" />
        {[wx0 + 40, wx0 + 230].map((bx, i) => (
          <g key={bx}>
            <rect x={bx} y={wy1 - 150 + i * 20} width={9} height={150} fill="#f2f2f2" />
            {[30, 70, 110].map((d) => <rect key={d} x={bx} y={wy1 - 150 + i * 20 + d} width={5} height={4} fill="#2b1d14" />)}
            <ellipse cx={bx + 4} cy={wy1 - 160 + i * 20} rx={34} ry={40} fill="#8fbf5a" />
          </g>
        ))}
        {[0.72, 0.8, 0.88].map((k) => <rect key={k} x={wx0 + 20} y={wy0 + (wy1 - wy0) * k} width={(wx1 - wx0) * 0.6} height={3} rx={2} fill="#ffffff" opacity={0.4} />)}
      </g>
      {/* плафон над окном */}
      {(() => {
        const [lx, ly] = P(0, 760, B);
        return (
          <g>
            <rect x={lx - 50} y={ly - 16} width={100} height={30} rx={14} fill="#fff4c8" />
            <rect x={lx - 56} y={ly - 22} width={112} height={10} rx={5} fill={dark(WOOD, 0.2)} />
          </g>
        );
      })()}
      {/* крючки с полотенцем и курткой у окна */}
      {(() => {
        const [hx, hy] = P(-300, 600, B);
        const [jx, jy] = P(300, 600, B);
        return (
          <g>
            <rect x={hx - 10} y={hy - 6} width={20} height={10} rx={4} fill="#9aa1a6" />
            <path d={`M${hx - 22} ${hy} h44 v110 l-8 8 h-28 l-8 -8 z`} fill="#f4f1ea" />
            <rect x={hx - 22} y={hy + 80} width={44} height={8} fill={RED} />
            <rect x={jx - 10} y={jy - 6} width={20} height={10} rx={4} fill="#9aa1a6" />
            <path d={`M${jx - 30} ${jy + 4} q30 -16 60 0 l6 140 h-72 z`} fill="#5a6a7a" />
            <path d={`M${jx} ${jy} v144`} stroke={dark("#5a6a7a", 0.3)} strokeWidth={3} />
          </g>
        );
      })()}
      {/* занавески */}
      <path d={`M${wx0 - 24} ${wy0 - 8} H${wx0 + 40} Q${wx0 + 16} ${(wy0 + wy1) / 2} ${wx0 + 34} ${wy1 - 10} Q${wx0} ${wy1 + 6} ${wx0 - 24} ${wy1 - 10} Z`} fill={accent} />
      <path d={`M${wx1 + 24} ${wy0 - 8} H${wx1 - 40} Q${wx1 - 16} ${(wy0 + wy1) / 2} ${wx1 - 34} ${wy1 - 10} Q${wx1} ${wy1 + 6} ${wx1 + 24} ${wy1 - 10} Z`} fill={accent} />
      <rect x={wx0 - 36} y={wy0 - 14} width={wx1 - wx0 + 72} height={10} rx={5} fill={dark(WOOD, 0.2)} />
      {[0.15, 0.35, 0.55, 0.75].flatMap((k) => [wx0 - 6, wx1 + 6].map((cx) => <circle key={`${k}${cx}`} cx={cx} cy={wy0 + (wy1 - wy0) * k} r={5} fill={light(accent, 0.4)} />))}
      <rect x={wx0 - 8} y={wy0 + (wy1 - wy0) * 0.45} width={16} height={8} rx={4} fill={light(accent, 0.3)} />
      <rect x={wx1 - 8} y={wy0 + (wy1 - wy0) * 0.45} width={16} height={8} rx={4} fill={light(accent, 0.3)} />
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
            <ellipse cx={px - 10} cy={py - 8} rx={8} ry={10} fill="#f7f0de" />
            <ellipse cx={px + 10} cy={py - 8} rx={8} ry={10} fill="#f7f0de" />
            <path d={`M${cx - 80} ${cy - 4} l50 -6 l10 8 l-50 6 z`} fill="#e8e4d8" />
            <path d={`M${cx - 74} ${cy - 6} l36 -4`} stroke="#8a8f98" strokeWidth={2} />
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
                  {k > 0 && (
                    <g>
                      <rect x={mx - 120} y={my - 80} width={70} height={80} rx={8} fill="#8a5a3a" />
                      <rect x={mx - 120} y={my - 50} width={70} height={6} fill={dark("#8a5a3a", 0.3)} />
                      <rect x={mx - 98} y={my - 90} width={26} height={10} rx={4} fill={dark("#8a5a3a", 0.3)} />
                    </g>
                  )}
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
      <rect x={0} y={600} width={W} height={220} fill={light(sky, 0.25)} />
      <circle cx={850} cy={540} r={96} fill="#f7e3a0" opacity={0.3} />
      <circle cx={850} cy={540} r={64} fill="#f7e3a0" />
      <Puff x={60} y={560} s={0.5} color={light(sky, 0.7)} under={light(sky, 0.5)} />
      <Puff x={560} y={120} s={0.4} color={light(sky, 0.5)} under={light(sky, 0.35)} opacity={0.8} />
      <Puff x={480} y={740} s={0.25} color={light(sky, 0.7)} />
      <path d="M300 660 q20 -22 40 0 q20 -22 40 0" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M640 620 q14 -16 28 0 q14 -16 28 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Birds items={[[560, 700, 0.7], [600, 716, 0.6], [240, 740, 0.6]]} color={INK} />
      {/* остров с маяком, парусник, пароход на горизонте */}
      <path d="M640 822 Q700 770 780 790 Q840 760 920 822 Z" fill={mix(sea, "#6f9e5a", 0.5)} />
      <rect x={846} y={712} width={20} height={80} fill={WHITE} />
      <rect x={846} y={732} width={20} height={14} fill={RED} />
      <rect x={846} y={762} width={20} height={14} fill={RED} />
      <rect x={842} y={698} width={28} height={16} rx={4} fill="#f2b84b" />
      <path d="M840 700 l16 -16 l16 16 z" fill={RED} />
      <g transform="translate(400 0)">
        <path d="M110 812 h120 l-14 14 h-92 z" fill={dark(sea, 0.4)} />
        <rect x={140} y={790} width={50} height={22} fill={WHITE} />
        <rect x={168} y={770} width={14} height={22} fill={RED} />
        <path d="M175 768 q20 -20 50 -16 q30 4 46 -14" stroke={light(sky, 0.4)} strokeWidth={10} fill="none" strokeLinecap="round" />
      </g>
      <rect x={0} y={820} width={W} height={260} fill={sea} />
      <rect x={0} y={820} width={W} height={60} fill={dark(sea, 0.1)} />
      <rect x={0} y={820} width={W} height={10} fill={light(sea, 0.25)} />
      <g>
        <path d="M380 900 h90 l-12 14 h-66 z" fill={WHITE} />
        <rect x={423} y={810} width={4} height={90} fill="#5a4636" />
        <path d="M428 814 L470 892 H428 Z" fill={WHITE} />
        <path d="M420 826 L388 892 H420 Z" fill={light(RED, 0.3)} />
      </g>
      {[[120, 880], [420, 860], [760, 900], [260, 960], [600, 990], [920, 950], [40, 1020], [520, 930], [840, 1030]].map(([x, y], i) => (
        <path key={`${x}`} d={`M${x} ${y} q${18 + i * 2} -10 ${36 + i * 4} 0 q${18 + i * 2} 10 ${36 + i * 4} 0`} stroke={light(sea, 0.45)} strokeWidth={6} fill="none" strokeLinecap="round" />
      ))}
      <path d="M700 870 q40 14 140 6" stroke="#fff8dc" strokeWidth={8} opacity={0.5} fill="none" strokeLinecap="round" />
      <path d="M740 900 q30 10 90 4" stroke="#fff8dc" strokeWidth={6} opacity={0.4} fill="none" strokeLinecap="round" />
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
      {/* контейнер спасательного плота на леере, бухта каната, флаг */}
      <rect x={450} y={922} width={110} height={56} rx={28} fill={WHITE} />
      <rect x={500} y={922} width={10} height={56} fill="#c9ccd2" />
      <rect x={466} y={976} width={10} height={20} fill="#8a8f98" />
      <rect x={534} y={976} width={10} height={20} fill="#8a8f98" />
      <g transform={`translate(985 ${FLOOR_Y})`}>
        <ellipse cx={0} cy={-14} rx={56} ry={18} fill="#c9a66a" />
        <ellipse cx={0} cy={-22} rx={44} ry={13} fill="#d9b880" />
        <ellipse cx={0} cy={-28} rx={30} ry={9} fill="#c9a66a" />
        <ellipse cx={0} cy={-30} rx={14} ry={4} fill="#8a6a3a" />
      </g>
      <rect x={232} y={700} width={8} height={300} fill={WHITE} />
      <path d="M240 704 h70 l-12 22 l12 22 h-70 z" fill={RED} />
      <path d="M240 718 h60 v14 h-60 z" fill={WHITE} />
      {Array.from({ length: 18 }).map((_, i) => <circle key={i} cx={20 + i * 60} cy={1070} r={4} fill={dark(deck, 0.25)} />)}
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

/** Окно зала на лётное поле: самолёт, диспетчерская вышка. */
const FieldWindow = ({ x, plane = false, tower = false, wall }: { x: number; plane?: boolean; tower?: boolean; wall: string }) => {
  const id = `samolet-hall-${x}`;
  return (
    <g>
      <rect x={x} y={700} width={180} height={300} rx={8} fill={light(wall, 0.4)} />
      <defs><clipPath id={id}><rect x={x + 14} y={714} width={152} height={272} rx={4} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={700} width={180} height={300} fill={SKY} />
        <rect x={x} y={900} width={180} height={100} fill="#9aa1a6" />
        <rect x={x} y={892} width={180} height={10} fill="#8fb86a" />
        <rect x={x} y={950} width={180} height={4} fill="#f2e6d0" />
        <Puff x={x + 20} y={760} s={0.22} color="#ffffff" />
        {tower && (
          <g>
            <rect x={x + 110} y={800} width={18} height={100} fill="#c9ccd2" />
            <path d={`M${x + 96} 800 h46 l-6 -30 h-34 z`} fill="#5a6470" />
            <rect x={x + 102} y={778} width={34} height={14} fill="#8fd0ef" />
          </g>
        )}
        {plane && (
          <g transform={`translate(${x + 90} 905)`}>
            <path d="M-90 -12 Q-90 -30 -60 -30 H70 Q90 -30 96 -14 L100 0 H-90 Z" fill="#f4f1ea" />
            <path d="M60 -30 L90 -64 H104 L92 -24 Z" fill="#4a6fa5" />
            <path d="M-20 -8 L30 -8 L-10 18 H-30 Z" fill="#d8dde3" />
            {[-60, -44, -28, -12, 4, 20, 36].map((d) => <circle key={d} cx={d} cy={-20} r={3} fill="#4a6fa5" />)}
            <rect x={-80} y={0} width={6} height={12} fill="#3a3f47" />
            <rect x={60} y={0} width={6} height={12} fill="#3a3f47" />
          </g>
        )}
      </g>
      <rect x={x + 84} y={714} width={12} height={272} fill={light(wall, 0.4)} />
    </g>
  );
};

const Hall = ({ wall, floor, accent }: P) => {
  const board = "#2b2f36";
  const rows: [string, string, string, string][] = [
    ["08:15", "МОСКВА", "3", "ПОСАДКА"],
    ["09:40", "СОЧИ", "5", "ЗАДЕРЖАН"],
    ["10:05", "КАЗАНЬ", "1", "ПО ПЛАНУ"],
    ["11:30", "ПЕРМЬ", "4", "РЕГИСТРАЦИЯ"],
    ["12:50", "ОМСК", "2", "ПО ПЛАНУ"],
  ];
  return (
    <>
      <Room wall={wall} floor={floor} />
      {/* пол плиткой */}
      {[1230, 1290, 1370, 1470, 1600, 1760].map((y) => <rect key={y} x={0} y={y} width={W} height={4} fill="#00000012" />)}
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${540 + (i - 4) * 70} ${FLOOR_Y} L${540 + (i - 4) * 320} ${H}`} stroke="#00000010" strokeWidth={4} />)}
      <ellipse cx={540} cy={1500} rx={300} ry={40} fill="#ffffff" opacity={0.08} />
      <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={dark(wall, 0.07)} />
      <rect x={0} y={880} width={W} height={8} fill={dark(wall, 0.15)} />
      {/* колонны */}
      {[250, 820].map((x) => (
        <g key={x}>
          <rect x={x - 16} y={0} width={32} height={FLOOR_Y} fill={light(wall, 0.18)} />
          <rect x={x - 22} y={FLOOR_Y - 30} width={44} height={30} fill={dark(wall, 0.12)} />
        </g>
      ))}
      {/* большие окна к лётному полю */}
      <FieldWindow x={40} wall={wall} plane />
      <FieldWindow x={860} wall={wall} tower />
      {/* табло отправлений */}
      <rect x={188} y={438} width={720} height={250} rx={14} fill="#00000025" />
      <rect x={180} y={430} width={720} height={250} rx={14} fill={board} />
      <rect x={196} y={446} width={688} height={36} rx={6} fill={accent} />
      <text x={540} y={473} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={900} fontSize={24} fill="#ffffff" letterSpacing={3}>ОТПРАВЛЕНИЕ</text>
      {rows.map(([t, city, gate, st], i) => {
        const y = 500 + i * 34;
        const c = st === "ЗАДЕРЖАН" ? RED : st === "ПОСАДКА" ? "#5fb878" : st === "РЕГИСТРАЦИЯ" ? "#f2b84b" : "#e8e4d8";
        return (
          <g key={t}>
            <rect x={196} y={y - 2} width={688} height={28} fill={i % 2 ? "#ffffff08" : "#00000000"} />
            <Label x={206} y={y + 19} text={t} size={20} color="#f2b84b" anchor="start" spacing={0} />
            <Label x={300} y={y + 19} text={city} size={20} color="#e8e4d8" anchor="start" />
            <Label x={640} y={y + 19} text={gate} size={20} color="#e8e4d8" />
            <Label x={874} y={y + 19} text={st} size={16} color={c} anchor="end" />
          </g>
        );
      })}
      {/* часы */}
      <circle cx={990} cy={520} r={56} fill={INK} />
      <circle cx={990} cy={520} r={46} fill="#f7f3e8" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return <rect key={i} x={990 + 38 * Math.sin(a) - 2} y={520 - 38 * Math.cos(a) - 4} width={4} height={8} fill={INK} transform={`rotate(${i * 30} ${990 + 38 * Math.sin(a)} ${520 - 38 * Math.cos(a)})`} />;
      })}
      <path d="M990 520 L990 488 M990 520 L1014 530" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {/* указатели к выходам */}
      <rect x={20} y={560} width={150} height={50} rx={8} fill="#f2b84b" />
      <Label x={78} y={594} text="ВЫХОД 1–3" size={18} color={INK} spacing={0} />
      <path d="M140 572 l18 13 l-18 13 z" fill={INK} />
      <rect x={60} y={440} width={4} height={120} fill="#8a8f98" />
      <rect x={130} y={440} width={4} height={120} fill="#8a8f98" />
      {/* растения в кадках у колонн */}
      {[[250, 0.8], [820, 0.8]].map(([x, k]) => (
        <g key={x} transform={`translate(${x} ${FLOOR_Y}) scale(${k})`}>
          <path d="M-40 -90 H40 L30 0 H-30 Z" fill={dark(accent, 0.25)} />
          <path d="M0 -90 Q-60 -170 -70 -230 Q-20 -180 0 -90 Z M0 -90 Q60 -180 50 -250 Q20 -170 0 -90 Z M0 -90 Q-10 -200 10 -270 Q20 -180 0 -90 Z" fill="#4f8350" />
        </g>
      ))}
      {/* ряды кресел у стены (дальний план): bench-1, bench-2 слева, bench-3, bench-4 справа */}
      <SeatRow xs={[0.18, 0.32]} z={1} accent={accent} />
      <SeatRow xs={[0.68, 0.82]} z={1} accent={accent} />
      {/* чемодан у ряда кресел, урна */}
      <g transform={`translate(440 ${FLOOR_Y}) scale(0.8)`}>
        <rect x={0} y={-190} width={110} height={180} rx={16} fill={RED} />
        <rect x={0} y={-130} width={110} height={10} fill={dark(RED, 0.2)} />
        <rect x={20} y={-170} width={30} height={20} rx={4} fill="#f2e6d0" />
        <rect x={40} y={-250} width={8} height={60} fill={INK} />
        <rect x={62} y={-250} width={8} height={60} fill={INK} />
        <rect x={40} y={-254} width={30} height={10} rx={4} fill={INK} />
        <circle cx={18} cy={-6} r={10} fill={INK} />
        <circle cx={92} cy={-6} r={10} fill={INK} />
      </g>
      <g transform={`translate(1050 ${FLOOR_Y})`}>
        <rect x={-22} y={-90} width={44} height={90} rx={8} fill="#8a8f98" />
        <rect x={-26} y={-96} width={52} height={14} rx={6} fill="#5a6470" />
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
