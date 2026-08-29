# Аудиоплеер

**Слой:** `entities/player` + виджет `widgets/expandable-player`
**Статус:** готов

## Обзор

Аудиоплеер построен на `expo-audio` (`~57.0.4`) и отвечает за воспроизведение проповедей, очередь, режимы повтора, lock-screen-управление и фоновое воспроизведение.

- **iOS:** фоновое воспроизведение включено через `infoPlist.UIBackgroundModes: ["audio"]` и плагин `expo-audio` с `enableBackgroundPlayback: true` (`app.json`).
- **Android:** foreground-service через permission `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_MEDIA_PLAYBACK` (`app.json`).
- Управление аудио-режимом — `src/entities/player/lib/PlayerService/AudioModeManager.ts` (`interruptionMode: 'doNotMix'`, `playsInSilentMode: true`, `shouldPlayInBackground: true`).

## Архитектура PlayerService

Паттерн **Service**: единый singleton-объект оборачивает платформенные API. Платформенное разрешение — через расширения `.native.ts` / `.web.ts` (резолвится Metro/Webpack).

- `src/entities/player/lib/PlayerService/index.native.ts` — класс `PlayerService` (нативный, expo-audio). Экспортирует singleton `playerService`.
- `src/entities/player/lib/PlayerService/index.web.ts` — класс `WebPlayerService` (HTMLAudioElement).
- `src/entities/player/lib/PlayerService/index.ts` — TypeScript-fallback: `export { playerService } from './index.native'`.

Вспомогательные модули (в `src/entities/player/lib/PlayerService/`):

| Модуль                                    | Назначение                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AudioLoader.ts` + `waitForLoaded.ts` | создание/замена `AudioPlayer` (`replace()` in-place при живом инстансе), ожидание загрузки (event-driven: подписка на `playbackStatusUpdate`, работает в фоне где JS-таймеры заморожены), стриминг с буферизацией (`downloadFirst: false`), чтение из аудио-кэша. `waitForLoaded` защищён от seek-to-zero и от seek при stale-позиции (position уже продвинулась past target — Issue #60)                                                                                          |
| `PlaybackController.ts`                   | play/pause/stop/seek/setVolume/getStatus; персист позиции                                                                                                                                                                                                   |
| `AudioModeManager.ts`                     | конфигурация аудио-режима; каждая `configure()` перезапускает `setAudioModeAsync` (re-assert после сбросов ОС), дедупликация конкурентных вызовов, AppState `active` → всегда re-assert                                                                     |
| `LockScreenControls.ts`                   | метаданные lock screen: полный `setActiveForLockScreen(true, ...)` для нового плеера, `updateLockScreenMetadata(...)` для того же плеера (replace-in-place); retry при ещё не загруженном плеере (до 10×200мс), version-counter для отмены устаревших retry |
| `PlayerStatusListener.ts`                 | подписка на статус-события (playing/position/duration/buffering/trackEnd, детект прерываний); guard против устаревших `didJustFinish` после смены источника (expo-audio #34301)                                                                             |
| `BackgroundCachingService.ts`             | фоновое кэширование трека при старте воспроизведения                                                                                                                                                                                                        |
| `TrackAutoAdvanceService/`                | авто-переход на следующий трек по окончании                                                                                                                                                                                                                 |
| `nativePlayerHelpers.ts`                  | сборка listener'ов и обработчика прерываний                                                                                                                                                                                                                 |
| `webPlayerState.ts`, `webPlayerPubSub.ts` | состояние и pub-sub для веб-реализации                                                                                                                                                                                                                      |
| `types.ts`                                | общие типы (`LockScreenMetadata`, `PlaybackStatus`, `StatusCallbacks`, `PlayerActions`)                                                                                                                                                                     |
| `PlayerActionsAdapter.ts`                 | DI для `TrackAutoAdvanceService`                                                                                                                                                                                                                            |

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
- `trackBoundaryNoticeAtom` (`src/entities/player/trackBoundaryNotice.ts`) — последняя граничная подсказка Next/Prev (`{ at, boundary: 'first' | 'last' }`), читается `BoundaryHint`;
- экшены `setCurrentAudioAction`, `setCurrentPlaylistAction`, `setIsPlayingAction`, `setPositionAction`, `setDurationAction`, `setVolumeAction`, `setIsBufferingAction`, `setIsSeekingAction`, `setPauseTypeAction`, `setRepeatModeAction`, `savePlaybackPositionAction`.

Состояние разворота — `src/entities/player/playerSheet.ts`: `isPlayerExpandedAtom`, `openPlayerSheetAction`, `closePlayerSheetAction`.

Скорость воспроизведения — `src/entities/player/playback-rate.ts`: `playbackRateAtom`, `setPlaybackRateAction`, персист `CURRENT_PLAYBACK_RATE`.

Скачивание — `src/entities/player/lib/download-model.ts`: `downloadProgressAtom`, `isDownloadingAtom`, `downloadingAudioUrlAtom` + set-экшены.

Общая картина атомов — [state.md](./state.md).

## Инициализация

`initializePlayer` (`src/entities/player/lib/initializePlayer.ts`) вызывается модульно в `app/_layout.tsx` (`void initializePlayer()`). Восстанавливает из AsyncStorage (`multiGet` + Zod-парсинг через `getParseJsonWithSchema`): последний аудио/плейлист, позицию, громкость, скорость воспроизведения, режим повтора. Затем загружает аудио (`playerService.loadAudio(audioUrl, position)`) и ставит метаданные lock screen. Скорость восстанавливается до `loadAudio` — контроллер сохраняет значение, `applyPlaybackRate` внутри `loadAudio`/`replaceAudio` применяет его к свежему `AudioPlayer` (новый экземпляр всегда стартует с 1.0).

## Восстановление после сбоя

Полный teardown остался только в `unload`: `playerStatusListener.cleanup()` → `audioLoader.releaseAndReset()` (полный `release()` нативного `AudioPlayer` + обнуление ссылок) → `PlayerService.playerInstance = null`. Lock screen **не** деактивируется перед release: `release()` при ещё активной сессии удаляет уведомление нативно и надёжно, а предварительный `setActiveForLockScreen(false)` может молча не сработать, пока сервис binder в состоянии BINDING, и оставить осиротевшее уведомление (дубли — см. «Replace-in-place при смене трека»).

Upstream-причины:

- `expo/expo#46137` — сервис не вызывал `startForeground` после рестарта ОС, foreground-service падал; полный release в `unload` пересоздаёт нативный контекст при следующем `loadAudio`, восстанавливая работоспособность.
- `expo/expo#46957` — на Android 15+ нельзя запросить audio focus из фона (`Activity` недоступна); replace-in-place при смене трека не бросает и не перезапрашивает фокус из фона вовсе (митигация сильнее прежнего release-before-recreate).
- `androidx/media#1928` — застрявший audio focus чистится только ребутом; наш release в `unload` — митигация, полная очистка может требовать перезагрузки ОС.

