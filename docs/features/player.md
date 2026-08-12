# Аудиоплеер

**Слой:** `entities/player` + виджет `widgets/expandable-player`
**Статус:** готов

## Обзор

Аудиоплеер построен на `expo-audio` (`~57.0.3`) и отвечает за воспроизведение проповедей, очередь, режимы повтора, lock-screen-управление и фоновое воспроизведение.

- **iOS:** фоновое воспроизведение включено через `infoPlist.UIBackgroundModes: ["audio"]` и плагин `expo-audio` с `enableBackgroundPlayback: true` (`app.json`).
- **Android:** foreground-service через permission `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_MEDIA_PLAYBACK` (`app.json`).
- Управление аудио-режимом — `src/entities/player/lib/PlayerService/AudioModeManager.ts` (`interruptionMode: 'doNotMix'`, `playsInSilentMode: true`, `shouldPlayInBackground: true`).

## Архитектура PlayerService

Паттерн **Service**: единый singleton-объект оборачивает платформенные API. Платформенное разрешение — через расширения `.native.ts` / `.web.ts` (резолвится Metro/Webpack).

- `src/entities/player/lib/PlayerService/index.native.ts` — класс `PlayerService` (нативный, expo-audio). Экспортирует singleton `playerService`.
- `src/entities/player/lib/PlayerService/index.web.ts` — класс `WebPlayerService` (HTMLAudioElement).
- `src/entities/player/lib/PlayerService/index.ts` — TypeScript-fallback: `export { playerService } from './index.native'`.

Вспомогательные модули (в `src/entities/player/lib/PlayerService/`):

| Модуль | Назначение |
|--------|-----------|
| `AudioLoader.ts` | создание/замена `AudioPlayer`, ожидание загрузки, `downloadFirst: true`, чтение из аудио-кэша |
| `PlaybackController.ts` | play/pause/stop/seek/setVolume/getStatus; персист позиции |
| `AudioModeManager.ts` | конфигурация аудио-режима с retry по AppState |
| `LockScreenControls.ts` | метаданные lock screen (`setActiveForLockScreen`) |
| `PlayerStatusListener.ts` | подписка на статус-события (playing/position/duration/buffering/trackEnd, детект прерываний) |
| `BackgroundCachingService.ts` | фоновое кэширование трека при старте воспроизведения |
| `TrackAutoAdvanceService/` | авто-переход на следующий трек по окончании |
| `nativePlayerHelpers.ts` | сборка listener'ов и обработчика прерываний |
| `webPlayerState.ts`, `webPlayerPubSub.ts` | состояние и pub-sub для веб-реализации |
| `types.ts` | общие типы (`LockScreenMetadata`, `PlaybackStatus`, `StatusCallbacks`, `PlayerActions`) |
| `PlayerActionsAdapter.ts` | DI для `TrackAutoAdvanceService` |

## Состояние (Reatom)

Атомы и экшены — `src/entities/player/model.ts`:

- `currentAudioAtom`, `currentPlaylistAtom` (legacy, для совместимости);
- `isPlayingAtom`, `positionAtom`, `durationAtom`, `volumeAtom`, `isBufferingAtom`, `isSeekingAtom`;
- `pauseTypeAtom` (`'auto'` — прерывание системой, `'manual'` — пользователь);
- `repeatModeAtom` (`'off' | 'queue' | 'track'`) + `repeatModeSchema`;
- экшены `setCurrentAudioAction`, `setCurrentPlaylistAction`, `setIsPlayingAction`, `setPositionAction`, `setDurationAction`, `setVolumeAction`, `setIsBufferingAction`, `setIsSeekingAction`, `setPauseTypeAction`, `setRepeatModeAction`, `savePlaybackPositionAction`.

Состояние разворота — `src/entities/player/playerSheet.ts`: `isPlayerExpandedAtom`, `openPlayerSheetAction`, `closePlayerSheetAction`.

Скачивание — `src/entities/player/lib/download-model.ts`: `downloadProgressAtom`, `isDownloadingAtom`, `downloadingAudioUrlAtom` + set-экшены.

Общая картина атомов — [state.md](./state.md).

## Инициализация

