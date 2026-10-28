# Экран «Офлайн»

**Маршрут:** `/offline` (вне таб-группы, Stack.Screen)
**Файлы:** `app/offline.tsx` (реэкспорт) → `src/pages/offline/ui/OfflineScreen.tsx`, `src/pages/offline/ui/OfflineEmptyState.tsx`, `src/pages/offline/ui/OfflineRow.tsx`, `src/pages/offline/ui/OfflineSeparator.tsx`, `src/pages/offline/ui/OfflineHeaderMenu.tsx`, `src/pages/offline/ui/SermonCachingHeaderSwitch.tsx`, `src/pages/offline/lib/offlinePlaylist.ts`; выбор контекста воспроизведения — `src/features/playback-choice/` ([features/playback-choice.md](../features/playback-choice.md))
**Статус:** готов

## Что делает

Показывает список проповедей, аудио которых скачано на устройство (кэш аудио). Позволяет воспроизвести офлайн-проповедь через стандартный флоу плеера (`playNewSermon`), выбрав контекст: конкретный плейлист или всю офлайн-коллекцию. Сам экран не управляет скачиванием — только читает кэш.

## Что показывается

- `FlatList` офлайн-проповедей; каждая строка — `OfflineRow` (`src/pages/offline/ui/OfflineRow.tsx`), рендерящий `TracksListItem` (`entities/track-list`). Список виртуализирован с явными лимитами окна (`initialNumToRender: 8`, `maxToRenderPerBatch: 8`, `windowSize: 7`): каждая смонтированная строка держит свои подписки (кэш, история) и нативный `File.exists`, поэтому дефолтное окно (21 вьюпорт) выливалось в дорогую волну монтирований при появлении списка:
  - заголовок — название проповеди;
  - сабтайтл — название плейлиста, из которого проповедь попала в список (для проповедей без плейлиста — синтетический плейлист с тем же названием, что и проповедь);
  - обложка — через `CoverImage` с фолбэком `IMAGE_PLACEHOLDER`;
  - активная строка подсвечивается (`isPlaying`/`isAudioPlaying` по `currentAudioAtom`/`isPlayingAtom`);
  - тонкая полоса прогресса прослушивания — `useHistoryProgress(sermon.id)` (`entities/listening-history`), как в остальных списках;
  - сердечко «в избранном» слева от «⋯» (`FavoriteSermonButton`; `OfflineRow` передаёт снапшот `item.sermon`) — клик сразу добавляет/убирает проповедь в «Избранных» без модалки (см. [features/my-playlists.md](../features/my-playlists.md) → «Точки переключения избранного»);
  - контекстное меню — встроенное в `TracksListItem` (удаление из офлайн) плюс кастомный пункт **«Добавить в плейлист»** (иконка `add-circle`): `OfflineRow` строит `menuActions` и вызывает колбэк экрана, который открывает модалку мультивыбора (`useAddToPlaylistModal` на `OfflineScreen`, одна на список — см. [features/add-to-playlist.md](../features/add-to-playlist.md)).
- Тап по строке — выбор контекста воспроизведения через общий хук `usePlaybackChoice` (`src/features/playback-choice/`, см. [features/playback-choice.md](../features/playback-choice.md)):
  - кандидаты собираются фичей **локально, без сети**: реальный исходный плейлист проповеди (синтетический одно-проповедный снапшот `buildManualPlaylist` отбрасывается), рефы `sermon.playlists`, несущие локальные проповеди (лёгкие рефы с `sermons: []` требуют API и не берутся), локальные плейлисты из `myPlaylistsAtom`, содержащие проповедь; дедуп по `id`, исходный плейлист первым;
  - кандидатов нет → сразу играет псевдо-плейлист **всех** офлайн-проповедей (`buildOfflinePlaylist`, `src/pages/offline/lib/offlinePlaylist.ts`: `id` `offline-list`, название «Офлайн», порядок — как в списке экрана), без диалога;
  - иначе открывается `PlaybackChoiceDialog` (см. ниже); выбор играет проповедь в выбранном плейлисте (очередь = этот плейлист, авто-переход по его трекам);
  - ошибка запуска → try/catch → `reportError(error, 'Не удалось воспроизвести офлайн-проповедь')`;
  - `OfflineRow` презентационный: `onPress(item)` приходит с экрана, о выборе контекста строка не знает; её контекстное меню (⋯ → «Добавить в плейлист») не меняется.
