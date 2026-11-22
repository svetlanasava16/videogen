import { useCurrentFrame } from "remotion";
import type { Locale } from "@jf/core";
import { Fill } from "../lib/Fill";
import { Flyover } from "./Flyover";
import { town } from "./town";

/**
 * Пролёт отдельно (композиция Flyover, для проверки маршрутов): from/to — id зданий городка, длина — frames;
 * straight — старый прямой пролёт без графа (для сравнения «до/после»).
 */
export const FlyoverPreview = ({ from, to, locale = "ru", frames = 48, straight }: { from: string; to: string; locale?: Locale; frames?: number; straight?: boolean }) => {
  const frame = useCurrentFrame();
  const b = (id: string) => town.buildings.find((x) => x.id === id) ?? town.buildings[0];
  return <Fill style={{ background: "#000" }}><Flyover frame={frame} at={frames / 2} frames={frames} from={b(from)} to={b(to)} locale={locale} straight={straight} /></Fill>;
};
