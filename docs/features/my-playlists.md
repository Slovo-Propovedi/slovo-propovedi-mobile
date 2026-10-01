# Локальные плейлисты («Мои плейлисты»)

Домен локальных (пользовательских) плейлистов, его секция на экране «Слушать» (только чтение) и экран редактирования порядка `/listen/my-playlists`.

**Файлы:**

- `src/entities/playlist/model.ts` — тип, схема, атом, гидратация, reorder
- `src/entities/playlist/localPlaylists.ts` — `LocalPlaylistData`, zod-схема, `FAVORITES_PLAYLIST`
- `src/entities/playlist/localPlaylistMembership.ts` — `togglePlaylistSermon` (снапшоты)
- `src/entities/playlist/localSectionSettings.ts` — `LocalSectionSettings`, zod-черновик, дефолт, `normalizeSectionSettings`, ключ `MY_PLAYLISTS_SECTION_SETTINGS`
- `src/entities/playlist/localSectionSettingsStorage.ts` — единственный путь записи настроек оформления
- `src/entities/playlist/sectionSettingsModel.ts` — атом `sectionSettingsAtom`, `loadSectionSettings`, `updateSectionSettings`
- `src/entities/playlist/lib/readStoredMyPlaylists.ts` — чтение/гидратация плейлистов из AsyncStorage
- `src/entities/playlist/lib/readStoredSectionSettings.ts` — чтение/гидратация настроек оформления
- `src/entities/playlist/lib/sanitizeLocalPlaylistSermon.ts` — санитизация снапшота проповеди
- `src/entities/playlist/index.ts` — публичный API (`FAVORITES_PLAYLIST`, `myPlaylistsAtom`, `loadMyPlaylists`, `reorderMyPlaylists`, `togglePlaylistSermon`, `sectionSettingsAtom`, `loadSectionSettings`, `updateSectionSettings`, `LocalSectionSettings`)
- `src/entities/section/lib/mapItemsSize.ts`, `mapTransform.ts`, `mapWhereIsTitleLocated.ts` — мапперы полей оформления секции в `SliderItemSize`/`SliderItemTransform`/`WhereIsSlideTitleLocated` (перенесены из `pages/listen/lib`, чтобы их переиспользовали и слайдер, и экран «Мои плейлисты»); реэкспорт через `entities/section`
- `src/pages/listen/ui/MyPlaylistsSlider.tsx` — секция «Мои плейлисты» на «Слушать»: рендерится через общий `Slider` с параметрами из `sectionSettingsAtom`
- `src/pages/my-playlists/ui/MyPlaylistsScreen.tsx` — экран «Мои плейлисты» — владелец режима редактирования
- `src/pages/my-playlists/ui/MyPlaylistsAppearanceForm.tsx` — блок «Оформление» режима редактирования (instant-apply)
- `src/pages/my-playlists/ui/MyPlaylistsEditHeader.tsx` — шапка режима редактирования: «Оформление» + «Плейлисты раздела»
- `src/pages/my-playlists/ui/MyPlaylistsNormalView.tsx` — просмотровый режим экрана (без изменений в поведении)
- `src/pages/my-playlists/ui/MyPlaylistsHeaderActions.tsx` — действия шапки экрана: «Изменить порядок» / «Сохранить»
- `src/pages/my-playlists/ui/MyPlaylistsDragList.tsx` — вертикальный `DraggableFlatList` строк с drag-to-reorder и слотами `listHeader`/`listEmpty`
- `src/pages/my-playlists/lib/useReorderMyPlaylists.ts` — обёртка `reorderMyPlaylists` (no-op, если порядок не изменился)
- `src/shared/lib/utils/parseItemsRows.ts` — разбор строки поля «Строк» в `null | number` (общий с формой раздела в админке)
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
`getCachedJsonResult` + zod-схему (`myPlaylistsArraySchema`), который различает отсутствие
ключа (`empty`) и провал парсинга (`invalid`/`error`) (см.
[contracts/storage.md](../contracts/storage.md)). Legacy-записи, хранившие только `sermonIds`
(или вообще без проповедей), читаются без падения: снапшотов у них нет, поэтому `sermons`
и `sermonIds` деградируют в `[]` — рендерить по одним id нечем.

`loadMyPlaylists` (Reatom-экшен, вызывается из `MyPlaylistsSlider` и `MyPlaylistsScreen` при монтировании;
чтение вынесено в `src/entities/playlist/lib/readStoredMyPlaylists.ts`):

1. читает и валидирует `myPlaylists`, нормализует каждую запись (`normalizeLocalPlaylist` —
   ids выводятся из `sermons`, legacy ids без снапшота отбрасываются);
2. при **отсутствии** ключа (`empty`) — засеивает `[FAVORITES_PLAYLIST]` и персистит сид
   (внутренний `persistMyPlaylists` через `setCachedJson`);
