# AsyncStorage — ключи и форматы

Локальное хранилище приложения — `@react-native-async-storage/async-storage` (key/value, строки). Хранит: JWT-токены, кэш секций, состояние плеера, настройки сервера и темы, версию последнего уведомления об обновлении.

Константы ключей лежат в `src/shared/config/` (`player-storage-keys.ts`, `cache-storage-keys.ts`, `server-storage-keys.ts`) и реэкспортируются через `src/shared/config/index.ts`. Ключи токенов объявлены прямо в `src/shared/api/axiosInstance.ts`.

## Все ключи

| Ключ | Константа / где объявлена | Тип значения | Где пишется | Где читается | Назначение |
|------|---------------------------|--------------|-------------|--------------|------------|
| `@access_token` | `ACCESS_TOKEN_KEY` — `src/shared/api/axiosInstance.ts` | строка JWT | `performTokenRefresh`, `tokenStorage.setTokens` | request-interceptor (`Bearer`), `tokenStorage.getAccessToken` | access-токен |
| `@refresh_token` | `REFRESH_TOKEN_KEY` — `src/shared/api/axiosInstance.ts` | строка JWT | `performTokenRefresh`, `tokenStorage.setTokens` | `performTokenRefresh` | refresh-токен |
| `currentAudio` | `CURRENT_AUDIO` — `src/shared/config/player-storage-keys.ts` | JSON `AudioPlayerData` | `setCurrentAudioAction` — `src/entities/player/model.ts` | `initializePlayer`, `TrackAutoAdvanceService` (парсинг `audioPlayerDataSchema`) | последний воспроизводимый аудио-объект |
| `currentPlaylist` | `CURRENT_PLAYLIST` — там же | JSON `PlaylistData` | `setCurrentPlaylistAction` — `src/entities/player/model.ts` | `initializePlayer`, `TrackAutoAdvanceService` (парсинг `playlistDataSchema`) | последний плейлист |
| `currentSoundPosition` | `CURRENT_SOUND_POSITION` — там же | число (мс) как строка | `savePlaybackPositionAction` — `src/entities/player/model.ts`; `PlaybackController.ts` | `initializePlayer`, `TrackAutoAdvanceService` (multiGet) | позиция воспроизведения |
| `currentSoundDuration` | `CURRENT_SOUND_DURATION` — там же | число как строка | `AudioLoader.ts`; `index.web.ts` | (восстановление состояния) | длительность аудио |
| `currentSoundVolume` | `CURRENT_SOUND_VOLUME` — там же | число как строка | `setVolumeAction` — `src/entities/player/model.ts` | (восстановление состояния) | громкость |
| `currentRepeatMode` | `CURRENT_REPEAT_MODE` — там же | строка: `off` / `queue` / `track` | `setRepeatModeAction` — `src/entities/player/model.ts` | (восстановление состояния) | режим повтора |
| `cachedSections` | `CACHED_SECTIONS` — `src/shared/config/cache-storage-keys.ts` | JSON `SectionData[]` | `setCachedSections` — `src/shared/lib/sections-cache/` | `getCachedSections` (фолбэк при офлайне) | кэш секций главного экрана |
| `cachedDistinctValues` | `CACHED_DISTINCT_VALUES` — `src/shared/config/cache-storage-keys.ts` | JSON `{ artists: string[], books: string[] }` | `fetchDistinctValues` — `src/features/sermon-search/model-distinctValues.ts` (fire-and-forget при успешном сетевом ответе) | `fetchDistinctValues` — там же (фолбэк при сетевой ошибке) | кэш ранее использованных проповедников и книг для подсказок поиска; zod-валидация при чтении через `distinctValuesSchema` (`src/features/sermon-search/lib/distinctValuesCache.ts`), невалидный кэш = отсутствует |
| `cachedSermonSearch:<query>` | `CACHED_SERMON_SEARCH` — `src/shared/config/cache-storage-keys.ts` (префикс) | JSON `SermonData[]` | `setCachedSearchResults` — `src/features/sermon-search/lib/searchCache.ts` | `getCachedSearchResults` (фолбэк при офлайне) | per-query кэш результатов поиска проповедей; `<query>` — нормализованный запрос (`trim` + `toLowerCase`) |
| `cachedSermonSearch:index` | `CACHED_SERMON_SEARCH_INDEX` — там же | JSON `string[]` (полные ключи запросов) | `setCachedSearchResults` (обновление индекса) | `setCachedSearchResults` (ротация) | индекс недавних запросов поиска; при превышении 30 записей самые старые удаляются через `AsyncStorage.multiRemove` |
| `server-url` | `SERVER_URL` — `src/shared/config/server-storage-keys.ts` | строка URL | `setServerUrlAction` — `src/entities/settings/model.ts` | `initServerUrlAction` — там же | кастомный URL сервера |
| `theme_mode` | `THEME_MODE_KEY` (локальная) — `src/shared/ui/theme/model.ts` | строка `system` / `light` / `dark` | `setThemeMode` — там же | `loadThemeMode` — там же | режим темы |
| `dynamic_colors` | `DYNAMIC_COLORS_KEY` (локальная) — `src/shared/ui/theme/model.ts` | строка `'true'` / `'false'` | `setDynamicColors` — там же | `loadDynamicColors` — там же | включены ли Material You (динамические) цвета |
| `last-update-notified-version` | `LAST_UPDATE_NOTIFIED_KEY` (локальная) — `src/shared/model/update.ts` | строка (версия релиза) | `src/shared/model/update.ts` | там же | версия, на которую уже показано уведомление об обновлении |

