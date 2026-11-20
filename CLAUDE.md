# Проект: эксперименты с генерацией видео (ComfyUI локально + монтаж кодом)

## Схема работы
1. Пользователь ставит задачу словами («ролик на 20 секунд про…»).
2. Claude пишет сценарий в `scripts/` и разбивает его на шоты.
3. Генерация клипов, картинок и звука идёт в локальном ComfyUI:
   - пакетно через `comfy_client.py` + `shots.json` (основной путь, результат в `out/`);
   - интерактивно через MCP-сервер `comfy-mcp` (отдельные пробы, шаблоны, проверка workflow).
4. Монтаж (склейка, титры, графика, музыка) — код в `remotion/` (Remotion, pnpm-монорепо).
5. Готовые видео — в `renders/`.

## Окружение (Mac, Apple M4, 16 ГБ общей памяти, PyTorch на MPS)
- ComfyUI Desktop: http://127.0.0.1:8188 (установка в `~/ComfyUI-Installs/ComfyUI`). Перед работой ComfyUI должен быть запущен.
- Модели: `~/ComfyUI-Shared/models/` (общая папка для всех установок ComfyUI)
- Вход ComfyUI: `~/ComfyUI-Shared/input/`, выход: `~/ComfyUI-Shared/output/`
- Локальная LLM: Ollama, модель `qwen3.5:4b` (http://127.0.0.1:11434). Подходит для черновиков промптов, не для основной работы.
- Python: системный `python3` (3.9) для `comfy_client.py` (только stdlib).
- MCP: официальный `comfy-mcp` в `.venv-mcp/` (Python 3.13 из ComfyUI Desktop), настройка в `.mcp.json`.
  Переустановка: `~/ComfyUI-Installs/ComfyUI/standalone-env/bin/python3.13 -m venv .venv-mcp && .venv-mcp/bin/pip install comfy-mcp "comfy-cli>=1.14.0"`
- Node.js 22 и pnpm установлены (brew, node@22); монорепо на pnpm workspaces, Remotion в `remotion/`, схемы в `packages/core`.
- Файлы `*.part` в папке моделей ещё качаются. Пока скачивание не закончено, такие модели не трогать и не перемещать.

## Папки
- `scripts/` — сценарии роликов (markdown)
- `shots.json` — список шотов для очереди; `workflow_api.json` — workflow в API-формате (Workflow → Export (API))
- `assets/` — исходники: картинки для img2video, первый/последний кадр, музыка (в git не попадают)
- `out/<shot_id>/` — сырые клипы из ComfyUI, `out/report.json` — статус шотов (в git не попадают)
- `remotion/` — код монтажа
- `renders/` — готовые MP4 (в git не попадают)

## Команды comfy_client.py
- `python3 comfy_client.py check shots.json` — сервер, ноды и модели workflow на месте?
- `python3 comfy_client.py nodes workflow_api.json` — ID нод и их входы (для `params`)
- `python3 comfy_client.py run shots.json --dry-run` — что будет подставлено, без отправки
- `python3 comfy_client.py run shots.json` — генерация; готовые (`ok`) шоты пропускаются
- `--only shot02,shot05`, `--force` — выборочно / перегенерировать

## Формат shots.json
```json
{
  "workflow": "workflow_api.json",
  "params":   { "prompt": "6.text", "seed": "3.seed", "first_frame": "52.image" },
  "defaults": { "negative": "..." },
  "retries": 2,
  "timeout_sec": 3600,
  "shots": [
    { "id": "shot01", "values": { "prompt": "..." }, "uploads": { "first_frame": "assets/a.png" } }
  ]
}
```
- `params` — псевдоним → `"node_id.input"` (или список таких целей). В `values` можно писать и напрямую `"6.text"`.
- `uploads` — локальный файл загружается в ComfyUI, и в указанный вход подставляется его имя.
- `seed`: если в шоте нет seed, выбирается случайный. Если в `params` нет псевдонима `seed`, скрипт пишет во все входы `seed`/`noise_seed`.

## Правила
- Перед первым запуском нового workflow выполни `check`, затем `nodes`, и заполни `params` по реальным ID нод.
- Генерируй шоты последовательно, одной очередью (16 ГБ памяти, параллельные шоты не поместятся).
- После запуска читай `out/report.json`. Упавший при выполнении шот скрипт сам перезапускает с другим seed (`retries`).
  Если сервер отклонил workflow (ошибка валидации) или кончилась память (OOM на MPS), другой seed не поможет. В этом случае разберись в причине и сообщи мне.
- Разрешение, длительность (число кадров), fps, число шагов и модель без моего согласия не менять.
- Через MCP без моего согласия НЕ вызывать: `update_comfyui`, `switch_comfyui_version`, `restart_comfyui`, `stop_comfyui`, `install_node`, `download_model`, `download`. ComfyUI управляется приложением ComfyUI Desktop, обновлять его надо через само приложение.
- Ничего, что тратит кредиты (`partner_generate`, partner-API ноды, Comfy Cloud), без моего согласия не запускать: генерируем бесплатно на Маке.
- Промпты пиши на английском, если не попрошу иначе. Сценарий и обсуждение ведём на русском.
- Не удаляй файлы в `out/`, `renders/` и в `~/ComfyUI-Shared/`. Перегенерация с `--force` перезаписывает только отчёт, файлы получают новые имена.

## Фабрика анекдотов (основное направление)
Архитектура и команды: `docs/ARCHITECTURE.md`. Отчёт по базе: `docs/catalog-report.md`.
Арт рисуется кодом (SVG-куклы и фоны в `remotion/`), ComfyUI для арта в фабрике не используется (позже — для озвучки на GPU-сервере пользователя).
LLM-шаги не вызывают API: скрипты режут работу на JSONL-пачки, их выполняют сабагенты Claude Code (позже — локальная модель).
Скиллы проекта (`.claude/skills/`), используй их вместо импровизации:
- `llm-batch-run` — запуск любой LLM-стадии сабагентами (prepare → 10 агентов → check → collect);
- `jokes-annotate` — база анекдотов и разметка, ревью exclude, каталог;
- `jokes-classify` — новая классификация/метка поверх существующей разметки;
- `jokes-cast` — куклы, двойники, костюмы ролей, аксессуары, фоны, покрытие;
- `jokes-draw` — рисование кодом: риг куклы, позы, лица, аксессуары, фоны и их варианты, выходы;
- `jokes-scripts` — сценарии и переводы → `content/episodes/`, превью;
- `jokes-sources` — новые источники анекдотов и языки;
- `jokes-engine` — движок: сцены как данные, режиссёр и камера, городок Анекдотск, сборники с пролётом, места из данных;
- `jokes-voice` — озвучка ElevenLabs: кастинг голосов, генерация, передача через git;
- `jokes-publish` — рендер, база `anek-db`, ручной постинг в Instagram (`pnpm board`), Postiz, метрики, правила маркировки.
Рабочее название проекта — ANEK. В каждой публикации честная маркировка: голос — ИИ, видео — ANEK., персонажи вымышлены (`content/disclosure.json`). Публиковать (push не в draft или private) — только по просьбе пользователя.
Коммиты делать в ветку (не в `main`), пушить только по просьбе.