3. при **невалидном/битом JSON** (`invalid`/`error`) — только `console.warn` и сид
   «Избранного» в памяти: **хранилище не перезаписывается**, чтобы одна битая запись не
   стёрла все плейлисты; восстановление произойдёт при следующей валидной записи
   (reorder/toggle);
4. приводит список к инварианту «Избранные первые» и пишет в `myPlaylistsAtom`. Инвариант
   **пинит stored-«Избранное»** (`withFavoritesFirst`): его снапшоты переживают гидратацию,
   а пустая константа `FAVORITES_PLAYLIST` — лишь фолбэк, когда записи нет.

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

## Настройки оформления секции

`LocalSectionSettings` (`src/entities/playlist/localSectionSettings.ts`) — локальные настройки внешнего
вида секции «Мои плейлисты»; имена полей зеркалят DTO секции: `itemsSize` (`small`/`middle`/`large`/`xLarge`),
`transform` (`high`/`middle`/`short`), `whereIsSlideTitleLocated` (`on`/`under`/`bothOnAndUnder`),
`itemsRows` (`null | number`), `isDescriptionTitleOnSlideLarge`, `borderRadius`. Дефолт
(`DEFAULT_SECTION_SETTINGS`) повторяет прежний вид секции: `small` / `middle` / `under` / `null` / `false` / `false`.

Ключ `myPlaylistsSectionSettings` принадлежит сущности. Хранилище недоверенное: чтение — через
`getCachedJsonResult` + `sectionSettingsDraftSchema` (`lib/readStoredSectionSettings.ts`), которое различает
отсутствие ключа (`empty`) и провал парсинга (`invalid`/`error`) — та же политика, что у `myPlaylists`:

1. при **отсутствии** ключа — дефолт персистится (`persistSectionSettings`);
2. при **невалидном/битом JSON** — `console.warn` и дефолт в памяти, **хранилище не перезаписывается**
   (одна битая запись не должна стереть выбранное оформление);
3. все поля опциональны — частичная/legacy-запись дочитывается дефолтом (`normalizeSectionSettings`).

`loadSectionSettings` — гидратация (вызывается из `MyPlaylistsSlider` и `MyPlaylistsScreen` fire-and-forget,
как `loadMyPlaylists`). `updateSectionSettings(ctx, patch)` — **мгновенное применение**: коммитит
объединённые настройки в `sectionSettingsAtom`, затем пишет в хранилище; отказ записи логируется, но атом
уже закоммичен (политика деградации как у `reorderMyPlaylists`). Форма оформления вызывает его на каждое
изменение поля (instant-apply), поэтому настройки переживают перезапуск без отдельной кнопки «Сохранить».

## UI

### Секция «Мои плейлисты» на экране «Слушать»

`MyPlaylistsSlider` (`src/pages/listen/ui/MyPlaylistsSlider.tsx`) рендерится после
`DynamicSectionsSlider` на экране «Слушать» — завершающая секция. Заголовок — «Мои плейлисты»
(тап → отдельный экран `/listen/my-playlists`, `navigateToMyPlaylists`). Секция рендерится через
общий `Slider` (`shared/ui`): карточки — `SliderItemsElement`, «Избранные» — первая карточка с
`artworkIcon` (сердце `Ionicons 'heart'` цвета `currentTheme.primary`, размер из
`getSliderItemWidth(itemsSize) * 0.4`), остальные локальные плейлисты — обычные карточки с
`description = title`. Тап по карточке навигирует на `/listen/playlist?playlist=<id>`.
Параметры отображения берутся из `sectionSettingsAtom` и прогоняются через мапперы
`entities/section` (`mapItemsSize`/`mapTransform`/`mapWhereIsTitleLocated`):
`itemsRows`/`itemsSize`/`transform`/`whereIsSlideTitleLocated`/`isDescriptionTitleOnSlideLarge`.
Редактирования порядка в секции **нет** — секция только читает `myPlaylistsAtom` и
`sectionSettingsAtom` и гидратирует их (`loadMyPlaylists`, `loadSectionSettings`) при монтировании.

**Ограничение `artworkIcon`:** обёртка `CoverImage` (внутри которой рендерится on-slide-описание)
заменяется на подложку с иконкой целиком, поэтому при заданном `artworkIcon` on-slide-описание
**не показывается**; описание под обложкой (`whereIsSlideTitleLocated`) рендерится как обычно.
Для карточки «Избранные» это незаметно только при `whereIsSlideTitleLocated` = `under`/`bothOnAndUnder`:
там `description` дублируется подписью под слайдом. При `on` подпись не рендерится вообще —
иконка заменяет обложку, которая служит подложкой для on-slide-описания, так что карточка
«Избранные» остаётся без названия. Остальные карточки локальных плейлистов (`artworkIcon` не
задан) следуют настройке `whereIsSlideTitleLocated` — при `on`/`bothOnAndUnder` описание
показывается на подложке.

