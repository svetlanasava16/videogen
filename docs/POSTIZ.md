# Postiz: настройка публикации ANEK.

Postiz сам публикует посты, а мы управляем им из `pnpm posts` через его Public API. Всё, что опубликовано, и метрики пишутся в нашу базу (`anek-db`).
Пока всё запускается локально на Маке (`infra/docker-compose.yml`). Чтобы переехать на сервер, перенесите папку `infra/` и файл `infra/.env`.

> Место на диске: образы Postiz, Temporal и Elasticsearch занимают ~4 ГБ, данные растут вместе с загрузками.
> Мак не должен засыпать в часы публикаций (Настройки → Аккумулятор → не уходить в сон при подключении к сети).

## 0. Что нужно от вас (я не создаю аккаунты и не ввожу пароли)

| Что | Зачем |
|---|---|
| Домен, подключённый к Cloudflare (например `anek.example`) | OAuth соцсетей требует постоянный HTTPS-адрес. TikTok забирает видео по публичной ссылке с подтверждённого домена |
| Cloudflare Tunnel (Zero Trust → Networks → Tunnels → Create → Docker) | Даёт HTTPS к Маку без открытых портов. Токен запишите в `CLOUDFLARE_TUNNEL_TOKEN` |
| Аккаунты площадок на каждый язык | YouTube-канал, TikTok, Instagram professional (Business или Creator), Threads — для ru, en и de |
| Developer-приложения (разделы ниже) | Ключи записываются в `infra/.env` |

В туннеле добавьте два Public Hostname:
- `postiz.<домен>` → `http://postiz:5000`
- `<домен>` → `http://anek-site:80` (главная, `/privacy.html`, `/terms.html`)

## 1. Запуск

```bash
cp infra/.env.example infra/.env
```

Заполните в `infra/.env`:
- `POSTIZ_URL=https://postiz.<домен>`;
- `POSTIZ_DB_PASSWORD` и `JWT_SECRET` — случайные строки;
- `CLOUDFLARE_TUNNEL_TOKEN`.

Затем запустите Postiz вместе с туннелем:

```bash
docker compose -f infra/docker-compose.yml --profile postiz --profile tunnel up -d
```

Дальше:
1. Откройте `https://postiz.<домен>` и зарегистрируйте свой аккаунт.
2. Поставьте `DISABLE_REGISTRATION=true` и перезапустите `postiz`.
3. Settings → Public API → создайте ключ и запишите его в корневой `.env` проекта:
   ```
   POSTIZ_API_URL=https://postiz.<домен>/api/public/v1
   POSTIZ_API_KEY=<ключ>
   ```

Redirect URI для всех площадок: `https://postiz.<домен>/integrations/social/<provider>`. `<provider>` — это `youtube`, `tiktok`, `instagram`, `instagram-standalone`, `threads`, `x` или `vk`.

## 2. YouTube (`YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`)

1. Создайте проект в Google Cloud Console и включите **YouTube Data API v3**, **YouTube Analytics API** и **YouTube Reporting API**.
2. OAuth consent screen: тип External, добавьте себя в Test users.
3. Credentials → OAuth client ID → Web application, Redirect URI `…/integrations/social/youtube`.
4. Если канал — Brand Account: в Google Workspace пометьте приложение как Trusted (применяется ~5 ч).

Ограничения:
- Пока API-проект не прошёл аудит Google, загрузки остаются **приватными**. Подайте форму YouTube API Services Audit сразу.
- Квота 10 000 единиц в день, загрузка стоит ~1600 — это около 6 видео в день на проект.

## 3. TikTok (`TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`)

1. На developers.tiktok.com создайте приложение и добавьте **Login Kit** и **Content Posting API**, включите Direct Post.
2. Укажите ссылки Terms и Privacy: `https://<домен>/terms.html`, `https://<домен>/privacy.html`.
3. Подтвердите домен `postiz.<домен>` (URL prefix) — с него TikTok забирает видео.
4. Scopes: `user.info.basic`, `user.info.profile`, `video.create`, `video.upload`, `video.publish`.
5. Redirect URI `…/integrations/social/tiktok`.

Ограничения:
- До аудита все посты публикуются как **SELF_ONLY**, приложение доступно максимум 5 пользователям, а их аккаунты должны быть приватными. Подавайте на аудит сразу.

## 4. Instagram (Reels и Stories) и Threads

Одно Meta-приложение (developers.facebook.com → Create App → Business).

- **Instagram** — один из двух вариантов:
  - **Через Facebook** (`FACEBOOK_APP_ID/SECRET`): Instagram Business или Creator, привязанный к странице Facebook. Provider `instagram`.
  - **Standalone** (`INSTAGRAM_APP_ID/SECRET`): профессиональный аккаунт без страницы. Provider `instagram-standalone`.
- **Threads** (`THREADS_APP_ID/SECRET`): добавьте продукт Threads API с разрешением `threads_content_publish`, пригласите свой аккаунт тестером и примите приглашение в самом Threads.
- В приложении укажите Privacy Policy URL `https://<домен>/privacy.html`.
- До App Review публикуют только тестеры приложения — для своих аккаунтов этого хватит.

## 5. Позже: X и VK

- **X** (`X_API_KEY`, `X_API_SECRET`):
  - тип приложения **Native App**, права Read + Write;
  - в профиле включить метку «Automated» и указать оператора — это правила X для ботов;
  - на бесплатном тарифе мало постов в месяц;
  - один и тот же анекдот не публикуется на нескольких аккаунтах.
- **VK** (`VK_ID`): VK ID OAuth. Метрик через Postiz нет, их будем брать из VK API напрямую.

## 6. Связать аккаунты с базой

В Postiz подключите каналы (Add channel), затем:

```bash
pnpm posts accounts
```

Команда показывает интеграции Postiz и подставляет их id в `content/accounts.json` по `platform` и `handle`. Аккаунты, которые нужны, включите: `"active": true`, затем выполните `pnpm db sync`.

## 7. Маркировка (обязательно)

- Каждая подпись заканчивается текстом из `content/disclosure.json` для своего языка: голос — ИИ, видео — ANEK., персонажи вымышлены, совпадения случайны, без намерения задеть чувства верующих. Финальная карточка в видео повторяет короткую версию.
- Флаги ИИ ставятся по API:
  - YouTube `made_with_ai` → `containsSyntheticMedia`;
  - TikTok `video_made_with_ai` → `is_aigc`.
- Для Instagram и Threads Postiz флагов не передаёт, там маркировка остаётся текстом в подписи.
- Частота: 1–3 видео в день на канал с разбросом времени. Подряд не ставим одинаковых кукол и фоны: у YouTube с июля 2025 есть правило «inauthentic content».
- Русский пул: анекдоты про религиозных персонажей и святыни не публикуем (ст. 148 УК РФ). Если у страницы VK больше 10 000 подписчиков, её нужно зарегистрировать в РКН.
