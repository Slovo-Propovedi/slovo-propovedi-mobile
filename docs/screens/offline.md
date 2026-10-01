# Экран «Офлайн»

**Маршрут:** `/offline` (вне таб-группы, Stack.Screen)
**Файлы:** `app/offline.tsx` (реэкспорт) → `src/pages/offline/ui/OfflineScreen.tsx`, `src/pages/offline/ui/OfflineEmptyState.tsx`, `src/pages/offline/ui/OfflineRow.tsx`, `src/pages/offline/ui/OfflineSeparator.tsx`, `src/pages/offline/ui/OfflineHeaderMenu.tsx`, `src/pages/offline/ui/SermonCachingHeaderSwitch.tsx`
**Статус:** готов

## Что делает

Показывает список проповедей, аудио которых скачано на устройство (кэш аудио). Позволяет воспроизвести офлайн-проповедь через стандартный флоу плеера (`playNewSermon`). Сам экран не управляет скачиванием — только читает кэш.

## Что показывается

- `FlatList` офлайн-проповедей; каждая строка — `OfflineRow` (`src/pages/offline/ui/OfflineRow.tsx`), рендерящий `TracksListItem` (`entities/track-list`):
  - заголовок — название проповеди;
  - сабтайтл — название плейлиста, из которого проповедь попала в список (для проповедей без плейлиста — синтетический плейлист с тем же названием, что и проповедь);
  - обложка — через `CoverImage` с фолбэком `IMAGE_PLACEHOLDER`;
  - активная строка подсвечивается (`isPlaying`/`isAudioPlaying` по `currentAudioAtom`/`isPlayingAtom`);
  - тонкая полоса прогресса прослушивания — `useHistoryProgress(sermon.id)` (`entities/listening-history`), как в остальных списках;
  - контекстное меню — встроенное в `TracksListItem` (удаление из офлайн) плюс кастомный пункт **«Добавить в плейлист»** (иконка `add-circle`): `OfflineRow` строит `menuActions` и вызывает колбэк экрана, который открывает модалку мультивыбора (`useAddToPlaylistModal` на `OfflineScreen`, одна на список — см. [features/add-to-playlist.md](../features/add-to-playlist.md)).
- Тап по строке — воспроизведение проповеди в её плейлисте через `usePlayNewSermon` (`entities/player`), обёрнутое в try/catch → `reportError(error, 'Не удалось воспроизвести офлайн-проповедь')`.
- Пустое состояние: «Нет офлайн-проповедей»; если скачивание выключено тумблером — «Сохранение в офлайн отключено» + подсказка «Включите тумблер в шапке экрана» (`OfflineEmptyState`, `src/pages/offline/ui/OfflineEmptyState.tsx`; текст по `sermonCachingEnabledAtom`).
- Шапка — ряд из двух элементов (`headerRight` в `OfflineScreen`, `View` c `flexDirection: 'row'`):
  - переключатель кеширования (`SermonCachingHeaderSwitch`, `src/pages/offline/ui/SermonCachingHeaderSwitch.tsx`) — глобальный тумблер скачивания аудио для офлайна. Это `PressableButton` (`accessibilityRole='switch'`, `accessibilityLabel='Кеширование проповедей'`, `accessibilityState={{ checked }}`) с `minHeight/minWidth: MIN_TOUCH_TARGET` (48pt), внутри которого чисто визуальный `Switch` c `pointerEvents: 'none'` **в стиле** (prop-форма на Fabric ненадёжна: нативный контроль перехватывал бы тап и самопереключался бы) и `scale 0.8`: RN игнорирует `hitSlop` на `Switch` (Android — только `ReactViewGroup`, iOS Fabric — `UISwitch` через target-action), поэтому тап-зону и обработчик нажатия несёт обёртка, а не сам переключатель; цвета дорожки — `currentTheme.primary` (вкл.) / `COLORS.disabled` (выкл.), ползунок `COLORS.white`. Переехал сюда с экрана [«Настройки»](./settings.md), где отдельной строкей больше не значится;
  - меню `OfflineHeaderMenu` (`src/pages/offline/ui/OfflineHeaderMenu.tsx`): пункт «Очистить офлайн» → `ConfirmDialog` («Очистить офлайн?», «Все офлайн-проповеди будут удалены. Для офлайн-прослушивания их нужно добавить заново.») → `clearAudioCacheAction` (`entities/offline-cache`); ошибки через `ErrorDialog` (`shared/ui/error-dialog`). Пункт заблокирован, пока идёт скачивание (реактивно по `cacheQueueAtom`/`activeCacheUrlAtom`).

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
- Фильтр `filterCachedSermons` (`src/features/offline-sermons/lib/filterCachedSermons.ts`): сужение до `AudioPlayerData` через `toAudioPlayerData` (проповеди без `audioUrl` отбрасываются) + `audioCacheService.isCached(audioUrl)` для каждого (ошибка проверки = «не скачано»).
- Состояние: `offlineSermonsAtom` (`OfflineSermonItem[]`), `isLoadingOfflineSermonsAtom`. При ошибке загрузки — `reportError(error, 'Не удалось загрузить список офлайн-проповедей')`, предыдущий список сохраняется.
- Переключатель шапки: `sermonCachingEnabledAtom` + `setSermonCachingEnabled` (из `entities/offline-cache`, файл `src/entities/offline-cache/lib/sermonCachingSetting.ts`); очистка кэша при выключении — `cancelDownloadsAndClearCache` (`src/pages/offline/lib/cancelDownloadsAndClearCache.ts`) через `cancelAllCacheDownloads` / `clearAudioCacheAction` (`entities/offline-cache`).

