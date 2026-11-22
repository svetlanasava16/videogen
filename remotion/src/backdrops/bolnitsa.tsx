import type { ReactElement } from "react";
import { Canvas, Room, Window, Door, Plant, FLOOR_Y, W, H, type BackdropProps } from "./parts";
import { SeatAt, BenchAt } from "./gostinaya";
import { feetY, seatTopY } from "../world/depth";

/**
 * Фон «bolnitsa»: кабинет врача; варианты waiting-room (коридор поликлиники с очередью), hospital (палата),
 * madhouse (палата с мягкими стенами). Сиденья нарисованы под метки content/locations/bolnitsa.json.
 *
 * Передний слой (layer="front", front.z в JSON): в кабинете — стол врача (z 0.9; врач на стуле desk за ним по пояс,
 * стул пациента patient-chair перед столом тоже в переднем слое), в коридоре — окошко регистратуры (z 0.97; регистратор
 * на метке reception за стеклом и стойкой по грудь). Палата и мягкая палата переднего слоя не имеют.
 *
 * В начале файла — набор деталей «интерьера» (тени, градиенты стены и пола, плитка, паркет, светильники, часы,
 * календарь), им пользуются и соседние фоны ofis / klass / zal / tserkov.
 */

/* ======================= набор деталей ======================= */

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
const sid = (s: string) => s.replace(/[^a-z0-9]/gi, "");

/** Детерминированный «шум» 0..1. */
export const rnd = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Мягкий свет сверху и тень у пола на стене: дальняя стена светлее вверху. */
export const WallShade = ({ y0 = 0, y1 = FLOOR_Y, top = 0.22, bottom = 0.1, x0 = 0, x1 = W }: { y0?: number; y1?: number; top?: number; bottom?: number; x0?: number; x1?: number }) => {
  const id = `wsh${Math.round(top * 100)}_${Math.round(bottom * 100)}`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={top} />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={bottom} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${id})`} />
    </>
  );
};

/** Пол темнеет к камере. */
export const FloorShade = ({ y0 = FLOOR_Y, strength = 0.24 }: { y0?: number; strength?: number }) => {
  const id = `fsh${Math.round(strength * 100)}`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.06} />
          <stop offset="0.25" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={strength} />
        </linearGradient>
      </defs>
      <rect x={0} y={y0} width={W} height={H - y0} fill={`url(#${id})`} />
    </>
  );
};

/** Круглое мягкое свечение (лампа, свеча, окно). */
export const Glow = ({ cx, cy, rx, ry, color = "#fff4cf", opacity = 0.45 }: { cx: number; cy: number; rx: number; ry?: number; color?: string; opacity?: number }) => {
  const id = `glw${sid(color)}`;
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={1} />
          <stop offset="0.45" stopColor={color} stopOpacity={0.35} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry ?? rx} fill={`url(#${id})`} opacity={opacity} />
    </>
  );
};

/** Тень на полу под предметом у стены. */
export const Shadow = ({ cx, w, y = FLOOR_Y, h = 14, o = 0.16 }: { cx: number; w: number; y?: number; h?: number; o?: number }) => (
  <ellipse cx={cx} cy={y} rx={w / 2} ry={h} fill="#000000" opacity={o} />
);

/** Перспектива пола: x на высоте y для линии, которая у нижнего края кадра стоит в X. */
export const persX = (X: number, y: number, k = 0.55) => W / 2 + (X - W / 2) * (k + (1 - k) * ((y - FLOOR_Y) / (H - FLOOR_Y)));
/** y n-го шва (0..rows) — ряды плитки растут к камере. */
const rowY = (n: number, rows: number, y0 = FLOOR_Y) => y0 + (H - y0) * Math.pow(n / rows, 1.45);

/** Плитка/линолеум в перспективе: шахматка двух близких тонов и тонкие швы. */
export const FloorTiles = ({ color, step = 200, rows = 7, checker = 0.045, seam = 0.1, y0 = FLOOR_Y, k = 0.55 }: { color: string; step?: number; rows?: number; checker?: number; seam?: number; y0?: number; k?: number }) => {
  const cols: number[] = [];
  for (let X = W / 2 - step * 9; X <= W / 2 + step * 9; X += step) cols.push(X);
  const px = (X: number, y: number) => W / 2 + (X - W / 2) * (k + (1 - k) * ((y - y0) / (H - y0)));
  const ry = (n: number) => rowY(n, rows, y0);
  const cells: ReactElement[] = [];
  if (checker > 0) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols.length - 1; c++) {
        if ((r + c) % 2) continue;
        const a = ry(r);
        const b = ry(r + 1);
        cells.push(<path key={`${r}-${c}`} d={`M${px(cols[c], a)} ${a} L${px(cols[c + 1], a)} ${a} L${px(cols[c + 1], b)} ${b} L${px(cols[c], b)} ${b} Z`} />);
      }
  }
  const sc = dark(color, 0.3);
  return (
    <g>
      <g fill={light(color, 0.5)} opacity={checker}>{cells}</g>
      <g stroke={sc} strokeWidth={3} opacity={seam}>
        {cols.map((X) => <line key={X} x1={px(X, y0)} y1={y0} x2={X} y2={H} />)}
        {Array.from({ length: rows }).map((_, n) => <line key={n} x1={0} y1={ry(n + 1)} x2={W} y2={ry(n + 1)} />)}
      </g>
    </g>
  );
};

/** Паркет/доски в перспективе: продольные швы к камере и редкие поперечные стыки. */
export const FloorPlanks = ({ color, step = 80, rows = 10, o = 0.14, y0 = FLOOR_Y, k = 0.55 }: { color: string; step?: number; rows?: number; o?: number; y0?: number; k?: number }) => {
  const px = (X: number, y: number) => W / 2 + (X - W / 2) * (k + (1 - k) * ((y - y0) / (H - y0)));
  const cols: number[] = [];
  for (let X = W / 2 - step * 13; X <= W / 2 + step * 13; X += step) cols.push(X);
  const sc = dark(color, 0.35);
  return (
    <g>
      <g stroke={sc} strokeWidth={3} opacity={o}>
        {cols.map((X) => <line key={X} x1={px(X, y0)} y1={y0} x2={X} y2={H} />)}
      </g>
      <g stroke={sc} strokeWidth={3} opacity={o}>
        {cols.slice(0, -1).map((X, c) =>
          Array.from({ length: rows }).map((_, r) => {
            if (rnd(c * 31 + r * 7) > 0.42) return null;
            const y = rowY(r + rnd(c + r * 13) * 0.8, rows, y0);
            return <line key={`${c}-${r}`} x1={px(X, y)} y1={y} x2={px(cols[c + 1], y)} y2={y} />;
          }),
        )}
      </g>
      <g fill={light(color, 0.4)} opacity={o * 0.5}>
        {cols.slice(0, -1).map((X, c) => (c % 3 === 1 ? <path key={c} d={`M${px(X, y0)} ${y0} L${px(cols[c + 1], y0)} ${y0} L${cols[c + 1]} ${H} L${X} ${H} Z`} /> : null))}
      </g>
    </g>
  );
};

/** Кафельная стена (низ стены) — сетка швов. */
export const WallTiles = ({ y0, y1 = FLOOR_Y, color, size = 60, x0 = 0, x1 = W, o = 0.22 }: { y0: number; y1?: number; color: string; size?: number; x0?: number; x1?: number; o?: number }) => (
  <g>
    <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={color} />
    <g stroke={dark(color, 0.25)} strokeWidth={3} opacity={o}>
      {Array.from({ length: Math.ceil((y1 - y0) / size) }).map((_, i) => <line key={`h${i}`} x1={x0} y1={y0 + (i + 1) * size} x2={x1} y2={y0 + (i + 1) * size} />)}
      {Array.from({ length: Math.ceil((x1 - x0) / size) }).map((_, i) => <line key={`v${i}`} x1={x0 + (i + 1) * size} y1={y0} x2={x0 + (i + 1) * size} y2={y1} />)}
    </g>
    <rect x={x0} y={y0} width={x1 - x0} height={6} fill="#ffffff" opacity={0.25} />
  </g>
);

