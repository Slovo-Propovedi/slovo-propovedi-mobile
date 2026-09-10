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
│   ├── historyAtom.ts        # Атомы historyAtom + isHistoryLoadedAtom (вынесены для разрыва цикла history ↔ commitHistory)
│   ├── commitHistory.ts      # Атомарный коммит истории: sync historyAtom до writeHistory (анти-гонка lost-update)
└── lib/
    ├── constants.ts          # COMPLETION_REMAINING_MS (10 000), MAX_HISTORY_ENTRIES (100), MANUAL_LISTENED_DURATION_MS (1)
    ├── historyStorage.ts     # readHistory / writeHistory (обёртки над getCachedJson/setCachedJson + очередь записей)
    ├── liveProgressStorage.ts    # Мини-снапшот LISTENING_PROGRESS_SNAPSHOT: liveProgressSnapshotSchema (Zod) + read/clear
    ├── buildHistoryEntry.ts  # Фабрика новой записи: санитизация sermon (убирает playlists), снапшот context-playlist; buildSanitizedSermon
    ├── buildManualPlaylist.ts # Синтетический slim-плейлист из одного sermon (fallback, когда нет контекстного плейлиста)
    ├── isEntryCompleted.ts   # Правило завершённости (см. ниже) — публичное
    ├── getResumePosition.ts  # Вычисление позиции resume для usePlayNewSermon
    ├── getEntrySermon.ts     # getEntrySermon(entry): sermon из entry.sermon ?? entry.playlist.sermons[0]
    ├── resolveEntryPlaylist.ts   # Резолв полного PlaylistData записи: live dynamicSectionsAtom (через @x entities/section/@x/listening-history) → sections-cache → снапшот entry.playlist
    ├── sortAndCapEntries.ts  # Дедупликация по sermon.id + сортировка по lastPlayedAt desc + обрезка до MAX_HISTORY_ENTRIES
    ├── upsertHistoryProgress.ts # Чистый upsert прогресса (create-or-update) для flushHistoryProgressAction — вынесен из lib/flushHistoryProgress.ts (лимит строк)
    ├── loadHistory.ts        # loadHistoryAction — гидрация каталога: reconcile со снапшотом, sortAndCapEntries, ставит isHistoryLoadedAtom (finally)
    ├── recordPlaybackStart.ts # recordPlaybackStartAction — старт воспроизведения: новая запись / перемещение в начало / сброс завершённой
    ├── markHistoryCompleted.ts # markHistoryCompletedAction — внутреннее завершение существующей записи (no-op без записи)
    ├── removeHistoryEntry.ts  # removeHistoryEntryAction — удаление записи по sermon.id
    ├── clearHistory.ts        # clearHistoryAction — полная очистка истории
    ├── flushHistoryProgress.ts # flushHistoryProgressAction — upsert реального прогресса (immediate/deferred, см. «Stale-flush protection»)
    ├── recordSermonSwitch.ts     # recordSermonSwitchAction — flush старого + запись нового за один проход (markOldCompleted)
    ├── reconcileOnHydration.ts   # Слияние мини-снапшота в каталог при гидрации
    ├── markSermonListened.ts     # markSermonListenedAction — ручная отметка «Пометить прослушанной» (upsert завершённой записи)
    ├── completeSermonInHistory.ts # Чистый per-sermon upsert завершённой записи — общий для markSermonListenedAction и markSermonsListenedAction
    ├── markSermonsListened.ts     # markSermonsListenedAction — массовая отметка «Пометить все прослушанными» (один read-transform-write)
    ├── removeSermonsFromHistory.ts # removeSermonsFromHistoryAction — массовое удаление проповедей из истории (один read-transform-write)
    ├── useHistoryProgressMap.ts  # Map<sermonId, 0..1> — stored-прогресс из historyAtom для списков
    ├── useHistorySermonIds.ts    # Set<sermonId> — надёжная проверка «проповедь есть в истории» для меню
    ├── buildHistoryMenuActions.ts # Фабрика пунктов меню строк списков («Пометить прослушанной» / «Удалить из истории»)
    └── useLastListeningEntry.ts  # Хук последней записи с проповедью: { isLoaded, entry, sermon } для кнопки «Продолжить»
