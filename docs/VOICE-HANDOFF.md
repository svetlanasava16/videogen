# Озвучка на втором компьютере (платный ElevenLabs)

Кто что делает: **озвучка** — на компьютере с платным аккаунтом ElevenLabs, **рендер и постинг** — на Маке Мити.
Всё передаётся через git: mp3 реплик лежат в `remotion/public/audio/voice/<эпизод>/`, тайминги слов — в `content/episodes/<эпизод>.json`.
База (`anek-db`) и готовые ролики для озвучки **не нужны**: база собирается из git одной командой, ролики рендерятся после озвучки.

## 1. Один раз: подготовить компьютер
```bash
git clone git@github.com:svetlanasava16/videogen.git && cd videogen
git checkout joke-factory-pipeline
```
Нужны Node.js 22 и pnpm (`brew install node@22 pnpm` на Mac), затем:
```bash
pnpm install
```
Файл `.env` в корне репо (в git не попадает, ключ никому не пересылать; шаблон — `.env.example`). Два аккаунта:
```
ELEVENLABS_API_KEY=<бесплатный ключ — по умолчанию, для тестов>
ELEVENLABS_PLAN=free
ELEVENLABS_API_KEY_PAID=<платный ключ — включается флагом --paid>
```
Права ключа: Text to Speech (Access), Voices (Read + Write), User (Read). Проверка ключа без трат: `pnpm voice doctor [--paid]`.
Если на компьютере только платный аккаунт: `ELEVENLABS_API_KEY=<платный>` и `ELEVENLABS_PLAN=paid`, флаг `--paid` не нужен.
Тариф — Starter или Creator: у бесплатного нет коммерческой лицензии.

## 2. Один раз на язык: выбрать голоса
Таблица кандидатов — `docs/CASTING.md`: роль, описание голоса и ссылки, по которым голос можно послушать в Voice Library.
Если другой кандидат звучит лучше, поменяйте `pick` в `content/casting.json`. Потом:
```bash
pnpm voice apply-casting --locale ru --dry-run --paid   # какие голоса найдены
pnpm voice apply-casting --locale ru --paid             # добавить их в My voices (20 голосов для ru: нужен Creator, у Starter 10 слотов) и записать куклам
pnpm voice cast --locale ru                      # проверка: у кого ещё нет голоса (TODO)
```

## 3. Озвучить
Сейчас готовы три сборника (18 эпизодов, около 9 100 знаков):
```bash
pnpm voice run --compilation ru-20261121-01,ru-20261121-02,ru-20261122-01 --paid          # смета: знаки и остаток подписки
pnpm voice run --compilation ru-20261121-01,ru-20261121-02,ru-20261122-01 --paid --yes    # озвучка
pnpm voice check                                                                     # всё ли озвучено
```
- Озвучиваются только реплики без актуального голоса. Тестовая озвучка с бесплатного аккаунта (помечена `elevenlabs-free`) на платном ключе переозвучивается сама.
- Отдельные эпизоды: `pnpm voice run ru-4b75a0e1bc8d.ru --yes`; топ по популярности: `pnpm voice run --locale ru --top 30 --yes`.
- Послушать результат, не дожидаясь рендера: mp3-файлы лежат в `remotion/public/audio/voice/<эпизод>/`.

## 4. Отдать обратно
```bash
git add content/episodes remotion/public/audio/voice content/characters content/voices.json
git commit -m "Voice: ru, compilations of 21–22 Nov"
git push
```

## 5. На Маке Мити: рендер
```bash
git pull
pnpm render --compilation ru-20261122-01      # → renders/compilations/<id>/<hash>.mp4
pnpm db sync                                  # если нужна база для постинга
```

## Если всё же нужны база или ролики
- **База** — копия данных из git плюс таблицы рендеров, постов и метрик. На новом компьютере её можно собрать так: `docker compose -f infra/docker-compose.yml up -d anek-db && pnpm db migrate && pnpm db sync`. Полная копия с постами и метриками: `pnpm db dump` (файл в `data/backups/`), передать файл и восстановить через `docker exec -i anek-db psql -U anek -d anek < файл.sql`.
- **Готовые ролики** (`renders/`) в git не попадают: они тяжёлые и пересобираются из данных. Чтобы показать — AirDrop, Google Drive или любая общая папка; сжатые копии для телефона лежат рядом (`preview-540.mp4`).
