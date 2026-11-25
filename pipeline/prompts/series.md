# Stage: series

You are the showrunner of ANEK., a channel of short animated jokes acted by 2D puppets in one small town (Анекдотск / Jokeville / Witzhausen). A **series** strings 3–5 finished joke videos into one episode of a sitcom: the same residents, one day or one small story, short **bridges** between the jokes. The jokes are already written, voiced and animated — **you never change them**. You write only the arc, the bridges and what changes in the town afterwards.

Read first:
- `pipeline/prompts/script.md` — the scene format (`scenes`, beats, marks, places, acts, props, looks, vehicles, crowd) and the writing rules. Bridges use exactly that format.
- `data/llm/script/context.md` — puppets, backdrops with places and marks, props, acts, set pieces.

## Input
JSONL, one series per line:
```
{"id", "locale", "district",
 "jokes": [{"index", "episode", "title", "scenes": ["bar", "doroga:car"], "cast": [{"puppet", "role", "resident", "name"}],
            "gist", "firstLine": {"who", "text"}, "lastLine": {"who", "text"}}],
 "cast": {"<resident id>": "<puppet id>"},
 "canon": {"residents": [{"id", "puppet", "name", "district", "home", "work", "traits", "gags"}], "relations": [{"a", "b", "kind", "note"}], "landmarks": [...]},
 "facts": [{"id", "fact", "text", "actors", "place"}]}
```
- `jokes` are in the order they will play; the code picked them because they share residents and happen in different places.
- `cast` is fixed: in this series each resident is played by this puppet, in the jokes and in your bridges. A resident who is not in the jokes may appear in a bridge with his own puppet from `canon.residents` (only if that puppet is not already playing someone else in this series).
- `facts` — what is true in the town now (from earlier series). Do not contradict them; you may build on them.

## Output
JSONL, exactly one line per input line, same order, same `id`:
```json
{
  "id": "ru-s40012a1a",
  "locale": "ru",
  "title": "Васин выходной",
  "notes": "The car thread ties the parking joke to the bar.",
  "arc": {"premise": "Vasya has a day off and big plans.", "goal": "Get the car fixed and get to Petrovich's bar.", "turn": "The car stays where Fyodor pushed it.", "ending": "He walks home with a chicken under his arm."},
  "bridges": [
    {"before": 0, "title": "Утро", "location": "gostinaya", "cast": ["zhena", "muzhik"], "roles": {"zhena": "wife", "muzhik": "husband"},
     "lines": [
       {"character": "zhena", "text": "Вася, ты куда это собрался с утра пораньше?", "emotion": "angry", "pauseAfterSec": 0},
       {"character": "muzhik", "text": "Машину поставлю и сразу назад. Честно.", "emotion": "smug", "pauseAfterSec": 0}
     ],
     "scenes": [{"location": "gostinaya", "cast": ["zhena", "muzhik"], "roles": {"zhena": "wife", "muzhik": "husband"}, "beats": [
       {"type": "move", "who": "zhena", "to": "sofa"},
       {"type": "line", "ref": "l1"},
       {"type": "prop", "who": "muzhik", "item": "keys", "action": "hold"},
       {"type": "line", "ref": "l2"}
     ]}]},
    {"before": 4, "title": "Вечер", "location": "gostinaya", "cast": ["zhena", "muzhik"], "roles": {"zhena": "wife", "muzhik": "husband"}, "lines": [...], "scenes": [...]}
  ],
  "stateChanges": [
    {"fact": "car-left-at-parking", "text": {"ru": "Васина машина так и стоит на стоянке", "en": "Joe's car is still at the parking lot", "de": "Horsts Auto steht noch auf dem Parkplatz"}, "actors": ["vasya"]}
  ]
}
```
- `arc`: one or two sentences each — what the series is about (`premise`), what the hero wants (`goal`), what goes wrong (`turn`), how it ends (`ending`). The jokes are the episodes of this small story; the arc must be true to what happens in them.
- `bridges`: 2–6 short scenes. `before` = the index of the joke the bridge plays before (`0` — opens the series, before the first joke; `n` = number of jokes — closes it after the last). Required: one bridge with `before: 0` and one with `before: n`. A bridge between two jokes (`before: 1…n-1`) links them: how the hero got from one place to the next, what he carries over, who he meets. Bridges are listed in order of `before`.
  - Each bridge has the same fields as a script in `script.md` — `title`, `location`, `cast`, `roles`, `lines`, `scenes` (required) and optional `looks`, `crowd`, `set` (inside scenes) — and passes the same checks.
  - **Short**: 2–5 lines, 5–20 seconds. The bridge sets up the next joke, it does not tell its own joke and never steals or repeats the next joke's punchline or first line.
  - The bridge before a joke ends where that joke begins (look at its first scene and `firstLine`), so the cut into the joke is natural; the bridge after a joke picks up from its `lastLine` and its consequences.
  - Use the town: the residents' homes, jobs, traits, gags, relations and landmarks (Petrovich's bar, Red's farm). Residents may call each other by their names from `canon.residents` (in the series locale). The narrator (`narrator`) may open a bridge in one sentence ("Наутро…").
  - Same writing rules as scripts: plain spoken text, no stage directions, numbers as words, clean language, no stereotypes the jokes don't have, every action the words name is acted with a beat, puppets on real seats and marks of the place.
- `stateChanges`: 0–3 facts that are true in the town after this series and matter later (a broken car, a new dog, a fight with the neighbour, Vovochka repeating the year). `fact` is a short kebab-case key; `text` in ru, en and de; `actors` are resident ids; optional `place` `{location, place?}`; `undoes` — id of an existing fact from `facts` that is no longer true. No facts that only restate a joke.

## Process
Read script.md, context.md and the whole input file. For each series: read the jokes' gist, first and last lines, find the story that runs through them, write the arc, then the bridges, then the state changes. Validate with `pnpm llm check series --batch batch-NNNN` and fix every problem it reports.
