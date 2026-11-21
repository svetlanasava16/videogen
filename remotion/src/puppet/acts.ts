import type { Act, Emotion } from "@jf/core";

/**
 * Позы действий (бит act). Поза куклы — набор чисел; действие задаёт часть позы, риг смешивает:
 * pose = lerp(обычная поза, поза действия, k). t — секунды с начала действия (циклы и разовые взмахи).
 *
 * Углы рук и ног — «вперёд-положительные» в кадре куклы (смотрит вправо, facing отражает всё целиком):
 * 0 — вниз, 90 — вперёд (к цели), 180 — вверх, −90 — назад. Рука: u — плечо, f — предплечье (абсолютные углы),
 * s — растяжение (мультяшная «резиновая» рука, чтобы короткие руки доставали до ушей), palm — размер ладони.
 * Нога: a — бедро, s — голень, ts — растяжение бедра (сидя колени видны впереди), dx — сдвиг тазобедренного
 * сустава, fr — поворот стопы (fr = s держит стопу плашмя).
 * F — передняя рука/нога (со стороны взгляда, x > 150), B — задняя.
 */
export type ArmP = { u: number; f: number; s: number; palm: number; bulge: number };
export type LegP = { a: number; s: number; ts: number; dx: number; fr: number };
export type Pose = {
  armB: ArmP; armF: ArmP; legB: LegP; legF: LegP;
  /** Опускание фигуры (сидя, на коленях), вниз +. */ drop: number;
  /** Подъём над полом (прыжок; лёжа — автоматически), вверх +. */ lift: number;
  /** Сдвиг по x (дрожь, баланс). */ x: number;
  /** Поворот всей фигуры вокруг стоп (падение: −90 — на спину). */ rot: number;
  /** Наклон корпуса вокруг таза, вперёд +. */ lean: number;
  headX: number; headY: number; tilt: number;
  /** Плечи подняты (px). */ shoulder: number;
  /** Поворот предмета в руке на экране (по умолчанию как раньше: −угол руки). */ propR: number;
};
export type PosePart = {
  armB?: Partial<ArmP>; armF?: Partial<ArmP>; legB?: Partial<LegP>; legF?: Partial<LegP>;
  drop?: number; lift?: number; x?: number; rot?: number; lean?: number; headX?: number; headY?: number; tilt?: number; shoulder?: number; propR?: number;
};

export type Eyes = "squeeze" | "closed" | "happy" | "x" | "wide";
export type MouthFx = "pucker" | "laugh" | "o" | "grimace" | "wail" | "grin" | "chomp" | "wavy";
export type FaceFx = { eyes?: Eyes; mouth?: MouthFx; open?: number; brows?: Emotion; look?: [number, number] };
export type HandShape = "point" | "fist" | "pray";
type P = [number, number];
/** Эффекты: swoosh/speed — в кадре корпуса; burst/arcs — корпус или голова; stars/tears — голова; glyph — вертикально в кадре сцены. */
export type Fx =
  | { type: "swoosh"; cx: number; cy: number; r: number; a0: number; a1: number }
  | { type: "burst"; space: "torso" | "head"; at: P; r: number }
  | { type: "arcs"; space: "torso" | "head"; at: P; dir: number; r: number; n?: number; span?: number }
  | { type: "stars"; t: number }
  | { type: "tears"; t: number }
  | { type: "speed"; x: number; ys: number[] }
  | { type: "rays"; space: "torso" | "head"; at: P; dir: number; r: number; n?: number; span?: number }
  | { type: "glyph"; space: "torso" | "head"; at: P; g: "z" | "heart" | "note" | "q" | "dots"; t: number };

export type ActOut = { pose: PosePart; face?: FaceFx; fx?: Fx[]; over?: { F?: boolean; B?: boolean }; hand?: { F?: HandShape; B?: HandShape } };

/** Геометрия текущего телосложения (координаты бокса куклы до сдвига на пол). */
export type RigGeo = {
  shY: number; sxF: number; sxB: number; /** половина длины руки (плечо→локоть) */ L: number;
  hipY: number; /** таз→стопа */ Lf: number; legGap: number; bodyW: number; bodyH: number; bodyBottom: number;
};

