# Stage: canon

We annotated ~5800 jokes (Russian, English, German). Each annotator picked kebab-case archetype ids for characters and locations; ids are inconsistent across batches (synonyms, spellings, overly specific variants). Your job: map every raw id to a canonical id.

## Input
`characters.in.jsonl` or `locations.in.jsonl`: one raw id per line, sorted by weighted frequency, with `n` (jokes), `langs`, and examples (`names` as written in jokes, `looks`, or `props`).

## Output
Write one JSON object (not JSONL) to the `.out.json` file:

```json
{
  "canon": [
    {"id": "everyman", "names": {"ru": "мужик", "en": "guy", "de": "Typ"}, "group": "adult-man", "folk": false, "note": "generic ordinary man"}
  ],
  "map": {"everyman": "everyman", "guy": "everyman", "man": "everyman"}
}
```

- `map` must contain EVERY raw id from the input exactly once (as a key). Values are canonical ids from `canon`.
- `canon` lists each canonical id once, with names in ru/en/de (what a native speaker calls this type), `group`, `folk`, and a short English `note`.

### Characters
- Merge true synonyms, spelling variants and over-specific variants that play the same role: `guy`/`man`/`bloke` → `everyman`; `old-jewish-man` → `rabinovich` only if the jokes use him as the Rabinovich type, else `old-man`; `drunk-man`/`drunkard` → `drunk`; `pupil`/`schoolboy` → `schoolkid`.
- Keep roles separate when the joke function differs even if they would look alike: `husband`, `father`, `patient`, `customer` stay separate roles (one puppet may later play several roles; that is decided in the next stage).
- Keep recurring folk characters as their own canonical ids: vovochka, rabinovich, stirlitz, chukchi, petka, vasily-ivanovich, new-russian, rzhevsky, ded-moroz, fritzchen, ostfriese, blonde, mother-in-law. `folk: true` for those and for stock fairy-tale figures (goldfish, genie, death, devil, saint-peter, god, baba-yaga, kolobok...).
- Rare one-off ids (n = 1–2) should usually fold into a broader canonical role (`zoo-director` → `boss`; `croupier` → `employee`; `tattoo-artist` → `craftsman`), unless they are a distinct visual type that recurs in the data (animals stay animals: `hedgehog` → `hedgehog` is fine, but `missile`, `toothpick` → `object`).
- `group` is one of: `adult-man`, `adult-woman`, `elderly-man`, `elderly-woman`, `child`, `teen`, `animal`, `supernatural`, `object`, `crowd`.
- Aim for roughly 120–180 canonical character ids.

### Locations
- Merge synonyms and over-specific places: `home-living-room`/`living-room`/`apartment` → `home-living-room`; `doctor-office`/`clinic`/`psychiatrist-office` → `doctor-office`; `pub`/`bar`/`kneipe` → `bar`.
- `group` is one of: `home`, `public-indoor`, `work`, `outdoor-city`, `outdoor-nature`, `transport`, `fantasy`, `none`. Keep `none` as `none`.
- Aim for roughly 50–70 canonical locations.

Work through the whole list; do not skip rare ids.
