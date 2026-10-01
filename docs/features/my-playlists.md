# Локальные плейлисты («Мои плейлисты»)

Домен локальных (пользовательских) плейлистов и его отображение на экране «Слушать».

**Файлы:**

- `src/entities/playlist/model.ts` — тип, схема, атом, гидратация, reorder
- `src/entities/playlist/index.ts` — публичный API (`FAVORITES_PLAYLIST`, `myPlaylistsAtom`, `loadMyPlaylists`, `reorderMyPlaylists`)
- `src/pages/listen/ui/MyPlaylistsSlider.tsx` — секция «Мои плейлисты» (заголовок + карточка «Избранные» + drag-список), владелец режима редактирования
- `src/pages/listen/ui/MyPlaylistsHeader.tsx` — шапка секции: заголовок + действия «Изменить порядок» / «Сохранить»
- `src/pages/listen/ui/MyPlaylistsDragList.tsx` — горизонтальный `DraggableFlatList` карточек с drag-to-reorder (только в режиме редактирования)
- `src/pages/playlist/lib/usePlaylistById.ts` — tier 0 (локальный резолв)
- `src/pages/playlist/ui/PlaylistScreen.tsx`, `PlaylistTrackList.tsx` — пустое состояние «Избранного»

## Модель

Локальный плейлист (`LocalPlaylistData`) — `{ id, title, sermonIds }`:

- `sermonIds` хранит **только идентификаторы** проповедей, не снапшоты: полные `SermonData`
  резолвятся по id на экране плейлиста (секции/кэш/сеть). Так локальные плейлисты переживают
  обновления каталога.
- `FAVORITES_PLAYLIST.id = 'favorites'` — плоский id; серверные id — UUID, поэтому
  столкновение невозможно.
- `FAVORITES_PLAYLIST` (`{ id: 'favorites', title: 'Избранные', sermonIds: [] }`) —
  системный плейлист: **всегда присутствует и стоит первым** в списке. Инвариант обеспечивает
  `withFavoritesFirst` при гидратации и при reorder — «Избранные» нельзя перетащить с первой позиции.
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

Отказ самого хранилища (reject `AsyncStorage.getItem`/`setItem`, например сломанный
нативный модуль) не пробрасывается наружу: экшен вызывается fire-and-forget
(`void loadPlaylists()` в `MyPlaylistsSlider`), поэтому ошибка логируется
(`console.error`) и трактуется так же, как невалидные данные — как отсутствие
`myPlaylists`, атом получает засеянный `[FAVORITES_PLAYLIST]`, UI работает.

Для текущей итерации список читается и переупорядочивается, а наполнение
`sermonIds` добавлено точечно: мутирующий CRUD создания/удаления плейлистов
по-прежнему отсутствует, но принадлежность проповеди переключается экшеном
`togglePlaylistSermon` (см. [add-to-playlist.md](./add-to-playlist.md)). Прочие
записи — сид «Избранного» при первом чтении, сохранение нового порядка при
reorder и персист принадлежности при toggle.

`reorderMyPlaylists(ctx, orderedIds)` (Reatom-экшен, публичный API сущности) — локальное
переупорядочивание drag-and-drop:

1. собирает текущий порядок из `myPlaylistsAtom` в map `id → LocalPlaylistData`;
2. фильтрует `orderedIds`, отбрасывая неизвестные id;
3. дописывает в конец id, которые есть в атоме, но отсутствуют в `orderedIds` (защита от
   потери конкурентно добавленного плейлиста);
4. приводит к инварианту `withFavoritesFirst` — «Избранные» всегда первые (пиннинг);
5. пишет порядок в `myPlaylists` (`persistMyPlaylists`) и коммитит его в `myPlaylistsAtom`.

Отказ записи в хранилище (reject) не пробрасывается наружу: логируется
(`console.error('[reorderMyPlaylists] failed to persist order:', …)`), атом всё равно
коммитится — та же политика деградации, что и при гидратации.

Серверных вызовов нет — порядок локален и переживает перезапуск через AsyncStorage.

## UI

`MyPlaylistsSlider` (`src/pages/listen/ui/MyPlaylistsSlider.tsx`) рендерится после
`DynamicSectionsSlider` на экране «Слушать» — завершающая секция. Заголовок — «Мои плейлисты»
(через `MyPlaylistsHeader`). Первая карточка — «Избранные» (`SliderItemSize.Small`), вместо обложки
передаётся `artworkIcon` (сердце `Ionicons 'heart'` цвета `currentTheme.primary`). Тап по
карточке ведёт на `/listen/playlist?playlist=favorites`.

