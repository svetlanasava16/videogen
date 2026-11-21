/**
 * Транспорт снаружи (scene.vehicles): машины вида сбоку. Движок (Joke.tsx) ставит машину на план глубины и двигает
 * битами drive; седоки — куклы сцены — рисуются между слоями back и front (видны в окнах) или поверх (велосипед).
 *
 * Локальные координаты рисунка: начало — середина низа колёс на полу, машина смотрит вправо (+x — перёд),
 * масштаб 1 = средний план (кукла 768 px). Отражение и масштаб плана делает движок.
 *
 * Как сидит кукла (seated=1, масштаб s): центр бокса (таз, середина лица) — на dx; голова — центр ≈ dy + 390·s,
 * макушка ≈ dy + 535·s, подбородок ≈ dy + 290·s; руки ≈ ±110·s, dy + 125·s; ботинки ≈ +190·s вперёд на высоте dy.
 * Поэтому окна рисуются вокруг dy + 390·s, а у велосипеда/мопеда педаль/подножка стоит впереди седла.
 * Порядок отрисовки седоков: с последнего места к первому (водитель поверх — его спина закрывает колени соседа сзади).
 *
 * Стиль — как у фонов: плоские формы без контуров, тёмный уплотнитель только вокруг стёкол, палитра content/style.json.
 */
import { useId, type ReactNode } from "react";
import type { VehicleKind } from "@jf/core";

export type VehicleSpec = {
  /** Габарит рисунка (px при масштабе 1): ширина и высота над полом. */
  w: number;
  h: number;
  /**
   * Места седоков по порядку (первое — водитель): dx — от центра к переду (+), dy — подъём стоп куклы над полом (px),
   * s — масштаб куклы относительно плана (в окне автобуса куклы мельче, чтобы голова попала в окно).
   */
  seats: { dx: number; dy: number; s: number }[];
  /** true — седок сидит сверху (велосипед, мотоцикл, телега); false — виден в окне между слоями back/front. */
  open: boolean;
  /** Где выходят: dx двери от центра. */
  door: number;
  /** Сколько секунд едет от края до метки. */
  driveSec: number;
};

const S = (dx: number, dy: number, s = 1) => ({ dx, dy, s });

/**
 * Рисунки сделаны в своих «чертёжных» координатах; ox сдвигает рисунок, чтобы габарит был симметричен вокруг 0.
 * Места и дверь заданы в тех же чертёжных координатах — сдвиг применяется ниже, в VEHICLE_SPECS.
 */
const DESIGN: Record<VehicleKind, VehicleSpec & { ox: number }> = {
  car: { ox: -5, w: 880, h: 565, seats: [S(112, 85, 0.82), S(-165, 85, 0.82)], open: false, door: 125, driveSec: 1.6 },
  taxi: { ox: -5, w: 880, h: 615, seats: [S(112, 85, 0.82), S(-165, 85, 0.82)], open: false, door: 125, driveSec: 1.6 },
  "police-car": { ox: -5, w: 880, h: 610, seats: [S(112, 85, 0.82), S(-165, 85, 0.82)], open: false, door: 125, driveSec: 1.3 },
  ambulance: { ox: 0, w: 850, h: 695, seats: [S(200, 138, 0.82), S(-150, 138, 0.82)], open: false, door: -150, driveSec: 1.4 },
  bus: {
    ox: 0, w: 1420, h: 625,
    seats: [S(512, 165, 0.72), S(188, 165, 0.72), S(-16, 165, 0.72), S(-361, 165, 0.72), S(-564, 165, 0.72)],
    open: false, door: 355, driveSec: 2.4,
  },
  tram: {
    ox: 0, w: 1400, h: 805,
    seats: [S(512, 184, 0.72), S(188, 184, 0.72), S(-16, 184, 0.72), S(-361, 184, 0.72), S(-564, 184, 0.72)],
    open: false, door: 355, driveSec: 2.6,
  },
  train: {
    ox: 0, w: 1520, h: 725,
    seats: [S(345, 225, 0.72), S(135, 225, 0.72), S(-75, 225, 0.72), S(-285, 225, 0.72), S(-495, 225, 0.72)],
    open: false, door: 485, driveSec: 3,
  },
  truck: { ox: -50, w: 1240, h: 625, seats: [S(335, 155, 0.82), S(-110, 205, 0.82), S(-370, 205, 0.82)], open: false, door: 335, driveSec: 2 },
  tractor: { ox: -15, w: 830, h: 580, seats: [S(-150, 269, 0.85)], open: true, door: -150, driveSec: 2.6 },
  bicycle: { ox: 0, w: 600, h: 290, seats: [S(-95, 105, 1)], open: true, door: -95, driveSec: 2 },
  motorcycle: { ox: 0, w: 690, h: 360, seats: [S(-60, 160, 1)], open: true, door: -60, driveSec: 1.2 },
  scooter: { ox: 15, w: 600, h: 380, seats: [S(-90, 80, 1)], open: true, door: -90, driveSec: 1.8 },
  "horse-cart": { ox: -150, w: 1270, h: 600, seats: [S(-165, 150, 0.85), S(-362, 150, 0.85)], open: true, door: -250, driveSec: 2.6 },
};

export const VEHICLE_SPECS: Record<VehicleKind, VehicleSpec> = Object.fromEntries(
  Object.entries(DESIGN).map(([k, { ox, ...sp }]) => [
    k,
    { ...sp, seats: sp.seats.map((s) => ({ ...s, dx: s.dx + ox })), door: sp.door + ox },
  ]),
) as Record<VehicleKind, VehicleSpec>;

// ——— палитра и мелочи ———

/** Осветлить (k>0) или затемнить (k<0) цвет #rrggbb. */
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const t = k < 0 ? 0 : 255;
  const p = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * p));
  return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
};

const TYRE = "#26262b";
const SEAL = "#23262c";
const INTERIOR = "#2c3640";
const FAR = "#4a6070";
const CHROME = "#d9dee3";
const GLASS = "#cfe8f5";
const DOOR_GLASS = "#8fb5c9";
const DARK = "#2b1d14";
const LAMP = "#f6e3a1";
const RED_LAMP = "#d8402f";
const WOOD = "#b07a45";
const SEAT = "#6b3b33";
const FONT = "Inter, Arial, sans-serif";

type P = [number, number];
const poly = (pts: P[]) => `M${pts.map((p) => `${p[0]} ${p[1]}`).join(" L")} Z`;
/** Прямоугольное окно: x0..x1, от высоты b до высоты t над полом. */
const win = (x0: number, x1: number, b: number, t: number) => poly([[x0, -b], [x0, -t], [x1, -t], [x1, -b]]);
/** Вырез колёсной арки: сегмент круга (cx, cy, R) над низом кузова by. */
const arch = (cx: number, cy: number, R: number, by: number) => {
  const d = by - cy;
  const hw = Math.sqrt(Math.max(0, R * R - d * d));
  return `M${cx - hw} ${by} A${R} ${R} 0 ${d > 0 ? 1 : 0} 1 ${cx + hw} ${by} Z`;
};
const deg = (rad: number) => (rad * 180) / Math.PI;

type Ctx = { t: number; moving: boolean; id: string; spd: number; /** цвет кузова легковой (scene.vehicles[].color) */ color?: string };
type Art = { back: ReactNode; front: ReactNode };

