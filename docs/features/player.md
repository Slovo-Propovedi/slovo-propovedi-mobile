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

| Модуль                                    | Назначение                                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AudioLoader.ts`                          | создание/замена `AudioPlayer`, ожидание загрузки, стриминг с буферизацией (`downloadFirst: false`), чтение из аудио-кэша                                                                |
| `PlaybackController.ts`                   | play/pause/stop/seek/setVolume/getStatus; персист позиции                                                                                                                               |
| `AudioModeManager.ts`                     | конфигурация аудио-режима; каждая `configure()` перезапускает `setAudioModeAsync` (re-assert после сбросов ОС), дедупликация конкурентных вызовов, AppState `active` → всегда re-assert |
| `LockScreenControls.ts`                   | метаданные lock screen (`setActiveForLockScreen`); retry при ещё не загруженном плеере (до 10×200мс), version-counter для отмены устаревших retry                                       |
| `PlayerStatusListener.ts`                 | подписка на статус-события (playing/position/duration/buffering/trackEnd, детект прерываний)                                                                                            |
| `BackgroundCachingService.ts`             | фоновое кэширование трека при старте воспроизведения                                                                                                                                    |
| `TrackAutoAdvanceService/`                | авто-переход на следующий трек по окончании                                                                                                                                             |
| `nativePlayerHelpers.ts`                  | сборка listener'ов и обработчика прерываний                                                                                                                                             |
| `webPlayerState.ts`, `webPlayerPubSub.ts` | состояние и pub-sub для веб-реализации                                                                                                                                                  |
| `types.ts`                                | общие типы (`LockScreenMetadata`, `PlaybackStatus`, `StatusCallbacks`, `PlayerActions`)                                                                                                 |
| `PlayerActionsAdapter.ts`                 | DI для `TrackAutoAdvanceService`                                                                                                                                                        |

### Стриминг и кэш

`AudioLoader.getPlaybackUrl` определяет источник воспроизведения:

- если файл **в кэше** → играет локальный `file://` (мгновенный старт);
- если файла нет → **стримит** с сервера (`downloadFirst: false`, прогрессивная буферизация через нативные движки: AVPlayer на iOS, ExoPlayer на Android), воспроизведение начинается после загрузки метаданных/начала буфера, не дожидаясь полного файла. Параллельно `startBackgroundCaching` скачивает трек в офлайн-кэш.
- **Web** — `WebPlayerService` использует `HTMLAudioElement` (`new Audio()`), который всегда выполнял прогрессивное стриминг-воспроизведение независимо от `downloadFirst` (опция не влияет на веб-путь).

Стриминг работает благодаря HTTP range requests (MinIO отдаёт `206 Partial Content`, `Accept-Ranges: bytes`). Раньше `downloadFirst: true` блокировал воспроизведение до полного скачивания файла в tmp-каталог.

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

## Восстановление после сбоя

Release-before-recreate: `PlayerService.replaceAudio` и `unload` вызывают `audioLoader.releaseAndReset()` — полный `release()` нативного `AudioPlayer` и обнуление ссылок (`AudioLoader.playerInstance` и `PlayerService.playerInstance`). Lock screen очищается до release. Это гарантирует, что повторный вызов `replaceAudio` всегда создаёт свежий `AudioPlayer` через `createAudioPlayer`, а не пытается `replace()` на уничтоженном нативном объекте.

Upstream-причины:

- `expo/expo#46137` — сервис не вызывал `startForeground` после рестарта ОС, foreground-service падал; release-before-recreate пересоздаёт нативный контекст, восстанавливая работоспособность.
- `expo/expo#46957` — на Android 15+ нельзя запросить audio focus из фона (`Activity` недоступна); release-before-recreate сбрасывает нативное состояние контроллера фокуса.
- `androidx/media#1928` — застрявший audio focus чистится только ребутом; наш release — митигация, полная очистка может требовать перезагрузки ОС.

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
- `PlayerControls/` — `PlayerControls.tsx` (рендерит `DefaultControls`/`FullscreenControls` в зависимости от варианта), подhookи `usePlayerToggleTrack`, `usePlayerTrackState`, `useAppStatePlayback`, `usePlayerControlSizes`.
- `PlayerProgressBar/`, `PlayerVolumeBar.tsx`, `PlayerRepeatToggle.tsx` (цикл off → track → queue), `FullscreenControls.tsx`.