**Режим редактирования.** Перестановка карточек включается **явно** — двух состояний, обычного и
редактирования, управляет локальный state `localOrderIds` (`null` — обычный режим; массив id —
открытый режим). Шапка (`MyPlaylistsHeader`, `src/pages/listen/ui/MyPlaylistsHeader.tsx`) в
обычном режиме показывает `IconButton` с карандашом (`Ionicons 'create-outline'`,
`accessibilityLabel` «Изменить порядок»), в режиме редактирования рядом появляется `IconButton`
с галочкой (`checkmark`, «Сохранить»). Карандаш работает как переключатель: повторный тап
выходит из режима **без сохранения**.

- **Обычный режим:** drag выключен — `MyPlaylistsDragList` получает `isDraggingEnabled = false`,
  поэтому `onLongPress`, активирующий `drag`, не прокидывается, а тап по карточке навигирует.
- **Режим редактирования:** drag включён (long-press тянет карточку целиком, native `drag` из
  `renderItem`), тап по карточке **не** навигирует (и у «Избранного» тоже — карточка
  нередактируемая). Перестановка меняет **локальную копию** порядка (`localOrderIds`), атом
  `myPlaylistsAtom` не трогается. «Сохранить» один раз коммитит итог через `reorderMyPlaylists`
  (полный порядок: `favorites` + локальный порядок; сущность пинит «Избранные» первыми) и
  выходит из режима. Уход из режима без сохранения (повторный тап по карандашу) или уход с
  экрана (размонтирование сбрасывает state) локальную копию отбрасывает.

Пока идёт редактирование, `orderedRest` строится функцией `sortByLocalOrder` (id вне локального
порядка — конкурентно добавленный плейлист — уезжают в конец); после сохранения источником
истины снова становится `myPlaylistsAtom`.

Остальные карточки рендерит `MyPlaylistsDragList` (`src/pages/listen/ui/MyPlaylistsDragList.tsx`) —
горизонтальный `DraggableFlatList` (`react-native-draggable-flatlist`) поверх того же
`SliderItem` (`SliderItemSize.Small`). `MyPlaylistsSlider` передаёт в список `orderedRest`
(`playlists.slice(1)` в обычном режиме) — «Избранные» рендерятся только отдельной карточкой и в
списке не дублируются. `onDragEnd` отдаёт итоговый порядок id; в режиме редактирования он
пишется в локальный state, а не в атом. «Избранные» запиннены первыми и не перетаскиваются.
`onDragEnd` исполняется на JS-потоке (gesture-handler прокидывает завершение без вызова JS из
worklet), поэтому `scheduleOnRN` не требуется.

`artworkIcon` — опциональный слот `SliderItem`/`SliderItemsElement` (`src/shared/ui/slider/slider-item/`):
при наличии обложка не рендерится, вместо неё — нода поверх тематической подложки
(`currentTheme.surface`). API обратной совместимости: обычные слайдеры без `artworkIcon` не
затрагиваются.

**Ограничение `artworkIcon`:** обёртка `CoverImage` (внутри которой рендерится
on-slide-описание) заменяется на подложку с иконкой целиком, поэтому при заданном
`artworkIcon` on-slide-описание **не показывается**; описание под обложкой
(`whereIsSlideTitleLocated`) рендерится как обычно. Для карточек «Мои плейлисты» это
незаметно: карточки идут с дефолтным `whereIsSlideTitleLocated = Under`, а `description`
(название плейлиста) дублируется подписью под слайдом.

## Резолв на экране плейлиста (tier 0)

`usePlaylistById` (`src/pages/playlist/lib/usePlaylistById.ts`) получил **tier 0**: если
запрошенный id равен `FAVORITES_PLAYLIST.id`, сразу возвращается заглушка `PlaylistData`
(title «Избранные», `sermons: []`, `artwork: null`) — без обращения к секциям, кэшу и сети.
Остальные три tier'а (секции → кэш → сеть) не изменены и применяются ко всем прочим id.

Пустое состояние: `PlaylistTrackList` принимает `emptyMessage`; `PlaylistScreen` передаёт
«В избранном пока пусто» для `FAVORITES_PLAYLIST.id`, для остальных плейлистов показывается
«Этот плейлист пустой».

## Roadmap (следующая итерация — запланированная фича, не долг)

- **Создание локального плейлиста** (форма ввода названия).
- **Удаление локальных плейлистов** (мутирующий CRUD поверх `persistMyPlaylists`; сейчас
  приватный путь записи уже есть — reorder и `togglePlaylistSermon` используют его).
- **Добавление/удаление проповедей** в локальные плейлисты (`sermonIds`) — «Избранное»
  и наполнение из контекст-меню уже реализованы (`togglePlaylistSermon` + модалка
  мультивыбора, см. [add-to-playlist.md](./add-to-playlist.md)); в этом пункте остаётся
  удаление/управление из самого экрана плейлиста, если понадобится.

## Связанные документы

- [screens/listen.md](../screens/listen.md)
- [screens/playlist.md](../screens/playlist.md)
- [contracts/storage.md](../contracts/storage.md)
