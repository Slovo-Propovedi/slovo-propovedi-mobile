# Локальные плейлисты («Мои плейлисты»)

Домен локальных (пользовательских) плейлистов, его секция на экране «Слушать» (только чтение) и экран редактирования порядка `/listen/my-playlists`.

**Файлы:**

- `src/entities/playlist/model.ts` — тип, схема, атом, гидратация, reorder
- `src/entities/playlist/localPlaylists.ts` — `LocalPlaylistData`, zod-схема, `FAVORITES_PLAYLIST`
- `src/entities/playlist/localPlaylistMembership.ts` — `togglePlaylistSermon` (снапшоты)
- `src/entities/playlist/lib/readStoredMyPlaylists.ts` — чтение/гидратация из AsyncStorage
- `src/entities/playlist/lib/sanitizeLocalPlaylistSermon.ts` — санитизация снапшота проповеди
- `src/entities/playlist/index.ts` — публичный API (`FAVORITES_PLAYLIST`, `myPlaylistsAtom`, `loadMyPlaylists`, `reorderMyPlaylists`, `togglePlaylistSermon`)
- `src/pages/listen/ui/MyPlaylistsSlider.tsx` — секция «Мои плейлисты» **только для чтения**: заголовок (тап → экран редактирования) + карточка «Избранные» + горизонтальный список карточек
- `src/pages/my-playlists/ui/MyPlaylistsScreen.tsx` — экран «Мои плейлисты» — владелец режима редактирования
- `src/pages/my-playlists/ui/MyPlaylistsHeaderActions.tsx` — действия шапки экрана: «Изменить порядок» / «Сохранить»
- `src/pages/my-playlists/ui/MyPlaylistsDragList.tsx` — вертикальный `DraggableFlatList` строк с drag-to-reorder (только в режиме редактирования)
- `src/pages/my-playlists/lib/useReorderMyPlaylists.ts` — обёртка `reorderMyPlaylists` (no-op, если порядок не изменился)
- `src/pages/playlist/lib/usePlaylistById.ts` — tier 0 (локальный резолв)
- `src/pages/playlist/ui/PlaylistScreen.tsx`, `PlaylistTrackList.tsx` — пустое состояние «Избранного»

## Модель

Локальный плейлист (`LocalPlaylistData`) — `{ id, title, sermonIds, sermons }`:

- `sermons` хранит **снапшоты проповедей** (`SermonShape[]`), а не только id: снапшот делает
  локальный плейлист рендерящимся и проигрываемым **офлайн**, без обращения к каталогу.
  Перед записью проповедь санитизируется (`toPersistedLocalSermon`,
  `src/entities/playlist/lib/sanitizeLocalPlaylistSermon.ts`): отбрасывается `playlists`
  (тяжёлые серверные навигационные данные, источник zod-падений), `artwork` нормализуется в
  `null | string` — снапшот обязан проходить схему при чтении.
- `sermonIds` — **производное** от `sermons` (`sermons.map(s => s.id)`), остаётся в схеме как
  поле для обратной совместимости чтения старых записей. При загрузке снапшоты выигрывают:
  unmatched legacy ids молча отбрасываются (`normalizeLocalPlaylist`).
- `FAVORITES_PLAYLIST.id = 'favorites'` — плоский id; серверные id — UUID, поэтому
  столкновение невозможно.
- `FAVORITES_PLAYLIST` (`{ id: 'favorites', title: 'Избранные', sermonIds: [], sermons: [] }`) —
  системный плейлист: **всегда присутствует и стоит первым** в списке. Инвариант обеспечивает
  `withFavoritesFirst` при гидратации и при reorder — «Избранные» нельзя перетащить с первой позиции.
- `myPlaylistsAtom: LocalPlaylistData[]` — засеян `[FAVORITES_PLAYLIST]`, поэтому UI работает
  сразу, ещё до чтения хранилища.

Схема (`src/entities/playlist/localPlaylists.ts`) валидирует снапшот **структурной** формой
`SermonShape` (`localSermonSchema`), а не `sermonDataSchema` из entities/sermon: прямой импорт
последней замыкает require-цикл playlist ↔ sermon (`sermon.ts` уже тянет `playlistDataSchema`).
Граница та же, что у `playlistDataSchema` в `model.ts`; каноническая валидация проповеди живёт
в entities/sermon и применяется на верхнеуровневых границах.

