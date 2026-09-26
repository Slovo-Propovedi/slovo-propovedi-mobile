# Web-платформа (PWA)

**Слой:** `public/`, `shared/lib/audio-cache/*.web.ts`, `shared/ui/layout/appMaxWidth.ts`, `entities/player/lib/PlayerService/web/*`, `features/web-update`, платформенные `.web.ts` по проекту
**Статус:** рабочее (dev + `expo export`), без прод-хостинга

Приложение собирается на web через Metro (`app.config.ts` → `web.bundler: "metro"`, `web.output` не задан → SPA-режим `single`: один `index.html` + JS-бандл, клиентский роутинг expo-router). Нативные возможности, которых нет в браузере, закрыты платформенными файлами `*.web.ts` (паттерн — [`architecture.md`](../architecture.md#почему-платформенные-реализации-nativets--webts)).

## Команды

| Команда | Что делает |
| --- | --- |
| `yarn web` | Dev-сервер только для web: `EXPO_NO_METRO_LAZY=1 expo start --web` (про флаг — ниже) |
| `yarn web:build` | `expo export -p web` → `dist/` + инъекция precache-манифеста в `dist/sw.js` (`scripts/inject-sw-precache.mjs`) |
| `yarn web:preview` | `yarn web:build` + локальный статик-сервер с SPA-фолбэком (`serve -s dist -l 4173`) |

**Тестировать PWA/Service Worker** нужно из прод-сборки и **не по localhost** (SW на localhost не регистрируется намеренно — см. ниже): `yarn web:preview`, затем открыть по LAN-адресу машины (`http://<ip>:4173`).

## PWA

Кастомная HTML-оболочка — `public/index.html` (Expo при `output: single` берёт её вместо встроенного шаблона; плейсхолдеры `%WEB_TITLE%` / `%LANG_ISO_CODE%` и `<div id="root">` обязательны, скрипт бандла Expo дописывает перед `</body>`).

- `public/manifest.webmanifest` — имя, иконки, `display: standalone`, `theme_color`/`background_color` `#f16031`.
- `public/icons/*` — сгенерированы из `assets/icon.png` и `assets/adaptive-icon.png` (ImageMagick): `icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon` (180), `public/favicon.png` (48).
- `app.config.ts` → `web`: `lang: "ru"`, `name`, `shortName`, `description` (Expo подставляет `lang`/`description` в шаблон).
- Регистрация Service Worker — инлайн-скрипт в `public/index.html`: регистрирует `/sw.js` **только не на localhost**; на localhost, наоборот, снимает возможно оставшийся с прод-прогона SW (`getRegistrations().then(unregister)`), чтобы не мешать Metro/HMR.

### Перехват ссылок в установленное PWA

Поведение платформенное — флага манифеста для него нет (`capture_links` / `url_handlers` / `handle_links` — мёртвые proposals, не использовать).

- **Android Chrome.** Установленное PWA (WebAPK) само перехватывает in-scope ссылки `app.slovo-propovedi.ru` — и из других приложений, и из вкладки Chrome. Единственное исключение: пока нативное Android-приложение держит verified App Links для домена (Android допускает один verified-обработчик на домен), тапы вне браузера открывает оно; пользователь может переназначить обработчик в настройках «Открывать по умолчанию» (см. [deep-links.md](./deep-links.md)).
- **Desktop Chrome 139+.** In-scope ссылки из вкладки браузера открываются в окне установленного PWA; `launch_handler` ниже заставляет навигацию переиспользовать существующее окно приложения (переход сразу на нужный экран), а ссылки из сторонних десктоп-приложений по-прежнему открывают браузер. Поведение документировано на developer.chrome.com.
- **iOS.** Перехвата нет вообще — все тапы открываются в Safari независимо от установки домашнего веб-приложения.

Члены манифеста:

- `id: "/"` — стабильная идентичность приложения (совпадает с вычисленной ранее из `start_url`, переустановка не требуется);
- `launch_handler: { client_mode: "navigate-existing" }` — навигация переиспользует уже открытое окно PWA.

`public/manifest.webmanifest` нельзя переименовывать или переносить: Chrome привязывает обновления установленного приложения к пути манифеста.

### Service Worker (`public/sw.js`)

Plain ES2018, без бандлера. `// @ts-check` + `/// <reference lib="webworker" />` — файл исключён из `tsconfig.json`, проверяется только редактором.

Две задачи:

1. **Версионированный precache приложения** (только прод-хосты). На этапе сборки `scripts/inject-sw-precache.mjs` (шаг `yarn web:build` после `expo export`) вписывает в `dist/sw.js` манифест всех файлов `dist/` и контентный хеш сборки (плейсхолдеры `__SW_BUILD_VERSION__` / `__SW_PRECACHE_URLS__`). `install` скачивает весь манифест в версионированный бакет `precache-v<hash>` (`cache: 'reload'` — мимо HTTP-кеша); навигации и same-origin статика отдаются **cache-first** из него, обычные открытия не ходят в сеть (runtime-fill — страховка для файлов вне манифеста). Новая сборка ставится в **новый** бакет, старый удаляется на `activate` (заодно чистится легаси `shell-cache-v1` — миграция не нужна). Обновления ищутся в фоне хуком `features/web-update` (`reg.update()`: интервал 60 мин + событие `online` + `visibilitychange` с троттлингом 5 мин). Обнаруженный новый SW ставится в этот бакет и **ждёт в `waiting`** (install не вызывает `skipWaiting`). Приложение показывает модалку `WebUpdateModal`: статус скачивания → «Обновить» → `SKIP_WAITING` → активация → перезагрузка страницы; «Позже» — модалка снова при следующем запуске. Простая перезагрузка без подтверждения НЕ активирует обновление (waiting-воркер не становится контроллером сам). Первая установка (нет controller) активируется сама — модалка не показывается. На localhost (`isDev`) весь этот блок отключён — оболочку отдаёт Metro.
2. **Офлайн-аудио**. `fetch` для аудио (`request.destination === 'audio'` или расширение) — из бакета `audio-cache-v1` отдаётся **только трек, закоммиченный в манифест** `__manifest__` (инвариант «в кэше ⇔ полностью скачан»); отсутствует манифест → легаси-fallback (отдать что есть); трек не закоммичен → стримится из сети (как на нативе). Для читаемых (CORS) кешей поддержана нарезка `Range` → `206`; opaque-ответы (кросс-домен без CORS) отдаются целиком. Ключ манифеста продублирован константой `AUDIO_MANIFEST` в `sw.js` (keep-in-sync).

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
| `shared/lib/audio-cache/webCacheApi.ts` | Низкоуровневые операции Cache Storage + feature-detect `isCacheStorageAvailable()` + `hasCompleteAudio` + `downloadAndStoreAudio` (skip-cached → дроп stale → fetch → put → commit) |
| `shared/lib/audio-cache/openAudioCache.ts` | Recovery-хелпер открытия бакета (при сбое `caches.open` → `caches.delete` → reopen) + первоисточник `AUDIO_CACHE_NAME` |
| `shared/lib/audio-cache/webCacheManifest.ts` | Commit-манифест `__manifest__`: `commitAudioUrl`/`uncommitAudioUrl`/`ensureManifest` (сериализованный read-modify-write) |
| `shared/lib/audio-cache/webDownloadJournal.ts` | AsyncStorage-журнал активных загрузок (`audio-cache/active-downloads`, web-only): записи `{ url, sessionId, lastSeenAt }` + heartbeat (10с) для multi-tab-безопасной очистки орфанов |
| `shared/lib/audio-cache/cleanupOrphans.web.ts` | Стартовый sweep орфанов (незакоммиченных записей после аварийного завершения) по журналу, без перечисления бакета |
| `shared/lib/audio-cache/webAudioDownload.ts` | `fetchAudioForCache`: сначала CORS-запрос (реальный прогресс 0..1 по `Content-Length`), при отказе — opaque `no-cors` (прогресс скачет 0→1, размер неизвестен) |
| `shared/lib/audio-cache/getAudioCacheDirectory.ts` | Кидает явную ошибку при `Platform.OS === 'web'` — страховка на случай устаревшего кеша Metro (иначе загадочный `this.validatePath`) |

`BackgroundCachingService` платформенно-нейтрален и переиспользуется как есть.

### Возобновление «кешировать все» (Issue #78)

Повторный прогон скачивания плейлиста на web не перекачивает уже закешированные треки (skip-cached, паритет с нативным), повреждённый бакет `audio-cache-v1` чинится через `caches.delete` + reopen (`openAudioCache` в `webCacheApi.ts`), а неудачные скачивания не дают unhandled rejection. Орфаны после аварийного завершения (незакоммиченные записи, оставшиеся от убитого процесса) чистятся на старте по журналу активных загрузок `webDownloadJournal.ts` → `cleanupOrphans.web.ts`, **без перечисления бакета** (риск crash-loop на повреждённом iOS-бакете). Журнал multi-tab-безопасен: свежие записи (heartbeat `lastSeenAt` < 60с) не трогаются, stale-записи режутся точечно по манифесту. Подробности и WebKit-баги (260962/305539) — [audio-cache.md](./audio-cache.md) → «Очистка осиротевших загрузок после аварийного завершения».

### Ограничение: CORS

Аудио-хост `slovo-istini.com` не отдаёт `Access-Control-Allow-Origin`. Поэтому:

- скачивание идёт **opaque-ответом**: нет прогресс-бара (скачок 0→100 %), `getCacheInfo` считает размер только по CORS-файлам, перемотка по такому кешу использует полное тело;
- `axios` (XMLHttpRequest) здесь **неприменим** — он всегда требует CORS; нужен именно `fetch(url, { mode: 'no-cors' })`.

Как только хост добавит CORS-заголовки — прогресс, размер и `Range`-нарезка заработают автоматически (ветка `mode: 'cors'` в `webAudioDownload.ts`).

## Плеер на web

`entities/player/lib/PlayerService/index.web.ts` — `WebPlayerService` поверх `HTMLAudioElement`.

- `web/playerStubControls.ts` — веб-заглушки методов без браузерного аналога: `getVolume` / `setVolume` (громкостью владеет браузер), `getStatus` (собирается из web-стейта). Домешиваются в `playerService` через `Object.assign`.
- `web/mediaSession.ts` (+ `web/mediaSessionSeek.ts`, `web/mediaSessionState.ts`) — **Media Session API**: `setLockScreenMetadata` / `reassertLockScreenMetadata` / `clear` + `updatePlaybackState` / `updatePositionState`. Метаданные (название/художник/обложка через `MediaMetadata.artwork`) и элементы управления (play/pause/seekto/seekforward/seekbackward) видны в системном медиа-UI браузера (Chrome/Edge: popup с клавиатурными медиа-кнопками и hardware media keys). Обработчики действий вызывают методы `WebPlayerService` (`pause`/`play`/`seekTo`); `updatePositionState` пишет `duration`/`position`/`playbackRate` для прогресс-бара. Портировано из `expo-audio`'s `MediaSessionController.web.js`, не импортирует внутренности expo-audio. Позиция обновляется из событий `play`/`pause`/`timeupdate`/`durationchange` через `web/audioHandlers.ts`, а также напрямую из `seekTo`/`setPlaybackRate`/`setMetadata`. Нет слушателя `seeked`; `ended` не обновляет позицию. Все вызовы Media Session обёрнуты в try-catch (поддерживается не всеми браузерами; косметика не должна ронять воспроизведение).
- `web/playerState.ts` — локальный стейт плеера **зеркалит** `isPlaying` / `isBuffering` / `position` в общие Reatom-атомы (`setIsPlayingAction` и т.д.), которые читает UI (`usePlayerState`). Без этого кнопка play/pause на web не реагировала. `duration` остаётся за `webDurationWriter`. Аналог на нативе — status-листенеры expo-audio.
- `web/interruptionResume.ts` (+ `web/visibilityWatcher.ts`) — восстановление позиции после iOS-прерывания (Issue #106): снапшот позиции (`noteLivePosition`/`noteExplicitPosition`/`reset`, guard 1с), `maybeRestore` из `play()` и visibility-колбэка, одноразовый `loadedmetadata`-ретрай при `readyState === 0`, flush `max(currentTime, snapshot)`; `web/mediaSession.reassert()` перерегистрирует media-session-хендлеры при возврате на вкладку. Pending-`loadedmetadata`-ретрай отменяется явным seek/`reset` — легитимный переход к 0 не перебивается. Подробнее — [player.md](./player.md) → «Web-прерывание: восстановление позиции (Issue #106)».

### Клавиатура полноэкранного плеера (web)

`usePlayerKeyboardSeek` (`widgets/expandable-player/ui/FullscreenContent/usePlayerKeyboardSeek.ts`) — web-only клавиатурное управление полноэкранным плеером. Гейты: `Platform.OS === 'web'` + `isPlayerExpandedAtom` (развёрнутый вид). Слушатели `keydown`/`keyup`/`blur` на `window` (стрелки и Space); `Escape` — слой в общем стеке Escape (см. ниже). Хендлеры инжектятся пропсами (`tapSeek`/`startSeek`/`stopSeek` из `useSeekControls`, `togglePlay` из `useGuardedTogglePlay`, `collapsePlayer` — тот же `handleCollapsePress`, что у кнопки-шеврона). Чистые DOM-guards вынесены в `keyboardTargetGuards.ts`; предикат модификаторов `hasModifier` — общий из `shared/lib/escape-key`.

Карта клавиш:

- **`ArrowLeft`/`ArrowRight`** — тап: перемотка ±10с (`tapSeek`); удержание ≥ 500мс (`KEY_HOLD_DELAY_MS`) — long-press-перемотка (`startSeek`, как у экранных кнопок); `keyup`/`blur` останавливают (`stopSeek`). Смена направления при удержании останавливает текущий жест и начинает новый.
- **`Space`** — play/pause (`togglePlay`).
- **`Escape`** — сворачивание плеера (`collapsePlayer`): если открыт оверлей «Подробнее» — сначала закрывает его, иначе если открыта шторка плейлиста — закрывает её, иначе сворачивает плеер (та же цепочка, что у кнопки-шеврона). Обрабатывается слоем в общем стеке Escape (см. ниже); `preventDefault()` — чтобы браузер не выходил из нативного fullscreen.
- **Общий стек Escape (`shared/lib/escape-key`)** — все web-потребители Esc (модалка `shared/ui/modal.tsx`, диалоги `ConfirmDialog`/`ErrorDialog` (`shared/ui/confirm-dialog`, `shared/ui/error-dialog`), дропдаун `AnchoredDropdown` и контекстное меню трека `MenuDropdown` (`shared/ui/menu`), полноэкранный плеер, поиск `SearchBar`) регистрируют слои через `useEscapeKey({ enabled, onEscape })`. Стек работает по LIFO: Esc закрывает слой, открытый **последним** (полноэкранный плеер + поиск → сначала поиск, потом плеер; модалка поверх → сначала модалку). Один capture-слушатель `keydown` на `document` (`{ capture: true }`) диспатчит событие **только верхнему** слою и вызывает `stopPropagation()` — нижележащие слои и bubble-слушатели события не видят. Слушатель живёт, пока стек непуст (первый слой вешает, последний снимает). Модификаторы (ctrl/meta/alt/shift) не перехватываются. На нативе — no-op (гейт `Platform.OS === 'web'`); модалку на нативе закрывает hardware-back через `onRequestClose` — изменений нет.
- **`Escape` в поиске** — `SearchBar` (`features/sermon-search`, web-only): при непустом запросе очищает поле и **оставляет поиск открытым** (фокус сохраняется); при пустом запросе закрывает поиск целиком (та же цепочка, что у кнопки «✕»). Слой регистрируется при `Platform.OS === 'web' && isSearchOpenAtom`. Capture-слушатель на `document` видит событие **раньше** инпута, поэтому работает и с фокусом на поле, и без него — отдельный input-scoped `onKeyPress` не нужен. Модалка поверх поиска выигрывает: её слой открыт позже и получает Esc первым. Модификаторы (ctrl/meta/alt/shift) не перехватываются. На нативе поведение не меняется (гейт `Platform.OS === 'web'`).

Общие гейты:

- **OS auto-repeat** (`event.repeat`) игнорируется — непрерывную перемотку ведёт hold-таймер.
- **Модификаторы** (`ctrl`/`meta`/`alt`/`shift`) не перехватываются — не ломаем браузерные шорткаты (Ctrl+ArrowLeft — назад, Ctrl+Space и т.д.).
- **Editable-таргеты** (`INPUT`/`TEXTAREA`/`contentEditable`) не перехватываются — стрелки работают в полях ввода, Esc не сворачивает плеер при вводе.
- **Space на интерактивных таргетах** (`BUTTON`/`A`/`INPUT`/`TEXTAREA`/`SELECT`/интерактивный `role`/`contentEditable`) пропускается — сфокусированная кнопка активируется нативным Space, иначе было бы двойное срабатывание.
- `preventDefault()` на стрелках — чтобы страница не скроллилась при перемотке; на `Escape` — чтобы браузер не выходил из нативного fullscreen.

Экранные кнопки Next/Prev не затронуты: тап по-прежнему переключает трек, long-press — перемотка.

**Фокусируемость средней области:** кликабельная средняя область полноэкранного плеера (`PlayerMiddleArea` → `Pressable styles.spacer`, а также backdrop оверлея «Подробнее» в `DetailsOverlay`) получает `tabIndex={-1}` — не попадает в Tab-навигацию, но остаётся кликабельной мышью/тачем. RNW-деталь: `focusable={false}` на `Pressable` **не работает** — `Pressable` всегда прокидывает явный `tabIndex` (0 по умолчанию), который в `createDOMProps` выигрывает у `focusable`; поэтому используется именно `tabIndex={-1}`.

**Backdrop'ы модалок/дропдаунов не фокусируются:** backdrop'ы `shared/ui/modal.tsx`, `AnchoredDropdown` (`shared/ui/menu`) и `PlayerMenu` получают `tabIndex={-1}` — не попадают в Tab-навигацию, но остаются кликабельными мышью/тачем; закрытие — Esc или тап.

**Настоящие `<button>` для Vimium-хинтов:** интерактивные элементы без явного `accessibilityRole` RNW рендерит как `<div tabindex="0">` — Vimium `f`-хинты их не видят. Поэтому таб-бар (`TabButton`), ⋮-меню шапок (offline/history/playlist), контролы очереди («Воспроизвести все»/«Перемешать»), офлайн-баннер, мини-плеер (кнопка play/pause), кнопка «✕» в оверлее «Подробнее» и строки меню плейлиста (`PlaylistMenuRow` → `PressableButton`) получают `accessibilityRole='button'` и рендерятся как настоящие `<button type="button">`. Backdrop'ы модалок/дропдаунов остаются role-less осознанно (см. [architecture.md](../architecture.md)).

**Контейнер с вложенными кнопками (web):** если кликабельный контейнер сам содержит настоящую `<button>` (ряд мини-плеера — play/pause; строка трека — меню «три точки»), на web внешний контейнер рендерится как `<div role="link" tabindex=0>` (`accessibilityRole='link'`; RNW мапит `link` только в ARIA-атрибут, `<a>` не создаётся) — иначе `<button>` окажется внутри `<button>`, что невалидно и даёт React-ошибку «`<button>` cannot be a descendant of `<button>`». Паттерн задан в `TracksListItemBase` (`ROW_ACCESSIBILITY_ROLE`), тем же константным паттерном пользуется ряд `MiniPlayer` (`ROW_ACCESSIBILITY_ROLE`); на нативе контейнер остаётся `button`. Подробнее о строке — [track-list.md](./track-list.md).

### Патч RNGH: `setPointerCapture` / `releasePointerCapture` на web

`patches/react-native-gesture-handler+2.32.0.patch` оборачивает вызовы `target.setPointerCapture(pointerId)` и `target.releasePointerCapture(pointerId)` в `PointerEventManager` (обе сборки: `lib/module/` — web, `lib/commonjs/` — main-фолбэк) в try/catch. Защищены все три call-site'а: `pointerDownCallback` (set), `pointerUpCallback` (release) и `pointerMoveCallback` (set). Без этого клик по кнопке внутри `GestureDetector` (весь полноэкранный плеер обёрнут в `Gesture.Pan()`, поэтому триггерится на любой клик) ронял в консоль:

```
Web ERROR [NotFoundError: Failed to execute 'releasePointerCapture' on 'Element': No active pointer with the given id is found.]
pointerUpCallback (node_modules/react-native-gesture-handler/lib/module/web/tools/PointerEventManager.js:61)
```

Причина — stale/synthetic pointer id: к моменту обработки события указатель уже не активен (быстрый клик), либо события синтетические — браузерные расширения вроде Vimium (`f`-хинты) диспатчат pointer-события без активного OS-указателя, и браузер кидает `NotFoundError`. Потеря capture косметическая — RNGH продолжает работать через per-element tracking. Патч применяется `postinstall: patch-package` (web-сборка резолвит `lib/module/` через mainFields `['browser', 'module', 'main']`). **Убрать патч, когда RNGH выпустит версию с апстрим-guard'ом** (см. [`../debt.md`](../debt.md)).

## Десктопный layout

`shared/ui/layout/appMaxWidth.ts` — `APP_MAX_CONTENT_WIDTH = 600` (только `Platform.OS === 'web'`, на нативе `undefined` → всё как было) + `getColumnSideInset(screenWidth, minInset)` (помечен `'worklet'` — используется и в reanimated-ворклете).

На широких вьюпортах в центрированную колонку 600 px убираются:

- таб-бар (`widgets/tab-bar/ui/styles.ts` → `floatingIsland`);
- свёрнутый мини-плеер (`ExpandablePlayer/miniStyles.ts`, принимает `screenWidth`);
- свёрнутая геометрия `ContainerView` — только эндпоинт `progress→0` в `getRestingContainerStyle.ts` и ворклете `useExpandAnimation.ts` (полноэкранный вид `progress→1` не тронут);
- в полноэкранном плеере — ряд с тремя точками (`expandedLayoutStyles.trackInfoRow`) и блок кнопок (`expandedControlsStyles.controlsArea`). Прогресс-бар и `HeaderOverlay` остаются на всю ширину.

## Позиционирование меню (дропдауны) на web

Все «якорные» меню — ⋮-меню шапок (offline/history/playlist), контекст-меню строки трека (`TracksListItemContextMenu`) — рендерятся в прозрачном `Modal` (`shared/ui/menu/AnchoredDropdown`). На web RNW-`Modal` — это **viewport-fixed** портал (позиционируется относительно окна браузера, не документа). Отсюда два требования:

1. **Якорь измеряется в viewport-координатах через `measureInWindow()`**, а не через `measure()`. На web `measure()` возвращает page-координаты (относительно документа, со сдвигом на скролл) — на прокрученной странице меню улетало бы на величину скролла. На нативе pageX/pageY совпадают с window-координатами, поэтому баг был только на web. Паттерн: `buttonRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }))` + обёртка `<View ref={buttonRef} collapsable={false}>` (или `forwardRef` на кнопку). Так делают все шапки и `TracksListItemBase`.
2. **Позиция меню клампится в границы окна.** `computeMenuPosition` (`shared/ui/menu/computeMenuPosition.ts`) — чистая функция: выбирает «выше/ниже» якоря и клампит `top`/`right` так, чтобы меню с зазором `gap` (4 px) никогда не вылезало за вьюпорт (узкие окна, высокие меню, якорь у края). Ширина окна берётся из `useWindowDimensions` — при ресайзе окна с открытым меню позиция пересчитывается реактивно.

`PlayerMenu` (полноэкранный плеер) и `SearchSuggestions` (поиск) — **не** Modal: абсолютное позиционирование относительно `position: relative`-контейнера (`expandedControlsStyles.menuContainer`, `SearchBar`), без измерения — скролл им не страшен, изменений не требуют.

## Скроллбары

- `PlayerMenu.styles.ts` → `menuWrapper` использует `overflow: 'hidden'` (не `'scroll'` — на web `'scroll'` даёт постоянные пустые скроллбары по обеим осям).
- Тема скроллбаров — глобальный CSS в `public/index.html` (`::-webkit-scrollbar*` + `scrollbar-width`/`scrollbar-color`) на CSS-переменных `--sp-scrollbar-thumb` / `--sp-scrollbar-thumb-hover`. `ThemeProvider` (web-only эффект) прокидывает в них цвета активной темы (`textMuted` / `text`), так что при переключении светлая/тёмная скроллбар перекрашивается. Фолбэк — нейтральный серый (SSG / до JS).

## pointerEvents на web (ловушка `box-none`/`box-only`)

`pointerEvents` как RN-стиль поддерживается, но с оговоркой про не-CSS-значения:

- **Инлайн-стиль** `style={{ pointerEvents: 'none' }}` (или `'auto'`) работает: RNW через `preprocess` прокидывает ключ в inline-стиль DOM (`element.style.pointer-events = 'none'`) — это валидный CSS. Тот же путь проходит сквозь `Animated.View`: reanimated-web **не** отбрасывает статические (неанимированные) элементы style-массивов — `PropsFilter` оставляет их в `props.style`, а веб-апдейтер пишет в `element.style` только ключи анимированного стиля, не трогая React-инлайн. Поэтому декор-оверлеи (`backdrop`, `miniOverlay`, градиенты, скелетоны, toast, измеритель marquee) корректно держать `pointerEvents: 'none'` инлайн.
- **`box-none` / `box-only` — НЕ валидные CSS-значения** (`pointer-events: box-none` браузер отбрасывает, элемент остаётся `pointer-events: auto`). RNW полифилит их **только при компиляции стиля в CSS-классы**, т.е. когда значение лежит в объекте `StyleSheet.create`: класс даёт `pointer-events: none/auto !important` на элементе плюс дочернее правило `>* { pointer-events: auto/none }` — ровно семантика RN. Инлайн `style.pointerEvents: 'box-none'` на полноэкранном оверлее = «невидимая простыня» с `auto`: глотает все касания страницы под ним. **Правило: `box-none`/`box-only` всегда в `StyleSheet.create`, никогда инлайн.**

Так зарегрессил экран «Слушать» (нельзя скроллить/тапать таб-бар, живы только мини/полноэкранный плеер): при переезде с пропа `pointerEvents="box-none"` на стиль значение попало в инлайн-массивы. Исправлено переносом `box-none` в `StyleSheet.create`:

- `ExpandablePlayer` → `commonStyles.ts` → `recoveryOverlay` (`{ ...StyleSheet.absoluteFillObject, pointerEvents: 'box-none' }`), полноэкранная обёртка виджета (главный блокатор страницы);
- `BoundaryHint` → `expandedBoundaryHintStyles.boundaryHintAnchor` (полноширинный абсолютный якорь);
- `NextSermonPlate` → `expandedTrackStyles.nextSermonAnchor` (полноширинный якорь в шапке полноэкранного плеера).

Итоговый класс на web идентичен тому, что раньше давал проп (`r-pointerEvents-*` + `>*`), на нативе поведение не изменилось — RN читает `pointerEvents` из стиля через `ReactNativeStyleAttributes`.

## Обходной путь: Metro lazy-bundling

Dev-бандл web (`lazy=true`) падал с `Requiring unknown module "2405"` на `import('expo-notifications')` в `shared/lib/notifications/ensureNotifications.ts` (единственный динамический импорт в проекте) — известный баг Metro на web: async-чанк отдаётся без запрошенного модуля.

Два слоя защиты:

1. `shared/lib/notifications/ensureNotifications.web.ts` — на web сразу `Promise.resolve(null)`, `expo-notifications` не грузится вовсе (на web он и так не работает — только warn'ы про push-токены). Убирает единственный `import()` из web-графа.
2. `yarn web` = `EXPO_NO_METRO_LAZY=1 expo start --web` — выключает ленивый бандлинг для web целиком. `yarn start` (натив) не тронут; `expo export` и так `lazy: false`.

## Marquee-текст (бегущая строка) на web

`shared/ui/marquee-text` — авто-скролл текста при переполнении + перетаскивание долгим нажатием (используется в `SliderItemDescription` и в заголовках плеера/строк треков через `MovingText`; `PlaylistListItem` использует обычный многострочный `Text`). **Два режима запуска.** Заголовки плеера (мини-плеер, шапка полноэкранного плеера) передают `autoStart`: как только измерение даёт `maxOffset > MARQUEE_EPSILON_PX`, `useAnimatedReaction` вызывает `startIdleMarquee` — цикл стартует сразу после измерения, без ожидания драга. Остальные потребители (заголовки карточек слайдера `SliderItemDescription`, строки треков `TracksListItemContent`) работают по умолчанию (`autoStart` = false) в **drag-gated** режиме: заголовок статичен, пока пользователь не совершит один реальный драг (≥ `DRAG_ACTIVATION_THRESHOLD_PX` = 3 px, предикат `isRealDrag(e.translationX)` в `createMarqueeGesture.ts`) — тогда `marqueeArmed` взводится и `startIdleMarquee` запускает цикл; суб-пороговый жест (дрожание) гейт не взводит и сбрасывает `didDrag`, чтобы медленный клик не глотался и навигация работала. На нативе медленный тап (долгое удержание без движения, которое активирует пан) или отменённый жест (например, `miniPan` перехватил указатель) на **взведённом** заголовке возобновляют цикл с фазы 0; никогда не взведённые gated-заголовки остаются замороженными на позиции скраба. При смене текста (новый заголовок) анимация сбрасывается (`translateX = 0`, `cycleElapsed = 0`, `clockPaused = !autoStart` в `useEffect` по `[text, autoStart]`), гейт возвращается в исходное состояние (`marqueeArmed.value = autoStart`), и новый заголовок заново оценивается на переполнение. **Цикл ведут детерминированные часы кадров** (`useMarqueeFrameClock.ts`, `useFrameCallback`): вместо цепочки Reanimated-анимаций (`withDelay` → `withTiming` → нулевая хвостовая `withTiming` → `withRepeat`), где Android пере-планировал анимацию на каждой границе секвенции и микро-дёргался, один ворклет на кадр продвигает `cycleElapsed` (мс внутри цикла). Фазы: пауза `MARQUEE_PAUSE` (2с, `translateX = 0`) сменяется скроллом (`translateX = -(scrolled / scrollMs) * loopDistance`), а при достижении `scrollMs` — jump-cut в паузу (`cycleElapsed = 0`, `translateX = 0`), без обратного движения; следующий цикл начинается со своей паузы. Дельта кадра клампится (`min(timeSincePreviousFrame ?? 0, 100мс`) — возврат из фона не телепортирует строку. Жизненный цикл часов разведён по потокам: JS-эффект включает/выключает колбэк по React-состоянию `needsRepeat` (`frameCallback.setActive(needsRepeat)` — помещающийся заголовок не крутит кадры вовсе), а ворклет-флаг `clockPaused` замораживает фазу во время скраба и пока гейт не взведён — без хопа worklet → JS. Колбэк часов и `startIdleMarquee` стабильны (`useCallback([])`) — `useFrameCallback` не пере-регистрирует нативный колбэк на ре-рендерах родителя (тики позиции в плеере ~2/с). Драг **скрабит** текст (`translateX` следует за пальцем/курсором с clamp по `maxOffset`) и ставит `clockPaused = true` в `onStart` (замена `cancelAnimation`), а по завершении реального драга цикл перезапускается. Строка-двойник рендерится с `renderToHardwareTextureAndroid` — кадр композитится на GPU без перерисовки иерархии на каждом кадре скролла. Контейнер `MarqueeText` несёт `alignSelf: 'stretch'`: без этого родитель с `alignItems: 'center'` сжимал бы его до ширины ряда-двойника (`textWidth*2 + REPEAT_SPACER`), `containerWidth` мерился бы огромным (`maxOffset = 0` — нет ни скролла, ни драга), а текст вылезал бы за оба края экрана. `shared/ui/MovingText` — тонкая обёртка над `MarqueeText` (`shared/ui/marquee-text/marquee-text`): прокидывает `text`/`testID`/`autoStart`, окрашивает `textStyle` цветом темы (`currentTheme.text`) и добавляет внешний `style`; заголовки мини-плеера и полноэкранного плеера передают `autoStart`, строки треков — нет, поэтому у них остаётся drag-gate (`centerWhenStatic` по умолчанию false — выравнивание влево). Право на marquee — **только геометрическое переполнение** (`maxOffset > MARQUEE_EPSILON_PX`: измеренная ширина текста больше контейнера более чем на эпсилон 1 px), порога по длине строки нет: `shouldMarquee(maxOffset)` у `MarqueeText` не смотрит на число символов, а `MovingText` делегирует всю геометрию `MarqueeText` — дубликат со спейсером рендерится только при переполнении, помещающийся текст остаётся одной статичной копией. Это чинит баг «короткий, но широкий заголовок» (мало символов, широкие глифы): раньше такой текст попадал в статичную ветку по порогу длины и висел с многоточием навсегда. На web работает через те же Reanimated-ворклеты (на web worklets исполняются на JS-потоке, `scheduleOnUI` → `requestAnimationFrame`), но есть пять платформенных особенностей:

1. **Измерение ширины текста.** RNW 0.21 не поддерживает `onTextLayout` (проп не пробрасывается в DOM — `Text/index.js` его просто не читает), поэтому скрытый измеритель на web использует `onLayout` + `whiteSpace: 'nowrap'` + **`width: 'max-content'`** (`WEB_MEASURER_STYLE` в `marquee-styles.ts`). `max-content` обязателен: абсолютно-спозиционированный элемент по умолчанию схлопывается по shrink-to-fit = `min(max-content, containing block)` — для переполняющего заголовка это ширина контейнера, измеритель врал бы `textWidth ≈ containerWidth`, `maxOffset` = 0 и marquee никогда не взводился (баг «переполняющий заголовок не скроллится»). С `max-content` `getBoundingClientRect().width` = полная ширина текста. На нативе остаётся `width: 10000` + `onTextLayout` (ширина первой строки). Без web-ветки `textWidth` = 0 → `maxOffset` = 0 → `shouldMarquee` = false → нет ни авто-скролла, ни перетаскивания (clamp в 0). Логика измерения вынесена в `useMarqueeMeasurement.ts`; рестарт анимации после изменения размеров — `useAnimatedReaction` на `containerWidth`/`textWidth` (вместо `scheduleOnUI` в каждом layout-колбэке). `width: 'max-content'` — web-only CSS, в RN-типах `DimensionValue` его нет: тип `WebTextStyle` = `{ whiteSpace?, width?: 'max-content' } & Omit<TextStyle, 'width'>`, а на стыке со `StyleProp<TextStyle>` стоит документированный `@ts-expect-error`. Измеритель на web держит `pointerEvents: 'none'` в **стиле** (`WEB_MEASURER_STYLE`, не проп — проп-форма депрекейтится): RNW мапит `style.pointerEvents` в CSS `pointer-events`, иначе невидимый абсолютный текст (поздний сиблинг жестового поддерева) перехватывал бы `pointerdown` и убивал мышевый драг.
2. **Перетаскивание мышью.** RNGH web работает через Pointer Events (левая кнопка проходит `isButtonInConfig`), `GestureHandlerRootView` оборачивает приложение в `app/_layout.tsx`. `user-select: none` на жестовой вью RNGH ставит сам (иначе браузер выделял бы текст при драге). Курсор во время драга — `activeCursor('grabbing')`. **Активация на web — `minDistance(10)` + `failOffsetY([-14, 14])`** (`createMarqueeGesture.ts`): десктопный пользователь жмёт и сразу тянет, а long-press-активация проигрывает гонку с touch-slop (движение > slop в окне удержания отменяет активацию) — на web жест взводится первым реальным движением, на нативе остаётся `activateAfterLongPress(250)`. **Нативный HTML5-drag блокируется** (`useNativeDragGuard.ts`): браузер диспатчит `dragstart` на `<img>` внутри строк и перехватывает мышиные драги раньше Pointer Events RNGH; capture-слушатель `dragstart` на контейнере вызывает `preventDefault`. Контейнер также помечается `data-marquee-drag` — по этому маркеру мышевый drag слайдера исключает драги, начатые на заголовке (см. «Мышевой drag слайдера» ниже). После драга браузер всё равно диспатчит `click` на жестовую вью, который всплывает до родительского `PressableButton` и навигировал бы; на нативе RNGH при активации жеста отменяет press родителя. `useMarqueeClickGuard.ts` восстанавливает это поведение на web: слушает `click` на контейнере и глотает событие, если перед этим был реальный драг (`didDrag` shared value: ставится в `onStart` при активации пана, но **сбрасывается в `onEnd`**, если жест не дотянул до `DRAG_ACTIVATION_THRESHOLD_PX` — медленный клик без движения не должен глотаться и блокировать навигацию; в `onFinalize` сбрасывается, если жест был отменён/провален — иначе `didDrag` остался бы взведённым и проглотил следующий легитимный клик). Гард вешается через callback-ref + `useState`-узел, поэтому слушатель прикрепляется, когда вью реально смонтировалась (важно для `MarqueeText`, который рендерит `null` при пустом тексте).
3. **Статичная ветка: ряд = геометрии marquee (по умолчанию), полная ширина контейнера — только `centerWhenStatic` на web.** Когда текст помещается (`needsMarquee` = false), `animatedStyle` в `useMarqueeAnimation.ts` разводит ширину ряда по **пропу**, а не по платформе: по умолчанию (`centerWhenStatic` = false) на всех платформах статичная ветка переиспользует геометрию marquee (`marqueeWidth` = `textWidth * 2 + REPEAT_SPACER`) — статичное состояние пиксель-в-пиксель совпадает с первым кадром цикла. Только `centerWhenStatic` разводит платформы: `width: '100%'` на web (центрированный текст занимает контейнер) и `textWidth + STATIC_WIDTH_SAFETY_PX` (2 px, поглощает округление) на нативе. Видимый `Text` на нативе держит `numberOfLines={1}`, поэтому любая ширина ряда меньше отрендеренного однострочного текста (округление Yoga pixel-grid, epsilon-помещающиеся заголовки) заставляла Android переносить последнее слово на скрытую вторую строку — слово исчезало, оставляя пустой зазор. Раньше статичная ветка на web тоже брала измеренную ширину: вью оказывалась уже контейнера, и `numberOfLines={1}` вешал на помещающийся заголовок лишнее многоточие (баг «помещающийся заголовок с многоточием»). Центрирование статичного текста (`centerWhenStatic`) на web делает `justifyContent` в `animatedStyle` (на нативе — `alignSelf` в JSX).
4. **Многоточие в этом компоненте невозможно.** RNW мапит `numberOfLines={1}` в `textOverflow: 'ellipsis'` (`styles.textOneLine`), поэтому у скроллящейся копии, чья выделенная ширина оказывается на долю пикселя меньше отрендеренного текста (округление шрифта между измерением и рендером), появлялось «…» прямо во время скролла. Видимые копии на web **не получают `numberOfLines`** вовсе — одну строку держит `whiteSpace: 'nowrap'` (`WEB_TEXT_STYLE` в `marquee-styles.ts`), обрезку делает `overflow: 'hidden'` контейнера; на нативе остаётся `numberOfLines={1}` + `ellipsizeMode='clip'`, но ряд как минимум такой же ширины, как однострочный текст (см. п. 3; единственное исключение — один кадр до измерения, `textWidth` = 0, известный транзиент, см. [`../debt.md`](../debt.md)), поэтому `numberOfLines={1}` не переносит — режет только `overflow: 'hidden'` контейнера (геометрическая обрезка), ровно как в первом кадре цикла. Статичная ветка не может дать многоточие по той же причине: помещающийся заголовок рендерится целиком, переполняющий — жёстко обрезается контейнером без «…».
5. **Эпсилон-гейт элигибилити.** Измеренная ширина (`max-content` на web, первая строка на нативе) может превышать контейнер на доли пикселя для визуально помещающегося текста (округление шрифта) — раньше такой заголовок считался переполняющим и скроллился. `shouldMarquee` трактует переполнение ≤ `MARQUEE_EPSILON_PX` (1 px) как помещающееся: заголовок остаётся статичным и жёстко обрезается вместо скролла. `needsMarquee` — derived-значение от `containerWidth`/`textWidth` (пересчитывается на каждом layout-событии контейнера и текста), а `useAnimatedReaction` рестартует `startIdleMarquee` при любом изменении размеров: если `maxOffset` падает ≤ эпсилона, активный цикл останавливается (`clockPaused = true`, `translateX` сбрасывается в 0) и восстанавливается статичная ветка.

## Мышевой drag слайдера (desktop web)

`shared/ui/slider` — горизонтальный ряд карточек на `ScrollView` из RNGH. На web RNGH-`ScrollView` не отвечает на мышиный drag, поэтому десктопный пользователь не мог прокрутить ряд. `useMouseDragScroll` (`shared/ui/slider/lib/useMouseDragScroll.ts`) добавляет мышиный drag поверх нативного `scrollLeft`:

- **Mouse-only, touch untouched.** Capture-слушатель `pointerdown` на обёртке (`<View ref={wrapperRef}>` вокруг `ScrollView`) реагирует только на `pointerType === 'mouse' && button === 0`; тач идёт через RNGH-путь как раньше. На нативе хук — no-op (`Platform.OS !== 'web'` → ранний выход).
- **1:1 scrollLeft.** `pointermove` на `window` пишет `node.scrollLeft = startScrollLeft - (clientX - startX)` — скролл следует за курсором без инерции/моментума (нативного скролла мышью у RNGH-`ScrollView` на web нет).
- **Курсор `grabbing` + `user-select: none`** на время драга (восстанавливаются после `pointerup`/`pointercancel`) — текст в ряду не выделяется при драге.
- **Клик после драга глотается.** Как только суммарное движение превысило 5 px, на обёртку вешается одноразовый capture-слушатель `click` с `preventDefault` + `stopPropagation` — иначе браузер после драга диспатчил бы `click` на карточку и навигировал. Клик без драга (≤ 5 px) не трогается — карточка открывается как обычно. Гард также снимается на следующем `pointerdown`: если предыдущий драг закончился `pointerup` вне обёртки, `click` улетел на общего предка выше обёртки, гард его не увидел и остался висеть — свежий `pointerdown` чистит такой stale-гард, и следующий обычный тап по карточке не глотается.
- **Нативный image-ghost убит.** Capture-слушатель `dragstart` на обёртке вызывает `preventDefault` **всегда** (не только во время драга) — браузер не начинает HTML5-drag на обложках карточек, и мышиный драг скроллит ряд вместо «призрачного» перетаскивания картинки.
- **Драги с marquee-заголовков исключены.** `pointerdown` на обёртке проверяет `target.closest('[data-marquee-drag]')` и выходит целиком — драг, начатый на заголовке, скроллит только сам заголовок (его собственный pan-жест), а не ряд.
- Полная очистка слушателей на unmount.

## Деплой

Приложение деплоится как ещё одно `slovo-*`-приложение на VPS, по образцу `slovo-frontend`/`slovo-docs` из `slovo-propovedi-playbook` (см. `docs/migration-2026-08-vps.md` там): **инфру** (Docker, buildx-билдер `slovo-constrained`, юзер `slovo`, Traefik) ставит и держит плейбук, а **сам деплой** — Forgejo Actions по тегу `v*`, без образа в registry (сборка на VPS через buildx).

- `Dockerfile` + `nginx.conf` (в корне репозитория) — nginx отдаёт `dist/`. SPA-фолбэк `try_files $uri $uri/ /index.html` (решает 404 на перезагрузке `/listen` и т.п. при `web.output: single`), отдельные правила для `/sw.js` (`no-cache`), `/manifest.webmanifest` (MIME) и `location = /index.html` (`no-cache` — SPA-оболочку нужно всегда ревалидировать: эвристически закешированный `index.html` мог бы сослаться на старый хешированный бандл и сломать precache, см. заметки выше), долгий кэш для хешированных `/_expo/`. Локации `/sw.js`, `/_expo/` и `/index.html` объявляют собственные `add_header`, поэтому дополнительно отдают полный набор security-заголовков (CSP и др.) — nginx не наследует их из server-уровня в такие локации. Отдельный блок `location ^~ /.well-known/` отдаёт файлы верификации Android App Links (`assetlinks.json`) без SPA-фолбэка — зачем нужен `^~` и как проверять: [deep-links.md](./deep-links.md) → «nginx: `/.well-known/`».
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