/** Плинтус. */
export const Baseboard = ({ color, h = 22, y = FLOOR_Y }: { color: string; h?: number; y?: number }) => (
  <>
    <rect x={0} y={y - h} width={W} height={h} fill={color} />
    <rect x={0} y={y - h} width={W} height={4} fill="#ffffff" opacity={0.2} />
  </>
);

/** Потолочная лампа дневного света (выше плашки рассказчика) с мягким ореолом. */
export const CeilingPanel = ({ x, w = 260, y = 0, h = 30, color = "#f7f4ea" }: { x: number; w?: number; y?: number; h?: number; color?: string }) => (
  <g>
    <Glow cx={x + w / 2} cy={y + h + 10} rx={w * 0.9} ry={150} color="#fffbe8" opacity={0.5} />
    <rect x={x - 6} y={y} width={w + 12} height={h + 8} rx={6} fill={dark(color, 0.18)} />
    <rect x={x} y={y} width={w} height={h} rx={5} fill={color} />
    <rect x={x + 8} y={y + h - 8} width={w - 16} height={4} rx={2} fill="#ffffff" />
  </g>
);

/** Настенные часы. */
export const Clock = ({ cx, cy, r = 50, rim = "#2b2a2e", face = "#f7f3e8", hand = "#2b2a2e", h = 10, m = 2 }: { cx: number; cy: number; r?: number; rim?: string; face?: string; hand?: string; h?: number; m?: number }) => {
  const ha = ((h % 12) / 12 + m / 720) * Math.PI * 2;
  const ma = (m / 60) * Math.PI * 2;
  return (
    <g>
      <circle cx={cx + 5} cy={cy + 7} r={r} fill="#000000" opacity={0.12} />
      <circle cx={cx} cy={cy} r={r} fill={rim} />
      <circle cx={cx} cy={cy} r={r * 0.84} fill={face} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const big = i % 3 === 0;
        return <circle key={i} cx={cx + Math.sin(a) * r * 0.68} cy={cy - Math.cos(a) * r * 0.68} r={big ? r * 0.06 : r * 0.035} fill={hand} opacity={0.8} />;
      })}
      <line x1={cx} y1={cy} x2={cx + Math.sin(ha) * r * 0.4} y2={cy - Math.cos(ha) * r * 0.4} stroke={hand} strokeWidth={r * 0.11} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.sin(ma) * r * 0.6} y2={cy - Math.cos(ma) * r * 0.6} stroke={hand} strokeWidth={r * 0.07} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r * 0.08} fill="#c8553d" />
    </g>
  );
};

/** Отрывной/перекидной календарь: шапка цвета accent, сетка дней, один обведён. */
export const Calendar = ({ x, y, w = 130, h = 160, accent, pic }: { x: number; y: number; w?: number; h?: number; accent: string; pic?: string }) => {
  const gx = x + 12;
  const gy = y + h * 0.5;
  const cw = (w - 24) / 7;
  const ch = (h * 0.5 - 14) / 5;
  return (
    <g>
      <rect x={x + 5} y={y + 7} width={w} height={h} rx={4} fill="#000000" opacity={0.12} />
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#fbf8f0" />
      <rect x={x} y={y} width={w} height={h * 0.42} rx={4} fill={pic ?? light(accent, 0.3)} />
      {pic && <path d={`M${x} ${y + h * 0.42} L${x + w * 0.35} ${y + h * 0.2} L${x + w * 0.6} ${y + h * 0.34} L${x + w * 0.8} ${y + h * 0.24} L${x + w} ${y + h * 0.36} V${y + h * 0.42} Z`} fill={dark(pic, 0.25)} />}
      <rect x={x} y={y + h * 0.42} width={w} height={8} fill={accent} />
      {Array.from({ length: 35 }).map((_, i) => (
        <rect key={i} x={gx + (i % 7) * cw + 2} y={gy + Math.floor(i / 7) * ch + 2} width={cw - 5} height={ch - 5} rx={1.5} fill={i % 7 >= 5 ? "#e0a49a" : "#d6d0c2"} />
      ))}
      <circle cx={gx + 3 * cw + cw / 2 - 1} cy={gy + 2 * ch + ch / 2 - 1} r={cw * 0.75} fill="none" stroke="#c8553d" strokeWidth={3} />
      <rect x={x + w / 2 - 6} y={y - 8} width={12} height={12} rx={6} fill="#555" />
    </g>
  );
};

/** Листок на кнопке (объявление): полоски-строки, без текста. */
export const Note = ({ x, y, w = 90, h = 110, tilt = 0, color = "#fbf8f0", pin = "#c8553d", lines = 5 }: { x: number; y: number; w?: number; h?: number; tilt?: number; color?: string; pin?: string; lines?: number }) => (
  <g transform={`rotate(${tilt} ${x + w / 2} ${y + h / 2})`}>
    <rect x={x + 3} y={y + 5} width={w} height={h} fill="#000000" opacity={0.1} />
    <rect x={x} y={y} width={w} height={h} fill={color} />
    {Array.from({ length: lines }).map((_, i) => (
      <rect key={i} x={x + 10} y={y + 20 + i * ((h - 30) / lines)} width={(w - 20) * (i === 0 ? 0.7 : 0.6 + rnd(x + i) * 0.4)} height={5} rx={2.5} fill="#9a958a" opacity={i === 0 ? 0.9 : 0.55} />
    ))}
    <circle cx={x + w / 2} cy={y + 8} r={6} fill={pin} />
  </g>
);

/** Батарея отопления под окном. */
export const Radiator = ({ x, w, y = FLOOR_Y - 150, h = 110, color = "#efece4" }: { x: number; w: number; y?: number; h?: number; color?: string }) => {
  const n = Math.max(3, Math.floor(w / 26));
  return (
    <g>
      <rect x={x} y={y + 10} width={w} height={h - 20} rx={6} fill={dark(color, 0.12)} />
      {Array.from({ length: n }).map((_, i) => (
        <rect key={i} x={x + i * (w / n) + 2} y={y} width={w / n - 6} height={h} rx={8} fill={color} />
      ))}
      <rect x={x + 10} y={y + h} width={8} height={FLOOR_Y - y - h} fill={dark(color, 0.2)} />
      <rect x={x + w - 18} y={y + h} width={8} height={FLOOR_Y - y - h} fill={dark(color, 0.2)} />
    </g>
  );
};

/* ======================= больница ======================= */

const WHITE = "#f4f1ea";
const METAL = "#9aa6aa";
const WOOD = "#a8774f";
const BONE = "#efe6cf";
const INK = "#2b2a2e";
const RED = "#c8553d";

/** Нижняя панель стены — кафель с полоской акцента. */
const Wainscot = ({ wall, accent }: { wall: string; accent: string }) => (
  <>
    <WallTiles y0={880} color={mix(wall, "#ffffff", 0.18)} size={62} o={0.35} />
    <rect x={0} y={866} width={W} height={14} fill={accent} />
    <Baseboard color={dark(accent, 0.35)} h={20} />
  </>
);

/** Потолок клиники: карниз и лампы дневного света. */
const ClinicCeiling = ({ wall, lamps }: { wall: string; lamps: number[] }) => (
  <>
    <rect x={0} y={0} width={W} height={46} fill={light(wall, 0.35)} />
    <rect x={0} y={46} width={W} height={8} fill={dark(wall, 0.12)} />
    {lamps.map((x) => <CeilingPanel key={x} x={x - 120} w={240} y={10} h={26} />)}
  </>
);

