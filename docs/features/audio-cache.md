# Кэш аудио и скачивание

**Слой:** `shared/lib/audio-cache`, `shared/lib/cache-triggers`, `entities/player/lib/download-model`, `pages/playlist/lib`
**Статус:** готов

## AudioCacheService

Сервис кэширования аудио — `src/shared/lib/audio-cache/AudioCacheService.ts`. Singleton `audioCacheService`, также экспортирует `cacheAudio` и `removeFromCache`. Модуль также экспортирует общий helper `cacheAudioWithProgress` (`cacheAudioWithProgress.ts`) — единая точка ручного кеширования с прогрессом (см. «Скачивание одного трека»).

- **Ключ кэша** — хеш URL трека (`getUrlHash`, 32-bit `Math.abs(hash).toString(36)`); файл `<hash>.mp3` в каталоге кэша (путь — `getAudioCacheDirectory.ts`).
- **Методы:**
  - `getCachedUri(audioUrl)` — URI закэшированного файла или `null`;
  - `isCached(audioUrl)` — boolean;
  - `cacheAudio(audioUrl, onProgress?, signal?)` — скачивание через `File.downloadFileAsync` (expo-file-system), `idempotent: true`, с ретраями и защитой от зависания (см. «Повторы и защита от зависания» ниже). Метод single-flight для всех вызывающих кодов: повторные вызовы с тем же URL возвращают общий промис (дублирующая скачка не запускается). При повторном вызове с `onProgress` — callback регистрируется в live-сете и получает текущий прогресс (retroactive seed) + все последующие тики через fan-out emitter (`inflightDownload.ts`). Третий аргумент `signal` (AbortSignal) — внешняя отмена (мост в `abortBridge.ts`). Файлы скачиваются во временное имя `<hash>.mp3.part`; при успешном завершении файл атомарно переименовывается в `<hash>.mp3` (`File.rename()`). Частично скачанные файлы (`.part`) никогда не распознаются как закэшированные (`getCachedUri`, `isCached` проверяют только финальный файл), что исключает воспроизведение обрезанных данных. При окончательной неудаче всех попыток `.part`-файл удаляется; при **отмене** `.part`-файл тоже удаляется немедленно (см. «Отмена скачивания»). Прогресс передаётся через `onProgress` callback expo-file-system (`{ bytesWritten, totalBytes }`), конвертируется в дробь 0..1 с троттлингом ≥0.01. При отсутствии `Content-Length` (`totalBytes ≤ 0`) прогресс не обновляется (chunked transfer).
  - `cancelAudioDownload(audioUrl)` — отменяет идущую закачку по URL: **сначала помечает inflight-запись `aborted = true`, затем** вызывает `abort()` владельца записи. Возвращает `boolean` (`false`, если закачка не идёт / уже отменена). Отмена приводит к `CacheCancelledError` (см. ниже). Флаг `aborted` — ключ Bug B (Issue #83 follow-up): между отменой и settle'ом записи повторная постановка того же URL через очередь видит запись как **не-joinable** (`inflightIsJoinable` = запись есть И `!aborted`) и стартует **свежую** закачку вместо присоединения к умирающему (реджектящемуся) промису — иначе иконка трека застревала бы на «облаке» после stop → run → run.
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
- **Отмена не ретраится** — перед каждым решением о повторе `throwIfCancelled` (`cacheDownloader.ts`) проверяет `externalSignal.aborted`; если сигнал отменён — `.part`-файл удаляется и бросается `CacheCancelledError` (см. «Отмена скачивания»). Отменённый URL никогда не перекачивается retry-циклом.
- **Signal-aware backoff** — между повторами `downloadToCache` ждёт `waitForOnline(WAIT_ONLINE_BEFORE_RETRY_MS, externalSignal)` (проверяет `aborted` каждый poll-тик) и `sleepAbortable(RETRY_BACKOFF_DELAYS_MS[i], externalSignal)` (`downloadRetryPolicy.ts`): резолвится рано на abort, entry-check уже-aborted (не спит полную задержку), снимает abort-listener на таймауте. `throwIfCancelled` остаётся единственной точкой броска — отмена вступает в силу в пределах одного poll-тика (≤1с), а не `60с+5с`.

## Глобальная очередь закачек (Issue #83)

С Issue #83 **все** скачивания аудио проходят через единую глобальную serial-FIFO очередь (concurrency 1) — нового кода «просто вызвать `cacheAudio`» больше нет. Директива пользователя: **никаких параллельных закачек нигде**. Архитектура — `src/shared/lib/audio-cache/cacheQueue*.ts`.

### Принцип работы

- **Одна очередь, concurrency 1** — в каждый момент времени активна строго одна закачка; остальные ждут в очереди.
- **FIFO** — порядок определяется монотонным `enqueuedAt` (счётчик `nextEnqueuedAt`), а не временем из часов — строго по порядку постановки в очередь.
- **Источники (`CacheQueueSource`)**: `'manual'` | `'playlist'` | `'auto'` (BCS). Источник нужен для политики отмены и обходов.
- **`cacheQueueAtom: Record<url, {source, enqueuedAt}>`** — содержит **только** URL в очереди (ещё не начавшие качаться). Когда загрузка URL стартует, запись удаляется из атома раннером (`dequeueEntry` в `cacheQueueRunner.ts`) — «часики» в строке исчезают, а активность видна через progress-атом. Смена атома триггерит реактивный UI строк (часы появляются/исчезают).
- **`pendingPromises`** — Map «URL → deferred», резолвится URI кэшированного файла; потребитель ждёт именно свой промис (напр. плейлист ждёт каждый трек по очереди).
- **`requesters`** — Map «URL → Set<source>» — кто ещё ждёт/качает этот URL (см. политику отмены ниже). Очищается, когда закачка оседает.

### API очереди

- `enqueueCache(ctx, url, source, onProgress?)` — главная точка входа. Дедуплицирует: если URL **уже в очереди** — добавляет requester/onProgress и возвращает общий промис; если **качается** (`inflightCache.has` и запись **не aborted**) — присоединяется к идущей закачке (с retroactive-seed прогресса через `joinInflightDownload`); иначе ставит в очередь (`enqueueFresh`). **Не** дедуплицирует по `isCached` — закэшированный URL можно пере-поставить; UI показывает кэш-состояние, а не «часы» (см. resolver).
- `enqueueCacheMany(ctx, urls, source, onProgress?)` — **батч-версия** для массовых постановок (прогон плейлиста, Issue #83 follow-up). Ставит N URL **одной записью** в `cacheQueueAtom` (вместо N записей — устранение N-кратного ре-рендера списка при «Закешировать все»), FIFO по порядку массива (`enqueuedAt` в порядке следования). Дедупликация **внутри батча**: повторный URL в том же массиве делит промис первого вхождения. Per-URL дедупликация идентична `enqueueCache` (queued → join, inflight не-aborted → join, иначе fresh). Возвращает промис на каждый URL в порядке входа. Бросает `[cacheQueue] audioUrl is required` при пустом URL (fail-fast до постановки).
- `removeFromQueue(ctx, url)` — снять URL с очереди (активную закачку не трогает), rejects промис `CacheCancelledError`.
- `removeFromQueueBySource(ctx, source)` — снять все записи очереди с данным источником.
- `cancelCacheDownload(ctx, url)` — **безусловная** отмена: `removeFromQueue` + `audioCacheService.cancelAudioDownload(url)` (снимает и с очереди, и с активной закачки).
- `cancelAllCacheDownloads(ctx)` — **глобальный стоп** всех закачек (кнопка «Остановить все закачки» в правом верхнем углу полноэкранного плеера). Точный порядок: (0) если нет ни активной закачки, ни записей в очереди — ранний выход, стопперы не вызываются; (1) `invokePlaylistRunStopper()` — прерывает плейлист-прогон, чтобы он вернулся тихо (без ложного «Скачано N из N»); (2) если есть активная закачка (`activeCacheUrlAtom`) — `cancelCacheDownload(activeUrl)` (безусловно, даже с иностранными джойнерами); (3) дренаж: `removeFromQueue` для каждого URL в `cacheQueueAtom` (чистит requesters + прогресс + rejects deferred'ов `CacheCancelledError`). No-op при простое.
- `isUrlQueued(ctx, url): boolean` — реактивная проверка (читает `cacheQueueAtom`).
- `activeCacheUrlAtom: Atom<null | string>` — **реактивный** источник активной закачки: URL, который обрабатывает раннер очереди, или `null` при простое. UI, которому нужно отражать «идёт закачка» реактивно, подписывается на него (напр. `usePlaylistCacheMenu.isClearCacheDisabled`, `useStopAllCaching`).
- `getCacheRequesters(url): ReadonlySet<source>` — read-only сет источников, ждущих/качающих URL.
- `hasInflightCacheDownloads(): boolean` — есть ли хоть одна идущая закачка. **НЕ реактивен** (plain-Map). С Issue #83 реактивный источник — `activeCacheUrlAtom`; этот геттер остаётся **только press-time guard'ом** на деструктивных операциях (перепроверка на нажатии «Удалить из кеша все»), а не источником для UI.
- `registerPlaylistRunStopper(stopper)` / `unregisterPlaylistRunStopper(stopper)` / `invokePlaylistRunStopper()` — реестр стопперов плейлист-прогонов (см. «Глобальный стоп» ниже).

### Раннер (`cacheQueueRunner.ts`)

`kickRunner` запускает `runQueue` (гвард `isRunnerActive` — вторая одновременная очередь не стартует). Цикл: `pickNextEntry` (минимальный `enqueuedAt`) → `processEntry` → пока очередь не пуста. В `processEntry`: URL снимается из `cacheQueueAtom` **inline** (НЕ через `removeQueueEntry` — requester'ы должны пережить снятие, чтобы отмена активной закачки видела joiners), `activeCacheUrlAtom(ctx, url)` (реактивный источник активной закачки), прогресс форвардится в зарегистрированные callbacks, загрузка через `cacheAudioWithProgress`, deferred резолвится/реджектится. В `finally`: `activeCacheUrlAtom(ctx, null)`, чистка requesters. Активная закачка отменяется через `cancelCacheDownload` → `audioCacheService.cancelAudioDownload(url)` (внутренний AbortController inflight-записи), поэтому раннер не держит собственный stop-controller. Защиты:

- **Sentinel на deferreds** (`createDeferred` в `cacheQueueState.ts`): `promise.catch(() => {})` сразу после создания — rejection до привязки аwaiter не превращается в unhandled rejection.
- **Lost-kick guard** — в `finally` раннера: запись, поставленная между последним `pickNextEntry` и `setRunnerActive(false)`, не должна «застрять» — если очередь снова непуста, раннер пере-kick'ается.
- **Crash-guard drain** — при неожиданной ошибке раннера `drainPendingEntries` реджектит все оставшиеся promis'ы и сбрасывает атом/requesters/прогресс-колбэки — ни один аwaiter не зависнет навсегда.

### Политика отмены по requesters

Отмена активной закачки через run-level stop («Остановить кеширование» в плейлисте) **не трогает иностранных джойнеров**: активная закачка прерывается только если **все** её requester'ы — `'playlist'` (`isOnlyPlaylistRequester` в `PlaylistCacheService.ts`). Если к закачке присоединился `'manual'` или `'auto'` — run-level отмена его не заденет (ручной тап или авто-кэш воспроизведения не должны быть убиты остановкой плейлист-прогона).

### Глобальный стоп (Issue #83)

Плейлист-прогон продолжается после ухода с экрана (by design, см. [debt.md](../debt.md) L29). Чтобы остановить **всё** кеширование из любого места, в правом верхнем углу полноэкранного плеера есть кнопка «Остановить все закачки» (`HeaderOverlay` → `StopAllCachingButton` → `useStopAllCaching` → `cancelAllCacheDownloads`).

**FSD-инверсия:** widgets не могут импортировать pages, поэтому семантика стопа живёт на уровне очереди (shared), а плейлист-прогон регистрирует свой стоппер в shared-реестре:

- `registerPlaylistRunStopper(stopper)` / `unregisterPlaylistRunStopper(stopper)` — реестр в `cacheQueueState.ts`; `cachePlaylist` регистрирует `() => controller.abort()` сразу после создания run-контроллера и снимает его в `finally`. Удаление **по идентичности** — `finally` старого прогона никогда не снимет стоппер нового.
- `invokePlaylistRunStopper()` — вызывает все зарегистрированные стопперы (no-op, когда их нет).

`cancelAllCacheDownloads(ctx)` — точный порядок:
1. **Guard «нет активной закачки + пустая очередь»** → ранний выход (no-op): стопперы **не** вызываются, уведомления не трогаются;
2. `invokePlaylistRunStopper()` — прерывает run-контроллер плейлиста, цикл `runPlaylistCaching` выходит на ближайшем `if (signal.aborted) break`, и `cachePlaylist` возвращается тихо через `if (controller.signal.aborted) return` — **без** ложного уведомления «Скачано N из N»;
3. активная закачка (`activeCacheUrlAtom`) → `cancelCacheDownload(activeUrl)` — **безусловно**, даже если у неё есть иностранные джойнеры (глобальный стоп отменяет всё);
4. дренаж: `removeFromQueue` для каждого URL в `cacheQueueAtom` (чистит requesters + прогресс + rejects deferred'ов `CacheCancelledError`).

Кнопка «Остановить все закачки» видна, когда очередь непуста **или** есть активная закачка (`useStopAllCaching`), и **всегда активна, в т.ч. офлайн** (отмена не требует сети).

### Состояние очереди в UI

- **Часы** (`clock-outline`, 16px, белый — та же семья/размер, что иконка облака) — URL в очереди (в `cacheQueueAtom`), загрузка ещё не началась. Прогресс-бара нет.
- **Прогресс-бар** — загрузка идёт (URL активен).
- Раннер удаляет запись из атома при старте загрузки, поэтому переход «часы → прогресс» реактивный без ре-рендера всего списка (точечная подписка, см. [debt.md](../debt.md)).
- **Resolver приоритета** — `resolveCacheState` (`src/shared/lib/audio-cache/resolveCacheState.ts`) определяет визуальное состояние строки: `playing → downloading → cached → queued → cloud` (высший → низший). **Cached бьёт queued**: `enqueueCache` дедуплицирует по queued/inflight, а **не** по cached — «кешировать все» может пере-поставить уже закэшированный URL; при обоих флагах трек реально закэширован, поэтому строка показывает «кэш» (без часов), а не очередь.

## Отмена скачивания (Issue #83)

`CacheCancelledError` (`src/shared/lib/audio-cache/CacheCancelledError.ts`) + `isCacheCancelledError` — маркер ручной отмены (через `cancelAudioDownload`/внешний AbortSignal). Ключевые свойства:

- **Отмена никогда не ретраится** — retry-цикл `downloadToCache` перед каждым решением о повторе проверяет отмену (`throwIfCancelled`); при отмене бросается `CacheCancelledError` без повторов.
- **`.part`-файл удаляется на отмене** (натив): `throwIfCancelled` зовёт `deletePartFile(tempFile)` перед броском — не оставляет хвостов.
- **Web удаляет незакоммиченную запись бакета** при отмене (`AudioCacheService.web.ts` → `downloadAndStoreAudio`), как и при любой неудаче.
- **Молчаливость** — путь отмены не рассматривается как «ошибка»: ручные отмены логируются тихо/не показывают ошибку UI, run-отмена плейлиста не порождает уведомлений.

## Автоматическое кэширование при воспроизведении

При старте трека `AudioLoader.getPlaybackUrl` (`src/entities/player/lib/PlayerService/AudioLoader.ts`) сначала ищет кэш; если файла нет — плеер **стримит** с сервера (`downloadFirst: false`, HTTP range requests), а параллельно `startBackgroundCaching` (`BackgroundCachingService.ts`) ставит трек в глобальную очередь (`enqueueCache(ctx, url, 'auto', onProgress)`) для скачивания в офлайн-кэш. Дублирование скачивания одного URL блокируется самой очередью (dedup по queued/inflight). Глобальные атомы (`downloadingAudioUrlAtom`, `isDownloadingAtom`, `downloadProgressAtom`) пишутся **лениво** — только на первом progress-тике (`claimed`-флаг владельца): сама постановка в очередь НЕ «захватывает» downloader-состояние, пока URL ждёт своей очереди. Поздний stale-тик (после того как более новый downloader уже захватил состояние) не крадёт его обратно и не пишет прогресс (guard `ctx.get(downloadingAudioUrlAtom) === audioUrl` на каждую запись). При отмене — `console.warn('[BackgroundCaching] Caching cancelled:', …)`; сбой фонового кэширования обрабатывается молча (`console.error`), глобальный диалог ошибок НЕ показывается (Issue #73); воспроизведение не затрагивается (стриминг), а при следующем запуске того же трека кэширование ставится в очередь заново. Прежний модульный `Set` in-flight URL и механика «ADOPT» глобальных атомов (`_resetInFlightDownloadsForTesting` и т.п.) удалены — роль single-flight и прогресса теперь выполняет очередь + requester-реестр + lazy-запись.

> **Web (Issue #81):** авто-кэш при воспроизведении теперь работает **на обеих платформах**. На web хук — `autoCacheOnPlay` (`src/entities/player/lib/PlayerService/webAutoCache.ts`), вызывается из `WebPlayerService.loadAudio` (покрывает и `replaceAudio`): проверяет `audioCacheService.isCached`, при отсутствии в кэше и онлайне (`isOnlineAtom`) запускает `startBackgroundCaching`. Fire-and-forget, воспроизведение не блокирует. Нативный путь через `AudioLoader.getPlaybackUrl` — без изменений.

## Скачивание одного трека

Все **три** ручные точки входа кеширования теперь проходят через глобальную очередь (`enqueueCache(ctx, url, 'manual', onProgress)`); общий helper `cacheAudioWithProgress` (`src/shared/lib/audio-cache/cacheAudioWithProgress.ts`) вызывается **раннером очереди** (а не самими точками входа) с единым протоколом: pre-set `0` перед стартом → тики `onProgress` → очистка записи в `finally` (успех, ошибка и skip-cached-путь, где `cacheAudio` резолвится без единого тика). Helper пишет/чистит `playlistDownloadProgressAtom` через `setTrackDownloadProgress`/`removeTrackDownloadProgress` из `shared/lib/cache-triggers` (Issue #82). Отмена идёт через `cancelCacheDownload` (снимает и очередь, и активную закачку).

- **Контекстное меню строки трека** (точки / долгое нажатие «Добавить в кеш») — `TracksListItemContextMenu` → `useTrackItemCache.toggleCache` (`src/shared/ui/track-list/useTrackItemCache.ts`). В зависимости от состояния: качается/в очереди → `cancelCacheDownload`; закэширован → `removeFromCache`; облако → `enqueueCache(ctx, url, 'manual')` (гейт `isOnline`). После успеха (ветки добавить и удалить) инкрементит `cacheUpdateTriggerAtom`. Подробнее про `isQueued`-подписку и offline-поведение — в разделах ниже.
- **Меню полноэкранного плеера** `PlayerMenu` (`src/widgets/expandable-player/ui/PlayerMenu/PlayerMenu.tsx`) — пункт «Добавить в кеш / Удалить из кеша / Остановить кеширование / Убрать из очереди» → `useFullscreenHandlers.handleToggleCache` → `enqueueCache(ctx, url, 'manual')` / `cancelCacheDownload` / `removeFromCache` (перепроводка с прямого `cacheAudio` на очередь была частью Issue #83). После успеха (обе ветки) инкрементит `cacheUpdateTriggerAtom`.
- **Прогон плейлиста** — `runPlaylistCaching` (`src/pages/playlist/lib/runPlaylistCaching.ts`) ставит все треки **одним батчем** через `enqueueCacheMany(ctx, urls, 'playlist')` (Issue #83 follow-up: одна запись в `cacheQueueAtom` вместо N — устранение фриза UI на ~140 треках).

`BackgroundCachingService` (`src/entities/player/lib/PlayerService/BackgroundCachingService.ts`) — отдельный источник `'auto'`: глобальный прогресс (`downloadProgressAtom` + downloader-атомы) пишет **лениво** через очередь (см. «Автоматическое кэширование при воспроизведении»), напрямую через `cacheAudioWithProgress` не идёт.

## Офлайн: добавление в кеш недоступно

Добавление в кеш требует интернета, поэтому все UI-действия «добавить» дизейблятся при `!isOnline` (`isOnlineAtom` из `shared/model/network`). Удаление из кеша работает офлайн и остаётся активным.

- **Плейлист «Закешировать все»** — `usePlaylistCacheMenu` (`src/pages/playlist/lib/usePlaylistCacheMenu.ts`): `isCacheAllDisabled = allCached || !isOnline` (уже **не** включает `isCaching` — меню не блокируется во время кеширования; вместо «Закешировать все» показывается пункт «Остановить кеширование»). «Удалить из кеша все» от сети не зависит.
- **Контекстное меню строки трека** — `useTrackItemCache` (`src/shared/ui/track-list/useTrackItemCache.ts`) подписывается на `isOnlineAtom` и возвращает `isCacheDisabled = !isOnline && !isCached && !isDownloading && !isQueued`: дизейблится **только** ветка «облако» (старт закачки офлайн); пункты «Остановить кеширование» (качается) и «Убрать из очереди» (в очереди) **всегда активны, в т.ч. офлайн** — отмена не требует сети. Поведенческий guard `toggleCache` гейтит сетью только cloud-ветку (`if (!isOnline) return` перед `enqueueCache`); cancel/remove работают офлайн. Ошибки ручного enqueue логируются `console.warn` (кроме `CacheCancelledError` — тихо).
- **Меню полноэкранного плеера** — `PlayerMenuItems` (`src/widgets/expandable-player/ui/PlayerMenu/PlayerMenuItems.tsx`): `isCacheDisabled = !isOnline && !isCached && visualState === 'cloud'`; строки «Добавить в кеш» рендерится как обычный disabled-пункт меню. «Удалить из кеша» (закэширован), «Остановить кеширование» (качается) и «Убрать из очереди» (в очереди) остаются активными офлайн. Поведенческий no-op guard в `useFullscreenHandlers.handleToggleCache` гейтит сетью только cloud-ветку.

## Скачивание плейлиста целиком

`PlaylistCacheService` — `src/pages/playlist/lib/PlaylistCacheService.ts` (`playlistCacheService`). Метод `cachePlaylist(ctx, tracks, playlistTitle)`:

- **re-entry guard**: если `isCachingPlaylistAtom` уже `true` — второй вызов игнорируется (возврат);
- фильтрует треки без `audioUrl`; ставит `isCachingPlaylistAtom = true` и прогресс `playlistCacheProgressAtom = { current, total }`;
- делегирует прогон в `runPlaylistCaching` (`runPlaylistCaching.ts`): **сначала ставит ВСЕ треки в глобальную очередь одним батчем** (`enqueueCacheMany(ctx, urls, 'playlist')` — все строки сразу получают «часы»), затем **await-ит промисы по очереди** (в порядке треков);
- перед каждым треком проверяет подключение (`waitForOnline`, до 60с, **signal-aware**: возвращает `false` на abort ДО сетевой ошибки) — если сеть не вернулась, прогон прерывается ошибкой «Нет подключения к интернету»; неудача одного трека не прерывает остальные;
- после каждого `await` проверяет `if (signal.aborted) break` — отменённый прогон выходит из цикла раньше;
- per-track `CacheCancelledError` = просто `continue` (скipped, не считается ошибкой — реальная отмена, не сбой);
- показывает системные уведомления (`PlaylistCacheNotifications.ts`): начало, прогресс «Скачано N из M», завершение «Скачано N проповедей» либо ошибка «Не удалось скачать X из N» при частичной неудаче (группа `playlist-cache`, фиксированный ID); **отменённый прогон НЕ показывает уведомлений** (в `cachePlaylist` после `runPlaylistCaching` стоит `if (controller.signal.aborted) return`);
- обновляет `playlistDownloadProgressAtom` (по URL трека, через `setTrackDownloadProgress`) и **не инкрементирует `cacheUpdateTriggerAtom`** — завершение трека отражается через optimistic-оверлей `cachedUrlsAtom` (пишется в `cacheAudioWithProgress`) + атомы прогресса/очереди, без троттлинга и без full-list re-render'ов (см. «Реестр закешированных URL» ниже);
- сброс состояния — **только в `finally`**: `isCachingPlaylistAtom = false` + `removeFromQueueBySource(ctx, 'playlist')` (чистит оставшиеся записи очереди от этого прогона). **Generation guard**: `cachePlaylist` инкрементирует `currentRunId` на старте, а `finally` сбрасывает состояние только если `currentRunId === runId` — поздний `finally` устаревшего прогона никогда не дренирует очередь и не затирает атом/контроллер преемника (cross-run race, Issue #83). **Отмена намеренно НЕ инкрементирует `currentRunId`** — сброс состояния живёт только в guarded `finally`; бамп на отмене пропустил бы teardown и оставил бы `isCachingPlaylistAtom` застрявшим в `true`. Глобального сброса `playlistDownloadProgressAtom` в `{}` нет — см. «Состояние».

### Отмена прогона (`cancelPlaylistCache`)

`PlaylistCacheService.cancelPlaylistCache(ctx)` — **один синхронный блок** (без await):

1. если не `isCachingPlaylistAtom` — возврат;
2. если есть активная закачка и **все её requester'ы ⊆ `{'playlist'}`** (`isOnlyPlaylistRequester`) — `cancelCacheDownload(activeUrl)` (активная закачка, принадлежащая только этому прогону, прерывается; иностранных джойнеров — manual/auto — не трогает);
3. `runController.abort()` — останавливает цикл `runPlaylistCaching` на ближайшем `if (signal.aborted) break`;
4. `removeFromQueueBySource(ctx, 'playlist')` — снимает все ещё ждущие записи очереди этого прогона.

Отмена не порождает уведомлений (см. выше).

UI и хуки — `src/pages/playlist/lib/`:

- `usePlaylistCacheMenu.ts` — состояние меню кэша на экране плейлиста (диалоги подтверждения, позиция меню).
- `usePlaylistCacheStatus.ts` — подсчёт закэшированных треков (`allCached`, `cachedCount`, `totalCount`). **Debounce 250мс** (Issue #83 follow-up): первый `isCached`-проход по трекам идёт немедленно при смене набора треков, последующие перепроверки по `cacheUpdateTriggerAtom` — trailing-дебаунс 250мс. Бёрст инкрементов триггера (массовое завершение закачек) схлопывается в одну перепроверку — устранение N-кратных синхронных `File.exists` бёрстов (см. [debt.md](../debt.md)). Дополнительно подписан на `cachedUrlsAtom` (narrow subscription): завершение трека в текущей сессии обновляет счётчики **реактивно, без инкремента триггера и без FS-перепроверки**.
- `PlaylistHeaderMenu.tsx`, `PlaylistCacheMenuItem.tsx`, `PlaylistHeaderMenuDropdown.tsx`, `PlaylistCacheDialogs.tsx` — в `src/pages/playlist/ui/`.

## Реестр закешированных URL (optimistic overlay)

`cachedUrlsAtom` (`src/shared/lib/cache-triggers.ts`) — **сессионный** реестр URL, которые в текущей сессии точно завершили скачивание. Пишется **синхронно** в `cacheAudioWithProgress` (`markUrlCached`) сразу после резолва `audioCacheService.cacheAudio` и **до** удаления записи прогресса — строка переходит progress→cached атомарно, без промежуточного кадра «облако» (раньше `isCached` подтверждался только через throttle(300мс)→trigger→full re-render→async `File.exists`, отсюда мигание иконки ~1с).

Семантика и границы:

- **Не персистится, не является истиной.** После рестарта приложения реестр пуст — UI снова опирается на реальный FS-скан (`isCached`/`usePlaylistCacheStatus`). Внешние мутации файлов кэша (ручное удаление, web-очистка бакета) покрываются только оставшимися инкрементами `cacheUpdateTriggerAtom`.
- **Запись:** `markUrlCached(ctx, url)` — no-diff bailout (повторная запись того же URL не меняет ссылку атома). Вызывается из `cacheAudioWithProgress` для **всех** источников (`'auto'`, `'manual'`, `'playlist'`) — единая точка завершения закачки. Join-inflight/skip-cached пути помечают идемпотентно/безвредно.
- **Удаление:** `markUrlEvicted(ctx, url)` — из веток `removeFromCache` (`useTrackItemCache`, `useFullscreenHandlers`); `clearCachedUrls(ctx)` — из полных очисток кэша (`usePlaylistCacheMenu.handleClearCacheConfirm`, `clearCacheAction` в настройках).
- **Потребители:** `useIsCached` (overlay-hit ИЛИ FS-результат) и `usePlaylistCacheStatus` (union per-track FS-результатов с overlay) — оба через narrow `ctx.subscribe` + `useState` с Object.is-bailout, чтобы запись реестра ре-рендерила только затронутые строки.
- **Плейлист-прогон больше не инкрементирует `cacheUpdateTriggerAtom`** (`runPlaylistCaching`): UI обновляется чисто через overlay + прогресс + очередь. Это убирает full-list re-render (`PlaylistScreen.renderItem` deps) и 140×`isCached`-рескан (debounce 250мс) на каждое завершение в больших плейлистах.
- **Известное ограничение (web):** `openAudioCache` при повреждённом бакете делает полный `caches.delete` — в текущей сессии overlay может остаться stale-true для URL, чьи записи реально удалены. Редко, самовосстанавливается (следующий FS-скан/рестарт), задокументировано как limitation.

## Очистка кэша

В Настройках (`src/pages/settings/ui/SettingsScreen.tsx`) пункт «Очистить кэш» → `ClearCacheDialog.tsx` → `clearCacheAction` (`src/pages/settings/model.ts`) → `audioCacheService.clearCache()`. После очистки action сбрасывает optimistic-реестр (`clearCachedUrls`) и инкрементирует `cacheUpdateTriggerAtom` (строки/плейлист перепроверяют состояние). Пункт реактивно дизейблится, пока очередь непуста или идёт активная закачка (`cacheQueueAtom` + `activeCacheUrlAtom`); `clearCacheAction` дополнительно перепроверяет `hasInflightCacheDownloads()` на нажатии — press-time guard, defense-in-depth (паритет с меню плейлиста).

> **Примечание:** Кэш изображений (`expo-image`, `cachePolicy='memory-disk'`) физически отделён от `document/audio-cache` и этими операциями не затрагивается. Подробнее — [features/images.md](./images.md).

## Hooks

- `useIsCached` (`src/shared/lib/audio-cache/useIsCached.ts`) — проверка кэша для конкретного `audioUrl`, опциональный `cacheTrigger` для перепроверки. Возвращает `fsResult || overlayHit` — мгновенный ответ из `cachedUrlsAtom` (если URL завершил скачивание в этой сессии) поверх асинхронного `File.exists`.

## Состояние

Атомы скачивания — `src/entities/player/lib/download-model.ts`:

- `downloadProgressAtom` (0..1), `isDownloadingAtom`, `downloadingAudioUrlAtom` + set-экшены. Запись в `downloadProgressAtom` защищена проверкой `downloadingAudioUrlAtom === audioUrl` — при параллельных скачиваниях старый трек продолжает работать в фоне, но его тики не перезаписывают глобальный прогресс. `playlistDownloadProgressAtom` остаётся per-URL и не гвардится (список треков показывает прогресс каждого трека корректно). Прогресс сбрасывается в `0` только при старте нового скачивания (`startBackgroundCaching`), не в `.finally()` — это исключает гонку при параллельных скачиваниях.

Триггеры обновления UI — `src/shared/lib/cache-triggers.ts`:

- `cacheUpdateTriggerAtom` (инкрементируется `incrementCacheTrigger`);
- `cachedUrlsAtom` — optimistic-реестр URL, завершивших скачивание в текущей сессии (`Record<string, true>`). Пишется `markUrlCached`/`markUrlEvicted`/`clearCachedUrls` (см. «Реестр закешированных URL» выше);
- `playlistDownloadProgressAtom` — прогресс по URL (`Record<string, number>`). Запись идёт **только** через helper `cacheAudioWithProgress` (`shared/lib/audio-cache/cacheAudioWithProgress.ts`), который вызывается **раннером глобальной очереди** (`cacheQueueRunner.ts`) для **всех** источников (`'auto'`, `'manual'`, `'playlist'`). Helper пишет через `setTrackDownloadProgress` и чистит через `removeTrackDownloadProgress` (оба из `shared/lib/cache-triggers`) — запись создаётся до старта скачивания, тики обновляют прогресс, запись удаляется в `finally` (успех и ошибка); на успехе перед удалением прогресса вызывается `markUrlCached`. Глобального сброса атома в `{}` больше нет — его убрали из `PlaylistCacheService.cachePlaylist`, т.к. он стирал прогресс параллельных ручных скачиваний (Issue #82).

Константа ключа — `src/shared/config/cache-storage-keys.ts` (`CACHED_SECTIONS`). Ключи хранилища — [storage.md](../contracts/storage.md).

### download-model (entities/player)

`src/entities/player/lib/download-model.ts` — атомы скачивания **одного** трека + синхронные set-экшены (`setDownloadProgressAction`, `setIsDownloadingAction`, `setDownloadingUrlAction`). Используются и `BackgroundCachingService`, и UI-компонентами для отображения прогресса загрузки текущего трека. Спиннер в плеере (play/pause кнопка) показывается **только при буферизации** (`isBuffering` — воспроизведение невозможно); фоновое скачивание (`isDownloading`) не блокирует кнопку play. Прогресс скачивания отображается отдельно: в полноэкранном плеере — серый слой на `PlayerProgressBar` (под основным прогрессом), в мини-плеере — тонкая полоса (2px) вдоль нижнего края карточки.

## Поток скачивания

1. **Старт воспроизведения** → `AudioLoader.getPlaybackUrl`: нет в кэше → `startBackgroundCaching` → `enqueueCache('auto')` (авто-кэш без действия пользователя, в глобальную очередь).
2. **Ручное скачивание трека** → меню плеера `PlayerMenu` → `handleToggleCache` → `enqueueCache('manual')`/`cancelCacheDownload`/`removeFromCache`; либо контекстное меню строки трека → `useTrackItemCache.toggleCache` (обе точки входа — через глобальную очередь с per-URL прогрессом, Issue #82/#83).
3. **Скачивание плейлиста** → `PlaylistCacheService.cachePlaylist` (все треки в очередь, последовательный прогон, с прогрессом и системными уведомлениями).
4. **Очистка кэша** → Настройки → `ClearCacheDialog`.

После любого изменения кэша инкрементируется `cacheUpdateTriggerAtom`, чтобы хуки (`useIsCached`, `usePlaylistCacheStatus`) перепроверили состояние. Исключение — завершение закачки: оно пишет `cachedUrlsAtom` (overlay) и **не** инкрементирует триггер (см. «Реестр закешированных URL»).

## Связанные документы

- [player.md](./player.md) — автоматическое кэширование при старте трека
- [offline-and-network.md](./offline-and-network.md) — офлайн-прослушивание
- [storage.md](../contracts/storage.md) — ключи AsyncStorage
