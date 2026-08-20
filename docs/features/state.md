# Состояние (Reatom)

**Стек:** `@reatom/framework` (`^3.4.68`), `@reatom/npm-react` (`^3.10.6`)

## Reatom в проекте

Состояние строится на атомах и экшен-атомах (`action`). Единый контекст:

- `ctx` — `src/shared/lib/reatom-ctx/ctx.ts` (экспорт через `src/shared/lib/reatom-ctx/index.ts`).
- Провайдер — `app/_layout.tsx`: `<reatomContext.Provider value={ctx}>`.
- В компонентах — хуки `useAtom`, `useAction`, `useCtx` из `@reatom/npm-react`.

## Карта атомов по слоям

| Слой              | Файл                                        | Атомы / экшены                                                                                                                                                                                            | Назначение                                           |
| ----------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| entities/player   | `src/entities/player/model.ts`              | `currentAudioAtom`, `currentPlaylistAtom`, `isPlayingAtom`, `positionAtom`, `durationAtom`, `volumeAtom`, `isBufferingAtom`, `isSeekingAtom`, `pauseTypeAtom`, `repeatModeAtom` + set-экшены              | состояние плеера                                     |
| entities/player   | `src/entities/player/playerSheet.ts`        | `isPlayerExpandedAtom`, `openPlayerSheetAction`, `closePlayerSheetAction`                                                                                                                                 | развёрнут/свёрнут плеер                              |
| entities/player   | `src/entities/player/lib/download-model.ts` | `downloadProgressAtom`, `isDownloadingAtom`, `downloadingAudioUrlAtom` + set-экшены                                                                                                                       | скачивание трека                                     |
| entities/settings | `src/entities/settings/model.ts`            | `serverUrlAtom`, `setServerUrlAction`, `initServerUrlAction`                                                                                                                                              | URL сервера (синхронизирует `axiosInstance.baseURL`) |
| shared/ui/theme   | `src/shared/ui/theme/model.ts`              | `themeModeAtom`, `currentThemeAtom`, `systemThemeAtom`, `dynamicColorsEnabledAtom` + `setThemeMode`, `loadThemeMode`, `setSystemTheme`, `setDynamicColors`, `loadDynamicColors`, `updateThemeBasedOnMode` | тема и Material You                                  |
| shared/model      | `src/shared/model/network.ts`               | `isOnlineAtom`, `serverUnreachableAtom`, `setOnlineStatus`, `reportServerReachable`, `reportServerUnreachable`                                                                                            | сеть и доступность сервера                           |
| shared/model      | `src/shared/model/update.ts`                | `updateAvailableAtom`, `latestVersionAtom`, `releaseUrlAtom`, `checkForUpdateAction`                                                                                                                      | проверка обновлений                                  |
| shared/model      | `src/shared/model/app.ts`                   | `isAudioPlayerMountedAtom`, `isPlayerFullscreenAtom`, `setIsAudioPlayerMounted`, `setPlayerFullscreen`                                                                                                    | глобальные флаги плеера                              |
| pages/listen      | `src/pages/listen/model.ts`                 | `dynamicSectionsAtom`, `isLoadingSectionsAtom`, `sectionDataSourceAtom`, `fetchAllSections`                                                                                                               | секции главного экрана                               |
| pages/playlist    | `src/pages/playlist/model.ts`               | `isCachingPlaylistAtom`, `playlistCacheProgressAtom`, `playlistCacheErrorAtom`                                                                                                                            | скачивание плейлиста                                 |
| shared/lib        | `src/shared/lib/cache-triggers.ts`          | `cacheUpdateTriggerAtom`, `incrementCacheTrigger`, `playlistDownloadProgressAtom`                                                                                                                         | триггеры обновления кэша                             |

## Паттерны

