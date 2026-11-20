# Stage: analyze

You are annotating a database of jokes (Russian anekdoty, English jokes and dad jokes, German Witze) for an animated short-video channel. Each joke may become a 20–45 second vertical video with 2D puppet characters, voice-over (text-to-speech) and subtitles, published in Russian, English and German.

## Input
A JSONL file. Each line: `{"id", "lang", "kind", "text", "targets"}`. `targets` lists the other languages the joke could be published in.

## Output
A JSONL file with exactly one line per input line, in the same order, same `id`. Each line is a single JSON object, no markdown, no comments:

```json
{
  "id": "ru-de1ac298b707",
  "gist": "Father so eager to marry off his daughter that he thanks the suitor tearfully as a savior.",
  "form": "dialogue",
  "needsNarrator": true,
  "characters": [
    {"archetype": "old-man", "role": "speaker", "nameInText": "Яша", "looks": "elderly man, kippah, cardigan, tired kind eyes"},
    {"archetype": "wife", "role": "speaker", "nameInText": "", "looks": "elderly woman, apron, stern"}
  ],
  "location": {"archetype": "home-kitchen", "props": ["table", "tea cups"]},
  "wordplay": {"present": false, "explanation": ""},
  "cultureRefs": ["Odessa-Jewish humor register"],
  "translatability": {
    "en": {"verdict": "translate", "reason": "universal", "note": ""},
    "de": {"verdict": "translate", "reason": "universal", "note": ""}
  },
  "funny": 4,
  "videoFit": 4,
  "flags": ["ethnic"]
}
```

## Field rules

**gist**: one English sentence: the situation and how the punchline works, without quoting. Retellings of the same joke must get near-identical gists, so describe the mechanism, not the wording.

**form**: `dialogue` (characters exchange lines), `narrative` (a told story, maybe with quoted speech), `qa` (setup question + answer, typical dad joke), `one-liner` (single statement, aphorism, observation). An in-scene monologue by one character (phone call, speech, announcement) is `dialogue` with one speaker.

**needsNarrator**: true if the scene cannot be understood from character lines alone: setup like "A man walks into a bar…", "Приходит мужик к врачу…", time jumps, or a twist described rather than spoken. False for pure dialogues and Q&A that one or two characters can deliver.

**characters**: everyone who matters to the joke, including silent and merely mentioned ones (role `speaker` / `silent` / `mentioned`). May be empty for a joke with no figures at all. Do not list the narrator. A first-person "I" in the joke is a character (usually `everyman`), not the narrator.
- `archetype`: kebab-case English id of the character TYPE, not the name. Reuse ids from the vocabulary below whenever they fit; invent a new one only when none fits (keep it short and generic, e.g. `dentist`, `fisherman`).
- Recurring folk characters keep their own id: `vovochka`, `stirlitz`, `rabinovich`, `chukchi`, `petka`, `vasily-ivanovich`, `new-russian`, `blonde`, `mother-in-law`, `rzhevsky` (poruchik Rzhevsky), `ded-moroz`, `fritzchen` (German cheeky schoolboy), `ostfriese` (German regional-stereotype character), `saint-peter`. Use `everyman` for the generic man/guy/мужик/Typ.
- `nameInText`: the name or label used in the joke text (original language), else "".
- `looks`: 4–15 English words on appearance: what the text says, otherwise the typical folk image of this type. No references to copyrighted film/cartoon designs.

**Character vocabulary** (prefer these): everyman, woman, wife, husband, mother-in-law, mother, father, son, daughter, girlfriend, boyfriend, child, vovochka, teacher, student, professor, doctor, patient, dentist, nurse, police-officer, traffic-cop, bartender, drunk, waiter, boss, employee, soldier, sergeant, officer, old-man, old-woman, grandma, grandpa, blonde, priest, rabbi, god, devil, angel, adam, eve, death, genie, goldfish, lawyer, judge, programmer, businessman, new-russian, salesman, customer, politician, mechanic, postman, pilot, scientist, secretary, journalist, engineer, nun, truck-driver, tv-host, athlete, bank-clerk, cashier, firefighter, lifeguard, artist, musician, writer, landlord, neighbor, thief, prisoner, hunter, fisherman, farmer, tourist, stirlitz, rabinovich, chukchi, petka, vasily-ivanovich, bear, hare, wolf, fox, parrot, dog, cat, horse, cow, chicken, duck, frog, alien, robot.

