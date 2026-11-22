/**
 * Перевод всех эпизодов content/episodes в замороженный формат v2 (детерминированно, без LLM):
 *   pnpm migrate-episodes [--dry-run]
 * Что делает — migrateEpisodeData в packages/core: сцены вместо старого вида, move-биты вместо enter/exit на репликах,
 * looks/crowd/set верхнего уровня — в сцену, kind/v. Озвучка, смех, флаги не трогаются. Повторный запуск ничего не меняет.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Episode, Location, migrateEpisodeData, subLocation } from "@jf/core";
import { ROOT } from "./util.js";

const dry = process.argv.includes("--dry-run");
const locs = new Map(readdirSync(join(ROOT, "content/locations")).filter((f) => f.endsWith(".json")).map((f) => {
  const l = Location.parse(JSON.parse(readFileSync(join(ROOT, "content/locations", f), "utf8")));
  return [l.id, l] as const;
}));
const isPlace = (loc: string, place: string) => !!subLocation(locs.get(loc), place);

const dir = join(ROOT, "content/episodes");
let changed = 0, legacy = 0, enterExit = 0, placeKept = 0, placeDropped = 0;
const failed: string[] = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
  const file = join(dir, f);
  const text = readFileSync(file, "utf8");
  const raw = JSON.parse(text);
  if (!Array.isArray(raw.scenes) || !raw.scenes.length) {
    legacy++;
    if (raw.place && raw.place !== raw.location) (isPlace(raw.location, raw.place) ? placeKept++ : placeDropped++);
  }
  if ((raw.lines ?? []).some((l: Record<string, unknown>) => (l.enter as unknown[])?.length || (l.exit as unknown[])?.length)) enterExit++;
  const parsed = Episode.safeParse(migrateEpisodeData(raw, isPlace));
  if (!parsed.success) { failed.push(`${f}: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`); continue; }
  const out = JSON.stringify(parsed.data, null, 2) + "\n";
  if (out !== text) { changed++; if (!dry) writeFileSync(file, out); }
}
console.log(`${changed} episodes ${dry ? "would change" : "migrated"}: ${legacy} without scenes (room kept ${placeKept}, default view ${placeDropped}), ${enterExit} with enter/exit on lines`);
if (failed.length) { console.log(failed.slice(0, 20).join("\n")); process.exitCode = 1; }
