# Экран «История прослушивания»

**Маршрут:** `/history` (вне таб-группы, Stack.Screen)
**Файлы:** `app/history.tsx` (реэкспорт) → `src/pages/history/ui/HistoryScreen.tsx`, `src/pages/history/ui/HistoryRow.tsx`, `src/pages/history/ui/HistoryHeaderMenu.tsx`, `src/pages/history/ui/HistoryHeaderMenuDropdown.tsx`
**Статус:** готов

## Что делает

Показывает историю прослушивания проповедей — список записей, отсортированных по убыванию `lastPlayedAt`. Позволяет возобновить воспроизведение с места остановки или удалить записи из истории.

## Что показывается

- `FlatList` записей истории; каждая строка — `HistoryRow` (`src/pages/history/ui/HistoryRow.tsx`), рендерящий `TracksListItem` (`shared/ui/track-list`):
  - заголовок — название проповеди;
  - сабтайтл — `formatRelativeDate(lastPlayedAt)` (относительная дата прослушивания);
  - обложка — через `CoverImage` с фолбэком `IMAGE_PLACEHOLDER`;
  - тонкая полоса прогресса прослушивания (сохранённая позиция, stored); для завершённых записей — полный прогресс-бар (`storedProgress = 1`);
  - завершённые записи затемняются (`TracksListItemContent`: обложка opacity 0.5 + приглушённый заголовок, см. [features/listening-history.md](../features/listening-history.md) → «Затемнение завершённых»);
  - полоса обновляется **только по событиям** (старт, пауза/flush, переключение, завершение, удаление) — без live-тикания в реальном времени (live-чтение убрано).
- Тап по строке — воспроизведение проповеди в исходном плейлисте (полная очередь + авто-переход) с места остановки. Если проповедь помечена как `completed` — воспроизведение начинается заново. Флоу идёт через общий хук `useEntryPlayback` (`src/features/entry-playback/`): оборачивает воспроизведение в try/catch и показывает ошибку через `reportError` («Не удалось воспроизвести проповедь из истории»).
- Контекстное меню (три точки / long-press) — пункты из `buildHistoryMenuActions` (`entities/listening-history`): **«Пометить прослушанной»** (только для незавершённых, `!isEntryCompleted`) и **«Удалить из истории»** (всегда, `inHistory: true`).
- Шапка (header): иконка меню (три точки) → `HistoryHeaderMenu` (`src/pages/history/ui/HistoryHeaderMenu.tsx`) → пункт «Очистить историю» → `ConfirmDialog`:
  - заголовок: «Очистить историю?»;
  - описание: «Вся история прослушивания будет удалена. Прогресс прослушивания проповедей сбросится.».
- Пустое состояние: «История пуста».

## Откуда данные

- Атомы и действия из `entities/listening-history` (см. [features/listening-history.md](../features/listening-history.md)).
- Прогресс строк — inline-вывод из записи (`completed ? 1 : min(positionMs/durationMs, 1)` в `HistoryRow`); live-чтения нет (`useLiveSermonProgress`/`useSermonProgress` удалены).

## Куда можно перейти

- Тап на запись → воспроизведение проповеди в **исходном плейлисте** (полная очередь + авто-переход). Флоу идёт через общий хук `useEntryPlayback` (`src/features/entry-playback/`): guard `getEntrySermon(entry)` → `resolveEntryPlaylist(entry)` → `playNewSermon({ playlist, sermon })`, всё в try/catch → `reportError(error, errorMessage)` («Не удалось воспроизвести проповедь из истории»). Внутри хука `resolveEntryPlaylist` (`src/entities/listening-history/lib/resolveEntryPlaylist.ts`) по-прежнему резолвит полный `PlaylistData`: ищет в `dynamicSectionsAtom` (live), затем в `sections-cache`, фолбэк — снапшот `entry.playlist`.

## Состояния

- Пусто: «История пуста».
- Очистка: подтверждение через `ConfirmDialog`.

## Связанные документы

- [features/navigation.md](../features/navigation.md)
- [features/player.md](../features/player.md)