/** Таблица для проверки зрения: ряды кружков-«колечек» и плашек, без букв. */
const EyeChart = ({ x, y, accent }: { x: number; y: number; accent: string }) => {
  const w = 190;
  const rows = [
    { n: 1, s: 46 },
    { n: 2, s: 30 },
    { n: 3, s: 22 },
    { n: 4, s: 16 },
    { n: 5, s: 12 },
    { n: 6, s: 9 },
  ];
  let yy = y + 26;
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={276} rx={10} fill="#00000018" />
      <rect x={x} y={y} width={w} height={276} rx={10} fill={WHITE} />
      {rows.map((r, ri) => {
        const gap = r.s * 0.7;
        const total = r.n * r.s + (r.n - 1) * gap;
        const x0 = x + (w - total) / 2;
        const cy = yy + r.s / 2;
        yy += r.s + 14;
        return (
          <g key={ri}>
            {Array.from({ length: r.n }).map((_, i) => {
              const cx = x0 + i * (r.s + gap) + r.s / 2;
              return (i + ri) % 2 === 0 ? (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r.s / 2} fill={INK} />
                  <circle cx={cx} cy={cy} r={r.s / 4} fill={WHITE} />
                  <rect x={cx} y={cy - r.s / 10} width={r.s / 2 + 1} height={r.s / 5} fill={WHITE} />
                </g>
              ) : (
                <rect key={i} x={cx - r.s / 2} y={cy - r.s / 2} width={r.s} height={r.s} rx={r.s * 0.2} fill={INK} />
              );
            })}
            {ri === 3 && <rect x={x + 18} y={cy + r.s / 2 + 5} width={w - 36} height={3} fill={RED} />}
          </g>
        );
      })}
      <rect x={x} y={y + 252} width={w} height={24} rx={0} fill={accent} opacity={0.6} />
    </g>
  );
};

/** Учебный скелет на стойке. */
const Skeleton = ({ cx }: { cx: number }) => {
  const top = FLOOR_Y - 610;
  const bone = { stroke: BONE, strokeLinecap: "round" as const, fill: "none" };
  return (
    <g>
      <Shadow cx={cx} w={170} o={0.18} />
      {/* стойка */}
      <rect x={cx - 5} y={top - 30} width={10} height={610} fill={dark(METAL, 0.3)} />
      <rect x={cx - 70} y={FLOOR_Y - 18} width={140} height={18} rx={9} fill={dark(METAL, 0.35)} />
      {/* череп */}
      <circle cx={cx} cy={top + 46} r={42} fill={BONE} />
      <rect x={cx - 26} y={top + 66} width={52} height={36} rx={12} fill={BONE} />
      <circle cx={cx - 15} cy={top + 44} r={11} fill={INK} />
      <circle cx={cx + 15} cy={top + 44} r={11} fill={INK} />
      <path d={`M${cx} ${top + 58} l-6 12 h12 z`} fill={INK} />
      {[-14, -5, 4, 13].map((d) => (
        <rect key={d} x={cx + d - 1} y={top + 84} width={4} height={14} fill={dark(BONE, 0.25)} />
      ))}
      {/* позвоночник, ключицы, рёбра */}
      <rect x={cx - 8} y={top + 104} width={16} height={240} rx={8} fill={BONE} />
      <rect x={cx - 66} y={top + 124} width={132} height={14} rx={7} fill={BONE} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={cx - (58 - i * 6)} y={top + 152 + i * 28} width={(58 - i * 6) * 2} height={14} rx={7} fill={BONE} />
      ))}
      {/* таз */}
      <ellipse cx={cx} cy={top + 350} rx={52} ry={26} fill={BONE} />
      <circle cx={cx} cy={top + 354} r={10} fill={dark(BONE, 0.2)} />
      {/* руки */}
      <path d={`M${cx - 62} ${top + 132} L${cx - 76} ${top + 236} L${cx - 70} ${top + 338}`} strokeWidth={13} {...bone} strokeLinejoin="round" />
      <path d={`M${cx + 62} ${top + 132} L${cx + 76} ${top + 236} L${cx + 70} ${top + 338}`} strokeWidth={13} {...bone} strokeLinejoin="round" />
      <circle cx={cx - 70} cy={top + 350} r={13} fill={BONE} />
      <circle cx={cx + 70} cy={top + 350} r={13} fill={BONE} />
      {/* ноги */}
      <path d={`M${cx - 26} ${top + 368} L${cx - 30} ${top + 470} L${cx - 30} ${top + 580}`} strokeWidth={15} {...bone} strokeLinejoin="round" />
      <path d={`M${cx + 26} ${top + 368} L${cx + 30} ${top + 470} L${cx + 30} ${top + 580}`} strokeWidth={15} {...bone} strokeLinejoin="round" />
      <ellipse cx={cx - 38} cy={top + 588} rx={20} ry={8} fill={BONE} />
      <ellipse cx={cx + 38} cy={top + 588} rx={20} ry={8} fill={BONE} />
    </g>
  );
};

/** Смотровая кушетка у стены: верх матраса на высоте сиденья дальнего плана (метка couch); простынка-рулон. */
const Couch = ({ x, w, accent }: { x: number; w: number; accent: string }) => {
  const padTop = seatTopY(1);
  return (
    <g>
      <Shadow cx={x + w / 2} w={w + 30} />
      <rect x={x + 30} y={padTop + 30} width={12} height={FLOOR_Y - padTop - 30} fill={METAL} />
      <rect x={x + w - 42} y={padTop + 30} width={12} height={FLOOR_Y - padTop - 30} fill={METAL} />
      <rect x={x + 30} y={FLOOR_Y - 24} width={w - 60} height={8} fill={dark(METAL, 0.15)} />
      {/* приподнятое изголовье */}
      <path d={`M${x} ${padTop + 34} L${x + 10} ${padTop - 80} Q${x + 14} ${padTop - 94} ${x + 30} ${padTop - 90} L${x + 96} ${padTop - 4} L${x + 96} ${padTop + 34} Z`} fill={dark(accent, 0.12)} />
      <rect x={x} y={padTop} width={w} height={34} rx={12} fill={accent} />
      <rect x={x + 96} y={padTop - 6} width={w - 110} height={12} rx={6} fill={WHITE} opacity={0.9} />
      <circle cx={x + w - 14} cy={padTop + 4} r={14} fill={WHITE} />
      <circle cx={x + w - 14} cy={padTop + 4} r={5} fill={dark(WHITE, 0.15)} />
      <ellipse cx={x + 44} cy={padTop - 40} rx={34} ry={15} fill={WHITE} transform={`rotate(-50 ${x + 44} ${padTop - 40})`} />
    </g>
  );
};

/** План переднего слоя кабинета (стол врача) и y его низа; верх столешницы — DESK_TOP (врачу на стуле desk — по пояс). */
const OFFICE_FRONT_Z = 0.9;
const OFFICE_FEET = feetY(OFFICE_FRONT_Z);
const DESK_TOP = 1040;

/**
 * Стол врача — передний слой (layer="front", front.z 0.9): врач сидит за ним на стуле desk (x 0.56, дальний план),
 * пациент — на стуле patient-chair перед правым краем стола (средний план, тоже в переднем слое: он ближе стола).
 * Столешница x 420…780 (слева с запасом: ноги сидящего врача, сдвинутого раздвижкой, не торчат из-под стола); над местом врача (x ≈ 605) на столе только низкие вещи, чтобы не закрыть лицо.
 */