const D = 180 / Math.PI;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const smooth = (p: number) => p * p * (3 - 2 * p);
const sin = (t: number, hz: number, ph = 0) => Math.sin(2 * Math.PI * hz * t + ph);
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** Двухзвенная IK: углы руки, чтобы кисть оказалась в (tx, ty). Локоть наружу (или вниз). */
export function reach(g: RigGeo, side: 1 | -1, tx: number, ty: number, o: { sh?: number; max?: number; elbow?: "out" | "down" } = {}) {
  const sx = side === 1 ? g.sxF : g.sxB;
  const sy = g.shY - (o.sh ?? 0);
  const dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
  const s = clamp(d / (2 * g.L * 0.97), 1, o.max ?? 1.5);
  const Ls = g.L * s;
  const al = Math.atan2(dx, dy) * D;
  const b = Math.acos(clamp(d / (2 * Ls), 0, 1)) * D;
  const c1 = { u: al + b, f: al - b }, c2 = { u: al - b, f: al + b };
  const score = (c: { u: number }) => {
    const ex = Math.sin(c.u / D) * Ls, ey = Math.cos(c.u / D) * Ls;
    return o.elbow === "down" ? ey : side * ex + 0.25 * ey;
  };
  const c = score(c1) >= score(c2) ? c1 : c2;
  return { u: c.u, f: c.f, s };
}

/** Где кисть при данных углах (кадр корпуса). */
export function handAt(g: RigGeo, side: 1 | -1, u: number, f: number, s = 1, sh = 0): P {
  const sx = side === 1 ? g.sxF : g.sxB, Ls = g.L * s;
  return [sx + Ls * (Math.sin(u / D) + Math.sin(f / D)), g.shY - sh + Ls * (Math.cos(u / D) + Math.cos(f / D))];
}

/** Точка головы (координаты головы: центр 150,160) с учётом наклона и сдвига головы из позы. */
function headPt(p: PosePart, x: number, y: number): P {
  const a = (p.tilt ?? 0) / D, rx = x - 150, ry = y - 236;
  return [150 + rx * Math.cos(a) - ry * Math.sin(a) + (p.headX ?? 0), 236 + rx * Math.sin(a) + ry * Math.cos(a) + (p.headY ?? 0)];
}

/** Сидя: фигура опускается на голень, бёдра вперёд (колени видны со стороны взгляда), стопы на полу. */
export const seatPart = (g: RigGeo): PosePart => ({
  drop: g.Lf / 2,
  legF: { a: 90, s: 0, ts: 1.8, dx: g.legGap * 0.5, fr: 0 },
  legB: { a: 90, s: 0, ts: 1.8, dx: g.legGap * 1.5, fr: 0 },
});
const seatKnee = (g: RigGeo, side: 1 | -1): P => [150 + side * g.legGap + g.legGap * (side === 1 ? 0.5 : 1.5) + (g.Lf / 2) * 1.8, g.hipY - 20];

type Ctx = { g: RigGeo; t: number; hold?: string };
type Fn = (c: Ctx) => ActOut;

const slap: Fn = ({ g, t }) => {
  const up = smooth(seg(t, 0, 0.18)), dn = seg(t, 0.18, 0.32) ** 2, rest = smooth(seg(t, 0.6, 1));
  let u = t < 0.18 ? mix(20, 165, up) : mix(165, 78, dn);
  let f = u + (t < 0.18 ? 25 * up : mix(25, -12, dn));
  u = mix(u, 40, rest);
  f = mix(f, 50, rest);
  const fx: Fx[] = [];
  if (t > 0.2 && t < 0.5) fx.push({ type: "swoosh", cx: g.sxF, cy: g.shY, r: 2 * g.L + 18, a0: 172, a1: mix(165, 78, dn) + 6 });
  if (t >= 0.31 && t < 0.55) fx.push({ type: "burst", space: "torso", at: handAt(g, 1, u, f), r: 34 });
  return { pose: { armF: { u, f, palm: 1.25 }, lean: (t < 0.18 ? -5 * up : mix(-5, 10, dn)) * (1 - rest) }, fx };
};