```

> **Удалено** (в рамках перф-работы): live-чтение прогресса — хуки `useLiveSermonProgress`, `useSermonProgress` и `getLiveProgressAtom`. Прогресс в UI теперь только stored (обновляется по событиям, см. «Прогресс в UI»).

### Публичный API (barrel)

```typescript
// entities/listening-history
export { buildHistoryMenuActions }
export { getEntrySermon }
export { getResumePosition }
export { isEntryCompleted }
export { markSermonListenedAction }
export { markSermonsListenedAction }
export { resolveEntryPlaylist }
export { recordSermonSwitchAction }
export { removeSermonsFromHistoryAction }
export { useHistoryProgressMap }
export { useHistorySermonIds }
export { useLastListeningEntry }
export {
  clearHistoryAction,
  historyAtom,
  loadHistoryAction,
  markHistoryCompletedAction,
  recordPlaybackStartAction,
  removeHistoryEntryAction,
  flushHistoryProgressAction,
}
export type { ListeningHistory, ListeningHistoryEntry }
```

> `isHistoryLoadedAtom` — **внутренний** атом (не экспортируется из барреля): флаг того, что `loadHistoryAction` завершил чтение AsyncStorage (ставится `true` в `finally`, даже при ошибке чтения). Используется только внутри `useLastListeningEntry`, чтобы кнопка «Продолжить» не мигала disabled-состоянием на холодном старте.

### `useLastListeningEntry`

Хук для кнопки «Продолжить» на экране «Слушать» (`src/pages/listen/ui/ContinueListeningButton.tsx`). Читает `historyAtom` + `isHistoryLoadedAtom` и возвращает:

```typescript
{
  isLoaded: boolean,                    // false, пока история не загружена
  entry: ListeningHistoryEntry | null,  // первая НЕзавершённая запись с getEntrySermon(entry) !== null
  sermon: AudioPlayerData | null,       // getEntrySermon(entry) той же записи
}
```

- `isLoaded === false` → `entry`/`sermon` = `null` (кнопка не рендерится).
- Иначе — перебирает `historyAtom` (отсортирован по `lastPlayedAt` DESC) и возвращает первую запись, у которой `getEntrySermon(entry)` не `null` **и** `isEntryCompleted(entry)` ложно (записи без проповеди и завершённые записи пропускаются). `getEntrySermon` и `isEntryCompleted` вызываются **по одному разу** на запись.
- Нет подходящей записи → `{ isLoaded: true, entry: null, sermon: null }` (кнопка «Начать слушать», disabled).

Завершённые записи пропускаются намеренно: ручная отметка «Пометить прослушанной» устанавливает `lastPlayedAt = now` (запись всплывает в начало истории), но `isEntryCompleted` исключает её из «Продолжить» — resume с позиции 0 бессмыслен для завершённой проповеди. Натурально завершённые треки тоже пропускаются (нечего продолжать; повторное воспроизведение сбросит запись через `recordPlaybackStartAction`).

### Общий press-хук `useEntryPlayback`

Общий press-флоу «резолв плейлиста → воспроизведение» для записей истории вынесен в хук `useEntryPlayback` (`src/features/entry-playback/`, features-слой — чтобы не создать entities-цикл player ↔ listening-history). Используется `ContinueListeningButton` (экран «Слушать») и `HistoryRow` (экран истории). Флоу: guard `getEntrySermon(entry)` → `resolveEntryPlaylist` → `playNewSermon`, всё в try/catch → `reportError(error, errorMessage)`.

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
export { markHistoryCompletedAction } from '../lib/markHistoryCompleted'
export { recordPlaybackStartAction } from '../lib/recordPlaybackStart'
export { recordSermonSwitchAction } from '../lib/recordSermonSwitch'
export { historyAtom } from '../model/historyAtom'
export { type ListeningHistory } from '../model/types'
```

**Почему @x, а не основной barrel:** Паттерн `@x` (см. [`architecture.md`](../architecture.md)) — FSD-практикa для кросс-слойных импортов: @x-сегменты предоставляют узкий, целевой API для конкретного потребителя, предотвращая случайную связанность с полным публичным API слайса. Это особенно важно, когда `entities/player` и `entities/listening-history` — оба слоя `entities/`, а FSD не разрешает импорты между слоями `entities` напрямую через основной barrel.

**Импорт из `entities/section` (тоже через @x):** `resolveEntryPlaylist` читает live-секции через `dynamicSectionsAtom`, импортируя его из @x-точки `entities/section/@x/listening-history` (а не из основного barrel `entities/section`) — по тому же правилу @x для кросс-слойных импортов между сущностями одного уровня.

