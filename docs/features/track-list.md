# Список треков (shared/ui/track-list)

Единый UI-модуль строк списка проповедей и их скелетонов. Живёт в `src/shared/ui/track-list/` и используется всеми списками: плейлист (`pages/playlist`), история (`pages/history`), офлайн (`pages/offline`), очередь шторки (`widgets/expandable-player/PlaylistBottomSheet`), поиск (`features/sermon-search`).

## Базовая строка `TracksListItem`

`TracksListItem` (`src/shared/ui/track-list/TracksListItem.tsx`) — **единственная** базовая компонента строки проповеди. Все места рендерят её через тонкие обёртки (см. «Паттерн тонкой обёртки»).

### Контракт (что обязан передать вызывающий)

| Проп | Обязателен | Назначение |
| --- | --- | --- |
| `title` | да | Название проповеди. |
| `isPlaying` | да | Подсветка «это текущий трек» (резолвится вызывающим: `currentAudioId === id`). |
| `onPress` | да | Тап по строке (воспроизведение). |
| `artwork` | нет | Обложка (`CoverImage`, фолбэк `IMAGE_PLACEHOLDER`). |
| `audioUrl` | нет | URL аудио; без него меню не открывается, кэш-состояние не вычисляется. |
| `isAudioPlaying` | нет | Звуковые бары «реально играет» (поверх подсветки). |
| `progress` | нет | Прогресс прослушивания 0..1 (тонкая полоса по нижней кромке; `1` затемняет строку). |
| `subtitle` | нет | Подпись под заголовком. |
| `menuActions` | нет | Кастомные пункты контекст-меню (добавляются после встроенного кэш-пункта). |
| `style` | нет | Стиль строки (обычно `marginHorizontal: INDENTS.medium`). |
| `cacheTrigger` | нет | Внешний триггер перепроверки кэша (батч-скачивание плейлиста). |

### Что строка владеет сама (общее для всех вариантов)

- **Per-URL состояние скачивания** — `useTrackItemCache` (`useTrackItemCache.ts`) подписывается на `playlistDownloadProgressAtom` (shared) с Object.is-bailout: при тике прогресса ре-рендерится только строка с совпадающим URL. `isDownloading`/`isQueued`/`progressValue` выводятся из общих атомов очереди и прогресса — обёртки **не** передают их вниз. По завершении закачки (переход «качается → не качается») внутренний триггер перепроверяет кэш.
- **Индикатор кэша/очереди/облака** — `PlayingStatusOrChacheIcon` по `visualState` из `resolveCacheState` (`playing → downloading → cached → queued → cloud`).
- **Прогресс-бар скачивания** — поверх обложки при `isDownloading`.
- **Контекст-меню** — `TracksListItemContextMenu`: встроенный пункт «Добавить в офлайн / Удалить из офлайн / Остановить / Убрать из очереди» (`toggleCache`) + кастомные `menuActions`. Якорь меню измеряется **viewport-координатами** через `measureInWindow()` (не `measure()`): меню рендерится в viewport-fixed `Modal`-портале, а `measure()` на web отдаёт page-координаты со сдвигом на скролл — на прокрученной странице меню улетало бы. Подробнее — [web.md](./web.md) → «Позиционирование меню (дропдауны) на web».
- **Подсветка играющего** — заголовок/обложка primary + `AnimatedSoundBars` при `isAudioPlaying`.

### Web-специфика: строка-ссылка и кнопка меню (три точки)

На web react-native-web рендерит `accessibilityRole='link'` как `<div role="link" tabindex=0>` (без `<a>`-тега): строка получает Vimium-подсказки, Enter активирует, Space скроллит — семантика ссылки. Кнопка меню (три точки) — настоящий `<button>`: строка и кнопка используют `PressableButton` из `shared/ui/pressable-button` (role по умолчанию `button`), строка передаёт `accessibilityRole={ROW_ACCESSIBILITY_ROLE}` (`link` на web, `button` на нативе). На нативе строка и кнопка остаются `button`. **Не вкладывать кнопки друг в друга на web**: `<button>` внутри `<div role="link">` валиден, но `<button>` внутри `<button>` (или внутри другого элемента с role=button/link) — невалидный HTML и React-ошибка «`<button>` cannot be a descendant of `<button>`». Тот же контейнерный паттерн (`ROW_ACCESSIBILITY_ROLE`) применён к ряду мини-плеера (`widgets/expandable-player/ui/ExpandablePlayer/MiniPlayer.tsx`), который содержит внутреннюю кнопку play/pause.

### FSD-правило

`shared/ui/track-list` **не импортирует** `entities/*` и `features/*`. Воспроизведение, источники данных (entry/sermon), построение меню и **источники прогресса** (`useHistoryProgress`, математика entry, `progressMap`) остаются в обёртках.

## Паттерн тонкой обёртки

Каждое место имеет свою обёртку, которая только мапит данные → пропсы базы:

| Обёртка | Файл | Что делает |
| --- | --- | --- |
| `HistoryRow` | `src/pages/history/ui/HistoryRow.tsx` | `getEntrySermon` → данные; прогресс из entry (`positionMs/durationMs`); меню `buildHistoryMenuActions`; сабтайтл `formatRelativeDate`; воспроизведение `useEntryPlayback`. |
| `OfflineRow` | `src/pages/offline/ui/OfflineRow.tsx` | `OfflineSermonItem` → данные; `isPlaying` по `currentAudioAtom`; прогресс `useHistoryProgress(sermon.id)`; воспроизведение `usePlayNewSermon`. |
| `PlaylistTrackItem` | `src/pages/playlist/ui/PlaylistTrackItem.tsx` | Проброс из `PlaylistScreen`; `isPlaying` по `currentAudioId`; прогресс из `progressMap`. |
| `PlaylistSheetRow` | `src/widgets/expandable-player/ui/PlaylistBottomSheet/PlaylistSheetRow.tsx` | Проброс из `usePlaylistSheetList`; прогресс `useHistoryProgress(id)`; меню `useSheetMenuActions`. |
| `SermonSearchRow` | `src/features/sermon-search/ui/SermonSearchRow.tsx` | `SermonData` → данные; сабтайтл `artist • книга глава:стихи`; меню `buildHistoryMenuActions`. |

Обёртки не дублируют кэш/скачивание/меню-инфраструктуру — всё это живёт в базе.

## Скелетоны

Скелетоны доступны через **composition API** как свойства компонентов. Из барреля экспортируется только самостоятельный список-скелетон `TracksListSkeleton` (для экранов без отдельного компонента списка и для прикрепления к компоненту списка):

- `TracksListItem.Skeleton` — одна пульсирующая строка-карточка (обложка + две полосы текста), повторяет геометрию реальной строки (`TRACK_LIST_ITEM_SIZES`), пульс opacity 0.5↔1 ~700ms. Роу-скелетон доступен только как свойство строки.
- `TracksListSkeleton` — стек из N строк с разделителями. Пропсы: `rowCount` (по умолчанию 6), `rowStyle` (например `marginHorizontal: INDENTS.medium`), `showDividers` (по умолчанию true). Список-скелетон прикрепляется к **компоненту списка**, когда такой существует (`PlaylistSheetList.Skeleton`); если отдельного компонента списка нет (экран рендерит инлайн-`FlatList`), импортируется напрямую из барреля.

```tsx
// Экран с инлайн-списком (нет отдельного компонента списка):
import { TracksListSkeleton } from 'shared/ui/track-list'

<TracksListSkeleton rowStyle={styles.skeletonRow} />

// Отдельный компонент списка прикрепляет скелетон к себе:
// src/widgets/expandable-player/ui/PlaylistBottomSheet/PlaylistSheetList.tsx
// (двухконстантная форма: react-refresh/only-export-components не распознаёт
// Object.assign-экспорт в .tsx, а TS не даёт присвоить свойство memo-результату)
const PlaylistSheetListWithSkeleton = Object.assign(memo(PlaylistSheetListComponent), {
  Skeleton: TracksListSkeleton,
})

export const PlaylistSheetList = PlaylistSheetListWithSkeleton
// <PlaylistSheetList.Skeleton rowCount={8} />
```

Потребители: `OfflineScreen` и `HistoryScreen` (6 строк, `rowStyle` с горизонтальными отступами), `PlaylistSheetList` (8 строк внутри оверлея с `paddingHorizontal: INDENTS.medium`, без `rowStyle` — геометрия совпадает с реальными строками шторки, чтобы при reveal ничего не сдвигалось).

### Конвенция «элемент + скелетон»

Пара компонента и её скелетона живёт рядом: `element/element.tsx` + `element/elementSkeleton.tsx`. Скелетон **не** реэкспортируется из барреля слайса сам по себе, а прикрепляется к родительскому элементу как свойство (`Element.Skeleton = ElementSkeleton`). Это стандарт проекта: так же устроены `Slider.Skeleton`, `SliderItem.Skeleton`, `SliderItemDescription.Skeleton`, `MarqueeText.Skeleton`.

Правило размещения скелетонов списка треков:

- **Роу-скелетон** — всегда свойство элемента строки: `TracksListItem.Skeleton`.
- **Список-скелетон** — свойство **компонента списка**, когда такой есть: `PlaylistSheetList.Skeleton`. Если отдельного компонента списка нет (экран рендерит инлайн-`FlatList`), список-скелетон импортируется напрямую из барреля: `TracksListSkeleton` (`OfflineScreen`, `HistoryScreen`).

## Связанные документы

- [features/audio-cache.md](./audio-cache.md) — очередь скачивания, `playlistDownloadProgressAtom`, `resolveCacheState`.
- [features/listening-history.md](./listening-history.md) — `useHistoryProgress`, `buildHistoryMenuActions`.
- [screens/playlist.md](../screens/playlist.md), [screens/history.md](../screens/history.md), [screens/offline.md](../screens/offline.md).