## Куда можно перейти

- Тап на строку → воспроизведение проповеди в её плейлисте (полная очередь + авто-переход) через `usePlayNewSermon`.

## Состояния

- Загрузка: при первом открытии (список ещё пуст) показываются скелетоны `TracksListSkeleton` (`entities/track-list`, 6 строк с разделителями); скелетон повторяет форму элемента списка (та же карточка-строка с обложкой и двумя полосами текста, с теми же отступами), поэтому при загрузке ничего не сдвигается; список не очищается при перезагрузке (обновление атома только после успешной фильтрации). Параллельные загрузки списка разрешаются по принципу «последняя завершённая побеждает».
- Пусто: «Нет офлайн-проповедей».
- Пусто при выключенном кешировании: вместо нейтрального «пусто» — «Сохранение в офлайн отключено» + подсказка «Включите тумблер в шапке экрана» (`OfflineEmptyState` по `sermonCachingEnabledAtom`): при выключенной настройке пустой список — ожидаемое состояние, а не потерянный кэш. Скелетоны при этом по-прежнему имеют приоритет (пока идёт первичная загрузка).
- Офлайн: экран работает полностью офлайн — источники кандидатов локальные (AsyncStorage/атомы), проверка кэша локальная.
- Ошибка: `reportError` + сохранение предыдущего списка.
- Переключение кеширования: включение — только оптимистичное переключение и запись атома; выключение — сначала атом (оптимистично, **до** `AsyncStorage.setItem`, поэтому очереди закачек мгновенно становятся инертными, а UI не ждёт storage-round-trip), затем `cancelDownloadsAndClearCache` (`src/pages/offline/lib/`): отмена всех закачек (`cancelAllCacheDownloads`), ожидание завершения прерванной закачки (дожидаемся её промиса через `waitForInflightCacheDownloads` — `Promise.allSettled` по снапшоту inflight-реестра, без опроса и потолка) и очистка кэша (`clearAudioCacheAction`) — строго после ожидания, поэтому очистка всегда выполняется и повтора/пропуска в коде нет. При провале записи в хранилище атом откатывается к предыдущему значению, ошибка логируется. Даже в гонке Android, где отмена приходит до регистрации загрузки в нативном хранилище и становится no-op'ом, закачка доигрывает, и очистка происходит после её завершения. Всё асинхронно, без индикации прогресса; неожиданный провал очистки пишет `console.warn`.
- Тумблер **никогда не блокируется** и отражает нажатие мгновенно: цель выводится из атома в момент нажатия (а не из render-замыкания), а оптимистичное (синхронное) переключение атома сразу даёт актуальное значение. Разрушительный побочный эффект выключения (отмена закачек + очистка кэша) **дебонсится** (`TOGGLE_SETTLE_MS` ≈0.8с): он запускается один раз после того, как пользователь перестал переключать, и только если осевшее значение — OFF; повторное включение до истечения таймера отменяет запланированную очистку, а размонтирование экрана снимает таймер. Ошибки прогона и записи логируются (`console.error`) и не «залипают» переключатель. Стартовая загрузка настройки не перезаписывает атом, если пользователь уже нажал тумблер (см. [features/audio-cache.md](../features/audio-cache.md) → «Гонки переключателя»). Итог: сразу после выключения список офлайн-проповедей пустеет (и показывает текст про отключённое сохранение), а индикаторы и кнопки кэша скрыты во всём приложении (см. [features/audio-cache.md](../features/audio-cache.md)). При выключенном кешировании пункт «Очистить офлайн» в меню шапки остаётся доступным (кэш и так пуст, действие безвредно).

## Ограничения

- Список строится из метаданных, которые уже есть на устройстве (история/секции/поиск/текущий плейлист) плюс персистентный реестр офлайн-проповедей. Реестр закрывает случай «осиротевшего» файла кэша: проповедь, скачанная при работающем реестре, остаётся в списке даже после очистки кэша секций и истории. Проповеди, скачанные до появления реестра, попадают в него одноразовым бэкфиллом при первом старте новой версии.
- На web список строится так же (реестр + `isCached` через `hasCompleteAudio` по commit-манифесту); повреждённый бакет (WebKit recovery `caches.delete`) может временно скрыть проповедь до перекачки — см. [features/audio-cache.md](../features/audio-cache.md) → «Известное ограничение (web)».

## Связанные документы

- [features/navigation.md](../features/navigation.md)
- [features/audio-cache.md](../features/audio-cache.md)
- [features/listening-history.md](../features/listening-history.md)
- [screens/more.md](./more.md)