const Desk = ({ accent }: { accent: string }) => {
  const x0 = 420, x1 = 780, top = DESK_TOP, bottom = OFFICE_FEET;
  return (
    <g>
      <Shadow cx={(x0 + x1) / 2} w={x1 - x0 + 30} y={bottom - 4} o={0.18} />
      {/* передняя панель во всю ширину (ноги врача за ней) и тумба с ящиками справа */}
      <rect x={x0 + 12} y={top + 24} width={x1 - x0 - 24} height={bottom - top - 24} fill={dark(WOOD, 0.18)} />
      <rect x={x0 + 12} y={top + 24} width={x1 - x0 - 24} height={10} fill="#000000" opacity={0.15} />
      <rect x={x0 + 30} y={top + 48} width={x1 - x0 - 200} height={bottom - top - 70} rx={6} fill={dark(WOOD, 0.26)} />
      <rect x={x1 - 150} y={top + 44} width={126} height={56} rx={6} fill={dark(WOOD, 0.3)} />
      <rect x={x1 - 150} y={top + 108} width={126} height={56} rx={6} fill={dark(WOOD, 0.3)} />
      <circle cx={x1 - 87} cy={top + 72} r={6} fill="#e0b030" />
      <circle cx={x1 - 87} cy={top + 136} r={6} fill="#e0b030" />
      <rect x={x0} y={top} width={x1 - x0} height={26} rx={8} fill={WOOD} />
      <rect x={x0} y={top} width={x1 - x0} height={7} rx={4} fill={light(WOOD, 0.2)} />
      {/* лампа на левом краю */}
      <Glow cx={x0 + 60} cy={top - 10} rx={80} ry={36} opacity={0.55} />
      <rect x={x0 + 8} y={top - 10} width={50} height={12} rx={6} fill={INK} />
      <path d={`M${x0 + 32} ${top - 6} L${x0 + 22} ${top - 84}`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d={`M${x0 + 4} ${top - 78} L${x0 + 40} ${top - 104} L${x0 + 62} ${top - 66} Z`} fill={accent} />
      {/* стопка карточек пациентов */}
      <rect x={x0 + 70} y={top - 14} width={66} height={14} rx={3} fill={WHITE} />
      <rect x={x0 + 74} y={top - 24} width={60} height={10} rx={3} fill={light(accent, 0.6)} />
      <rect x={x0 + 72} y={top - 34} width={62} height={10} rx={3} fill="#e8c46a" />
      <rect x={x0 + 76} y={top - 44} width={56} height={10} rx={3} fill={light(RED, 0.4)} />
      {/* раскрытая карта перед врачом и стетоскоп — низко, лицо врача открыто */}
      <rect x={x0 + 126} y={top - 6} width={70} height={8} rx={2} fill={WHITE} transform={`rotate(-4 ${x0 + 160} ${top})`} />
      <path d={`M${x0 + 200} ${top - 2} q-8 -22 10 -26 q22 -2 18 22`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={x0 + 230} cy={top - 3} r={8} fill={METAL} />
      {/* ручки в стакане и кружка на правом краю */}
      <rect x={x1 - 82} y={top - 34} width={24} height={34} rx={5} fill={dark(accent, 0.3)} />
      <rect x={x1 - 78} y={top - 54} width={4} height={24} fill={RED} transform={`rotate(-12 ${x1 - 76} ${top - 34})`} />
      <rect x={x1 - 68} y={top - 56} width={4} height={26} fill="#3a5fa0" transform={`rotate(10 ${x1 - 66} ${top - 34})`} />
      <rect x={x1 - 50} y={top - 40} width={32} height={40} rx={7} fill={RED} />
      <path d={`M${x1 - 18} ${top - 32} q16 4 0 20`} stroke={RED} strokeWidth={6} fill="none" />
    </g>
  );
};

/** Передний слой кабинета: стол врача и стул пациента перед ним. */
const OfficeFront = ({ accent }: { accent: string }) => (
  <>
    <Desk accent={accent} />
    <Shadow cx={0.72 * W} w={130} y={feetY(0.5)} o={0.14} />
    <SeatAt x={0.72} z={0.5} kind="chair" color={WOOD} pad={light(accent, 0.2)} />
  </>
);

/** Диплом в рамке. */
const Diploma = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x + 5} y={y + 7} width={150} height={110} rx={6} fill="#000000" opacity={0.12} />
    <rect x={x} y={y} width={150} height={110} rx={6} fill={WOOD} />
    <rect x={x + 12} y={y + 12} width={126} height={86} fill={WHITE} />
    <rect x={x + 30} y={y + 30} width={90} height={8} rx={4} fill="#c9c0aa" />
    <rect x={x + 30} y={y + 48} width={70} height={6} rx={3} fill="#c9c0aa" />
    <circle cx={x + 110} cy={y + 76} r={12} fill={RED} />
  </g>
);

/** Красный крест на белом кружке (табличка на двери). */
const RedCross = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r * 1.7} fill={WHITE} />
    <rect x={cx - r * 0.4} y={cy - r * 1.15} width={r * 0.8} height={r * 2.3} fill={RED} />
    <rect x={cx - r * 1.15} y={cy - r * 0.4} width={r * 2.3} height={r * 0.8} fill={RED} />
  </g>
);

/** Белый халат на крючке. */
const Coat = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 4} y={y - 14} width={8} height={18} rx={3} fill={dark(METAL, 0.3)} />
    <path d={`M${x - 26} ${y + 6} Q${x} ${y - 6} ${x + 26} ${y + 6} L${x + 44} ${y + 210} Q${x} ${y + 222} ${x - 44} ${y + 210} Z`} fill={WHITE} />
    <path d={`M${x} ${y + 2} L${x - 6} ${y + 214}`} stroke={dark(WHITE, 0.12)} strokeWidth={4} />
    <path d={`M${x - 26} ${y + 6} L${x - 8} ${y + 50} L${x} ${y + 2} L${x + 8} ${y + 50} L${x + 26} ${y + 6}`} fill={dark(WHITE, 0.08)} />
    <rect x={x + 10} y={y + 80} width={22} height={26} rx={3} fill={dark(WHITE, 0.08)} />
    <rect x={x + 14} y={y + 72} width={4} height={14} fill="#3a5fa0" />
  </g>
);

/** Настенный тонометр со шлангом. */
const Tonometer = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x + 4} y={y + 6} width={70} height={100} rx={10} fill="#000000" opacity={0.1} />
    <rect x={x} y={y} width={70} height={100} rx={10} fill={dark(METAL, 0.15)} />
    <circle cx={x + 35} cy={y + 40} r={26} fill={WHITE} />
    <line x1={x + 35} y1={y + 40} x2={x + 50} y2={y + 26} stroke={RED} strokeWidth={4} strokeLinecap="round" />
    <circle cx={x + 35} cy={y + 40} r={4} fill={INK} />
    <path d={`M${x + 35} ${y + 100} q0 40 -30 60 q-20 14 -10 40`} stroke={INK} strokeWidth={5} fill="none" />
    <rect x={x - 12} y={y + 196} width={34} height={26} rx={10} fill="#3a5fa0" />
  </g>
);

/** Настенный шкафчик-аптечка со стеклянной дверцей. */
const MedCabinet = ({ x, y, w = 160, h = 150, accent }: { x: number; y: number; w?: number; h?: number; accent: string }) => (
  <g>
    <rect x={x + 6} y={y + 8} width={w} height={h} rx={8} fill="#000000" opacity={0.12} />
    <rect x={x} y={y} width={w} height={h} rx={8} fill={WHITE} />
    <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} rx={4} fill={light(accent, 0.65)} />
    <rect x={x + 10} y={y + h / 2 - 3} width={w - 20} height={6} fill={WHITE} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={x + 20 + i * 32} y={y + h / 2 - 34} width={20} height={31} rx={5} fill={[RED, "#e8c46a", "#7fb3d5", "#9a7ac0"][i]} />
    ))}
    {[0, 1, 2].map((i) => (
      <rect key={i} x={x + 22 + i * 42} y={y + h - 50} width={30} height={40} rx={4} fill={[WHITE, "#f2d6a2", WHITE][i]} />
    ))}
    <path d={`M${x + 14} ${y + 14} L${x + 50} ${y + 14} L${x + 14} ${y + 60} Z`} fill="#ffffff" opacity={0.5} />
    <rect x={x + w - 22} y={y + h / 2 - 16} width={6} height={32} rx={3} fill={METAL} />
    <RedCross cx={x + w / 2} cy={y - 22} r={10} />
  </g>
);