const punch: Fn = ({ g, t }) => {
  const cock = smooth(seg(t, 0, 0.1)), hit = seg(t, 0.1, 0.18), back = smooth(seg(t, 0.45, 0.8));
  let u = t < 0.1 ? mix(15, 40, cock) : mix(40, 92, hit);
  let f = t < 0.1 ? mix(15, 150, cock) : mix(150, 92, hit);
  u = mix(u, 35, back);
  f = mix(f, 130, back);
  const s = mix(1, 1.18, t < 0.1 ? 0 : hit * (1 - back));
  const fx: Fx[] = [];
  if (t >= 0.16 && t < 0.42) {
    const h = handAt(g, 1, u, f, s);
    fx.push({ type: "burst", space: "torso", at: [h[0] + 22, h[1]], r: 30 }, { type: "speed", x: h[0] - 30, ys: [h[1] - 16, h[1], h[1] + 16] });
  }
  return {
    pose: { armF: { u, f, s }, armB: { u: 25, f: 150 }, lean: (t < 0.1 ? -4 * cock : mix(-4, 10, hit)) * (1 - back) },
    hand: { F: "fist", B: "fist" }, fx,
  };
};

const knock: Fn = ({ g, t }) => {
  const on = t < 0.95 ? 1 : 1 - smooth(seg(t, 0.95, 1.2));
  const hit = Math.max(0, sin(t, 3.3)) ** 3 * on;
  const u = mix(40, 62, on), f = mix(90, 135 - 42 * hit, on);
  const fx: Fx[] = [];
  if (hit > 0.6) fx.push({ type: "rays", space: "torso", at: handAt(g, 1, u, f), dir: 90, r: 28, n: 3, span: 70 });
  return { pose: { armF: { u, f } }, hand: { F: "fist" }, fx };
};

const coverEars: Fn = ({ g }) => {
  const p: PosePart = { headY: 8, shoulder: 8 };
  const [rx, ry] = headPt(p, 232, 164), [lx, ly] = headPt(p, 68, 164);
  return {
    pose: { ...p, armF: { ...reach(g, 1, rx, ry, { sh: 8 }), palm: 1.3 }, armB: { ...reach(g, -1, lx, ly, { sh: 8 }), palm: 1.3 } },
    over: { F: true, B: true }, face: { eyes: "squeeze", mouth: "grimace", brows: "angry" },
  };
};

const coverEyes: Fn = ({ g }) => {
  const p: PosePart = { headY: 4 };
  const [rx, ry] = headPt(p, 180, 150), [lx, ly] = headPt(p, 120, 150);
  return {
    pose: { ...p, armF: { ...reach(g, 1, rx, ry), palm: 1.4 }, armB: { ...reach(g, -1, lx, ly), palm: 1.4 } },
    over: { F: true, B: true }, face: { mouth: "o" },
  };
};

const coverFace: Fn = ({ g }) => {
  const p: PosePart = { headY: 8 };
  const [rx, ry] = headPt(p, 176, 172), [lx, ly] = headPt(p, 124, 172);
  return {
    pose: { ...p, armF: { ...reach(g, 1, rx, ry), palm: 1.8 }, armB: { ...reach(g, -1, lx, ly), palm: 1.8 } },
    over: { F: true, B: true }, face: { eyes: "closed" },
  };
};

const facepalm: Fn = ({ g }) => {
  const p: PosePart = { headY: 8, tilt: 6 };
  const [hx, hy] = headPt(p, 164, 138);
  return {
    pose: { ...p, armF: { ...reach(g, 1, hx, hy), palm: 1.6 }, armB: reach(g, -1, g.sxB + 8, g.bodyBottom - 50) },
    over: { F: true }, face: { eyes: "closed", brows: "sad", mouth: "wavy" },
  };
};

const hug: Fn = ({ g, t }) => ({
  pose: { lean: 8, armF: { u: 78, f: 112, s: 1.1, palm: 1.2 }, armB: { ...reach(g, -1, g.sxF + 30, g.shY + 6, { max: 1.7, elbow: "down" }), palm: 1.2 } },
  face: { eyes: "happy" }, fx: [{ type: "glyph", space: "head", at: [236, 70], g: "heart", t }],
});

const kiss: Fn = ({ t }) => ({
  pose: { lean: 10, headX: 8, tilt: 8 },
  face: { eyes: "closed", mouth: "pucker" }, fx: [{ type: "glyph", space: "head", at: [214, 196], g: "heart", t }],
});

const point: Fn = () => ({ pose: { lean: 3, armF: { u: 96, f: 94 } }, hand: { F: "point" }, face: { look: [5, 0] } });

