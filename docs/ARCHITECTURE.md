# Фабрика анекдотов — архитектура

Языки: ru (анекдоты), en (анекдоты + dad jokes), de. Субтитры обязательны. Формат 1080×1920, 30 fps.

## Пайплайн
источники → `data/jokes/<lang>.jsonl` (топ-2000) → LLM-разметка (analyze) → каталог персонажей и локаций
→ описания кукол → куклы и фоны кодом (SVG) → сценарии (script) → озвучка (ElevenLabs / ComfyUI на сервере, позже) → рендер Remotion (смех, музыка, маркировка) → база `anek-db` → Postiz → метрики

## LLM-стадии без привязки к провайдеру
Скрипты готовят пачки JSONL, исполнитель пишет ответ рядом, скрипт проверяет и сливает:
- сейчас исполнитель — Claude Code в сессии (сабагенты, по одной пачке на агента);
- потом — сервер с локальной моделью через OpenAI-совместимый API (тот же промпт, та же схема).

Промпты: `pipeline/prompts/<stage>.md`. Схемы ответов: `packages/core` (zod).

## Команды
```bash
pnpm jokes ingest [--source id]                        # скачать источники → data/raw/norm/ (вне git)
pnpm jokes select                                      # чистка, дедупликация, топ по квотам → data/jokes/
pnpm llm prepare analyze [--per-lang N] [--lang de]    # новые пачки → data/llm/analyze/batch-NNNN.in.jsonl
pnpm llm collect analyze                               # проверка .out.jsonl, слияние в results.jsonl
pnpm llm status analyze
pnpm canon check characters|locations                  # проверка склейки синонимов (data/llm/canon/*.out.json)
pnpm catalog                                           # docs/catalog-report.md + data/catalog/stats.json
pnpm registry                                          # список кукол/фонов для Remotion (после правок content/)
pnpm llm prepare script --per-lang N --size 20         # сценарии из «безопасного» пула (+ переводы/адаптации)
pnpm llm collect script && pnpm llm materialize script # → content/episodes/<jokeId>.<locale>.json
pnpm studio                                            # Remotion Studio
pnpm audio add|list                                    # библиотека звука (content/audio.json)
pnpm db migrate|sync|status|dump                       # база anek-db
pnpm voice cast|search|assign|preview|run|check        # озвучка ElevenLabs → lines[].audio + mp3 в remotion/public/audio/voice
pnpm render [--voiced] --top N --locale ru | <id…>    # renders/<id>/<hash>.mp4 + .cover.jpg + таблица renders
pnpm board                                             # страница ручного постинга для телефона
pnpm posts accounts|plan|push|sync|list                # публикация через Postiz → таблица posts
pnpm metrics pull|report                               # post_metrics, account_metrics, docs/metrics-report.md
```

## Источники
| язык | источник | лицензия |
|---|---|---|
| ru | HF igorktech/anekdots (anekdot.ru), рейтинг total_mark | ODC-BY |
| en | HF SocialGrep/one-million-reddit-jokes (r/jokes), score | CC-BY-4.0 |
| en | HF enjalot/ls-dadabase (r/dadjokes), score | не указана |
| de | r/Witze через Arctic Shift, score | условия Reddit |

Квоты: `pipeline/src/ingest/sources.ts` → `QUOTAS`.

## Структура
- `packages/core`: схемы Joke, JokeAnalysis, ScriptDraft, Episode, Character, Location; `NARRATOR`.
- `pipeline/`: сбор (`src/jokes.ts`, `src/ingest/`), LLM-пачки (`src/llm.ts`), каталог (`src/catalog.ts`).
- `content/`: персонажи, локации, эпизоды для рендера.
- `remotion/`: композиция `Joke`: фон, 2D-куклы, субтитры, рассказчик (голос без куклы, субтитры сверху), смех и музыка (`components/Soundtrack.tsx`), водяной знак ANEK. в углу (`components/Branding.tsx`), смех персонажей в конце их голосами (`Episode.outroLaughs`).
- `packages/db`: схема Postgres (Drizzle) и миграции. Контент — копия из git (`pnpm db sync`), рендеры, публикации и метрики — только в базе.
- `pipeline/src/publish/`: клиент Postiz Public API, подписи и настройки площадок; `content/disclosure.json` — тексты маркировки, `content/accounts.json` — аккаунты (площадка × язык).
- `infra/`: docker compose — `anek-db`, Postiz + Temporal (профиль `postiz`), Cloudflare Tunnel (профиль `tunnel`), страницы Privacy/Terms; инструкция `docs/POSTIZ.md`.
- `data/`: база и разметка (в git), `data/raw/` — сырые датасеты (вне git).

## Решения
- Переводимость оценивается в разметке на каждый язык: translate / adapt / skip. Пригодность к публикации — отдельно, через флаги (`exclude` = никогда).
- Персонаж — данные, `renderer: puppet2d | model3d`; рассказчик — зарезервированный id `narrator`.

