# Кэш аудио и скачивание

**Слой:** `shared/lib/audio-cache`, `shared/lib/cache-triggers`, `entities/player/lib/download-model`, `pages/playlist/lib`
**Статус:** готов

## AudioCacheService

Сервис кэширования аудио — `src/shared/lib/audio-cache/AudioCacheService.ts`. Singleton `audioCacheService`, также экспортирует `cacheAudio` и `removeFromCache`.

- **Ключ кэша** — хеш URL трека (`getUrlHash`, 32-bit `Math.abs(hash).toString(36)`); файл `<hash>.mp3` в каталоге кэша (путь — `getAudioCacheDirectory.ts`).
- **Методы:**
  - `getCachedUri(audioUrl)` — URI закэшированного файла или `null`;
  - `isCached(audioUrl)` — boolean;
  - `cacheAudio(audioUrl, onProgress?)` — скачивание через `File.downloadFileAsync` (expo-file-system), `idempotent: true`, с ретраями и защитой от зависания (см. «Повторы и защита от зависания» ниже). Метод single-flight для всех вызывающих кодов: повторные вызовы с тем же URL возвращают общий промис (дублирующая скачка не запускается). При повторном вызове с `onProgress` — callback регистрируется в live-сете и получает текущий прогресс (retroactive seed) + все последующие тики через fan-out emitter. Файлы скачиваются во временное имя `<hash>.mp3.part`; при успешном завершении файл атомарно переименовывается в `<hash>.mp3` (`File.rename()`). Частично скачанные файлы (`.part`) никогда не распознаются как закэшированные (`getCachedUri`, `isCached` проверяют только финальный файл), что исключает воспроизведение обрезанных данных. При окончательной неудаче всех попыток `.part`-файл удаляется. Прогресс передаётся через `onProgress` callback expo-file-system (`{ bytesWritten, totalBytes }`), конвертируется в дробь 0..1 с троттлингом ≥0.01. При отсутствии `Content-Length` (`totalBytes ≤ 0`) прогресс не обновляется (chunked transfer).
  - `getCacheInfo()` — `{ fileCount, totalSize }`;
  - `clearCache()` — удалить весь каталог кэша;
  - `removeFromCache(audioUrl)` — удалить файл по URL.

Каталог кэша создаётся при необходимости (`ensureCacheDirectoryExists`).

> **Web:** `expo-file-system` в браузере не работает. Metro резолвит `./AudioCacheService` → `AudioCacheService.web.ts` — реализация поверх **Cache Storage API** (тот же бакет `audio-cache-v1`, что читает Service Worker для офлайн-воспроизведения). Подробнее — [web.md](./web.md).

### Web: возобновление скачивания (Issue #78)

При повторном «кешировать все» в плейлисте на web реализация ведёт себя так же, как нативная (паритет):

