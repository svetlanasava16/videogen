# Движок ANEK.: постановка анекдота как данных

Анекдот на экране — это JSON эпизода (`content/episodes/<jokeId>.<locale>.json`). Код пишется только для нового арта (кукла, фон, предмет, машина); всё остальное — данные, которые пишут сценаристы (сабагенты по `pipeline/prompts/script.md`) и проверяет `pnpm llm check script`.

Кадр 1080×1920, 30 fps. Схемы — `packages/core/src/index.ts`; таймлайн — `remotion/src/timeline.ts`; сцена — `remotion/src/Joke.tsx`; камера — `remotion/src/director/camera.ts`.

## 1. Эпизод
```json
{
  "id": "ru-4b75a0e1bc8d.ru", "jokeId": "ru-4b75a0e1bc8d", "locale": "ru", "title": "Икота",
  "location": "bolnitsa", "cast": ["doktor", "baba"], "roles": {"doktor": "doctor", "baba": "patient"},
  "lines": [
    {"id": "l1", "character": "narrator", "text": "Мария Петровна пошла к врачу.", "emotion": "neutral"},
    {"id": "l2", "character": "doktor", "text": "В чём дело?", "emotion": "angry", "uncensored": null}
  ],
  "scenes": [ { "location": "bolnitsa", "place": "waiting-room", "cast": ["…"], "beats": ["…"] } ]
}
```
- `lines` — все реплики по порядку (озвучка, субтитры). Рассказчик — `narrator`: голос без куклы, субтитры сверху. Текст — дословно из источника; `uncensored` — оригинал с матом (в субтитрах при `explicit`).
- `scenes` — постановка: место, кто в кадре и биты. Без `scenes` эпизод — одна сцена из `location`/`cast`.
- Смена комнаты или места = новая сцена; `transition`: `cut` (по умолчанию), `wipe` (прошло время), `flyover` (пролёт над городом к другому зданию).

## 2. Ритм: биты идут параллельно с речью
Время двигает только речь и явный `pause`. Не-речевые биты (`move`, `act`, `prop`, `crowd`, `shake`, `camera`, `sfx`, `drive`, `board`, `alight`), стоящие **перед** репликой, начинаются **вместе с ней**: рассказчик говорит «пилоты заходят» — они заходят в этот момент. Шаги одной куклы идут по очереди, разные куклы — одновременно.
- Между репликами 0,08 с, перед панчлайном 0,25 с; тишина в начале и конце mp3 обрезается по таймингам слов.
- `move` до первой реплики сцены — начальная расстановка (кукла уже стоит на метке, без ходьбы); второй `move` той же куклы до первой реплики — ходьба на первых словах (стюардесса стоит у кухни и идёт по проходу).
- Темп озвучки — `content/voices.json → tempo` (рассказчик 1,25, персонажи 1,1).

## 3. Биты
| Бит | Поля | Что делает |
|---|---|---|
| `line` | `ref` | реплика (каждая ровно один раз, по порядку) |
| `move` | `who`, `to` (метка или `off-left`/`off-right`), `from?`, `plane?`, `via?` | встать/пройти к метке, войти из-за края, уйти; план и обход — раздел 5 |
| `act` | `who`, `act`, `to?`, `sec?` | действие куклы (раздел 4) |
| `prop` | `who`, `item`, `action` (`hold`/`give`/`drop`/`put`), `to?` | предмет в руке (`content/props.json`) |
| `crowd` | `react` (`scream`/`gasp`/`laugh`/`cheer`/`murmur`/`calm`/`flee`) | реакция массовки сцены |
| `shake` | `sec`, `strength` (`light`/`strong`) | тряска кадра (взлёт, удар, взрыв) |
| `camera` | `shot` (`wide`/`group`/`two`/`close`), `on?` | явный план камеры (иначе авторежиссура) |
| `sfx` | `id` | звук из `content/audio.json` |
| `pause` | `sec` | комическая пауза (единственное, что останавливает речь) |
| `drive` | `vehicle`, `to`, `from?` | машина едет к метке, въезжает или уезжает (раздел 8) |
| `board` / `alight` | `who`, `vehicle`, `to?` | сесть в машину / выйти (и пройти к `to`) |