/** Кабинет: дверь с халатом, кушетка под окном, таблица, тонометр, кресло врача (desk), аптечка, скелет; стол и стул пациента — в OfficeFront. */
const Office = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => (
  <>
    <Room wall={wall} floor={floor} />
    <WallShade />
    <FloorTiles color={floor} step={190} rows={7} />
    <FloorShade />
    <ClinicCeiling wall={wall} lamps={[270, 810]} />
    <Wainscot wall={wall} accent={accent} />
    <Door x={24} w={190} color={light(accent, 0.45)} knob={METAL} />
    <RedCross cx={119} cy={FLOOR_Y - 440} r={26} />
    <Coat x={176} y={FLOOR_Y - 350} />
    <Clock cx={119} cy={560} r={46} rim={dark(accent, 0.4)} />
    {/* окно: вид на деревья, занавеска-«кафе», цветок на подоконнике */}
    <Window x={250} y={450} w={240} h={280} glass={light(accent, 0.55)} />
    <circle cx={330} cy={640} r={40} fill="#8cc08a" opacity={0.7} />
    <circle cx={390} cy={660} r={30} fill="#7fb37d" opacity={0.7} />
    <rect x={250} y={450} width={240} height={50} rx={10} fill={light(accent, 0.25)} />
    {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={270 + i * 40} cy={500} r={20} fill={light(accent, 0.25)} />)}
    <rect x={240} y={722} width={260} height={16} rx={6} fill={WHITE} />
    <rect x={430} y={688} width={34} height={34} rx={6} fill={RED} />
    <ellipse cx={440} cy={676} rx={14} ry={22} fill="#5b8c5a" transform="rotate(-20 440 676)" />
    <ellipse cx={456} cy={674} rx={12} ry={20} fill="#6a9c68" transform="rotate(25 456 674)" />
    <EyeChart x={500} y={436} accent={accent} />
    <Tonometer x={530} y={740} />
    <Diploma x={735} y={480} />
    <MedCabinet x={720} y={640} w={170} h={140} accent={accent} />
    <Skeleton cx={990} />
    <Couch x={250} w={260} accent={accent} />
    {/* кресло врача (метка desk) — за столом; сам стол и стул пациента — передний слой (OfficeFront) */}
    <Shadow cx={0.56 * W} w={120} />
    <SeatAt x={0.56} z={1} kind="office" color={dark(accent, 0.45)} />
  </>
);

/** Плакат-«памятка»: картинка-иконка сверху и строки. kind: heart | hands | lungs | syringe. */
const HealthPoster = ({ x, y, w = 170, h = 230, kind, accent }: { x: number; y: number; w?: number; h?: number; kind: "heart" | "hands" | "lungs" | "syringe"; accent: string }) => {
  const cx = x + w / 2;
  const cy = y + h * 0.36;
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={h} rx={8} fill="#000000" opacity={0.12} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill={WHITE} />
      <rect x={x} y={y} width={w} height={20} rx={8} fill={kind === "heart" ? RED : accent} />
      {kind === "heart" && <path d={`M${cx} ${cy} C${cx - 30} ${cy - 40} ${cx - 80} ${cy - 15} ${cx - 60} ${cy + 25} L${cx} ${cy + 80} L${cx + 60} ${cy + 25} C${cx + 80} ${cy - 15} ${cx + 30} ${cy - 40} ${cx} ${cy} Z`} fill={RED} />}
      {kind === "hands" && (
        <g>
          <rect x={cx - 50} y={cy - 10} width={44} height={70} rx={20} fill="#e8b48a" transform={`rotate(-18 ${cx - 28} ${cy + 25})`} />
          <rect x={cx + 6} y={cy - 10} width={44} height={70} rx={20} fill="#d9a07a" transform={`rotate(18 ${cx + 28} ${cy + 25})`} />
          {[[-40, -40], [-6, -56], [30, -38], [10, -20]].map(([dx, dy], i) => (
            <path key={i} d={`M${cx + dx} ${cy + dy - 16} q10 14 0 20 q-10 -6 0 -20 Z`} fill="#6ab0d8" />
          ))}
        </g>
      )}
      {kind === "lungs" && (
        <g>
          <rect x={cx - 5} y={cy - 50} width={10} height={44} rx={5} fill={dark(RED, 0.1)} />
          <path d={`M${cx - 8} ${cy - 10} Q${cx - 70} ${cy - 30} ${cx - 64} ${cy + 50} Q${cx - 40} ${cy + 70} ${cx - 8} ${cy + 40} Z`} fill={light(RED, 0.3)} />
          <path d={`M${cx + 8} ${cy - 10} Q${cx + 70} ${cy - 30} ${cx + 64} ${cy + 50} Q${cx + 40} ${cy + 70} ${cx + 8} ${cy + 40} Z`} fill={light(RED, 0.3)} />
          <circle cx={cx + 52} cy={cy - 40} r={22} fill="none" stroke={RED} strokeWidth={6} />
          <line x1={cx + 36} y1={cy - 24} x2={cx + 68} y2={cy - 56} stroke={RED} strokeWidth={6} />
        </g>
      )}
      {kind === "syringe" && (
        <g transform={`rotate(-35 ${cx} ${cy + 10})`}>
          <rect x={cx - 60} y={cy} width={90} height={26} rx={5} fill={light(accent, 0.5)} />
          <rect x={cx - 60} y={cy} width={50} height={26} rx={5} fill={accent} />
          <rect x={cx + 30} y={cy + 9} width={40} height={6} fill={METAL} />
          <rect x={cx - 84} y={cy + 8} width={26} height={10} fill={METAL} />
          <rect x={cx - 92} y={cy - 4} width={10} height={34} rx={3} fill={METAL} />
        </g>
      )}
      {[0, 1, 2].map((i) => <rect key={i} x={x + 24} y={y + h * 0.72 + i * 20} width={(w - 48) * (1 - i * 0.2)} height={9} rx={4} fill={light(INK, 0.6)} />)}
    </g>
  );
};

/** Знак «без телефона» в кружке. */
const Pictogram = ({ cx, cy, r = 38 }: { cx: number; cy: number; r?: number; kind: "phone" }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={WHITE} />
    <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke={RED} strokeWidth={7} />
    <rect x={cx - 11} y={cy - 19} width={22} height={38} rx={5} fill={INK} />
    <line x1={cx - r * 0.6} y1={cy - r * 0.6} x2={cx + r * 0.6} y2={cy + r * 0.6} stroke={RED} strokeWidth={7} />
  </g>
);

/** Семисегментная цифра (для табло очереди). */
const SEG: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg" };
export const Digit = ({ x, y, d, s = 1, color = "#ff5a3a" }: { x: number; y: number; d: string; s?: number; color?: string }) => {
  const w = 22 * s;
  const h = 40 * s;
  const t = 5 * s;
  const seg: Record<string, [number, number, number, number]> = {
    a: [x + t, y, w - 2 * t, t],
    b: [x + w - t, y + t, t, h / 2 - 1.5 * t],
    c: [x + w - t, y + h / 2 + t / 2, t, h / 2 - 1.5 * t],
    d: [x + t, y + h - t, w - 2 * t, t],
    e: [x, y + h / 2 + t / 2, t, h / 2 - 1.5 * t],
    f: [x, y + t, t, h / 2 - 1.5 * t],
    g: [x + t, y + h / 2 - t / 2, w - 2 * t, t],
  };
  return (
    <g fill={color}>
      {(SEG[d] ?? "").split("").map((k) => {
        const [a, b, c, e] = seg[k];
        return <rect key={k} x={a} y={b} width={c} height={e} rx={t / 2} />;
      })}
    </g>
  );
};

/** Электронное табло очереди: номер талона и окошко. */
const QueueBoard = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x + 5} y={y + 7} width={120} height={70} rx={8} fill="#000000" opacity={0.12} />
    <rect x={x} y={y} width={120} height={70} rx={8} fill={INK} />
    <Glow cx={x + 60} cy={y + 35} rx={80} ry={50} color="#ff5a3a" opacity={0.25} />
    <Digit x={x + 12} y={y + 15} d="0" />
    <Digit x={x + 40} y={y + 15} d="7" />
    <path d={`M${x + 72} ${y + 26} l14 9 l-14 9 Z`} fill="#7fe0a0" />
    <Digit x={x + 92} y={y + 15} d="3" color="#7fe0a0" />
  </g>
);

/** Огнетушитель на кронштейне. */
const Extinguisher = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x - 6} y={y - 6} width={12} height={12} rx={3} fill={dark(METAL, 0.3)} />
    <rect x={x - 20} y={y + 20} width={40} height={110} rx={18} fill={RED} />
    <rect x={x - 12} y={y + 4} width={24} height={20} rx={4} fill={INK} />
    <path d={`M${x + 10} ${y + 10} q30 6 24 60`} stroke={INK} strokeWidth={6} fill="none" />
    <rect x={x - 16} y={y + 60} width={32} height={26} rx={3} fill={WHITE} opacity={0.85} />
  </g>
);