/** Угол поворота колеса радиуса r: машина едет со скоростью spd px/с. */
const turn = (c: Ctx, r: number) => deg((c.t * c.spd) / r) % 360;

/** Автомобильное колесо: шина, диск, болты (по ним видно вращение). */
const Wheel = ({ x, r, c, rim = CHROME, y = -r }: { x: number; r: number; c: Ctx; rim?: string; y?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={TYRE} />
    <circle cx={x} cy={y} r={r * 0.58} fill={rim} />
    <g transform={`rotate(${turn(c, r)} ${x} ${y})`}>
      <circle cx={x} cy={y} r={r * 0.46} fill={shade(rim, -0.12)} />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + r * 0.3 * Math.cos((a * Math.PI) / 180)} cy={y + r * 0.3 * Math.sin((a * Math.PI) / 180)} r={r * 0.075} fill={shade(rim, -0.4)} />
      ))}
    </g>
    <circle cx={x} cy={y} r={r * 0.15} fill={shade(rim, -0.3)} />
  </g>
);

/** Спицевое колесо (велосипед, мотоцикл, телега). */
const SpokeWheel = ({ x, r, c, tyre = TYRE, tw = 12, spoke = "#b9c0c6", n = 16, sw = 2.5, hub = "#8a9096", y = -r }: {
  x: number; r: number; c: Ctx; tyre?: string; tw?: number; spoke?: string; n?: number; sw?: number; hub?: string; y?: number;
}) => (
  <g>
    <g transform={`rotate(${turn(c, r)} ${x} ${y})`}>
      {Array.from({ length: n }, (_, k) => {
        const a = (k / n) * Math.PI * 2;
        return <line key={k} x1={x} y1={y} x2={x + (r - tw / 2) * Math.cos(a)} y2={y + (r - tw / 2) * Math.sin(a)} stroke={spoke} strokeWidth={sw} />;
      })}
    </g>
    <circle cx={x} cy={y} r={r - tw / 2} fill="none" stroke={tyre} strokeWidth={tw} />
    <circle cx={x} cy={y} r={r - tw - 2} fill="none" stroke={shade(spoke, -0.15)} strokeWidth={3} />
    <circle cx={x} cy={y} r={Math.max(6, r * 0.1)} fill={hub} />
  </g>
);

/** Стёкла поверх седоков: лёгкий отлив, блик в верхнем углу, тёмный уплотнитель по краю. */
const Glass = ({ d, id, glints = [] }: { d: string; id: string; glints?: P[] }) => (
  <g>
    <defs>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
    </defs>
    <path d={d} fill={GLASS} opacity={0.1} />
    <g clipPath={`url(#${id})`} fill="#ffffff" opacity={0.35}>
      {glints.map(([x, y], k) => (
        <path key={k} d={`M${x - 14} ${y} L${x + 6} ${y} L${x - 44} ${y + 70} L${x - 64} ${y + 70} Z`} />
      ))}
    </g>
    <path d={d} fill="none" stroke={SEAL} strokeWidth={10} strokeLinejoin="round" />
  </g>
);

/** Спинка сиденья с подголовником за седоком (слой back). */
const SeatBack = ({ dx, dy, s, color = SEAT }: { dx: number; dy: number; s: number; color?: string }) => (
  <g>
    <rect x={dx - 124 * s} y={-(dy + 300 * s)} width={54 * s} height={250 * s} rx={20 * s} fill={color} />
    <rect x={dx - 116 * s} y={-(dy + 400 * s)} width={42 * s} height={84 * s} rx={16 * s} fill={shade(color, 0.1)} />
    <rect x={dx - 102 * s} y={-(dy + 318 * s)} width={10 * s} height={22 * s} fill={shade(color, -0.35)} />
  </g>
);

/** Выхлоп: облачка уходят назад, пока едет. */
const Puffs = ({ x, y, c }: { x: number; y: number; c: Ctx }) =>
  c.moving ? (
    <g>
      {[0, 1, 2].map((i) => {
        const p = (c.t * 1.7 + i / 3) % 1;
        return <circle key={i} cx={x - p * 110} cy={y - p * 40} r={9 + p * 24} fill="#c9ccd0" opacity={0.6 * (1 - p)} />;
      })}
    </g>
  ) : null;

/** Мигалка: два огня по очереди. */
const blinkOn = (c: Ctx, k = 0) => Math.floor(c.t * 5 + k) % 2 === 0;

// ——— легковая: машина, такси, полиция (один кузов «Жигули») ———

const SEDAN_OUTER =
  "M-430 -75 L-430 -262 Q-430 -296 -398 -298 L-352 -302 L-298 -538 Q-290 -562 -262 -562 L200 -562 Q226 -562 236 -540 L305 -304 L405 -296 Q440 -292 440 -260 L440 -75 Q440 -45 412 -45 L-402 -45 Q-430 -45 -430 -75 Z";
const SEDAN_WIN = poly([[-12, -300], [-12, -528], [196, -528], [264, -300]]) + " " + poly([[-42, -300], [-42, -528], [-262, -528], [-321, -300]]);

