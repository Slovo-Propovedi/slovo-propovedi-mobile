# Экран «Офлайн»

**Маршрут:** `/offline` (вне таб-группы, Stack.Screen)
**Файлы:** `app/offline.tsx` (реэкспорт) → `src/pages/offline/ui/OfflineScreen.tsx`, `src/pages/offline/ui/OfflineRow.tsx`, `src/pages/offline/ui/OfflineSeparator.tsx`, `src/pages/offline/ui/OfflineHeaderMenu.tsx`
**Статус:** готов

## Что делает

Показывает список проповедей, аудио которых скачано на устройство (кэш аудио). Позволяет воспроизвести офлайн-проповедь через стандартный флоу плеера (`playNewSermon`). Сам экран не управляет скачиванием — только читает кэш.

## Что показывается

- `FlatList` офлайн-проповедей; каждая строка — `OfflineRow` (`src/pages/offline/ui/OfflineRow.tsx`), рендерящий `TracksListItem` (`shared/ui/track-list`):
  - заголовок — название проповеди;
  - сабтайтл — название плейлиста, из которого проповедь попала в список (для проповедей без плейлиста — синтетический плейлист с тем же названием, что и проповедь);
  - обложка — через `CoverImage` с фолбэком `IMAGE_PLACEHOLDER`;
  - активная строка подсвечивается (`isPlaying`/`isAudioPlaying` по `currentAudioAtom`/`isPlayingAtom`);
  - тонкая полоса прогресса прослушивания — `useHistoryProgress(sermon.id)` (`entities/listening-history`), как в остальных списках;
  - контекстное меню — встроенное в `TracksListItem` (удаление из офлайн), кастомных пунктов нет.
- Тап по строке — воспроизведение проповеди в её плейлисте через `usePlayNewSermon` (`entities/player`), обёрнутое в try/catch → `reportError(error, 'Не удалось воспроизвести офлайн-проповедь')`.
- Пустое состояние: «Нет офлайн-проповедей».
- Меню в шапке (`OfflineHeaderMenu`, `src/pages/offline/ui/OfflineHeaderMenu.tsx`): пункт «Очистить офлайн» → `ConfirmDialog` («Очистить офлайн?», «Все офлайн-проповеди будут удалены. Для офлайн-прослушивания их нужно добавить заново.») → `clearAudioCacheAction` (`shared/lib/audio-cache`); ошибки через `ErrorDialog` (`shared/ui/error-dialog`). Пункт заблокирован, пока идёт скачивание (реактивно по `cacheQueueAtom`/`activeCacheUrlAtom`).

## Откуда данные

- Хук `useOfflineSermons` (`src/features/offline-sermons/lib/useOfflineSermons.ts`):
  - единый `useFocusEffect` (из `expo-router`): загрузка при фокусе экрана и повторная загрузка при изменении `cacheUpdateTriggerAtom` (`shared/lib/audio-cache`) — после завершения/удаления скачиваний (колбэк пересоздаётся при смене триггера, поэтому эффект перезапускается во время фокуса).
- Экшен `loadOfflineSermons` (`src/features/offline-sermons/model.ts`) собирает кандидатов из пяти источников и оставляет только закэшированные:
  1. текущий плейлист плеера (`currentPlaylistAtom` + `currentAudioAtom`, `entities/player`);
  2. кэш секций (`getCachedSections`, `shared/lib/sections-cache`);
  3. история прослушивания (`readHistory` + `getEntrySermon`, `entities/listening-history`);
  4. **персистентный реестр офлайн-проповедей** (`offlineRegistryAtom`, `shared/lib/audio-cache`) — авторитетный источник: переживает рестарты и не зависит от наличия метаданных в остальных источниках;
  5. кэш поиска (`AsyncStorage.getAllKeys` по префиксу `cachedSermonSearch:` + `getCachedJson`, `shared/lib/cache`).
- Кандидаты объединяются `mergeSermonCandidates` (дедупликация по `sermon.id`; приоритет у кандидата с реальным плейлистом; без плейлиста — синтетический через `buildManualPlaylist` из `entities/listening-history`: `{ id, title, artwork, description: '', sermons: [санитизированная проповедь] }`). Порядок мержа `[currentPlayer, sections, history, registry, search]` кодирует качество данных: свежие полные плейлисты (плеер, секции) бьют реестр; реестр (полные плейлисты) бьёт синтетические плейлисты поиска.
- Фильтр `filterCachedSermons` (`src/features/offline-sermons/lib/filterCachedSermons.ts`): сужение до `AudioPlayerData` через `toAudioPlayerData` (проповеди без `audioUrl` отбрасываются) + `audioCacheService.isCached(audioUrl)` для каждого (ошибка проверки = «не скачано»).
- Состояние: `offlineSermonsAtom` (`OfflineSermonItem[]`), `isLoadingOfflineSermonsAtom`. При ошибке загрузки — `reportError(error, 'Не удалось загрузить список офлайн-проповедей')`, предыдущий список сохраняется.

## Куда можно перейти

- Тап на строку → воспроизведение проповеди в её плейлисте (полная очередь + авто-переход) через `usePlayNewSermon`.

## Состояния

- Загрузка: при первом открытии (список ещё пуст) показываются скелетоны `TracksListSkeleton` (`shared/ui/track-list`, 6 строк с разделителями); скелетон повторяет форму элемента списка (та же карточка-строка с обложкой и двумя полосами текста, с теми же отступами), поэтому при загрузке ничего не сдвигается; список не очищается при перезагрузке (обновление атома только после успешной фильтрации). Параллельные загрузки списка разрешаются по принципу «последняя завершённая побеждает».
- Пусто: «Нет офлайн-проповедей».
- Офлайн: экран работает полностью офлайн — источники кандидатов локальные (AsyncStorage/атомы), проверка кэша локальная.
- Ошибка: `reportError` + сохранение предыдущего списка.

## Ограничения

- Список строится из метаданных, которые уже есть на устройстве (история/секции/поиск/текущий плейлист) плюс персистентный реестр офлайн-проповедей. Реестр закрывает случай «осиротевшего» файла кэша: проповедь, скачанная при работающем реестре, остаётся в списке даже после очистки кэша секций и истории. Проповеди, скачанные до появления реестра, попадают в него одноразовым бэкфиллом при первом старте новой версии.
- На web список строится так же (реестр + `isCached` через `hasCompleteAudio` по commit-манифесту); повреждённый бакет (WebKit recovery `caches.delete`) может временно скрыть проповедь до перекачки — см. [features/audio-cache.md](../features/audio-cache.md) → «Известное ограничение (web)».

## Связанные документы

- [features/navigation.md](../features/navigation.md)
- [features/audio-cache.md](../features/audio-cache.md)
- [features/listening-history.md](../features/listening-history.md)
- [screens/more.md](./more.md)
