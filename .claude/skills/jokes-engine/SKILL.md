---
name: jokes-engine
description: The ANEK. engine — scenes as data (beats run in parallel with speech, puppet actions, depth planes, places with rooms, seats, vehicles, marks, props, camera, transitions), the town of Jokeville (map, buildings, flyovers), compilations of several jokes, and new places made from data (kit backdrops). Use when the user wants multi-scene episodes, staging (walk to a spot, sit, slap, drive in, pass in front), camera behaviour, a new room or vehicle, compilations/transitions between videos, a new place in the town, or asks how the engine works and how to extend it without new code.
---

# ANEK. engine

**Full reference (Russian, with JSON examples): `docs/ENGINE.md`** — read it first; this skill is the short version.

## Feedback loop (use it after every engine or episode change)
`pnpm validate [--debug|<id>]` (schema + references, 0 errors expected), `pnpm stills <id>|--debug` (key frames + contact sheet in out/stills — look at them), `pnpm golden [--update]` (reference frames of content/debug-set.json in tests/golden; run before every engine commit). Report of stage 1: docs/reports/stage-1/README.md; roadmap: docs/ROADMAP.md.

## Live staging (current rules)
- **Rhythm:** only speech and `pause` move time. Every other beat placed before a line starts together with it (the narrator says "they walk in" — they walk in now). Gaps 0.08 s, 0.25 s before the punchline; mp3 silence trimmed by word timings.
- **Acts:** `{type:"act", who, act, to?, sec?}` — 39 actions (`ACTS` in core, poses in `remotion/src/puppet/acts.ts`, sheet `Acts`). States (sit, kneel, lie, cover-ears…) hold; gestures play on top; target acts walk up to `to`, the target flinches.
- **Depth planes** (`remotion/src/world/depth.ts`): z=1 back (feet 1190, ×0.8), 0.5 mid (≈1275, ×1.0, default), 0 front (≈1360, ×1.2). Marks carry z; `move.plane` overrides; walkers crossing people on their plane pass in front (`via: "back"` — behind). Puppets, set pieces and vehicles are drawn sorted by z; push-apart only within a plane.
- **Places (sub-locations):** `content/locations/<id>.json → bible.variants[] {id, name, roles, change, marks, set, crowd}`; `scene.place` = variant id (old archetype values still resolve through `roles`); a place's marks replace the location's. Writers see them in `context.md`.
- **Seats:** a mark `{x, z, seat}` — a puppet there sits by itself; `act stand`/walking gets up; seat furniture `chair|stool|armchair|bench|row-of-chairs` in `set`. Backdrops draw seats at `seatTopY(z)`.
- **Vehicles outside:** `scene.vehicles [{id, kind, at?, riders?, plane?, facing?}]` + beats `drive {vehicle, to, from?}`, `board {who, vehicle}`, `alight {who, vehicle, to?}` (`remotion/src/world/Vehicles.tsx`, sheet `Vehicles`). Inside a vehicle = a place (`doroga:car|taxi|bus|tram|subway`, `samolet:cabin|cockpit`).

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
- `crowd` — `{who, size: few|many, at?: back|front}` (`front` = audience silhouettes in the seats seen from behind, `CrowdFront`): a silent back row of dimmed, smaller figures built from existing puppets (`remotion/src/world/Crowd.tsx`; pupils/children → kids). Reacts on `{type:"crowd", react: scream|gasp|laugh|cheer|murmur|calm}` beats (animation; sound if `content/audio.json` has an sfx `crowd-<react>`).
- `lines[].offscreen: true` — a voice from off screen (genie in a bottle, behind the door, from above, invisible man): the speaker must be in the scene `cast` for the voice, is never shown unless it also walks in/moves; captions in italics.
- `split: {location, place?, cast}` — split screen for a phone call between two places: top half = the scene's location with the rest of the cast, bottom half = `split.location` with `split.cast`, captions in the band between (`SPLIT` in `Joke.tsx`), each half has its own auto camera.
- `set: [{item, at?, size?}]` — furniture on stage (`remotion/src/world/SetPieces.tsx`, ids in `SET_ITEMS` in core): dining-table, table, desk, counter, lectern in front of the puppets (hide their legs), sofa, bed, christmas-tree behind; scaled to the puppets' size, `at` = mark or left/center/right. New piece = a `case` in `SetPieces.tsx` + id in `SET_ITEMS`.
- `looks` also patches `build` (portly = big belly) and `skin` (grey = statue).
Beats:
  - `{type:"line", ref:"l3"}` — every line exactly once, in order;
  - `{type:"move", who, to: <mark>|"off-left"|"off-right", from?: "off-left"|"off-right"}` — before the first line of a scene = starting position (no walking); later = a visible walk; `from` = walk in from outside;
  - `{type:"prop", who, item, action: "hold"|"give"|"drop"|"put", to?}` — items from `content/props.json`, drawn in the right hand (`remotion/src/props/Props.tsx`);
  - `{type:"camera", shot: "wide"|"group"|"two"|"close", on?}` — overrides the auto director until the next camera beat;
  - `{type:"sfx", id}` (clip kind `sfx` in `content/audio.json`), `{type:"pause", sec}`;
  - `{type:"act", …}`, `{type:"shake", sec, strength}`, `{type:"crowd", react}`, `{type:"drive"|"board"|"alight", …}` — see Live staging above;
  - `move` also takes `plane` (back|mid|front) and `via` (front|back).
  - `transition` before a scene: `cut`, `wipe` (time skip, same building), `flyover` (camera flies over the town map to the next building).