const wave: Fn = ({ g, t }) => {
  const f = 165 + 26 * sin(t, 2.2);
  const h = handAt(g, 1, 140, f);
  return { pose: { armF: { u: 140, f, palm: 1.35 } }, fx: [{ type: "arcs", space: "torso", at: h, dir: 90, r: 34, n: 2 }, { type: "arcs", space: "torso", at: h, dir: -90, r: 34, n: 2 }] };
};

const clap: Fn = ({ g, t }) => {
  const o = 0.5 + 0.5 * Math.cos(2 * Math.PI * 2.8 * t);
  const cx = 158, cy = g.shY + 42;
  const fx: Fx[] = o < 0.25 ? [{ type: "rays", space: "torso", at: [cx, cy - 10], dir: 180, r: 30, n: 5, span: 140 }] : [];
  return {
    pose: { armF: { ...reach(g, 1, cx + 13 + 34 * o, cy, { elbow: "down" }), palm: 1.2 }, armB: { ...reach(g, -1, cx - 13 - 34 * o, cy, { elbow: "down" }), palm: 1.2 } },
    fx,
  };
};

const handsUp: Fn = () => ({ pose: { armF: { u: 168, f: 176, palm: 1.25 }, armB: { u: -168, f: -176, palm: 1.25 } }, face: { eyes: "wide", brows: "surprised" } });

const shrug: Fn = ({ t }) => ({
  pose: { shoulder: 14, headY: 8, armF: { u: 28, f: 108, palm: 1.25 }, armB: { u: -28, f: -108, palm: 1.25 } },
  face: { brows: "surprised", look: [0, -2] }, fx: [{ type: "glyph", space: "head", at: [214, 64], g: "q", t }],
});

const think: Fn = ({ g, t }) => {
  const p: PosePart = { tilt: -5 };
  const [cx, cy] = headPt(p, 166, 250);
  return {
    pose: { ...p, armF: reach(g, 1, cx, cy, { elbow: "down" }), armB: reach(g, -1, 150 + g.bodyW * 0.2, g.shY + g.bodyH * 0.45, { elbow: "down", max: 1.6 }) },
    over: { F: true }, hand: { F: "fist" }, face: { look: [4, -6] }, fx: [{ type: "glyph", space: "head", at: [210, 70], g: "dots", t }],
  };
};

const scratchHead: Fn = ({ g, t }) => {
  const p: PosePart = { tilt: 10, headY: 6, shoulder: 6 };
  const [hx, hy] = headPt(p, 204 + 7 * sin(t, 4), 98 + 4 * sin(t, 4, 1.6));
  return {
    pose: { ...p, armF: { ...reach(g, 1, hx, hy, { sh: 6 }), palm: 1.1 } },
    over: { F: true }, face: { look: [3, -5] }, fx: [{ type: "glyph", space: "head", at: [96, 60], g: "q", t }],
  };
};

const prayHands: Fn = ({ g }) => ({
  pose: { tilt: 4, headY: 4, armF: reach(g, 1, 155, g.shY + 36, { elbow: "down" }), armB: reach(g, -1, 147, g.shY + 36, { elbow: "down" }) },
  hand: { F: "pray", B: "pray" }, face: { eyes: "closed" },
});

const nod: Fn = ({ t }) => {
  const n = Math.max(0, sin(t, 2));
  return { pose: { headY: 12 * n }, face: { look: [0, 4 * n] }, fx: n > 0.5 ? [{ type: "arcs", space: "head", at: [150, 160], dir: 180, r: 96, n: 2, span: 50 }] : [] };
};

const shakeHead: Fn = ({ t }) => {
  const s = sin(t, 2.5);
  return {
    pose: { headX: 12 * s, tilt: 5 * s }, face: { look: [-5 * s, 0] },
    fx: [{ type: "arcs", space: "head", at: [150, 160], dir: 90, r: 92, n: 2, span: 50 }, { type: "arcs", space: "head", at: [150, 160], dir: -90, r: 92, n: 2, span: 50 }],
  };
};

const bow: Fn = () => ({ pose: { lean: 32, x: -12, tilt: -6, armF: { u: 30, f: 32 }, armB: { u: 32, f: 34 } }, face: { eyes: "closed" } });

