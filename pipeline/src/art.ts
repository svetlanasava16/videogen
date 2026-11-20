/**
 * Очередь арта для ComfyUI из описаний кукол и фонов.
 *   pnpm art shots   → shots.characters.json, shots.locations.json (формат comfy_client.py)
 * Узлы workflow (params) заполняются после экспорта workflow_api.json: см. CLAUDE.md (check → nodes → params).
 */
import { Character, Location, Style } from "@jf/core";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./util.js";

const read = <T,>(dir: string, schema: { parse: (x: unknown) => T }) =>
  readdirSync(join(ROOT, "content", dir)).filter((f) => f.endsWith(".json")).sort()
    .map((f) => schema.parse(JSON.parse(readFileSync(join(ROOT, "content", dir, f), "utf8"))));

const style = Style.parse(JSON.parse(readFileSync(join(ROOT, "content", "style.json"), "utf8")));
const chars = read("characters", Character).filter((c) => c.bible);
const locs = read("locations", Location).filter((l) => l.bible);

const PARAMS = { prompt: "REPLACE_NODE_ID.text", negative: "REPLACE_NODE_ID.text", seed: "REPLACE_NODE_ID.seed" };
const base = (shots: unknown[]) => ({
  workflow: "workflow_api.json",
  params: PARAMS,
  defaults: { negative: style.negative },
  retries: 2,
  timeout_sec: 3600,
  shots,
});

const EMOTIONS = "neutral, happy, angry, surprised, sad, smug";
const charShots = chars.flatMap((c) => [
  { id: `char-${c.id}-sheet`, values: { prompt: `${style.positive}, character turnaround sheet, ${c.bible!.prompt}, front view, three-quarter view, side view, full body, neutral pose, plain light background` } },
  { id: `char-${c.id}-faces`, values: { prompt: `${style.positive}, expression sheet, ${c.bible!.prompt}, six head close-ups: ${EMOTIONS}, plain light background` } },
]);
const locShots = locs.flatMap((l) => [
  { id: `loc-${l.id}`, values: { prompt: `${style.positive}, vertical 9:16 background, ${l.bible!.prompt}, empty scene without people, centre left clear for characters` } },
  ...l.bible!.variants.map((v, i) => ({
    id: `loc-${l.id}-v${i + 1}`,
    values: { prompt: `${style.positive}, vertical 9:16 background, ${l.bible!.prompt}, variant: ${v.change}, empty scene without people` },
  })),
]);

const [cmd] = process.argv.slice(2);
if (cmd !== "shots") {
  console.error("usage: art shots");
  process.exit(2);
}
writeFileSync(join(ROOT, "shots.characters.json"), JSON.stringify(base(charShots), null, 2) + "\n");
writeFileSync(join(ROOT, "shots.locations.json"), JSON.stringify(base(locShots), null, 2) + "\n");
console.log(`shots.characters.json: ${charShots.length} shots; shots.locations.json: ${locShots.length} shots`);