- **Атом + экшен set** — простые атомы (`atom<T>(initial, name)`) обновляются через `action`, который сначала делает побочные операции, затем `ctx.schedule(() => atom(ctx, value))`.
- **Персистенция в AsyncStorage** — внутри экшена до `ctx.schedule` выполняется `await AsyncStorage.setItem(KEY, ...)`. Примеры: `setCurrentAudioAction`, `setVolumeAction`, `setRepeatModeAction` (`model.ts`), `setThemeMode` (`theme/model.ts`), `setServerUrlAction`.
- **Безопасный парсинг** — восстановление из AsyncStorage через `getParseJsonWithSchema(schema)` (`src/shared/model/getParseJsonWithSchema.ts`, оборачивает Zod `safeParse`). Пример: `initializePlayer` (`src/entities/player/lib/initializePlayer.ts`), `getCachedSections`.
- **Атомы, синхронизируемые с expo-audio** — `isPlaying/position/duration/volume/isBuffering/isSeeking` обновляются из статус-событий `PlayerStatusListener`/`nativePlayerHelpers`.

## Использование в компонентах

```tsx
import { useAtom, useAction } from '@reatom/npm-react'
import { isPlayingAtom, setRepeatModeAction } from 'entities/player'

const [isPlaying] = useAtom(isPlayingAtom)
const setRepeatMode = useAction(setRepeatModeAction)
```

Для управления прямо из кода (не в компоненте) используется глобальный `ctx` из `shared/lib/reatom-ctx` (например, в `axiosInstance.ts`, `networkSubscription.ts`, `TrackAutoAdvanceService`).

### useCtx для чтения/записи в обработчиках

В колбэках и хендлерах, где нужно прочитать текущее значение атома (например, в `PlaylistCacheService.cachePlaylist`), используется `useCtx()` из `@reatom/npm-react` или импортированный `ctx`. Пример:

```tsx
import { useCtx } from '@reatom/npm-react'
const ctx = useCtx()
const caching = ctx.get(isCachingPlaylistAtom) // текущее значение
ctx.get(cacheUpdateTriggerAtom) // чтение триггера
```

## Ключевые экшены-инициализаторы

- `initializePlayer()` (`src/entities/player/lib/initializePlayer.ts`) — восстановление состояния плеера при старте.
- `initServerUrlAction(ctx)` (`src/entities/settings/model.ts`) — восстановление URL сервера (синхронизирует `axiosInstance.baseURL`).
- `loadThemeMode` / `loadDynamicColors` (`src/shared/ui/theme/model.ts`) — восстановление темы.
- `fetchAllSections` (`src/pages/listen/model.ts`) — загрузка секций (сеть → кэш).

Вызываются модульно или в `app/_layout.tsx` до/после монтирования провайдера.

## Когда использовать `ctx.schedule`

Обновления атомов из асинхронных экшенов оборачиваются в `ctx.schedule(() => atom(ctx, value))`, чтобы записать значение в текущем актуальном транзакционном контексте. Простые синхронные обновления (например, в `cache-triggers.ts`) могут записывать атом напрямую без `schedule`.

## Публичные API срезов (barrel)

Каждый FSD-срез экспортирует только публичные атомы/экшены через `index.ts` (один barrel на срез). Например, `entities/player` (`src/entities/player/index.ts`) реэкспортирует `currentAudioAtom`, `isPlayingAtom`, `setRepeatModeAction`, `PlayerProgressBar`, `usePlayNewSermon` и т.д. Внутренние атомы (например, `serverErrorShownAtom` в `network.ts`) наружу не экспортируются — это дисциплина FSD (правила границ проверяет steiger).

Внешние модули (axios-интерцепторы, NetInfo-подписки) получают доступ к атомам через импортированный глобальный `ctx`, не через React-хуки, поскольку они живут вне дерева компонентов.

## Связанные документы

- [player.md](./player.md) — состояние плеера подробно
- [storage.md](../contracts/storage.md) — персист ключей AsyncStorage