## 4. Действия кукол (`act`)
Словарь — `ACTS` в core (44 действия): slap, punch, hit-head, cover-ears, cover-eyes, cover-face, hug, kiss, point, wave, facepalm, shrug, nod, shake-head, bow, kneel, sit, stand, fall, faint, lie, jump, run, cry, laugh, drink, eat, scratch-head, hands-up, clap, pray-hands, think, sleep, throw, grab, knock, dance, shiver, flex, write, phone, whistle, look-down, turn. Позы — `remotion/src/puppet/acts.ts`, лист всех поз — композиция `Acts`.
- **Состояния** (`STATE_ACTS`: sit, kneel, lie, sleep, faint, cover-ears, cover-eyes, cover-face, pray-hands, hands-up, think, write, phone) держатся, пока кукла не сделает другое состояние, `stand` или не пойдёт. **Жесты** (кивок, плач, удар…) идут поверх состояния: на коленях мотает головой, закрыв уши — кивает. Повтор того же состояния — продолжение, а не новый вход.
- **По цели** (`TARGET_ACTS`: slap, punch, hit-head, hug, kiss, throw, grab): кукла сначала подходит к `to`, цель вздрагивает от удара.
- Действие ставится прямо перед репликой, где оно **названо**: «И раз подзатыльник!» — slap перед этой репликой рассказчика.

## 5. Глубина: три плана
Как в бумажном театре (South Park): дальше — выше и мельче. Модуль `remotion/src/world/depth.ts`.

| План | z | Стопы (px кадра) | Масштаб |
|---|---|---|---|
| `back` — у стены | 1 | 1190 | 0,8 |
| `mid` — по умолчанию | 0,5 | ≈1275 | 1,0 |
| `front` — у камеры | 0 | ≈1360 | 1,2 |

- План куклы берётся из метки, на которой она стоит, или из `move.plane`. Подход к кукле (`act` по цели) — на её план; посадка в машину — у двери.
- Куклы, мебель и машины рисуются вместе, по плану: дальние раньше, ближние поверх. Массовка (`crowd`) — ещё дальше, у стены.
- Раздвижка: на одном плане куклы не стоят друг в друге; на разных — один может стоять за плечом другого, но зазор 0,8 от обычного оставляет лицо дальнего видимым.
- **Обход.** Если ход пересекает кукол того же плана, идущий проходит по передней дорожке (выходит ближе к камере и возвращается); `via: "back"` — за спинами; `via: "front"` — впереди явно.
- Камера берёт голову и тело каждой куклы по её плану; сидящие — ниже на высоту ног.
- Субтитры персонажей — на 72 % высоты, под стопами переднего плана; рассказчик — сверху (8 %).