### Crash-guard при старте (Issue #45)

Нативный краш ExoPlayer/MediaSession при восстановлении плеера JS try-catch не ловит — процесс умирает целиком. Чтобы разорвать crash loop после обновления, `initializePlayer` ведёт счётчик попыток запуска в AsyncStorage (`PLAYER_STARTUP_ATTEMPTS`, `src/entities/player/lib/startupGuard.ts`):

- счётчик читается **первым делом**, до любых нативных вызовов;
- при значении **>= 3** восстановление пропускается целиком: `loadAudio`/`setLockScreenMetadata` не вызываются, атомы остаются пустыми, счётчик сбрасывается в 0, приложение стартует нормально (пользователь может запустить проповедь вручную — `loadAudio`/`replaceAudio` сами сконфигурируют аудио-режим);
- иначе счётчик инкрементируется, и запись **await-ится до** нативных вызовов — если процесс упадёт, следующий запуск увидит увеличенный счётчик;
- при здоровом аптайме 30с `scheduleStartupGuardReset` (вызывается один раз в `app/_layout.tsx`, защита от повторного планирования) сбрасывает счётчик в 0.

Пропуск восстановления **не удаляет** данные: `listeningHistory`, `listeningProgressSnapshot`, аудио-кэш и содержимое `CURRENT_AUDIO`/`CURRENT_PLAYLIST` остаются нетронутыми.

## Hooks

В `src/entities/player/lib/`:

- `usePlayer.ts` — обёртка над `playerService` (стабильный объект методов): `getStatus`, `getVolume`, `loadAudio`, `pause`, `play`, `reassertLockScreenMetadata`, `replaceAudio`, `seekTo`, `setLockScreenMetadata`, `setPlaybackRate`, `setVolume`, `stop`, `unload`.
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