const sedan = (c: Ctx, kind: "car" | "taxi" | "police-car"): Art => {
  const body = c.color ?? (kind === "taxi" ? "#e8b830" : kind === "police-car" ? "#eef2f6" : "#4a6fa5");
  const seams = shade(body, -0.3);
  const seats = DESIGN[kind].seats;
  const back = (
    <g>
      <Puffs x={-450} y={-70} c={c} />
      <path d={poly([[-330, -280], [-275, -545], [215, -545], [285, -280]])} fill={INTERIOR} />
      <rect x={-250} y={-515} width={200} height={110} rx={10} fill={FAR} />
      <rect x={-2} y={-515} width={190} height={110} rx={10} fill={FAR} />
      {seats.map((s, k) => (
        <SeatBack key={k} {...s} color={kind === "police-car" ? "#3d4650" : SEAT} />
      ))}
    </g>
  );
  const front = (
    <g>
      <defs>
        <clipPath id={`${c.id}b`}>
          <path d={SEDAN_OUTER + " " + SEDAN_WIN} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={SEDAN_OUTER + " " + SEDAN_WIN} fill={body} fillRule="evenodd" />
      <g clipPath={`url(#${c.id}b)`}>
        <rect x={-440} y={-560} width={890} height={30} fill={shade(body, 0.12)} />
        {kind === "police-car" && (
          <g>
            <rect x={-440} y={-258} width={890} height={56} fill="#2f5fa8" />
            <rect x={-440} y={-202} width={890} height={9} fill="#c8253d" />
          </g>
        )}
        {kind === "taxi" && (
          <g>
            <rect x={-440} y={-250} width={890} height={30} fill="#f6efe0" />
            {Array.from({ length: 64 }, (_, i) => (
              <rect key={i} x={-430 + i * 14} y={i % 2 ? -250 : -235} width={14} height={15} fill={DARK} />
            ))}
          </g>
        )}
        {kind === "car" && <rect x={-440} y={-212} width={890} height={9} fill={CHROME} />}
        <rect x={-440} y={-112} width={890} height={70} fill={shade(body, -0.2)} />
        <path d="M-27 -300 V-112 M262 -300 Q262 -230 258 -158 M-321 -300 L-310 -165 M-310 -112 H258" stroke={seams} strokeWidth={4} fill="none" />
      </g>
      <rect x={-2} y={-284} width={38} height={10} rx={5} fill={shade(body, -0.35)} />
      <rect x={-290} y={-284} width={38} height={10} rx={5} fill={shade(body, -0.35)} />
      {kind === "police-car" && (
        <g>
          <circle cx={120} cy={-155} r={26} fill="#2f5fa8" />
          <path d="M120 -175 L126 -160 L142 -160 L129 -150 L134 -135 L120 -144 L106 -135 L111 -150 L98 -160 L114 -160 Z" fill="#f2c94c" />
        </g>
      )}
      <path d={arch(300, -74, 90, -45)} fill="#1d1f23" />
      <path d={arch(-300, -74, 90, -45)} fill="#1d1f23" />
      <Wheel x={300} r={74} c={c} />
      <Wheel x={-300} r={74} c={c} />
      <rect x={418} y={-130} width={36} height={22} rx={9} fill={CHROME} />
      <rect x={-446} y={-130} width={36} height={22} rx={9} fill={CHROME} />
      <rect x={428} y={-272} width={16} height={36} rx={6} fill={LAMP} />
      <rect x={430} y={-228} width={12} height={16} rx={4} fill="#f0a030" />
      <rect x={-438} y={-272} width={14} height={40} rx={5} fill={RED_LAMP} />
      <path d="M272 -318 L300 -326 L306 -344 L276 -342 Z" fill={SEAL} />
      <ellipse cx={226} cy={-338} rx={10} ry={42} transform="rotate(-22 226 -338)" fill="none" stroke={SEAL} strokeWidth={8} />
      {kind === "taxi" && <circle cx={240} cy={-322} r={10} fill="#5fd16b" />}
      <Glass d={SEDAN_WIN} id={`${c.id}g`} glints={[[180, -528], [-62, -528]]} />
      {kind === "taxi" && (
        <g>
          <path d="M-95 -560 L-84 -612 L46 -612 L57 -560 Z" fill="#f6efe0" />
          <path d="M-95 -560 L-90 -580 L52 -580 L57 -560 Z" fill={DARK} />
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={-88 + i * 14} y={i % 2 ? -580 : -570} width={14} height={10} fill="#f6efe0" />
          ))}
          <text x={-19} y={-584} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={DARK}>TAXI</text>
          <circle cx={58} cy={-604} r={9} fill="#5fd16b" />
        </g>
      )}
      {kind === "police-car" && (
        <g>
          <rect x={-130} y={-576} width={200} height={16} rx={5} fill={SEAL} />
          <rect x={-124} y={-608} width={92} height={34} rx={12} fill={blinkOn(c) ? "#3d7be0" : "#24467f"} />
          <rect x={-26} y={-608} width={92} height={34} rx={12} fill={blinkOn(c, 1) ? "#e8403a" : "#7d2420"} />
          {blinkOn(c) && <circle cx={-78} cy={-592} r={46} fill="#3d7be0" opacity={0.18} />}
          {blinkOn(c, 1) && <circle cx={20} cy={-592} r={46} fill="#e8403a" opacity={0.18} />}
        </g>
      )}
    </g>
  );
  return { back, front };
};

// ——— скорая (фургон-«буханка») ———

const AMB_OUTER = "M-420 -80 L-420 -570 Q-420 -640 -350 -640 L300 -640 Q372 -640 392 -570 L420 -360 L420 -80 Q420 -50 390 -50 L-390 -50 Q-420 -50 -420 -80 Z";
const AMB_WIN = poly([[105, -340], [105, -585], [332, -585], [354, -566], [383, -340]]) + " " + win(-255, -45, 340, 585);

const Cross = ({ x, y, a, red = "#c8253d" }: { x: number; y: number; a: number; red?: string }) => (
  <g>
    <rect x={x - a / 2} y={y - a / 6} width={a} height={a / 3} fill={red} />
    <rect x={x - a / 6} y={y - a / 2} width={a / 3} height={a} fill={red} />
  </g>
);

const ambulance = (c: Ctx): Art => {
  const body = "#f1f1ec";
  const seams = shade(body, -0.25);
  const back = (
    <g>
      <Puffs x={-440} y={-70} c={c} />
      <path d={poly([[-400, -605], [345, -605], [394, -330], [-400, -330]])} fill={INTERIOR} />
      <rect x={-230} y={-555} width={170} height={110} rx={10} fill={FAR} />
      <rect x={125} y={-555} width={190} height={110} rx={10} fill={FAR} />
      {DESIGN.ambulance.seats.map((s, k) => (
        <SeatBack key={k} {...s} color={k === 0 ? SEAT : "#5a6b78"} />
      ))}
      <rect x={-60} y={-610} width={18} height={270} fill="#3a4651" />
    </g>
  );
  const front = (
    <g>
      <defs>
        <clipPath id={`${c.id}b`}>
          <path d={AMB_OUTER + " " + AMB_WIN} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={AMB_OUTER + " " + AMB_WIN} fill={body} fillRule="evenodd" />
      <g clipPath={`url(#${c.id}b)`}>
        <rect x={-430} y={-640} width={860} height={26} fill="#ffffff" />
        <rect x={-430} y={-302} width={860} height={34} fill="#c8253d" />
        <rect x={-430} y={-110} width={860} height={70} fill={shade(body, -0.14)} />
        <path d="M88 -592 V-120 H410 M-275 -120 V-592 H-25 V-120 Z" stroke={seams} strokeWidth={4} fill="none" />
      </g>
      <Cross x={-348} y={-450} a={104} />
      <Cross x={250} y={-195} a={74} />
      <rect x={110} y={-326} width={36} height={10} rx={5} fill={shade(body, -0.4)} />
      <rect x={-70} y={-326} width={10} height={40} rx={5} fill={shade(body, -0.4)} />
      <path d={arch(250, -76, 92, -50)} fill="#1d1f23" />
      <path d={arch(-260, -76, 92, -50)} fill="#1d1f23" />
      <Wheel x={250} r={76} c={c} />
      <Wheel x={-260} r={76} c={c} />
      <rect x={404} y={-134} width={32} height={24} rx={9} fill={CHROME} />
      <rect x={-436} y={-134} width={32} height={24} rx={9} fill={CHROME} />
      <rect x={410} y={-280} width={16} height={40} rx={6} fill={LAMP} />
      <rect x={-428} y={-300} width={14} height={44} rx={5} fill={RED_LAMP} />
      <path d="M388 -380 L420 -392 L424 -414 L392 -410 Z" fill={SEAL} />
      <Glass d={AMB_WIN} id={`${c.id}g`} glints={[[320, -585], [-62, -585]]} />
      <rect x={200} y={-654} width={96} height={16} rx={5} fill={SEAL} />
      {blinkOn(c) && <circle cx={248} cy={-672} r={56} fill="#3d7be0" opacity={0.2} />}
      <rect x={214} y={-692} width={68} height={42} rx={18} fill={blinkOn(c) ? "#3d7be0" : "#2a5aa8"} />
      <rect x={226} y={-686} width={16} height={26} rx={6} fill="#ffffff" opacity={0.45} />
    </g>
  );
  return { back, front };
};

// ——— автобус и трамвай (общая раскладка окон: водитель + 4 окна, две двери) ———

const ROW_X: [number, number][] = [[428, 612], [95, 282], [-110, 77], [-455, -268], [-655, -473]];
const ROW_DOORS: [number, number][] = [[296, 414], [-250, -128]];