> Ключи токенов (`@access_token`, `@refresh_token`) **не** объявлены в `src/shared/config/` — они живут только в `src/shared/api/axiosInstance.ts` как `ACCESS_TOKEN_KEY` / `REFRESH_TOKEN_KEY`. Остальные ключи описаны в `src/shared/config/` и экспортируются через `shared/config`.

## Формат

- **Структурированные данные** (аудио, плейлист, секции, результаты поиска) хранятся как **JSON-строки** через `JSON.stringify` / `JSON.parse`.
- **Простые скаляры** (позиция, громкость, длительность, режим повтора, тема, флаги) хранятся как строки через `String(...)`.
- **Безопасный парсинг JSON — через `getParseJsonWithSchema(schema)`** (`src/shared/model/getParseJsonWithSchema.ts`): оборачивает Zod-схему (`customZ.jsonSchema(...).safeParse`) и возвращает `undefined` при отсутствии/невалидности данных. Универсальные обёртки для кэша — `getCachedJson(key, schema)` / `setCachedJson(key, value)` (`src/shared/lib/cache/`): читают/пишут JSON под ключом с тем же безопасным парсингом. Используются для восстановления `AudioPlayerData`/`PlaylistData` (`src/entities/player/lib/initializePlayer.ts`), секций (`src/shared/lib/sections-cache/getCachedSections.ts`), результатов поиска (`src/features/sermon-search/lib/searchCache.ts`) и подсказок поиска (`src/features/sermon-search/lib/distinctValuesCache.ts`).
- Доменные Zod-схемы для восстановления: `src/shared/model/domain/common.ts` (`sectionSchema`, `sermonSchema`, `playlistSchema`, `audioPlayerDataSchema` и т.д.).

## Жизненный цикл

- **Токены**: пишутся при входе/refresh (`tokenStorage.setTokens`, `performTokenRefresh`), читаются request-interceptor'ом и `performTokenRefresh`, чистятся при logout / неудачном refresh (`tokenStorage.clearTokens`, `multiRemove` в `axiosInstance.ts`).
- **Плеер** (`currentAudio`, `currentPlaylist`, позиция, громкость, режим повтора, длительность): пишутся в Reatom-экшенах `src/entities/player/model.ts` и `PlayerService/*`; восстанавливаются при старте через `src/entities/player/lib/initializePlayer.ts` (multiGet + Zod-парсинг).
- **Кэш секций** (`cachedSections`): пишется после успешной загрузки с сети (online-first, fire-and-forget) и читается как фолбэк при недоступности сети. Логика — `src/pages/listen/model.ts` (`fetchAllSections`) + `src/shared/lib/sections-cache/`.
- **Кэш поиска проповедей** (`cachedSermonSearch:<query>`, `cachedSermonSearch:index`): пишется после успешного ответа `sermonControllerFindAll` (online-first, fire-and-forget в `fetchSearchResults`), читается как фолбэк при сетевой ошибке. Ключ запроса нормализуется (`trim` + `toLowerCase`). Пустые результаты не кэшируются. Индекс хранит до 30 последних ключей; при переполнении самые старые удаляются (`AsyncStorage.multiRemove`). Логика — `src/features/sermon-search/lib/searchCache.ts`.
- **Кэш подсказок поиска** (`cachedDistinctValues`): пишется после успешного ответа `sermonControllerGetDistinctValues` (online-first, fire-and-forget в `fetchDistinctValues`), читается как фолбэк при сетевой ошибке. Zod-валидация при чтении через `distinctValuesSchema`; невалидный кэш трактуется как отсутствующий. Логика — `src/features/sermon-search/lib/distinctValuesCache.ts`.
- **Сервер URL** (`server-url`): пишется при смене в Настройках, читается при старте (`initServerUrlAction`).
- **Тема** (`theme_mode`, `dynamic_colors`): пишутся при изменении, читаются при старте (`loadThemeMode`, `loadDynamicColors`).
- **Версия уведомления об обновлении**: пишется после показа, читается перед проверкой.

## Миграции

Политики миграции ключей AsyncStorage пока нет. <!-- TODO: завести версионирование схемы хранилища / стратегию очистки устаревших ключей, если это потребуется. -->

## Связанные документы

- [rest-api.md](./rest-api.md) — токены и `tokenStorage`
- [../features/state.md](../features/state.md) — состояние (Reatom-атомы, в т.ч. персист плеера)
- [../features/player.md](../features/player.md) — плеер, восстановление состояния, авто-переход на следующий трек
- [../features/theme.md](../features/theme.md) — тема, Material You
- [../features/offline-and-network.md](../features/offline-and-network.md) — кэш секций, офлайн