**location.archetype**: kebab-case id; `none` if the joke has no place (pure Q&A, one-liner). Vocabulary: home-kitchen, home-living-room, bedroom, bar, restaurant, street, road, car, bus, train, plane, doctor-office, hospital, pharmacy, school-classroom, university, office, shop, police-station, prison, courtroom, army-barracks, battlefield, church, heaven, hell, desert-island, forest, river-lake, beach, farm, village, zoo, hotel, bank, theater, space, gym, stadium, garage, none. A new short kebab-case id is allowed when none fits. `props`: up to 4 English nouns needed on screen.

**wordplay**: true only if the PUNCHLINE depends on a pun, homophone, double meaning, rhyme or spelling. `explanation` in English: which words and both meanings.

**cultureRefs**: English notes on references a foreign viewer might not get (Soviet realities, local politicians, regional stereotypes, brands, TV shows). Empty if none.

**translatability**: one entry per language in `targets`.
- `translate`: works if translated well; routine localization (dropping or neutralizing a minor detail that the punchline does not need) still counts as `translate`.
- `adapt`: the punchline or a reference it depends on must be replaced; works only after reworking (new pun with the same situation, swapping a local reference for a local equivalent, renaming a character).
- `skip`: does not work in that language even with adaptation, or the result would be a different joke.
- Judge ONLY the language and culture fit here. Content problems (offensive, unpublishable, not a joke) go to `flags` and `funny`, never into `translatability`.
- `reason`: `universal` | `wordplay` | `culture-ref` | `name-or-stereotype` | `format` | `other`. `note`: short English hint for the adapter (what to replace), else "".

**funny**: honest 1–5 for a broad adult audience today (5 = genuinely laugh-out-loud; 3 = decent; 1 = not funny, broken, or not a joke). Items that are not jokes at all (parables, memes, quotes) get 1.

**videoFit**: 1–5, how well it plays as a 20–45 s animated scene with 1–3 characters: clear situation, spoken lines, a visual or verbal punchline at the end. Long monologues, list-jokes, pure text puns and abstract aphorisms score low.

**flags**: any of `ethnic`, `sexual`, `political`, `violence`, `religion`, `profanity`, `dark`, `drugs`, `homophobia`, `real-person` (a real, identifiable public figure is a character or the target of the joke; a mere time reference like "under Stalin" does not count; modern public figures (living or active in the last ~50 years) count, including impressions of them; 20th-century dictators as characters (Hitler, Stalin, Lenin) always count; distant historical figures like Spartacus or Napoleon do not; use a generic archetype such as `politician` and keep the name in `nameInText`), `exclude` (never publishable: any sexual content involving a minor (under 18), even incidental, including a child who witnesses or talks about sex, or nudity of minors, or references to a minor's body in a sexual light (e.g. bra size); implied references and innuendo count too; if the age is unstated but the context reads as a child (school, "little", a parent raising them), treat them as a minor, bestiality, hate speech that dehumanizes a group, or a joke whose only point is cruelty to a real, identifiable victim of a tragedy; puns about historical mass-casualty events are `dark`, not `exclude`). These are labels, not judgments; tag what applies. `sexual` means sexual acts, innuendo or nudity are part of the joke; infidelity or a lover hiding in the closet without sexual content does not need it. `religion` only when the joke is about faith, clergy or religious practice; heaven, Saint Peter or God as a mere setting or narrator device does not need it. `dark` also covers jokes that mock disability or illness. `homophobia` covers any punchline that mocks LGBT people, including transgender people. `ethnic` covers national and regional stereotypes too (Chukchi, Swabian, redneck, Ostfriese).

## Process
If one input contains several separate jokes, annotate the strongest one and start its `gist` with `[N jokes]` (e.g. `[2 jokes]`, `[3 jokes]`). `flags` still cover the whole input text.
Read the whole input file, annotate every line, then write the output file. Do not skip lines, do not merge lines, do not add fields. Strings must be valid JSON (escape quotes).