## Хранилище

Ключ `myPlaylists` (JSON `LocalPlaylistData[]`) объявлен и принадлежит сущности
(`src/entities/playlist/localPlaylists.ts`). Хранилище недоверенное: чтение — через
`getCachedJson` + zod-схему (`myPlaylistsArraySchema`), невалидные данные трактуются как
отсутствующие (см. [contracts/storage.md](../contracts/storage.md)). Legacy-записи, хранившие
только `sermonIds` (или вообще без проповедей), читаются без падения: снапшотов у них нет,
поэтому `sermons` и `sermonIds` деградируют в `[]` — рендерить по одним id нечем.

`loadMyPlaylists` (Reatom-экшен, вызывается из `MyPlaylistsSlider` и `MyPlaylistsScreen` при монтировании;
чтение вынесено в `src/entities/playlist/lib/readStoredMyPlaylists.ts`):

1. читает и валидирует `myPlaylists`, нормализует каждую запись (`normalizeLocalPlaylist` —
   ids выводятся из `sermons`, legacy ids без снапшота отбрасываются);
2. если ключа нет — засеивает `[FAVORITES_PLAYLIST]` (persistence выполняется внутренним
   `persistMyPlaylists` через `setCachedJson`);
3. приводит список к инварианту «Избранные первые» и пишет в `myPlaylistsAtom`.

Отказ самого хранилища (reject `AsyncStorage.getItem`/`setItem`, например сломанный
нативный модуль) не пробрасывается наружу: экшен вызывается fire-and-forget
(`void loadPlaylists()` в `MyPlaylistsSlider` и `MyPlaylistsScreen`), поэтому ошибка логируется
(`console.error`) и трактуется так же, как невалидные данные — как отсутствие
`myPlaylists`, атом получает засеянный `[FAVORITES_PLAYLIST]`, UI работает.

Для текущей итерации список читается и переупорядочивается, а наполнение
`sermons`/`sermonIds` добавлено точечно: мутирующий CRUD создания/удаления плейлистов
по-прежнему отсутствует, но принадлежность проповеди переключается экшеном
`togglePlaylistSermon` (см. [add-to-playlist.md](./add-to-playlist.md)). Экшен принимает
**полный снапшот проповеди** (`SermonShape`), а не только id: при добавлении в плейлист
кладётся санитизированный снапшот, при удалении — фильтруется по id. Прочие
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

### Секция «Мои плейлисты» на экране «Слушать» (только для чтения)

`MyPlaylistsSlider` (`src/pages/listen/ui/MyPlaylistsSlider.tsx`) рендерится после
`DynamicSectionsSlider` на экране «Слушать» — завершающая секция. Заголовок — «Мои плейлисты»
(`SliderTitle`); **тап по заголовку** открывает отдельный экран `/listen/my-playlists`
(`navigateToMyPlaylists`), где живёт режим редактирования. Первая карточка — «Избранные»
(`SliderItemSize.Small`), вместо обложки передаётся `artworkIcon` (сердце `Ionicons 'heart'` цвета
`currentTheme.primary`). Тап по карточке ведёт на `/listen/playlist?playlist=favorites`. Остальные
локальные плейлисты — горизонтальный `FlatList` карточек `SliderItem`; тап навигирует на плейлист.
Редактирования порядка в секции **нет** (ни карандаша, ни drag) — секция только читает
`myPlaylistsAtom` и гидратирует его `loadMyPlaylists` при монтировании.

### Экран «Мои плейлисты» (редактирование порядка)

`MyPlaylistsScreen` (`src/pages/my-playlists/ui/MyPlaylistsScreen.tsx`) — владелец режима
редактирования; подробнее — [screens/my-playlists.md](../screens/my-playlists.md). Вертикальный
список: первой строкой закреплённые «Избранные» (`MyPlaylistsFavoritesRow`, сердечко, не
перетаскивается), ниже — карточные строки локальных плейлистов (`MyPlaylistsDragList` +
`MyPlaylistsRow` поверх `ListItemBase`).

