import type { ReactElement } from "react";
import { Fill } from "../lib/Fill";
import { subLocation, type Location } from "@jf/core";
import { BACKDROPS } from "../backdrops";
import { Canvas, Room } from "../backdrops/parts";
import { KitBackdrop } from "../backdrops/Kit";

/**
 * Рисунок фона (SVG 1080×1920) по id локации. variant — id сублокации (bible.variants[].id), найденной по place:
 * по id или по roles (старые эпизоды хранят канонический архетип). Неизвестный place — вид по умолчанию.
 * null — у этого вида нет такого слоя (переднего). Тот же рисунок выгружает pnpm export-art.
 */
export function backdropElement(location: Location, place: string | undefined, layer: "back" | "front"): ReactElement | null {
  const Comp = BACKDROPS[location.id];
  const variant = subLocation(location, place)?.id ?? (place && place !== location.id ? place : undefined);
  if (Comp) return <Comp palette={location.palette} variant={variant} layer={layer} />;
  if (layer === "front") return null;
  if (location.kit) return <KitBackdrop kit={location.kit} palette={location.palette} />;
  return <Canvas><Room wall={location.palette.wall} floor={location.palette.floor} /></Canvas>;
}

/** Фон эпизода во весь кадр. */
export const Background = ({ location, place, layer = "back" }: { location: Location; place?: string; layer?: "back" | "front" }) => (
  <Fill>{backdropElement(location, place, layer)}</Fill>
);
