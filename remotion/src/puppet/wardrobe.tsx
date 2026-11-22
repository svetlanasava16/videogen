/**
 * Гардероб кукол: вещи — данные (content/wardrobe/*.json, схема WardrobeItem в @jf/core), здесь — только
 * библиотека примитивов и рисование по слотам. Новая вещь = запись в JSON (+ один примитив, если форма новая).
 *
 * Координаты — в боксе куклы 300×600 (голова: центр (150,160), радиусы 76×82; тело с y = BODY_TOP).
 * В выражениях доступны размеры тела текущего телосложения:
 *   bx, w — левый край и ширина корпуса; top, bottom — верх и низ корпуса; legH — длина ног;
 *   h = bottom − top; L, R — края видимой груди между руками (bx+24, bx+w−24); iw = R − L; c = 150 (центр).
 * Цвета: "#rrggbb", "$hair", "$skin", "$clothes", "$spot" (пятна: тёмные на светлой коже, светлые на тёмной), "shade(<цвет>, k)" (k > 0 темнее, k < 0 светлее),
 * "contrast(<цвет>, kТёмный, kСветлый)" — shade на kТёмный, если цвет тёмный, иначе на kСветлый.
 * Проверка: лист `Outfits --props='{"mode":"wardrobe"}'` (каждая вещь на трёх телах).
 */
import type { ReactNode } from "react";
import { WardrobeFile, type WardrobeItem } from "@jf/core";
import { wardrobeData } from "../registry.generated";
import { FONT } from "../fonts";
import { compile, num, tmpl, type Vars } from "./expr";
import { FUR, FUR_TRIM, isDark, shadeHex, spotColor, type BodyGeo } from "./Accessories";

export const WARDROBE: Record<string, WardrobeItem> = Object.fromEntries(
  wardrobeData.flatMap((f) => WardrobeFile.parse(f).items).map((it) => [it.id, it]),
);

type Shape = { p: string; [k: string]: unknown };
type Ctx = { v: Vars; colors: Record<string, string>; geo: BodyGeo };

/** Переменные тела для выражений. */
export function geoVars(g: BodyGeo): Vars {
  const h = g.bottom - g.top, L = g.bx + 24, R = g.bx + g.w - 24;
  return { bx: g.bx, w: g.w, top: g.top, bottom: g.bottom, legH: g.legH, h, L, R, iw: R - L, c: 150 };
}

/** Аргументы функции цвета через запятую (без вложенных скобок в числах). */
const splitArgs = (s: string) => {
  const out: string[] = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
};
function color(x: unknown, ctx: Ctx): string | undefined {
  if (x === undefined || x === null) return undefined;
  const s = String(x);
  if (s.startsWith("$")) return ctx.colors[s.slice(1)];
  const m = /^(shade|contrast)\((.*)\)$/.exec(s);
  if (m) {
    const a = splitArgs(m[2]);
    const base = color(a[0], ctx)!;
    if (m[1] === "shade") return shadeHex(base, num(a[1], ctx.v));
    return shadeHex(base, isDark(base) ? num(a[1], ctx.v) : num(a[2], ctx.v));
  }
  return s;
}

/** Общие атрибуты отрисовки (заливка, обводка, прозрачность, трансформация). */
function style(s: Shape, ctx: Ctx) {
  const o: Record<string, unknown> = {};
  if ("fill" in s) o.fill = color(s.fill, ctx);
  if ("stroke" in s) o.stroke = color(s.stroke, ctx);
  if ("sw" in s) o.strokeWidth = num(s.sw, ctx.v);
  if ("cap" in s) o.strokeLinecap = s.cap;
  if ("join" in s) o.strokeLinejoin = s.join;
  if ("dash" in s) o.strokeDasharray = s.dash;
  if ("opacity" in s) o.opacity = num(s.opacity, ctx.v);
  if ("fillRule" in s) o.fillRule = s.fillRule;
  if ("transform" in s) o.transform = tmpl(String(s.transform), ctx.v);
  return o;
}

/* ---------- примитивы одежды (перенесены из прежнего Accessories.tsx без изменений геометрии) ---------- */
const GOLD = "#d9a92a";

