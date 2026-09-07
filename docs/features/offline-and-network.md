# Офлайн и сеть

**Слой:** `shared/lib/network`, `shared/model/network`, `shared/lib/sections-cache`, `widgets/network-status`
**Статус:** готов

## Мониторинг сети

- `subscribeToNetwork` (`src/shared/lib/network/networkSubscription.ts`) — подписка на `@react-native-community/netinfo`; на каждое изменение пишет `isOnlineAtom` (`src/shared/model/network.ts`). Вызывается модульно в `app/_RootLayout.tsx`.
- `NetworkBanner` (`src/widgets/network-status/ui/NetworkBanner.tsx`) — пилюля «Офлайн» поверх экрана (`testID='network-banner'`); появляется при `!isOnline`, анимация разворота — `useNetworkIslandAnimation.ts`. При возврате онлайн скрывается.

## Доступность сервера

`src/shared/model/network.ts`:

- `serverUnreachableAtom` — сервер не ответил;
- `reportServerUnreachable(ctx)` — устанавливает флаг (только один раз за «эпизод» сбоя, авто-сброс через 4с);
- `reportServerReachable(ctx)` — сбрасывает флаг.

`ServerErrorToast` (`src/widgets/network-status/ui/ServerErrorToast.tsx`) — тост «Сервер недоступен», виден когда `isOnline && serverUnreachable`.

**Интеграция с Axios** — `src/shared/api/axiosInstance.ts`:

- response-interceptor: успех → `reportServerReachable(ctx)`; сетевая ошибка (нет `error.response`) → `reportServerUnreachable(ctx)`.
- Дополнительно: request-interceptor добавляет `Bearer`-токен, 401 → `performTokenRefresh` → повтор запроса; при провале refresh токены очищаются.

## Ожидание сети

`waitForOnline(timeoutMs)` (`src/shared/lib/network/waitForOnline.ts`) — асинхронное ограниченное ожидание подключения: сразу (без начальной задержки) опрашивает `NetInfo.fetch()`, при офлайне повторяет опрос раз в секунду; резолвится `true` при первом же «онлайн»-ответе или `false`, если истёк `timeoutMs`. Используется:

- в retry-цикле скачивания кэша (`src/shared/lib/audio-cache/cacheDownloader.ts`) — ожидание сети до 60с перед каждой повторной попыткой;
- в скачивании плейлиста (`src/pages/playlist/lib/runPlaylistCaching.ts`) — проверка перед каждым треком; если сеть не вернулась за 60с, весь прогон прерывается ошибкой «Нет подключения к интернету».

## Офлайн-повтор запроса

`useOfflineRetry` (`src/shared/lib/network/useOfflineRetry.ts`) — перезапрос данных при возврате онлайн, при выходе приложения в foreground и по фиксированному интервалу (5с без кэша / 30с с кэшем — `src/shared/lib/network/constants.ts`). Принимает `fetchFn`, `hasCachedData`, `isLoading`, `needsRetry`.

## Кэш секций

`src/shared/lib/sections-cache/` — `getCachedSections` / `setCachedSections`, ключ `CACHED_SECTIONS` (`src/shared/config/cache-storage-keys.ts`).

Поток `fetchAllSections` (`src/pages/listen/model.ts`):

1. запрос `sectionsApi.getSections().sectionControllerFindAll()` (сеть);
2. при сетевой ошибке — чтение кэша (`getCachedSections`), источник `'cache'`;
3. успешный сетевой ответ всегда пишется в кэш (fire-and-forget `setCachedSections`).

Источник фиксируется в `sectionDataSourceAtom` (`'cache' | 'network' | 'unknown'`). На главном экране `useOfflineRetry` (в `src/pages/listen/`) перезапрашивает, если последний ответ был не из сети.

### Механизм `useOfflineRetry`

`src/shared/lib/network/useOfflineRetry.ts` — использует refs (`fetchFnRef`, `needsRetryRef`, `isLoadingRef`) и `inflightRef` для защиты от дублирующих параллельных запросов. Три триггера:

1. возврат в **foreground** (`AppState` → `'active'`);
2. восстановление **connectivity** (`isOnline` стал `true`);
3. **polling** по интервалу (только в foreground): 5с (`RETRY_INTERVAL_NO_DATA_MS`) или 30с (`RETRY_INTERVAL_CACHED_MS`) в зависимости от `hasCachedData`.

## Кэш поиска проповедей