**Режим редактирования.** Перестановка строк включается **явно** — двумя состояниями, обычным и
редактирования, управляет локальный state `localOrderIds` (`null` — обычный режим; массив id —
открытый режим). Опции шапки собирает `useMyPlaylistsHeader`
(`src/pages/my-playlists/lib/useMyPlaylistsHeader.tsx`), действия рендерит `MyPlaylistsHeaderActions`
(`src/pages/my-playlists/ui/MyPlaylistsHeaderActions.tsx`): в обычном режиме — `IconButton`
с карандашом (`Ionicons 'create-outline'`, `accessibilityLabel` «Изменить порядок»), в режиме
редактирования рядом появляется `IconButton` с галочкой (`checkmark`, «Сохранить»). Карандаш
работает как переключатель: повторный тап выходит из режима **без сохранения**. Когда редактировать
нечего (только «Избранные»), действия не рендерятся.

- **Обычный режим:** drag выключен — `MyPlaylistsDragList` получает `isDraggingEnabled = false`,
  поэтому `onLongPress`, активирующий `drag`, не прокидывается, а тап по строке навигирует.
- **Режим редактирования:** drag включён (long-press тянет строку целиком, native `drag` из
  `renderItem`), тап по строкам **не** навигирует. Перестановка меняет **локальную копию** порядка
  (`localOrderIds`), атом `myPlaylistsAtom` не трогается. «Сохранить» один раз коммитит итог через
  `reorderMyPlaylists` (полный порядок: `favorites` + локальный порядок; сущность пинит «Избранные»
  первыми) и выходит из режима. Уход из режима без сохранения (повторный тап по карандашу) или уход
  с экрана (`useFocusEffect` cleanup) локальную копию отбрасывает.

Пока идёт редактирование, порядок строк строится функцией `sortByLocalOrder`
(`src/pages/my-playlists/lib/sortByLocalOrder.ts`; id вне локального порядка — конкурентно
добавленный плейлист — уезжают в конец); после сохранения источником истины снова становится
`myPlaylistsAtom`. «Избранные» рендерятся только отдельной строкой и в drag-списке не дублируются,
запиннены первыми и не перетаскиваются. `onDragEnd` отдаёт итоговый порядок id; в режиме
редактирования он пишется в локальный state, а не в атом. `onDragEnd` исполняется на JS-потоке
(gesture-handler прокидывает завершение без вызова JS из worklet), поэтому `scheduleOnRN`
не требуется.

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

`usePlaylistById` (`src/pages/playlist/lib/usePlaylistById.ts`) имеет **tier 0**: если
запрошенный id равен `FAVORITES_PLAYLIST.id`, плейлист собирается **из локального
`myPlaylistsAtom`** — title «Избранные», `artwork: null`, `sermons` из снапшот-листа
локального плейлиста — без обращения к секциям, кэшу и сети. Если у локального
«Избранного» ещё нет снапшотов, возвращается пустая заглушка (`sermons: []`). Пустой
плейлист-заглушка `FAVORITES_PLAYLIST_DATA` остаётся как fallback. Остальные три tier'а
(секции → кэш → сеть) не изменены и применяются ко всем прочим id — порядок tier'ов
сохранён.

Благодаря снапшотам «Избранное» рендерится и **проигрывается офлайн**: `playNewSermon({ playlist, sermon })`
получает полные `SermonShape` (с `audioUrl`), авто-переключение очереди работает по
`playlist.sermons` без резолва по id.

Пустое состояние: `PlaylistTrackList` принимает `emptyMessage`; `PlaylistScreen` передаёт
«В избранном пока пусто» для `FAVORITES_PLAYLIST.id`, для остальных плейлистов показывается
«Этот плейлист пустой».

## Roadmap (следующая итерация — запланированная фича, не долг)

- **Создание локального плейлиста** (форма ввода названия).
- **Удаление локальных плейлистов** (мутирующий CRUD поверх `persistMyPlaylists`; сейчас
  приватный путь записи уже есть — reorder и `togglePlaylistSermon` используют его).
- **Добавление/удаление проповедей** в локальные плейлисты — «Избранное»
  и наполнение из контекст-меню уже реализованы (`togglePlaylistSermon` со снапшотами +
  модалка мультивыбора, см. [add-to-playlist.md](./add-to-playlist.md)); в этом пункте остаётся
  удаление/управление из самого экрана плейлиста, если понадобится.

## Связанные документы

- [screens/listen.md](../screens/listen.md)
- [screens/my-playlists.md](../screens/my-playlists.md)
- [screens/playlist.md](../screens/playlist.md)
- [contracts/storage.md](../contracts/storage.md)
