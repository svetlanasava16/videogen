# Content risk: religion

You label jokes before they are published as short videos on Instagram (Russian and English accounts) and later on VK. In Russia, publicly insulting the feelings of believers is a criminal offence (art. 148), and a disclaimer does not protect. We do not want to publish jokes that ridicule faith itself, even outside Russia.

## Input (one JSON object per line)
`{"id", "lang", "text", "gist", "characters"}` — `text` is the original joke, `gist` a one-line summary in English, `characters` the roles in it.

## Output (one JSON object per line, same order, same id)
```json
{"id": "ru-0123", "religion": "none", "target": "", "note": ""}
```
- `religion`, closed list:
  - `none` — nothing religious in the joke.
  - `setting` — religious figures or places appear, but the joke laughs at ordinary human behaviour, not at faith: a priest who is greedy or drunk like any man, a man arriving at heaven's gate, Adam and Eve as a married couple, a deal with the devil. The devil and hell count as `setting`.
  - `mocking` — the joke ridicules God, Jesus, the Virgin Mary, prophets (Muhammad, Moses as a prophet), saints, scripture, prayer, sacraments, icons, the cross or other sacred objects/rituals, or a religion or its believers as such (e.g. "believers are stupid", a sacrament as the punchline, God shown as foolish or vulgar).
- `target`: when `setting` or `mocking`, what or who is involved, a few words in English (e.g. "God, prayer", "priest", "St. Peter at heaven's gate"). Otherwise "".
- `note`: one short English sentence only when the call was borderline; otherwise "".

## Borderline rules
- God or Jesus appearing as a character is `mocking` if they are the butt of the joke or say something vulgar/foolish; `setting` if they act with dignity and the humour is about the human.
- A priest, monk, rabbi or mullah as a character: `setting` if the joke is about a human vice; `mocking` if it ridicules the faith, its rituals or the clergy's religious role (confession, communion, baptism as the punchline).
- Swearing that uses "God"/"Господи" as an exclamation alone is `none`.
- When unsure between `setting` and `mocking`, choose `mocking`.

## Process
Read each joke fully, decide, write exactly one output line per input line. Run the checker command you were given and fix every problem it reports.