const kneel: Fn = ({ g }) => {
  const knee: P = [150 + g.legGap + g.legGap * 0.5 + (g.Lf / 2) * 1.6, g.hipY - 22];
  return {
    pose: {
      drop: g.Lf / 2, tilt: 4,
      legF: { a: 88, s: 0, ts: 1.6, dx: g.legGap * 0.5, fr: 0 },
      legB: { a: 0, s: -90, ts: 1, dx: -g.legGap * 0.2, fr: -90 },
      armF: reach(g, 1, knee[0], knee[1], { elbow: "out" }),
    },
  };
};

const sit: Fn = ({ g }) => {
  const kF = seatKnee(g, 1);
  return { pose: { ...seatPart(g), armF: reach(g, 1, kF[0] - 6, kF[1]), armB: reach(g, -1, 150 - g.bodyW * 0.05, g.hipY - 18, { elbow: "down" }) } };
};

/** Лёжа: руки вдоль тела, фигура повёрнута на спину (голова назад от взгляда). */
const lying = (extra: PosePart = {}): PosePart => ({ rot: -90, armF: { u: 12, f: 14 }, armB: { u: 8, f: 10 }, ...extra });

const fall: Fn = ({ t }) => {
  const p = seg(t, 0, 0.45), land = smooth(seg(t, 0.45, 0.9));
  const bounce = t > 0.45 ? 6 * Math.sin((t - 0.45) * 18) * Math.exp(-(t - 0.45) * 7) : 0;
  return {
    pose: {
      rot: -92 * p * p + bounce,
      armF: { u: mix(150, 110, land), f: mix(178, 140, land) }, armB: { u: mix(-150, 30, land), f: mix(-178, 40, land) },
      legF: { a: 35 * (1 - land), s: 20 * (1 - land) },
    },
    face: t < 0.45 ? { eyes: "wide", mouth: "o", brows: "surprised" } : { eyes: "squeeze", mouth: "o" },
    fx: t > 0.5 ? [{ type: "stars", t }] : [],
  };
};

const faint: Fn = ({ t }) => {
  const wob = 1 - seg(t, 0.15, 0.3), p = seg(t, 0.25, 0.7);
  return {
    pose: { rot: 5 * sin(t, 3) * wob - 90 * p * p, headY: 6 * wob, armF: { u: mix(10, 105, p), f: mix(10, 125, p) }, armB: { u: mix(-10, 25, p), f: mix(-10, 30, p) } },
    face: { eyes: "closed", mouth: "o", brows: "sad" },
  };
};

const lie: Fn = () => ({ pose: lying() });
const sleep: Fn = ({ t }) => ({
  pose: lying({ armF: { u: 20, f: 120 } }),
  face: { eyes: "closed", mouth: "o" }, fx: [{ type: "glyph", space: "head", at: [250, 120], g: "z", t }],
});

const jump: Fn = ({ g, t }) => {
  const c1 = Math.sin(Math.PI * seg(t, 0, 0.14)), air = seg(t, 0.12, 0.52), c2 = Math.sin(Math.PI * seg(t, 0.5, 0.66));
  const crouch = Math.max(c1, c2);
  const flying = air > 0 && air < 1 ? 1 : 0;
  const tuck = flying * Math.sin(Math.PI * air);
  return {
    pose: {
      lift: 150 * 4 * air * (1 - air), drop: g.Lf * 0.16 * crouch,
      legF: { a: 35 * crouch + 30 * tuck, s: -30 * crouch - 25 * tuck }, legB: { a: 35 * crouch + 20 * tuck, s: -30 * crouch - 35 * tuck },
      armF: { u: mix(-20 * crouch, 160, tuck), f: mix(-20 * crouch, 172, tuck), palm: 1.2 }, armB: { u: mix(-30 * crouch, -160, tuck), f: mix(-30 * crouch, -172, tuck), palm: 1.2 },
    },
    face: tuck > 0.3 ? { eyes: "happy", mouth: "grin" } : undefined,
  };
};

const run: Fn = ({ g, t }) => {
  const w = 2 * Math.PI * 3 * t, c = Math.sin(w);
  const leg = (ph: number) => { const a = 42 * Math.sin(w + ph); return { a, s: a - 25 - 45 * Math.max(0, Math.cos(w + ph)) }; };
  return {
    pose: {
      lean: 12, drop: -8 * Math.abs(c), legF: leg(0), legB: leg(Math.PI),
      armF: { u: -45 * c, f: -45 * c + 90 }, armB: { u: 45 * c, f: 45 * c + 90 },
    },
    hand: { F: "fist", B: "fist" },
    fx: [{ type: "speed", x: 150 - g.bodyW / 2 - 24, ys: [g.shY + 10, g.shY + g.bodyH * 0.4, g.hipY - 10] }],
  };
};

