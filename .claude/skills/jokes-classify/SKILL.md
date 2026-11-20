---
name: jokes-classify
description: Add a new classification or label to already-annotated jokes (e.g. a new flag, topic, target audience, holiday tag, "works without narrator", platform suitability) or re-score a subset, without re-running the full analysis. Use when the user wants to classify, tag, filter or score jokes by a new criterion.
---

# New classification over existing annotations

Re-running the full `analyze` stage costs ~19M tokens. A new label usually needs only the joke text plus a few existing fields, so run a **narrow stage** instead.

## 1. Decide where the label lives
- **Small, general, permanent** (a new flag value): extend `JokeAnalysis` in `packages/core/src/index.ts` (enum values or optional fields only, so old rows stay valid) AND add the rule to `pipeline/prompts/analyze.md` so future annotation includes it.
- **Specific or experimental** (topics, holidays, audience, platform risk): a separate stage with its own schema and results file, joined by joke id. Prefer this.

## 2. Create the stage
In `pipeline/src/llm.ts` add to `STAGES`:
```ts
topics: {
  prompt: "pipeline/prompts/topics.md",
  output: z.object({ id: z.string(), topics: z.array(z.enum([...])), confidence: z.number().min(0).max(1) }),
  inputs: ({ perLang, lang }) => /* jokes (+ fields from analyze results) filtered to the subset that needs the label */,
},
```
Keep inputs lean: id, lang, text, and only the analysis fields the rule needs (gist, form, flags). Limit the subset (e.g. only the safe pool) when the label only matters there. Batch size can be larger (100) because outputs are short.

## 3. Write the prompt
`pipeline/prompts/<stage>.md`: purpose, input fields, output object example, a closed list of values with one-line definitions and borderline examples, "Process" section. Closed vocabularies keep 100+ batches consistent; leave an `other` value with a note field rather than free text.

## 4. Run
Pilot 1 batch per language → read agent remarks → fix prompt → full run with the **llm-batch-run** skill → `pnpm llm collect <stage>`.

## 5. Use it
- Add a section to `pipeline/src/catalog.ts` (counts per language, cross-tab with existing fields) and run `pnpm catalog`.
- If the label should filter scripts, add it to the `script` stage `inputs()` filter in `llm.ts` (see `RISKY`).

## Re-scoring a subset
To redo one field (e.g. `videoFit` for the German pool), make a stage whose output is `{id, videoFit}` and patch it into the analyze `.out.jsonl` files with a small script, then `pnpm llm collect analyze`. Never edit `results.jsonl` directly — it is rebuilt from the `.out.jsonl` files.
