---
name: jokes-sources
description: Add a new joke source (Hugging Face dataset, API, Reddit via Arctic Shift, website dump) or a new language to the joke base, with license notes, popularity signal and quotas. Use when the user wants more jokes, another dataset, another subreddit or another language.
---

# Adding a joke source

## Before coding
- Find the source and record: size, format, **license**, popularity signal (votes/score), offensive share. Prefer CC-BY / ODC-BY / MIT / Apache. Note research-only licenses to the user (monetised videos).
- Hugging Face: check `https://huggingface.co/api/datasets/<id>/parquet` (auto-parquet) or `/tree/main` for a parquet file (`repoFile`). Viewer-disabled datasets still work via `resolve/main/<path>`.
- Reddit: Arctic Shift `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=X&limit=100&sort=desc&fields=id,title,selftext,score,created_utc,over_18` (no `permalink` field; paginate with `before=<created_utc>`; retry on "Timeout" with backoff, ~1 req/s).
- Downloads go to `data/raw/` (git-ignored). Tell the user the file and size before large downloads.

## Code
1. `pipeline/src/ingest/sources.ts`: add a `Source` (`id`, `lang`, `license`, `fetch()` returning `RawJoke[]` with a stable `id` prefix like `en-x-…`, `kind`, cleaned `text`, numeric `score`, `sourceRef`). Reuse `readHf`, `joinReddit`, `unwrapAnekdot`, `arcticSource`.
2. Add it to `SOURCES` and set its share in `QUOTAS` (per-language total ~2000).
3. New language: add it to `Locale` in `packages/core/src/index.ts`, names in all puppet/backdrop/canon JSONs (`name.<lang>`), and the prompts' language lists.

## Run
```bash
pnpm jokes ingest --source <id>
pnpm jokes select            # prints taken/rejected per source; check min score and reject reasons
```
Look at 10 random selected texts per source (meta posts, broken line breaks, signatures) and extend `clean()` / `rejectReason()` in `pipeline/src/jokes.ts` if needed. Then annotate the new jokes with **jokes-annotate** (`pnpm llm prepare analyze` only picks unannotated ids).
