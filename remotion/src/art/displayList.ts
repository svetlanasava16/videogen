/**
 * Display list (ROADMAP §7): арт как плоский список примитивов, который одинаково рисуют SVG, Canvas2D и Pixi.
 * Источник — тот же React SVG (кукла с гардеробом, позой и лицом; предметы; фигуры), отрисованный в разметку и «сплющенный»:
 *  - каждая фигура (path, rect, circle, ellipse, line, polygon) → строка пути SVG `d` (её понимают Path2D и Pixi Graphics);
 *  - трансформации групп сведены в одну матрицу на элемент (a b c d e f);
 *  - заливка, обводка, прозрачность наследуются от групп и записаны в каждом элементе;
 *  - clipPath (одежда по контуру тела) — список путей с их матрицами;
 *  - фильтр помады (контур рта цветом губ, feMorphology dilate) — толстая обводка цветом губ под формой рта.
 * Рендерер (canvas.ts, позже Pixi) рисует элементы по порядку: путь или текст в своей матрице, с клипом.
 */
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export type Mat = [number, number, number, number, number, number];
export type DisplayItem = {
  /** Путь SVG (для фигур) — или текст. */
  d?: string;
  text?: { x: number; y: number; s: string; size: number; weight: string; anchor: "start" | "middle" | "end"; italic?: boolean };
  m: Mat;
  fill?: string; stroke?: string; sw?: number; cap?: string; join?: string; dash?: number[];
  opacity: number;
  rule?: "evenodd" | "nonzero";
  clip?: { d: string; m: Mat }[];
};

/* ---------- разметка → дерево ---------- */
type Node = { tag: string; attrs: Record<string, string>; children: Node[]; text: string };
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#x27": "'", "#39": "'" };
const unescape = (s: string) => s.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (m, e: string) => ENT[e] ?? (e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : m));

