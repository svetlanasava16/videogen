---
name: jokes-voice
description: Voice the episodes with ElevenLabs — cast voices for puppets and the narrator (ru/en/de) from the Voice Library, preview them, estimate credits, generate per-line speech with word timings into content/episodes, check for stale voice-over, then commit and push so the renders can be made on the other computer. Use when the user asks to voice, dub, cast voices, re-voice a line, or prepare audio for the next videos.
---

# Voice-over with ElevenLabs (ANEK.)

Division of work: **voice-over is done on this computer** (it has the ElevenLabs key), renders and posting happen on the other one. Everything travels through git: mp3 files in `remotion/public/audio/voice/<episodeId>/<lineId>.mp3` and timings in `content/episodes/<id>.json → lines[].audio`. The database is not needed here.

## First time
1. A **paid** ElevenLabs plan (Starter or Creator). The free plan has no commercial licence and requires attribution, so videos voiced on it cannot be published as ANEK.'s own.
2. The user puts the key into the root `.env` (never in git, never typed by you): `ELEVENLABS_API_KEY=…`.
3. `pnpm install`, then `pnpm voice cast --locale ru` to see who needs a voice.

## Casting (once per puppet × language)
A shortlist is ready: `content/casting.json` (per language: role → brief, candidates from the Voice Library, `pick` = chosen index) and `docs/CASTING.md` (same table with links that open the voice in the library to listen). Covers the 15 roles + narrator that speak in the top-30 episodes of each language = 30 voices = exactly the Creator plan's 30 slots.
```bash
pnpm voice casting                               # regenerate docs/CASTING.md after editing casting.json
pnpm voice apply-casting --locale ru --dry-run   # find the picked voices by name (needs the key), show matches
pnpm voice apply-casting --locale ru             # add them to My voices and write voice ids to the puppets
```
Listen first (links in docs/CASTING.md), change `pick` where another candidate sounds better, then apply. Manual alternative:
```bash
pnpm voice cast [--locale ru]          # puppet/narrator, voiceId or TODO, number of lines, voice brief
pnpm voice search "deep russian male" --language ru --gender male [--age old] [--n 20]
pnpm voice assign muzhik ru <voice_id> --owner <public_owner_id>   # adds the library voice to My voices and saves it
pnpm voice preview muzhik --locale ru  # sample line → out/voice-preview/muzhik.ru.mp3 (costs a few hundred characters)
```
- Start with the puppets that speak most (the cast table is sorted by number of lines): narrator, muzhik, paren, zhena, barmen, sluzhivy, doktor…
- Match `bible.voiceBrief` (age, timbre, manner). The narrator's brief is in `content/voices.json`.
- **Different voices in one scene**: doubles of a family (`muzhik`, `muzhik-sosed`, `muzhik-ryzhy`) and two women in one joke must not share a voice; `voice run` refuses episodes where two speakers have the same voice.
- Voice slots: Starter 10, Creator 30 per account. Use one voice per puppet per language; if slots run short, the same voice may serve puppets that never meet in one episode (`voice run` will tell you if they do).
- Child puppets (vovochka, devochka): library voices described as child or "young boy/girl" style; an adult imitating a child is fine.

## Voicing
```bash
pnpm voice run --locale ru --top 30          # estimate: list, characters, remaining subscription balance
pnpm voice run --locale ru --top 30 --yes    # generate
pnpm voice run ru-63f080198c11.ru --yes      # specific episodes (re-voice a fixed line the same way)
pnpm voice check                             # stale lines (text changed after voicing) or missing files
```
- Each run also voices the **outro laugh** of every puppet still on stage at the end (`[laughs heartily] Ха-ха-ха!` with `content/voices.json → laughModel`, default `eleven_v3`, ~25 characters per puppet) into `outroLaughs`; skip with `--no-laughs`.
- Order = most popular jokes first, same order the posting planner uses. Only lines without up-to-date audio are sent (a changed line is re-voiced alone).
- Model and settings: `content/voices.json → model` (default `eleven_multilingual_v2`: stable, timings confirmed, request stitching via previous/next text). Line emotion → voice settings (stability/style); with `eleven_v3`/`eleven_v4` it becomes an audio tag instead — try on 2–3 episodes before switching, and check the model is not marked beta on the account (beta output is excluded from commercial use).
- Listen to a few results before a big batch: render one episode with `cd remotion && npx remotion render src/index.ts Joke ../renders/check.mp4 --props=../content/episodes/<id>.json` (keep the screen awake on macOS).
- Testing the pipeline without spending credits: `--provider fake` writes tones with even timings — never commit fake audio (`git checkout content/episodes && rm -r remotion/public/audio/voice/<id>`).

## Hand-off
```bash
pnpm voice check
git add content/episodes remotion/public/audio/voice content/characters content/voices.json
git commit -m "Voice: ru top-30"   # on a branch, not main
git push
```
Then the other computer: `git pull && pnpm db sync && pnpm render --voiced --locale ru --top 30` (see **jokes-publish**).

## Rules
- Never commit the API key; never voice on the free plan for publication.
- Do not change line texts while voicing — edit the script (see **jokes-scripts**), re-materialize (existing voice is kept for unchanged lines), then `voice run` again.
- Disclosure stays honest: every caption says the voice is AI (`content/disclosure.json`).