const dance: Fn = ({ g, t }) => {
  const sw = sin(t, 1), q = (sw + 1) / 2, bounce = Math.abs(sin(t, 2));
  return {
    pose: {
      rot: 6 * sw, drop: -10 * bounce, headX: 6 * sw, tilt: 8 * sw,
      armF: { u: mix(60, 160, q), f: mix(60, 160, q) + 25, palm: 1.15 }, armB: { u: -mix(160, 60, q), f: -mix(160, 60, q) - 25, palm: 1.15 },
      legF: { a: 28 * Math.max(0, sw), s: -20 * Math.max(0, sw) }, legB: { a: 28 * Math.max(0, -sw), s: -20 * Math.max(0, -sw) },
    },
    face: { eyes: "happy", mouth: "grin" },
    fx: [{ type: "glyph", space: "head", at: [238, 90], g: "note", t }, { type: "glyph", space: "torso", at: [60, g.shY - 20], g: "note", t: t + 0.7 }],
  };
};

const shiver: Fn = ({ g, t }) => {
  const y = g.shY + 26;
  return {
    pose: {
      x: 4 * sin(t, 13), shoulder: 10, headY: 6,
      armF: reach(g, 1, 150 - g.bodyW * 0.28, y, { elbow: "down", max: 1.6 }), armB: reach(g, -1, 150 + g.bodyW * 0.28, y + 12, { elbow: "down", max: 1.6 }),
    },
    face: { eyes: "wide", mouth: "wavy", brows: "sad" },
    fx: [
      { type: "arcs", space: "torso", at: [150, g.shY + g.bodyH * 0.4], dir: 90, r: g.bodyW / 2 + 26, n: 2, span: 40 },
      { type: "arcs", space: "torso", at: [150, g.shY + g.bodyH * 0.4], dir: -90, r: g.bodyW / 2 + 26, n: 2, span: 40 },
    ],
  };
};

const flex: Fn = () => ({
  pose: { shoulder: 4, armF: { u: 100, f: 182, bulge: 1 }, armB: { u: -100, f: -182, bulge: 1 } },
  hand: { F: "fist", B: "fist" }, face: { mouth: "grin", brows: "smug" },
});

const cry: Fn = ({ t }) => ({
  pose: { headY: 5 + 3 * Math.abs(sin(t, 2.5)), shoulder: 3 * Math.abs(sin(t, 2.5)), armF: { u: 4, f: -4 }, armB: { u: -4, f: 4 } },
  face: { eyes: "closed", mouth: "wail", brows: "sad" }, fx: [{ type: "tears", t }],
});

const laugh: Fn = ({ g, t }) => {
  const shake = Math.abs(sin(t, 5));
  const y = g.bodyBottom - g.bodyH * 0.3;
  return {
    pose: {
      lean: -6, tilt: -8, drop: 5 * shake,
      armF: reach(g, 1, 150 + g.bodyW * 0.2, y, { elbow: "out" }), armB: reach(g, -1, 150 - g.bodyW * 0.12, y + 8, { elbow: "out" }),
    },
    face: { eyes: "happy", mouth: "laugh", open: 0.55 + 0.45 * Math.abs(sin(t, 4)) },
  };
};

/** Рот куклы в координатах головы. */
const MOUTH: P = [150, 208];
/** Пить/есть: кисть подносит предмет ко рту. R — поворот предмета на экране, tip — расстояние от кисти до горлышка. */
const drink: Fn = ({ g, t, hold }) => {
  const p: PosePart = { tilt: -8, headY: -2 };
  const [mx, my] = headPt(p, MOUTH[0], MOUTH[1]);
  const vessel = hold === "bottle" ? { R: -128, tip: 92 } : hold === "glass" || hold === "genie-bottle" || hold === "canister" ? { R: -100, tip: 46 } : undefined;
  const sip = 3 * sin(t, 1.2);
  if (vessel) {
    const r = vessel.R / D;
    const hx = mx - vessel.tip * Math.sin(r), hy = my + vessel.tip * Math.cos(r) - 10 + sip;
    return { pose: { ...p, armF: reach(g, 1, hx, hy, { elbow: "down" }), propR: vessel.R }, over: { F: true }, face: { eyes: "closed", mouth: "o" } };
  }
  return { pose: { ...p, armF: { ...reach(g, 1, mx + 26, my + 8 + sip, { elbow: "down" }), palm: 1.1 } }, over: { F: true }, hand: { F: "fist" }, face: { eyes: "closed", mouth: "o" } };
};

