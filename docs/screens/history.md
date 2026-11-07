# Экран «История прослушивания»

**Маршрут:** `/history` (вне таб-группы, Stack.Screen)
**Файлы:** `app/history.tsx` (реэкспорт) → `src/pages/history/ui/HistoryScreen.tsx`, `src/pages/history/ui/HistoryRow.tsx`, `src/pages/history/ui/HistoryHeaderMenu.tsx`, `src/pages/history/ui/HistoryHeaderMenuDropdown.tsx`, `src/pages/history/lib/resolveEntryFallbackPlaylist.ts`
**Статус:** готов

## Что делает

Показывает историю прослушивания проповедей — список записей, отсортированных по убыванию `lastPlayedAt`. Позволяет возобновить воспроизведение с места остановки или удалить записи из истории.

## Что показывается

- `FlatList` записей истории; каждая строка — `HistoryRow` (`src/pages/history/ui/HistoryRow.tsx`), рендерящий `TracksListItem` (`entities/track-list`):
  - заголовок — название проповеди;
  - сабтайтл — `formatRelativeDate(lastPlayedAt)` (относительная дата прослушивания);
  - обложка — через `CoverImage` с фолбэком `IMAGE_PLACEHOLDER`;
  - тонкая полоса прогресса прослушивания (сохранённая позиция, stored); для завершённых записей — полный прогресс-бар (`storedProgress = 1`);
  - завершённые записи затемняются (`TracksListItemContent`: обложка opacity 0.5 + приглушённый заголовок, см. [features/listening-history.md](../features/listening-history.md) → «Затемнение завершённых»);
  - сердечко «в избранном» слева от «⋯» (`FavoriteSermonButton`; `HistoryRow` передаёт снапшот `sermon`) — клик сразу добавляет/убирает проповедь в «Избранных» без модалки (см. [features/my-playlists.md](../features/my-playlists.md) → «Точки переключения избранного»);
  - полоса обновляется **только по событиям** (старт, пауза/flush, переключение, завершение, удаление) — без live-тикания в реальном времени (live-чтение убрано);
  - `HistoryRow` презентационный: `onPress(entry)` приходит пропом с экрана, строка ничего не резолвит и не воспроизводит сама.
- Тап по строке — выбор контекста воспроизведения через `usePlaybackChoice` (`src/features/playback-choice/`, см. [features/playback-choice.md](../features/playback-choice.md)): если плейлист, где есть проповедь, ровно один (исходный плейлист записи, локальные плейлисты из «Моих»; офлайн-пункта в истории нет), проповедь играет сразу без диалога. Полный плейлист резолвится **до** `openChoice` (`resolveEntryFallbackPlaylist`: live `dynamicSectionsAtom` → sections-cache → снапшот), поэтому мгновенный путь «ровно один кандидат» играет полный плейлист, а не однотрековый снапшот записи. При 2+ плейлистах открывается диалог «Где воспроизвести проповедь?» с реальными плейлистами, где есть эта проповедь (исходный плейлист записи первым, локальные плейлисты из «Моих»). Плейлист записи подсвечивается и получает подпись «Плейлист, в котором было прослушано» (`originLabel`). Офлайн-пункта нет, «история как плейлист» не предлагается. Выбор играет проповедь в выбранном плейлисте с места остановки; завершённая запись начинается заново. Очередь строится из выбранного плейлиста: локальный плейлист и разрешённый полный плейлист записи дают полную очередь с авто-переходом; однотрековая очередь возможна только из снапшота записи (контекстный плейлист из одного трека — [`buildContextPlaylist`](../features/listening-history.md)), то есть когда полный плейлист не нашёлся и снапшот сыграл последним резервом. **Кандидатов нет** → фолбэк резолвит полный плейлист записи по секциям: live `dynamicSectionsAtom` → sections-cache → снапшот записи (`resolveEntryFallbackPlaylist`, `src/pages/history/lib/`). Если полный плейлист найден, очередь и авто-переход сохраняются; снапшот — последний резерв. Ошибка запуска — try/catch → `reportError` («Не удалось воспроизвести проповедь из истории»).
- Контекстное меню (три точки / long-press — с тактильным откликом на долгое нажатие) — пункты из `buildHistoryMenuActions` (`entities/listening-history`): **«Добавить в плейлист»** (иконка `add-circle`, первым — открывает модалку мультивыбора, см. [features/add-to-playlist.md](../features/add-to-playlist.md); модалка одна на экран через `useAddToPlaylistModal`), **«Пометить прослушанной»** (только для незавершённых, `!isEntryCompleted`) и **«Удалить из истории»** (всегда, `inHistory: true`).
- Шапка (header): иконка меню (три точки) → `HistoryHeaderMenu` (`src/pages/history/ui/HistoryHeaderMenu.tsx`) → пункт «Очистить историю» → `ConfirmDialog`:
  - заголовок: «Очистить историю?»;
  - описание: «Вся история прослушивания будет удалена. Прогресс прослушивания проповедей сбросится.».
- Пустое состояние: «История пуста».
- Кнопка «?» в шапке (`OnboardingHelpRow`, слева от меню истории) — онбординг/обзор возможностей (см. [../features/onboarding.md](../features/onboarding.md)).

## Откуда данные

- Атомы и действия из `entities/listening-history` (см. [features/listening-history.md](../features/listening-history.md)).
- Прогресс строк — inline-вывод из записи (`completed ? 1 : min(positionMs/durationMs, 1)` в `HistoryRow`); live-чтения нет (`useLiveSermonProgress`/`useSermonProgress` удалены).

## Куда можно перейти

- Тап на запись → выбор контекста воспроизведения (`usePlaybackChoice`, см. «Что показывается»). В `HistoryScreen` (а не в строке) живут состояние диалога и обработчик: `handlePress(entry)` берёт `getEntrySermon(entry)`, **сначала** резолвит полный плейлист записи (`resolveEntryFallbackPlaylist(sermon, entry.playlist)` → `resolvePlaylistBySermon`: live `dynamicSectionsAtom` → sections-cache → снапшот) и вызывает `openChoice(sermon, resolved ?? entry.playlist)`. Поэтому единственный кандидат играет сразу полным плейлистом, без диалога (очередь доигрывает дальше); при 2+ кандидатах открывается диалог, а снапшот записи остаётся последним резервом, если плейлист не нашёлся.

## Состояния

- Загрузка: пока `isHistoryLoadedAtom` (`entities/listening-history`) ещё `false` и история пуста — скелетоны `TracksListSkeleton` (`entities/track-list`, 6 строк с разделителями); скелетон повторяет форму элемента списка (та же карточка-строка с обложкой и двумя полосами текста, с теми же отступами), поэтому при загрузке ничего не сдвигается; после загрузки из AsyncStorage атом становится `true`.
- Пусто: «История пуста».
- Очистка: подтверждение через `ConfirmDialog`.

## Связанные документы

- [features/navigation.md](../features/navigation.md)
- [features/playback-choice.md](../features/playback-choice.md)
- [features/player.md](../features/player.md)
