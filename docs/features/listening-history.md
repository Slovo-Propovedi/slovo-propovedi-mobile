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
│   └── history.ts            # Атомы и экшены: historyAtom, isHistoryLoadedAtom (внутренний), loadHistoryAction, recordPlaybackStartAction, flushHistoryProgressAction, markHistoryCompletedAction, removeHistoryEntryAction, clearHistoryAction
└── lib/
    ├── constants.ts          # COMPLETION_REMAINING_MS (10 000), MAX_HISTORY_ENTRIES (100)
    ├── historyStorage.ts     # readHistory / writeHistory (обёртки над getCachedJson/setCachedJson + очередь записей)
    ├── liveProgressStorage.ts    # Мини-снапшот LISTENING_PROGRESS_SNAPSHOT: liveProgressSnapshotSchema (Zod) + read/clear
    ├── buildHistoryEntry.ts  # Фабрика новой записи: санитизация sermon (убирает playlists), снапшот context-playlist
    ├── isEntryCompleted.ts   # Правило завершённости (см. ниже)
    ├── getResumePosition.ts  # Вычисление позиции resume для usePlayNewSermon
    ├── getEntrySermon.ts     # getEntrySermon(entry): sermon из entry.sermon ?? entry.playlist.sermons[0]
    ├── resolveEntryPlaylist.ts   # Резолв полного PlaylistData записи: live dynamicSectionsAtom (через @x entities/section/@x/listening-history) → sections-cache → снапшот entry.playlist
    ├── sortAndCapEntries.ts  # Дедупликация по sermon.id + сортировка по lastPlayedAt desc + обрезка до MAX_HISTORY_ENTRIES
    ├── recordSermonSwitch.ts     # recordSermonSwitchAction — flush старого + запись нового за один проход (markOldCompleted)
    ├── reconcileOnHydration.ts   # Слияние мини-снапшота в каталог при гидрации
    ├── useHistoryProgressMap.ts  # Map<sermonId, 0..1> — stored-прогресс из historyAtom для списков
    └── useLastListeningEntry.ts  # Хук последней записи с проповедью: { isLoaded, entry, sermon } для кнопки «Продолжить»