const Base = ({ g, color: c }: { g: BodyGeo; color: string }) => (
  <>
    <rect x={g.bx - 40} y={g.top - 12} width={g.w + 80} height={g.bottom - g.top + 60} fill={c} />
    {g.w >= 220 && <ellipse cx={150} cy={g.bottom - 50} rx={g.w / 2 - 6} ry={60} fill={shadeHex(c, isDark(c) ? -0.06 : 0.035)} />}
  </>
);
const Vneck = ({ top, vy, color: c, half = 26 }: { top: number; vy: number; color: string; half?: number }) => <path d={`M${150 - half} ${top - 8} L150 ${vy} L${150 + half} ${top - 8} Z`} fill={c} />;
const Lapels = ({ top, vy, color: c, half = 26, edge }: { top: number; vy: number; color: string; half?: number; edge?: string }) => {
  const d = vy - top;
  const side = (s: number) => `M${150 - s * half} ${top - 8} L${150 - s * 1} ${vy} L${150 - s * 20} ${top + d * 0.58} L${150 - s * 44} ${top + d * 0.32} L${150 - s * 36} ${top + d * 0.2} L${150 - s * 42} ${top + 2} Z`;
  return <g fill={c} stroke={edge} strokeWidth={edge ? 3 : 0} strokeLinejoin="round">{[1, -1].map((s) => <path key={s} d={side(s)} />)}</g>;
};
const TieShape = ({ y0, y1, color: c }: { y0: number; y1: number; color: string }) => (
  <g>
    <path d={`M${150 - 10} ${y0} L${150 + 10} ${y0} L${150 + 7} ${y0 + 16} L${150 - 7} ${y0 + 16} Z`} fill={shadeHex(c, 0.18)} />
    <path d={`M${150 - 7} ${y0 + 16} L${150 + 7} ${y0 + 16} L${150 + 12} ${y1 - 12} L150 ${y1} L${150 - 12} ${y1 - 12} Z`} fill={c} />
    <path d={`M${150 + 2} ${y0 + 22} L${150 + 8} ${y1 - 14}`} stroke={shadeHex(c, -0.25)} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
  </g>
);
const Buttons = ({ x, y0, y1, n, color: c = GOLD, r = 5.5 }: { x: number; y0: number; y1: number; n: number; color?: string; r?: number }) => (
  <g fill={c}>{Array.from({ length: n }, (_, i) => <circle key={i} cx={x} cy={n === 1 ? y0 : y0 + ((y1 - y0) * i) / (n - 1)} r={r} />)}</g>
);
const Pocket = ({ cx, y, w, color: c, button }: { cx: number; y: number; w: number; color: string; button?: string }) => (
  <g>
    <rect x={cx - w / 2} y={y} width={w} height={w * 0.8} rx={4} fill={shadeHex(c, 0.07)} />
    <path d={`M${cx - w / 2 - 2} ${y} H${cx + w / 2 + 2} V${y + w * 0.22} Q${cx} ${y + w * 0.42} ${cx - w / 2 - 2} ${y + w * 0.22} Z`} fill={shadeHex(c, 0.16)} />
    {button && <circle cx={cx} cy={y + w * 0.24} r={3.5} fill={button} />}
  </g>
);
const starPath = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
};
export const Star = ({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) => <path d={starPath(cx, cy, r)} fill={fill} />;
const Belt = ({ g, y, color: c = "#5a3a22", buckle = GOLD, starOn }: { g: BodyGeo; y: number; color?: string; buckle?: string; starOn?: boolean }) => (
  <g>
    <rect x={g.bx - 10} y={y} width={g.w + 20} height={15} fill={c} />
    <rect x={150 - 13} y={y - 3} width={26} height={21} rx={3} fill={buckle} />
    {starOn ? <Star cx={150} cy={y + 7.5} r={7} fill={shadeHex(buckle, 0.35)} /> : <rect x={150 - 7} y={y + 3} width={14} height={9} rx={2} fill={shadeHex(buckle, 0.3)} />}
  </g>
);
const HiVis = ({ g, color: c }: { g: BodyGeo; color: string }) => {
  const v = geoVars(g);
  const { c: cx, h, iw, top } = v;
  const { bx, w } = g;
  const vy = top + h * 0.34;
  const band = (y: number) => <rect x={bx - 20} y={y} width={w + 40} height={13} fill="#e8e8e2" />;
  const s1 = top + h * 0.56, s2 = top + h * 0.8;
  return (
    <g>
      <path d={`M${bx - 40} ${top - 12} H${cx - 30} L${cx} ${vy} L${cx + 30} ${top - 12} H${bx + w + 40} V${g.bottom + 40} H${bx - 40} Z`} fill={c} />
      {[-1, 1].map((s) => <rect key={s} x={cx + s * iw * 0.3 - 6.5} y={top - 10} width={13} height={s1 - top + 10} fill="#e8e8e2" />)}
      {band(s1)}{band(s2)}
      <path d={`M${cx} ${vy} V${g.bottom + 10}`} stroke={shadeHex(c, 0.25)} strokeWidth={3} />
    </g>
  );
};
const PeakedCap = ({ crown, band, badge, cord }: { crown: string; band: string; badge?: ReactNode; cord?: string }) => (
  <g>
    <path d="M86 104 L64 80 Q62 64 92 60 Q150 48 208 60 Q238 64 236 80 L214 104 Z" fill={crown} />
    <path d="M64 80 Q150 66 236 80 Q236 72 226 68 Q150 58 74 68 Q64 72 64 80 Z" fill={shadeHex(crown, -0.12)} />
    <rect x={84} y={98} width={132} height={22} rx={4} fill={band} />
    {cord && <path d="M94 118 L206 118" stroke={cord} strokeWidth={4} strokeLinecap="round" />}
    <path d="M88 118 L214 118 Q248 120 250 131 Q206 136 88 127 Z" fill="#151515" />
    {badge}
  </g>
);
const Kiss = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <path transform={`translate(${x} ${y}) rotate(${r})`} d="M-13 0 Q-8 -9 -1 -4 L0 -3 L1 -4 Q8 -9 13 0 Q7 3 0 2 Q-7 3 -13 0 Z M-12 2 Q0 13 12 2 Q0 6 -12 2 Z" fill="#d42a4a" />
);
/** Длинная пушистая шуба поверх одежды (без обрезки, ниже тела). */
const FurCoat = ({ g }: { g: BodyGeo }) => {
  const { bx, w, top, bottom, legH } = g;
  const hem = bottom + legH * 0.45;
  const fluff = (y: number, x0: number, x1: number, r: number) => { const out = []; for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / (r * 1.5)))) out.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} />); return out; };
  return (
    <g>
      <path d={`M${bx + 30} ${top} H${bx + w - 30} Q${bx + w + 8} ${top} ${bx + w + 10} ${top + 44} L${bx + w + 28} ${hem} H${bx - 28} L${bx - 10} ${top + 44} Q${bx - 8} ${top} ${bx + 30} ${top} Z`} fill={FUR} />
      <rect x={147} y={top + 24} width={6} height={hem - top - 30} rx={3} fill="#4a301f" />
      <g fill={FUR_TRIM}>{fluff(hem, bx - 24, bx + w + 24, 13)}{fluff(top + 6, 104, 196, 15)}</g>
      {[0.3, 0.55].map((k) => <rect key={k} x={140} y={top + 24 + (hem - top) * k} width={20} height={8} rx={4} fill={FUR_TRIM} />)}
    </g>
  );
};
/** Банное полотенце вокруг пояса (поверх ног, без обрезки). */
const TowelWrap = ({ g }: { g: BodyGeo }) => {
  const { bx, w, bottom, legH } = g;
  const y0 = bottom - 46, hem = bottom + legH * 0.5;
  const L0 = bx - 8, R0 = bx + w + 8, L1 = bx - 20, R1 = bx + w + 20;
  const tx = bx + w * 0.66;
  return (
    <g>
      <path d={`M${L0} ${y0} Q150 ${y0 - 8} ${R0} ${y0} L${R1} ${hem} Q150 ${hem + 12} ${L1} ${hem} Z`} fill="#f4f1ea" />
      {[0.72, 0.82].map((k) => <path key={k} d={`M${L0 + (L1 - L0) * k - 1} ${y0 + (hem - y0) * k} Q150 ${y0 + (hem - y0) * k + 10} ${R0 + (R1 - R0) * k + 1} ${y0 + (hem - y0) * k}`} stroke="#7fb3d5" strokeWidth={7} fill="none" />)}
      <path d={`M${tx} ${y0 - 3} Q${tx + 10} ${(y0 + hem) / 2} ${tx + 4} ${hem + 6}`} stroke="#ddd8ca" strokeWidth={4} fill="none" />
      <path d={`M${tx - 4} ${y0 - 2} L${tx + 22} ${y0 - 4} L${tx + 12} ${y0 + 22} Z`} fill="#e6e1d4" />
      <path d={`M${L0 + 14} ${y0 + 20} Q${L0 + 8} ${(y0 + hem) / 2} ${L1 + 18} ${hem - 4}`} stroke="#e6e1d4" strokeWidth={4} fill="none" />
    </g>
  );
};
/** Пятна на теле (далматинец; на тёмной шкуре — светлые). */
const SpotsBody = ({ g, skin }: { g: BodyGeo; skin: string }) => {
  const { bx, w, top, bottom } = g;
  return <g fill={spotColor(skin)}>{[[0.25, 40, 18], [0.72, 70, 15], [0.42, 0.62, 17], [0.82, -32, 12], [0.14, -46, 12], [0.58, 16, 9], [0.3, -14, 9]].map(([fx, fy, r], i) => <circle key={i} cx={bx + w * fx} cy={fy > 1 ? top + fy : fy < 0 ? bottom + fy : top + (bottom - top) * fy} r={r} />)}</g>;
};
/** Лохматые пряди: зубчатая «шапка» сверху и космы по бокам за головой (домовой, леший). */
const jag = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, out: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= n * 2; i++) {
    const a = ((a0 + ((a1 - a0) * i) / (n * 2)) * Math.PI) / 180;
    const k = i % 2 ? 1 + out : 1;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return pts;
};
const SHAGGY_TOP = `M${jag(150, 160, 80, 86, 196, 344, 7, 0.16).join(" L")} Q150 96 70 136 Z`;
const SHAGGY_BACK = `M${jag(150, 168, 88, 96, 140, 400, 12, 0.14).join(" L")} Z`;
/** Флотский воротник-гюйс с тельняшкой в вырезе. */
const SailorCollar = ({ top, vy, half }: { top: number; vy: number; half: number }) => {
  const ts: number[] = [];
  for (let y = top - 4; y < vy; y += 11) ts.push(y);
  const hw = (y: number) => (half * (vy - y)) / (vy - (top - 8));
  const band = (s: number) => `M${150 - s * half} ${top - 8} L150 ${vy} L${150 - s * 30} ${vy - 2} L${150 - s * 58} ${top - 8} Z`;
  return (
    <>
      <Vneck top={top} vy={vy} color="#f6f2e8" half={half} />
      <g fill="#2a4a8a">{ts.map((y) => <rect key={y} x={150 - hw(y + 3)} y={y} width={2 * hw(y + 3)} height={5} />)}</g>
      {[1, -1].map((s) => <path key={s} d={band(s)} fill="#3f6db3" />)}
      {[1, -1].map((s) => [12, 19].map((o) => <path key={`${s}${o}`} d={`M${150 - s * (half + o)} ${top - 8} L${150 - s * (o * 0.55)} ${vy - 2 - o * 0.1}`} stroke="#f6f2e8" strokeWidth={2.5} />))}
      <path d={`M${150 - 9} ${vy - 4} L${150 + 9} ${vy - 4} L${150 + 5} ${vy + 10} L${150 - 5} ${vy + 10} Z`} fill="#151515" />
    </>
  );
};
/** Орденские планки: ряды по три цветных прямоугольника. */
const Ribbons = ({ x, y, colors }: { x: number; y: number; colors: string[] }) => (
  <g>{colors.map((col, i) => <rect key={i} x={x + (i % 3) * 12} y={y + Math.floor(i / 3) * 8} width={11} height={7} fill={col} />)}</g>
);
/** Горизонтальные полосы от y0, пока y < y1, шаг step (тюремная роба). */
const HStripes = ({ y0, y1, step, height, x, width, fill }: { y0: number; y1: number; step: number; height: number; x: number; width: number; fill: string }) => {
  const ys: number[] = [];
  for (let y = y0; y < y1; y += step) ys.push(y);
  return <g fill={fill}>{ys.map((y) => <rect key={y} x={x} y={y} width={width} height={height} />)}</g>;
};

