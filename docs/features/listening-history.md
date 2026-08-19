# История прослушивания

**Слой:** `entities/listening-history`
**Статус:** готов

## Назначение

Локальная история прослушивания проповедей с отслеживанием per-sermon прогресса. Данные хранятся только на устройстве (AsyncStorage), синхронизация с сервером не предусмотрена.

## Структура слайса

```
src/entities/listening-history/
├── index.ts                  # Публичный API
├── model/
│   ├── types.ts              # Zod-схемы: listeningHistoryEntrySchema, listeningHistorySchema; типы ListeningHistoryEntry, ListeningHistory
│   └── history.ts            # Атомы и экшены: historyAtom, loadHistoryAction, recordPlaybackStartAction, updateHistoryProgressAction, markHistoryCompletedAction, removeHistoryEntryAction, clearHistoryAction
└── lib/
    ├── constants.ts          # COMPLETION_REMAINING_MS (10 000), MAX_HISTORY_ENTRIES (100)
    ├── historyStorage.ts     # readHistory / writeHistory (обёртки над getCachedJson/setCachedJson + очередь записей)
    ├── buildHistoryEntry.ts  # Фабрика новой записи: санитизация sermon (убирает playlists), снапшот context-playlist
    ├── isEntryCompleted.ts   # Правило завершённости (см. ниже)
    ├── getResumePosition.ts  # Вычисление позиции resume для usePlayNewSermon
    ├── sortAndCapEntries.ts  # Дедупликация по sermon.id + сортировка по lastPlayedAt desc + обрезка до MAX_HISTORY_ENTRIES
    ├── useHistoryProgressMap.ts   # Map<sermonId, 0..1> — прогресс из historyAtom для списков
    ├── useLiveSermonProgress.ts   # Per-id производный атом getLiveProgressAtom: live-позиция текущей проповеди
    └── useSermonProgress.ts       # Объединение live и stored: useSermonProgress(id, stored) = live ?? stored
```

### Публичный API (barrel)

```typescript
// entities/listening-history
export { getResumePosition }
export { useHistoryProgressMap, useLiveSermonProgress, useSermonProgress }
export { historyAtom, loadHistoryAction, recordPlaybackStartAction,
         updateHistoryProgressAction, markHistoryCompletedAction,
         removeHistoryEntryAction, clearHistoryAction }
export type { ListeningHistory, ListeningHistoryEntry }
```

## Типы данных

Запись истории — `ListeningHistoryEntry`:

```typescript
{
  sermon: AudioPlayerData   // снапшот проповеди (без playlists)
  playlist: PlaylistData    // контекстный плейлист (только sermons[0] текущей проповеди)
  positionMs: number        // текущая позиция воспроизведения
  durationMs: number        // длительность трека
  lastPlayedAt: number      // timestamp последнего воспроизведения (Date.now())
}
```

Массив `ListeningHistoryEntry[]` хранится в AsyncStorage под ключом `listeningHistory` (константа `LISTENING_HISTORY` — `src/shared/config/history-storage-keys.ts`). Валидация при чтении — Zod `listeningHistorySchema`; невалидные данные сбрасываются в пустой массив.

## Правило завершённости

Запись считается завершённой, если:

```
durationMs > 10 000  &&  positionMs >= durationMs − 10 000
```

То есть проповедь длиной более 10с считается дослушанной, если до конца осталось не более 10с. Проповеди короче 10с никогда не считаются завершёнными (даже при `positionMs === durationMs`). Это предотвращает ложные срабатывания на коротких треках.

При завершённой записи `getResumePosition` возвращает 0 (воспроизведение начнётся заново), а `recordPlaybackStartAction` создаёт новую запись вместо обновления существующей.

## Resume-логика

### Ручной тап (usePlayNewSermon)

При тапе на проповедь в `usePlayNewSermon` (`src/entities/player/lib/usePlaySermon.ts`):

1. `getResumePosition(history, sermonId)` определяет позицию resume:
   - Нет записи → 0
   - Запись завершена → 0
   - `positionMs ≤ 0` → 0
   - Иначе → `positionMs`
2. Если трек **другой** (`currentAudio?.id !== sermonId`) — `replaceAudio(url, resumeMs)`
3. Если трек **тот же** (same-id tolerance 1с):
   - `resumeMs === 0` → `seekTo(0)` (воспроизведение с начала)
   - `resumeMs > 0` и текущая позиция далеко от resume — `seekTo(resumeMs)`

### Авто-переход (TrackAutoAdvanceService)

Все пути авто-перехода (`playNextTrack`, `playFirstTrackInQueue`, `repeatCurrentTrack` в `src/entities/player/lib/PlayerService/TrackAutoAdvanceService/playback.ts`) используют `playTrackWithMetadata` с `initialPositionMs = 0`. Автоматический переход **всегда** начинает воспроизведение с 0, независимо от истории.

## Запись прогресса

Прогресс обновляется тремя путями:

| Путь | Где | Когда |
|------|-----|-------|
| `usePlaybackProgressSaver` | `src/entities/player/lib/usePlaybackProgressSaver.ts` | каждые 5с через `setInterval` + `CURRENT_SOUND_POSITION` в AsyncStorage |
| `PlaybackController.pause` | `src/entities/player/lib/PlayerService/PlaybackController.ts` | при паузе (нативный плеер) |
| `WebPlayerService.pause` | `src/entities/player/lib/PlayerService/index.web.ts` | при паузе (веб-плеер) |