`initializePlayer` (`src/entities/player/lib/initializePlayer.ts`) вызывается модульно в `app/_layout.tsx` (`void initializePlayer()`). Восстанавливает из AsyncStorage (`multiGet` + Zod-парсинг через `getParseJsonWithSchema`): последний аудио/плейлист, позицию, громкость, режим повтора. Затем загружает аудио (`playerService.loadAudio(audioUrl, position)`) и ставит метаданные lock screen.

## Hooks

В `src/entities/player/lib/`:

- `usePlayer.ts` — обёртка над `playerService` (стабильный объект методов).
- `usePlaySermon.ts` — `usePlayNewSermon` — основной поток «тапнул на трек»: задаёт `currentAudio`/`currentPlaylist`, открывает полноэкранный плеер, при смене трека `replaceAudio`, `play()`, ставит lock-screen-метаданные.
- `useQueueManagement.ts` — локальная очередь: `playPlaylist`, `playTrack`, `shufflePlaylist`, `addToQueue`, `playNext`, `playPrevious`.
- `useSeekControls.ts` — долгое удержание ±10с с ускорением (5с→30с, тик 200мс).
- `usePlayerState.ts` — группированный доступ к состоянию (`currentAudio`, `duration`, `isBuffering`, `isPlaying`, `position`, `volume`).

## UI

Компоненты управления — `src/entities/player/ui/`:

- `SermonPlayerControls.tsx` — связывает `PlayerControls` с атомами (используется как `PlayerControlsSection` во fullscreen).
- `PlayerControls/` — `PlayerControls.tsx` (рендерит `DefaultControls`/`FullscreenControls` в зависимости от варианта), подhookи `usePlayerToggleTrack`, `usePlayerTrackState`, `useAppStatePlayback`, `usePlayerDownloadState`, `usePlayerControlSizes`.
- `PlayerProgressBar/`, `PlayerVolumeBar.tsx`, `PlayerRepeatToggle.tsx` (цикл off → track → queue), `FullscreenControls.tsx`.

Виджет `widgets/expandable-player` — мини-плеер ↔ полноэкранный:

- `ui/ExpandablePlayer/ExpandablePlayer.tsx` — контейнер с `useExpandAnimation`; `MiniPlayer.tsx`; жесты — `useExpandablePlayerGesture.ts`, `useMiniPanGesture`, `useFullscreenPanGesture` (модель/`useExpandAnimation` в `widgets/expandable-player/model/`).
- `ui/FullscreenContent/` — полноэкранный вид: `FullscreenContent.tsx`, `PlayerControlsSection.tsx`, `HeaderOverlay.tsx`, `DescriptionOverlay.tsx`, `useFullscreenHandlers.ts`, градиенты.
- `ui/PlayerMenu/` — контекстное меню (описание, кэш, заблокированные пункты). Открытие — `showMenuAtom`.
- `ui/PlaylistBottomSheet/` — шторка со списком треков плейлиста (`@gorhom/bottom-sheet`). Открытие — `showPlaylistAtom`.

## Управление

- **Play/Pause** — `PlayerControls` → `usePlayer().play/pause` (с защитой от AppState-ошибок `activity is no longer available`).
- **Next/Prev** — `usePlayerToggleTrack` по текущему плейлисту (Prev/Next disable на границах).
- **Перемотка** — `useSeekControls` + `PlayerProgressBar`; long-press кнопок ±10с.
- **Repeat** — `PlayerRepeatToggle` (off/track/queue).
- **Громкость** — `PlayerVolumeBar`.
- **Long-press ±10с** — через `onLongPressSeek`/`onPressOutSeek` в `PlayerControls`.

## Метаданные lock screen

`playerService.setLockScreenMetadata({ albumTitle, artist, artworkUrl, title })` → `LockScreenControls.setMetadata` → `player.setActiveForLockScreen(true, metadata, { isLiveStream: false, showSeekBackward, showSeekForward })`. Скипается в Expo Go (`isExpoGo`).

## Персистенция позиции

Каждые 5с в `app/_RootLayout.tsx` (`setInterval(savePosition, 5000)`): при не-воспроизведении пишет `CURRENT_SOUND_POSITION` в AsyncStorage.

## Связанные документы

- [audio-cache.md](./audio-cache.md) — кэширование аудио (в т.ч. автоматическое при старте трека)
- [navigation.md](./navigation.md) — стек экранов и hardware-back
- [state.md](./state.md) — карта Reatom-атомов