/** Рисует список фигур гардероба. */
function shapes(list: Shape[] | undefined, ctx: Ctx): ReactNode[] {
  return (list ?? []).map((s, i) => shape(s, ctx, i));
}
function shape(s: Shape, ctx: Ctx, key: number): ReactNode {
  const n = (k: string) => num(s[k], ctx.v);
  const c = (k: string) => color(s[k], ctx);
  const g = ctx.geo;
  switch (s.p) {
    case "path": return <path key={key} d={tmpl(String(s.d), ctx.v)} {...style(s, ctx)} />;
    case "rect": return <rect key={key} x={n("x")} y={n("y")} width={n("w")} height={n("h")} rx={"rx" in s ? n("rx") : undefined} ry={"ry" in s ? n("ry") : undefined} {...style(s, ctx)} />;
    case "circle": return <circle key={key} cx={n("cx")} cy={n("cy")} r={n("r")} {...style(s, ctx)} />;
    case "ellipse": return <ellipse key={key} cx={n("cx")} cy={n("cy")} rx={n("rx")} ry={n("ry")} {...style(s, ctx)} />;
    case "text": return <text key={key} x={n("x")} y={n("y")} fontSize={n("size")} fontWeight={s.weight as number} fontFamily={FONT} textAnchor={s.anchor as "middle" | undefined} {...style(s, ctx)}>{String(s.text)}</text>;
    case "g": return <g key={key} {...style(s, ctx)}>{shapes(s.do as Shape[], ctx)}</g>;
    case "frag": return <g key={key}>{shapes(s.do as Shape[], ctx)}</g>;
    case "each": {
      // повтор: var пробегает список in или 0..range−1; вложенные фигуры видят переменную
      const vals = Array.isArray(s.in) ? (s.in as unknown[]).map((x) => num(x, ctx.v)) : Array.from({ length: n("range") }, (_, i) => i);
      return vals.map((x, i) => <g key={`${key}-${i}`}>{shapes(s.do as Shape[], { ...ctx, v: { ...ctx.v, [String(s.var)]: x } })}</g>);
    }
    case "base": return <Base key={key} g={g} color={c("color")!} />;
    case "vneck": return <Vneck key={key} top={n("top")} vy={n("vy")} color={c("color")!} half={"half" in s ? n("half") : undefined} />;
    case "lapels": return <Lapels key={key} top={n("top")} vy={n("vy")} color={c("color")!} half={"half" in s ? n("half") : undefined} edge={c("edge")} />;
    case "tie": return <TieShape key={key} y0={n("y0")} y1={n("y1")} color={c("color")!} />;
    case "buttons": return <Buttons key={key} x={n("x")} y0={n("y0")} y1={n("y1")} n={n("n")} color={"color" in s ? c("color") : undefined} r={"r" in s ? n("r") : undefined} />;
    case "pocket": return <Pocket key={key} cx={n("cx")} y={n("y")} w={n("w")} color={c("color")!} button={c("button")} />;
    case "belt": return <Belt key={key} g={g} y={n("y")} color={"color" in s ? c("color") : undefined} buckle={"buckle" in s ? c("buckle") : undefined} starOn={!!s.star} />;
    case "hivis": return <HiVis key={key} g={g} color={c("color")!} />;
    case "peaked-cap": return <PeakedCap key={key} crown={c("crown")!} band={c("band")!} cord={c("cord")} badge={s.badge ? <g>{shapes(s.badge as Shape[], ctx)}</g> : undefined} />;
    case "star": return <Star key={key} cx={n("cx")} cy={n("cy")} r={n("r")} fill={c("fill")!} />;
    case "kiss": return <Kiss key={key} x={n("x")} y={n("y")} r={"r" in s ? n("r") : undefined} />;
    case "fur-coat": return <FurCoat key={key} g={g} />;
    case "towel-wrap": return <TowelWrap key={key} g={g} />;
    case "spots-body": return <SpotsBody key={key} g={g} skin={ctx.colors.skin} />;
    case "shaggy-top": return <path key={key} d={SHAGGY_TOP} fill={c("fill")} />;
    case "shaggy-back": return <path key={key} d={SHAGGY_BACK} fill={c("fill")} />;
    case "sailor-collar": return <SailorCollar key={key} top={n("top")} vy={n("vy")} half={n("half")} />;
    case "ribbons": return <Ribbons key={key} x={n("x")} y={n("y")} colors={(s.colors as string[]).map((x) => color(x, ctx)!)} />;
    case "hstripes": return <HStripes key={key} y0={n("y0")} y1={n("y1")} step={n("step")} height={n("height")} x={n("x")} width={n("width")} fill={c("fill")!} />;
    default: throw new Error(`wardrobe: unknown primitive "${s.p}"`);
  }
}