/** Двустворчатая дверь со стёклами (кузов поверх, седоков за ней нет). */
const Door = ({ x0, x1, bottom, top, frame = "#3a3f45" }: { x0: number; x1: number; bottom: number; top: number; frame?: string }) => {
  const m = (x0 + x1) / 2;
  const leaf = (a: number, b: number) => (
    <g>
      <rect x={a + 10} y={-(top - 12)} width={b - a - 20} height={(top - bottom) * 0.52} rx={6} fill={DOOR_GLASS} />
      <rect x={a + 10} y={-(bottom + 12 + (top - bottom) * 0.36)} width={b - a - 20} height={(top - bottom) * 0.36} rx={6} fill={DOOR_GLASS} />
    </g>
  );
  return (
    <g>
      <rect x={x0} y={-top} width={x1 - x0} height={top - bottom} rx={8} fill={frame} />
      {leaf(x0, m)}
      {leaf(m, x1)}
      <rect x={m - 2} y={-top} width={4} height={top - bottom} fill={SEAL} />
      <rect x={x0 + 14} y={-(top - (top - bottom) * 0.55)} width={x1 - x0 - 28} height={7} fill={CHROME} opacity={0.7} />
    </g>
  );
};

const rowInterior = (dy: number, b: number, t: number, s: number) => (
  <g>
    <rect x={-690} y={-(t + 30)} width={1360} height={t - b + 60} fill={INTERIOR} />
    {ROW_X.map(([x0, x1], k) => (
      <rect key={k} x={x0 + 16} y={-(t - 14)} width={x1 - x0 - 32} height={(t - b) * 0.5} rx={10} fill={FAR} />
    ))}
    <rect x={-690} y={-(t - 22)} width={1330} height={7} fill="#9aa3aa" />
    {ROW_X.map(([x0, x1], k) => (
      <SeatBack key={k} dx={(x0 + x1) / 2 + 4} dy={dy} s={s} color={k === 0 ? "#3d4650" : "#7a2e2e"} />
    ))}
  </g>
);

const BUS_OUTER = "M-700 -90 L-700 -560 Q-700 -625 -635 -625 L640 -625 Q700 -625 700 -565 L700 -90 Q700 -50 660 -50 L-660 -50 Q-700 -50 -700 -90 Z";
const BUS_WIN = ROW_X.map(([a, b]) => win(a, b, 345, 560)).join(" ");

const bus = (c: Ctx): Art => {
  const top = "#f2e6d0";
  const low = "#e0a030";
  const back = (
    <g>
      <Puffs x={-720} y={-70} c={c} />
      {rowInterior(165, 345, 560, 0.72)}
    </g>
  );
  const front = (
    <g>
      <defs>
        <clipPath id={`${c.id}b`}>
          <path d={BUS_OUTER + " " + BUS_WIN} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={BUS_OUTER + " " + BUS_WIN} fill={top} fillRule="evenodd" />
      <g clipPath={`url(#${c.id}b)`}>
        <rect x={-710} y={-625} width={1420} height={24} fill={shade(top, -0.08)} />
        <rect x={-710} y={-318} width={1420} height={290} fill={low} />
        <rect x={-710} y={-332} width={1420} height={14} fill="#c8553d" />
        <rect x={-710} y={-112} width={1420} height={70} fill={shade(low, -0.2)} />
        <rect x={680} y={-600} width={30} height={270} fill={DOOR_GLASS} />
        <rect x={-712} y={-590} width={24} height={220} fill={DOOR_GLASS} />
      </g>
      {ROW_DOORS.map(([a, b], k) => (
        <Door key={k} x0={a} x1={b} bottom={58} top={560} />
      ))}
      <path d={arch(540, -84, 100, -50)} fill="#1d1f23" />
      <path d={arch(-440, -84, 100, -50)} fill="#1d1f23" />
      <Wheel x={540} r={84} c={c} />
      <Wheel x={-440} r={84} c={c} />
      <rect x={470} y={-614} width={150} height={52} rx={8} fill="#232323" />
      <text x={545} y={-574} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#f0a030">12</text>
      <rect x={684} y={-178} width={20} height={36} rx={6} fill={LAMP} />
      <rect x={-706} y={-190} width={16} height={44} rx={5} fill={RED_LAMP} />
      <rect x={690} y={-118} width={24} height={44} rx={8} fill="#3a3f45" />
      <rect x={-714} y={-118} width={24} height={44} rx={8} fill="#3a3f45" />
      <path d="M700 -520 L734 -500 L734 -474" stroke={SEAL} strokeWidth={7} fill="none" />
      <rect x={722} y={-534} width={20} height={64} rx={8} fill={SEAL} />
      <Glass d={BUS_WIN} id={`${c.id}g`} glints={ROW_X.map(([, b]) => [b - 18, -560] as P)} />
    </g>
  );
  return { back, front };
};

const TRAM_OUTER = "M-700 -110 L-700 -560 Q-700 -655 -610 -655 L610 -655 Q700 -655 700 -560 L700 -110 Q700 -75 665 -75 L-665 -75 Q-700 -75 -700 -110 Z";
const TRAM_WIN = ROW_X.map(([a, b]) => win(a, b, 370, 585)).join(" ");

const Bogie = ({ cx, c, r = 42, gap = 50, y = -r }: { cx: number; c: Ctx; r?: number; gap?: number; y?: number }) => (
  <g>
    <rect x={cx - gap - r} y={y - 26} width={2 * (gap + r)} height={40} rx={10} fill="#33363b" />
    <Wheel x={cx - gap} r={r} y={y} c={c} rim="#8a9096" />
    <Wheel x={cx + gap} r={r} y={y} c={c} rim="#8a9096" />
  </g>
);

const tram = (c: Ctx): Art => {
  const red = "#c8553d";
  const cream = "#f2e6d0";
  const back = (
    <g>
      <Bogie cx={440} c={c} />
      <Bogie cx={-440} c={c} />
      {rowInterior(184, 370, 585, 0.72)}
    </g>
  );
  const front = (
    <g>
      <defs>
        <clipPath id={`${c.id}b`}>
          <path d={TRAM_OUTER + " " + TRAM_WIN} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g stroke="#3a3f45" strokeWidth={10} strokeLinecap="round" fill="none">
        <path d="M-110 -668 L40 -738 L-40 -796" />
        <path d="M-20 -668 L40 -738" />
        <path d="M-96 -798 H18" strokeWidth={12} />
        <path d="M-96 -798 q-16 0 -20 -10 M18 -798 q16 0 20 -10" strokeWidth={7} />
      </g>
      <rect x={-130} y={-672} width={130} height={20} rx={6} fill="#5a6068" />
      <rect x={-260} y={-668} width={120} height={16} rx={6} fill="#5a6068" />
      <path d={TRAM_OUTER + " " + TRAM_WIN} fill={red} fillRule="evenodd" />
      <g clipPath={`url(#${c.id}b)`}>
        <rect x={-710} y={-655} width={1420} height={30} fill={shade(red, 0.15)} />
        <rect x={-710} y={-608} width={1420} height={256} fill={cream} />
        <rect x={-710} y={-352} width={1420} height={12} fill={DARK} opacity={0.7} />
        <rect x={-710} y={-135} width={1420} height={70} fill={shade(red, -0.22)} />
        <rect x={676} y={-620} width={30} height={270} fill={DOOR_GLASS} />
        <rect x={-706} y={-620} width={30} height={270} fill={DOOR_GLASS} />
      </g>
      {ROW_DOORS.map(([a, b], k) => (
        <Door key={k} x0={a} x1={b} bottom={88} top={590} frame="#5a2a24" />
      ))}
      <rect x={480} y={-648} width={130} height={46} rx={8} fill="#232323" />
      <text x={545} y={-611} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill="#f0a030">3</text>
      <circle cx={690} cy={-220} r={18} fill={LAMP} />
      <rect x={-702} y={-230} width={14} height={40} rx={5} fill={RED_LAMP} />
      <Glass d={TRAM_WIN} id={`${c.id}g`} glints={ROW_X.map(([, b]) => [b - 18, -585] as P)} />
    </g>
  );
  return { back, front };
};

