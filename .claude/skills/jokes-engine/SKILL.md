---
name: jokes-engine
description: The ANEK. engine — scenes as data (beats, marks, props, camera, transitions), the town of Jokeville (map, buildings, flyovers), compilations of several jokes, and new places made from data (kit backdrops). Use when the user wants multi-scene episodes, staging (walk to a spot, hand over an object), camera behaviour, compilations/transitions between videos, a new place in the town, or asks how the engine works and how to extend it without new code.
---

# ANEK. engine

Goal: any joke or sketch becomes **data** (an episode JSON); code is written only for new art (a figure, a hand-drawn backdrop, a prop). Reference project idea: an auto-generated "South Park"-style show — one town, recurring residents, scenes as data, automatic directing.

## Layers
| Layer | Where | What it does |
|---|---|---|
| World | `content/world/town.json`, `content/world/bible.md` | the town (Анекдотск / Jokeville / Witzhausen): buildings on a map, each mapped to backdrop[:variant]; residents and writing rules |
| Content | `content/characters`, `content/locations` (+ `marks`, `kit`), `content/props.json`, `content/audio.json` | puppets, places with named spots, hand props, sounds |
| Script | `content/episodes/<id>.json` (`lines` + optional `scenes`) | what is said and done |
| Director | `remotion/src/timeline.ts`, `remotion/src/director/camera.ts` | timing from voice, staging, automatic shots |
| Render | `remotion/src/Joke.tsx`, `Compilation.tsx`, `world/*` | puppets, backdrops, transitions, flyovers |

## Episode format (v2)
- `lines` — flat list of spoken lines (ids `l1…`): voice-over, subtitles and captions use it.
- `scenes` (optional) — `[{ location, place?, cast, roles, looks?, crowd?, transition, beats }]`; without it the episode is one scene (`location`/`cast`/`roles`/`looks`/`crowd`/all lines).
- `cast` — any number of puppets; 4–5 are drawn smaller (`CAST_SCALE` in `Joke.tsx`), from 6 (`WIDE_FROM`) the stage is wider than the frame (`stageGeometry` → `stageW`, backdrop scaled up around the floor line) and the auto camera pans along it.
- `looks` — costume for this episode: puppet → `LookPatch` (`add`/`remove` accessories, `clothes`, `hair`, `hairStyle`) applied on top of the role costume (`lookForRole(c, role, patch)`). Blind pilots = `add: ["dark-glasses"]` + `cane` prop.
- `crowd` — `{who, size: few|many}`: a silent back row of dimmed, smaller figures built from existing puppets (`remotion/src/world/Crowd.tsx`; pupils/children → kids). Reacts on `{type:"crowd", react: scream|gasp|laugh|cheer|murmur|calm}` beats (animation; sound if `content/audio.json` has an sfx `crowd-<react>`).
- `lines[].offscreen: true` — a voice from off screen (genie in a bottle, behind the door, from above, invisible man): the speaker must be in the scene `cast` for the voice, is never shown unless it also walks in/moves; captions in italics.
- `split: {location, place?, cast}` — split screen for a phone call between two places: top half = the scene's location with the rest of the cast, bottom half = `split.location` with `split.cast`, captions in the band between (`SPLIT` in `Joke.tsx`), each half has its own auto camera.
- `looks` also patches `build` (portly = big belly) and `skin` (grey = statue).
Beats:
  - `{type:"line", ref:"l3"}` — every line exactly once, in order;
  - `{type:"move", who, to: <mark>|"off-left"|"off-right", from?: "off-left"|"off-right"}` — before the first line of a scene = starting position (no walking); later = a visible walk; `from` = walk in from outside;
  - `{type:"prop", who, item, action: "hold"|"give"|"drop"|"put", to?}` — items from `content/props.json`, drawn in the right hand (`remotion/src/props/Props.tsx`);
  - `{type:"camera", shot: "wide"|"group"|"two"|"close", on?}` — overrides the auto director until the next camera beat;
  - `{type:"sfx", id}` (clip kind `sfx` in `content/audio.json`), `{type:"pause", sec}`.
  - `transition` before a scene: `cut`, `wipe` (time skip, same building), `flyover` (camera flies over the town map to the next building).
- Validation: `sceneProblems` in `packages/core/src/index.ts` (speakers on stage, marks and props exist, lines once and in order; no scene limit). The `script` stage runs it in `pnpm llm check script`.
- Example: `content/episodes/test-scenes.ru.json` (two scenes, walk-in at the door, flowers handed over, wipe to the bar).

## Auto director (`director/camera.ts`)
Wide on scene start, narrator lines and crowd reactions; two-shot in dialogue (speaker + the previous speaker, else the nearest listener); group shot when 3+ others are on stage (speaker, addressee, nearest; zooms out if they stand far apart); close-up with a slow push-in on the punchline; wide on the outro laughs. Puppets standing too close are pushed apart (`stageGeometry` in `Joke.tsx`). Tune constants there, not per episode.

## Town and compilations
- Map: `remotion/src/world/TownMap.tsx` (icons by building `type`), preview `npx remotion still src/index.ts Town out.png`. A building's `places` decide which scenes fly to it (`buildingFor(location, place)` in `world/town.ts`).
- Compilation: `pnpm compile --locale ru --size 3 [--voiced]` (popular, different backdrops, not used before) or `--episodes a,b,c`; `pnpm render --compilation <id>`; `pnpm posts plan --account ig-ru --kind compilation`. Layout: intro over the town (`TownIntro`) → episodes → flyover between them (`Flyover`), next joke starts while the map still covers the frame.

## New place without code (kit)
1. `content/locations/<id>.json`: `name`, `palette`, `marks` (x as 0..1 of width), `kit: { base: "room"|"outdoor", sky?, ground?, horizon?, items: [{part, x, y?, w?, h?, r?, s?, color?, color2?, kind?, night?, items?, d?}] }`, `bible` (summary, canonical `roles` it covers, prompt). Parts: window, door, shelf, lamp, table, plant, tree, fence, picture, rug, cloud, rect, circle, path (SVG `d`). Canvas 1080×1920, floor at y=1190; keep the floor band calm for puppets, subtitles below y≈1250.
2. Add a building to `content/world/town.json` (and an icon `type` in `TownMap.tsx` if none fits).
3. `pnpm registry`, check `npx remotion still src/index.ts Locations out.png --props='{"only":["<id>"]}'`, `pnpm catalog` (coverage).
Examples: `sud` (courtroom), `banya` (sauna), `plyazh` (beach). Hand-drawn backdrops (`remotion/src/backdrops/<id>.tsx`, see **jokes-draw**) win over `kit` when both exist.

## New prop
Add a `case` in `remotion/src/props/Props.tsx` (hand at (0,0), flat shapes) and a row in `content/props.json` (ru/en/de names) — writers see it via `context.md`.