- Диалог выбора плейлиста `PlaybackChoiceDialog` (`src/features/playback-choice/ui/PlaybackChoiceDialog.tsx`): заголовок «Где воспроизвести проповедь?», первая строка «Все офлайн-проповеди» (играет псевдо-плейлист всей коллекции), ниже — каждый реальный плейлист с обложкой и названием; список ограничен по высоте, backdrop закрывает диалог без воспроизведения. Один диалог на экран (состояние держит хук, а не строка).
- Пустое состояние: «Нет офлайн-проповедей»; если скачивание выключено тумблером — «Сохранение в офлайн отключено» + подсказка «Включите тумблер в шапке экрана» (`OfflineEmptyState`, `src/pages/offline/ui/OfflineEmptyState.tsx`; текст по `sermonCachingEnabledAtom`).
- Шапка — ряд из двух элементов (`headerRight` в `OfflineScreen`, `View` c `flexDirection: 'row'`):
  - переключатель кеширования (`SermonCachingHeaderSwitch`, `src/pages/offline/ui/SermonCachingHeaderSwitch.tsx`) — глобальный тумблер скачивания аудио для офлайна. Это `PressableButton` (`accessibilityRole='switch'`, `accessibilityLabel='Кеширование проповедей'`, `accessibilityState={{ checked }}`) с `minHeight/minWidth: MIN_TOUCH_TARGET` (48pt), внутри которого чисто визуальный `Switch` c `pointerEvents: 'none'` **в стиле** (prop-форма на Fabric ненадёжна: нативный контроль перехватывал бы тап и самопереключался бы) и `scale 0.8`: RN игнорирует `hitSlop` на `Switch` (Android — только `ReactViewGroup`, iOS Fabric — `UISwitch` через target-action), поэтому тап-зону и обработчик нажатия несёт обёртка, а не сам переключатель; цвета тумблера считает `buildToggleColors` (`src/pages/offline/lib/`, чистая функция от темы) и раскладывает их сразу по трём семействам пропов: iOS (`thumbTintColor`/`onTintColor`/`tintColor`), Android (`thumbColor`/`trackColor`) и react-native-web (`thumbColor`/`trackColor`/`activeThumbColor`/`activeTrackColor` — их читает веб-`Switch`; без них web рисовал дефолтный зелёный). Ползунок — `currentTheme.primary`, дорожка ON — `withAlpha(primary, ON_TRACK_OPACITY)` (см. оговорку про Material You/`PlatformColor` в `withAlpha`), дорожка OFF — `COLORS.disabled`; RN отбрасывает чужие пропы на каждой платформе. Переехал сюда с экрана [«Настройки»](./settings.md), где отдельной строкей больше не значится;
  - меню `OfflineHeaderMenu` (`src/pages/offline/ui/OfflineHeaderMenu.tsx`) — два пункта:
    - **«Воспроизвести все»** — играет все скачанные проповеди одной очередью (псевдо-плейлист `offline-list` — `buildOfflinePlaylist(items)`, порядок как в списке экрана); пункт недоступен, когда список пуст;
    - **«Очистить офлайн»** → `ConfirmDialog` («Очистить офлайн?», «Все офлайн-проповеди будут удалены. Для офлайн-прослушивания их нужно добавить заново.») → `clearAudioCacheAction` (`entities/offline-cache`); ошибки через `ErrorDialog` (`shared/ui/error-dialog`). Пункт заблокирован, пока идёт скачивание (реактивно по `cacheQueueAtom`/`activeCacheUrlAtom`).
- Кнопка «?» в шапке (`OnboardingHelpRow`, слева от тумблера и меню) — онбординг/обзор возможностей (см. [../features/onboarding.md](../features/onboarding.md)).

## Откуда данные

- Хук `useOfflineSermons` (`src/features/offline-sermons/lib/useOfflineSermons.ts`):
  - единый `useFocusEffect` (из `expo-router`): загрузка при фокусе экрана и повторная загрузка при изменении `cacheUpdateTriggerAtom` (`entities/offline-cache`) — после завершения/удаления скачиваний (колбэк пересоздаётся при смене триггера, поэтому эффект перезапускается во время фокуса).
