---
name: jokes-cast
description: Customize the puppet cast and backdrops — add a puppet, a double (same rig, different hair/clothes), a role costume variant, a stereotype accessory, or a backdrop; remap canonical roles; check coverage of the joke base and render the cast lineup. Use for any change to characters, their looks, costumes, roles or locations.
---

# Puppets, doubles, variants, backdrops

## Model (read before editing)
- **Raw archetype** (from annotation) → **canonical role** via `data/llm/canon/characters.out.json` (`map`, `canon` with group/folk). Locations: `data/llm/canon/locations.out.json`. Validate: `pnpm canon check characters|locations`.
- **Puppet** = what gets drawn: `content/characters/<id>.json` (`Character` schema in `packages/core/src/index.ts`).
  - `look`: kind (man, woman, boy, girl, old-man, old-woman, dog, cat, bird, cow, horse, bear, hare, devil…), skin, clothes, accent, hair, hairStyle (short, bald, fringe, long, bun, pigtails, perm, curly, none), `accessories` (stereotype details).
  - `bible.roles`: canonical roles this puppet plays. **Each role belongs to exactly one puppet.**
  - `bible.variants[]`: `{roles, change, look: {clothes?, accent?, hair?, hairStyle?, add[], remove[]}}` — costume per role, same puppet.
  - `family`: set on a **double** (same rig as the base puppet, different hair/clothes). A scene may contain as many roles of a family as the family has puppets.
- **Backdrop**: `content/locations/<id>.json`, `bible.roles` = canonical locations it covers, `bible.variants` for sub-places.
- Global art style: `content/style.json`.
- Accessories are drawn by `remotion/src/components/Puppet.tsx` (`Accessory` switch). Existing ids include: beard, white-beard, goatee, stubble, mustache, mustache-curled, side-curls, glasses, round-glasses, cat-eye-glasses, dark-glasses, monocle, eye-mask, freckles, red-nose, mole, lipstick, earrings, flat-cap, police-cap, army-cap, helmet, shako, papakha, chef-hat, nurse-cap, crown, halo, horns, kippah, black-hat, bowler, cowboy-hat, beret, tyrolean-hat, aerodrome-cap, straw-hat, headscarf, curlers, turban, hood, zucchetto, nun-veil, bows, headset, cowlick, cross, tie, bow-tie, gold-chain, stethoscope, apron, towel, brooch, badge, striped-shirt, loot-bag, camera, collar, robe-white/red/black, keys, scythe, baguette, suspenders. A new accessory = a new `case` there (SVG in the 300×420 puppet box; front-of-body ids go into `FRONT`).

## Typical changes
- **Stereotype detail for a role** ("priest needs a cross", "barman needs a beard"): add to the puppet's `look.accessories` if it is always true, or to the role's variant `look.add` if only for that role.
- **New puppet for missing roles**: pick roles from the catalog line "Чаще всего не хватает одной роли", create the JSON (copy a similar puppet), move those roles out of any other puppet.
- **Double for scene conflicts**: catalog lines "конфликт" / "Частые конфликты" show pairs like `everyman+neighbor (muzhik)`. Create `<base>-<suffix>.json` with `"family": "<base>"`, different hair colour/style and clothes, and give it the conflicting secondary roles (neighbor, friend…). Doubles are also how hair-colour jokes work (blonde = `devushka-blondinka`).
- **Backdrop**: add `content/locations/<id>.json` with `bible.roles` from the location canon.

## After every change
```bash
pnpm registry                 # regenerate remotion/src/registry.generated.ts
pnpm typecheck
pnpm catalog                  # coverage section in docs/catalog-report.md
cd remotion && npx remotion still src/index.ts Cast ../renders/cast.png   # lineup of all puppets
pnpm art shots                # refresh ComfyUI shot queues
```
Use a quick Python check that every `bible.roles` entry exists in the canon and no role is listed twice. Look at `renders/cast.png` before reporting. Report coverage numbers ("ставится целиком", pool) and remaining conflicts.

## Rules
- Folk heroes get an original design; never copy film/cartoon looks (no Cheburashka/Soyuzmultfilm designs, no celebrity likeness). National stereotypes = costume cues (beret, tyrolean hat), not facial caricature.
- Localised names per language (`name.ru/en/de`); one puppet can carry different local folk names (Vovochka / Johnny / Fritzchen).