`src/features/sermon-search/lib/searchCache.ts` — `getCachedSearchResults` / `setCachedSearchResults`, ключи `cachedSermonSearch:<query>` + индекс `cachedSermonSearch:index` (`src/shared/config/cache-storage-keys.ts`). Ключ запроса нормализуется (`trim` + `toLowerCase`); пустые результаты не кэшируются; индекс хранит до 30 последних ключей, при переполнении самые старые удаляются (`AsyncStorage.multiRemove`). Универсальные обёртки — `src/shared/lib/cache/` (`getCachedJson` / `setCachedJson`).

Поток `fetchSearchResults` (`src/features/sermon-search/model.ts`):

1. запрос `sermonsApi.getSermons().sermonControllerFindAll({ search, take: 20 })` (сеть);
2. успешный ответ всегда пишется в кэш (fire-and-forget `setCachedSearchResults`);
3. при сетевой ошибке — чтение кэша (`getCachedSearchResults`); при непустом результате он показывается, иначе — пустое состояние «Ничего не найдено»;
4. защита от устаревших ответов: кэш-фолбэк применяется, только если `requestId === latestRequestId` (медленное чтение кэша не перезаписывает более свежий поиск).

`useOfflineRetry` для поиска **не** используется (нет UI-индикатора источника данных — см. `docs/debt.md`).

## Кэш подсказок поиска

`src/features/sermon-search/lib/distinctValuesCache.ts` — `getCachedDistinctValues` / `setCachedDistinctValues` над ключом `cachedDistinctValues` (`CACHED_DISTINCT_VALUES` в `src/shared/config/cache-storage-keys.ts`) с zod-схемой `distinctValuesSchema` (`{ artists: string[], books: string[] }`); невалидный кэш на чтении трактуется как отсутствующий. Универсальные обёртки — `src/shared/lib/cache/` (`getCachedJson` / `setCachedJson`).

Поток `fetchDistinctValues` (`src/features/sermon-search/model-distinctValues.ts`):

1. однократный запрос `sermonsApi.getSermons().sermonControllerGetDistinctValues()` при открытии поиска (повторные сессии не перезапрашивают: guard `distinctValuesAtom !== null` + in-flight guard + `requestId` от stale-ответов);
2. успешный сетевой ответ пишется в кэш (fire-and-forget `setCachedDistinctValues`);
3. при сетевой ошибке — чтение кэша (`getCachedDistinctValues`); кэша нет — подсказки тихо не показываются (ошибки логируются `console.error` и не ломают существующий поиск).

`useOfflineRetry` для подсказок **не** используется (однократная загрузка на сессию поиска).

## Кэш аудио

Офлайн-прослушивание обеспечивает кэш аудио — [audio-cache.md](./audio-cache.md). При старте трека `AudioLoader` сначала берёт закэшированный файл, иначе стартует фоновое кэширование.

## Офлайн-guard при воспроизведении (Issue #81)

Общий guard `guardOfflinePlayback(audioUrl, isOnline)` (`src/entities/player/lib/playOfflineGuard.ts`) проверяет сеть и кэш перед стартом воспроизведения:

- **офлайн + трек не закэширован** → вместо попытки воспроизведения (которая раньше падала с глобальной ошибкой «Ошибка при воспроизведении аудио / The media resource … was not suitable») показывается информационная модалка `showInfo(OFFLINE_PLAYBACK_MESSAGE)` (в стиле `ConfirmDialog`, без иконки, заголовок «Информация» по умолчанию) с текстом «Невозможно воспроизвести незакешированную проповедь без интернета», и воспроизведение блокируется (guard вернул `true`);
- **офлайн + трек закэширован** → воспроизведение из кэша идёт нормально;
- **онлайн** → поток без изменений.

Guard покрывает все пути старта воспроизведения:

1. **Тап на трек** — `usePlayNewSermon` (`src/entities/player/lib/usePlaySermon.ts`): при блокировке `currentAudio`/`currentPlaylist` не задаются, `replaceAudio`/`play` не вызываются, полноэкранный плеер не открывается.
2. **Toggle-play (пауза → play)** — единый хук `useGuardedTogglePlay` (`src/entities/player/lib/useGuardedTogglePlay.ts`): при блокировке `play()` не вызывается, плеер остаётся на паузе. Пауза (play → pause) guard'ом не блокируется. Хук используется всеми play/pause-кнопками: полноэкранный плеер (`useFullscreenHandlers`), мини-плеер (`ExpandablePlayer`) и кнопка play в `PlayerControls`.
3. **Next/Prev переключение трека** — `usePlayerToggleTrack` (`src/entities/player/ui/PlayerControls/usePlayerToggleTrack.ts`) вызывает guard перед `executeTrackSwitch` (когда у целевого трека есть `audioUrl`): при блокировке переключение не происходит, wrap-уведомление не показывается.
4. **Web media-session play** — play-хендлер `webMediaSession.ts` вызывает guard при паузе (когда `currentAudio.audioUrl` существует): при блокировке `play()` не вызывается.
5. **Нативный авто-переход по окончании трека** — `TrackAutoAdvanceService.advanceToNextTrack` (`src/entities/player/lib/PlayerService/TrackAutoAdvanceService/TrackAutoAdvanceService.ts`) вызывает guard перед **каждым** из трёх путей перехода — next (`playNextTrack`), repeat-one (`repeatCurrentTrack`) и queue-restart на последнем треке (`playFirstTrackInQueue`) — до любых мутаций (`setCurrentAudioAction`/`replaceAudio`/`play`/lock-screen-метаданных): при блокировке переключение/повтор не происходит, показывается **один** дружелюбный диалог guard'а, и воспроизведение просто заканчивается на текущем треке (плеер переходит в остановленное состояние). Guard срабатывает по целевому `audioUrl` (для queue-restart — первый трек плейлиста); если у целевого трека нет `audioUrl`, ветка ведёт себя как раньше. Generic-ошибка «Ошибка при автоматическом переходе к следующей проповеди» осталась только для других (онлайн) сбоев загрузки.