## 6. Места и сублокации
`content/locations/<id>.json`:
```json
{
  "id": "bolnitsa",
  "marks": { "door": {"x": 0.9, "z": 1}, "desk": {"x": 0.62, "z": 0.5, "seat": "chair"}, "center": 0.5 },
  "bible": {
    "summary": "…", "roles": ["doctor-office", "hospital"],
    "variants": [
      { "id": "waiting-room", "name": {"ru": "Коридор поликлиники", "en": "…", "de": "…"},
        "roles": ["waiting-room", "clinic", "queue"],
        "change": "что видно и где: стулья у стены, окошко регистратуры, дверь врача…",
        "marks": { "chair-1": {"x": 0.15, "z": 1, "seat": "chair"}, "front-left": {"x": 0.25, "z": 0} },
        "set": [], "crowd": {"who": "patients", "size": "few"} }
    ]
  }
}
```
- **Метка** — число x (доля ширины, средний план) или `{x, z, seat}`. `seat` — на метке сиденье (chair, bench, couch, stool, armchair, car-seat, pilot-seat, bed).
- **Сублокация** (`bible.variants[]`) — комната места: `id` = `scene.place`, свои `marks` (иначе метки места), `set` — мебель, которая ставится сама (стол столовой), `crowd` — массовка по умолчанию (пассажиры салона). `roles` — канонические локации разметки, которые она закрывает (старые эпизоды хранят в `place` архетип, движок находит вариант по `roles`).
- Фон получает id сублокации в `variant` (`components/Background.tsx`). Неизвестный `place` в сценарии — ошибка проверки.
- Сценаристы видят все места, сублокации и метки (с планом и сиденьем) в `data/llm/script/context.md` — он генерируется из этих JSON при `pnpm llm prepare script`.
- Группы для сценаристов: **дом** — `gostinaya` (гостиная; `dining-room`, `front-door`, `balcony`, `basement`), `kukhnya`, `spalnya` (+ `bathroom`), `podyezd` (+ `elevator`), двор `ulitsa:yard` / `yard-night`; **досуг** — `zal` (`theater`, `museum`, `cinema`), `bar` (`restaurant`, `party`, `hotel`), `banya`, `plyazh`; **небеса** — `nebesa` (`hell`, `garden-of-eden`, `space`, `crossroads`); **больница** — `bolnitsa` (кабинет врача; `waiting-room`, `hospital`, `madhouse`); **транспорт внутри** — `doroga` (`car`, `taxi`, `bus`, `tram`, `subway`, `bus-stop`), `samolet` (`cabin`, `cockpit`, `train`, `ship`, `airport`).
- Превью всех мест с метками: `cd remotion && npx remotion still src/index.ts Locations out.png --props='{"only":["bolnitsa"],"marks":true}'` — кружок = стопы на метке, полоска = верх сиденья.

## 6а. Передний слой, поверхности, надписи
- **Передний слой** (`front: {z}` у места или сублокации): фон рисуется дважды — `layer="back"` за всем и `layer="front"` (стойка бара, прилавок, стойка регистрации, окна банка, скамья судьи) как ещё один объект, отсортированный по глубине вместе с куклами. Бармен на метке `behind-counter` (z 0,95) скрыт стойкой по пояс, посетители на табуретах (z 0,5) — перед ней. У сублокации свой передний слой (у ресторана его нет).
- **Поверхности** (`surfaces: [{x0, x1, z, top}]`): предмет, который кладут (`prop put`) над поверхностью, ложится на неё (деньги — на край стойки, курица — на прилавок с весами). Каждый предмет лежит естественно (таблица `REST` в `props/Props.tsx`: деньги плашмя, бутылка стоит).
- **Надписи** в фонах — на языке эпизода (`remotion/src/i18n/signs.ts`): универсальные таблички (EXIT, WC, BAR, HOTEL, POLICE, OPEN, 24/7, GATE) — по-английски прямо в рисунке; надписи места (хлеб, молоко, аптека, меню, пиво, табло вылета) — ключи в ассетах места `content/signs/<location>.json` (`{"beer": {"ru": "ПИВО", "en": "BEER", "de": "BIER"}}`, общие — `common.json`), в рисунке `const t = useSign(); t("beer")`. Новая надпись = строка JSON + `pnpm registry`. Превью языка: `Locations --props='{"locale":"de"}'`.

## 7. Сиденья и мебель
- Кукла на метке с `seat` **садится сама**, когда дошла; встаёт от `act stand` или ходьбы. Сидит на высоте сиденья своего плана (`seatTopY(z)` = стопы − 72 px × масштаб). Фоны рисуют сиденья ровно под метками.
- `act sit` рядом с сиденьем — сесть на него; где сиденья нет, риг подставляет табурет.
- **Мебель сцены** `set: [{item, at?, size?, plane?, seat?}]` (`remotion/src/world/SetPieces.tsx`, `SET_ITEMS`):
  - перед куклами (закрывает ноги): dining-table, table, desk, counter, lectern;
  - за куклами: sofa, bed, christmas-tree;
  - сиденья: chair, stool, armchair, bench, row-of-chairs, swing;
  - прочее: scales (весы на прилавке), sink (раковина), specimen-shelf (полка с банками в музее).
  Кто стоит в пределах стола или скамьи на её плане — сидит. Мебель стоит на плане метки `at` (или `plane`).