/** Разбор разметки React (корректный XML без комментариев и CDATA). */
export function parseMarkup(src: string): Node {
  const root: Node = { tag: "#root", attrs: {}, children: [], text: "" };
  const stack = [root];
  const re = /<\/?([a-zA-Z][\w:-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[4] !== undefined) { stack[stack.length - 1].text += unescape(m[4]); continue; }
    const closing = m[0][1] === "/";
    if (closing) { stack.pop(); continue; }
    const attrs: Record<string, string> = {};
    for (const a of m[2].matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = unescape(a[2] ?? "");
    const node: Node = { tag: m[1], attrs, children: [], text: "" };
    stack[stack.length - 1].children.push(node);
    if (!m[3]) stack.push(node);
  }
  return root;
}

/* ---------- матрицы ---------- */
const I: Mat = [1, 0, 0, 1, 0, 0];
const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
/** transform="translate(…) scale(…) rotate(a cx cy) matrix(…)" → матрица. */
export function parseTransform(s?: string): Mat {
  if (!s) return I;
  let out = I;
  for (const [, fn, args] of s.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    let t: Mat = I;
    if (fn === "translate") t = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0];
    else if (fn === "scale") t = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    else if (fn === "rotate") {
      const r = ((v[0] ?? 0) * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
      const rot: Mat = [c, sn, -sn, c, 0, 0];
      t = v.length >= 3 ? mul(mul([1, 0, 0, 1, v[1], v[2]], rot), [1, 0, 0, 1, -v[1], -v[2]]) : rot;
    } else if (fn === "matrix") t = v as Mat;
    else if (fn === "skewX") t = [1, 0, Math.tan((v[0] * Math.PI) / 180), 1, 0, 0];
    else if (fn === "skewY") t = [1, Math.tan((v[0] * Math.PI) / 180), 0, 1, 0, 0];
    out = mul(out, t);
  }
  return out;
}

/* ---------- фигуры → путь ---------- */
const n = (a: Record<string, string>, k: string, d = 0) => (a[k] !== undefined ? Number(a[k]) : d);
function shapePath(tag: string, a: Record<string, string>): string | undefined {
  switch (tag) {
    case "path": return a.d;
    case "rect": {
      const x = n(a, "x"), y = n(a, "y"), w = n(a, "width"), h = n(a, "height");
      if (!(w > 0 && h > 0)) return undefined;
      let rx = a.rx !== undefined ? n(a, "rx") : a.ry !== undefined ? n(a, "ry") : 0;
      let ry = a.ry !== undefined ? n(a, "ry") : rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
      return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    }
    case "circle": case "ellipse": {
      const cx = n(a, "cx"), cy = n(a, "cy"), rx = tag === "circle" ? n(a, "r") : n(a, "rx"), ry = tag === "circle" ? n(a, "r") : n(a, "ry");
      if (!(rx > 0 && ry > 0)) return undefined;
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
    }
    case "line": return `M${n(a, "x1")} ${n(a, "y1")}L${n(a, "x2")} ${n(a, "y2")}`;
    case "polygon": case "polyline": {
      const p = (a.points ?? "").trim().split(/[\s,]+/).map(Number);
      if (p.length < 4) return undefined;
      let d = `M${p[0]} ${p[1]}`;
      for (let i = 2; i + 1 < p.length; i += 2) d += `L${p[i]} ${p[i + 1]}`;
      return tag === "polygon" ? d + "Z" : d;
    }
    default: return undefined;
  }
}

/* ---------- сплющивание ---------- */
type Paint = { fill: string; stroke: string; sw: number; cap?: string; join?: string; dash?: number[]; rule?: "evenodd" | "nonzero"; size: number; weight: string; anchor: "start" | "middle" | "end"; italic: boolean };
const ROOT_PAINT: Paint = { fill: "#000", stroke: "none", sw: 1, size: 16, weight: "400", anchor: "start", italic: false };
type Ctx = { m: Mat; p: Paint; opacity: number; clip: { d: string; m: Mat }[]; lips?: { color: string; r: number } };
const urlRef = (v?: string) => v?.match(/url\(#([^)]+)\)/)?.[1];

/** Разметка SVG → display list (координаты корневого svg). */
export function flatten(markup: string): DisplayItem[] {
  const root = parseMarkup(markup);
  const clips = new Map<string, Node>(), filters = new Map<string, { color: string; r: number }>();
  const collect = (nd: Node) => {
    if (nd.tag === "clipPath" && nd.attrs.id) clips.set(nd.attrs.id, nd);
    if (nd.tag === "filter" && nd.attrs.id) {
      const morph = nd.children.find((c) => c.tag === "feMorphology" && c.attrs.operator === "dilate");
      const flood = nd.children.find((c) => c.tag === "feFlood");
      if (morph && flood) filters.set(nd.attrs.id, { color: flood.attrs["flood-color"] ?? "#000", r: Number(morph.attrs.radius ?? 1) });
    }
    nd.children.forEach(collect);
  };
  collect(root);
  const out: DisplayItem[] = [];
  const paintOf = (a: Record<string, string>, p: Paint): Paint => ({
    fill: a.fill ?? p.fill, stroke: a.stroke ?? p.stroke,
    sw: a["stroke-width"] !== undefined ? Number(a["stroke-width"]) : p.sw,
    cap: a["stroke-linecap"] ?? p.cap, join: a["stroke-linejoin"] ?? p.join,
    dash: a["stroke-dasharray"] ? a["stroke-dasharray"].split(/[\s,]+/).map(Number) : p.dash,
    rule: (a["fill-rule"] as Paint["rule"]) ?? p.rule,
    size: a["font-size"] !== undefined ? Number(a["font-size"]) : p.size,
    weight: a["font-weight"] ?? p.weight,
    anchor: (a["text-anchor"] as Paint["anchor"]) ?? p.anchor,
    italic: a["font-style"] ? a["font-style"] === "italic" : p.italic,
  });
  const emit = (base: Omit<DisplayItem, "fill" | "stroke" | "sw">, p: Paint, ctx: Ctx) => {
    const fill = p.fill !== "none" ? p.fill : undefined, stroke = p.stroke !== "none" ? p.stroke : undefined;
    // помада: контур формы цветом губ (толщина = 2 × радиус расширения) — под самой формой
    if (ctx.lips && base.d && fill) out.push({ ...base, fill: ctx.lips.color, stroke: ctx.lips.color, sw: ctx.lips.r * 2, join: "round", cap: "round", rule: p.rule });
    out.push({ ...base, ...(fill ? { fill } : {}), ...(stroke ? { stroke, sw: p.sw, cap: p.cap, join: p.join, dash: p.dash } : {}), rule: p.rule });
  };
  const walk = (nd: Node, ctx: Ctx) => {
    if (nd.tag === "defs" || nd.tag === "clipPath" || nd.tag === "filter" || nd.tag === "title" || nd.tag === "style") return;
    const a = nd.attrs;
    if (a.display === "none" || a.visibility === "hidden") return;
    const m = nd.tag === "svg" ? ctx.m : mul(ctx.m, parseTransform(a.transform));
    const p = paintOf(a, ctx.p);
    const opacity = ctx.opacity * (a.opacity !== undefined ? Number(a.opacity) : 1);
    let clip = ctx.clip;
    const cid = urlRef(a["clip-path"]);
    if (cid && clips.has(cid)) {
      const cps: { d: string; m: Mat }[] = [];
      for (const c of clips.get(cid)!.children) { const d = shapePath(c.tag, c.attrs); if (d) cps.push({ d, m: mul(m, parseTransform(c.attrs.transform)) }); }
      clip = [...clip, ...cps];
    }
    const fid = urlRef(a.filter);
    const lips = fid && filters.has(fid) ? filters.get(fid) : ctx.lips;
    const next: Ctx = { m, p, opacity, clip, lips };
    if (opacity <= 0) return;
    const d = shapePath(nd.tag, a);
    if (d) emit({ d, m, opacity, ...(clip.length ? { clip } : {}) }, p, next);
    else if (nd.tag === "text") {
      const s = (nd.text + nd.children.map((c) => c.text).join("")).trim();
      if (s) emit({ text: { x: n(a, "x"), y: n(a, "y"), s, size: p.size, weight: p.weight, anchor: p.anchor, ...(p.italic ? { italic: true } : {}) }, m, opacity, ...(clip.length ? { clip } : {}) }, p, next);
    }
    for (const c of nd.children) walk(c, next);
  };
  walk(root, { m: I, p: ROOT_PAINT, opacity: 1, clip: [] });
  return out;
}

/** React-элемент SVG (кукла, предмет) → display list. */
export const displayListOf = (el: ReactElement): DisplayItem[] => flatten(renderToStaticMarkup(el));