// ——— поезд: пассажирский вагон + хвост локомотива справа ———

const TRAIN_X = [345, 135, -75, -285, -495];
const TRAIN_OUTER = "M-760 -125 L-760 -625 Q-760 -688 -700 -692 Q-100 -722 500 -692 Q560 -688 560 -625 L560 -125 Z";
const TRAIN_WIN = TRAIN_X.map((x) => win(x - 95, x + 95, 415, 625)).join(" ");

const train = (c: Ctx): Art => {
  const green = "#3f6e4a";
  const loco = "#a8323a";
  const back = (
    <g>
      <rect x={-740} y={-650} width={1290} height={270} fill={INTERIOR} />
      {TRAIN_X.map((x, k) => (
        <rect key={k} x={x - 78} y={-596} width={156} height={95} rx={10} fill={FAR} />
      ))}
      {TRAIN_X.map((x, k) => (
        <SeatBack key={k} dx={x} dy={225} s={0.72} color="#5a4a3a" />
      ))}
      <rect x={-740} y={-640} width={1290} height={8} fill="#9aa3aa" />
    </g>
  );
  const front = (
    <g>
      <defs>
        <clipPath id={`${c.id}b`}>
          <path d={TRAIN_OUTER + " " + TRAIN_WIN} clipRule="evenodd" />
        </clipPath>
      </defs>
      {/* сцепка и гармошка перехода */}
      <rect x={556} y={-650} width={28} height={500} fill="#3a3f45" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={556} y={-640 + i * 50} width={28} height={6} fill="#22252b" />
      ))}
      <rect x={548} y={-218} width={44} height={28} rx={6} fill="#22252b" />
      {/* хвост локомотива */}
      <path d="M582 -130 L582 -640 Q582 -722 664 -724 L770 -724 L770 -130 Z" fill={loco} />
      <rect x={582} y={-410} width={190} height={34} fill="#f2e6d0" />
      <rect x={608} y={-610} width={74} height={120} rx={12} fill={DOOR_GLASS} />
      <rect x={608} y={-610} width={74} height={120} rx={12} fill="none" stroke={SEAL} strokeWidth={8} />
      <rect x={700} y={-470} width={8} height={300} rx={4} fill={CHROME} />
      <circle cx={630} cy={-200} r={16} fill={RED_LAMP} />
      <rect x={582} y={-130} width={190} height={30} fill="#2a2d31" />
      <Bogie cx={690} c={c} r={46} gap={58} />
      {/* вагон */}
      <path d={TRAIN_OUTER + " " + TRAIN_WIN} fill={green} fillRule="evenodd" />
      <g clipPath={`url(#${c.id}b)`}>
        <rect x={-770} y={-730} width={1340} height={72} fill="#9aa0a6" />
        <rect x={-770} y={-660} width={1340} height={8} fill={shade(green, -0.3)} />
        <rect x={-770} y={-398} width={1340} height={14} fill="#e0c040" />
        <rect x={-770} y={-170} width={1340} height={45} fill={shade(green, -0.25)} />
      </g>
      {[[440, 530], [-745, -660]].map(([a, b], k) => (
        <g key={k}>
          <rect x={a} y={-640} width={b - a} height={510} rx={6} fill={shade(green, -0.12)} />
          <rect x={a + 14} y={-610} width={b - a - 28} height={130} rx={8} fill={DOOR_GLASS} />
          <rect x={a + 14} y={-610} width={b - a - 28} height={130} rx={8} fill="none" stroke={SEAL} strokeWidth={6} />
          <rect x={b - 22} y={-400} width={8} height={36} rx={4} fill={CHROME} />
          <rect x={a - 10} y={-520} width={7} height={360} rx={3} fill={CHROME} />
        </g>
      ))}
      <rect x={-730} y={-125} width={1260} height={30} fill="#2a2d31" />
      <rect x={-300} y={-112} width={180} height={48} rx={6} fill="#3a3f45" />
      <rect x={60} y={-112} width={140} height={48} rx={6} fill="#3a3f45" />
      <Bogie cx={-600} c={c} r={46} gap={62} />
      <Bogie cx={380} c={c} r={46} gap={62} />
      <Glass d={TRAIN_WIN} id={`${c.id}g`} glints={TRAIN_X.map((x) => [x + 80, -625] as P)} />
    </g>
  );
  return { back, front };
};

// ——— грузовик: кабина (водитель в окне) + деревянный кузов (седоки сидят в кузове) ———

const TRUCK_CAB = "M200 -110 L200 -590 Q200 -620 230 -620 L430 -620 Q445 -620 450 -605 L480 -390 L600 -372 Q650 -362 655 -320 L655 -130 Q655 -100 625 -100 L230 -100 Q200 -100 200 -110 Z";
const TRUCK_WIN = poly([[232, -365], [232, -600], [424, -600], [455, -365]]);