Guard проверяет `isOnlineAtom` (NetInfo) и `audioCacheService.isCached(audioUrl)` (с молчаливым `catch(() => false)` — сбой проверки кэша трактуется как «не закэшировано»). Работает на обеих платформах.

## Офлайн: UI добавления в кеш дизейблится

При `!isOnline` все действия «добавить в кеш» недоступны (требуют интернета), а «удалить из кеша» работает офлайн:

- «Закешировать все» на экране плейлиста — `usePlaylistCacheMenu` (`src/pages/playlist/lib/usePlaylistCacheMenu.ts`): `isCacheAllDisabled` включает `!isOnline`;
- «Добавить в кеш» в контекстном меню строки трека — `useTrackItemCache.isCacheDisabled` (`src/shared/ui/track-list/useTrackItemCache.ts`) + no-op guard в `toggleCache`;
- «Добавить в кеш» в меню полноэкранного плеера — `PlayerMenuItems.isCacheDisabled` (`src/widgets/expandable-player/ui/PlayerMenu/PlayerMenuItems.tsx`).

Подробнее — [audio-cache.md](./audio-cache.md) → «Офлайн: добавление в кеш недоступно».

## Поток: offline ↔ online

- **Offline:** `NetInfo` → `isOnlineAtom = false` → показывается `NetworkBanner`; API-вызовы падают с сетевой ошибкой → `reportServerUnreachable` → `ServerErrorToast`; `fetchAllSections` показывает кэш секций; поиск проповедей показывает per-query кэш (`cachedSermonSearch:<query>`), если он есть; подсказки поиска берутся из кэша `cachedDistinctValues`, если он есть (иначе скрываются); аудио играет из кэша.
- **Online:** `isOnlineAtom = true` → баннер скрывается; `useOfflineRetry` немедленно перезапрашивает данные; успешные ответы → `reportServerReachable`; поиск пишет свежие результаты в кэш.

### Различие баннера и тоста

- `NetworkBanner` — состояние **интернета** (`isOnlineAtom`, NetInfo). Показывается, когда устройство офлайн.
- `ServerErrorToast` — состояние **сервера** (`serverUnreachableAtom`). Показывается, когда интернет есть, но сервер не ответил. `reportServerUnreachable` не срабатывает при `!isOnline`, чтобы не дублировать баннер.

### Экраны и widgets

- `widgets/network-status` — `NetworkBanner`, `ServerErrorToast`, `useNetworkIslandAnimation` (анимация пилюли). Экспорт — `src/widgets/network-status/index.ts`.
- Оба виджета рендерятся в корневом стеке `app/_RootLayout.tsx` поверх навигации и не перекрывают контент (position: absolute, zIndex 100).
- Внешние зависимости: `@react-native-community/netinfo` (мониторинг), `expo-file-system` + `shared/lib/audio-cache` (офлайн-аудио).

### Константы повторов

`src/shared/lib/network/constants.ts`:

- `RETRY_INTERVAL_NO_DATA_MS = 5_000` — повтор каждые 5с, если кэша нет (нужны свежие данные);
- `RETRY_INTERVAL_CACHED_MS = 30_000` — повтор каждые 30с, если показывается кэш (меньше нагрузки).

## Связанные документы

- [state.md](./state.md) — атомы сети (`isOnlineAtom`, `serverUnreachableAtom`)
- [audio-cache.md](./audio-cache.md) — кэш аудио
- [storage.md](../contracts/storage.md) — ключи `cachedSections` и `cachedSermonSearch:*`
- [../screens/listen.md](../screens/listen.md) — офлайн-состояние главного экрана