/** Расписание приёма — сетка-таблица под стеклом. */
const Timetable = ({ x, y, w = 200, h = 170, accent }: { x: number; y: number; w?: number; h?: number; accent: string }) => (
  <g>
    <rect x={x + 5} y={y + 7} width={w} height={h} rx={6} fill="#000000" opacity={0.12} />
    <rect x={x} y={y} width={w} height={h} rx={6} fill={dark(WOOD, 0.1)} />
    <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} fill={WHITE} />
    <rect x={x + 10} y={y + 10} width={w - 20} height={26} fill={accent} />
    {Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 4 }).map((_, c) => (
        <rect key={`${r}-${c}`} x={x + 18 + c * ((w - 36) / 4)} y={y + 46 + r * ((h - 66) / 5)} width={(w - 36) / 4 - 8} height={(h - 66) / 5 - 8} rx={2} fill={c === 0 ? light(accent, 0.5) : "#dcd6c8"} />
      )),
    )}
    <path d={`M${x + 14} ${y + 14} L${x + 60} ${y + 14} L${x + 14} ${y + 70} Z`} fill="#ffffff" opacity={0.35} />
  </g>
);

/** Коридор поликлиники: окошко регистратуры слева (за ним регистратор — метка reception; рама и стойка — WaitingFront), ряд из 5 стульев у стены (chair-1…5), плакаты, расписание, цветок, дверь кабинета справа. */
const WaitingRoom = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => {
  const seat = dark(accent, 0.35);
  return (
    <>
      <Room wall={wall} floor={floor} />
      <WallShade />
      <FloorTiles color={floor} step={170} rows={8} />
      <FloorShade />
      <ClinicCeiling wall={wall} lamps={[200, 540, 880]} />
      <Wainscot wall={wall} accent={accent} />
      {/* окошко регистратуры: табличка, звонок, журнал, карточки за стеклом */}
      <rect x={20} y={560} width={230} height={FLOOR_Y - 560} fill={dark(wall, 0.12)} />
      <rect x={40} y={590} width={190} height={RECEPTION_TOP - 590} rx={10} fill={light(accent, 0.6)} />
      {[0, 1, 2].map((i) => <rect key={i} x={56 + i * 22} y={680} width={16} height={60} rx={2} fill={["#e8c46a", WHITE, light(RED, 0.3)][i]} opacity={0.7} />)}
      <rect x={160} y={690} width={56} height={8} fill={dark(wall, 0.2)} opacity={0.6} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={164 + (i % 2) * 24} y={660 - Math.floor(i / 2) * 26} width={18} height={24} rx={2} fill={["#7fb3d5", "#e8c46a", RED, WHITE][i]} opacity={0.65} />)}
      {/* рама окошка, стекло, стойка со звонком и низ стены под окошком — передний слой (WaitingFront): регистратор за ними */}
      {/* плакаты о здоровье и пиктограммы */}
      <HealthPoster x={340} y={460} w={180} h={240} kind="heart" accent={accent} />
      <HealthPoster x={545} y={470} w={150} h={200} kind="hands" accent={accent} />
      <HealthPoster x={720} y={460} w={150} h={210} kind="lungs" accent={accent} />
      <Timetable x={500} y={700} w={210} h={150} accent={accent} />
      <QueueBoard x={370} y={724} />
      <Pictogram cx={790} cy={740} kind="phone" r={34} />
      {/* ряд стульев на балке */}
      <Shadow cx={0.49 * W} w={0.42 * W + 180} o={0.14} />
      <rect x={0.28 * W - 70} y={seatTopY(1) + 26} width={0.42 * W + 140} height={12} fill={METAL} />
      {[0.28, 0.385, 0.49, 0.595, 0.7].map((x) => (
        <SeatAt key={x} x={x} z={1} kind="chair" color={seat} back={140} />
      ))}
      <Shadow cx={835} w={90} />
      <Plant x={835} y={FLOOR_Y} scale={0.7} pot={WHITE} leaf="#5b8c5a" />
      {/* дверь кабинета с крестом и лампочкой «занято», огнетушитель */}
      <Door x={890} w={176} color={light(accent, 0.45)} knob={METAL} />
      <RedCross cx={978} cy={FLOOR_Y - 430} r={24} />
      <rect x={918} y={FLOOR_Y - 330} width={120} height={40} rx={4} fill={WHITE} />
      <rect x={932} y={FLOOR_Y - 318} width={70} height={8} rx={4} fill={light(INK, 0.5)} />
      <rect x={932} y={FLOOR_Y - 304} width={50} height={6} rx={3} fill={light(INK, 0.6)} />
      <Glow cx={978} cy={FLOOR_Y - 560} rx={60} color="#ff7a5a" opacity={0.5} />
      <circle cx={978} cy={FLOOR_Y - 560} r={16} fill={RED} />
      <circle cx={973} cy={FLOOR_Y - 565} r={5} fill="#ffd0c0" />
      <Extinguisher x={300} y={724} />
    </>
  );
};

/** Верх стойки окошка регистратуры: низко, чтобы регистратор (reception, z 1) был виден за стеклом и при мелком масштабе (5 кукол). */
const RECEPTION_TOP = 1010;

/** Передний слой коридора (front.z 0.97, регистратор на reception z 1 — за ним по грудь): рама окошка регистратуры, полупрозрачное стекло с вырезом, табличка, стойка со звонком и журналом, стена под окошком. */
const WaitingFront = ({ wall, accent }: { wall: string; accent: string }) => {
  const frame = dark(wall, 0.12);
  const top = RECEPTION_TOP;
  return (
    <>
      <rect x={20} y={560} width={230} height={30} fill={frame} />
      <rect x={20} y={590} width={20} height={top - 590} fill={frame} />
      <rect x={230} y={590} width={20} height={top - 590} fill={frame} />
      <rect x={40} y={590} width={190} height={top - 590} fill={light(accent, 0.6)} opacity={0.22} />
      <rect x={40} y={590} width={190} height={top - 590} fill="none" stroke={dark(wall, 0.25)} strokeWidth={5} />
      <path d="M50 600 L100 600 L50 680 Z" fill="#ffffff" opacity={0.3} />
      {/* щель для документов в стекле над стойкой — низкая, лицо регистратора не перечёркивает */}
      <path d={`M85 ${top} v-18 q0 -10 10 -10 h80 q10 0 10 10 v18`} fill="none" stroke={dark(wall, 0.3)} strokeWidth={4} />
      <rect x={70} y={563} width={130} height={26} rx={6} fill={accent} />
      <rect x={90} y={571} width={90} height={10} rx={5} fill={WHITE} opacity={0.8} />
      <rect x={10} y={top} width={250} height={26} rx={6} fill={WOOD} />
      <rect x={10} y={top} width={250} height={7} rx={4} fill={light(WOOD, 0.2)} />
      <rect x={180} y={top - 24} width={36} height={22} rx={3} fill={WHITE} />
      <ellipse cx={60} cy={top - 6} rx={18} ry={6} fill={dark(METAL, 0.2)} />
      <path d={`M44 ${top - 6} a16 16 0 0 1 32 0 Z`} fill="#d9a630" />
      <rect x={20} y={top + 26} width={230} height={FLOOR_Y - top - 26} fill={frame} />
      <rect x={30} y={top + 26} width={210} height={FLOOR_Y - top - 26} fill={dark(wall, 0.18)} />
      <rect x={30} y={top + 26} width={210} height={FLOOR_Y - top - 26} fill="none" stroke={dark(wall, 0.25)} strokeWidth={4} />
    </>
  );
};