const eat: Fn = ({ g, t, hold }) => {
  const [mx, my] = headPt({}, MOUTH[0], MOUTH[1]);
  const chew = Math.abs(sin(t, 2.2));
  if (hold) {
    return { pose: { armF: reach(g, 1, mx + 14, my + 26 + 6 * chew, { elbow: "down" }), propR: -38 }, over: { F: true }, face: { mouth: "chomp", open: chew } };
  }
  return { pose: { armF: { ...reach(g, 1, mx + 18, my + 12 + 6 * chew, { elbow: "down" }), palm: 1.1 } }, over: { F: true }, hand: { F: "fist" }, face: { mouth: "chomp", open: chew } };
};

const throwIt: Fn = ({ g, t }) => {
  const wind = smooth(seg(t, 0, 0.22)), sw = seg(t, 0.22, 0.36) ** 2, rel = smooth(seg(t, 0.5, 0.9));
  let u: number, f: number;
  if (t < 0.22) { u = mix(15, -140, wind); f = u - 30 * wind; }
  else if (t < 0.36) { u = mix(-140, -240, sw); f = u + mix(-30, 15, sw); }
  else { u = mix(120, 60, rel); f = mix(135, 70, rel); }
  const fx: Fx[] = t > 0.24 && t < 0.5 ? [{ type: "swoosh", cx: g.sxF, cy: g.shY, r: 2 * g.L + 16, a0: -150, a1: t < 0.36 ? u - 6 : -234 }] : [];
  return { pose: { armF: { u, f }, lean: t < 0.22 ? -8 * wind : mix(-8, 12, Math.min(1, sw + (t >= 0.36 ? 1 : 0))) * (1 - rel) }, fx };
};

const grab: Fn = ({ g, t }) => {
  const go = smooth(seg(t, 0, 0.25)), pull = smooth(seg(t, 0.4, 0.7));
  const back = reach(g, 1, g.sxF + 10, g.shY + 40, { elbow: "down" });
  return {
    pose: {
      lean: 10 * go - 14 * pull,
      armF: { u: mix(mix(15, 95, go), back.u, pull), f: mix(mix(15, 95, go), back.f, pull), s: mix(mix(1, 1.22, go), back.s, pull), palm: t < 0.38 ? 1.35 : 1 },
    },
    hand: t < 0.38 ? undefined : { F: "fist" },
    fx: t > 0.4 && t < 0.75 ? [{ type: "speed", x: handAt(g, 1, 95, 95, 1.22)[0] + 10, ys: [g.shY + 30, g.shY + 50] }] : [],
  };
};

export const ACT_POSES: Record<Act, Fn> = {
  slap, punch, "hit-head": slap, "cover-ears": coverEars, "cover-eyes": coverEyes, "cover-face": coverFace, hug, kiss, point, wave,
  facepalm, shrug, nod, "shake-head": shakeHead, bow, kneel, sit, stand: () => ({ pose: {} }), fall, faint, lie, jump, run, cry, laugh,
  drink, eat, "scratch-head": scratchHead, "hands-up": handsUp, clap, "pray-hands": prayHands, think, sleep, throw: throwIt, grab, knock,
  dance, shiver, flex,
};

function blend(p: Pose, part: PosePart, k: number) {
  const rec = p as unknown as Record<string, number | Record<string, number>>;
  for (const [key, v] of Object.entries(part)) {
    if (typeof v === "number") rec[key] = mix(rec[key] as number, v, k);
    else if (v) {
      const o = rec[key] as Record<string, number>;
      for (const [kk, vv] of Object.entries(v as Record<string, number | undefined>)) if (typeof vv === "number") o[kk] = mix(o[kk], vv, k);
    }
  }
}