> Обратной зависимости у listening-history на player больше нет: контракт `AudioPlayerData` (`audioPlayerDataSchema`, тип, `toAudioPlayerData`) живёт в `shared/model/domain/audioPlayerData.ts` и импортируется из `shared/model`. Это устранило require-цикл `entities/player` ↔ `entities/listening-history` (бывшая запись в debt.md). Направление player → history через `@x/player` сохранено.

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

Записи **slim**: top-level поля `sermon` нет — снапшот проповеди живёт в `playlist.sermons[0]` (buildHistoryEntry кладёт санитизированную копию без `playlists`). Доступ к проповеди — через `getEntrySermon(entry)` (`entry.sermon ?? toAudioPlayerData(entry.playlist.sermons[0])`, где `toAudioPlayerData` — `shared/model`; возвращает `null`, если у проповеди нет `audioUrl`). В `types.ts` поле `sermon` оставлено опциональным для совместимости чтения старых записей (легаси-формат с top-level sermon).

> ✅ **Issue #45 (Phase 1, safety nets): `getEntrySermon` возвращает `AudioPlayerData | null`.**
>
> Если `entry.sermon` равен `undefined` **и** `entry.playlist.sermons` — пустой массив (валидно по zod-схеме), функция возвращает `null` вместо краша. Все вызывающие места обрабатывают `null`:
>
> - предикаты поиска (`findIndex`/`find`/`filter`) — через optional chaining (`getEntrySermon(e)?.id`);
> - `useHistoryProgressMap`, `sortAndCapEntries` — записи без проповеди пропускаются (`continue`);
> - `HistoryRow` — не рендерится (`return null` после хуков);
> - `resolveEntryPlaylist` — fallback на snapshot-плейлист записи;
> - `HistoryScreen.keyExtractor` — fallback на `${lastPlayedAt}`.

Массив `ListeningHistoryEntry[]` хранится в AsyncStorage под ключом `listeningHistory` (константа `LISTENING_HISTORY` — `src/shared/config/history-storage-keys.ts`). Валидация при чтении — Zod `listeningHistorySchema`; невалидные данные сбрасываются в пустой массив.

Отдельно от каталога живёт **мини-снапшот** текущего прогресса под ключом `listeningProgressSnapshot` (константа `LISTENING_PROGRESS_SNAPSHOT` — там же): сырой JSON `{ sermonId, positionMs, durationMs }` (~60 байт). Валидация при чтении — Zod-схема `liveProgressSnapshotSchema` (`liveProgressStorage.ts`) с `safeParse`; невалидные данные возвращают `undefined`. Тип `LiveProgressSnapshot` выводится из схемы через `z.infer`. **LEGACY:** больше не пишется при воспроизведении (писатель удалён); хранится только для одноразовой миграции старых on-disk снапшотов при гидрации (`reconcileOnHydration`), чистится при каждом **реальном** flush каталога (no-op flush — позиция/длительность не изменились — пропускает и запись, и очистку). См. «Запись прогресса» → «Мини-снапшот (LEGACY)».

## Правило завершённости

Запись считается завершённой, если:

```
durationMs <= 0            → никогда
durationMs <= 10 000       → positionMs >= durationMs
иначе                     → positionMs >= durationMs − 10 000
```

То есть проповедь длиной более 10с считается дослушанной, если до конца осталось не более 10с. Короткие треки (`durationMs ≤ 10 000`) завершаются, когда позиция достигает полной длительности (`positionMs >= durationMs`). Записи с `durationMs ≤ 0` никогда не считаются завершёнными.

При завершённой записи `getResumePosition` возвращает 0 (воспроизведение начнётся заново), а `recordPlaybackStartAction` создаёт новую запись вместо обновления существующей.

## Ручная отметка «Пометить прослушанной»

`markSermonListenedAction(ctx, sermon, playlist?)` (`src/entities/listening-history/lib/markSermonListened.ts`) — пользовательская отметка проповеди как прослушанной (пункт контекстного меню строк списков). Это **upsert** завершённой записи:

- **Записи нет** — создаётся синтетическая завершённая запись: `durationMs = positionMs = MANUAL_LISTENED_DURATION_MS` (1мс). Контекстный плейлист строится `buildManualPlaylist` (`lib/buildManualPlaylist.ts` — slim-плейлист из одного санитизированного sermon'а), если не передан реальный `playlist`.
- **Запись есть** — обновляется до завершённой: `durationMs = max(existing.durationMs, MANUAL_LISTENED_DURATION_MS)`, `positionMs = durationMs`.

Идемпотентна для уже завершённых записей (повторный вызов ничего не ломает). `lastPlayedAt` при обновлении существующей записи **не трогается** (не вызывает «всплытие» в начало; при отсутствии записи она попадает в начало сортировки по `lastPlayedAt` = now). После записи чистит мини-снапшот (`clearLiveProgressSnapshot`), сохраняя инвариант «снапшот не новее каталога».

**Отличие от `markHistoryCompletedAction`** (lib/markHistoryCompleted.ts): последний — внутренний для плеера и завершает **только существующую** запись реальной длительностью (no-op без записи). `markSermonListenedAction` — пользовательский upsert с синтетической длительностью.

**Почему `MANUAL_LISTENED_DURATION_MS = 1`:** 1мс удовлетворяет правилу завершённости коротких треков (`duration ≤ 10 000` → `position >= duration`), даёт `progress = 1` в `useHistoryProgressMap` (→ затемнение строки), `getResumePosition` возвращает 0 (завершённая → повторное воспроизведение с начала), а `recordPlaybackStartAction` при реальном воспроизведении пересоздаёт запись с настоящей длительностью.

## Массовые операции плейлиста

`markSermonsListenedAction(ctx, sermons, playlist)` (`src/entities/listening-history/lib/markSermonsListened.ts`) — массовая отметка проповедей плейлиста как прослушанных (пункт «Пометить все прослушанными» в меню шапки плейлиста). `removeSermonsFromHistoryAction(ctx, sermonIds)` (`src/entities/listening-history/lib/removeSermonsFromHistory.ts`) — массовое удаление проповедей из истории (пункт «Удалить проповеди из истории»).

Обе — **один read-transform-write**: читают `historyAtom` один раз, применяют per-sermon трансформацию, один финальный `sortAndCapEntries` (дедуп по sermon.id, сортировка по `lastPlayedAt` desc, обрезка до `MAX_HISTORY_ENTRIES`), один `commitHistory` (sync-установка атома + один `writeHistory`) и один `clearLiveProgressSnapshot`. Пустой массив → ранний выход без записи; `removeSermonsFromHistoryAction` дополнительно no-op, если ни один id не найден в истории.

Per-sermon семантика вынесена в чистый хелпер `completeSermonInHistory(entries, sermon, playlist, now)` (`src/entities/listening-history/lib/completeSermonInHistory.ts`): нет записи → синтетическая завершённая запись (как в `markSermonListenedAction`), есть → завершение in place с сохранением `lastPlayedAt` и позиции. `markSermonListenedAction` и `markSermonsListenedAction` используют один и тот же хелпер, поэтому семантика байт-в-байт идентична. Массовая отметка использует **один общий `now`** для всех новых записей — одна атомарная операция = один консистентный «момент» для всех новых записей и устойчивость к интерливингу на границе миллисекунд.

## Меню строк списков (контекстное меню)

Пункты, относящиеся к истории, для строк списков строятся через `buildHistoryMenuActions({ inHistory, isCompleted, playlist, sermon })` (`src/entities/listening-history/lib/buildHistoryMenuActions.ts`). Возвращает `MenuAction[]` (`shared/ui/track-list`), **аддитивно** по состоянию. Инвариант: `isCompleted` учитывается только при `inHistory === true` — состояние «прослушано, но не в истории» исключено по построению, поэтому строка без записи в истории всегда предлагает «Пометить прослушанной».

| Условие          | Пункт                       | Иконка          | Экшен                                                        |
| ---------------- | --------------------------- | --------------- | ------------------------------------------------------------ |
| `!(inHistory && isCompleted)` | «Пометить прослушанной»     | `checkmark-done`| `markSermonListenedAction(ctx, sermon, playlist)`            |
| `inHistory`      | «Удалить из истории»        | `trash-outline` | `removeHistoryEntryAction(ctx, sermon.id)`                   |

Используется всеми строками списков (плейлист, история, шторка очереди, поиск). Строки-потребители подставляют в `buildHistoryMenuActions` `isCompleted` через `useHistoryProgressMap` (`progressMap.get(id) === 1`) и `inHistory` через `useHistorySermonIds`.

`useHistorySermonIds()` (`src/entities/listening-history/lib/useHistorySermonIds.ts`) возвращает `Set<string>` id проповедей, присутствующих в истории. Это **надёжная** проверка «есть ли в истории»: в отличие от `useHistoryProgressMap` (которая пропускает записи с `position/duration ≤ 0`), каждая запись вносит свой sermon-id. Нужна для пункта «Удалить из истории» — он должен показываться и для записей с нулевым прогрессом.

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

### Кнопки Next/Prev (`usePlayerToggleTrack`)

При переключении через кнопки Next/Prev (`src/entities/player/ui/PlayerControls/usePlayerToggleTrack.ts`) позиция resume вычисляется из истории через `ctx.get(historyAtom)` + `getResumePosition(history, sermonId)`. Позиция старого трека flush'ится через `recordSermonSwitchAction({ markOldCompleted: false, ... })`.

### Очередь

Все пути очереди, вызывающие `replaceAudio(url)` (`playTrack`, `playNext`, `playPrevious`, `shufflePlaylist`), вычисляют `getResumePosition(history, targetSermonId)` и передают resumeMs в `replaceAudio`. (Модуль `useQueueManagement` удалён 2026-09-10 — мёртвый хук без потребителей.)

### Авто-переход (TrackAutoAdvanceService)

`playNextTrack` и `playFirstTrackInQueue` (`src/entities/player/lib/PlayerService/TrackAutoAdvanceService/playback.ts`) вычисляют resume через `ctx.get(historyAtom)` + `getResumePosition(history, nextTrackId)` и передают в `playTrackWithMetadata`. `repeatCurrentTrack` **всегда** передаёт 0 (режим повтора — воспроизведение с начала).

## Запись прогресса

### Модель: события + мини-ключ

Каталог `listeningHistory` пишется **по событиям** и **каждые 10с при воспроизведении** (тик `usePlaybackProgressSaver` → `flushHistoryProgressAction`):

| Событие               | Где                                                                                                      | Что происходит                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Старт воспроизведения | `usePlayNewSermon` → `recordPlaybackStartAction`                                                         | новая запись (позиция 0) / перемещение существующей в начало / сброс завершённой                                                                 |
| Пауза                 | `PlaybackController.pause`, `WebPlayerService.pause` → `flushHistoryProgressAction`                      | **upsert** позиции (создаёт запись при отсутствии; no-op при `positionMs ≤ 0` или не-прогрессе)                                                                          |
| Seek                  | `PlaybackController.seekTo` → `flushHistoryProgressAction`                                               | trailing-дебаунс 400мс (**deferred**-флаш): позиция истории обновляется после seek (в т.ч. на паузе); серия seek (long-press, тик 200мс) коалесится в один финальный write |
| Переключение трека    | `recordSermonSwitchAction` — из `usePlayNewSermon` (ручной тап), `usePlayerToggleTrack` (кнопки Next/Prev) и `playTrackWithMetadata` (авто-переход) | за один проход: flush позиции старого трека + запись/обновление нового; `markOldCompleted: true` на авто-переходе (позиция старого = живая длительность `oldDurationMs`), `false` на тапе и кнопках. **Zero-duration guard:** при `markOldCompleted: true`, но неизвестной длительности (`oldDurationMs = 0` и `entry.durationMs = 0`) позиция **не** обнуляется — сохраняется `oldPositionMs` (не фабрикуем завершение без знания длительности) |
| Окончание трека       | `handleTrackEnd` → `markHistoryCompletedAction`                                                          | `positionMs = durationMs` (ветка pause-on-last-track); длительность берётся из атома (`durationMs`-параметр), чтобы завершить запись даже при `durationMs: 0` в каталоге |
| Удаление / очистка    | `removeHistoryEntryAction`, `clearHistoryAction`                                                         | per-item / полная очистка                                                                                                                        |

> **Важно:** Позиция **всегда** записывается как есть, даже если пользователь перемотал назад. Ранее система сохраняла только монотонно-нарастающий прогресс (при перемотке назад сохранялась более высокая позиция). Сейчас `recordSermonSwitch`, `flushHistoryProgress` и `reconcileOnHydration` пишут фактическую текущую позицию — при перемотке назад и переключении трека сохраняется позиция, на которой пользователь реально остановился. Это касается всех трёх модулей записи прогресса.

`lastPlayedAt` обновляется только при старте воспроизведения (`recordPlaybackStartAction`), не при flush.

**Stale-flush protection:** `flushHistoryProgressAction` — **upsert**: при отсутствии записи создаёт её из `sermon` + `playlist ?? buildManualPlaylist(sermon)` (payload `{ sermon, playlist?, deferred? }`). Гард `isEntryCompleted(entry)` применяется **только к deferred-флашам** (seek-дебаунс 400мс): такой флаш может быть устаревшим — пользователь мог пометить проповедь прослушанной в окне дебаунса — поэтому он пропускает завершённые записи. Immediate-флаши (пауза, стоп, 10с-тик, фон) — это факт **реального** воспроизведения → всегда пишут: реальное прослушивание перезаписывает ручную отметку (багфикс: массовая отметка «Пометить все прослушанными» застревала текущую воспроизводимую проповедь на 100%). Порог завершённости 10с (`COMPLETION_REMAINING_MS`) поглощает near-end флаши натурально дослушанных треков.

**Поведение при удалении:** удаление играющей проповеди из истории «отменяется» следующим немедленным flush (тик `usePlaybackProgressSaver` каждые 10с при `isPlaying` или flush при паузе) — история отражает фактическое прослушивание. Удаление «на паузе» сохраняется до следующего фактического взаимодействия с плеером (seek на паузе, повторная пауза/стоп, возобновление воспроизведения): тик гейтится на `isPlaying`, но immediate-флаши паузы/стопа и deferred-флаш seek'а не гейтятся и пересоздают запись, а после resume её пересоздаст ближайший 10с-тик.

### Атомарность записи (commitHistory)

Все 9 писателей истории идут через `commitHistory(ctx, next)` (`src/entities/listening-history/model/commitHistory.ts`) — синхронная установка `historyAtom` ДО персистенции через `writeHistory`. Read → transform → set выполняется в sync-секции экшена; JS однопоточен → цикл атомарен, конкурентные писатели всегда видят коммиты друг друга. Окно интерливинга на `await writeHistory` устранено — это закрывает гонку lost-update (включая сценарии: `markHistoryCompletedAction` → immediate-флаш при паузе после последнего трека — оба эффекта выживают, и реальное прослушивание перезаписывает отметку завершённости; любые пары конкурентных писателей). Защита от устаревшего флаша теперь действует **только для deferred-флашей** (seek-дебаунс 400мс) — см. «Stale-flush protection». Запись в сторедж — проекция атома через внутреннюю очередь `enqueueHistoryWrite` (порядок сериализован); при сбое записи атом «опережает» сторедж и самоизлечивается следующей успешной записью. `loadHistoryAction`/`reconcileOnHydration` — путь чтения при гидрации — остаются на `ctx.schedule` после await (правильно: они пишут атом одноразово при старте, а не по событиям воспроизведения).

10с-тик `usePlaybackProgressSaver` (`src/entities/player/lib/usePlaybackProgressSaver.ts`) при воспроизведении пишет **bound-ключ** `CURRENT_SOUND_POSITION` (`savePlaybackProgress`) и **каталог** (`flushHistoryProgressAction`); пауза останавливает авто-сохранение (гейт на `isPlaying`). Мини-снапшот `listeningProgressSnapshot` при воспроизведении **больше не пишется** (писатель удалён — см. «Мини-снапшот (LEGACY)»). Есть защита **skip-first-tick-после-переключения**: первый тик после смены `currentAudio` пропускается (рефы `previousAudioIdRef` / `skipNextTickRef`), чтобы не записать «мусорную» позицию перехода.

**Инвариант:** снапшот всегда не новее каталога — каждый **реальный** flush каталога (`flushHistoryProgressAction`, позиция/длительность изменились) чистит снапшот (`clearLiveProgressSnapshot`). No-op flush (позиция и длительность не изменились) выходит раньше и пропускает и запись, и очистку — это безопасно: ничего не изменилось, инвариант «каталог не старее снапшота» сохраняется, следующий реальный flush очистит снапшот. Это гарантирует, что seek-while-paused (обновляет каталог, но не снапшот) не регрессируется при гидрации: если приложение убито после seek, `reconcileOnHydration` не найдёт снапшота и сохранит позицию каталога.

При гидрации `loadHistoryAction` вызывает `reconcileOnHydration` (`src/entities/listening-history/lib/reconcileOnHydration.ts`):

1. читает каталог + снапшот;
2. снапшота нет → каталог возвращается как есть (позиция каталога сохраняется);
3. снапшот без совпадающей записи (или запись завершена) → дропается, каталог не меняется;
4. иначе — мержит в запись: `positionMs = snapshot.positionMs`, `durationMs = max(entry, snapshot)`, пишет каталог и чистит снапшот.

### Мини-снапшот (LEGACY)

`listeningProgressSnapshot` — **легаси-ключ**: больше не пишется при воспроизведении (писатель `writeLiveProgressSnapshot` из `usePlaybackProgressSaver` удалён). Хранится только для одноразовой миграции старых on-disk снапшотов при гидрации через `reconcileOnHydration`. Чистится при каждом реальном flush каталога (no-op flush пропускает очистку) и при reconcile/remove/clear.

### Завершение трека

`handleTrackEnd` в `TrackAutoAdvanceService` вызывает `markHistoryCompletedAction(ctx, sermonId, durationMs)` **до** ветвления путей (repeat/next/pause), передавая живую длительность из атома. Это гарантирует, что позиция `positionMs = durationMs` записывается в историю при каждом окончании трека, даже если далее произойдёт повтор или переход.

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
| Результаты поиска              | `src/features/sermon-search/ui/SermonSearchResults.tsx`                     | `useHistoryProgressMap()` + `useHistorySermonIds()` (подписка на уровне списка, прокидывается в строки) |
| Экран истории                  | `src/pages/history/ui/HistoryRow.tsx`                                       | inline-вывод из записи: `completed ? 1 : min(positionMs/durationMs, 1)` |

Все строки показывают только **сохранённый** прогресс (stored, событийно обновляемый). Полоса текущей (сейчас воспроизводимой) проповеди не «тикает» в реальном времени — она обновится на ближайшем событии (пауза, переключение и т.д.).

### Затемнение завершённых

В `TracksListItemContent` (`src/shared/ui/track-list/`) завершённая строка (`progress >= 1`) затемняется: обложка получает `albumArtCompleted` (opacity 0.5), заголовок — `titleCompleted` (приглушённый цвет). Правило: `isCompleted = progress != null && progress >= 1`. Строка истории (`HistoryRow`) дополнительно передаёт полный прогресс-бар (`storedProgress = 1`) для завершённых записей.

## Экран истории

Маршрут `/history` (вне таб-группы). Подробнее — [docs/screens/history.md](../screens/history.md).

## Допущения

- **audioUrl долгоживущие**: stream-url эндпоинт не используется, `AudioPlayerData.audioUrl` стабильны → снапшоты в истории валидны на протяжении жизни записи.
- **Нет синхронизации**: история локальная; при переустановке или смене устройства данные теряются.
- **Плейлист — снапшот**: контекстный `playlist` в записи содержит только текущую проповедь (`sermons: [sanitizedSermon]`), не весь плейлист.

## Тесты

| Сьют                    | Файл                                | Что проверяет                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadHistory`          | `lib/loadHistory.test.ts`          | Загрузка из storage; пустой storage → пустой атом; `isHistoryLoadedAtom` после гидрации и при ошибке чтения; дроп осиротевшего снапшота                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `recordPlaybackStart`  | `lib/recordPlaybackStart.test.ts`  | Новая запись (позиция 0), сброс завершённой, перемещение незавершённой, merge-ветка со strip `playlists`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `flushHistoryProgress` | `lib/flushHistoryProgress.test.ts` | Upsert: создание записи при отсутствии + синтетический плейлист + вытеснение на капе; обновление позиции/длительности без изменения `lastPlayedAt`; персист; deferred-флаш пропускает завершённую запись и создаёт запись при отсутствии; immediate-флаш перезаписывает её реальным прогрессом без изменения `lastPlayedAt`; создание с durationMs 0 → self-heal при следующем флаше                                                                                                                                                                                                                                                                      |
| `markHistoryCompleted` | `lib/markHistoryCompleted.test.ts` | positionMs = durationMs, живая длительность из параметра, no-op для нет/0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `removeHistoryEntry`   | `lib/removeHistoryEntry.test.ts`   | Удаление по id, no-op для неизвестного id                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `clearHistory`         | `lib/clearHistory.test.ts`         | Очистка атома и storage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `progressFlusher`       | `lib/PlayerService/progressFlusher.test.ts` | `scheduleHistoryFlush` и `flushProgress`: ранний выход без audio; серия schedules → один write; durationMs захватывается при schedule; `cancelScheduledHistoryFlush`; `flushProgress` отменяет debounce; flush создаёт запись с текущим плейлистом; deferred пропускает завершённую; **capture-at-schedule: смена sermon в окне дебаунса не приводит к cross-track contamination** |
| `usePlaybackProgressSaver` | `lib/usePlaybackProgressSaver.test.tsx` | 10с-тик пишет bound-ключ + flush каталога с sermon/duration/position; пауза и position ≤ 0 → без flush; skip-first-tick после смены audio; AppState background → flush, inactive → нет; unmount чистит интервал; **playlist из `currentPlaylistAtom` попадает в flush-payload** |
| `race (commitHistory)` | `lib/historyRace.test.ts`        | Конкурентный flush + remove: атом содержит оба эффекта до завершения persistence; авто-переход: `markHistoryCompletedAction` + `recordPlaybackStartAction` без await — обе трансформации выживают |
| `recordSermonSwitch`    | `lib/recordSermonSwitch.test.ts`    | flush старого трека: завершение по живой длительности (`oldDurationMs`) при `markOldCompleted: true`, fallback на длительность записи, ручное переключение сохраняет `oldPositionMs`; создание нового трека вверху; сброс завершённой записи нового |
| `isEntryCompleted`      | `lib/isEntryCompleted.test.ts`      | Границы: >10с осталось (false), 10с осталось (true), position = duration на длинном треке (true), короткий трек (5с) при position = duration (true), короткий трек частично (false), duration = 0 (false), отрицательная duration (false)                                                                                                                                                                                                                                                                          |
| `buildHistoryEntry`     | `lib/buildHistoryEntry.test.ts`     | Фабрика записи: sanitizer убирает `playlists`, контекстный плейлист содержит один sermon, начальные позиции 0, top-level `sermon` отсутствует                                                                                                                                                                                                                                                                                                                                                                    |
| `sortAndCapEntries`     | `lib/sortAndCapEntries.test.ts`     | Дедупликация по sermon.id (остаётся самая свежая), сортировка по lastPlayedAt desc, обрезка до MAX_HISTORY_ENTRIES                                                                                                                                                                                                                                                                                                                                                                                               |
| `getResumePosition`     | `lib/getResumePosition.test.ts`     | Нет записи → 0, завершённая → 0, position ≤ 0 → 0, иначе positionMs                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `liveProgressStorage`   | `lib/liveProgressStorage.test.ts`   | Чтение валидного снапшота; невалидный JSON/отсутствие/поля с отрицательными значениями → undefined; очистка                                                                                                                                                                                                                                                                                                                                                                                                        |
| `useHistoryProgressMap` | `lib/useHistoryProgressMap.test.ts` | Пустой history → пустая Map, completed → 1, partial → position/duration, position ≤ 0 → пропуск                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `markSermonListened`    | `lib/markSermonListened.test.ts`    | Upsert: создание завершённой записи (synthetic duration 1), обновление существующей до завершённой, идемпотентность для завершённой, не трогает `lastPlayedAt` при обновлении, персист                                                                                                                                                                                                                                                                                                                              |
| `markSermonsListened`   | `lib/markSermonsListened.test.ts`   | Массовая отметка: один writeHistory для нескольких проповедей, завершение частичных записей с сохранением `lastPlayedAt`, смесь create+complete, пустой массив без записи, вытеснение на капе                                                                                                                                                                                                                                                                                                                              |
| `removeSermonsFromHistory` | `lib/removeSermonsFromHistory.test.ts` | Массовое удаление: один writeHistory для нескольких id, неизвестные id → no-op, пустой массив без записи                                                                                                                                                                                                                                                                                                                                                                                                        |
| `useHistorySermonIds`   | `lib/useHistorySermonIds.test.ts`   | Пустой history → пустой Set, все sermon-id из истории (включая записи с нулевым прогрессом)                                                                                                                                                                                                                                                                                                                                                                                                        |
| `buildHistoryMenuActions` | `lib/buildHistoryMenuActions.test.ts` | Инвариант «isCompleted без inHistory → игнорируется»: при `!inHistory` всегда маркировка, при `inHistory && !isCompleted` маркировка + удаление, при `inHistory && isCompleted` только удаление; иконки и тексты пунктов                                                                                                                     |

## Связанные документы

- [player.md](./player.md) — плеер, usePlayNewSermon, персист позиции, TrackAutoAdvanceService
- [../screens/history.md](../screens/history.md) — экран истории
- [../contracts/storage.md](../contracts/storage.md) — ключ `listeningHistory` в AsyncStorage
