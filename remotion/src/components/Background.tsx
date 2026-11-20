import { AbsoluteFill } from "remotion";
import type { Location } from "@jf/core";
import { BACKDROPS } from "../backdrops";
import { Canvas, Room } from "../backdrops/parts";
import { KitBackdrop } from "../backdrops/Kit";

/** Фон эпизода: SVG-компонент по id локации, вариант — по канонической локации (place). */
export const Background = ({ location, place }: { location: Location; place?: string }) => {
  const Comp = BACKDROPS[location.id];
  return (
    <AbsoluteFill>
      {Comp ? (
        <Comp palette={location.palette} variant={place && place !== location.id ? place : undefined} />
      ) : location.kit ? (
        <KitBackdrop kit={location.kit} palette={location.palette} />
      ) : (
        <Canvas><Room wall={location.palette.wall} floor={location.palette.floor} /></Canvas>
      )}
    </AbsoluteFill>
  );
};
