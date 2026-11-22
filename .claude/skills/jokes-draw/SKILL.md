---
name: jokes-draw
description: Draw and animate in code — vector SVG puppets (rig, poses, gestures, faces, accessories, new figure kinds) and backdrops (new location or variant) in Remotion, then verify with Cast / Locations / Joke stills and a video render. Use for any visual change: how a character looks or moves, a new prop, a new scene or scene variant. No ComfyUI or image generation.
---

# Drawing puppets and backdrops in code

Everything visual is React SVG in `remotion/`. Style: flat rounded shapes, no outlines, warm limited palette (`content/style.json`), big heads, stereotype details as accessories. Look at `renders/cast.png` and `renders/locations.png` before drawing to stay consistent.

## Puppet rig — `remotion/src/puppet/`
- `Rig.tsx` — assembles the figure in a 300×600 box, feet on y=585: legs (walk cycle), body by `look.build` (slim, average, stocky, portly, child), arms (poses), head (tilt), robes (`robe-*` accessories become a long robe). Front-of-body accessories are clipped to the body shape.
- `Face.tsx` — eyes (blink, squint for angry/smug, round for surprised), brows per emotion, mouth: talking (open 0..1) or an emotion shape.
- `motion.ts` — `BUILDS` sizes, `blink`, `mouthOpen`, `armAngles` (emotion poses + speaking gesture + walking swing), `legAngles`, `bodyBob`. Change behaviour here, not in Rig.
- **Wardrobe is data:** hair styles, accessories and uniforms live in `content/wardrobe/*.json` (schema `WardrobeItem` in core), drawn by `wardrobe.tsx` from a primitive library (`expr.ts` evaluates expressions over body sizes: `bx, w, top, bottom, legH, h, L, R, iw, c`). Head box: centre (150,160), radii 76×82; body starts at y=230. New item = a JSON entry with `slot` (head-back | hair | face | head | hat | torso | hand | rig), `draw` shapes, optional `outfit` (sleeves/trousers/cuffs/boards), `rig` effects, `layer`, `clip`, `wear`; then `pnpm registry`. Only a genuinely new shape needs a new primitive in `wardrobe.tsx`. Check the sheet `npx remotion still src/index.ts Outfits out.png --props='{"mode":"wardrobe"}'` and `pnpm validate`.
- `Accessories.tsx` keeps only shared helpers (figure kinds, default hair, build, skin-dependent colours, the ghost sheet).
- New figure kind (e.g. `pig`): add it to `ANIMALS` if non-human, draw ears/snout in the head block of `Rig.tsx`, pick `build`.
- Use on a puppet: edit `content/characters/<id>.json` (`look.kind`, `look.build`, `look.accessories`, role variants `bible.variants[].look`). See **jokes-cast** for roles and doubles.

## Backdrops — `remotion/src/backdrops/`
- `parts.tsx` — canvas 1080×1920, `FLOOR_Y = 1190` (the wall line = feet of the back plane), primitives: Room, Outdoor, Window, Door, Shelf, HangingLamp, Table, Plant, Cloud, Tree, Fence, Picture, Rug. Narrator caption y 150…420, character subtitles from y≈1380 (72 %).
- **Depth** (`remotion/src/world/depth.ts`): puppets stand on three planes — back z=1 (feet 1190, ×0.8), mid z=0.5 (≈1275, ×1.0), front z=0 (≈1360, ×1.2). The floor below 1190 must stay walkable; furniture against the wall belongs to the back plane.
- One file per backdrop id (`gostinaya.tsx`, `bar.tsx`…), signature `({ palette, variant }: BackdropProps)`. `variant` = the sub-location id (`bible.variants[].id`, resolved from `scene.place` by id or roles in `components/Background.tsx`); unknown → default view.
- **Rooms (sub-locations):** each variant in `content/locations/<id>.json` has `id`, `name {ru,en,de}`, `roles`, `change` (a sentence listing what is visible and where — writers only see this), its own `marks`. A mark is `x` (0..1) or `{x, z, seat}`; seat = chair|bench|couch|stool|armchair|car-seat|pilot-seat|bed.
- **Seats:** draw a seat's top surface at `seatTopY(z)` centred on the mark x, ~140×`depthScale(z)` px per sitter; one mark per sitting spot (bench-1, bench-2). Give every place back, mid and front marks (front-left/front-center/front-right) so people can stand in front of seated ones. "Behind the counter" = a front layer (below); in a place without one, a `set` piece (counter, desk). Shared seat helpers: `SeatAt`/`BenchAt`/`SofaAt` (`backdrops/gostinaya.tsx`), `SeatFront`/`persp` (`backdrops/samolet.tsx`).
- **Front layer and surfaces:** a counter in front of staff goes into `layer === "front"` of the backdrop (location/variant `front: {z}`), staff marks behind it (z≈0.95), customers in front (z 0.5); counter tops as `surfaces` so put-down props land there. **Signs:** universal ones in English in the drawing (EXIT, WC, BAR…), place-specific ones via `useSign()` keys in `content/signs/<location>.json` (ru/en/de) — never hard-code Cyrillic.
- Check marks against the drawing: `npx remotion still src/index.ts Locations out.png --props='{"only":["bolnitsa"],"marks":true}'` — pink circle = feet on the mark, pink bar = seat top.
- New backdrop: create `content/locations/<id>.json` (name, palette, props, bible.roles = canonical locations it covers, variants), create `remotion/src/backdrops/<id>.tsx`, add it to `remotion/src/backdrops/index.ts`, run `pnpm registry`.