Виджет `widgets/expandable-player` — мини-плеер ↔ полноэкранный:

- `ui/ExpandablePlayer/ExpandablePlayer.tsx` — контейнер с `useExpandAnimation`; `MiniPlayer.tsx`; жесты — `useExpandablePlayerGesture.ts`, `useMiniPanGesture`, `useFullscreenPanGesture` (модель/`useExpandAnimation` в `widgets/expandable-player/model/`). Мини-плеер показывает спиннер (`ActivityIndicator`) только при буферизации (`isBuffering`). Во время фонового скачивания (`isCurrentAudioDownloading`) на нижнем краю мини-плеера отображается тонкая полоса прогресса (2px, `currentTheme.primary`), видна только пока идёт скачивание.
- `ui/FullscreenContent/` — полноэкранный вид: `FullscreenContent.tsx`, `PlayerControlsSection.tsx`, `HeaderOverlay.tsx`, `DetailsOverlay.tsx`, `useFullscreenHandlers.ts`, градиенты. Полноэкранный плеер: спиннер показывается только при буферизации; `PlayerProgressBar` показывает прогресс скачивания (полупрозрачный белый `rgba(255,255,255,0.35)` под основным прогрессом) через `currentDownloadProgress` (0..1 из `downloadProgressAtom`). Оверлей «Подробнее» (`DetailsOverlay.tsx`) показывает секции «Описание» (увеличенный шрифт) и «Проповедник» (автор проповеди); каждая секция рендерится только при наличии данных.
- **Подзаголовок (subtitle)** в мини-плеере (`ui/ExpandablePlayer/MiniPlayer.tsx`) и в шапке полноэкранного плеера (`ui/FullscreenContent/PlayerControlsSection.tsx`) показывает ссылку на проповедь (книга глава:стих) через `formatSermonReference` (`shared/lib/format`); при отсутствии ссылки фолбэк — название плейлиста, затем название приложения «Слово.Проповеди». В ходе миграции на спецификацию API v0.15.1 форматтер расширяется на диапазоны глав/стихов (см. [contracts/rest-api.md](../contracts/rest-api.md) → «Главы и стихи»).
- `ui/PlayerMenu/` — контекстное меню (подробнее, кэш, заблокированные пункты). Открытие — `showMenuAtom`.
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

Artwork резолвится с фолбэком: `artworkUrl = metadata.artworkUrl || getLocalAppIconUri() || undefined` — приоритет artwork трека, затем локальная иконка приложения (`getLocalAppIconUri` из `src/shared/lib/app-icon.ts`: ассет `assets/fallback-artwork.png` через `Asset.fromModule(...)` + `downloadAsync()` → `file://` uri), иначе — без артворка. Пустая строка никогда не уходит в натив: на Android `URL('')` даёт `MalformedURLException` и роняет весь `setActiveForLockScreen` — плеер в панели уведомлений/lock screen не создавался (главный симптом бага), на iOS уведомление показывалось без артворка. Ограничение: `downloadAsync` — fire-and-forget, поэтому до его завершения уведомление может создаться без артворка; следующий `setMetadata` поправит.

## Персистенция позиции

Каждые 5с в `app/_RootLayout.tsx` (`setInterval(savePosition, 5000)`): при не-воспроизведении пишет `CURRENT_SOUND_POSITION` в AsyncStorage.

## История прослушивания и resume

История пишется **по событиям** (старт, пауза/flush, переключение трека, завершение); 5с-тики пишут только мини-снапшот `listeningProgressSnapshot`. Это отдельный механизм от персиста позиции плеера (`CURRENT_SOUND_POSITION`).

