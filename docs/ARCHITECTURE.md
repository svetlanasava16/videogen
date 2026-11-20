# Фабрика анекдотов — архитектура

Языки: ru (анекдоты), en (анекдоты + dad jokes), de. Субтитры обязательны. Формат 1080×1920, 30 fps.

## Пайплайн
источники → `data/jokes/<lang>.jsonl` (топ-2000) → LLM-разметка (analyze) → каталог персонажей и локаций
→ character bible → арт в ComfyUI → сценарии (script) → озвучка ElevenLabs → рендер Remotion → Postiz

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
pnpm art shots                                         # очередь ComfyUI: shots.characters.json, shots.locations.json
pnpm studio                                            # Remotion Studio
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
- `remotion/`: композиция `Joke`: фон, 2D-куклы, субтитры, рассказчик (голос без куклы, субтитры сверху).
- `data/`: база и разметка (в git), `data/raw/` — сырые датасеты (вне git).

## Решения
- Переводимость оценивается в разметке на каждый язык: translate / adapt / skip. Пригодность к публикации — отдельно, через флаги (`exclude` = никогда).
- Персонаж — данные, `renderer: puppet2d | model3d`; рассказчик — зарезервированный id `narrator`.

## Куклы и роли
- Роль (канон) — смысловой архетип после склейки: 715 сырых id → 177 ролей, 286 локаций → 70 (`data/llm/canon/`).
- Кукла — то, что рисуем: `content/characters/*.json`, поле `bible` (внешность, костюм, голос на 3 языках, промпт, роли, варианты костюма).
- 16 кукол играют 124 роли, 14 фонов закрывают 51 локацию; это ставит целиком ~86% анекдотов (77% «сильного» пула).
- Вовочка / Little Johnny / Fritzchen — одна кукла с локальными именами.
- Общий стиль: `content/style.json` (бумажная перекладка, толстый контур).

## Статус
- Разметка analyze: 6000/6000 (по 2000 на язык), результаты в `data/llm/analyze/results.jsonl`.
- Правило `exclude` уточнялось по ходу; ранние пачки перепроверены (`data/llm/review/`), решения внесены в `.out.jsonl`.
- Пилот по старому промпту сохранён в `data/llm/analyze/pilot-v1/`.
- Отчёт: `docs/catalog-report.md` (пересчёт `pnpm catalog`).

## Дальше
1. Арт: модель в ComfyUI + `workflow_api.json` → `check` → `nodes` → `params` в shots.*.json → генерация листов персонажей и фонов.
2. Нарезка утверждённого арта на слои куклы (голова, рот 3–4 фазы, глаза, руки) и замена SVG-заглушки.
3. Стадия script → `content/episodes/`, начиная с «безопасного» пула; ElevenLabs (голоса по voiceBrief); Postiz.