- Validation: `sceneProblems` in `packages/core/src/index.ts` (speakers on stage, marks and props exist, lines once and in order; no scene limit). The `script` stage runs it in `pnpm llm check script`.
- Example: `content/episodes/test-scenes.ru.json` (two scenes, walk-in at the door, flowers handed over, wipe to the bar).

## Auto director (`director/camera.ts`)
Wide on scene start, narrator lines and crowd reactions; two-shot in dialogue (speaker + the previous speaker, else the nearest listener); group shot when 3+ others are on stage (speaker, addressee, nearest; zooms out if they stand far apart); close-up with a slow push-in on the punchline; wide on the outro laughs. Puppets standing too close are pushed apart (`stageGeometry` in `Joke.tsx`). Tune constants there, not per episode.

## Town and compilations
- Map: `remotion/src/world/TownMap.tsx` (icons by building `type`), preview `npx remotion still src/index.ts Town out.png`. A building's `places` decide which scenes fly to it (`buildingFor(location, place)` in `world/town.ts`).
- Compilation: `pnpm compile --locale ru --size 3 [--voiced]` (popular, different backdrops, not used before) or `--episodes a,b,c`; `pnpm render --compilation <id>`; `pnpm posts plan --account ig-ru --kind compilation`. Layout: intro over the town (`TownIntro`) → episodes → flyover between them (`Flyover`), next joke starts while the map still covers the frame.

## New room in an existing place
Add a variant with `id`, `name`, `roles`, `change` (what is visible and where — writers only see this), `marks` with `z`/`seat`; draw it in `remotion/src/backdrops/<id>.tsx` under `variant === "<id>"` (see **jokes-draw**); check `npx remotion still src/index.ts Locations out.png --props='{"only":["<id>"],"marks":true}'`; `pnpm registry`; add it to a building's `places` in `content/world/town.json`.

## New place without code (kit)
1. `content/locations/<id>.json`: `name`, `palette`, `marks` (x as 0..1 of width), `kit: { base: "room"|"outdoor", sky?, ground?, horizon?, items: [{part, x, y?, w?, h?, r?, s?, color?, color2?, kind?, night?, items?, d?}] }`, `bible` (summary, canonical `roles` it covers, prompt). Parts: window, door, shelf, lamp, table, plant, tree, fence, picture, rug, cloud, rect, circle, path (SVG `d`). Canvas 1080×1920, floor at y=1190; keep the floor band calm for puppets, subtitles below y≈1250.
2. Add a building to `content/world/town.json` (and an icon `type` in `TownMap.tsx` if none fits).
3. `pnpm registry`, check `npx remotion still src/index.ts Locations out.png --props='{"only":["<id>"]}'`, `pnpm catalog` (coverage).
Examples: `sud` (courtroom), `banya` (sauna), `plyazh` (beach). Hand-drawn backdrops (`remotion/src/backdrops/<id>.tsx`, see **jokes-draw**) win over `kit` when both exist.

## New prop
Add a `case` in `remotion/src/props/Props.tsx` (hand at (0,0), flat shapes) and a row in `content/props.json` (ru/en/de names) — writers see it via `context.md`.
