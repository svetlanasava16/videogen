---
name: jokes-publish
description: Render episodes, plan and push posts to social platforms through Postiz (YouTube Shorts, TikTok, Instagram Reels/Stories, Threads, later X and VK), sync statuses and pull metrics into the ANEK. database; set up or troubleshoot the local Postgres/Postiz stack. Use when the user asks to render videos, schedule or publish posts, connect accounts, check what was posted where, or see likes/views/reposts.
---

# Rendering, publishing and metrics (ANEK.)

Content lives in git; the Postgres database (`anek-db`, `packages/db`) holds a copy of it plus everything operational: renders, posts, metrics. Postiz (self-hosted, `infra/`) does the actual posting; we drive it through its Public API. Setup checklist for the user: `docs/POSTIZ.md`.

## Stack
```bash
docker compose -f infra/docker-compose.yml up -d anek-db          # our DB (127.0.0.1:5433)
docker compose -f infra/docker-compose.yml --profile postiz --profile tunnel up -d   # Postiz + Temporal + tunnel (needs infra/.env)
pnpm db migrate && pnpm db sync      # schema + content from git (idempotent; run after any content change)
pnpm db status | pnpm db dump        # counts / pg_dump → data/backups/
```
Schema change: edit `packages/db/src/schema.ts`, then `cd packages/db && npx drizzle-kit generate --name <what>` and `pnpm db migrate`. Never edit applied migrations.

## Render
```bash
pnpm render --top 20 --locale ru     # most popular jokes without an up-to-date render
pnpm render <episodeId…> [--force]
```
Output `renders/<episodeId>/<contentHash>.mp4` + a row in `renders`. The hash covers the episode, `content/audio.json`, `content/disclosure.json` and `remotion/src`, so a re-run only renders what changed. ~10 s per episode on the M4. macOS: headless Chrome hangs while the display sleeps — `render` holds `caffeinate -d`; if a manual `npx remotion …` times out on "Waiting for root component", wake the screen.

## Manual Instagram posting (current mode: ig-ru, ig-en)
Voice-over comes from the other computer through git (**jokes-voice**). Then:
```bash
git pull && pnpm db sync
pnpm render --voiced --locale ru --top 30          # only fully voiced episodes; also writes <hash>.cover.jpg
pnpm posts plan --account ig-ru --per-day 2 --days 14 --dry-run   # check captions, then without --dry-run
pnpm board                                          # prints http://<mac>.local:4010/?t=<token> for the phone
```
- `posts plan` for video only takes renders with real voice (`--allow-silent` overrides — not for publishing).
- Phone, same Wi-Fi: open the link once (token is remembered). Per card: watch → «Скачать видео» (Files → Save Video) → «Скопировать подпись» → Instagram Reel, turn on the AI label in Advanced settings, paste caption, cover from «Обложка» → post → back in the card «Опубликовано» (+ link). Later, in «Опубликовано», type the numbers (views, likes, comments, shares, saves) → `post_metrics`; `pnpm metrics report`.
- Set a fixed `BOARD_TOKEN` in `.env` so the phone link survives restarts. The board must keep running only while posting.
- Account handles: `content/accounts.json` (`ig-ru`, `ig-en` active), then `pnpm db sync`.

## Publish via Postiz (later)
```bash
pnpm posts accounts                                  # Postiz integrations → content/accounts.json (by handle), then set active, pnpm db sync
pnpm posts plan --account yt-ru --per-day 2 --days 7 [--from 2026-12-01] [--kind video|story|text] --dry-run
pnpm posts plan … (without --dry-run)                # writes posts(state=planned)
pnpm posts push [--account yt-ru] [--limit 20] [--private] [--draft] [--dry-run]
pnpm posts sync                                      # state/url/errors back from Postiz
pnpm posts list [--account yt-ru]
```
- Accounts: one per platform × language in `content/accounts.json` (`yt-ru`, `tt-en`, `ig-de`, `th-ru`…). Threads/X default to `--kind text` (joke text, original wording for source-language jokes); video platforms need a render first.
- First runs on a new account: `--private` (YouTube private / TikTok SELF_ONLY) or `--draft`, check in the app, then public.
- Postiz limit: 30 created posts per hour → `--limit` ≤ 25 per push.
- Planner: slots spread over the audience's daytime (`AUDIENCE` in `pipeline/src/publish/captions.ts`) with ±25 min jitter; no repeated episode per account; avoids the same backdrop or lead character in consecutive posts (YouTube "inauthentic content" policy).

## Disclosure rules (do not weaken)
- Every caption ends with `content/disclosure.json` text for its language: AI voice, made by ANEK., fictional characters / coincidences, no intent to offend believers; translated jokes add the "translated with AI" line; last line is the rights notice (`rights`: © 2026 ANEK., all rights reserved). Rights stay clean only if every input is ours or licensed: code-drawn art, CC0 sound, paid ElevenLabs voice, retold (not copied) joke texts. The end card in the video repeats the short form; the ANEK. watermark stays on.
- AI flags: YouTube `made_with_ai` (→ containsSyntheticMedia), TikTok `video_made_with_ai` (→ is_aigc), X `made_with_ai`. Postiz has no AI field for Instagram/Threads — text only.
- Changing disclosure text: bump `version` in `content/disclosure.json` (stored per post as `disclosure_version`).
- Russian pool / VK: do not publish jokes mocking religious figures or sacred things (criminal art. 148 risk; a disclaimer does not protect). Add a `religious-target` label via **jokes-classify** before the first VK run. VK page > 10k subscribers must register with Roskomnadzor.
- X: account must show the "Automated" label; never post the same joke on several X accounts.

## Metrics
```bash
pnpm metrics pull      # per published post: views, likes, comments, shares, saves (snapshot rows in post_metrics) + followers per account
pnpm metrics report    # docs/metrics-report.md: top posts, by platform, language, backdrop, lead puppet
```
Schedule: `infra/launchd/com.anek.metrics.plist` (sync + pull + report every 6 h; install instructions inside — ask the user before loading it). VK has no analytics through Postiz.

## Useful SQL (`docker exec -it anek-db psql -U anek -d anek`)
- what went where: `select account_id, episode_id, state, scheduled_at, url from posts order by scheduled_at desc limit 50;`
- best jokes across platforms: `select e.joke_id, sum(m.views) from posts p join episodes e on e.id=p.episode_id join (select distinct on (post_id) * from post_metrics order by post_id, captured_at desc) m on m.post_id=p.id group by 1 order by 2 desc limit 20;`