- **Skip-cached (почти паритет с нативным):** перед скачиванием `downloadAndStoreAudio` (`webCacheApi.ts`) проверяет `hasCompleteAudio(audioUrl)` — трек считается закэшированным только если его канонический URL **закоммичен в манифест** `__manifest__` **и** запись есть в бакете. Если трек уже скачан — `fetch`/`put` **не запускаются**, эмитится `onProgress(1)` ровно один раз и промис резолвится URL'ом. Инвариант: `cacheAudio` зарезолвился ⇒ `onProgress(1)` эмитился. **Расхождение с нативным:** нативный skip-cached путь (`downloadToCache` при уже существующем `<hash>.mp3`) возвращает URI **без** эмита `onProgress`; web эмитит `onProgress(1)`. Раньше каждый трек перекачивался заново (SW отдавал кешированное тело → страница делала `cache.put` того же ответа обратно в тот же бакет) — шторм re-put на iOS WebKit, класс крашей jetsam / CacheStorage writeRecord (см. [debt.md](../debt.md)).
- **Commit-манифест (`webCacheManifest.ts`)** — инвариант «в кэше ⇔ полностью скачан». `cache.put` opaque-ответа пишет байты, которые JS прочитать не может, поэтому убийство процесса посреди `put` оставляет усечённую запись, которую `cache.match` выдал бы за полностью скачанный трек. Чтобы этого не было, URL учитывается как закэшированный только после фиксации в маленьком same-origin JSON-манифесте `__manifest__` внутри бакета (`commitAudioUrl` после успешного `put`). SW гейтит офлайн-отдачу тем же манифестом; запись манифеста исключена из сводок кэша. Изменения манифеста сериализуются (read-modify-write через очередь), `ensureManifest` строит манифест один раз из существующих записей (легаси-миграция). Сбой коммита не валит скачивание — лишь значит повторную загрузку в след. сессии (`console.error`).
- **Stale-запись перед повторным скачиванием:** перед `fetch`/`put` `downloadAndStoreAudio` делает best-effort `deleteAudioEntry` (удаляет и незакоммиченную/усечённую запись, и отзывает коммит) — чтобы не накапливались обрезанные записи при повторных попытках.
- **Recovery бакета:** `openAudioCache` (`openAudioCache.ts`) при сбое `caches.open` (повреждённый Cache Storage после убийства процесса посреди записи — WebKit bugs [260962](https://bugs.webkit.org/show_bug.cgi?id=260962)/[305539](https://bugs.webkit.org/show_bug.cgi?id=305539)) делает `caches.delete(AUDIO_CACHE_NAME)` и повторно открывает; если и это не удалось — кидает обычный `Error` (callers уже обрабатывают rejections). Используется во всех операциях web-кэша (has/put/delete/summarize). Поведение recovery для remove/clear: `removeFromCache` **ловит** ошибку и возвращает `false` (не прокидывает), а `clearCache` **перекидывает** (`catch` + `throw`). `AUDIO_CACHE_NAME` — первоисточник имени бакета в этом файле.
- **Без URE:** очистка inflight-состояния идёт через `promise.then(cleanup, cleanup)` (не `void promise.finally(...)`, который на неудаче ре-throw'ил и давал unhandled rejection → глобальную модалку ошибок), как в нативном `AudioCacheService.ts`.
- **Inflight replay:** при повторном вызове `cacheAudio(url, onProgress)` пока идёт загрузка, новый `onProgress` получает `entry.lastValue` мгновенно (паритет с нативным `AudioCacheService.ts:67-72`). Это критично для opaque no-CORS ответов, где прогресс прыгает 0→1 — поздний joiner сразу видит 1 вместо зависания на 0.
- **Без перечисления бакета вне commit-пути:** ни один путь has/delete/очистки/стартовый пути не вызывает `cache.keys()`. `hasCompleteAudio` читает манифест read-only (`readCommittedUrls`); при отсутствии манифеста — match-only фолбэк (легаси-доверие) без построения. `uncommitAudioUrl` при отсутствии манифеста — no-op (нет манифеста ⇒ нечего отзывать). Перечисление остаётся только (1) в commit-пути (`commitAudioUrl` → `ensureManifest` → `buildManifest`) как одноразовая легаси-миграция на первом коммите и (2) в `summarizeAudioCache` (`webCacheSummary.ts`) — публичный `getCacheInfo` для UI статистики кеша, сегодня без прод-вызовов; с предупреждением в коде.

### Очистка осиротевших загрузок после аварийного завершения

Когда приложение убивают посреди скачивания, в кэше остаются хвосты: на нативе — временный файл `<hash>.mp3.part`, на web — незакоммиченная запись в бакете. При следующем старте `cleanupOrphanedDownloads()` (`src/shared/lib/audio-cache/cleanupOrphans.ts` / `cleanupOrphans.web.ts`) чистит их — вызов цепочкой из `app/_layout.tsx` **до** `initializePlayer()`: восстановленный трек может сразу запустить фоновую закачку, которая гонялась бы со sweep'ом и получила бы удаление своего активного `.part` (startup race). Оба варианта **best-effort и никогда не бросают** (обёрнуты в try/catch → `console.error`) — обслуживание не должно ронять старт приложения.

- **Нативный sweep:** читает каталог кэша; если его нет — сразу выход; иначе удаляет каждый `File`, чьё имя оканчивается на `.mp3.part` (`PART_SUFFIX`, экспортируется из `cacheDownloader.ts`). Заодно `getCacheInfo` (`AudioCacheService.ts`) теперь **исключает `.part`-файлы** и из `fileCount`, и из `totalSize` — активные mid-download темпы не являются содержимым кэша.
- **Web — journal + точечная очистка:** в `webDownloadJournal.ts` хранится AsyncStorage-журнал `audio-cache/active-downloads` — массив записей `{ url, sessionId, lastSeenAt }` (epoch ms). Чтение оборонительное: zod-валидация v2-схемы; легаси `string[]` мигрируется в stale-записи (`sessionId: 'legacy'`, `lastSeenAt: 0`); битый JSON → пустой массив + лог. `sessionId` — уникальный ID таба (`crypto.randomUUID()` с фолбэком). `downloadAndStoreAudio` пишет запись (`addActiveDownloadWithHeartbeat`) **непосредственно перед** `fetch` (не на skip-пути — там скачивания нет, орфана быть не может), обновляет `lastSeenAt` каждые 10с (heartbeat, `setInterval`; снимается в `finally`) и удаляет (`removeActiveDownload`) в `finally`, покрывающем fetch+put+commit. Строки журнала ключуются по `(sessionId, url)` — два таба, качающие **один и тот же** URL, держат каждый свою живую строку, так что завершение или смерть одного таба не решает чужую идущую закачку. Записи журнала сериализуются (read-modify-write через очередь, паттерн `manifestQueue`). Стартовый `cleanupOrphanedDownloads.web` читает журнал; если он пуст — возвращается **не трогая `caches` вовсе** (обычные запуски остаются нулевой стоимости). Правило reap: запись со свежим `lastSeenAt` (now − lastSeenAt < `STALE_MS` = 120с) пропускается без доступа к кэшу (это может быть живая загрузка другого таба); stale + закоммичена в манифест → кэш-запись сохраняется (скачивание завершено), дропается только строка журнала; stale + не закоммичена → best-effort `deleteAudioEntry` (каждый в try/catch + лог) + дроп строки. Запас `STALE_MS` = 12× heartbeat намеренно широкий: Chrome intensive timer throttling (~1 таймер/мин после 5 мин в фоне) и жёсткая приостановка таймеров Safari не должны позволить считать живую фоновую закачку другого таба stale. Журнал чистится точечно (`removeActiveDownloadEntries`), **не** `clearActiveDownloads` (тот остаётся только в `clearAudioCache`). **Намеренно не перечисляет бакет** — перечисление возможно-повреждённого iOS-бакета может зациклить PWA на краше (WebKit bugs 260962/277598). Принятый риск: cross-tab RMW-гонки журнала остаются last-writer-wins.

## Повторы и защита от зависания (Issue #49)

`downloadToCache` (`src/shared/lib/audio-cache/cacheDownloader.ts`) оборачивает скачивание в retry-цикл — мотивация: обрыв TCP-соединения при переключении WiFi → мобильный интернет посреди скачивания раньше приводил к безвозвратной ошибке трека.

Константы политики — `src/shared/lib/audio-cache/downloadRetryPolicy.ts`:

- `MAX_DOWNLOAD_ATTEMPTS = 3` — всего попыток (1 начальная + 2 повтора);
- `RETRY_BACKOFF_DELAYS_MS = [1000, 5000]` — задержка перед 2-й и 3-й попыткой;
- `DOWNLOAD_STALL_TIMEOUT_MS = 30_000` — попытка прерывается, если прогресс не приходит 30с;
- `STALL_CHECK_INTERVAL_MS = 5_000` — период проверки «зависания»;
- `WAIT_ONLINE_BEFORE_RETRY_MS = 60_000` — ограниченное ожидание возврата сети перед каждым повтором (`waitForOnline` из `shared/lib/network`).

Механика:

- **Stall guard** — `runDownloadAttempt` (`attemptDownload.ts`) на каждую попытку создаёт `AbortController`; каждый сырой тик прогресса (до троттлинга) обновляет `lastActivityAt`; интервал (раз в 5с) делает `abort()`, если тиков не было дольше 30с (типично для half-open соединения после смены сети). `AbortSignal` передаётся в `File.downloadFileAsync`; интервал всегда снимается в `finally`.
- **Ретраятся все ошибки** — RN-ошибки скачивания не надёжно раскрывают HTTP-статус; повторный 404 стоит только ~6с дополнительного времени.
- **Прогресс** — `onProgress(0)` эмитится в начале каждой попытки (UI сбрасывает полосу между попытками).
- **`.part`-файл** — между попытками НЕ удаляется (`idempotent: true` перезапишет его); удаляется только после окончательной неудачи всех попыток (плюс `console.error`, затем ретроу последней ошибки). Дополнительно `downloadToCache` при старте удаляет **осиротевший stale `.part`** (остался от убитого приложения посреди скачивания) — чтобы он не занимал место и не мешал перекачиванию.

## Автоматическое кэширование при воспроизведении

При старте трека `AudioLoader.getPlaybackUrl` (`src/entities/player/lib/PlayerService/AudioLoader.ts`) сначала ищет кэш; если файла нет — плеер **стримит** с сервера (`downloadFirst: false`, HTTP range requests), а параллельно `startBackgroundCaching` (`BackgroundCachingService.ts`) скачивает трек целиком в офлайн-кэш и обновляет прогресс. Дублирование скачивания одного URL блокируется: `startBackgroundCaching` проверяет модульный `Set<string>` in-flight URL; повторный вызов с тем же URL **ADOPTS** глобальные атомы (`downloadingAudioUrlAtom`, `isDownloadingAtom`) и подставляет прогресс из `playlistDownloadProgressAtom` вместо сброса в 0. Новое скачивание не запускается — original downloadToCache chain продолжает работать, а его тики через динамический guard `ctx.get(downloadingAudioUrlAtom) === audioUrl` начинают обновлять глобальный `downloadProgressAtom`. Сбой фонового кэширования обрабатывается молча (`console.error`), глобальный диалог ошибок НЕ показывается (Issue #73 — потеря сети при подключении к автомобилю через Bluetooth / переключение сети); воспроизведение не затрагивается (стриминг), а при следующем запуске того же трека кэширование запускается заново.

## Скачивание одного трека

Из контекстного меню полноэкранного плеера `PlayerMenu` (`src/widgets/expandable-player/ui/PlayerMenu/PlayerMenu.tsx`) пункт «Добавить в кеш / Удалить из кеша» → `useFullscreenHandlers.handleToggleCache` (`.../FullscreenContent/useFullscreenHandlers.ts`) → `cacheAudio` / `removeFromCache`.

## Скачивание плейлиста целиком

`PlaylistCacheService` — `src/pages/playlist/lib/PlaylistCacheService.ts` (`playlistCacheService`). Метод `cachePlaylist(ctx, tracks, playlistTitle)`:

- фильтрует треки без `audioUrl`;
- ставит `isCachingPlaylistAtom = true` и прогресс `playlistCacheProgressAtom = { current, total }`;
- делегирует последовательный прогон в `runPlaylistCaching` (`runPlaylistCaching.ts`): перед каждым треком проверяет подключение (`waitForOnline`, до 60с) — если сеть не вернулась, весь прогон прерывается ошибкой «Нет подключения к интернету» (сетевые ошибки не показывают алерт `playlistCacheErrorAtom`, только уведомление); неудача одного трека не прерывает остальные;
- показывает системные уведомления (`PlaylistCacheNotifications.ts`): начало, прогресс «Скачано N из M», завершение «Скачано N проповедей» либо ошибка «Не удалось скачать X из N» при частичной неудаче (группа `playlist-cache`, фиксированный ID);
- обновляет `playlistDownloadProgressAtom` (по URL трека) и инкрементирует `cacheUpdateTriggerAtom`;
- в `finally` сбрасывает состояние.

UI и хуки — `src/pages/playlist/lib/`:

- `usePlaylistCacheMenu.ts` — состояние меню кэша на экране плейлиста (диалоги подтверждения, позиция меню).
- `usePlaylistCacheStatus.ts` — подсчёт закэшированных треков (`allCached`, `cachedCount`, `totalCount`).
- `PlaylistCacheMenu.tsx`, `PlaylistCacheMenuItem.tsx`, `PlaylistCacheMenuDropdown.tsx`, `PlaylistCacheDialogs.tsx` — в `src/pages/playlist/ui/`.

## Очистка кэша

В Настройках (`src/pages/settings/ui/SettingsScreen.tsx`) пункт «Очистить кэш» → `ClearCacheDialog.tsx` → `clearCacheAction` (`src/pages/settings/model.ts`) → `clearCache` (`src/pages/settings/lib/clearCache.ts`) → `audioCacheService.clearCache()`.

> **Примечание:** Кэш изображений (`expo-image`, `cachePolicy='memory-disk'`) физически отделён от `document/audio-cache` и этими операциями не затрагивается. Подробнее — [features/images.md](./images.md).

## Hooks

- `useIsCached` (`src/shared/lib/audio-cache/useIsCached.ts`) — проверка кэша для конкретного `audioUrl`, опциональный `cacheTrigger` для перепроверки.

## Состояние

Атомы скачивания — `src/entities/player/lib/download-model.ts`:

- `downloadProgressAtom` (0..1), `isDownloadingAtom`, `downloadingAudioUrlAtom` + set-экшены. Запись в `downloadProgressAtom` защищена проверкой `downloadingAudioUrlAtom === audioUrl` — при параллельных скачиваниях старый трек продолжает работать в фоне, но его тики не перезаписывают глобальный прогресс. `playlistDownloadProgressAtom` остаётся per-URL и не гвардится (список треков показывает прогресс каждого трека корректно). Прогресс сбрасывается в `0` только при старте нового скачивания (`startBackgroundCaching`), не в `.finally()` — это исключает гонку при параллельных скачиваниях.

Триггеры обновления UI — `src/shared/lib/cache-triggers.ts`:

- `cacheUpdateTriggerAtom` (инкрементируется `incrementCacheTrigger`);
- `playlistDownloadProgressAtom` — прогресс по URL (`Record<string, number>`).

Константа ключа — `src/shared/config/cache-storage-keys.ts` (`CACHED_SECTIONS`). Ключи хранилища — [storage.md](../contracts/storage.md).

### download-model (entities/player)

`src/entities/player/lib/download-model.ts` — атомы скачивания **одного** трека + синхронные set-экшены (`setDownloadProgressAction`, `setIsDownloadingAction`, `setDownloadingUrlAction`). Используются и `BackgroundCachingService`, и UI-компонентами для отображения прогресса загрузки текущего трека. Спиннер в плеере (play/pause кнопка) показывается **только при буферизации** (`isBuffering` — воспроизведение невозможно); фоновое скачивание (`isDownloading`) не блокирует кнопку play. Прогресс скачивания отображается отдельно: в полноэкранном плеере — серый слой на `PlayerProgressBar` (под основным прогрессом), в мини-плеере — тонкая полоса (2px) вдоль нижнего края карточки.

## Поток скачивания

1. **Старт воспроизведения** → `AudioLoader.getPlaybackUrl`: нет в кэше → `startBackgroundCaching` (авто-кэш без действия пользователя).
2. **Ручное скачивание трека** → меню плеера `PlayerMenu` → `handleToggleCache` → `cacheAudio`/`removeFromCache`.
3. **Скачивание плейлиста** → `PlaylistCacheService.cachePlaylist` (с прогрессом и системными уведомлениями).
4. **Очистка кэша** → Настройки → `ClearCacheDialog`.

После любого изменения кэша инкрементируется `cacheUpdateTriggerAtom`, чтобы хуки (`useIsCached`, `usePlaylistCacheStatus`) перепроверили состояние.

## Связанные документы

- [player.md](./player.md) — автоматическое кэширование при старте трека
- [offline-and-network.md](./offline-and-network.md) — офлайн-прослушивание
- [storage.md](../contracts/storage.md) — ключи AsyncStorage