- Фон всегда позади кукол: чтобы кукла стояла **за** прилавком или стойкой, нужен предмет `set` (counter, desk), а не нарисованный в фоне.

## 8. Транспорт
**Внутри** — сублокация: `doroga` + `car`/`taxi` (водитель и пассажир на `car-seat`), `bus`, `tram`, `subway` (сиденья и поручни), `samolet` + `cabin`/`cockpit`, `samolet` + `train`.

**Снаружи** — объект сцены (`remotion/src/world/Vehicles.tsx`, вид сбоку):
```json
"vehicles": [
  {"id": "zapor", "kind": "car", "riders": ["ded"]},
  {"id": "inomarka", "kind": "taxi", "riders": ["nachalnik"], "facing": "left"}
],
"beats": [
  {"type": "drive", "vehicle": "zapor", "to": "road", "from": "off-left"},
  {"type": "line", "ref": "l2"},
  {"type": "alight", "who": "ded", "vehicle": "zapor", "to": "kerb"},
  {"type": "board", "who": "muzhik", "vehicle": "zapor"},
  {"type": "drive", "vehicle": "zapor", "to": "off-right"}
]
```
- Виды: car, taxi, police-car, ambulance, bus, tram, train, truck, tractor, bicycle, motorcycle, scooter, horse-cart, road-roller. Лист — композиция `Vehicles`.
- `riders` — кто внутри с начала сцены, первый — водитель. В машине, автобусе, трамвае и поезде седоки видны в окнах; на велосипеде, мотоцикле, мопеде, тракторе и телеге — сидят сверху. Седоки говорят обычными репликами из окна.
- Машина без `at` стоит за краем, пока не въедет (`drive` с `from`). План — `plane`, иначе план метки, если он не дальше среднего (дальняя обочина задаёт только x), иначе дорога z = 0,3. Машины нарисованы чуть меньше натуральной величины (×0,85): легковая в профиле почти во всю ширину вертикального кадра.
- Люди на том же плане стоят **перед** машиной; вышедший (`alight`) встаёт перед машиной. Машину ставят сбоку (`road-left`/`road-right`), а не там, где говорят; проезжающая на фоне — `plane: "back"` или `"mid"`.
- `board` — кукла подходит к двери и садится (после того как машина доехала); `alight` — выходит у двери и, если задано, идёт к `to`.
- Колёса крутятся только в пути, у машины свои секунды на проезд (`VEHICLE_SPECS[kind].driveSec`).

## 8а. Костюмы и предметы
- **Роль одевает куклу.** `roles` выбирает костюм из `content/characters/<id>.json → bible.variants` (пилот — пилотская форма и фуражка, гаишник — полицейская форма и жилет, военный, повар, строитель, стюардесса, начальник — костюм и галстук, врач — халат, заключённый, моряк). Если кукла играет чужую роль (двойник-пилот, парень-врач), форма берётся у куклы — хозяйки роли (`remotion/src/puppet/costume.ts`). Лист — композиция `Outfits` (`--props='{"mode":"roles"}'`).
- Комплекты одежды — аксессуары (`remotion/src/puppet/Accessories.tsx`, таблица `OUTFIT` — цвет рукавов, брюк, нашивки, погоны): pilot-uniform, police-uniform, traffic-vest, military-uniform, officer-uniform, chef-whites, construction, suit, tie, stewardess-uniform, doctor-coat, prisoner, sailor, towel-wrap и головные уборы. В эпизоде — через `looks`.
- **Предметы** (`content/props.json`, рисунок `remotion/src/props/Props.tsx`, лист `Props`): `hold` — в руке, `give` — передать, `put`/`drop` — положить/уронить: предмет **остаётся** на столе, прилавке, весах или раковине своего плана рядом (иначе на полу), пока его снова не возьмут.