const truck = (c: Ctx): Art => {
  const cab = "#5b8c5a";
  const stake = shade(cab, -0.35);
  const back = (
    <g>
      <Puffs x={-580} y={-120} c={c} />
      <rect x={210} y={-605} width={250} height={260} fill={INTERIOR} />
      <rect x={250} y={-575} width={170} height={100} rx={10} fill={FAR} />
      <SeatBack {...DESIGN.truck.seats[0]} />
      {/* задний борт кузова виден над передним — тот же уровень, поэтому только сено/ящик не рисуем */}
      <rect x={-560} y={-215} width={735} height={20} fill={shade(WOOD, -0.25)} />
    </g>
  );
  const front = (
    <g>
      <defs>
        <clipPath id={`${c.id}b`}>
          <path d={TRUCK_CAB + " " + TRUCK_WIN} clipRule="evenodd" />
        </clipPath>
      </defs>
      <rect x={-560} y={-165} width={1215} height={34} fill="#2a2d31" />
      <rect x={-492} y={-165} width={14} height={125} rx={4} fill="#22252b" />
      {/* кузов */}
      <rect x={-560} y={-205} width={735} height={34} fill="#3a2f28" />
      <rect x={-560} y={-385} width={735} height={182} fill={WOOD} />
      {[-325, -265].map((y) => (
        <rect key={y} x={-560} y={y} width={735} height={6} fill={shade(WOOD, -0.3)} />
      ))}
      <rect x={-560} y={-390} width={735} height={14} fill={shade(WOOD, -0.15)} />
      {[-560, -330, -100, 160].map((x) => (
        <rect key={x} x={x} y={-392} width={16} height={190} fill={stake} />
      ))}
      <rect x={160} y={-440} width={22} height={240} rx={4} fill={stake} />
      {/* кабина и капот */}
      <path d={TRUCK_CAB + " " + TRUCK_WIN} fill={cab} fillRule="evenodd" />
      <g clipPath={`url(#${c.id}b)`}>
        <rect x={190} y={-620} width={480} height={26} fill={shade(cab, 0.12)} />
        <path d="M218 -128 V-598 M218 -128 H470" stroke={shade(cab, -0.3)} strokeWidth={4} fill="none" />
        <path d="M500 -350 H600 M500 -330 H610 M500 -310 H615" stroke={shade(cab, -0.25)} strokeWidth={5} />
      </g>
      <rect x={240} y={-348} width={36} height={10} rx={5} fill={shade(cab, -0.4)} />
      <path d="M445 -110 Q450 -262 545 -264 Q640 -264 668 -150 L668 -110 Z" fill={shade(cab, -0.12)} />
      <path d={arch(540, -82, 98, -110)} fill="#1d1f23" />
      <Wheel x={540} r={82} c={c} />
      <circle cx={-380} cy={-82} r={86} fill="#1d1f23" />
      <Wheel x={-380} r={82} c={c} />
            <circle cx={640} cy={-288} r={19} fill={CHROME} />
      <circle cx={640} cy={-288} r={13} fill={LAMP} />
      <rect x={645} y={-320} width={16} height={170} rx={5} fill="#3a3f45" />
      <rect x={640} y={-140} width={40} height={30} rx={8} fill={CHROME} />
      <path d="M455 -430 L490 -446 L490 -470" stroke={SEAL} strokeWidth={6} fill="none" />
      <rect x={482} y={-500} width={16} height={56} rx={6} fill={SEAL} />
      <Glass d={TRUCK_WIN} id={`${c.id}g`} glints={[[410, -600]]} />
    </g>
  );
  return { back, front };
};

// ——— трактор: открытое сиденье над большим задним колесом ———

const TractorWheel = ({ x, r, c, rim }: { x: number; r: number; c: Ctx; rim: string }) => {
  const n = Math.round(r / 9);
  return (
    <g>
      <g transform={`rotate(${turn(c, r)} ${x} ${-r})`}>
        {Array.from({ length: n }, (_, k) => (
          <rect key={k} x={x - 11} y={-r - r - 6} width={22} height={24} rx={4} fill={TYRE} transform={`rotate(${(k / n) * 360} ${x} ${-r})`} />
        ))}
      </g>
      <circle cx={x} cy={-r} r={r - 4} fill={TYRE} />
      <circle cx={x} cy={-r} r={r * 0.56} fill={rim} />
      <g transform={`rotate(${turn(c, r)} ${x} ${-r})`}>
        {Array.from({ length: 6 }, (_, k) => (
          <circle key={k} cx={x + r * 0.36 * Math.cos((k * Math.PI) / 3)} cy={-r + r * 0.36 * Math.sin((k * Math.PI) / 3)} r={r * 0.07} fill={shade(rim, -0.35)} />
        ))}
      </g>
      <circle cx={x} cy={-r} r={r * 0.2} fill={shade(rim, -0.2)} />
    </g>
  );
};

const tractor = (c: Ctx): Art => {
  const red = "#c8553d";
  const rim = "#f2e6d0";
  const bob = c.moving ? Math.sin(c.t * 40) * 1.5 : 0;
  const back = (
    <g>
      {c.moving && <Puffs x={327} y={-600} c={{ ...c, t: c.t * 1.3 }} />}
      <rect x={20} y={-200} width={300} height={70} rx={10} fill="#4a4f55" />
      <rect x={-232} y={-470} width={28} height={150} rx={12} fill="#33363b" />
      <rect x={-220} y={-340} width={140} height={24} rx={10} fill="#33363b" />
      <rect x={-160} y={-318} width={18} height={110} fill="#4a4f55" />
      <rect x={-30} y={-276} width={100} height={14} rx={4} fill="#4a4f55" />
    </g>
  );
  const front = (
    <g>
      <g transform={`translate(0 ${bob})`}>
        <path d="M-20 -170 L-20 -365 Q-20 -385 0 -385 L395 -385 Q420 -385 420 -360 L420 -180 L400 -170 Z" fill={red} />
        <rect x={-20} y={-385} width={440} height={18} fill={shade(red, 0.15)} />
        <rect x={398} y={-370} width={22} height={186} rx={4} fill="#3a3f45" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={398} y={-355 + i * 34} width={22} height={6} fill="#7a8088" />
        ))}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={230 + i * 40} y={-320} width={14} height={80} rx={6} fill={shade(red, -0.3)} />
        ))}
        <rect x={-20} y={-200} width={440} height={30} fill={shade(red, -0.25)} />
        <rect x={318} y={-560} width={18} height={180} fill="#3a3f45" />
        <rect x={310} y={-578} width={34} height={20} rx={4} fill="#22252b" />
        <circle cx={408} cy={-330} r={14} fill={LAMP} />
        <path d="M60 -385 L-12 -440" stroke={SEAL} strokeWidth={10} strokeLinecap="round" />
        <ellipse cx={-22} cy={-446} rx={12} ry={46} transform="rotate(-25 -22 -446)" fill="none" stroke={SEAL} strokeWidth={9} />
      </g>
      <TractorWheel x={300} r={100} c={c} rim={rim} />
      <path d={`M${300 - 122} -100 A122 122 0 0 1 ${300 + 122} -100 L${300 + 106} -100 A106 106 0 0 0 ${300 - 106} -100 Z`} fill={red} />
      <TractorWheel x={-170} r={190} c={c} rim={rim} />
      <path d={`M${-170 - 222} -190 A222 222 0 0 1 ${-170 + 222} -190 L${-170 + 200} -190 A200 200 0 0 0 ${-170 - 200} -190 Z`} fill={red} />
      <rect x={-394} y={-200} width={34} height={14} rx={4} fill={shade(red, -0.25)} />
      <rect x={30} y={-200} width={34} height={14} rx={4} fill={shade(red, -0.25)} />
      <rect x={-380} y={-260} width={14} height={30} rx={4} fill={RED_LAMP} />
    </g>
  );
  return { back, front };
};

// ——— велосипед («Украина»-круизёр: педали впереди седла — под ботинками сидящей куклы) ———