/** Контекст вещи: переменные тела + её let (по порядку) + цвета куклы. */
function ctxFor(it: WardrobeItem, geo: BodyGeo, colors: Record<string, string>): Ctx {
  const v = geoVars(geo);
  for (const [k, e] of Object.entries(it.let ?? {})) v[k] = typeof e === "number" ? e : compile(e)(v);
  return { v, colors, geo };
}

/**
 * Вещь на кукле. part: "draw" — основной рисунок; "head" — её часть на голове (пятна); "back" — часть за головой (причёска).
 * Неизвестный id — ничего (validate сообщает о нём).
 */
export function WardrobePiece({ id, part = "draw", geo, hair, skin, clothes }: { id: string; part?: "draw" | "head" | "back"; geo: BodyGeo; hair: string; skin: string; clothes: string }) {
  const it = WARDROBE[id];
  if (!it) return null;
  const list = part === "draw" ? it.draw : part === "head" ? it.head : it.back;
  if (!list?.length) return null;
  return <>{shapes(list as Shape[], ctxFor(it, geo, { hair, skin, clothes, spot: spotColor(skin) }))}</>;
}

/* ---------- сводки по списку вещей (что рисует риг) ---------- */
export type Outfit = NonNullable<WardrobeItem["outfit"]>;
/** Сводная форма на руках и ногах по списку аксессуаров (последний выигрывает). */
export function outfitOf(acc: string[]): Outfit {
  const o: Outfit = {};
  for (const a of acc) if (WARDROBE[a]?.outfit) Object.assign(o, WARDROBE[a].outfit);
  return o;
}
export type RigFx = NonNullable<WardrobeItem["rig"]>;
/** Эффекты, которые рисует риг (ряса, крюк, гипс, мех, пятна, помада, брови, простыня), по списку аксессуаров. */
export function rigOf(acc: string[]): RigFx {
  const o: RigFx = {};
  for (const a of acc) if (WARDROBE[a]?.rig) Object.assign(o, WARDROBE[a].rig);
  return o;
}
/** Вещи слота (в порядке look.accessories). */
export const inSlot = (acc: string[], ...slots: WardrobeItem["slot"][]) => acc.filter((a) => WARDROBE[a] && slots.includes(WARDROBE[a].slot));
/** Вещи на теле с обрезкой по контуру — по слою (стабильно), потом без обрезки (шуба, полотенце). */
export const torsoClipped = (acc: string[]) =>
  inSlot(acc, "torso").filter((a) => WARDROBE[a].clip !== false).sort((a, b) => (WARDROBE[a].layer ?? 2) - (WARDROBE[b].layer ?? 2));
export const torsoOver = (acc: string[]) => inSlot(acc, "torso").filter((a) => WARDROBE[a].clip === false);
/** Головные уборы и форма роли (для costumeFor). */
export const HAT_IDS = () => Object.values(WARDROBE).filter((it) => it.slot === "hat").map((it) => it.id);
export const WEAR_IDS = () => new Set(Object.values(WARDROBE).filter((it) => it.wear).map((it) => it.id));