## 9. Массовка, разделённый экран, голос из-за кадра
- `crowd: {who, size, at?, seated?, seatColor?}` — молчаливый ряд у стены (`back`) или силуэты зрителей спиной к нам (`front`); `seated` — сидят за рядом спинок кресел (пассажиры салона, очередь на стульях); животные — penguins, dogs, cats, cows, birds, horses. Реакции — бит `crowd`. У сублокации может быть массовка по умолчанию.
- `split: {location, place?, cast}` — телефонный разговор: сверху место сцены, снизу другое, субтитры в полосе между.
- `lines[].offscreen` — голос из-за кадра (джинн в бутылке, за дверью).

## 10. Камера
Авторежиссура (`director/camera.ts`): общий план в начале сцены, на рассказчике и реакциях массовки; двойной — в диалоге; групповой — при 3+ в кадре; крупный с наездом — на панчлайне; общий — на смехе в конце. С 6 кукол сцена шире кадра, камера едет вдоль. Бит `camera` перекрывает правило до следующего.

## 11. Сборники
`content/compilations/<id>.json` (`episodes`, `transition: flyover`) → `pnpm render --compilation <id>`: заставка над городом, анекдоты, пролёты между ними.

## 12. Проверка и превью
- **Перед каждым коммитом в движок:**
  - `pnpm validate` — схема и ссылки всех эпизодов (`--debug` — только отладочный набор `content/debug-set.json`);
  - `pnpm golden` — сравнение с эталонными кадрами `tests/golden` (после намеренного изменения: `pnpm golden --update`);
  - `pnpm stills <id>|--debug` — ключевые кадры и контактный лист в `out/stills/<id>/`, смотреть глазами.
- `pnpm llm check script --batch batch-NNNN` — схема, места, метки сублокаций, реквизит, машины и седоки, порядок реплик (`sceneProblems` в core).
- Кадр эпизода: `cd remotion && npx remotion still src/index.ts Joke out.png --props=../content/episodes/<id>.json --frame=120`.
- Листы: `Cast` (куклы), `Acts` (позы), `Locations` (места, `marks: true` — метки), `Vehicles` (машины с седоками), `Town` (карта).

## 13. Как расширять
- **Новая сублокация:** вариант в `content/locations/<id>.json` (`id`, `name`, `roles`, `change`, `marks` с `z`/`seat`) + ветка `variant === "<id>"` в `remotion/src/backdrops/<id>.tsx`, сиденья по `seatTopY(z)`; проверка — `Locations` с `marks: true`; `pnpm registry`. Скилл **jokes-draw**.
- **Новая машина:** вид в `VEHICLES` (core) + рисунок и `VEHICLE_SPECS` в `world/Vehicles.tsx` (слои back/front, места седоков).
- **Новое действие:** id в `ACTS` (core) + поза в `remotion/src/puppet/acts.ts`.
- **Новая мебель:** id в `SET_ITEMS` + `case` в `world/SetPieces.tsx`.
- **Новая форма/одежда:** `case` в `puppet/Accessories.tsx` (+ строка в `OUTFIT` для рукавов и брюк), вариант роли в `content/characters/<id>.json`.

## 14. Цикл улучшений
Сценарии переписываются партиями: каждая партия пишет в `needs`, чего не хватило (место, предмет, действие, одежда) → рисуем → переписываем эту партию → рендер → смотрим. Сводка: `pnpm llm needs script` → `data/llm/script/needs.md`. Сборники-примеры: `ru-20261121-01`, `ru-20261121-02`, `ru-20261122-01` (12 анекдотов в разных местах).
- Чего не хватает сценаристам, они пишут в `needs` → `pnpm llm needs script` (сводка `data/llm/script/needs.md`).