const bicycle = (c: Ctx): Art => {
  const frame = "#2f7f8a";
  const crank: P = [25, -112];
  // педали стоят под ботинками (ноги куклы не крутят педали — иначе ботинки «отрываются»)
  const near: P = [85, -106];
  const far: P = [-35, -118];
  const back = (
    <g>
      <SpokeWheel x={-200} r={85} c={c} />
      <SpokeWheel x={200} r={85} c={c} />
      <path d="M-298 -96 A98 98 0 0 1 -112 -112" stroke={frame} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M112 -112 A98 98 0 0 1 298 -96" stroke={frame} strokeWidth={9} fill="none" strokeLinecap="round" />
      <g stroke={frame} strokeWidth={14} strokeLinecap="round" fill="none">
        <path d="M-200 -85 L25 -112" />
        <path d="M-200 -85 L-100 -166" />
        <path d="M25 -112 L-100 -166" />
        <path d="M25 -112 L150 -215" />
        <path d="M-100 -166 L142 -248" />
        <path d="M144 -258 L160 -192 L200 -85" strokeWidth={12} />
      </g>
      <path d="M-104 -170 L-270 -176 M-240 -176 L-200 -85" stroke="#7a8088" strokeWidth={6} fill="none" />
      <line x1={far[0]} y1={far[1]} x2={crank[0]} y2={crank[1]} stroke="#555b62" strokeWidth={8} />
      <rect x={far[0] - 16} y={far[1] - 5} width={32} height={10} rx={3} fill="#33363b" />
      <circle cx={crank[0]} cy={crank[1]} r={24} fill="none" stroke="#7a8088" strokeWidth={6} />
      <path d={`M${crank[0]} ${crank[1] + 24} L-200 -78 M${crank[0]} ${crank[1] - 24} L-200 -92`} stroke="#555b62" strokeWidth={3} />
      <path d="M-150 -170 Q-155 -190 -120 -190 L-62 -184 Q-50 -178 -62 -170 Z" fill="#33363b" />
      <rect x={-104} y={-172} width={10} height={14} fill="#7a8088" />
    </g>
  );
  const front = (
    <g>
      <line x1={crank[0]} y1={crank[1]} x2={near[0]} y2={near[1]} stroke="#7a8088" strokeWidth={9} strokeLinecap="round" />
      <rect x={near[0] - 18} y={near[1] - 3} width={36} height={11} rx={3} fill="#22252b" />
      <path d="M144 -258 L136 -282 M136 -282 Q80 -290 48 -246" stroke="#9aa0a6" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M50 -250 L28 -232" stroke="#33363b" strokeWidth={14} strokeLinecap="round" />
      <circle cx={160} cy={-262} r={13} fill={LAMP} />
      <circle cx={160} cy={-262} r={13} fill="none" stroke="#9aa0a6" strokeWidth={4} />
    </g>
  );
  return { back, front };
};

// ——— мотоцикл (ИЖ/«Урал»: бак, двигатель, хромированный глушитель) ———

const motorcycle = (c: Ctx): Art => {
  const paint = "#7a2e2e";
  const back = (
    <g>
      <Puffs x={-350} y={-120} c={c} />
      <SpokeWheel x={-240} r={95} c={c} tw={22} n={20} spoke="#c9ced3" />
      <SpokeWheel x={240} r={95} c={c} tw={22} n={20} spoke="#c9ced3" />
      <path d="M-350 -120 A115 115 0 0 1 -150 -175 L-170 -160 A95 95 0 0 0 -330 -112 Z" fill={paint} />
      <g stroke="#22252b" strokeWidth={14} strokeLinecap="round" fill="none">
        <path d="M-240 -95 L-60 -150 L120 -110" />
        <path d="M-240 -95 L-150 -220" />
        <path d="M200 -330 L60 -230 L-60 -150" />
      </g>
      <rect x={-40} y={-215} width={170} height={120} rx={22} fill="#5a6068" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={-30} y={-205 + i * 22} width={150} height={8} rx={4} fill="#8a9096" />
      ))}
      <path d="M90 -120 Q60 -70 -60 -80 L-300 -105" stroke={CHROME} strokeWidth={16} fill="none" strokeLinecap="round" />
      <rect x={-345} y={-126} width={130} height={34} rx={16} fill={CHROME} transform="rotate(-6 -280 -110)" />
      <path d="M-5 -235 Q0 -312 90 -312 L150 -306 Q182 -300 178 -258 L170 -230 Z" fill={paint} />
      <path d="M30 -290 L150 -290" stroke={CHROME} strokeWidth={6} />
      <path d="M-225 -232 Q-230 -256 -200 -256 L-20 -250 Q0 -244 -10 -228 Z" fill="#2a2420" />
      <rect x={-260} y={-250} width={20} height={18} rx={4} fill={RED_LAMP} />
      <rect x={110} y={-162} width={46} height={10} rx={4} fill="#33363b" />
    </g>
  );
  const front = (
    <g>
      <path d="M190 -112 A100 100 0 0 1 330 -150 L318 -136 A84 84 0 0 0 200 -100 Z" fill={paint} />
      <path d="M198 -338 L240 -95" stroke={CHROME} strokeWidth={14} strokeLinecap="round" />
      <path d="M196 -344 L188 -360 M188 -360 Q110 -362 74 -298" stroke="#9aa0a6" strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M76 -302 L58 -284" stroke="#22252b" strokeWidth={16} strokeLinecap="round" />
      <circle cx={232} cy={-312} r={28} fill={CHROME} />
      <circle cx={240} cy={-312} r={18} fill={LAMP} />
    </g>
  );
  return { back, front };
};

// ——— мопед/мотороллер («Вятка»: подножка-пол под ботинками, щиток, заднее «брюшко») ———

const scooter = (c: Ctx): Art => {
  const paint = "#8cc7b5";
  const back = (
    <g>
      <Puffs x={-320} y={-60} c={c} />
      <Wheel x={-200} r={56} c={c} rim="#d9dee3" />
      <Wheel x={190} r={56} c={c} rim="#d9dee3" />
      <path d="M-305 -72 Q-325 -150 -230 -168 L-40 -152 Q-10 -142 -10 -102 L-10 -86 L150 -86 L168 -102 L206 -332 L246 -332 L216 -92 Q206 -55 170 -55 L-270 -55 Q-300 -55 -305 -72 Z" fill={paint} />
      <path d="M-300 -110 Q-290 -150 -230 -160" stroke={shade(paint, 0.3)} strokeWidth={10} fill="none" strokeLinecap="round" />
      <rect x={-10} y={-90} width={170} height={10} rx={4} fill="#33363b" />
      <path d="M-210 -166 Q-212 -186 -180 -186 L-30 -176 Q-14 -170 -24 -156 L-200 -158 Z" fill="#3a2a22" />
      <rect x={-318} y={-120} width={16} height={22} rx={5} fill={RED_LAMP} />
    </g>
  );
  const front = (
    <g>
      <path d="M140 -70 A64 64 0 0 1 250 -86 L238 -76 A54 54 0 0 0 150 -62 Z" fill={paint} />
      <path d="M232 -340 L196 -56" stroke="#7a8088" strokeWidth={12} strokeLinecap="round" />
      <path d="M200 -352 Q196 -376 230 -376 L262 -372 Q282 -366 278 -346 L270 -334 L206 -336 Z" fill={paint} />
      <circle cx={268} cy={-354} r={13} fill={LAMP} />
      <path d="M206 -360 L150 -356" stroke="#33363b" strokeWidth={13} strokeLinecap="round" />
    </g>
  );
  return { back, front };
};

// ——— телега с лошадью (дуга с колокольчиком) ———

const CartWheel = ({ x, r, c }: { x: number; r: number; c: Ctx }) => (
  <SpokeWheel x={x} r={r} c={c} tyre="#5a3a24" tw={16} spoke="#8a5a32" n={10} sw={8} hub="#5a3a24" />
);

const HORSE_K = 0.85;
/** Корпус лошади опущен на HY (ноги короче, лошадь коренастее). */
const HY = 55;