### Запись прогресса

| Путь                       | Где                                                                                                                          | Когда                                                                                                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usePlaybackProgressSaver` | `src/entities/player/lib/usePlaybackProgressSaver.ts`                                                                        | каждые 5с (только при воспроизведении): `CURRENT_SOUND_POSITION` + мини-снапшот `writeLiveProgressSnapshot` (~60 байт) — каталог истории не трогает; первый тик после переключения трека пропускается (skip-first-tick через рефы) |
| `PlaybackController.pause` | `src/entities/player/lib/PlayerService/PlaybackController.ts`                                                                | при паузе (нативный): `CURRENT_SOUND_POSITION` + `flushHistoryProgressAction(ctx, { durationMs, positionMs, sermonId })`                                                                                                           |
| `WebPlayerService.pause`   | `src/entities/player/lib/PlayerService/index.web.ts`                                                                         | при паузе (веб): `CURRENT_SOUND_POSITION` + `flushHistoryProgressAction`                                                                                                                                                           |
| `recordSermonSwitchAction` | `usePlayNewSermon` (ручной тап, `markOldCompleted: false`), `playTrackWithMetadata` (авто-переход, `markOldCompleted: true`) | при смене трека: flush позиции старого + запись/обновление нового за один проход                                                                                                                                                   |

Все файлы `entities/player`, которым нужны символы из `listening-history`, импортируют их через **@x-точку** `entities/listening-history/@x/player` — а не из основного barrel `entities/listening-history`. Подробнее — [listening-history.md](./listening-history.md) → «@x cross-import».

При гидрации `reconcileOnHydration` мержит мини-снапшот в каталог (только если новее и запись не завершена, `durationMs = max`). Подробнее — [listening-history.md](./listening-history.md) → «Запись прогресса».

### Завершение трека

`TrackAutoAdvanceService.handleTrackEnd` (`src/entities/player/lib/PlayerService/TrackAutoAdvanceService/TrackAutoAdvanceService.ts`) вызывает `markHistoryCompletedAction(ctx, sermonId)` **до** ветвления путей (repeat → `repeatCurrentTrack` / next → `playNextTrack` / pause). Это гарантирует запись `positionMs = durationMs` при каждом окончании трека; ветка pause-on-last-track помечает завершённой через `markHistoryCompletedAction`.

### Resume при ручном тапе

`usePlayNewSermon` (`src/entities/player/lib/usePlaySermon.ts`) — основной хук «тапнул на трек»:

1. `getResumePosition(history, sermonId)` вычисляет позицию resume (0 если нет записи / завершена / position ≤ 0, иначе `positionMs`).
2. Текущий трек другой → `replaceAudio(url, resumeMs)`.
3. Текущий трек тот же (same-id tolerance 1с):
   - `resumeMs === 0` → `seekTo(0)` (с начала).
   - `resumeMs > 0` и позиция далеко → `seekTo(resumeMs)`.
4. При смене трека (`oldAudio.id !== sermonId`) — `recordSermonSwitchAction({ markOldCompleted: false, ... })` **до** `replaceAudio`: flush позиции старого трека в историю.
5. `recordPlaybackStartAction(newAudio, playlist)` — записывает/обновляет запись в истории (только если трек новый или тот же).

### Чтение состояния через ctx.get (без useAtom)

`usePlayNewSermon` **не подписывается** на `currentAudioAtom`/`positionAtom`/`durationAtom`/`historyAtom` через `useAtom` — состояние читается императивно снапшотом `ctx.get(...)` в момент вызова (`src/shared/lib/reatom-ctx`). Это было корневой причиной перф-проблемы: реактивная подписка хука в каждом `TracksListItem` держала все экраны списков подписанными на атомы плеера, и те ре-рендерились ~2 раза в секунду (каждый position-тик) во время воспроизведения. При императивном чтении хук не ре-рендерится от плеера вовсе — списки обновляются только когда меняется `historyAtom` (по событиям истории).

### Авто-переход всегда с 0

`playTrackWithMetadata` (`src/entities/player/lib/PlayerService/TrackAutoAdvanceService/playback.ts`) — общий funnel для всех путей авто-перехода (`playNextTrack`, `playFirstTrackInQueue`, `repeatCurrentTrack`). Вызывает `recordSermonSwitchAction` с `markOldCompleted: true` (старый трек фиксируется как завершённый) и `replaceAudio(url, 0)` — resume-позиция игнорируется.

### WebPlayerService.replaceAudio

На вебе `replaceAudio` делегирует `loadAudio(url, initialPositionMs)` — синтаксический сахар, позиция устанавливается после `loadedmetadata` через `audio.currentTime`.

Подробнее — [listening-history.md](./listening-history.md).

## Известные баги (Issue #45)

Пользовательский репорт после долгого прослушивания: (1) авто-переключённая проповедь без обложки, хотя в плейлисте она есть; (2) через некоторое время воспроизведение начинает ставиться на паузу, плеер исчезает из панели уведомлений и не возвращается; (3) после нескольких попыток resume + перезапуска приложения — crash loop (приложение открывается и сразу закрывается).

### Баг 1: Отсутствует обложка при авто-переходе (ИСПРАВЛЕНО)

`playNextTrack` (`src/entities/player/lib/PlayerService/TrackAutoAdvanceService/playback.ts:74`) создаёт `newAudio` (L81) = `{ ...nextTrack, audioUrl }` — берётся `nextTrack.artwork` (собственный artwork проповеди, может быть пустым), а не `playlist.artwork`. Та же ошибка в `repeatCurrentTrack` и `playFirstTrackInQueue`.

Для сравнения: ручное воспроизведение (`usePlaySermon.ts:53`) и `usePlayerToggleTrack` корректно используют `playlist.artwork`.

Последствия:

- In-app UI (`MiniPlayer.tsx:54`, `ExpandablePlayer.tsx:105`) читает `audio.artwork` напрямую → пустая обложка после авто-переключения.
- `initializePlayer.ts:61-66` восстанавливает lock-screen метаданные из `audio.artwork` → «плохой» персистнутый artwork переживает перезапуски.

Фикс: во всех трёх функциях авто-перехода (`playNextTrack`, `repeatCurrentTrack`, `playFirstTrackInQueue`) `newAudio` наследует `artwork: playlist.artwork` от плейлиста, аналогично ручному переходу через `usePlaySermon`:

```typescript
const newAudio: AudioPlayerData = { ...nextTrack, artwork: playlist.artwork, audioUrl }
```

`artwork` в домене — `string | null` (см. Баг 4): при `null` UI-компоненты показывают плейсхолдер через `CoverImage`, а lock screen подставляет иконку приложения.

### Баг 2: Плеер исчезает из панели уведомлений (ИСПРАВЛЕНО)

Корневая причина — **порядок вызовов** в авто-переходе. Ручной путь (`usePlaySermon.ts:78-96`) работает: `replaceAudio` → `play()` → `setLockScreenMetadata` — плеер загружен И играет в момент `setActiveForLockScreen(true)`, что надёжно показывает уведомление. Авто-путь (`playback.ts`) делал наоборот: `replaceAudio` → `setMetadata` → `play` — метаданные выставлялись на неиграющем MediaSession и уведомление не появлялось.

Фикс: порядок вызовов в `playTrackWithMetadata` теперь `replaceAudio → play → setMetadata`, выровнен с ручным путём `usePlaySermon`. Плеер загружен и играет в момент `setActiveForLockScreen(true)`, что надёжно показывает уведомление. Покрыто регрессионным тестом `playback.test.ts` (assert порядка через `invocationCallOrder`).

Остаточный риск: если `replaceAudio` вернул `null` (30s таймаут сети), `setMetadata` выходит по guard'у `if (!player) return` и панель остаётся скрытой — отслеживается в `docs/debt.md`.

### Баг 3: Crash loop при перезапуске (ИСПРАВЛЕНО)

Наиболее вероятно — нативный краш ExoPlayer/MediaSession (resume-попытки на уже released плеере):

- ~~`handleTrackEnd` **без try-catch**~~ — исправлено (Issue #45, Phase 1): тело метода вынесено в приватный `advanceToNextTrack`, а `handleTrackEnd` оборачивает вызов в try-catch с логированием (`console.error('[TrackAutoAdvanceService] handleTrackEnd failed:', error)`) и `reportError`, так что `void trackAutoAdvanceService.handleTrackEnd()` больше не даёт unhandled promise rejection.
- `GlobalErrorHandler` повторно вызывает `originalHandler(error, isFatal)` после `reportError` — фатальные ошибки по-прежнему убивают процесс (нативный краш не подавляется), но теперь перед этим показывается глобальный диалог ошибок (см. [error-handling.md](./error-handling.md)), а `markHistoryCompletedAction` снабжён `.catch` — асинхронная ошибка не роняет плеер. Это убирает симптом «показывает диалог, потом закрывается» для обрабатываемых ошибок.
- Коммит `ec69eeb` (20.08.2026) документирует проблемы уничтожения Android MediaSession/ExoPlayer («activity is no longer available», expo#46137, androidx/media#1928).
- Стартовые чтения хранилища все обёрнуты в safeParse — повреждённый JSON истории сам по себе краш старта НЕ вызовет.

Фикс: crash-loop устраняется связкой правок Issue #45 — `handleTrackEnd` обёрнут в try-catch (нет unhandled rejection), zod-схемы приведены к честному `artwork: string | null` (Баг 4), а ошибки сервисов/слушателей теперь идут в `reportError` → глобальный диалог вместо молчаливого краша. Необрабатываемый фатальный нативный краш по-прежнему завершает процесс (см. [error-handling.md](./error-handling.md) → GlobalErrorHandler).

### Баг 4: Zod schema drift убивает auto-advance молча (ИСПРАВЛЕНО)

`TrackAutoAdvanceService.ts:46-106`: `handleTrackEnd` перечитывает `CURRENT_AUDIO`, `CURRENT_PLAYLIST`, `CURRENT_REPEAT_MODE` из AsyncStorage и парсит их zod-схемами (`parseAudioPlayerData`/`parsePlaylistData`). Если парсинг вернул `undefined` (например, `sermonSchema` требует `artwork: z.string()`, а API для некоторых проповедей отдаёт `null`/отсутствующее поле), `handleTrackEnd` молча выходит на L69-70 — авто-переход умирает **без единой ошибки в логах**.

Сильный кандидат на симптом «воспроизведение встаёт на паузу и больше не возобновляется» после долгих сессий. Корневая причина — расхождение (drift) между payload API и строгими zod-схемами.

Фикс: `sermonSchema.artwork` изменён на `z.string().nullable()`, `playlistSchema.artwork` — тоже `z.string().nullable()`: доменный тип `artwork` теперь честный `string | null` вместо пустой строки-заглушки. Маппер нормализует на границе API (`apiSermon.artwork ?? null`). Потребители null: `CoverImage` подставляет `IMAGE_PLACEHOLDER`, lock screen — иконку приложения (`metadata.artworkUrl || getLocalAppIconUri()`).

Дополнительно (observability): при будущем schema drift парсинг `CURRENT_AUDIO`/`CURRENT_PLAYLIST` в `advanceToNextTrack` логирует `console.error` и показывает глобальный диалог через `reportError` — авто-переход по-прежнему прерывается (safety net), но ошибка больше не молчит.

## Связанные документы

- [audio-cache.md](./audio-cache.md) — кэширование аудио (в т.ч. автоматическое при старте трека)
- [listening-history.md](./listening-history.md) — история прослушивания, resume-логика, прогресс в UI
- [navigation.md](./navigation.md) — стек экранов и hardware-back
- [state.md](./state.md) — карта Reatom-атомов