## Куклы и роли
- Роль (канон) — смысловой архетип после склейки: 715 сырых id → 177 ролей, 286 локаций → 70 (`data/llm/canon/`).
- Кукла — то, что рисуем: `content/characters/*.json`, поле `bible` (внешность, костюм, голос на 3 языках, промпт, роли, варианты костюма).
- 28 кукол (22 семейства) играют 136 ролей, 14 фонов закрывают 51 локацию: целиком ставится ~91% анекдотов (87% «сильного» пула).
- Двойники (`family`): тот же риг, другие волосы и одежда — для сцен с двумя мужиками, двумя девушками, офицером и рядовым; заодно блондинка/рыжая.
- Стереотипные детали — `look.accessories` (крест, борода, кепка, корона…), костюм под роль — `bible.variants[].look`; эпизод передаёт роль куклы в `roles`.
- Вовочка / Little Johnny / Fritzchen — одна кукла с локальными именами.
- Общий стиль: `content/style.json` (бумажная перекладка, толстый контур).

## Движок v2
- Мир: городок Анекдотск / Jokeville / Witzhausen (`content/world/town.json`, `bible.md`), карта кодом (`remotion/src/world/TownMap.tsx`).
- Реплики персонажей дословно из источника (правило 0 в `pipeline/prompts/script.md`); `lines[].text` — чистая версия (мат смягчён: «нафиг», «блин»), `lines[].uncensored` — слова источника, `Episode.explicit` включает их в субтитрах.
- На сцене до 5 кукол (`MAX_CAST`, при 4–5 они мельче, камера берёт групповой план), `looks` — костюм на эпизод поверх роли, `crowd` — молчаливая массовка с реакциями (бит `crowd`). Чего нельзя нарисовать — сценарист пишет в `needs`, сводка `pnpm llm needs script`.
- Эпизод = `lines` + необязательные `scenes` с битами (`line`, `move`, `prop`, `camera`, `sfx`, `pause`) и переходами (`cut`, `wipe`, `flyover`); старые эпизоды — одна сцена (`scenesOf`).
- Режиссёр: метки мест (`content/locations/*.json → marks`), авто-камера (`director/camera.ts`), раздвижка кукол, реквизит (`content/props.json`).
- Сборники: `pnpm compile` → `pnpm render --compilation` → посты `kind: compilation`; заставка над городом и пролёты между анекдотами.
- Места без кода: `kit` в `content/locations/<id>.json` (суд, баня, пляж).
- Риск «религия»: стадия `risk`, `mocking` → эпизоды `rejected`.

## Публикация и маркировка
- Сейчас: только Instagram, вручную, аккаунты `ig-ru` и `ig-en`. Озвучка — на компьютере девушки (ElevenLabs, платный план), рендер и постинг — на Маке Мити, передача через git; телефон работает через `pnpm board`.
- Позже: YouTube Shorts, TikTok, Threads через Postiz; потом X и VK.
- В каждой подписи — текст из `content/disclosure.json` (голос — ИИ, видео — ANEK., персонажи вымышлены, без намерения задеть верующих; у переводов — «перевод с помощью ИИ»). В видео — водяной знак ANEK. в углу, без финальной карточки. Флаги ИИ по API: YouTube `containsSyntheticMedia`, TikTok `is_aigc`.
- Частота 1–3 видео в день на канал, без повторов фона и героя подряд (правило YouTube «inauthentic content»).

## Статус
- Разметка analyze: 6000/6000 (по 2000 на язык), результаты в `data/llm/analyze/results.jsonl`.
- Правило `exclude` уточнялось по ходу; ранние пачки перепроверены (`data/llm/review/`), решения внесены в `.out.jsonl`.
- Пилот по старому промпту сохранён в `data/llm/analyze/pilot-v1/`.
- Отчёт: `docs/catalog-report.md` (пересчёт `pnpm catalog`).

- Сценарии: 883 эпизода (топ-100 на язык, оригиналы и переводы), `content/episodes/`.
- База, рендер, публикация и метрики готовы; Postiz ждёт домен и developer-приложения площадок (`docs/POSTIZ.md`).

## Дальше
1. Наполнить библиотеку звука (CC0-смех и музыка).
2. Поднять Postiz, подключить аккаунты, первые приватные публикации.
3. Кастинг голосов и озвучка топ-30 ru/en (`pnpm voice`); позже TTS через ComfyUI на GPU-сервере как второй провайдер (`pipeline/src/voice/provider.ts`).
4. Метка `religious-target` для русского пула перед VK.

## Скиллы
`.claude/skills/`: llm-batch-run, jokes-annotate, jokes-classify, jokes-cast, jokes-draw, jokes-scripts, jokes-sources, jokes-publish.
