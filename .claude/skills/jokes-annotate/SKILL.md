---
name: jokes-annotate
description: Build or extend the joke base and annotate it (analyze stage) — select top jokes, annotate characters/locations/translatability/flags with subagents, review exclude consistency, rebuild the catalog report. Use when the user asks to annotate jokes, grow the base, re-run analysis, or get fresh statistics on characters, locations and translatability.
---

# Annotating jokes

## State (check first)
```bash
wc -l data/jokes/*.jsonl                 # selected jokes per language
pnpm llm status analyze                  # annotation progress
```
`data/llm/analyze/results.jsonl` holds one `JokeAnalysis` per joke (schema in `packages/core/src/index.ts`). The prompt is `pipeline/prompts/analyze.md` — it encodes many clarified rules (exclude, real-person, ethnic, religion, dark, [N jokes], first-person = everyman). Read it before changing anything.

## Grow or rebuild the base
1. `pnpm jokes ingest [--source id]` — downloads into `data/raw/` (outside git). Sources and quotas: `pipeline/src/ingest/sources.ts` (`SOURCES`, `QUOTAS`). For a new source use the **jokes-sources** skill.
2. `pnpm jokes select` — cleanup, dedupe, top-N per language → `data/jokes/<lang>.jsonl`. Ids are stable (hash or source id), so existing annotations stay valid.
3. Report the per-source line it prints (taken / rejected reasons / min score) to the user.

## Annotate
1. `pnpm llm prepare analyze [--per-lang N] [--lang xx]` — only not-yet-annotated jokes.
2. Run batches with the **llm-batch-run** skill (rolling 10 agents, `check`, then `collect`).
3. Consistency review for the `exclude` flag (sexual content involving minors etc.): select rows with `sexual` flag + child-like role (child, vovochka, fritzchen, son, daughter, student, teen…) or bestiality hints in `gist`, without `exclude`; send to review agents with the rule from analyze.md; patch decisions into the `.out.jsonl` files; `pnpm llm collect analyze`.
4. `pnpm canon check characters` / `locations` — if new raw archetype ids appeared, extend `data/llm/canon/*.out.json` (see **jokes-cast**), otherwise new ids fall through un-merged.
5. `pnpm catalog` → `docs/catalog-report.md`: forms, flags, top roles and locations, coverage by puppets, folk heroes, translatability matrix, safe video pool.

## Reading the report for the user
- Translatability: ru/de jokes translate well (≈70–80% translate), English ≈40% skip because of puns.
- "Safe pool" = videoFit ≥ 4, funny ≥ 4, no sexual/ethnic/political/real-person/homophobia/drugs/exclude — the default source for scripts.
- Always state the exclude count and that it is a strict filter.

## Gotchas
- Never let agents run `collect`.
- German has no ready dataset: r/Witze via Arctic Shift (slow API: retry with backoff, field list without `permalink`).
- Reddit text = title + body; titles are often setups. Meta posts and "Edit:" lines are filtered in `jokes.ts`.
- Retellings of one joke are not caught by text dedupe; use `gist` similarity (planned canon step).
