# История прослушивания

**Слой:** `entities/listening-history`
**Статус:** готов

## Назначение

Локальная история прослушивания проповедей с отслеживанием per-sermon прогресса. Данные хранятся только на устройстве (AsyncStorage), синхронизация с сервером не предусмотрена.

## Структура слайса

```
src/entities/listening-history/
├── index.ts                  # Публичный API
├── @x/
│   └── player.ts             # @x-точка для entities/player: узкий API-контракт (см. «@x cross-import»)
├── model/
│   ├── types.ts              # Zod-схемы: listeningHistoryEntrySchema, listeningHistorySchema; типы ListeningHistoryEntry, ListeningHistory (sermon опционален)
│   └── history.ts            # Атомы и экшены: historyAtom, loadHistoryAction, recordPlaybackStartAction, flushHistoryProgressAction, markHistoryCompletedAction, removeHistoryEntryAction, clearHistoryAction
└── lib/
    ├── constants.ts          # COMPLETION_REMAINING_MS (10 000), MAX_HISTORY_ENTRIES (100)
    ├── historyStorage.ts     # readHistory / writeHistory (обёртки над getCachedJson/setCachedJson + очередь записей)
    ├── liveProgressStorage.ts    # Мини-снапшот LISTENING_PROGRESS_SNAPSHOT: liveProgressSnapshotSchema (Zod) + write/read/clear
    ├── buildHistoryEntry.ts  # Фабрика новой записи: санитизация sermon (убирает playlists), снапшот context-playlist
    ├── isEntryCompleted.ts   # Правило завершённости (см. ниже)
    ├── getResumePosition.ts  # Вычисление позиции resume для usePlayNewSermon
    ├── getEntrySermon.ts     # getEntrySermon(entry): sermon из entry.sermon ?? entry.playlist.sermons[0]
    ├── sortAndCapEntries.ts  # Дедупликация по sermon.id + сортировка по lastPlayedAt desc + обрезка до MAX_HISTORY_ENTRIES
    ├── flushHistoryProgress.ts   # flushHistoryProgressAction — flush при паузе (read-modify-write одного поля)
    ├── recordSermonSwitch.ts     # recordSermonSwitchAction — flush старого + запись нового за один проход (markOldCompleted)
    ├── reconcileOnHydration.ts   # Слияние мини-снапшота в каталог при гидрации
    └── useHistoryProgressMap.ts  # Map<sermonId, 0..1> — stored-прогресс из historyAtom для списков
```

> **Удалено** (в рамках перф-работы): live-чтение прогресса — хуки `useLiveSermonProgress`, `useSermonProgress` и `getLiveProgressAtom`. Прогресс в UI теперь только stored (обновляется по событиям, см. «Прогресс в UI»).

### Публичный API (barrel)

```typescript
// entities/listening-history
export { flushHistoryProgressAction }
export { getEntrySermon }
export { getResumePosition }
export { writeLiveProgressSnapshot }
export { recordSermonSwitchAction }
export { useHistoryProgressMap }
export {
  clearHistoryAction,
  historyAtom,
  loadHistoryAction,
  markHistoryCompletedAction,
  recordPlaybackStartAction,
  removeHistoryEntryAction,
  updateHistoryProgressAction,
}
export type { ListeningHistory, ListeningHistoryEntry }
```

### @x cross-import (entities/player)

Для импорта из `entities/player` используется **@x-точка** `entities/listening-history/@x/player`. Все файлы в `entities/player`, которым нужны символы из `listening-history`, импортируют именно оттуда, а не из основного barrel:

```typescript
// entities/player/lib/usePlaySermon.ts
import {
  getEntrySermon,
  getResumePosition,
  recordPlaybackStartAction,
  recordSermonSwitchAction,
  type ListeningHistory,
} from 'entities/listening-history/@x/player'
```

@x-файл реэкспортирует только символы, нужные `entities/player`:

```typescript
// entities/listening-history/@x/player.ts
export { flushHistoryProgressAction } from '../lib/flushHistoryProgress'
export { getEntrySermon } from '../lib/getEntrySermon'
export { getResumePosition } from '../lib/getResumePosition'
export { writeLiveProgressSnapshot } from '../lib/liveProgressStorage'
export { recordSermonSwitchAction } from '../lib/recordSermonSwitch'
export {
  historyAtom,
  markHistoryCompletedAction,
  recordPlaybackStartAction,
} from '../model/history'
export { type ListeningHistory } from '../model/types'
```

**Почему @x, а не основной barrel:** Паттерн `@x` (см. [`architecture.md`](../architecture.md)) — FSD-практикa для кросс-слойных импортов: @x-сегменты предоставляют узкий, целевой API для конкретного потребителя, предотвращая случайную связанность с полным публичным API слайса. Это особенно важно, когда `entities/player` и `entities/listening-history` — оба слоя `entities/`, а FSD не разрешает импорты между слоями `entities` напрямую через основной barrel.

## Типы данных

Запись истории — `ListeningHistoryEntry`:

```typescript
{
  playlist: PlaylistData // контекстный плейлист; sermon — в playlist.sermons[0]
  positionMs: number // текущая позиция воспроизведения
  durationMs: number // длительность трека
  lastPlayedAt: number // timestamp последнего воспроизведения (Date.now())
}
```

Записи **slim**: top-level поля `sermon` нет — снапшот проповеди живёт в `playlist.sermons[0]` (buildHistoryEntry кладёт санитизированную копию без `playlists`). Доступ к проповеди — через `getEntrySermon(entry)` (`entry.sermon ?? toAudioPlayerData(entry.playlist.sermons[0])`, где `toAudioPlayerData` — `entities/player`; возвращает `null`, если у проповеди нет `audioUrl`). В `types.ts` поле `sermon` оставлено опциональным для совместимости чтения старых записей (легаси-формат с top-level sermon).

> ✅ **Issue #45 (Phase 1, safety nets): `getEntrySermon` возвращает `AudioPlayerData | null`.**
>
> Если `entry.sermon` равен `undefined` **и** `entry.playlist.sermons` — пустой массив (валидно по zod-схеме), функция возвращает `null` вместо краша. Все вызывающие места обрабатывают `null`:
> - предикаты поиска (`findIndex`/`find`/`filter`) — через optional chaining (`getEntrySermon(e)?.id`);
> - `useHistoryProgressMap`, `sortAndCapEntries` — записи без проповеди пропускаются (`continue`);
> - `HistoryRow` — не рендерится (`return null` после хуков);
> - `resolveEntryPlaylist` — fallback на snapshot-плейлист записи;
> - `HistoryScreen.keyExtractor` — fallback на `${lastPlayedAt}`.

Массив `ListeningHistoryEntry[]` хранится в AsyncStorage под ключом `listeningHistory` (константа `LISTENING_HISTORY` — `src/shared/config/history-storage-keys.ts`). Валидация при чтении — Zod `listeningHistorySchema`; невалидные данные сбрасываются в пустой массив.

Отдельно от каталога живёт **мини-снапшот** текущего прогресса под ключом `listeningProgressSnapshot` (константа `LISTENING_PROGRESS_SNAPSHOT` — там же): сырой JSON `{ sermonId, positionMs, durationMs }` (~60 байт). Валидация при чтении — Zod-схема `liveProgressSnapshotSchema` (`liveProgressStorage.ts`) с `safeParse`; невалидные данные возвращают `undefined`. Тип `LiveProgressSnapshot` выводится из схемы через `z.infer`. Пишется каждые 5с **только при воспроизведении** и мержится в каталог при гидрации (`reconcileOnHydration`), см. «Запись прогресса».

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

### Модель: события + мини-ключ

Каталог `listeningHistory` пишется **только по событиям**, 5с-тики в него больше не пишут:

| Событие               | Где                                                                                                      | Что происходит                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Старт воспроизведения | `usePlayNewSermon` → `recordPlaybackStartAction`                                                         | новая запись (позиция 0) / перемещение существующей в начало / сброс завершённой                                                                 |
| Пауза                 | `PlaybackController.pause`, `WebPlayerService.pause` → `flushHistoryProgressAction`                      | read-modify-write позиции (no-op при `positionMs ≤ 0` или не-прогрессе)                                                                          |
| Переключение трека    | `recordSermonSwitchAction` — из `usePlayNewSermon` (ручной тап) и `playTrackWithMetadata` (авто-переход) | за один проход: flush позиции старого трека + запись/обновление нового; `markOldCompleted: true` на авто-переходе (позиция старого = durationMs) |
| Окончание трека       | `handleTrackEnd` → `markHistoryCompletedAction`                                                          | `positionMs = durationMs` (ветка pause-on-last-track)                                                                                            |
| Удаление / очистка    | `removeHistoryEntryAction`, `clearHistoryAction`                                                         | per-item / полная очистка                                                                                                                        |

> **Важно:** Позиция **всегда** записывается как есть, даже если пользователь перемотал назад. Ранее система сохраняла только монотонно-нарастающий прогресс (при перемотке назад сохранялась более высокая позиция). Сейчас `recordSermonSwitch`, `flushHistoryProgress` и `reconcileOnHydration` пишут фактическую текущую позицию — при перемотке назад и переключении трека сохраняется позиция, на которой пользователь реально остановился. Это касается всех трёх модулей записи прогресса.

`lastPlayedAt` обновляется только при старте воспроизведения (`recordPlaybackStartAction`), не при flush.

5с-тик `usePlaybackProgressSaver` (`src/entities/player/lib/usePlaybackProgressSaver.ts`) при воспроизведении пишет **только мини-снапшот** `listeningProgressSnapshot` через `writeLiveProgressSnapshot` (сырой JSON ~60 байт) — каталог не трогает. Есть защита **skip-first-tick-после-переключения**: первый тик после смены `currentAudio` пропускается (рефы `previousAudioIdRef` / `skipNextTickRef`), чтобы не записать «мусорную» позицию перехода.

При гидрации `loadHistoryAction` вызывает `reconcileOnHydration` (`src/entities/listening-history/lib/reconcileOnHydration.ts`):

1. читает каталог + снапшот;
2. снапшот без совпадающей записи (или запись завершена) → дропается, каталог не меняется;
3. иначе — мержит в запись: `positionMs = snapshot.positionMs`, `durationMs = max(entry, snapshot)`, пишет каталог и чистит снапшот.

### Завершение трека

`handleTrackEnd` в `TrackAutoAdvanceService` вызывает `markHistoryCompletedAction(ctx, sermonId)` **до** ветвления путей (repeat/next/pause). Это гарантирует, что позиция `positionMs = durationMs` записывается в историю при каждом окончании трека, даже если далее произойдёт повтор или переход.

## Прогресс в UI

### Хранение и вычисление

- **Stored** — `useHistoryProgressMap()` возвращает `Map<string, number>` (0..1), вычисляемую из `historyAtom` (`getEntrySermon(entry).id` + `isEntryCompleted`). Используется в списках как единственный источник прогресса.
- **Live-чтения нет.** Хуки `useLiveSermonProgress` / `useSermonProgress` и атом `getLiveProgressAtom` удалены: строки списков не подписаны на `positionAtom`/`durationAtom`, поэтому не ре-рендерятся 2 раза в секунду во время воспроизведения. Значение строки обновляется **только по событиям** (старт, пауза/flush, переключение, завершение, удаление) — когда `historyAtom` меняется целиком.

### Отображение

Тонкая полоса прогресса (2px, `ProgressBar` — `src/shared/ui/progress-bar/ProgressBar.tsx`) отображается в:

| Место                          | Файл                                                                        | Как                                          |
| ------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------- |
| Список плейлиста               | `src/pages/playlist/ui/PlaylistTrackItem.tsx`                               | `useHistoryProgressMap()` + `getEntrySermon` |
| Шторка очереди (мини-плейлист) | `src/widgets/expandable-player/ui/PlaylistBottomSheet/PlaylistSheetRow.tsx` | `useHistoryProgressMap()`                    |
| Результаты поиска              | `src/features/sermon-search/ui/SermonSearchRow.tsx`                         | `useHistoryProgressMap()`                    |
| Экран истории                  | `src/pages/history/ui/HistoryRow.tsx`                                       | `useHistoryProgressMap()`                    |

Все строки показывают только **сохранённый** прогресс (stored, событийно обновляемый). Полоса текущей (сейчас воспроизводимой) проповеди не «тикает» в реальном времени — она обновится на ближайшем событии (пауза, переключение и т.д.).

## Экран истории

Маршрут `/history` (вне таб-группы). Подробнее — [docs/screens/history.md](../screens/history.md).

## Допущения

- **audioUrl долгоживущие**: stream-url эндпоинт не используется, `AudioPlayerData.audioUrl` стабильны → снапшоты в истории валидны на протяжении жизни записи.
- **Нет синхронизации**: история локальная; при переустановке или смене устройства данные теряются.
- **Плейлист — снапшот**: контекстный `playlist` в записи содержит только текущую проповедь (`sermons: [sanitizedSermon]`), не весь плейлист.

## Тесты

| Сьют                    | Файл                                | Что проверяет                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `history model`         | `model/history.test.ts`             | `loadHistoryAction` (загрузка из storage; reconcile со снапшотом; дроп осиротевшего снапшота), `recordPlaybackStartAction` (новая запись, сброс завершённой, перемещение незавершённой, merge-ветка со strip `playlists`), `flushHistoryProgressAction` (alias `updateHistoryProgressAction`: no-op для неизвестного id, обновление позиции/длительности без изменения `lastPlayedAt`, персист), `markHistoryCompletedAction` (positionMs = durationMs, no-op для нет/0), `removeHistoryEntryAction` (удаление по id), `clearHistoryAction` (очистка) |
| `isEntryCompleted`      | `lib/isEntryCompleted.test.ts`      | Границы: 100с осталось (false), 10с осталось (true), 5с осталось (true), position = duration (true), duration < 10с (false), duration = 0 (false), position = 0 (false)                                                                                                                                                                                                                                                                                                                                                                               |
| `buildHistoryEntry`     | `lib/buildHistoryEntry.test.ts`     | Фабрика записи: sanitizer убирает `playlists`, контекстный плейлист содержит один sermon, начальные позиции 0, top-level `sermon` отсутствует                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sortAndCapEntries`     | `lib/sortAndCapEntries.test.ts`     | Дедупликация по sermon.id (остаётся самая свежая), сортировка по lastPlayedAt desc, обрезка до MAX_HISTORY_ENTRIES                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `getResumePosition`     | `lib/getResumePosition.test.ts`     | Нет записи → 0, завершённая → 0, position ≤ 0 → 0, иначе positionMs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `liveProgressStorage`   | `lib/liveProgressStorage.test.ts`   | Запись/чтение валидного снапшота; невалидный JSON/отсутствие/поля с отрицательными значениями → undefined                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `useHistoryProgressMap` | `lib/useHistoryProgressMap.test.ts` | Пустой history → пустая Map, completed → 1, partial → position/duration, position ≤ 0 → пропуск                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Связанные документы

- [player.md](./player.md) — плеер, usePlayNewSermon, персист позиции, TrackAutoAdvanceService
- [../screens/history.md](../screens/history.md) — экран истории
- [../contracts/storage.md](../contracts/storage.md) — ключ `listeningHistory` в AsyncStorage