## Reference location: the bar (template for every place)
The bar (`content/locations/bar.json` + `remotion/src/backdrops/bar.tsx`, variants `hotel`, `restaurant`, `party`) is the finished example. When you redo or add a place, give it the same seven things, in this order, and check each on frames:
1. **Layers.** `layer === "back"`: wall, shelves, lamps, everything behind people. `layer === "front"`: only what stands between camera and staff (counter, shop counter, reception desk, judge's bench), drawn from its top edge down. Front z in the JSON (`front: {"z": 0.8}`, per variant if it differs; a variant without a counter has no `front`).
2. **Marks on three planes.** Staff behind the front layer at z 0.95 (`behind-counter`, `behind-left/right`); guests mid z 0.5 (seats and `left/center/right`); front z 0 (`front-left/center/right`) so someone can stand before seated people. Give marks to every spot a joke names (door, window, table).
3. **Seats.** One mark per sitting spot with `seat` (stool-1…4, chair-1…4); draw the seat top at `seatTopY(z)` under the mark x.
4. **Surfaces.** Counter and table tops as `surfaces: [{x0, x1, z, top}]` so money, glasses and keys land on them.
5. **Slots.** `slots` = where people with no mark stand, in priority order: the role spot first (`{"mark": "behind-counter", "roles": ["bartender", "waiter"]}`), then seats from the middle outwards (stool-2, stool-3, stool-1, stool-4), then front marks. Each variant has its own list. Rules: `docs/ENGINE.md` §6б.
6. **Signs.** Universal ones in English in the drawing (BAR, EXIT); place-specific ones via `useSign()` keys in `content/signs/<location>.json` (bar: beer, menu, reception) in ru/en/de.
7. **Check frames.**
   - `Locations --props='{"only":["bar"],"marks":true}'`: pink circles sit on the drawn floor/seat, the counter covers staff at the waist.
   - `pnpm stills <episode>` on 2–3 old unmarked episodes of the place: staff behind the counter, guests on seats, nobody's face covered.
   - `pnpm golden:docker`: every changed debug episode, before and after.

## Puppet actions (acts)
Poses for `act` beats are numbers in `remotion/src/puppet/acts.ts` (`ACT_POSES`: arm/leg angles, drop, lean, head, face, effects); `Rig.tsx` only draws them. Layers: sitting (`seated`) → held state (`base`) → gesture (`act`) → flinch. New act = id in `ACTS` (core) + a pose function; check the sheet `npx remotion still src/index.ts Acts out.png --props='{"who":"muzhik"}'`.

## Vehicles
`remotion/src/world/Vehicles.tsx`: side view, origin = bottom centre on the floor, facing right, scale 1 = mid plane. `VEHICLE_SPECS[kind]` = size, rider seats `{dx, dy, s}` (driver first; dx = puppet box centre), `open` (rider on top) or windowed, `door`, `driveSec`. `VehicleArt part="back"` (interior) → riders → `part="front"` (body with window holes / handlebar). Sheet: `npx remotion still src/index.ts Vehicles out.png`.

## Staging
`remotion/src/timeline.ts` turns beats into moves, acts, drives and rides (see **jokes-engine** / `docs/ENGINE.md`); `remotion/src/Joke.tsx` (`stageGeometry`) places puppets by x and depth z, seats them, draws everything sorted by plane.

## Sound — laughs and music
- Library: `content/audio.json` (id, kind laugh|music, intensity chuckle|laugh|big or mood, file, duration, source, author, license) + files in `remotion/public/audio/{laughs,music}/`. CC0 / free licences only (Freesound with the CC0 filter, Pixabay Music); the user downloads, you import:
  `pnpm audio add <file> --kind laugh --intensity big --source <url> --author <name> --license CC0` (or `--kind music --mood quirky [--start 3 --max 75]`). It normalises loudness (laugh −18 LUFS, music −23 LUFS), trims (laugh ≤ 4 s, music ≤ 90 s) and writes mp3. `pnpm audio list`.
- Placement: `lines[].laugh` (chuckle | laugh | big); with no marks the renderer puts `big` after the last line. `timeline.ts` lets ~60 % of the laugh play in the pause; `Episode.music` picks a track ("none" = silent), otherwise a stable choice by episode id.
- Mix: `remotion/src/components/Soundtrack.tsx` — laughs 0.7; music 0.10, ducked to 0.05 under speech, 0.5 s fades. Branding: `components/Branding.tsx` (ANEK. corner watermark only; no end card — the user does not want one). Outro: `Episode.outroLaughs` — every puppet still on stage laughs in its own voice after the punchline (generated by `pnpm voice run`, model `laughModel`); the puppet gets a laughing face (squint + open smile). Without outro laughs the library laugh track plays after the punchline. Mouth moves only while a word is sounding (word timings), not for the whole line.

## Verify (always look at the images)
```bash
pnpm typecheck && pnpm registry
cd remotion
npx remotion still src/index.ts Cast ../renders/cast.png
npx remotion still src/index.ts Locations ../renders/locations.png [--props='{"only":["bar"]}']
npx remotion still src/index.ts Joke ../renders/x.png --frame=40 --props=../content/episodes/<id>.json
npx remotion render src/index.ts Joke ../renders/x.mp4 --props=../content/episodes/<id>.json
```
`content/episodes/test-enter.ru.json` is a ready staging test (patient walks in, then out). Check: puppets don't blend into the wall colour (variant clothes vs backdrop palette), feet on their plane, seated puppets on the drawn seat, accessories sit on the body for every build.

## Engine v2 additions
Camera (`remotion/src/director/camera.ts`), location `marks`, hand props (`remotion/src/props/Props.tsx`), the town map (`remotion/src/world/TownMap.tsx`) and data-only backdrops (`kit`, `remotion/src/backdrops/Kit.tsx`) — see **jokes-engine**.
