---
name: jokes-scripts
description: Write video scripts (episodes) from annotated jokes in ru/en/de — pick jokes from the safe pool, prepare script batches with suggested cast and backdrop, write/translate/adapt with subagents, validate, materialize to content/episodes and render preview stills. Use when the user asks for scenarios, episodes, scripts, translations or adaptations of jokes.
---

# Writing scripts

## Inputs the stage uses
- Jokes + `analyze` results; filter in `pipeline/src/llm.ts` → `STAGES.script.inputs`: videoFit ≥ 4, funny ≥ 4, no `RISKY` flags, every on-screen role has a puppet (doubles resolve conflicts via `castScene` in `pipeline/src/cast.ts`), location covered by a backdrop or `none`. Sorted by popularity × funny.
- One task per (joke, locale): the source language (`mode: original`) plus every other language whose verdict is `translate` or `adapt`.
- Prompt: `pipeline/prompts/script.md`. Cast reference written at prepare time: `data/llm/script/context.md`.

## Procedure
1. `pnpm llm prepare script --per-lang N [--lang xx] [--size 20]` — N source jokes per language (each yields 1–3 tasks). Use `--size 20`: scripts are long outputs.
2. Run batches with **llm-batch-run** (agents run `pnpm llm check script --batch …`; the check validates schema plus cast/backdrop ids, speakers in cast, staging — `enter`/`exit`, nobody speaks off screen — stage directions, word limit).
3. `pnpm llm collect script` → `data/llm/script/results.jsonl`.
4. `pnpm llm materialize script` → `content/episodes/<jokeId>.<locale>.json` (`unfit` adaptations are skipped; `enter`/`exit` and the canonical location `place` — picks the backdrop variant — are carried over).
5. Preview: `cd remotion && npx remotion still src/index.ts Joke ../renders/<id>.png --frame=60 --props=../content/episodes/<id>.json`; full render: `npx remotion render src/index.ts Joke ../renders/<id>.mp4 --props=…`. Look at a few stills (narrator jokes, translations) before reporting.

## Original wording and swearing (user's top rule)
- `original` mode copies every spoken line from the source; only typos, numbers as words, splitting long lines, reported → direct speech, and cutting narration the picture shows are allowed. Translations go line by line. Paraphrase kills the joke.
- Tell the whole joke: every dialogue line and every step of an escalation; no word or scene limit — the video is as long as the joke; narration drops only what the picture shows.
- Two versions at once: `lines[].text` is clean (only swear words softened: нахер → нафиг, блядь → блин, fuck → freaking, Scheiße → Mist), `lines[].uncensored` holds the source words and is set only when it differs. `Episode.explicit: true` makes captions show `uncensored` (voice-over is generated from `text`).
- Check a batch: `python3` metric = share of dialogue words found in the source (old scripts: median 0.81; verbatim writer: 0.97–1.00). Compare lines to the source, not just the punchline.
- Rewriting existing scripts: put their ids into `data/llm/script/redo.txt`, then `prepare` takes them again and `collect` replaces the old version. Empty the file after the rewrite is collected.

## Everyone on screen, dressed for the joke
- Batch inputs carry `characters` from annotation (`role`, `looks`). The writer puts every speaker and silent character on screen (any number of puppets; 6+ get a wide stage with a panning camera), groups that only react go to `crowd`, and the look the joke depends on goes to `looks` (accessories listed in `context.md`, taken from `remotion/src/puppet/Accessories.tsx`).
- What we can't draw yet goes to `needs`. `pnpm llm needs script` → `data/llm/script/needs.md` (kind:id, how often, which episodes). Draw the frequent ones with **jokes-draw** / **jokes-cast** (new accessories, doubles, puppets — they are reused), then put those episode ids into `redo.txt` and run them again.
- Pilot on chosen jokes: `pnpm llm prepare script --per-lang 400 --size 30 --ids <jokeId,…>`.

## Quality review (do this on a sample, not all)
- Punchline last; no label/stage directions; numbers as words; under the word limit.
- Translations sound native; `reworked` puns actually work; `unfit` count per direction (report it — it answers "is translating worth it").
- Narrator only where needed; a character delivers the punchline.
- Staging: arrivals walk in on their first line (patient to the doctor, husband coming home), departures only when the joke needs them.
- Cast: no puppet twice; doubles used for two men/two women; `roles` set so costumes match (priest with cross, new-russian with gold chain). Nobody from the annotation (speaker/silent) is missing; the visible trait the punchline needs is on screen (blind → dark glasses + cane).

## Custom requests
- Specific joke: find its id in `data/jokes/<lang>.jsonl` (grep the text), then create a one-item batch: `pnpm llm prepare script` only picks pool jokes, so for outside-pool jokes write the input line by hand into a new `batch-NNNN.in.jsonl` (same fields as existing batches; `suggestedCast` from `castScene`).
- Different tone or length: adjust `pipeline/prompts/script.md` (keep the output format) and re-run on a pilot.
- Missing puppet for a joke: use **jokes-cast** first.

## Engine v2 (scenes)
Scripts may include `scenes` (several places, walking to marks, props, flyover/wipe transitions) — see **jokes-engine** for the format. The writer's reference `data/llm/script/context.md` is regenerated on `prepare` from `content/world/bible.md`, `town.json`, location marks and `content/props.json`. Use scenes only when they serve the joke; simple one-place dialogues stay without them. `--per-lang N` is a cumulative top (ranks 101–110 = `--per-lang 110`).
