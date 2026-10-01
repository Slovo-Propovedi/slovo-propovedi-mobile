# Локальные плейлисты («Мои плейлисты»)

Домен локальных (пользовательских) плейлистов и его отображение на экране «Слушать».

**Файлы:**

- `src/entities/playlist/model.ts` — тип, схема, атом, гидратация
- `src/entities/playlist/index.ts` — публичный API (`FAVORITES_PLAYLIST`, `myPlaylistsAtom`, `loadMyPlaylists`)
- `src/pages/listen/ui/MyPlaylistsSlider.tsx` — секция «Мои плейлисты»
- `src/pages/playlist/lib/usePlaylistById.ts` — tier 0 (локальный резолв)
- `src/pages/playlist/ui/PlaylistScreen.tsx`, `PlaylistTrackList.tsx` — пустое состояние «Избранного»

## Модель

Локальный плейлист (`LocalPlaylistData`) — `{ id, title, sermonIds }`:

- `sermonIds` хранит **только идентификаторы** проповедей, не снапшоты: полные `SermonData`
  резолвятся по id на экране плейлиста (секции/кэш/сеть). Так локальные плейлисты переживают
  обновления каталога.
- Значения `id` используют префикс `local:` (`FAVORITES_PLAYLIST.id = 'local:favorites'`) —
  гарантия, что локальный id никогда не столкнётся с серверным (серверные id — UUID).
- `FAVORITES_PLAYLIST` (`{ id: 'local:favorites', title: 'Избранные', sermonIds: [] }`) —
  системный плейлист: **всегда присутствует и стоит первым** в списке. Инвариант обеспечивает
  `withFavoritesFirst` при гидратации.
- `myPlaylistsAtom: LocalPlaylistData[]` — засеян `[FAVORITES_PLAYLIST]`, поэтому UI работает
  сразу, ещё до чтения хранилища.

## Хранилище

Ключ `myPlaylists` (JSON `LocalPlaylistData[]`) объявлен и принадлежит сущности
(`src/entities/playlist/model.ts`). Хранилище недоверенное: чтение — через
`getCachedJson` + zod-схему (`myPlaylistsArraySchema`), невалидные данные трактуются как
отсутствующие (см. [contracts/storage.md](../contracts/storage.md)).

`loadMyPlaylists` (Reatom-экшен, вызывается из `MyPlaylistsSlider` при монтировании):

1. читает и валидирует `myPlaylists`;
2. если ключа нет — засеивает `[FAVORITES_PLAYLIST]` (persistence выполняется внутренним
   `persistMyPlaylists` через `setCachedJson`);
3. приводит список к инварианту «Избранные первые» и пишет в `myPlaylistsAtom`.

Для текущей итерации список только читается: мутирующего CRUD нет, единственная запись —
сид «Избранного» при первом чтении.

## UI

`MyPlaylistsSlider` (`src/pages/listen/ui/MyPlaylistsSlider.tsx`) рендерится после
`DynamicSectionsSlider` на экране «Слушать» — завершающая секция. Заголовок — «Мои плейлисты»
(через `Slider`/`SliderTitle`, как у серверных секций). Карточка — тот же `Slider` размером
`SliderItemSize.Small`, что и соседние секции; вместо обложки передаётся `artworkIcon` (сердце
`Ionicons 'heart'` цвета `currentTheme.primary`). Тап по карточке ведёт на
`/listen/playlist?playlist=local:favorites`.

`artworkIcon` — опциональный слот `SliderItem`/`SliderItemsElement`
(`src/shared/ui/slider/slider-item/`): при наличии обложка не рендерится, вместо неё — нода
поверх тематической подложки (`currentTheme.surface`). API обратной совместимости: обычные
слайдеры без `artworkIcon` не затрагиваются.

## Резолв на экране плейлиста (tier 0)

`usePlaylistById` (`src/pages/playlist/lib/usePlaylistById.ts`) получил **tier 0**: если
запрошенный id равен `FAVORITES_PLAYLIST.id`, сразу возвращается заглушка `PlaylistData`
(title «Избранные», `sermons: []`, `artwork: null`) — без обращения к секциям, кэшу и сети.
Остальные три tier'а (секции → кэш → сеть) не изменены и применяются ко всем прочим id.

Пустое состояние: `PlaylistTrackList` принимает `emptyMessage`; `PlaylistScreen` передаёт
«В избранном пока пусто» для `FAVORITES_PLAYLIST.id`, для остальных плейлистов остаётся
«В плейлисте нет записей».

## Roadmap (следующая итерация — запланированная фича, не долг)

- **Создание локального плейлиста** (форма ввода названия).
- **DnD-переупорядочивание** списка «Мои плейлисты» (порядок серверных карточек не трогается).
- **Добавление/удаление проповедей** в локальные плейлисты (`sermonIds`), в т.ч. наполнение
  «Избранного» из контекст-меню трека.
- Мутирующий CRUD поверх `persistMyPlaylists` (сейчас приватный путь записи уже есть).

## Связанные документы

- [screens/listen.md](../screens/listen.md)
- [screens/playlist.md](../screens/playlist.md)
- [contracts/storage.md](../contracts/storage.md)