Все три вызывают `updateHistoryProgressAction(ctx, { durationMs, positionMs, sermonId })`. При этом `lastPlayedAt` **не** обновляется — он устанавливается только при старте воспроизведения (`recordPlaybackStartAction`).

### Завершение трека

`handleTrackEnd` в `TrackAutoAdvanceService` вызывает `markHistoryCompletedAction(ctx, sermonId)` **до** ветвления путей (repeat/next/pause). Это гарантирует, что позиция `positionMs = durationMs` записывается в историю при каждом окончании трека, даже если далее произойдёт повтор или переход.

## Прогресс в UI

### Хранение и вычисление

- **Stored** — `useHistoryProgressMap()` возвращает `Map<string, number>` (0..1), вычисляемую из `historyAtom`. Используется в списках как исходное значение прогресса.
- **Live** — `getLiveProgressAtom(sermonId)` создаёт per-id производный атом, который вычисляет `position/duration` из `currentAudioAtom`/`positionAtom`/`durationAtom`. Возвращает `undefined` если текущая проповедь ≠ `sermonId`. Значение округляется до 2 знаков (квант 0.01) — consumers ре-рендерятся не более ~50 раз за полное прослушивание.
- **Объединение** — `useSermonProgress(id, stored)` = `live ?? stored`. Non-текущие строки не ре-рендерятся (Reatom dedup по reference equality `undefined === undefined`).

### Отображение

Тонкая полоса прогресса (2px, `ProgressBar` — `src/shared/ui/progress-bar/ProgressBar.tsx`) отображается в:

| Место | Файл | Как |
|-------|------|-----|
| Список плейлиста | `src/pages/playlist/ui/PlaylistTrackItem.tsx` | `useSermonProgress(id, storedProgress)` |
| Шторка очереди (мини-плейлист) | `src/widgets/expandable-player/ui/PlaylistBottomSheet/PlaylistSheetRow.tsx` | `useSermonProgress(id, storedProgress)` |
| Результаты поиска | `src/features/sermon-search/ui/SermonSearchRow.tsx` | `useSermonProgress(sermon.id, storedProgress)` |
| Экран истории | `src/pages/history/ui/HistoryRow.tsx` | `useSermonProgress(entry.sermon.id, storedProgress)` |

Для текущей (сейчас воспроизводимой) проповеди live-прогресс обновляется в реальном времени.

## Экран истории

Маршрут `/history` (вне таб-группы). Подробнее — [docs/screens/history.md](../screens/history.md).

## Допущения

- **audioUrl долгоживущие**: stream-url эндпоинт не используется, `AudioPlayerData.audioUrl` стабильны → снапшоты в истории валидны на протяжении жизни записи.
- **Нет синхронизации**: история локальная; при переустановке или смене устройства данные теряются.
- **Плейлист — снапшот**: контекстный `playlist` в записи содержит только текущую проповедь (`sermons: [sanitizedSermon]`), не весь плейлист.

## Тесты

| Сьют | Файл | Что проверяет |
|------|------|---------------|
| `history model` | `model/history.test.ts` | `loadHistoryAction` (загрузка из storage), `recordPlaybackStartAction` (новая запись, сброс завершённой, перемещение незавершённой), `updateHistoryProgressAction` (обновление позиции/длительности, no-op для неизвестного id), `markHistoryCompletedAction` (positionMs = durationMs, no-op для нет/0), `removeHistoryEntryAction` (удаление по id), `clearHistoryAction` (очистка) |
| `isEntryCompleted` | `lib/isEntryCompleted.test.ts` | Границы: 100с осталось (false), 10с осталось (true), 5с осталось (true), position = duration (true), duration < 10с (false), duration = 0 (false), position = 0 (false) |
| `buildHistoryEntry` | `lib/buildHistoryEntry.test.ts` | Фабрика записи: sanitizer убирает `playlists`, контекстный плейлист содержит один sermon, начальные позиции 0 |
| `sortAndCapEntries` | `lib/sortAndCapEntries.test.ts` | Дедупликация по sermon.id (остаётся самая свежая), сортировка по lastPlayedAt desc, обрезка до MAX_HISTORY_ENTRIES |
| `getResumePosition` | `lib/getResumePosition.test.ts` | Нет записи → 0, завершённая → 0, position ≤ 0 → 0, иначе positionMs |
| `useHistoryProgressMap` | `lib/useHistoryProgressMap.test.ts` | Пустой history → пустая Map, completed → 1, partial → position/duration, position ≤ 0 → пропуск |
| `useLiveSermonProgress` | `lib/useLiveSermonProgress.test.ts` | Текущий трек → live progress, другой трек → undefined, duration ≤ 0 → undefined |
| `useSermonProgress` | `lib/useSermonProgress.test.ts` | live undefined → stored, live определён → live (приоритет), stored = 0 → 0 сохраняется (nullish coalescing) |

## Связанные документы

- [player.md](./player.md) — плеер, usePlayNewSermon, персист позиции, TrackAutoAdvanceService
- [../screens/history.md](../screens/history.md) — экран истории
- [../contracts/storage.md](../contracts/storage.md) — ключ `listeningHistory` в AsyncStorage