- `ui/ExpandablePlayer/ExpandablePlayer.tsx` — контейнер с `useExpandAnimation`; `MiniPlayer.tsx`; жесты — `useExpandablePlayerGesture.ts`, `useMiniPanGesture`, `useFullscreenPanGesture` (модель/`useExpandAnimation` в `widgets/expandable-player/model/`). Позиционирование мини-плеера (`bottom` в `miniStyles.ts`) и анимация разворота/сворачивания (`useExpandAnimation`, `useMiniPanGesture`) считаются от **измеренной** высоты таб-бара (`tabBarHeightAtom` из `shared/ui/layout`, измеряется через `onLayout` в `CustomTabBar`; формула — измеренная высота таб-бара минус 4px наложения на таб-бар, централизована в `getMiniPlayerBottom` из `widgets/expandable-player/lib/getMiniPlayerBottom.ts`, константа `MINI_PLAYER_TAB_OVERLAP = 4`, Issue #53). Хардкод-константа `PLAYER_SIZES.tabBarHeight` осталась только как начальное приближение атома. Мини-плеер показывает спиннер (`ActivityIndicator`) только при буферизации (`isBuffering`). Во время фонового скачивания (`isCurrentAudioDownloading`) на нижнем краю мини-плеера отображается тонкая полоса прогресса (2px, `currentTheme.primary`), видна только пока идёт скачивание.
- `ui/FullscreenContent/` — полноэкранный вид: `FullscreenContent.tsx`, `PlayerControlsSection.tsx`, `HeaderOverlay.tsx`, `DetailsOverlay.tsx`, `useFullscreenHandlers.ts`, `BoundaryHint.tsx` (тост-пилюля «Это первая/последняя проповедь»: fade 200мс, автоскрытие 2с, повторный тап продлевает, устаревшие notice после ремоунта игнорируются), градиенты. Полноэкранный плеер: спиннер показывается только при буферизации; `PlayerProgressBar` показывает прогресс скачивания (полупрозрачный белый `rgba(255,255,255,0.35)` под основным прогрессом) через `currentDownloadProgress` (0..1 из `downloadProgressAtom`). В `controlsRow` слева — `PlayerRepeatToggle`, по центру — транспорт (`SermonPlayerControls`), справа — кнопка плейлиста. Управление скоростью вынесено в `PlayerMenu` (см. ниже). Оверлей «Подробнее» (`DetailsOverlay.tsx`) показывает секции «Описание» (увеличенный шрифт) и «Проповедник» (автор проповеди); каждая секция рендерится только при наличии данных. Элемент «следующая проповедь» в верхней части полноэкранного плеера — сворачиваемая плашка (`NextSermonPlate.tsx`): в свёрнутом виде это компактная «пилюля» с шевроном, по тапу раскрывается и показывает название следующей проповеди, повторный тап сворачивает обратно; при смене текущей проповеди плашка автоматически сворачивается. Плашка живёт внутри полноширинного абсолютного якоря с симметричным `paddingHorizontal` = 72 (16 + 40 + 16 — геометрия кнопки сворачивания `expandedControlsStyles.closeButton`), поэтому ширина пилюли равна ширине контента и никогда не заходит под кнопку сворачивания; строка-лейбл и название центрируются. В развёрнутом состоянии плашка автоматически сворачивается через 10 секунд (`AUTO_COLLAPSE_DELAY_MS`); высота названия вычисляется с учётом масштаба системного шрифта (2 строки × lineHeight × `PixelRatio.getFontScale()`, без обрезки при крупных системных шрифтах), при сворачивании название анимированно скрывается (maxHeight → 0) и размонтируется после завершения анимации. В развёрнутом состоянии `accessibilityLabel` плашки включает название следующей проповеди. Действие «играть следующую» из плашки убрано — переключение треков осталось на транспортных кнопках Next/Prev (Issue #57). Над транспортными кнопками показывается граничная подсказка (`BoundaryHint.tsx`): при тапе Next/Prev на границе плейлиста в Off-режиме всплывает пилюля «Это первая/последняя проповедь» (чтение `trackBoundaryNoticeAtom`, fade 200мс, авто-скрытие через 2с, повторный тап продлевает показ).
- **Подзаголовок (subtitle)** в мини-плеере (`ui/ExpandablePlayer/MiniPlayer.tsx`) и в шапке полноэкранного плеера (`ui/FullscreenContent/PlayerControlsSection.tsx`) показывает ссылку на проповедь (книга глава:стих) через `formatSermonReference` (`shared/lib/format`); при отсутствии ссылки фолбэк — название плейлиста, затем название приложения «Слово.Проповеди». В ходе миграции на спецификацию API v0.15.1 форматтер расширяется на диапазоны глав/стихов (см. [contracts/rest-api.md](../contracts/rest-api.md) → «Главы и стихи»).
- `ui/PlayerMenu/` — контекстное меню (подробнее, кэш, скорость, заблокированные пункты). Меню поддерживает переключение видов: главный список → подменю скорости (`PlayerSpeedMenu`). Открытие — `showMenuAtom`. Скорость управляется через `usePlaybackRate` (обёртка над `playbackRateAtom`).
- `ui/PlaylistBottomSheet/` — шторка со списком треков плейлиста (`@gorhom/bottom-sheet`). Открытие — `showPlaylistAtom`. Шторка монтируется сразу на верхнем снапе (`index = последний снап-поинт`, `FINAL_SNAP_INDEX`, 80%), поэтому открытие — одна entrance-анимация без двойного перехода (Issue #48). При открытии шторка **автоматически прокручивается к текущей проповеди** (она встаёт в верх списка, `viewPosition: 0`). Механизм — хук `useScrollToCurrentTrack` (`ui/PlaylistBottomSheet/useScrollToCurrentTrack.ts`). **Корневая причина бага (Issue #48) — `enableDynamicSizing={false}`:** динамический детент по контенту списка склеивался до полноэкранного и держал вложенный список LOCKED — это же объясняло «скролл работает только на весь экран». Второй слой — gorhom 5.2.14 определяет состояние EXTENDED точным равенством `animatedPosition.value === containerHeight - animatedSheetHeight.value` (`BottomSheet.tsx` ~L308); при дробном PixelRatio позиция пружины и измеренная высота расходятся на доли пикселя → `===` никогда не истинно → вложенный список остаётся LOCKED и откатывает программные скроллы в 0 (`useScrollable.ts:41-76`, линия issues #2737). **Фикс — патч через `patch-package`** (см. [decisions.md](../decisions.md) → patch-package): точное равенство заменено на epsilon `Math.abs(...) < 0.5` в трёх местах (EXTENDED, EXTENDED-with-keyboard, FILL_PARENT). Поэтому **стандартные жесты восстановлены**: драг по списку двигает шторку, а список скроллится на верхнем снапе (80%). Скролл выполняется один раз за монт при оседании на ВЕРХНЕМ снапе (`onChange(FINAL_SNAP_INDEX)`, состояние EXTENDED) — на нижних снапах (50%) список намеренно заморожен (gorhom LOCKED: драги двигают шторку, программные скроллы откатываются), прокрутка доступна после разворота до 80%. **Ближний верх (~≤240px, `isOffsetNegligible`)** — цель уже видна при открытии: ни скролла, ни скелетона, список сразу. **Дальние цели** — список скрыт (`hiddenContent`, `opacity: 0`), поверх — пульсирующий скелетон (`PlaylistSheetSkeleton` + `PlaylistSheetSkeletonRow`, 8 строк, геометрия совпадает с реальными строками `TRACK_LIST_ITEM_SIZES`; пульс opacity 0.5↔1, ~700ms, одним общим Reanimated shared value на все строки) до первого scroll-эха (`y > 100px`, потолок 1500ms, `useListReveal`); скелетон исчезает мгновенно при reveal. **Скролл:** двойной rAF-надж после оседания шторки (разблокировка списка происходит на следующий кадр после `onChange` — Reanimated коммитит derived-статус покадрово, issue #2737) → `scrollToIndex({ index, viewPosition: 0 })`; фолбэк `onScrollToIndexFailed` — оценка `scrollToOffset(avg * index)` + до 6 повторных `scrollToIndex` с линейным бэкоффом 100×n (ячейки у цели измеряются батчами виртуализации). Таймеры автоскролла гейтятся на текущий снап, активный драг и momentum-флинг пользователя в момент срабатывания. **Перф:** шторка мемоизирована (`memo`) со стабильным `onClose` (`useCallback` в `FullscreenContent`) — нет шторма ре-рендеров на тики позиции; `INITIAL_NUM_TO_RENDER = 10` (плоский, без раздувания до цели — сходимость спрятана за скелетоном); `onScroll` отключается после reveal (`isRevealed ? undefined : onScroll`).

### Восстановление после фона (Issue #61)

**Симптом:** на Android, если пользователь слушает проповедь, ставит паузу и уходит из приложения на длительное время (минуты/часы), при возврате мини-плеер показывает пустой серый прямоугольник (цвет `surface` в тёмной теме) вместо обложки и контролов; касания на этом прямоугольнике ничего не делают. Остальная часть приложения работает. Перезапуск приложения исправляет.

**Корневая причина:** виджет `widgets/expandable-player` всегда рендерит полноэкранный `Animated.View`-контейнер (zIndex 200) с оверлеем `miniOverlay` цвета `surface` — при свёрнутом плеере этот контейнер позиционируется точно под мини-плеером и закрывает его, когда мини-плеер пропадает. Видимость мини-плеера управляется анимацией `miniStyle` через shared value `progress` Reanimated: `opacity = interpolate(progress, [0, 0.3], [1, 0])`. После долгого фона UI-thread Reanimated может рассинхронизироваться — shared value `progress` оказывается застрявшим выше 0.3, miniPlayer получает `opacity: 0`, а оверлей surface-цвета показывается вместо него. Обработки AppState в виджете не было — ничего не восстанавливало значение `progress` и не пересоздавало нативные view (жесты, изображения, текстовые бегунки могли также оказаться в stale-состоянии, объясняя «мёртвые» касания).

**Фикс (два уровня защиты, виджет selbstständig):**

1. **Снап `progress` при каждом возврате в active** (`model/useAppStateSnap.ts`, вызывается из `useExpandAnimation.ts`): подписка на AppState, при `nextAppState === 'active'` — прямое присваивание `progress.value = expanded ? 1 : 0` (без `withTiming`). Прямое присваивание отменяет любую in-flight анимацию и фиксирует значение на UI-thread.

2. **Remount поддерева по ключу** (`ui/ExpandablePlayer/ExpandablePlayer.tsx`): хук `useBackgroundRecovery` (`model/useBackgroundRecovery.ts`) отслеживает AppState и возвращает счётчик; при возврате из фона дольше 5 минут счётчик инкрементируется. Обёртка `View` с `key={recoveryKey}`, `pointerEvents="box-none"` и `StyleSheet.absoluteFill` оборачивает всё содержимое виджета — смена ключа полностью перемонтирует поддерево (свежие нативные view для жестов, изображений, анимаций, бегущего текста; shared values перепривязываются). `pointerEvents="box-none"` гарантирует, что обёртка не перехватывает касания, предназначенные экранам табов.

### Расползание мини-плеера при обновлении (Issue #63) — ИСПРАВЛЕНО, ПОДТВЕРЖДЕНО НА УСТРОЙСТВЕ

**Симптом:** после обновления приложения (новый build) на Android верх мини-плеера (60px статичный бар, `MiniPlayer`, zIndex 300) стоит **правильно**, но нижняя часть surface-цветного контейнера-подложки (zIndex 200, `ExpandablePlayer.tsx`) растягивается вниз поверх иконок таб-бара — должна перекрывать только на 4px (`MINI_PLAYER_TAB_OVERLAP`). Любое взаимодействие (тап/пан на плеере) исправляет.

**Статус:** фикс подтверждён на реальном устройстве (Android). TEMP(#63) телеметрия (логгеры `issue63Log`, `logContainerApply`, `useIssue63Diagnostics`, `issue63Debug`) удалена после подтверждения стабильности.

**Корневая причина (рассинхронизация Reanimated UI-thread + ненадёжный канал обновления worklet-замыканий):**

1. `tabBarHeightAtom` стартует с приближения 78; реальное измерение `CustomTabBar` через `onLayout` приходит через 1–2 кадра. На Android измерение может быть **двухфазным**: `useSafeAreaInsets()` на первых кадрах может вернуть `bottom: 0` → BlurView с `paddingBottom: Math.max(bottom, 30)` растёт, когда реальные insets приходят → второй `onLayout` с **большей** высотой.

2. Когда атом обновляется после монта, Reanimated должен обновить замыкание worklet'а и повторно применить стиль на UI-thread. В загруженном окне старта повторное применение может быть **сброшено** — JS-сторона корректна (статичный мини-бар на правильной позиции), но нативный контейнер сохраняет устаревшую геометрию: `bottom` вычислен из **меньшего** устаревшего `tabBarHeight` → коробка свисает поверх табов на дельту высот.

3. Доказательство асимметрии каналов: запись `progress.value` (что делает пан-жест / любой тап) **всегда** перезапускает worklet'ы с актуальными замыканиями и восстанавливает layout. Shared-value writes — надёжный межпоточный канал; обновления через замыкание worklet'а — ненадёжный.

**Постоянная архитектура защиты (6 уровней):**

1. **Гейтинг по измеренной высоте таб-бара** (`ui/ExpandablePlayer/ExpandablePlayer.tsx`): атом `isTabBarMeasuredAtom` (начальное значение `false`) переключается в `true` при первом `setTabBarHeight` из `CustomTabBar`. Виджет рендерится (`return null`) до измерения реальной высоты, поэтому первый кадр использует точную геометрию вместо приближения 78.

2. **Прямое присваивание `progress` при первом монте** (`model/useExpandAnimation.ts`): на первом запуске эффекта `expanded` прямое присваивание `progress.value = expanded ? 1 : 0` (без `withTiming`) — форсирует shared value на UI-thread и перезапускает зависимые worklets. Последующие изменения `expanded` анимируются через `withTiming`.

3. **AppState snap** (`model/useAppStateSnap.ts`): при каждом возврате в active — прямое присваивание `progress.value = expanded ? 1 : 0` (отменяет застрявшие mid-animation значения).

4. **Геометрия через shared values вместо замыканий worklet'ов** (`model/useExpandAnimation.ts` + `model/useGeometrySharedValues.ts`): значения `miniBottom`, `screenWidth`, `fullScreenHeight` зеркалируются в `useSharedValue`-обёртки; `containerStyle` worklet читает `*.value` вместо значений из JS-замыкания. Синхронизация через `useEffect` → `.value = ...` — надёжный межпоточный канал.

5. **Статичная resting-геометрия через React shadow tree** (`lib/getRestingContainerStyle.ts`): контейнер получает **plain-стиль** (не анимированный) с корректной resting-геометрией. React shadow tree commits **никогда не сбрасываются** — в отличие от JS-триггерных Reanimated commits. Стилевой массив: `[styles.container, containerStyle, restingContainerStyle, style, {backgroundColor}]` — animated `containerStyle` переопределяет значения во время анимации; в покое оба слоя согласованы.

6. **Закрытый контур детекции и лечения** (`model/useContainerGeometryGuard.ts` + `model/useExpandAnimation.ts`): `useContainerGeometryGuard` — хук детекции (onLayout → сигнатура `y > expectedTop + 1dp` → окно 15с → кап 5) + `onMismatch` callback → `forceGeometryReapply` (запись в `geometryReapplyTick` shared value, alternating ±0.01dp — sub-pixel diff defeating no-diff skip, drift permanently bounded). Ожидание **всегда закреплено за СВЁРНУТОЙ геометрией** (`collapsedRestingContainerStyle.top`) — сигнатура бага (#63) существует только в мини-состоянии; при анимациях разворота/сворачивания y ≤ collapsedTop → ложных срабатываний нет по построению. Окно 15с отсчитывается от **аттача контейнера** (первый guarded onLayout), а не от маунта хука — покрывает поздний аттач (свежая установка: пользователь нажал play через 40с). `console.warn('playerGeometryHeal', …)` — fail-loud телеметрия последней линии; если warn появится в проде — сигнал рецидива, нужен лог. Тип `style`-пропа контейнера запрещает геометрические ключи (`NonGeometricStyle`) на уровне компилятора — last-wins в shadow tree не может быть нарушен внешним стилем.

**Флип порядка стилей** (`ui/ExpandablePlayer/ContainerView.tsx`): `restingContainerStyle` после `containerStyle` — на уровне теневого дерева «последний побеждает», shadow всегда несёт корректную resting-геометрию, и любой релэйаут перезаписывает кадр правильными значениями.

## Управление

- **Play/Pause** — `PlayerControls` → `usePlayer().play/pause` (с защитой от AppState-ошибок `activity is no longer available`).
- **Next/Prev** — `usePlayerToggleTrack` по текущему плейлисту. Кнопки всегда активны при наличии аудио и не скрываются/не отключаются на границах плейлиста (Issue #67); long-press перемотка работает на любом треке. Семантика тапа зависит от режима повтора (`resolveTrackToggle`): **Off** — на границе показывается подсказка «Это первая/последняя проповедь» (`trackBoundaryNoticeAtom` → `BoundaryHint`), переключения нет; **Track** — тап в любом месте перезапускает текущую проповедь с начала (`seekTo(0)` + `play`); **Queue** — next на последнем треке переходит к первому, prev на первом — к последнему. Переключение через кнопки восстанавливает позицию из истории (`getResumePosition`) и flush'ит позицию старого трека (`recordSermonSwitchAction`).
- **Перемотка** — `useSeekControls` + `PlayerProgressBar`; long-press кнопок ±10с. Во время seek (`isSeekingAtom`) нативные `onPositionChange` не перезаписывают `positionAtom` (оптимистичная позиция); флаг снимается, когда нативная позиция подтвердила цель (`seekTargetPositionAtom`, допуск `SEEK_TARGET_CONFIRM_TOLERANCE_MS` = 500мс), иначе — safety-timeout `SEEK_SAFETY_TIMEOUT_MS` = 2с. База интервала long-press обновляется синхронно в `doSeek` (`useSeekControls`), а не только React-эффектом от пропа. При смене трека (`replaceAudio`) guard сбрасывается (`resetSeekGuard`): `isSeekingAtom` → false, `seekTargetPositionAtom` → null — иначе позиции нового трека игнорировались бы до подтверждения цели.
- **Repeat** — `PlayerRepeatToggle` (off/track/queue). В режиме `queue` ручное переключение кнопками Next/Prev заворачивает по циклу на границах плейлиста; в режиме `track` тап Next/Prev перезапускает текущую проповедь с начала (см. Next/Prev).
- **Скорость** — `PlayerSpeedMenu` в `ui/PlayerMenu/` (YouTube-style submenu: 0.75/1/1.25/1.5/2), атом `playbackRateAtom` через `usePlaybackRate` hook, ре-применение после `loadAudio`/`replaceAudio` (новый `AudioPlayer` стартует с 1.0). Pitch-коррекция `'high'` (на iOS — spectral-алгоритм; чуть дороже по CPU, но сохраняет тембр речи).
- **Громкость** — `PlayerVolumeBar`.
- **Long-press ±10с** — через `onLongPressSeek`/`onPressOutSeek` в `PlayerControls`. Работает независимо от позиции в плейлисте (кнопки не отключаются на границах, Issue #67).

## Метаданные lock screen

`playerService.setLockScreenMetadata({ albumTitle, artist, artworkUrl, title })` → `LockScreenControls.setMetadata` → два пути:

- **Новый плеер** (первое воспроизведение / после `unload`): полный `player.setActiveForLockScreen(true, metadata, { isLiveStream: false, showSeekBackward, showSeekForward })` — активация MediaSession и foreground service.
- **Тот же плеер** (replace-in-place смена трека): лёгкий `player.updateLockScreenMetadata(metadata)` — обновляет заголовок/артиста/обложку в существующем уведомлении без teardown-гонок.

Скипается в Expo Go (`isExpoGo`).

Artwork резолвится с фолбэком: `artworkUrl = [metadata.artworkUrl, getLocalAppIconUri()].find(hasUriProtocol)` — приоритет artwork трека, затем локальная иконка приложения (`getLocalAppIconUri` из `src/shared/lib/app-icon.ts`: ассет `assets/fallback-artwork.png` через `Asset.fromModule(...)` + `downloadAsync()` → `file://` uri), иначе — без артворка. `hasUriProtocol` отбрасывает значения без протокола (`assets_fallbackartwork` из release-сборки, `''`, `null`) — в натив уходит только валидный URL (`https://`, `http://`, `file://`, `asset:///`, `content://`). Если валидного значения нет, ключ `artworkUrl` полностью опускается (не отправляется даже как `undefined`). `setActiveForLockScreen` обёрнут в try-catch (см. Баг 3). Ограничение: `downloadAsync` — fire-and-forget, поэтому до его завершения уведомление может создаться без артворка; следующий `setMetadata` поправит.

## Персистенция позиции

Позиция воспроизведения сохраняется в `CURRENT_SOUND_POSITION` как JSON `{ sermonId, positionMs, savedAtMs, durationMs? }` — привязана к конкретной проповеди. Поле `durationMs` опционально: пишется при наличии длительности (5с-тик, пауза), опускается при flush авто-перехода. Точки flush:

- **5с-тик** (`usePlaybackProgressSaver`): при воспроизведении — bound-запись + мини-снапшот `listeningProgressSnapshot`; skip-first-tick после переключения трека.
- **Пауза** (`PlaybackController.pause`, `WebPlayerService.pause`): немедленная bound-запись.
- **Seek** (`PlaybackController.seekTo`): `flushHistoryProgressAction` с trailing-дебаунсом 400мс (`SEEK_HISTORY_FLUSH_DEBOUNCE_MS`) — позиция истории обновляется после seek (в т.ч. на паузе); частые seek long-press (тик 200мс) коалесятся в один финальный write.
- **Авто-переход** (`playTrackWithMetadata`): `savePlaybackProgress(positionMs: initialPositionMs)` для нового трека перед `recordSermonSwitchAction` — позиция resume персистится при авто-переходе, чтобы краш сразу после смены трека восстановился на позиции resume.
- **Уход в фон** (`usePlaybackProgressSaver`): AppState `background` → немедленный flush теми же guard'ами.

При cold start `initializePlayer` парсит JSON через `playbackProgressSchema`; легаси-голое-число → parse вернёт `undefined` → позиция 0. Если `sermonId` не совпадает с текущим аудио → позиция 0. Позиция clamp'ится к `durationMs` из записи (если поле отсутствует или ≤ 0, clamp не применяется).

## История прослушивания и resume

История пишется **по событиям** (старт, пауза/flush, переключение трека, завершение); 5с-тики пишут только мини-снапшот `listeningProgressSnapshot`. Это отдельный механизм от персиста позиции плеера (`CURRENT_SOUND_POSITION`).

### Запись прогресса

| Путь                       | Где                                                                                                                          | Когда                                                                                                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usePlaybackProgressSaver` | `src/entities/player/lib/usePlaybackProgressSaver.ts`                                                                        | каждые 5с (только при воспроизведении): `CURRENT_SOUND_POSITION` + мини-снапшот `writeLiveProgressSnapshot` (~60 байт) — каталог истории не трогает; первый тик после переключения трека пропускается (skip-first-tick через рефы) |
| `PlaybackController.pause` | `src/entities/player/lib/PlayerService/PlaybackController.ts`                                                                | при паузе (нативный): `CURRENT_SOUND_POSITION` + `flushHistoryProgressAction(ctx, { durationMs, positionMs, sermonId })`                                                                                                           |
| `PlaybackController.seekTo` | `src/entities/player/lib/PlayerService/PlaybackController.ts`                                                               | при seek (нативный): `flushHistoryProgressAction` с trailing-дебаунсом 400мс — позиция истории обновляется после seek (в т.ч. на паузе), серия seek коалесится в один финальный write |
| `WebPlayerService.pause`   | `src/entities/player/lib/PlayerService/index.web.ts`                                                                         | при паузе (веб): `savePlaybackProgress` (bound-запись) + `flushHistoryProgressAction`                                                                                                                                          |
| `recordSermonSwitchAction` | `usePlayNewSermon` (ручной тап, `markOldCompleted: false`), `usePlayerToggleTrack` (кнопки Next/Prev, `markOldCompleted: false`), `playTrackWithMetadata` (авто-переход, `markOldCompleted: true`) | при смене трека: flush позиции старого + запись/обновление нового за один проход                                                                                                                                                   |

Все файлы `entities/player`, которым нужны символы из `listening-history`, импортируют их через **@x-точку** `entities/listening-history/@x/player` — а не из основного barrel `entities/listening-history`. Подробнее — [listening-history.md](./listening-history.md) → «@x cross-import».

При гидрации `reconcileOnHydration` мержит мини-снапшот в каталог (только если новее и запись не завершена, `durationMs = max`). Подробнее — [listening-history.md](./listening-history.md) → «Запись прогресса».

### Завершение трека

`TrackAutoAdvanceService.handleTrackEnd` (`src/entities/player/lib/PlayerService/TrackAutoAdvanceService/TrackAutoAdvanceService.ts`) при завершении трека: на путях repeat/next/queue-restart вызывается `playTrackWithMetadata` с `markOldCompleted: true` (через `recordSermonSwitchAction`), что фиксирует завершённость старого трека; на ветке pause-on-last-track вызывается `markHistoryCompletedAction(ctx, sermonId)` напрямую для записи `positionMs = durationMs`. Ручное переключение кнопками Next/Prev (`usePlayerToggleTrack`) в Queue-режиме тоже заворачивает по циклу на границах плейлиста (Issue #67): next на последнем → первый, prev на первом → последний; в Track-режиме тап перезапускает текущую проповедь с начала.

### Resume-позиция (все пути)

Восстановление позиции из истории (`getResumePosition`) работает во всех путях начала воспроизведения:

#### Ручной тап (`usePlayNewSermon`)

`usePlayNewSermon` (`src/entities/player/lib/usePlaySermon.ts`) — основной хук «тапнул на трек»:

1. `getResumePosition(history, sermonId)` вычисляет позицию resume (0 если нет записи / завершена / position ≤ 0, иначе `positionMs`).
2. Текущий трек другой → `replaceAudio(url, resumeMs)`.
3. Текущий трек тот же (same-id tolerance 1с):
   - `resumeMs === 0` → `seekTo(0)` (с начала).
   - `resumeMs > 0` и позиция далеко → `seekTo(resumeMs)`.
4. При смене трека (`oldAudio.id !== sermonId`) — `recordSermonSwitchAction({ markOldCompleted: false, ... })` **до** `replaceAudio`: flush позиции старого трека в историю.
5. `recordPlaybackStartAction(newAudio, playlist)` — записывает/обновляет запись в истории (только если трек новый или тот же).

#### Кнопки Next/Prev (`usePlayerToggleTrack`)

`usePlayerToggleTrack` (`src/entities/player/ui/PlayerControls/usePlayerToggleTrack.ts`) — чтение истории через `ctx.get(historyAtom)` + `getResumePosition(history, sermonId)`. При смене трека `recordSermonSwitchAction({ markOldCompleted: false, ... })` flush'ит позицию старого трека.

#### Очередь (`useQueueManagement`)

`playTrack`, `playNext`, `playPrevious`, `shufflePlaylist` — все пути, вызывающие `replaceAudio(url)`, вычисляют `getResumePosition(history, targetSermonId)` и передают resumeMs.

#### Авто-переход (`TrackAutoAdvanceService`)

`playNextTrack` и `playFirstTrackInQueue` вычисляют resume через `ctx.get(historyAtom)` + `getResumePosition(history, nextTrackId)` и передают в `playTrackWithMetadata`. `repeatCurrentTrack` **всегда** передаёт 0 (режим повтора — воспроизведение с начала).

### Чтение состояния через ctx.get (без useAtom)

`usePlayNewSermon` **не подписывается** на `currentAudioAtom`/`positionAtom`/`durationAtom`/`historyAtom` через `useAtom` — состояние читается императивно снапшотом `ctx.get(...)` в момент вызова (`src/shared/lib/reatom-ctx`). Это было корневой причиной перф-проблемы: реактивная подписка хука в каждом `TracksListItem` держала все экраны списков подписанными на атомы плеера, и те ре-рендерились ~2 раза в секунду (каждый position-тик) во время воспроизведения. При императивном чтении хук не ре-рендерится от плеера вовсе — списки обновляются только когда меняется `historyAtom` (по событиям истории).

### Авто-переход: resume из истории (кроме repeat)

`playTrackWithMetadata` (`src/entities/player/lib/PlayerService/TrackAutoAdvanceService/playback.ts`) — общий funnel для всех путей авто-перехода (`playNextTrack`, `playFirstTrackInQueue`, `repeatCurrentTrack`). Вызывает `recordSermonSwitchAction` с `markOldCompleted: true` (старый трек фиксируется как завершённый) и `replaceAudio(url, initialPositionMs)` — resume-позиция вычисляется из истории для `playNextTrack` и `playFirstTrackInQueue`. `repeatCurrentTrack` всегда передаёт 0 (режим повтора).

### Replace-in-place при смене трека (Issue #50 и дубли уведомлений)

С 2026-08-24 смена трека **не** teardown'ит плеер. Если `AudioLoader.playerInstance` жив, `replaceAudio` вызывает `player.replace(url)` на том же нативном `AudioPlayer` — тот же ExoPlayer, тот же MediaSession, тот же foreground service, тот же ID уведомления. Полное пересоздание (`createAudioPlayer`) происходит только при первом воспроизведении и после `unload`.

Почему прежний release-before-recreate был убран:

- **Issue #50 (Android, заблокированный экран): авто-переход не срабатывает.** Прежний `replaceAudio` вызывал `lockScreenControls.clear()` → `setActiveForLockScreen(false)`, что останавливало foreground service, и затем release'ил плеер до старта нового источника. Без FGS и без аудио Android замораживал кэшированный процесс → JS-цепочка авто-перехода (включая polling `waitForLoaded` в `AudioLoader`) стояла до разблокировки экрана.
- **Дубли media-уведомлений.** В expo-audio 57.0.x `setActiveForLockScreen(false)` может молча не сработать, пока сервис binder в состоянии BINDING → старый MediaSession/уведомление осиротевали; per-player ID уведомлений и коллизии пустых `MediaSession.setId("")` (expo#47101/#48694, фикс не бэкпортирован в 57.0.x) давали второе «зависшее» уведомление со старой проповедью, переживающее рестарт приложения.

Replace-in-place устраняет оба класса проблем: нет окна без FGS/аудио (нечего замораживать) и нет teardown-гонок (сессия одна на всё время жизни плеера). Дополнительно `createAudioPlayer` создаётся с `keepAudioSessionActive: true` — iOS AVAudioSession не деактивируется в конце трека (тот же класс отказа авто-перехода на iOS), а предыдущий плеер в `loadAudio` освобождается через `release()` вместо `remove()` (утечка нативного плеера, expo#41852).

Guard в `PlayerStatusListener`: продакшен-Android после смены источника может выстрелить устаревшим `didJustFinish` от старого трека (expo#34301). Основная защита — окно снятия слушателей (`cleanup()` до `replace`, `setupListeners()` после загрузки), плюс два эшелона внутри слушателя: (1) **arming** — обработчик `didJustFinish` активируется только после первого «здорового» статуса нового источника (`isLoaded && duration > 0 && !didJustFinish`); до этого события конца трека игнорируются полностью — это закрывает случай, когда устаревшее событие с `duration = 0` или позицией ≈ длительности проскальзывает мимо окна и обманывает эвристику; (2) эвристика `isGenuineTrackEnd` + дедупликация `trackEndHandled` — событие считается настоящим, только если позиция в пределах 3с от длительности (или длительность неизвестна); иначе игнорируется (одиночный `console.warn`). Флаг arming сбрасывается в `cleanup()`.

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

Остаточный риск: если `replaceAudio` вернул `null` (30s таймаут сети), сессия/уведомление **не исчезают** (replace-in-place: teardown'а нет) — панель остаётся видимой, но показывает метаданные **старого** трека, тогда как UI приложения уже показывает новый. Восстановление: следующий успешный `setLockScreenMetadata` (например, при ручном переключении трека или повторном воспроизведении) обновит метаданные; возврат в foreground триггерит `reassertLockScreenMetadata` (`useAppStatePlayback`), который принудительно проходит полный путь активации `setActiveForLockScreen(true)` и перепривязывает сервис. Отслеживается в `docs/debt.md`.

### Баг 3: Crash loop при перезапуске (ИСПРАВЛЕНО)

**Подтверждённая корневая причина (из реального crash log):** фолбэк-обложка возвращала URI без протокола (`assets_fallbackartwork`) в release-сборке — `getLocalAppIconUri()` после `downloadAsync()` отдавал `asset.localUri` как голое имя ассета. expo-audio `setActiveForLockScreen` (синхронный JSI-вызов) бросал `MalformedURLException` (`Cannot cast value for field 'artworkUrl'` — натив ждёт `java.net.URL`), а необработанный throw из колбэка `setInterval` (retry-путь `setMetadata`) приводил к фатальному крашу при восстановлении плеера на старте — crash loop на каждом запуске.

Фикс (связка правок):

- **Санитизация на границе** (`LockScreenControls.applyMetadata`): `artworkUrl = [metadata.artworkUrl, getLocalAppIconUri()].find(hasUriProtocol)` — `hasUriProtocol` пропускает только значения с протоколом (`https://`, `http://`, `file://`, `asset:///`, `content://`), отбрасывает голые имена (`assets_fallbackartwork`), `''`, `null`. Ключ `artworkUrl` **полностью опускается**, если валидного значения нет (не отправляется даже как `undefined`).
- **Fail-safe** (`setActiveForLockScreen` в `applyMetadata` и `clear`): вызов обёрнут в try-catch — `console.error('[LockScreenControls] setActiveForLockScreen failed:', error)` + `reportError(error, 'Не удалось обновить данные плеера на экране блокировки')`. Метод никогда не бросает вверх: lock screen косметичен, ошибка показывает диалог, но не роняет процесс.
- **Валидация в app-icon** (`src/shared/lib/app-icon.ts`): `localAppIconUri` присваивается только если `asset.localUri` прошёл `hasUriProtocol`; `APP_ICON_URI` — live binding (`export let`), обновляется на валидный локальный uri после загрузки (плейсхолдер в UI начинает рендериться).

Ранее (до подтверждения корневой причины) считалось, что crash-loop вызывает нативный краш ExoPlayer/MediaSession:

- ~~`handleTrackEnd` **без try-catch**~~ — исправлено (Issue #45, Phase 1): тело метода вынесено в приватный `advanceToNextTrack`, а `handleTrackEnd` оборачивает вызов в try-catch с логированием (`console.error('[TrackAutoAdvanceService] handleTrackEnd failed:', error)`) и `reportError`, так что `void trackAutoAdvanceService.handleTrackEnd()` больше не даёт unhandled promise rejection.
- `GlobalErrorHandler` повторно вызывает `originalHandler(error, isFatal)` после `reportError` — фатальные ошибки по-прежнему убивают процесс (нативный краш не подавляется), но теперь перед этим показывается глобальный диалог ошибок (см. [error-handling.md](./error-handling.md)), а `markHistoryCompletedAction` снабжён `.catch` — асинхронная ошибка не роняет плеер. Это убирает симптом «показывает диалог, потом закрывается» для обрабатываемых ошибок.
- Коммит `ec69eeb` (20.08.2026) документирует проблемы уничтожения Android MediaSession/ExoPlayer («activity is no longer available», expo#46137, androidx/media#1928).
- Стартовые чтения хранилища все обёрнуты в safeParse — повреждённый JSON истории сам по себе краш старта НЕ вызовет.

Фикс: crash-loop устраняется связкой правок Issue #45 — `handleTrackEnd` обёрнут в try-catch (нет unhandled rejection), zod-схемы приведены к честному `artwork: string | null` (Баг 4), а ошибки сервисов/слушателей теперь идут в `reportError` → глобальный диалог вместо молчаливого краша. Необрабатываемый фатальный нативный краш по-прежнему завершает процесс (см. [error-handling.md](./error-handling.md) → GlobalErrorHandler).

Общий контракт передачи данных из JS в нативные модули (expo-audio, expo-asset), правила валидации на границе и диагностика нативного краша — в [../contracts/native-modules.md](../contracts/native-modules.md).

### Баг 4: Zod schema drift убивает auto-advance молча (ИСПРАВЛЕНО)

`TrackAutoAdvanceService.ts:46-106`: `handleTrackEnd` перечитывает `CURRENT_AUDIO`, `CURRENT_PLAYLIST`, `CURRENT_REPEAT_MODE` из AsyncStorage и парсит их zod-схемами (`parseAudioPlayerData`/`parsePlaylistData`). Если парсинг вернул `undefined` (например, `sermonSchema` требует `artwork: z.string()`, а API для некоторых проповедей отдаёт `null`/отсутствующее поле), `handleTrackEnd` молча выходит на L69-70 — авто-переход умирает **без единой ошибки в логах**.

Сильный кандидат на симптом «воспроизведение встаёт на паузу и больше не возобновляется» после долгих сессий. Корневая причина — расхождение (drift) между payload API и строгими zod-схемами.

Фикс: `sermonSchema.artwork` изменён на `z.string().nullable()`, `playlistSchema.artwork` — тоже `z.string().nullable()`: доменный тип `artwork` теперь честный `string | null` вместо пустой строки-заглушки. Маппер нормализует на границе API (`apiSermon.artwork ?? null`). Потребители null: `CoverImage` подставляет `IMAGE_PLACEHOLDER`, lock screen — иконку приложения (`metadata.artworkUrl || getLocalAppIconUri()`).

Дополнительно (observability): при будущем schema drift парсинг `CURRENT_AUDIO`/`CURRENT_PLAYLIST` в `advanceToNextTrack` логирует `console.error` и показывает глобальный диалог через `reportError` — авто-переход по-прежнему прерывается (safety net), но ошибка больше не молчит.

### Event-driven waitForLoaded и seek-guards (Issue #60)

**Корневая причина:** при фоновом авто-переходе на Android (заблокированный экран) JS-таймеры (`setInterval`, `setTimeout`) замораживаются (`JavaTimerManager` паузится при host pause), но нативные события `playbackStatusUpdate` **продолжают приходить**. Старый `waitForLoaded` использовал `setInterval(100ms)` polling — при фоновом `replace()` нативный плеер становился loaded и начинал воспроизведение, но polling стоял из-за замороженных таймеров. Когда пользователь открывал приложение, polling обнаруживал `isLoaded === true` и безусловно вызывал `seekTo(initialPositionMs)` — с `initialPositionMs=0` это `seekTo(0)` на уже играющем треке → **аудио перезапускалось с начала** (hearable restart from zero). Дополнительно `isBufferingAtom` застревал в `true` (буферизация не очищалась в замороженном polling) → на кнопке play мелькал спиннер.

**Фикс** (`src/entities/player/lib/PlayerService/waitForLoaded.ts`, вынесен из `AudioLoader.ts`):

1. **Sync fast-path:** если `player.isLoaded === true` — полная загрузка сразу (без подписок и таймеров).
2. **Event-driven primary path:** подписка на `player.addListener('playbackStatusUpdate', ...)` — событие приходит даже в фоне. При `status.isLoaded === true` → `completeLoad`. После завершения подписка удаляется (double-completion guard через флаг `resolved`).
3. **Safety-net timeout:** `setTimeout(30s)` fallback для foreground stall (таймеры не работают в фоне — это нормально, event path покрывает).
4. **Error fast-fail:** если нативный статус содержит `status.error`, `waitForLoaded` разрешается `null` сразу (clear subscription/timeout, clear buffering) — вместо зависания на 30с. `waitForLoaded` не реджектит при ошибке, поэтому `loadAudio`'s `.catch` не срабатывает — результат тихий `null` (как и старый 30с timeout, не регресс).
5. **Seek- guards** (убивают баг):
   - `seekTo` вызывается **только** когда `initialPositionMs > 0` — seek-to-zero это no-op для нового источника, а для уже играющего — деструктивный рестарт.
   - `seekTo` **пропускается** если `currentTime > initialPositionMs + 1500ms` (stale poll: позиция уже продвинулась past target).
   - `initialPositionMs` clamp'ится к загруженной длительности перед seek — seek за пределы длительности → ExoPlayer clamps к концу → STATE_ENDED → случайный auto-advance.
6. **Position semantics:** `setPositionAction` вызывается при каждом прохождении stale-progress guard (`currentMs ≤ initialPositionMs + tolerance`) — seek или не seek. Это восстанавливает старое поведение «сброс на 0 сразу» на авто-переходе (initial=0, свежий source → position 0) и не тянет продвинувшуюся позицию назад.
7. **Staleness guard:** `waitForLoaded` принимает `isCurrentPlayer(player)` callback (передаётся из `AudioLoader` как `p => p === this.playerInstance`). При завершении (event/timeout/error), если `!isCurrentPlayer(player)`: пропускает ВСЕ записи состояния (duration, AsyncStorage, buffering, position), пропускает seekTo, resolves молча. Защищает от stale-closure когда более новый `loadAudio` release'ит предыдущий плеер или `releaseAndReset()` запущен.

**Связанные файлы:** `AudioLoader.ts` (96 строк, импортирует `waitForLoaded`), `waitForLoaded.ts`. Публичный API `AudioLoader` не изменился.

## Связанные документы

- [audio-cache.md](./audio-cache.md) — кэширование аудио (в т.ч. автоматическое при старте трека)
- [listening-history.md](./listening-history.md) — история прослушивания, resume-логика, прогресс в UI
- [navigation.md](./navigation.md) — стек экранов и hardware-back
- [state.md](./state.md) — карта Reatom-атомов