- Экшен `loadOfflineSermons` (`src/features/offline-sermons/model.ts`) собирает кандидатов из пяти источников и оставляет только закэшированные:
  1. текущий плейлист плеера (`currentPlaylistAtom` + `currentAudioAtom`, `entities/player`);
  2. кэш секций (`getCachedSections`, `entities/section/lib/sections-cache`);
  3. история прослушивания (`readHistory` + `getEntrySermon`, `entities/listening-history`);
  4. **персистентный реестр офлайн-проповедей** (`offlineRegistryAtom`, `entities/offline-cache`) — авторитетный источник: переживает рестарты и не зависит от наличия метаданных в остальных источниках;
  5. кэш поиска (`AsyncStorage.getAllKeys` по префиксу `cachedSermonSearch:` + `getCachedJson`, `shared/lib/cache`).
- Кандидаты объединяются `mergeSermonCandidates` (дедупликация по `sermon.id`; приоритет у кандидата с реальным плейлистом; без плейлиста — синтетический через `buildManualPlaylist` из `entities/listening-history`: `{ id, title, artwork, description: '', sermons: [санитизированная проповедь] }`). Порядок мержа `[currentPlayer, sections, history, registry, search]` кодирует качество данных: свежие полные плейлисты (плеер, секции) бьют реестр; реестр (полные плейлисты) бьёт синтетические плейлисты поиска.
- Фильтр `filterCachedSermons` (`src/features/offline-sermons/lib/filterCachedSermons.ts`): сужение до `AudioPlayerData` через `toAudioPlayerData` (проповеди без `audioUrl` отбрасываются) + `audioCacheService.isCached(audioUrl)` для каждого (ошибка проверки = «не скачано»). Проверки идут через `mapWithYields` (`shared/lib/utils/mapWithYields`): `isCached` выполняет синхронный нативный `File.exists`, и проверка всех кандидатов в одном тике (`Promise.all` по массиву) замораживала JS-поток при появлении списка — батчи с уступкой событийному циклу между ними держат поток отзывчивым (важно и для замеров rect'ов онбординг-туром).
- Состояние: `offlineSermonsAtom` (`OfflineSermonItem[]`), `isLoadingOfflineSermonsAtom`, `offlineSermonsLoadedAtom` (`entities/offline-cache`, через barrel). При ошибке загрузки — `reportError(error, 'Не удалось загрузить список офлайн-проповедей')`, предыдущий список сохраняется. `offlineSermonsLoadedAtom` становится `true` в `finally` загрузки: это кросс-слойный флаг, по которому онбординг-тур (`waitFor: 'offlineLoaded'`, см. [features/onboarding.md](../features/onboarding.md)) ждёт, пока список устоится, прежде чем подсветить тумблер кэширования.
- Переключатель шапки: `sermonCachingEnabledAtom` + `setSermonCachingEnabled` (из `entities/offline-cache`, файл `src/entities/offline-cache/lib/sermonCachingSetting.ts`); очистка кэша при выключении — `cancelDownloadsAndClearCache` (`src/pages/offline/lib/cancelDownloadsAndClearCache.ts`) через `cancelAllCacheDownloads` / `clearAudioCacheAction` (`entities/offline-cache`).
- Выбор контекста воспроизведения: `usePlaybackChoice` (`src/features/playback-choice/`) собирает кандидатов из локальных данных (`OfflineSermonItem.playlist`, `sermon.playlists`, `myPlaylistsAtom`), без API-запросов, поэтому выбор работает полностью офлайн; псевдо-плейлист «Офлайн» собирает `buildOfflinePlaylist(items)` из тех же `items`, что рендерит список.

## Куда можно перейти

- Переходов нет. Тап на строку открывает `PlaybackChoiceDialog` (или сразу запускает псевдо-плейлист «Офлайн», если реальных плейлистов нет); любой выбор запускает воспроизведение на месте — см. «Что показывается». Пункт «Воспроизвести все» в меню шапки запускает ту же офлайн-коллекцию, не выходя из экрана.

## Состояния

- Загрузка: при первом открытии (список ещё пуст) показываются скелетоны `TracksListSkeleton` (`entities/track-list`, 6 строк с разделителями); скелетон повторяет форму элемента списка (та же карточка-строка с обложкой и двумя полосами текста, с теми же отступами), поэтому при загрузке ничего не сдвигается; список не очищается при перезагрузке (обновление атома только после успешной фильтрации). Параллельные загрузки списка разрешаются по принципу «последняя завершённая побеждает».
- Пусто: «Нет офлайн-проповедей».
- Пусто при выключенном кешировании: вместо нейтрального «пусто» — «Сохранение в офлайн отключено» + подсказка «Включите тумблер в шапке экрана» (`OfflineEmptyState` по `sermonCachingEnabledAtom`): при выключенной настройке пустой список — ожидаемое состояние, а не потерянный кэш. Скелетоны при этом по-прежнему имеют приоритет (пока идёт первичная загрузка).
- Офлайн: экран работает полностью офлайн — источники кандидатов локальные (AsyncStorage/атомы), проверка кэша локальная, выбор контекста воспроизведения тоже не ходит в сеть.
- Ошибка: `reportError` + сохранение предыдущего списка.
- Переключение кеширования: включение — только оптимистичное переключение и запись атома; выключение — сначала атом (оптимистично, **до** `AsyncStorage.setItem`, поэтому очереди закачек мгновенно становятся инертными, а UI не ждёт storage-round-trip), затем `cancelDownloadsAndClearCache` (`src/pages/offline/lib/`): отмена всех закачек (`cancelAllCacheDownloads`), ожидание завершения прерванной закачки (дожидаемся её промиса через `waitForInflightCacheDownloads` — `Promise.allSettled` по снапшоту inflight-реестра, без опроса и потолка) и очистка кэша (`clearAudioCacheAction`) — строго после ожидания, поэтому очистка всегда выполняется и повтора/пропуска в коде нет. При провале записи в хранилище атом откатывается к предыдущему значению, ошибка логируется. Даже в гонке Android, где отмена приходит до регистрации загрузки в нативном хранилище и становится no-op'ом, закачка доигрывает, и очистка происходит после её завершения. Всё асинхронно, без индикации прогресса; неожиданный провал очистки пишет `console.warn`.
- Тумблер **никогда не блокируется** и отражает нажатие мгновенно: цель выводится из атома в момент нажатия (а не из render-замыкания), а оптимистичное (синхронное) переключение атома сразу даёт актуальное значение. Разрушительный побочный эффект выключения (отмена закачек + очистка кэша) **дебонсится** (`TOGGLE_SETTLE_MS` ≈0.8с): он запускается один раз после того, как пользователь перестал переключать, и только если осевшее значение — OFF; повторное включение до истечения таймера отменяет запланированную очистку, а размонтирование экрана снимает таймер. Ошибки прогона и записи логируются (`console.error`) и не «залипают» переключатель. Стартовая загрузка настройки не перезаписывает атом, если пользователь уже нажал тумблер (см. [features/audio-cache.md](../features/audio-cache.md) → «Гонки переключателя»). Итог: сразу после выключения список офлайн-проповедей пустеет (и показывает текст про отключённое сохранение), а индикаторы и кнопки кэша скрыты во всём приложении (см. [features/audio-cache.md](../features/audio-cache.md)). При выключенном кешировании пункт «Очистить офлайн» в меню шапки остаётся доступным (кэш и так пуст, действие безвредно), а «Воспроизвести все» недоступен — список пуст.

## Ограничения

- Список строится из метаданных, которые уже есть на устройстве (история/секции/поиск/текущий плейлист) плюс персистентный реестр офлайн-проповедей. Реестр закрывает случай «осиротевшего» файла кэша: проповедь, скачанная при работающем реестре, остаётся в списке даже после очистки кэша секций и истории. Проповеди, скачанные до появления реестра, попадают в него одноразовым бэкфиллом при первом старте новой версии.
- На web список строится так же (реестр + `isCached` через `hasCompleteAudio` по commit-манифесту); повреждённый бакет (WebKit recovery `caches.delete`) может временно скрыть проповедь до перекачки — см. [features/audio-cache.md](../features/audio-cache.md) → «Известное ограничение (web)».

## Связанные документы

- [features/navigation.md](../features/navigation.md)
- [features/audio-cache.md](../features/audio-cache.md)
- [features/listening-history.md](../features/listening-history.md)
- [features/playback-choice.md](../features/playback-choice.md)
- [features/player.md](../features/player.md)
- [features/offline-and-network.md](../features/offline-and-network.md)
- [screens/more.md](./more.md)
