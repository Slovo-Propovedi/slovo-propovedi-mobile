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
- **`.part`-файл** — между попытками НЕ удаляется (`idempotent: true` перезапишет его); удаляется только после окончательной неудачи всех попыток (плюс `console.error`, затем ретроу последней ошибки).

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