```

> **Удалено** (в рамках перф-работы): live-чтение прогресса — хуки `useLiveSermonProgress`, `useSermonProgress` и `getLiveProgressAtom`. Прогресс в UI теперь только stored (обновляется по событиям, см. «Прогресс в UI»).

### Публичный API (barrel)

```typescript
// entities/listening-history
export { getEntrySermon }
export { getResumePosition }
export { resolveEntryPlaylist }
export { recordSermonSwitchAction }
export { useHistoryProgressMap }
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
  entry: ListeningHistoryEntry | null,  // первая запись с getEntrySermon(entry) !== null
  sermon: AudioPlayerData | null,       // getEntrySermon(entry) той же записи
}
```

- `isLoaded === false` → `entry`/`sermon` = `null` (кнопка не рендерится).
- Иначе — перебирает `historyAtom` (отсортирован по `lastPlayedAt` DESC) и возвращает первую запись, у которой `getEntrySermon(entry)` не `null` (записи без проповеди пропускаются). `getEntrySermon` вызывается **один раз** на запись.
- Нет подходящей записи → `{ isLoaded: true, entry: null, sermon: null }` (кнопка «Начать слушать», disabled).

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
export { getEntrySermon } from '../lib/getEntrySermon'
export { getResumePosition } from '../lib/getResumePosition'
export { recordSermonSwitchAction } from '../lib/recordSermonSwitch'
export {
  historyAtom,
  markHistoryCompletedAction,
  recordPlaybackStartAction,
  flushHistoryProgressAction,
} from '../model/history'
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

### Очередь (`useQueueManagement`)

Все пути очереди, вызывающие `replaceAudio(url)` (`playTrack`, `playNext`, `playPrevious`, `shufflePlaylist` в `src/entities/player/lib/useQueueManagement.ts`), вычисляют `getResumePosition(history, targetSermonId)` и передают resumeMs в `replaceAudio`.

### Авто-переход (TrackAutoAdvanceService)

`playNextTrack` и `playFirstTrackInQueue` (`src/entities/player/lib/PlayerService/TrackAutoAdvanceService/playback.ts`) вычисляют resume через `ctx.get(historyAtom)` + `getResumePosition(history, nextTrackId)` и передают в `playTrackWithMetadata`. `repeatCurrentTrack` **всегда** передаёт 0 (режим повтора — воспроизведение с начала).

## Запись прогресса

### Модель: события + мини-ключ

Каталог `listeningHistory` пишется **по событиям** и **каждые 10с при воспроизведении** (тик `usePlaybackProgressSaver` → `flushHistoryProgressAction`):

| Событие               | Где                                                                                                      | Что происходит                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Старт воспроизведения | `usePlayNewSermon` → `recordPlaybackStartAction`                                                         | новая запись (позиция 0) / перемещение существующей в начало / сброс завершённой                                                                 |
| Пауза                 | `PlaybackController.pause`, `WebPlayerService.pause` → `flushHistoryProgressAction`                      | read-modify-write позиции (no-op при `positionMs ≤ 0` или не-прогрессе)                                                                          |
| Seek                  | `PlaybackController.seekTo` → `flushHistoryProgressAction`                                               | trailing-дебаунс 400мс: позиция истории обновляется после seek (в т.ч. на паузе); серия seek (long-press, тик 200мс) коалесится в один финальный write |
| Переключение трека    | `recordSermonSwitchAction` — из `usePlayNewSermon` (ручной тап), `usePlayerToggleTrack` (кнопки Next/Prev) и `playTrackWithMetadata` (авто-переход) | за один проход: flush позиции старого трека + запись/обновление нового; `markOldCompleted: true` на авто-переходе (позиция старого = живая длительность `oldDurationMs`), `false` на тапе и кнопках. **Zero-duration guard:** при `markOldCompleted: true`, но неизвестной длительности (`oldDurationMs = 0` и `entry.durationMs = 0`) позиция **не** обнуляется — сохраняется `oldPositionMs` (не фабрикуем завершение без знания длительности) |
| Окончание трека       | `handleTrackEnd` → `markHistoryCompletedAction`                                                          | `positionMs = durationMs` (ветка pause-on-last-track); длительность берётся из атома (`durationMs`-параметр), чтобы завершить запись даже при `durationMs: 0` в каталоге |
| Удаление / очистка    | `removeHistoryEntryAction`, `clearHistoryAction`                                                         | per-item / полная очистка                                                                                                                        |

> **Важно:** Позиция **всегда** записывается как есть, даже если пользователь перемотал назад. Ранее система сохраняла только монотонно-нарастающий прогресс (при перемотке назад сохранялась более высокая позиция). Сейчас `recordSermonSwitch`, `flushHistoryProgress` и `reconcileOnHydration` пишут фактическую текущую позицию — при перемотке назад и переключении трека сохраняется позиция, на которой пользователь реально остановился. Это касается всех трёх модулей записи прогресса.

`lastPlayedAt` обновляется только при старте воспроизведения (`recordPlaybackStartAction`), не при flush.

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

| Сьют                    | Файл                                | Что проверяет                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `history model`         | `model/history.test.ts`             | `loadHistoryAction` (загрузка из storage; reconcile со снапшотом; дроп осиротевшего снапшота), `recordPlaybackStartAction` (новая запись, сброс завершённой, перемещение незавершённой, merge-ветка со strip `playlists`), `flushHistoryProgressAction` (no-op для неизвестного id, обновление позиции/длительности без изменения `lastPlayedAt`, персист), `markHistoryCompletedAction` (positionMs = durationMs, живая длительность из параметра, no-op для нет/0), `removeHistoryEntryAction` (удаление по id), `clearHistoryAction` (очистка) |
| `recordSermonSwitch`    | `lib/recordSermonSwitch.test.ts`    | flush старого трека: завершение по живой длительности (`oldDurationMs`) при `markOldCompleted: true`, fallback на длительность записи, ручное переключение сохраняет `oldPositionMs`; создание нового трека вверху; сброс завершённой записи нового |
| `isEntryCompleted`      | `lib/isEntryCompleted.test.ts`      | Границы: >10с осталось (false), 10с осталось (true), position = duration на длинном треке (true), короткий трек (5с) при position = duration (true), короткий трек частично (false), duration = 0 (false), отрицательная duration (false)                                                                                                                                                                                                                                                                          |
| `buildHistoryEntry`     | `lib/buildHistoryEntry.test.ts`     | Фабрика записи: sanitizer убирает `playlists`, контекстный плейлист содержит один sermon, начальные позиции 0, top-level `sermon` отсутствует                                                                                                                                                                                                                                                                                                                                                                    |
| `sortAndCapEntries`     | `lib/sortAndCapEntries.test.ts`     | Дедупликация по sermon.id (остаётся самая свежая), сортировка по lastPlayedAt desc, обрезка до MAX_HISTORY_ENTRIES                                                                                                                                                                                                                                                                                                                                                                                               |
| `getResumePosition`     | `lib/getResumePosition.test.ts`     | Нет записи → 0, завершённая → 0, position ≤ 0 → 0, иначе positionMs                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `liveProgressStorage`   | `lib/liveProgressStorage.test.ts`   | Чтение валидного снапшота; невалидный JSON/отсутствие/поля с отрицательными значениями → undefined; очистка                                                                                                                                                                                                                                                                                                                                                                                                        |
| `useHistoryProgressMap` | `lib/useHistoryProgressMap.test.ts` | Пустой history → пустая Map, completed → 1, partial → position/duration, position ≤ 0 → пропуск                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Связанные документы

- [player.md](./player.md) — плеер, usePlayNewSermon, персист позиции, TrackAutoAdvanceService
- [../screens/history.md](../screens/history.md) — экран истории
- [../contracts/storage.md](../contracts/storage.md) — ключ `listeningHistory` в AsyncStorage