/** Больничная палата: кровать с тумбочкой и цветами, капельница, шторка, монитор, кислородная панель над кроватью. */
const Ward = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => {
  const bedTop = FLOOR_Y - 120;
  const bx = 560;
  const bw = 480;
  const curtain = light(accent, 0.35);
  return (
    <>
      <Room wall={wall} floor={floor} />
      <WallShade />
      <FloorTiles color={floor} step={210} rows={7} />
      <FloorShade />
      <ClinicCeiling wall={wall} lamps={[540]} />
      <Wainscot wall={wall} accent={accent} />
      {/* окно: небо, деревья и дом напротив */}
      <Window x={650} y={440} w={260} h={250} glass={light(accent, 0.55)} />
      <rect x={810} y={580} width={84} height={94} fill={light(accent, 0.3)} opacity={0.8} />
      {[0, 1].map((i) => <rect key={i} x={826 + i * 36} y={598} width={20} height={20} fill={WHITE} opacity={0.6} />)}
      <circle cx={710} cy={630} r={40} fill="#8cc08a" opacity={0.75} />
      <circle cx={750} cy={650} r={30} fill="#7fb37d" opacity={0.75} />
      <path d="M666 456 Q700 560 680 690 L666 690 Z" fill={light(accent, 0.2)} />
      <path d="M894 456 Q860 560 880 690 L894 690 Z" fill={light(accent, 0.2)} />
      <rect x={640} y={684} width={280} height={14} rx={6} fill={WHITE} />
      {/* картина и часы */}
      <rect x={265} y={470} width={130} height={100} rx={6} fill={WOOD} />
      <rect x={277} y={482} width={106} height={76} fill="#bfe0ef" />
      <path d="M277 540 Q330 520 383 540 V558 H277 Z" fill="#6ab0d8" />
      <path d="M320 530 L336 494 L336 530 Z" fill={WHITE} />
      <rect x={312} y={530} width={36} height={8} rx={3} fill={RED} />
      <Clock cx={330} cy={660} r={42} rim={dark(accent, 0.4)} h={3} m={40} />
      {/* монитор с пульсом */}
      <rect x={420} y={470} width={150} height={104} rx={12} fill={dark(METAL, 0.45)} />
      <rect x={432} y={482} width={126} height={80} rx={6} fill="#1f3a34" />
      <Glow cx={495} cy={522} rx={90} ry={60} color="#7fe0a0" opacity={0.25} />
      <path d="M440 524 h28 l10 -26 l14 50 l12 -34 l8 10 h36" stroke="#7fe0a0" strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <rect x={530} y={488} width={22} height={10} rx={2} fill="#f2c230" opacity={0.8} />
      {/* кислородная панель над кроватью */}
      <rect x={bx + 60} y={800} width={bw - 80} height={44} rx={8} fill={dark(wall, 0.08)} />
      <rect x={bx + 60} y={800} width={bw - 80} height={10} rx={5} fill={light(wall, 0.3)} />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={bx + 110 + i * 60} cy={824} r={10} fill={["#4a7ab0", "#5b8c5a", WHITE, "#e8c46a"][i]} />)}
      <rect x={bx + 350} y={814} width={60} height={20} rx={4} fill={RED} opacity={0.85} />
      <path d={`M${bx + 380} 844 q4 80 -40 ${bedTop - 900}`} stroke={INK} strokeWidth={4} fill="none" />
      {/* штора слева */}
      <rect x={0} y={428} width={320} height={10} rx={5} fill={METAL} />
      {[20, 70, 120, 170, 220].map((xx) => <circle key={xx} cx={xx} cy={433} r={8} fill={dark(METAL, 0.2)} />)}
      <path d={`M0 438 H230 V1110 Q215 1132 200 1110 Q185 1132 170 1110 Q155 1132 140 1110 Q125 1132 110 1110 Q95 1132 80 1110 Q65 1132 50 1110 Q35 1132 20 1110 Q10 1124 0 1110 Z`} fill={curtain} />
      {[40, 100, 160, 215].map((xx) => (
        <rect key={xx} x={xx} y={438} width={16} height={672} fill={dark(curtain, 0.08)} />
      ))}
      <rect x={0} y={438} width={230} height={18} fill={light(curtain, 0.2)} />
      {/* тумбочка: стакан, апельсины, цветы в вазе */}
      <Shadow cx={490} w={120} />
      <rect x={430} y={FLOOR_Y - 170} width={120} height={170} rx={6} fill={WHITE} />
      <rect x={442} y={FLOOR_Y - 150} width={96} height={50} rx={4} fill={dark(WHITE, 0.07)} />
      <rect x={480} y={FLOOR_Y - 130} width={20} height={6} rx={3} fill={METAL} />
      <rect x={442} y={FLOOR_Y - 90} width={96} height={70} rx={4} fill={dark(WHITE, 0.07)} />
      <rect x={424} y={FLOOR_Y - 178} width={132} height={12} rx={4} fill={light(WHITE, 0.4)} />
      <rect x={442} y={FLOOR_Y - 222} width={26} height={44} rx={6} fill="#cfe6f5" opacity={0.9} />
      <rect x={446} y={FLOOR_Y - 204} width={18} height={24} rx={4} fill="#9cc6e0" />
      <circle cx={530} cy={FLOOR_Y - 190} r={13} fill="#f29a30" />
      <circle cx={512} cy={FLOOR_Y - 188} r={11} fill="#f2a840" />
      <rect x={478} y={FLOOR_Y - 236} width={22} height={58} rx={8} fill={light(accent, 0.4)} />
      {[[-18, -30, "#f2a0c0"], [4, -44, "#f2c230"], [22, -26, WHITE], [-4, -22, "#e86a6a"]].map(([dx, dy, c], i) => (
        <g key={i}>
          <line x1={489} y1={FLOOR_Y - 230} x2={489 + (dx as number)} y2={FLOOR_Y - 236 + (dy as number)} stroke="#5b8c5a" strokeWidth={4} />
          <circle cx={489 + (dx as number)} cy={FLOOR_Y - 236 + (dy as number)} r={11} fill={c as string} />
          <circle cx={489 + (dx as number)} cy={FLOOR_Y - 236 + (dy as number)} r={4} fill="#f2d060" />
        </g>
      ))}
      {/* капельница */}
      <Shadow cx={990} w={110} />
      <rect x={986} y={520} width={8} height={FLOOR_Y - 520} fill={dark(METAL, 0.2)} />
      <rect x={940} y={FLOOR_Y - 14} width={100} height={14} rx={7} fill={dark(METAL, 0.3)} />
      <rect x={960} y={516} width={60} height={8} rx={4} fill={dark(METAL, 0.2)} />
      <rect x={942} y={530} width={50} height={86} rx={16} fill={light(accent, 0.75)} opacity={0.95} />
      <rect x={950} y={570} width={34} height={38} rx={10} fill={light(accent, 0.35)} />
      <rect x={952} y={540} width={8} height={30} rx={4} fill="#ffffff" opacity={0.7} />
      <path d={`M967 616 Q960 760 900 ${bedTop - 10}`} stroke={light(METAL, 0.4)} strokeWidth={5} fill="none" />
      {/* стул посетителя (метка chair, средний план) */}
      <Shadow cx={0.4 * W} w={130} y={1275} o={0.14} />
      <SeatAt x={0.4} z={0.5} kind="chair" color={METAL} pad={light(accent, 0.2)} />
      {/* кровать: край одеяла — на высоте сиденья дальнего плана (метка bed) */}
      <Shadow cx={bx + bw / 2} w={bw + 40} o={0.18} />
      <rect x={bx + bw - 34} y={FLOOR_Y - 330} width={34} height={300} rx={12} fill={METAL} />
      <rect x={bx} y={FLOOR_Y - 230} width={30} height={200} rx={12} fill={METAL} />
      <rect x={bx + 10} y={bedTop + 76} width={bw - 20} height={16} fill={dark(METAL, 0.15)} />
      <circle cx={bx + 40} cy={FLOOR_Y - 18} r={18} fill={INK} />
      <circle cx={bx + bw - 60} cy={FLOOR_Y - 18} r={18} fill={INK} />
      <rect x={bx + 20} y={bedTop - 10} width={bw - 50} height={88} rx={14} fill={WHITE} />
      <rect x={bx + 330} y={bedTop - 46} width={110} height={44} rx={20} fill={WHITE} />
      <path d={`M${bx + 350} ${bedTop - 30} q30 10 70 0`} stroke={dark(WHITE, 0.1)} strokeWidth={4} fill="none" />
      <rect x={bx + 26} y={bedTop - 16} width={300} height={88} rx={18} fill={accent} />
      <rect x={bx + 26} y={bedTop + 20} width={300} height={10} fill={dark(accent, 0.1)} />
      <rect x={bx + 280} y={bedTop - 16} width={46} height={88} rx={14} fill={light(accent, 0.5)} />
      {/* карта больного на спинке в ногах */}
      <rect x={bx - 14} y={FLOOR_Y - 250} width={46} height={62} rx={4} fill={dark(WOOD, 0.1)} />
      <rect x={bx - 8} y={FLOOR_Y - 240} width={34} height={46} fill={WHITE} />
      <rect x={bx} y={FLOOR_Y - 254} width={18} height={8} rx={3} fill={METAL} />
      {[0, 1, 2].map((i) => <rect key={i} x={bx - 2} y={FLOOR_Y - 232 + i * 12} width={22} height={4} fill={light(INK, 0.5)} />)}
    </>
  );
};