### Экран «Мои плейлисты» (админ-подобная форма оформления + порядок)

`MyPlaylistsScreen` (`src/pages/my-playlists/ui/MyPlaylistsScreen.tsx`) — владелец режима
редактирования; подробнее — [screens/my-playlists.md](../screens/my-playlists.md). Обычный режим
(`MyPlaylistsNormalView`): первой строкой закреплённые «Избранные» (`MyPlaylistsFavoritesRow`,
сердечко, не перетаскивается), ниже — карточные строки локальных плейлистов (`MyPlaylistsDragList` +
`MyPlaylistsRow` поверх `ListItemBase`).

**Режим редактирования.** Перестановка строк включается **явно** — двумя состояниями, обычным и
редактирования, управляет локальный state `localOrderIds` (`null` — обычный режим; массив id —
открытый режим). Опции шапки собирает `useMyPlaylistsHeader`
(`src/pages/my-playlists/lib/useMyPlaylistsHeader.tsx`), действия рендерит `MyPlaylistsHeaderActions`
(`src/pages/my-playlists/ui/MyPlaylistsHeaderActions.tsx`): `IconButton` с карандашом
(`Ionicons 'create-outline'`, `accessibilityLabel` «Изменить порядок») и, в режиме редактирования,
рядом `IconButton` с галочкой (`checkmark`, «Сохранить»). **Карандаш виден и активен всегда**, даже
когда редактировать нечего (только «Избранные») — в этом случае форма оформления всё равно доступна.
Карандаш работает как переключатель: повторный тап выходит из режима **без сохранения** порядка
(изменения оформления уже применены).

В режиме редактирования представление становится **админ-подобной формой** (шапка списка —
`MyPlaylistsEditHeader`):

- `FormGroupTitle` «Оформление» + `MyPlaylistsAppearanceForm` — те же поля, что у формы раздела в
  админке (`SelectField` ×3 → размер/высота/расположение заголовка, `FormField` «Строк» с
  `number-pad` и разбором через `parseItemsRows`, `CheckboxField` ×2 → крупный заголовок описания и
  скруглённые углы), **без поля названия**. Подписи — из `entities/section`
  (`ITEMS_SIZE_LABELS`/`TRANSFORM_LABELS`/`SLIDE_TITLE_LOCATION_LABELS`). Каждое изменение поля
  применяется **мгновенно** через `updateSectionSettings` (instant-apply, отдельной кнопки нет).
- `FormGroupTitle` «Плейлисты раздела» + закреплённая строка «Избранные» (`MyPlaylistsFavoritesRow`),
  ниже — drag-список остальных плейлистов.

- **Обычный режим:** drag выключен — `MyPlaylistsDragList` получает `isDraggingEnabled = false`,
  поэтому `onLongPress`, активирующий `drag`, не прокидывается, а тап по строке навигирует.
- **Режим редактирования:** drag включён всегда (long-press тянет строку целиком, native `drag` из
  `renderItem`), тап по строкам (включая «Избранные») **не** навигирует. Перестановка меняет
  **локальную копию** порядка (`localOrderIds`), атом `myPlaylistsAtom` не трогается. «Сохранить»
  один раз коммитит итог через `reorderMyPlaylists` (полный порядок: `favorites` + локальный порядок;
  сущность пинит «Избранные» первыми) и выходит из режима. Уход из режима без сохранения (повторный
  тап по карандашу) или уход с экрана (`useFocusEffect` cleanup) локальную копию порядка
  отбрасывает; настройки оформления при этом сохраняются.

Пока идёт редактирование, порядок строк строится функцией `sortByLocalOrder`
(`src/pages/my-playlists/lib/sortByLocalOrder.ts`; id вне локального порядка — конкурентно
добавленный плейлист — уезжают в конец); после сохранения источником истины снова становится
`myPlaylistsAtom`. «Избранные» рендерятся только отдельной строкой и в drag-списке не дублируются,
запиннены первыми и не перетаскиваются. `onDragEnd` отдаёт итоговый порядок id; в режиме
редактирования он пишется в локальный state, а не в атом. `onDragEnd` исполняется на JS-потоке
(gesture-handler прокидывает завершение без вызова JS из worklet), поэтому `scheduleOnRN`
не требуется. В режиме редактирования drag-список рендерится всегда (даже когда локальных
плейлистов нет) — его `listHeader` несёт форму оформления и «Избранные», `listEmpty` — пустое
состояние.

`artworkIcon` — опциональный слот `SliderItemsElement` (`src/shared/ui/slider/slider-item/`):
при наличии обложка не рендерится, вместо неё — нода поверх тематической подложки
(`currentTheme.surface`). API обратной совместимости: обычные слайдеры без `artworkIcon` не
затрагиваются.

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
