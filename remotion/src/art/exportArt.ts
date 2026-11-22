/**
 * Арт для игры (ROADMAP §7, `pnpm export-art`): фоны всех мест и сублокаций — SVG (и PNG) по слоям и языкам,
 * плюс метаданные: метки (x, план, стопы, масштаб куклы, верх сиденья), поверхности, передний слой, слоты, массовка.
 * Здесь — без Remotion: SVG через renderToStaticMarkup и метаданные; PNG рендерит pipeline (композиция BackdropLayer).
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { markOf, marksFor, subLocation, type Locale, type Location } from "@jf/core";
import { locations } from "../registry";
import { backdropElement } from "../components/Background";
import { LocaleProvider } from "../i18n/signs";
import { WALL_Y, depthScale, feetY, seatTopY } from "../world/depth";
import { PUPPET_H } from "../stage/geometry";
import { characters } from "../registry";
import { Puppet } from "../puppet/Rig";
import { displayListOf, type DisplayItem } from "./displayList";

export const ART_W = 1080, ART_H = 1920;
export type Layer = "back" | "front";
export type ArtPlace = { location: string; place?: string; name: string; layers: Layer[] };

/** Все виды: место (вид по умолчанию) и его сублокации; front — если у вида есть передний слой. */
export function artPlaces(): ArtPlace[] {
  const out: ArtPlace[] = [];
  for (const l of Object.values(locations)) {
    const views: { place?: string; name: string; front: boolean }[] = [
      { name: l.name?.ru ?? l.id, front: !!l.front },
      ...(l.bible?.variants ?? []).map((v) => ({ place: v.id ?? v.roles[0], name: v.name?.ru ?? v.id ?? v.roles[0], front: !!v.front })),
    ];
    for (const v of views) out.push({ location: l.id, ...(v.place ? { place: v.place } : {}), name: v.name, layers: v.front ? ["back", "front"] : ["back"] });
  }
  return out;
}

/** SVG слоя (самостоятельный файл 1080×1920); null — слоя нет. */
export function backdropSvg(location: string, place: string | undefined, layer: Layer, locale: Locale): string | null {
  const el = backdropElement(locations[location], place, layer);
  if (!el) return null;
  const markup = renderToStaticMarkup(createElement(LocaleProvider, { value: locale, children: el }));
  // корневой <svg> рисунка: явные размеры и пространство имён — файл открывается сам по себе
  return markup.replace(/^<svg([^>]*)>/, (_, attrs: string) => `<svg xmlns="http://www.w3.org/2000/svg"${attrs.replace(/\s(width|height|style|preserveAspectRatio)="[^"]*"/g, "")} width="${ART_W}" height="${ART_H}">`);
}

/** Метаданные вида: всё, что нужно игре, чтобы ставить кукол на этот фон (координаты — px кадра 1080×1920). */
export function placeMeta(location: string, place?: string) {
  const l: Location = locations[location];
  const sub = subLocation(l, place);
  const box = (z: number) => ({ feetY: feetY(z, ART_H), scale: depthScale(z), puppetH: ART_H * PUPPET_H * depthScale(z) });
  const marks = Object.fromEntries(Object.entries(marksFor(l, place)).map(([k, m]) => {
    const o = markOf(m)!;
    const z = o.z ?? 0.5;
    return [k, { x: o.x * ART_W, z, ...box(z), ...(o.seat ? { seat: o.seat, seatTop: seatTopY(z, ART_H) } : {}) }];
  }));
  const surfaces = ((sub ? sub.surfaces : l.surfaces) ?? []).map((s) => ({ x0: s.x0 * ART_W, x1: s.x1 * ART_W, z: s.z, top: s.top, y: feetY(s.z, ART_H) - s.top * depthScale(s.z) }));
  const front = sub ? sub.front : l.front;
  return {
    location, ...(place ? { place } : {}), size: [ART_W, ART_H], wallY: WALL_Y,
    planes: { back: box(1), mid: box(0.5), front: box(0) },
    marks, surfaces, ...(front ? { front } : {}),
    slots: (sub ? sub.slots : l.slots) ?? [],
    ...(sub?.crowd ? { crowd: sub.crowd } : {}),
  };
}

/** Display list каждой куклы в покое (облик по умолчанию): бокс 300×600, стопы на y = 585. */
export function puppetDisplayLists(): { id: string; items: DisplayItem[] }[] {
  return Object.values(characters).map((c) => ({
    id: c.id,
    items: displayListOf(createElement(Puppet, { look: c.look, emotion: "neutral", speaking: false, seed: 0, t: 0 })),
  }));
}