/** Палата с мягкими стенами, решётка на окне, мягкая дверь с глазком, лампа в сетке, скамья. */
const Padded = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => {
  const pad = mix(wall, "#f6f0e2", 0.55);
  const seam = dark(wall, 0.05);
  const S = 135;
  const cols = Math.ceil(W / S);
  const rows = Math.ceil(FLOOR_Y / S);
  const mat = dark(floor, 0.05);
  return (
    <>
      <Room wall={seam} floor={mat} />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <g key={`${r}-${c}`}>
            <rect x={c * S + 5} y={FLOOR_Y - (r + 1) * S + 5} width={S - 10} height={S - 10} rx={34} fill={pad} />
            <rect x={c * S + 18} y={FLOOR_Y - (r + 1) * S + 14} width={S - 50} height={14} rx={7} fill="#ffffff" opacity={0.35} />
          </g>
        )),
      )}
      {Array.from({ length: rows + 1 }).map((_, r) =>
        Array.from({ length: cols + 1 }).map((_, c) => (
          <circle key={`b${r}-${c}`} cx={c * S} cy={FLOOR_Y - r * S} r={7} fill={dark(wall, 0.18)} />
        )),
      )}
      <WallShade top={0.05} bottom={0.14} />
      {/* резиновый пол: мягкие маты */}
      <FloorTiles color={mat} step={240} rows={5} checker={0.06} seam={0.14} />
      <FloorShade strength={0.2} />
      <rect x={0} y={FLOOR_Y - 18} width={W} height={18} fill="#00000022" />
      {/* лампа в сетке под потолком */}
      <Glow cx={540} cy={90} rx={320} ry={180} opacity={0.55} />
      <rect x={470} y={0} width={140} height={24} rx={6} fill={dark(METAL, 0.3)} />
      <ellipse cx={540} cy={60} rx={56} ry={40} fill="#fff6d0" />
      <g stroke={dark(METAL, 0.4)} strokeWidth={5} fill="none">
        <ellipse cx={540} cy={60} rx={60} ry={44} />
        <line x1={540} y1={16} x2={540} y2={104} />
        <line x1={500} y1={28} x2={500} y2={92} />
        <line x1={580} y1={28} x2={580} y2={92} />
      </g>
      {/* мягкая дверь с окошком-глазком слева */}
      <rect x={256} y={FLOOR_Y - 540} width={196} height={540} rx={30} fill={dark(pad, 0.06)} />
      <rect x={256} y={FLOOR_Y - 540} width={196} height={540} rx={30} fill="none" stroke={dark(wall, 0.15)} strokeWidth={8} />
      {[0, 1, 2].map((r) => [0, 1].map((c) => <circle key={`${r}${c}`} cx={310 + c * 90} cy={FLOOR_Y - 380 + r * 130} r={7} fill={dark(wall, 0.2)} />))}
      <rect x={314} y={FLOOR_Y - 500} width={80} height={60} rx={8} fill={dark(METAL, 0.35)} />
      <rect x={322} y={FLOOR_Y - 492} width={64} height={44} rx={4} fill="#3a4148" />
      <circle cx={354} cy={FLOOR_Y - 470} r={10} fill="#f2efe4" />
      <circle cx={356} cy={FLOOR_Y - 470} r={5} fill={INK} />
      {/* царапины-«палочки» на мягкой стене справа */}
      <g stroke={dark(wall, 0.3)} strokeWidth={5} strokeLinecap="round" opacity={0.6}>
        {[0, 1, 2, 3].map((i) => <line key={i} x1={830 + i * 14} y1={700} x2={826 + i * 14} y2={752} />)}
        <line x1={820} y1={740} x2={890} y2={710} />
        {[0, 1].map((i) => <line key={`b${i}`} x1={910 + i * 14} y1={700} x2={906 + i * 14} y2={752} />)}
      </g>
      {/* луч света из окна */}
      <path d={`M430 612 L650 612 L800 ${FLOOR_Y + 60} L300 ${FLOOR_Y + 60} Z`} fill="#ffffff" opacity={0.13} />
      {[0, 1, 2].map((i) => <rect key={i} x={466 + i * 92} y={FLOOR_Y + 20} width={70} height={30} fill="#ffffff" opacity={0.08} transform={`skewX(-12)`} />)}
      {/* окно с решёткой */}
      <rect x={410} y={440} width={260} height={180} rx={10} fill={dark(METAL, 0.35)} />
      <rect x={426} y={456} width={228} height={148} rx={4} fill={light(accent, 0.55)} />
      <Glow cx={600} cy={500} rx={60} opacity={0.6} />
      <circle cx={600} cy={500} r={22} fill="#f5e6a8" />
      <path d="M426 604 Q480 560 540 580 Q600 560 654 590 V604 Z" fill="#8cc08a" opacity={0.6} />
      {[466, 512, 558, 604].map((xx) => (
        <rect key={xx} x={xx} y={456} width={12} height={148} fill={dark(METAL, 0.45)} />
      ))}
      <rect x={426} y={524} width={228} height={12} fill={dark(METAL, 0.45)} />
      {/* скамья */}
      <Shadow cx={0.815 * W} w={0.3 * W} />
      <BenchAt x0={0.68} x1={0.95} color={WOOD} metal={dark(WOOD, 0.3)} back={false} />
      {/* подушка на полу, жестяная кружка и миска */}
      <Shadow cx={140} w={180} />
      <rect x={60} y={FLOOR_Y - 60} width={160} height={70} rx={30} fill={light(accent, 0.6)} />
      <rect x={90} y={FLOOR_Y - 46} width={100} height={8} rx={4} fill={light(accent, 0.35)} />
      <rect x={232} y={FLOOR_Y - 34} width={30} height={34} rx={5} fill={METAL} />
      <path d={`M262 ${FLOOR_Y - 28} q14 2 0 18`} stroke={METAL} strokeWidth={5} fill="none" />
    </>
  );
};

export const Bolnitsa = ({ palette, variant, layer = "back" }: BackdropProps) => {
  const { wall, floor, accent } = palette;
  if (layer === "front") {
    // передний слой: стол врача в кабинете и окошко регистратуры в коридоре; палата и мягкая палата — без него
    if (variant === "waiting-room") return <Canvas><WaitingFront wall={wall} accent={accent} /></Canvas>;
    if (variant === "hospital" || variant === "madhouse") return null;
    return <Canvas><OfficeFront accent={accent} /></Canvas>;
  }
  return (
    <Canvas>
      {variant === "waiting-room" ? (
        <WaitingRoom wall={wall} floor={floor} accent={accent} />
      ) : variant === "hospital" ? (
        <Ward wall={wall} floor={floor} accent={accent} />
      ) : variant === "madhouse" ? (
        <Padded wall={wall} floor={floor} accent={accent} />
      ) : (
        <Office wall={wall} floor={floor} accent={accent} />
      )}
    </Canvas>
  );
};
