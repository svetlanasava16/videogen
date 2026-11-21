import { AbsoluteFill } from "remotion";
import { subLocation, type Location } from "@jf/core";
import { BACKDROPS } from "../backdrops";
import { Canvas, Room } from "../backdrops/parts";
import { KitBackdrop } from "../backdrops/Kit";

/**
 * Фон эпизода: SVG-компонент по id локации. variant — id сублокации (bible.variants[].id), найденной по place:
 * по id или по roles (старые эпизоды хранят канонический архетип). Неизвестный place — вид по умолчанию.
 */
export const Background = ({ location, place }: { location: Location; place?: string }) => {
  const Comp = BACKDROPS[location.id];
  const variant = subLocation(location, place)?.id ?? (place && place !== location.id ? place : undefined);
  return (
    <AbsoluteFill>
      {Comp ? (
        <Comp palette={location.palette} variant={variant} />
      ) : location.kit ? (
        <KitBackdrop kit={location.kit} palette={location.palette} />
      ) : (
        <Canvas><Room wall={location.palette.wall} floor={location.palette.floor} /></Canvas>
      )}
    </AbsoluteFill>
  );
};