const horseCart = (c: Ctx): Art => {
  const horse = "#8a5a3b";
  const mane = "#3a2a20";
  const w = 2.2 * 2 * Math.PI; // рысь: шагов в секунду
  const ph = c.moving ? c.t * w : 0;
  const bob = c.moving ? -6 * Math.abs(Math.sin(ph)) : 0;
  /** Нога: бедро от (hx, hy), рысь — диагональные пары в фазе. */
  const leg = (hx: number, phase: number, thick: number, color: string, front: boolean) => {
    const a = c.moving ? 22 * Math.sin(ph + phase) : 0;
    const b = c.moving ? Math.max(0, Math.sin(ph + phase + Math.PI / 2)) * 40 : 0;
    const rad = (v: number) => (v * Math.PI) / 180;
    const hy = -410 + HY + bob;
    const kx = hx - 165 * Math.sin(rad(a));
    const ky = hy + 165 * Math.cos(rad(a));
    const a2 = a + (front ? b : -b);
    const fx = kx - 172 * Math.sin(rad(a2));
    const fy = ky + 172 * Math.cos(rad(a2));
    return (
      <g>
        <path d={`M${hx} ${hy} L${kx} ${ky}`} stroke={color} strokeWidth={thick} strokeLinecap="round" />
        <path d={`M${kx} ${ky} L${fx} ${fy}`} stroke={color} strokeWidth={thick * 0.72} strokeLinecap="round" />
        <rect x={fx - 15} y={fy - 4} width={30} height={22} rx={5} fill={mane} transform={`rotate(${-a2} ${fx} ${fy})`} />
      </g>
    );
  };
  const nod = c.moving ? 4 * Math.sin(ph * 2) : 0;
  const back = (
    <g>
      <path d="M-480 -330 Q-470 -380 -430 -372 Q-420 -400 -385 -380 Q-360 -400 -340 -345 L-340 -330 Z" fill="#e0c060" />
      <path d="M-470 -350 l-20 -26 M-440 -372 l-6 -34 M-400 -380 l14 -30" stroke="#c8a040" strokeWidth={5} />
      <rect x={-470} y={-345} width={530} height={20} fill={shade(WOOD, -0.25)} />
    </g>
  );
  const front = (
    <g>
      {/* лошадь (её чертёж крупнее — сжат к копытам вокруг x = 480) */}
      <g transform={`translate(480 0) scale(${HORSE_K}) translate(-480 0)`}>
        {leg(345, Math.PI, 46, shade(horse, -0.25), false)}
        {leg(592, 0, 40, shade(horse, -0.25), true)}
        <g transform={`translate(0 ${bob + HY})`}>
          <path d="M330 -480 Q262 -440 280 -270 Q304 -320 348 -450 Z" fill={mane} />
          <ellipse cx={495} cy={-445} rx={180} ry={94} fill={horse} />
          <ellipse cx={385} cy={-440} rx={78} ry={92} fill={shade(horse, 0.06)} />
          <ellipse cx={612} cy={-440} rx={64} ry={88} fill={shade(horse, 0.03)} />
          <g transform={`rotate(${nod} 620 -480)`}>
            <path d="M585 -505 Q640 -600 690 -668 L748 -622 Q702 -520 672 -420 Z" fill={horse} />
            <ellipse cx={765} cy={-605} rx={74} ry={36} transform="rotate(40 765 -605)" fill={horse} />
            <ellipse cx={805} cy={-568} rx={30} ry={26} fill={shade(horse, -0.2)} />
            <circle cx={812} cy={-566} r={5} fill={mane} />
            <path d="M700 -682 L714 -738 L734 -680 Z" fill={horse} />
            <circle cx={745} cy={-636} r={7} fill={DARK} />
            <circle cx={747} cy={-638} r={2.5} fill="#ffffff" />
            <path d="M580 -515 Q636 -616 696 -692 L716 -676 Q656 -596 604 -500 Z" fill={mane} />
            <path d="M700 -690 Q740 -690 742 -660" stroke={mane} strokeWidth={10} fill="none" strokeLinecap="round" />
            <path d="M740 -602 L800 -585 M745 -620 L700 -640" stroke="#5a3a24" strokeWidth={6} />
          </g>
          <ellipse cx={632} cy={-472} rx={30} ry={76} transform="rotate(-28 632 -472)" fill="#5a3a24" />
          <path d="M440 -458 Q520 -478 598 -448" stroke="#5a3a24" strokeWidth={10} fill="none" />
          <path d="M440 -535 L440 -360" stroke="#5a3a24" strokeWidth={12} />
        </g>
        {leg(390, 0, 50, horse, false)}
        {leg(632, Math.PI, 44, horse, true)}
      </g>
      {/* телега: борт закрывает ноги седоков */}
      <rect x={-470} y={-330} width={530} height={180} fill={WOOD} />
      {[-270, -210].map((y) => (
        <rect key={y} x={-470} y={y} width={530} height={6} fill={shade(WOOD, -0.3)} />
      ))}
      <rect x={-478} y={-340} width={546} height={16} rx={5} fill={shade(WOOD, -0.18)} />
      {[-470, -200, 44].map((x) => (
        <rect key={x} x={x} y={-340} width={16} height={200} fill={shade(WOOD, -0.35)} />
      ))}
      <rect x={-470} y={-150} width={530} height={22} fill="#5a3a24" />
      <CartWheel x={-360} r={100} c={c} />
      <CartWheel x={-30} r={82} c={c} />
      {/* оглобля и дуга с колокольчиком */}
      <path d={`M40 -205 L${480 + 120 * HORSE_K} ${(-440 + HY + bob) * HORSE_K}`} stroke="#8a5a32" strokeWidth={14} strokeLinecap="round" />
      <g transform={`translate(480 0) scale(${HORSE_K}) translate(-480 ${bob + HY})`}>
        <path d="M596 -442 Q570 -700 640 -712 Q668 -712 664 -640" stroke="#c8553d" strokeWidth={20} fill="none" strokeLinecap="round" />
        <path d="M590 -520 Q585 -640 630 -690" stroke="#e0a030" strokeWidth={5} fill="none" strokeDasharray="14 12" />
        <path d="M652 -655 L652 -640" stroke={mane} strokeWidth={3} />
        <path d="M640 -612 Q640 -640 652 -642 Q664 -640 664 -612 Z" fill="#e0a030" />
      </g>
    </g>
  );
  return { back, front };
};

const DRAW: Record<VehicleKind, (c: Ctx) => Art> = {
  car: (c) => sedan(c, "car"),
  taxi: (c) => sedan(c, "taxi"),
  "police-car": (c) => sedan(c, "police-car"),
  ambulance,
  bus,
  tram,
  train,
  truck,
  tractor,
  bicycle,
  motorcycle,
  scooter,
  "horse-cart": horseCart,
};

/**
 * Рисунок машины. part: back — то, что за седоками (салон, спинки сидений, дальние стёкла; у открытых — рама, седло,
 * колёса); front — кузов с прорезями окон, колёса, стёкла с бликами (у открытых — руль, вилка, ближняя педаль, борт телеги, лошадь).
 * t — секунды движения (колёса крутятся по t, рысь лошади, выхлоп и мигалки), moving — едет ли сейчас.
 */
export const VehicleArt = ({ kind, part, t, moving, color }: { kind: VehicleKind; part: "back" | "front"; t: number; moving: boolean; color?: string }) => {
  const id = `v${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const d = DESIGN[kind];
  const art = DRAW[kind]({ t, moving, id, spd: 900 / d.driveSec, color });
  return <g transform={d.ox ? `translate(${d.ox} 0)` : undefined}>{part === "back" ? art.back : art.front}</g>;
};
