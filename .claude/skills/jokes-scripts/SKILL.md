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
2. Run batches with **llm-batch-run** (agents run `pnpm llm check script --batch …`; the check validates schema plus cast/backdrop ids, speakers in cast, stage directions, word limit).
3. `pnpm llm collect script` → `data/llm/script/results.jsonl`.
4. `pnpm llm materialize script` → `content/episodes/<jokeId>.<locale>.json` (`unfit` adaptations are skipped).
5. Preview: `cd remotion && npx remotion still src/index.ts Joke ../renders/<id>.png --frame=60 --props=../content/episodes/<id>.json`; full render: `npx remotion render src/index.ts Joke ../renders/<id>.mp4 --props=…`. Look at a few stills (narrator jokes, translations) before reporting.

## Quality review (do this on a sample, not all)
- Punchline last; no label/stage directions; numbers as words; under the word limit.
- Translations sound native; `reworked` puns actually work; `unfit` count per direction (report it — it answers "is translating worth it").
- Narrator only where needed; a character delivers the punchline.
- Cast: no puppet twice; doubles used for two men/two women; `roles` set so costumes match (priest with cross, new-russian with gold chain).

## Custom requests
- Specific joke: find its id in `data/jokes/<lang>.jsonl` (grep the text), then create a one-item batch: `pnpm llm prepare script` only picks pool jokes, so for outside-pool jokes write the input line by hand into a new `batch-NNNN.in.jsonl` (same fields as existing batches; `suggestedCast` from `castScene`).
- Different tone or length: adjust `pipeline/prompts/script.md` (keep the output format) and re-run on a pilot.
- Missing puppet for a joke: use **jokes-cast** first.
