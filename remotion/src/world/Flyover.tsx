import { Easing, interpolate } from "../lib/anim";
import { Fill } from "../lib/Fill";
import type { Locale } from "@jf/core";
import { TownMap, TOWN_H, TOWN_W } from "./TownMap";
import type { Building } from "./town";
import { routeBetween, type TownRoute } from "./route";
import { Watermark } from "../components/Branding";

const ease = Easing.inOut(Easing.cubic);
const ASPECT = 16 / 9; // высота / ширина кадра
const CLOSE_W = 760; // ширина окна камеры у здания

type Box = { cx: number; cy: number; w: number };
const focus = (b: Building): Box => ({ cx: b.x, cy: b.y - 120, w: CLOSE_W });

/** Окно, в которое помещаются оба здания (с полями), в пропорции кадра. */
function both(a: Building, b: Building): Box {
  const pad = 420;
  const w = Math.max(Math.abs(a.x - b.x) + pad * 2, (Math.abs(a.y - b.y) + pad * 2) / ASPECT, CLOSE_W * 1.6);
  return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 - 80, w: Math.min(w, TOWN_H / ASPECT) };
}

const viewBox = (b: Box) => {
  const h = b.w * ASPECT;
  const x = Math.min(Math.max(b.cx - b.w / 2, -b.w * 0.2), TOWN_W - b.w * 0.8);
  const y = Math.min(Math.max(b.cy - h / 2, -h * 0.1), TOWN_H - h * 0.9);
  return `${x} ${y} ${b.w} ${h}`;
};

/** Окно, в которое помещается весь маршрут по графу (с полями), в пропорции кадра. */
function around(r: TownRoute): Box {
  const xs = r.legs.flatMap((l) => [l.x1, l.x2]), ys = r.legs.flatMap((l) => [l.y1, l.y2]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = 380;
  const w = Math.max(x1 - x0 + pad * 2, (y1 - y0 + pad * 2) / ASPECT, CLOSE_W * 1.6);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 - 60, w: Math.min(w, TOWN_H / ASPECT) };
}

const mix = (a: Box, b: Box, k: number): Box => ({ cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, w: a.w + (b.w - a.w) * k });

/**
 * Пролёт над городом между сценами/анекдотами. Перекрывает стык at на frames кадров:
 * сцена растворяется в карту у здания from, камера отъезжает, по пути графа городка (content/world/map.json: улицы, мост,
 * автобус, самолёт, небо) бежит метка, камера приближается к зданию to, карта растворяется в новую сцену.
 * Нет пути (то же здание) — прямой пролёт, как раньше.
 */
export const Flyover = ({ frame, at, frames, from, to, locale, straight }: { frame: number; at: number; frames: number; from: Building; to: Building; locale: Locale; straight?: boolean }) => {
  const start = at - frames / 2;
  if (frame < start || frame > at + frames / 2) return null;
  const p = interpolate(frame, [start, at + frames / 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const route = straight ? undefined : routeBetween(from.id, to.id);
  const A = focus(from), B = focus(to), M = route ? around(route) : both(from, to);
  const box = p < 0.5 ? mix(A, M, ease(p / 0.5)) : mix(M, B, ease((p - 0.5) / 0.5));
  const opacity = interpolate(p, [0, 0.14, 0.86, 1], [0, 1, 1, 0]);
  const progress = ease(interpolate(p, [0.22, 0.78], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <Fill style={{ opacity }}>
      <TownMap viewBox={viewBox(box)} locale={locale} highlight={p < 0.5 ? from.id : to.id} route={route && { route, progress }} />
      <Watermark />
    </Fill>
  );
};

/** Заставка сборника: город сверху, плавный наезд к первому зданию. */
/** Заставка сборника: пролёт над картой города к первому зданию. Без названия поверх (пользователь убрал «Анекдоты из Анекдотска»). */
export const TownIntro = ({ frame, frames, to, locale }: { frame: number; frames: number; to: Building; locale: Locale; title?: string }) => {
  if (frame > frames) return null;
  const p = ease(Math.min(1, frame / frames));
  const all: Box = { cx: TOWN_W / 2, cy: TOWN_H / 2, w: TOWN_H / ASPECT };
  const box = mix(all, focus(to), p);
  const fade = interpolate(p, [0.85, 1], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <Fill style={{ opacity: fade }}>
      <TownMap viewBox={viewBox(box)} locale={locale} labels={p > 0.3} />
      <Watermark />
    </Fill>
  );
};

/** Превью карты целиком (композиция Town). */
export const TownPreview = ({ locale = "ru" as Locale }: { locale?: Locale }) => (
  <Fill>
    <TownMap viewBox={`0 0 ${TOWN_W} ${TOWN_H}`} locale={locale} />
  </Fill>
);

