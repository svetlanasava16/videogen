# Проект: эксперименты с генерацией видео через локальный ComfyUI

## Окружение (Mac, Apple M4, 16 ГБ общей памяти, PyTorch на MPS)
- ComfyUI Desktop: http://127.0.0.1:8188 (установка в `~/ComfyUI-Installs/ComfyUI`)
- Модели: `~/ComfyUI-Shared/models/` (общая папка для всех установок ComfyUI)
- Вход ComfyUI: `~/ComfyUI-Shared/input/`, выход: `~/ComfyUI-Shared/output/`
- Локальная LLM: Ollama, модель `qwen3.5:4b` (http://127.0.0.1:11434). Можно использовать для черновиков промптов.
- Python: системный `python3` (3.9), скрипт работает без сторонних библиотек.
- Файлы `*.part` в папке моделей ещё качаются. Пока скачивание не закончено, такие модели не трогать и не перемещать.

## Файлы проекта
- `comfy_client.py` — очередь шотов (только stdlib)
- `workflow_api.json` — workflow, экспортированный из ComfyUI в API-формате (Workflow → Export (API))
- `shots.json` — список шотов
- `out/<shot_id>/` — результаты, `out/report.json` — статус каждого шота
- `assets/` — исходные картинки для img2video / первый-последний кадр

## Команды
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

## Как работать
- Перед первым запуском нового workflow выполни `check`, затем `nodes`, и заполни `params` по реальным ID нод.
- Генерируй шоты последовательно, одной очередью (16 ГБ памяти, параллельные шоты не поместятся).
- После запуска читай `out/report.json`. Упавший при выполнении шот скрипт сам перезапускает с другим seed (`retries`).
  Если сервер отклонил workflow (ошибка валидации) или кончилась память (OOM на MPS), другой seed не поможет. В этом случае разберись в причине и сообщи мне.
- Разрешение, длительность (число кадров), fps, число шагов и модель без моего согласия не менять.
- Промпты пиши на английском, если не попрошу иначе. Сценарий и обсуждение ведём на русском.
- Не удаляй файлы в `out/` и в `~/ComfyUI-Shared/`. Перегенерация с `--force` перезаписывает только отчёт, файлы получают новые имена.
