# Web-платформа (PWA)

**Слой:** `public/`, `shared/lib/audio-cache/*.web.ts`, `shared/ui/layout/appMaxWidth.ts`, `entities/player/lib/PlayerService/*.web.ts`, `features/web-update`, платформенные `.web.ts` по проекту
**Статус:** рабочее (dev + `expo export`), без прод-хостинга

Приложение собирается на web через Metro (`app.json` → `web.bundler: "metro"`, `web.output` не задан → SPA-режим `single`: один `index.html` + JS-бандл, клиентский роутинг expo-router). Нативные возможности, которых нет в браузере, закрыты платформенными файлами `*.web.ts` (паттерн — [`architecture.md`](../architecture.md#почему-платформенные-реализации-nativets--webts)).

## Команды

| Команда | Что делает |
| --- | --- |
| `yarn web` | Dev-сервер только для web: `EXPO_NO_METRO_LAZY=1 expo start --web` (про флаг — ниже) |
| `yarn web:build` | `expo export -p web` → `dist/` + инъекция precache-манифеста в `dist/sw.js` (`scripts/inject-sw-precache.mjs`) |
| `yarn web:preview` | `yarn web:build` + локальный статик-сервер с SPA-фолбэком (`serve -s dist -l 3000`) |

**Тестировать PWA/Service Worker** нужно из прод-сборки и **не по localhost** (SW на localhost не регистрируется намеренно — см. ниже): `yarn web:preview`, затем открыть по LAN-адресу машины (`http://<ip>:3000`).

## PWA

Кастомная HTML-оболочка — `public/index.html` (Expo при `output: single` берёт её вместо встроенного шаблона; плейсхолдеры `%WEB_TITLE%` / `%LANG_ISO_CODE%` и `<div id="root">` обязательны, скрипт бандла Expo дописывает перед `</body>`).

- `public/manifest.webmanifest` — имя, иконки, `display: standalone`, `theme_color`/`background_color` `#f16031`.
- `public/icons/*` — сгенерированы из `assets/icon.png` и `assets/adaptive-icon.png` (ImageMagick): `icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon` (180), `public/favicon.png` (48).
- `app.json` → `web`: `lang: "ru"`, `name`, `shortName`, `description` (Expo подставляет `lang`/`description` в шаблон).
- Регистрация Service Worker — инлайн-скрипт в `public/index.html`: регистрирует `/sw.js` **только не на localhost**; на localhost, наоборот, снимает возможно оставшийся с прод-прогона SW (`getRegistrations().then(unregister)`), чтобы не мешать Metro/HMR.

### Service Worker (`public/sw.js`)

Plain ES2018, без бандлера. `// @ts-check` + `/// <reference lib="webworker" />` — файл исключён из `tsconfig.json`, проверяется только редактором.

Две задачи:

1. **Версионированный precache приложения** (только прод-хосты). На этапе сборки `scripts/inject-sw-precache.mjs` (шаг `yarn web:build` после `expo export`) вписывает в `dist/sw.js` манифест всех файлов `dist/` и контентный хеш сборки (плейсхолдеры `__SW_BUILD_VERSION__` / `__SW_PRECACHE_URLS__`). `install` скачивает весь манифест в версионированный бакет `precache-v<hash>` (`cache: 'reload'` — мимо HTTP-кеша); навигации и same-origin статика отдаются **cache-first** из него, обычные открытия не ходят в сеть (runtime-fill — страховка для файлов вне манифеста). Новая сборка ставится в **новый** бакет, старый удаляется на `activate` (заодно чистится легаси `shell-cache-v1` — миграция не нужна). Обновления ищутся в фоне хуком `features/web-update` (`reg.update()`: интервал 60 мин + событие `online` + `visibilitychange` с троттлингом 5 мин). Обнаруженный новый SW ставится в этот бакет и **ждёт в `waiting`** (install не вызывает `skipWaiting`). Приложение показывает модалку `WebUpdateModal`: статус скачивания → «Обновить» → `SKIP_WAITING` → активация → перезагрузка страницы; «Позже» — модалка снова при следующем запуске. Простая перезагрузка без подтверждения НЕ активирует обновление (waiting-воркер не становится контроллером сам). Первая установка (нет controller) активируется сама — модалка не показывается. На localhost (`isDev`) весь этот блок отключён — оболочку отдаёт Metro.
2. **Офлайн-аудио**. `fetch` для аудио (`request.destination === 'audio'` или расширение) — из бакета `audio-cache-v1` отдаётся **только трек, закоммиченный в манифест** `__manifest__` (инвариант «в кэше ⇔ полностью скачан»); отсутствует манифест → легаси-fallback (отдать что есть); трек не закоммичен → стримится из сети (как на нативе). Для читаемых (CORS) кешей поддержана нарезка `Range` → `206`; opaque-ответы (кросс-домен без CORS) отдаются целиком. Ключ манифеста продублирован константой `AUDIO_MANIFEST_KEY` в `sw.js` (keep-in-sync).

`audio-cache-v1` **никогда не чистится** при обновлении SW (`activate` удаляет только чужие бакеты) — это скачивания пользователя. Имя бакета — константа `AUDIO_CACHE_NAME` в `openAudioCache.ts` (первоисточник, импортируется `webCacheApi.ts` и `sw.js` комментом keep-in-sync).

Операционные заметки по precache:

- Если какая-то запись манифеста перманентно отдаёт 404 (рассинхрон деплоя nginx/`dist`), `install` будет падать и часовая проверка обновления будет каждый раз перекачивать ~7.7 МБ — держать дистрибутив консистентным.
- Частично заполненный `precache-v<hash>` после неудачного `install` самоисцеляется: повторная попытка перекачивает все записи заново с `cache: 'reload'`.
- Первый визит = двойная загрузка (~страница + ~7.7 МБ прекеша) — стандартная цена precache-подхода.
- iOS Private Browsing / исчерпанная квота: Cache Storage недоступен → `install` падает → приложение остаётся онлайн-only (graceful-деградация).
- Мульти-таб: каждый таб детектит и подтверждает обновление независимо; после активации в одном табе другой продолжает старый код, и его «Обновить» → прямой reload (waiting уже нет).
- Rollback работает: версия content-addressed (sha256 по контенту, БЕЗ таймстемпов) — откат деплоя = переустановка старой версии. Инвариант: не добавлять в версию время сборки.
- Окно смешанных версий после `activate`: старая страница может лениво запросить `/_expo/static/media/*` со старым хешем → 404 до перезагрузки (косметика: single-bundle без lazy-chunks, кастомных шрифтов нет).
- Подтверждение обновления в одном табе активирует нового SW сразу (`clients.claim`) — другие табы в этот момент попадают в окно смешанных версий (старая страница + новый SW); воспроизведение аудио не страдает (бакет `audio-cache-v1` не трогается).
- Решение (2026-09-05): применение обновления статики — только через модалку подтверждения `features/web-update` (WebUpdateModal): новый SW ждёт в `waiting`, пользователь подтверждает → `SKIP_WAITING` → активация → перезагрузка страницы. APK-диалог по-прежнему выключен (guard `checkForUpdateAction` по `Platform.OS === 'web'`, см. [updates.md](./updates.md)); тост из `registration.waiting` не используется (модалка вместо него).

## Офлайн-кеш аудио на web

Нативный `AudioCacheService` (expo-file-system) на web не работает — Metro резолвит `./AudioCacheService` → `AudioCacheService.web.ts`. Реализация — поверх **Cache Storage API**, тот же бакет `audio-cache-v1`, что читает Service Worker.

| Файл | Роль |
| --- | --- |
| `shared/lib/audio-cache/AudioCacheService.web.ts` | Тот же публичный API, что у нативного (`isCached` / `cacheAudio` / `clearCache` / `removeFromCache` / `getCacheInfo` / `getCachedUri`). Дедуп параллельных загрузок — общий `inflightCache`. `getCachedUri` → `null` (воспроизведением занимается SW прозрачно). Скачивание делегируется `downloadAndStoreAudio` из `webCacheApi.ts` |
| `shared/lib/audio-cache/webCacheApi.ts` | Низкоуровневые операции Cache Storage + feature-detect `isCacheStorageAvailable()` + `downloadAndStoreAudio` (skip-cached → дроп stale → fetch → put → commit) |
| `shared/lib/audio-cache/openAudioCache.ts` | Recovery-хелпер открытия бакета (при сбое `caches.open` → `caches.delete` → reopen) + первоисточник `AUDIO_CACHE_NAME` |
| `shared/lib/audio-cache/webCacheManifest.ts` | Commit-манифест `__manifest__`: `hasCompleteAudio`/`commitAudioUrl`/`uncommitAudioUrl`/`ensureManifest` (сериализованный read-modify-write) |
| `shared/lib/audio-cache/webDownloadJournal.ts` | AsyncStorage-журнал активных загрузок (`audio-cache/active-downloads`, web-only) для точечной очистки орфанов |
| `shared/lib/audio-cache/cleanupOrphans.web.ts` | Стартовый sweep орфанов (незакоммиченных записей после аварийного завершения) по журналу, без перечисления бакета |
| `shared/lib/audio-cache/webAudioDownload.ts` | `fetchAudioForCache`: сначала CORS-запрос (реальный прогресс 0..1 по `Content-Length`), при отказе — opaque `no-cors` (прогресс скачет 0→1, размер неизвестен) |
| `shared/lib/audio-cache/getAudioCacheDirectory.ts` | Кидает явную ошибку при `Platform.OS === 'web'` — страховка на случай устаревшего кеша Metro (иначе загадочный `this.validatePath`) |

`BackgroundCachingService` платформенно-нейтрален и переиспользуется как есть.

### Возобновление «кешировать все» (Issue #78)

Повторный прогон скачивания плейлиста на web не перекачивает уже закешированные треки (skip-cached, паритет с нативным), повреждённый бакет `audio-cache-v1` чинится через `caches.delete` + reopen (`openAudioCache` в `webCacheApi.ts`), а неудачные скачивания не дают unhandled rejection. Орфаны после аварийного завершения (незакоммиченные записи, оставшиеся от убитого процесса) чистятся на старте по журналу активных загрузок `webDownloadJournal.ts` → `cleanupOrphans.web.ts`, **без перечисления бакета** (риск crash-loop на повреждённом iOS-бакете). Подробности и WebKit-баги (260962/305539) — [audio-cache.md](./audio-cache.md) → «Очистка осиротевших загрузок после аварийного завершения».

### Ограничение: CORS

Аудио-хост `slovo-istini.com` не отдаёт `Access-Control-Allow-Origin`. Поэтому:

- скачивание идёт **opaque-ответом**: нет прогресс-бара (скачок 0→100 %), `getCacheInfo` считает размер только по CORS-файлам, перемотка по такому кешу использует полное тело;
- `axios` (XMLHttpRequest) здесь **неприменим** — он всегда требует CORS; нужен именно `fetch(url, { mode: 'no-cors' })`.

Как только хост добавит CORS-заголовки — прогресс, размер и `Range`-нарезка заработают автоматически (ветка `mode: 'cors'` в `webAudioDownload.ts`).

## Плеер на web

`entities/player/lib/PlayerService/index.web.ts` — `WebPlayerService` поверх `HTMLAudioElement`.

- `webPlayerStubControls.ts` — веб-заглушки методов без браузерного аналога: `setLockScreenMetadata` / `reassertLockScreenMetadata` (нет MediaSession), `getVolume` / `setVolume` (громкостью владеет браузер), `getStatus` (собирается из web-стейта). Домешиваются в `playerService` через `Object.assign`.
- `webPlayerState.ts` — локальный стейт плеера **зеркалит** `isPlaying` / `isBuffering` / `position` в общие Reatom-атомы (`setIsPlayingAction` и т.д.), которые читает UI (`usePlayerState`). Без этого кнопка play/pause на web не реагировала. `duration` остаётся за `webDurationWriter`. Аналог на нативе — status-листенеры expo-audio.

## Десктопный layout

`shared/ui/layout/appMaxWidth.ts` — `APP_MAX_CONTENT_WIDTH = 600` (только `Platform.OS === 'web'`, на нативе `undefined` → всё как было) + `getColumnSideInset(screenWidth, minInset)` (помечен `'worklet'` — используется и в reanimated-ворклете).

На широких вьюпортах в центрированную колонку 600 px убираются:

- таб-бар (`widgets/tab-bar/ui/styles.ts` → `floatingIsland`);
- свёрнутый мини-плеер (`ExpandablePlayer/miniStyles.ts`, принимает `screenWidth`);
- свёрнутая геометрия `ContainerView` — только эндпоинт `progress→0` в `getRestingContainerStyle.ts` и ворклете `useExpandAnimation.ts` (полноэкранный вид `progress→1` не тронут);
- в полноэкранном плеере — ряд с тремя точками (`expandedLayoutStyles.trackInfoRow`) и блок кнопок (`expandedControlsStyles.controlsArea`). Прогресс-бар и `HeaderOverlay` остаются на всю ширину.

## Скроллбары

- `PlayerMenu.styles.ts` → `menuWrapper` использует `overflow: 'hidden'` (не `'scroll'` — на web `'scroll'` даёт постоянные пустые скроллбары по обеим осям).
- Тема скроллбаров — глобальный CSS в `public/index.html` (`::-webkit-scrollbar*` + `scrollbar-width`/`scrollbar-color`) на CSS-переменных `--sp-scrollbar-thumb` / `--sp-scrollbar-thumb-hover`. `ThemeProvider` (web-only эффект) прокидывает в них цвета активной темы (`textMuted` / `text`), так что при переключении светлая/тёмная скроллбар перекрашивается. Фолбэк — нейтральный серый (SSG / до JS).

## Обходной путь: Metro lazy-bundling

Dev-бандл web (`lazy=true`) падал с `Requiring unknown module "2405"` на `import('expo-notifications')` в `shared/lib/notifications/ensureNotifications.ts` (единственный динамический импорт в проекте) — известный баг Metro на web: async-чанк отдаётся без запрошенного модуля.

Два слоя защиты:

1. `shared/lib/notifications/ensureNotifications.web.ts` — на web сразу `Promise.resolve(null)`, `expo-notifications` не грузится вовсе (на web он и так не работает — только warn'ы про push-токены). Убирает единственный `import()` из web-графа.
2. `yarn web` = `EXPO_NO_METRO_LAZY=1 expo start --web` — выключает ленивый бандлинг для web целиком. `yarn start` (натив) не тронут; `expo export` и так `lazy: false`.

## Деплой

Приложение деплоится как ещё одно `slovo-*`-приложение на VPS, по образцу `slovo-frontend`/`slovo-docs` из `slovo-propovedi-playbook` (см. `docs/migration-2026-08-vps.md` там): **инфру** (Docker, buildx-билдер `slovo-constrained`, юзер `slovo`, Traefik) ставит и держит плейбук, а **сам деплой** — Forgejo Actions по тегу `v*`, без образа в registry (сборка на VPS через buildx).

- `Dockerfile` + `nginx.conf` (в корне репозитория) — nginx отдаёт `dist/`. SPA-фолбэк `try_files $uri $uri/ /index.html` (решает 404 на перезагрузке `/listen` и т.п. при `web.output: single`), отдельные правила для `/sw.js` (`no-cache`), `/manifest.webmanifest` (MIME) и `location = /index.html` (`no-cache` — SPA-оболочку нужно всегда ревалидировать: эвристически закешированный `index.html` мог бы сослаться на старый хешированный бандл и сломать precache, см. заметки выше), долгий кэш для хешированных `/_expo/`. Локации `/sw.js`, `/_expo/` и `/index.html` объявляют собственные `add_header`, поэтому дополнительно отдают полный набор security-заголовков (CSP и др.) — nginx не наследует их из server-уровня в такие локации.
- `scripts/vps-deploy-web.sh` — идемпотентный self-provisioning скрипт (тот же паттерн, что `slovo-propovedi-docs/scripts/vps-deploy.sh`): создаёт Docker-сеть, собирает образ через buildx **на VPS**, пишет systemd-юнит `slovo-web.service` + файл Traefik-лейблов (`Host(WEB_HOSTNAME)`, resolver `default`, entrypoint `web-secure`), рестартует сервис. При отсутствующем Traefik поднимает его сам (нужен `ACME_EMAIL`) — на хосте, где уже стоит `slovo-docs`, просто переиспользует существующий `slovo-traefik.service` и сеть `traefik`.
- `.forgejo/workflows/release.yml` — job `web` (`needs: create-release`, независим от job `android`): `yarn web:build` → zip в ассет релиза → (если настроены секреты) `tar`+`ssh` переносит `dist/`+`Dockerfile`+`nginx.conf` в `/slovo/web/container-src` → запускает `vps-deploy-web.sh` по SSH. Инъекция precache-манифеста живёт внутри `web:build`, поэтому CI не менялся; nginx уже отдаёт `/sw.js` с `no-cache` — браузер всегда видит свежий SW.
- Нужные секреты/переменные Forgejo-репозитория: `VPS_SSH_PRIVATE_KEY`, `VPS_HOST`, `VPS_SSH_USER`, `ACME_EMAIL` (secrets, общие с docs/backend-деплоем) + `WEB_HOSTNAME` (repo variable, домен). Без них шаг деплоя пропускается с warning'ом — zip в релиз всё равно попадает.
- Локальная проверка сборки без деплоя: `yarn web:preview` (`serve -s`, SPA-фолбэк).

Альтернатива для глубоких ссылок — `web.output: "static"` (Expo генерирует по HTML-файлу на маршрут, `dist/listen/index.html` и т.д., работает на любом статик-хосте без `try_files`), но требует переноса кастомизации `<head>` из `public/index.html` в `app/+html.tsx` и проверки SSG-рендера каждого маршрута — не сделано, текущий `nginx.conf` с `try_files` достаточен.

## Связанные документы

- [audio-cache.md](./audio-cache.md) — нативный кеш аудио
- [theme.md](./theme.md) — тема и цвета
- [player.md](./player.md) — плеер
- [architecture.md](../architecture.md) — паттерн `.web.ts`
- [decisions.md](../decisions.md) — решения по web
