import townData from "../../../content/world/town.json";

export type Building = (typeof townData.buildings)[number];
export const town = townData;

/** Здание городка для фона и варианта сцены: точное совпадение (location+place), иначе по одному фону. */
export function buildingFor(location: string, place?: string): Building {
  const exact = town.buildings.find((b) => b.places.some((p) => p.location === location && "place" in p && p.place === place));
  if (exact) return exact;
  const base = town.buildings.find((b) => b.places.some((p) => p.location === location && !("place" in p)));
  return base ?? town.buildings.find((b) => b.id === "square")!;
}