/** Углы руки действия — ближайшие к текущим (плавный вход без оборота через спину). */
function nearArms(p: Pose, part: PosePart) {
  for (const key of ["armF", "armB"] as const) {
    const a = part[key];
    if (!a || a.u === undefined) continue;
    const u = p[key].u + wrap(a.u - p[key].u);
    const f = a.f === undefined ? undefined : u + wrap(a.f - a.u);
    part[key] = { ...a, u, ...(f === undefined ? {} : { f }) };
  }
}

export function basePose(arms: { left: number; right: number }, legs: { left: number; right: number }, tilt: number): Pose {
  const leg = (v: number): LegP => ({ a: -v, s: -v, ts: 1, dx: 0, fr: 0 });
  return {
    armF: { u: arms.right, f: arms.right, s: 1, palm: 1, bulge: 0 },
    armB: { u: -arms.left, f: -arms.left, s: 1, palm: 1, bulge: 0 },
    legF: leg(legs.right), legB: leg(legs.left),
    drop: 0, lift: 0, x: 0, rot: 0, lean: 0, headX: 0, headY: 0, tilt, shoulder: 0, propR: -arms.right,
  };
}

export type Resolved = { pose: Pose; face?: FaceFx; fx: Fx[]; fxK: number; over: { F: boolean; B: boolean }; hand: { F?: HandShape; B?: HandShape } };

/** Итоговая поза: обычная → сидя (seated) → поза-состояние (base) → жест (act) → вздрагивание (flinch). */
export function resolvePose(base: Pose, g: RigGeo, o: { act?: { name: Act; k: number; t: number }; base?: { name: Act; k: number; t: number }; seated?: number; flinch?: number; hold?: string }): Resolved {
  const p = base;
  const seated = clamp(o.seated ?? 0, 0, 1);
  if (seated > 0) blend(p, seatPart(g), seated);
  let face: FaceFx | undefined;
  const fx: Fx[] = [];
  let over = { F: false, B: false };
  let hand: Resolved["hand"] = {};
  let fxK = 0;
  // слои: сначала состояние, жест поверх (частичная поза жеста перекрывает только свои суставы)
  for (const layer of [o.base, o.act]) {
    const k = clamp(layer?.k ?? 0, 0, 1);
    const fn = layer && ACT_POSES[layer.name];
    if (!fn || k <= 0) continue;
    const r = fn({ g, t: Math.max(0, layer!.t), hold: o.hold });
    nearArms(p, r.pose);
    blend(p, r.pose, k);
    if (k > 0.5) { face = r.face ?? face; hand = { ...hand, ...(r.hand ?? {}) }; }
    if (k > 0.35) over = { F: over.F || !!r.over?.F, B: over.B || !!r.over?.B };
    const lk = clamp((k - 0.3) / 0.4, 0, 1);
    if (lk > 0) { fx.push(...(r.fx ?? [])); fxK = Math.max(fxK, lk); }
  }
  const fl = clamp(o.flinch ?? 0, 0, 1);
  if (fl > 0) {
    p.lean -= 10 * fl;
    p.headX -= 12 * fl;
    p.tilt -= 12 * fl;
    p.shoulder += 6 * fl;
    p.armF.u += 25 * fl; p.armF.f += 40 * fl;
    p.armB.u -= 15 * fl; p.armB.f -= 25 * fl;
    if (fl > 0.4) {
      face = { ...face, eyes: face?.eyes ?? "squeeze", mouth: face?.mouth ?? "o" };
      fx.push({ type: "burst", space: "head", at: [226, 78], r: 30 * fl });
    }
  }
  // лёжа/падая: приподнять, чтобы спина легла на пол, а не ушла под него
  p.lift += Math.max(g.bodyW / 2, 78) * Math.abs(Math.sin(p.rot / D)) ** 1.5;
  return { pose: p, face, fx, fxK: fl > 0.4 && fxK === 0 ? 1 : fxK, over, hand };
}

/** Аффинные матрицы SVG (a b c d e f) — чтобы эффекты «над головой» оставались вертикальными при наклоне/падении. */
export type Mat = [number, number, number, number, number, number];
export const mmul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
export const mT = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];
export const mR = (deg: number, cx = 0, cy = 0): Mat => {
  const r = deg / D, c = Math.cos(r), s = Math.sin(r);
  return mmul(mT(cx, cy), mmul([c, s, -s, c, 0, 0], mT(-cx, -cy)));
};
export const mApply = (m: Mat, [x, y]: P): P => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
