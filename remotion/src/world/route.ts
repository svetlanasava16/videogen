import { TownGraph, shortestRoute } from "@jf/core";
import mapData from "../../../content/world/map.json";

/** Граф городка (content/world/map.json): здания и улицы, рёбра с видом пути и минутами. */
export const graph = TownGraph.parse(mapData);
const at = new Map(graph.nodes.map((n) => [n.id, n]));

export type RouteLeg = { x1: number; y1: number; x2: number; y2: number; kind: string; len: number };
export type TownRoute = { nodes: string[]; legs: RouteLeg[]; len: number; minutes: number };

const cache = new Map<string, TownRoute | undefined>();
/** Путь по графу между зданиями (кратчайший по времени) — отрезки в координатах карты; нет пути — undefined. */
export function routeBetween(from: string, to: string): TownRoute | undefined {
  const key = `${from}>${to}`;
  if (cache.has(key)) return cache.get(key);
  const r = from === to ? undefined : shortestRoute(graph, from, to);
  const out = r && {
    nodes: r.nodes, minutes: r.minutes,
    legs: r.edges.map((e, i) => {
      const a = at.get(r.nodes[i])!, b = at.get(r.nodes[i + 1])!;
      return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, kind: e.kind, len: Math.hypot(b.x - a.x, b.y - a.y) };
    }),
    len: 0,
  };
  if (out) out.len = out.legs.reduce((s, l) => s + l.len, 0);
  cache.set(key, out);
  return out;
}

/** Точка на пути при доле длины k (0…1). */
export function pointOn(r: TownRoute, k: number): { x: number; y: number } {
  let d = Math.max(0, Math.min(1, k)) * r.len;
  for (const l of r.legs) {
    if (d <= l.len || l === r.legs[r.legs.length - 1]) { const t = l.len ? Math.min(1, d / l.len) : 1; return { x: l.x1 + (l.x2 - l.x1) * t, y: l.y1 + (l.y2 - l.y1) * t }; }
    d -= l.len;
  }
  return { x: r.legs[0].x1, y: r.legs[0].y1 };
}
