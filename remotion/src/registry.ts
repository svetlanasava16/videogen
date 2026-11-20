import { Character, Location } from "@jf/core";
import { characterData, locationData } from "./registry.generated";

// Список файлов собирает `pnpm registry` (pipeline/src/registry.ts).
export const characters = Object.fromEntries(
  characterData.map((c) => Character.parse(c)).map((c) => [c.id, c]),
) as Record<string, Character>;

export const locations = Object.fromEntries(
  locationData.map((l) => Location.parse(l)).map((l) => [l.id, l]),
) as Record<string, Location>;
