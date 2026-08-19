# Экран «История прослушивания»

**Маршрут:** `/history` (вне таб-группы, Stack.Screen)
**Файлы:** `app/history.tsx` (реэкспорт) → `src/pages/history/ui/HistoryScreen.tsx`, `src/pages/history/ui/HistoryRow.tsx`, `src/pages/history/ui/HistoryHeaderMenu.tsx`
**Статус:** готов

## Что делает

Показывает историю прослушивания проповедей — список записей, отсортированных по убыванию `lastPlayedAt`. Позволяет возобновить воспроизведение с места остановки или удалить записи из истории.

## Что показывается

- `FlatList` записей истории; каждая строка — `HistoryRow` (`src/pages/history/ui/HistoryRow.tsx`), рендерящий `TracksListItem` (`shared/ui/track-list`):
  - заголовок — название проповеди;
  - сабтайтл — `formatRelativeDate(lastPlayedAt)` (относительная дата прослушивания);
  - обложка — через `CoverImage` с фолбэком `IMAGE_PLACEHOLDER`;
  - тонкая полоса прогресса прослушивания (сохранённая позиция, stored);
  - полоса обновляется **только по событиям** (старт, пауза/flush, переключение, завершение, удаление) — без live-тикания в реальном времени (live-чтение убрано).
- Тап по строке — воспроизведение проповеди с места остановки. Если проповедь помечена как `completed` — воспроизведение начинается заново.
- Контекстное меню (три точки / long-press) → пункт «Удалить из истории».
- Шапка (header): иконка меню (три точки) → `HistoryHeaderMenu` (`src/pages/history/ui/HistoryHeaderMenu.tsx`) → пункт «Очистить историю» → `ConfirmDialog`:
  - заголовок: «Очистить историю?»;
  - описание: «Вся история прослушивания будет удалена. Прогресс прослушивания проповедей сбросится.».
- Пустое состояние: «История пуста».

## Откуда данные

- Атомы и действия из `entities/listening-history` (см. [features/listening-history.md](../features/listening-history.md)).
- Прогресс строк — `useHistoryProgressMap()` (stored-прогресс из `historyAtom`); live-чтения нет (`useLiveSermonProgress`/`useSermonProgress` удалены).

## Куда можно перейти

- Тап на запись → воспроизведение проповеди с места остановки (без перехода на другой экран).

## Состояния

- Пусто: «История пуста».
- Очистка: подтверждение через `ConfirmDialog`.

## Связанные документы

- [features/navigation.md](../features/navigation.md)
- [features/player.md](../features/player.md)
