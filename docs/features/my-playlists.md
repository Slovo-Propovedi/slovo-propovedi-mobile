# Локальные плейлисты («Мои плейлисты»)

Домен локальных (пользовательских) плейлистов, его секция на экране «Слушать» (только чтение) и экран редактирования порядка `/listen/my-playlists`.

**Файлы:**

- `src/entities/playlist/model.ts` — тип, схема, атом, гидратация, reorder
- `src/entities/playlist/localPlaylists.ts` — `LocalPlaylistData`, zod-схема, `FAVORITES_PLAYLIST`
- `src/entities/playlist/localPlaylistMembership.ts` — `togglePlaylistSermon` (снапшоты, лимит `MAX_CUSTOM_PLAYLIST_SERMONS`)
- `src/entities/playlist/createLocalPlaylist.ts` — создание локального плейлиста (id-only, пинится после «Избранных»)
- `src/entities/playlist/renameLocalPlaylist.ts` — переименование (read-modify-write по id)
- `src/entities/playlist/deleteLocalPlaylist.ts` — удаление («Избранные» защищены)
- `src/entities/playlist/localSectionSettings.ts` — `LocalSectionSettings`, zod-черновик, дефолт, `normalizeSectionSettings`, ключ `MY_PLAYLISTS_SECTION_SETTINGS`
- `src/entities/playlist/localSectionSettingsStorage.ts` — единственный путь записи настроек оформления
- `src/entities/playlist/sectionSettingsModel.ts` — атом `sectionSettingsAtom`, `loadSectionSettings`, `updateSectionSettings` (коммит атома), `persistSectionSettings` (запись в хранилище)
- `src/entities/playlist/lib/readStoredMyPlaylists.ts` — чтение/гидратация плейлистов из AsyncStorage
- `src/entities/playlist/lib/readStoredSectionSettings.ts` — чтение/гидратация настроек оформления
- `src/entities/playlist/lib/sanitizeLocalPlaylistSermon.ts` — санитизация снапшота проповеди
- `src/entities/playlist/lib/useCreateLocalPlaylist.ts` — общий хук формы создания (название, `canSubmit`, гидратация, защита от двойной отправки)
- `src/entities/playlist/lib/useFavoriteSermon.ts` — хук `useFavoriteSermon` (состояние «в избранном» + переключатель для строк и полноэкранного плеера; наружу — через `entities/playlist` и `@x`-точку `entities/playlist/@x/track-list`)
- `src/entities/playlist/lib/customPlaylistShare.ts` — `buildCustomPlaylistSearchParams`/`parseCustomPlaylistParams` (обе формы `sermons`: packed и csv) + `deriveCustomPlaylistId` (детерминированный `custom-<16 hex>` id из title и упорядоченных `sermonIds`)
- `src/entities/playlist/lib/sermonIdPacking.ts` — `packSermonIds`/`unpackSermonIds` (base64url-упаковка UUID, 16 байт на id)
- `src/entities/playlist/index.ts` — публичный API (`FAVORITES_PLAYLIST`, `myPlaylistsAtom`, `loadMyPlaylists`, `createLocalPlaylist`, `useCreateLocalPlaylist`, `renameLocalPlaylist`, `deleteLocalPlaylist`, `reorderMyPlaylists`, `reorderLocalPlaylistSermons`, `togglePlaylistSermon`, `useFavoriteSermon`, `sectionSettingsAtom`, `loadSectionSettings`, `updateSectionSettings`, `persistSectionSettings`, `LocalSectionSettings`)
- `src/entities/playlist/reorderLocalPlaylistSermons.ts` — перестановка проповедей внутри локального плейлиста (снапшоты `sermons` + авторитетные `sermonIds`)
- `src/features/local-playlist-form/` — модалка создания (`CreateLocalPlaylistModal`), её экранная обёртка `useCreateLocalPlaylistForm` (закрытие + переход на созданный плейлист), диалог удаления (`LocalPlaylistDeleteDialog`) и хук `useLocalPlaylistDelete`
- `src/pages/playlist-edit/` — экран редактирования локального плейлиста (переименование + порядок проповедей + удаление)
- `src/entities/section/lib/mapItemsSize.ts`, `mapTransform.ts`, `mapWhereIsTitleLocated.ts` — мапперы полей оформления секции в `SliderItemSize`/`SliderItemTransform`/`WhereIsSlideTitleLocated` (перенесены из `pages/listen/lib`, чтобы их переиспользовали и слайдер, и экран «Мои плейлисты»); реэкспорт через `entities/section`
- `src/pages/listen/ui/MyPlaylistsSlider.tsx` — секция «Мои плейлисты» на «Слушать»: рендерится через общий `Slider` с параметрами из `sectionSettingsAtom`, завершающая карточка «Создать»
- `src/pages/my-playlists/ui/MyPlaylistsScreen.tsx` — экран «Мои плейлисты» — владелец режима редактирования и модалки создания
- `src/pages/my-playlists/ui/MyPlaylistsAppearanceForm.tsx` — блок «Оформление» режима редактирования (instant-apply)
- `src/pages/my-playlists/ui/MyPlaylistsEditHeader.tsx` — шапка режима редактирования: «Оформление» + «Плейлисты раздела»
- `src/pages/my-playlists/ui/MyPlaylistsNormalView.tsx` — просмотровый режим экрана (общий виджет `PlaylistList`: строка «Избранные» первым элементом, «Создать плейлист» — футером под списком)
- `src/widgets/playlist-list/` — тело списка плейлистов, общее для серверного списка секции и просмотрового режима «Мои плейлисты» (`PlaylistList`, `PlaylistListItem`, `PlaylistListSeparator`, `PlaylistListItemData`)
- `src/pages/my-playlists/ui/MyPlaylistsCreateRow.tsx` — завершающая строка «Создать плейлист» (футер списка)
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
  `src/entities/playlist/lib/sanitizeLocalPlaylistSermon.ts`): `playlists` проецируются в
  лёгкие рефы `{ artwork, id, title, sermons: [] }` (членства проповеди нужны UI, например
  выбору «Где продолжить»; очередь проповедей не хранится), `artwork` нормализуется в
  `null | string` — снапшот обязан проходить схему при чтении.
- `sermonIds` — авторитетный список id-участников плейлиста. `togglePlaylistSermon` ведёт его
  **напрямую** (дописывает id при добавлении, фильтрует при удалении) и **не** выводит заново из
  `sermons`: у импортированного из ссылки плейлиста (`{ sermonIds: ['a','b','c'], sermons: [] }`)
  снапшотов может не быть, и вывод из `sermons` терял бы таких участников. `sermons` — снапшот-подмножество
  (для офлайн-рендера/проигрывания). При чтении `normalizeLocalPlaylist` берёт stored `sermonIds` как
  авторитетные (дедуплицирует, отбрасывает пустые строки) и оставляет в `sermons` только снапшоты
  участников; список выводится из снапшотов лишь у legacy-записи без `sermonIds`.
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
[contracts/storage.md](../contracts/storage.md)). Legacy-записи, хранившие только `sermonIds`,
читаются без падения: `sermonIds` сохраняются как авторитетный список, `sermons` у них пустой —
рендерить по одним id нечем (UI резолвит их из каталога).

`loadMyPlaylists` (Reatom-экшен, вызывается из `MyPlaylistsSlider` и `MyPlaylistsScreen` при монтировании,
а также экраном плейлиста `PlaylistScreen` при монтировании — чтобы reload/холодный старт по
`?playlist=custom-…` нашёл локальный плейлист, пока `notFound` гейтится `myPlaylistsLoadedAtom`;
чтение вынесено в `src/entities/playlist/lib/readStoredMyPlaylists.ts`):

1. читает и валидирует `myPlaylists`, нормализует каждую запись (`normalizeLocalPlaylist` —
   stored `sermonIds` авторитетны, `sermons` — снапшот-подмножество; ids выводятся из снапшотов
   только у legacy-записи без `sermonIds`);
2. при **отсутствии** ключа (`empty`) — засеивает `[FAVORITES_PLAYLIST]` и персистит сид
   (внутренний `persistMyPlaylists` через `setCachedJson`);
3. при **невалидном/битом JSON** (`invalid`/`error`) — только `console.warn` и сид
   «Избранного» в памяти: **хранилище не перезаписывается**, чтобы одна битая запись не
   стёрла все плейлисты; восстановление произойдёт при следующей валидной записи
   (reorder/toggle);
4. приводит список к инварианту «Избранные первые» и пишет в `myPlaylistsAtom`. Инвариант
   **пинит stored-«Избранное»** (`withFavoritesFirst`): его снапшоты переживают гидратацию,
   а пустая константа `FAVORITES_PLAYLIST` — лишь фолбэк, когда записи нет.

Конкурентные вызовы `loadMyPlaylists` на одном контексте делят одно чтение (per-ctx in-flight
dedupe): они получают один и тот же снимок хранилища, поэтому чтение, начатое до
`createLocalPlaylist`, не перезаписывает его коммит после завершения. Запись снимается по
завершении чтения, поэтому последовательные вызовы (pull-to-refresh) по-прежнему перечитывают
хранилище.

Отказ самого хранилища (reject `AsyncStorage.getItem`/`setItem`, например сломанный
нативный модуль) не пробрасывается наружу: экшен вызывается fire-and-forget
(`void loadPlaylists()` в `MyPlaylistsSlider` и `MyPlaylistsScreen`), поэтому ошибка логируется
(`console.error`) и трактуется так же, как невалидные данные — как отсутствие
`myPlaylists`, атом получает засеянный `[FAVORITES_PLAYLIST]`, UI работает.

Для текущей итерации список читается, переупорядочивается и **полностью
редактируется**: создание, переименование и удаление плейлистов — мутирующие
экшены сущности (`createLocalPlaylist`, `renameLocalPlaylist`,
`deleteLocalPlaylist`), а принадлежность проповеди переключается экшеном
`togglePlaylistSermon` (см. [add-to-playlist.md](./add-to-playlist.md)). Экшен
`togglePlaylistSermon` принимает **полный снапшот проповеди** (`SermonShape`), а не
только id: при добавлении в плейлист дописывается id в `sermonIds` (с
дедупликацией) и кладётся санитизированный снапшот в `sermons`, при удалении —
фильтруются оба списка. `sermonIds` ведётся напрямую (не выводится из
`sermons`), поэтому id-only участники импортированного плейлиста не теряются при
добавлении/удалении. Добавление сверх `MAX_CUSTOM_PLAYLIST_SERMONS`
(200, бюджет share-ссылки) — no-op с исходом `limit-reached`: атом и хранилище не
трогаются, а лимит показывается в модалке «Добавить в плейлист»: в одиночном
режиме строка такого плейлиста отключена с подсказкой о лимите, в батч-режиме
добавление останавливается и показывается тост «В плейлисте максимум 200
проповедей» (см. [add-to-playlist.md](./add-to-playlist.md)). Удаление при
заполненном плейлисте не блокируется. Если удаляется проповедь, которая сейчас
играет из этого плейлиста, меню строки и меню плеера не закрывают плеер само (эти
поверхности зовут `togglePlaylistSermon(..., { suppressPlayerReset: true })`):
сначала предлагается продолжить в другом плейлисте (см. [player.md](./player.md) →
«Удаление играющей проповеди — выбор плейлиста для продолжения»), и только отказ
закрывает плеер (`resetPlaybackAction`). Сердечко избранного тоже подавляет сброс
(`suppressPlayerReset: true` — закладочная семантика), поэтому снятие из
«Избранных» никогда не закрывает плеер. Модалка добавления идёт без опции.
Прочие записи — сид «Избранного» при первом чтении, сохранение нового порядка при
reorder, персист принадлежности при toggle и CRUD-мутации.

### Точки переключения избранного

Избранное переключается из трёх мест. Сердечки идут общим хуком
`useFavoriteSermon` (`src/entities/playlist/lib/useFavoriteSermon.ts`), который читает
`isFavorite` из `myPlaylistsAtom` по `sermon.id` и зовёт
`togglePlaylistSermon(ctx, FAVORITES_PLAYLIST.id, sermon, !isFavorite, { suppressPlayerReset: true })`:

- **Сердечко строки** (`FavoriteSermonButton`, `entities/track-list`): слева от «⋯» во всех
  списках проповедей — компактная выдача поиска и экран результатов, история, офлайн, экран
  плейлиста и шторка очереди плеера. Строка получает снапшот пропсом `sermon`, поэтому списки
  без снапшота (id-only участники) сердечка не показывают (см. [track-list.md](./track-list.md)).
- **Сердечко полноэкранного плеера** (`PlayerMenuButtons`, цель онбординга
  `player-fullscreen.favorite`): то же `useFavoriteSermon` для текущей проповеди, рядом с
  кнопками «＋ Добавить в плейлист» и «⋮ Меню» (см. [player.md](./player.md)).
- **Модалка «Добавить в плейлист» и контекст-меню строк**: чекбокс «Избранные» (см.
  [add-to-playlist.md](./add-to-playlist.md)).

Клик по сердечку не открывает модалку и не просит подтверждения: проповедь сразу попадает в
«Избранные» или убирается оттуда. Снятие избранного **никогда не закрывает плеер**: хук
передаёт `suppressPlayerReset: true` (сердечко — закладка, а не удаление из очереди), поэтому
проповедь, играющая из самих «Избранных», продолжает играть, а очередь переживает удаление.

**Принятый разрыв — лимит.** Исход `limit-reached` (в «Избранных» уже
`MAX_CUSTOM_PLAYLIST_SERMONS` = 200 проповедей) сердечко молча игнорирует: проповедь не
добавляется, но ни тост, ни диалог не показываются. Модалка добавления тот же лимит
показывает (отключённая строка и тост батч-режима). Записано в [debt.md](../debt.md) →
«Локальные плейлисты».

### Создание, переименование, удаление

`createLocalPlaylist(ctx, { id?, title, sermonIds })` создаёт плейлист и **пинит его
сразу после «Избранных»** (`withFavoritesFirst`). Без `id` генерируется
`generateUuid` — **UUIDv7** (`v7` из `uuid`): таймстамп в старших битах (id сортируются
по времени создания) и единый формат с серверными id; `rng` — `crypto.getRandomValues`,
а при его отсутствии под Hermes — `Math.random` (уникальность важнее криптостойкости,
генератор не бросает). Импорт из ссылки передаёт детерминированный
`deriveCustomPlaylistId` (см. [deep-links.md](./deep-links.md)). Дедуп импорта идёт
**по содержимому**, а не по производному id: `useCustomPlaylistImport` переиспользует
локальный плейлист только при совпадении `title` и **порядка** `sermonIds`
(неизменённая ссылка → тот же плейлист), а переименованный/изменённый не перехватывает
повторный клик — создаётся новый. Если производный id уже занят другим плейлистом
(переименованная/изменённая копия держит исходный content-id), `id` не передаётся —
`createLocalPlaylist` сгенерирует uuid, поэтому два плейлиста с одним id не появятся.
Снапшоты проповедей не создаются: `sermons: []`, переданные `sermonIds` — id-only
(импорт из ссылки несёт только id, снапшоты добавляются позже через
`togglePlaylistSermon`). Порядок операций тот же, что у `reorderMyPlaylists`:
чтение атома → `withFavoritesFirst` → коммит `myPlaylistsAtom` → `persistMyPlaylists`;
отказ записи логируется, атом остаётся закоммиченным.

**Форма создания — общий хук.** Состояние формы (название, `canSubmit`,
`submitting`, `submit`) живёт в `useCreateLocalPlaylist`
(`src/entities/playlist/lib/useCreateLocalPlaylist.ts`), а не в фиче. Перед
созданием хук гидратирует `myPlaylistsAtom`, если он ещё не загружен
(`loadMyPlaylists` по `myPlaylistsLoadedAtom`), создаёт плейлист без проповедей
(`createLocalPlaylist({ title: trimmed, sermonIds: [] })`), блокирует повторную
отправку до завершения текущей и отдаёт результат в `onCreated`. Закрытие формы и
навигация — забота вызывающего кода: модалка создания уводит на созданный
плейлист, а встроенная форма в модалке «Добавить в плейлист» просто возвращается
к списку (см. [add-to-playlist.md](./add-to-playlist.md) → «Создание плейлиста из
модалки»).

`renameLocalPlaylist(ctx, playlistId, title)` и `deleteLocalPlaylist(ctx, playlistId)` —
read-modify-write по id с тем же путём персиста. **«Избранные» защищены**: попытка
переименовать или удалить `FAVORITES_PLAYLIST.id`, как и неизвестный id, — no-op
(возврат текущего списка). Название нормализуется (trim) на границе формы, а не в
экшене. `deleteLocalPlaylist` фильтрует запись и снова применяет `withFavoritesFirst`.

### Переупорядочивание

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
`transform` (`high`/`middle`/`short`), `whereIsSlideTitleLocated` (`on`/`under`/`bothOnAndUnder`; `bothOnAndUnder` —
заголовок и описание внизу карточки, заголовок над описанием), `itemsRows` (`null | number`), `isDescriptionTitleOnSlideLarge` (показывать
описание плейлиста на карточке), `borderRadius` (скруглённые углы карточек). Дефолт
(`DEFAULT_SECTION_SETTINGS`): `small` / `middle` / `under` / `null` / `false` / `true` — скруглённые
углы включены, описание на карточке скрыто.

Ключ `myPlaylistsSectionSettings` принадлежит сущности. Хранилище недоверенное: чтение — через
`getCachedJsonResult` + `sectionSettingsDraftSchema` (`lib/readStoredSectionSettings.ts`), которое различает
отсутствие ключа (`empty`) и провал парсинга (`invalid`/`error`) — та же политика, что у `myPlaylists`:

1. при **отсутствии** ключа — дефолт персистится (`persistSectionSettings`);
2. при **невалидном/битом JSON** — `console.warn` и дефолт в памяти, **хранилище не перезаписывается**
   (одна битая запись не должна стереть выбранное оформление);
3. все поля опциональны — частичная/legacy-запись дочитывается дефолтом (`normalizeSectionSettings`).

`loadSectionSettings` — гидратация (вызывается из `MyPlaylistsSlider` и `MyPlaylistsScreen` fire-and-forget,
как `loadMyPlaylists`). `updateSectionSettings(ctx, patch)` — **мгновенное применение только в памяти**:
коммитит объединённые настройки в `sectionSettingsAtom` и **не пишет в хранилище**. Запись отделена
намеренно: поле «Строк» меняется на каждое нажатие клавиши. `persistSectionSettings(ctx)` читает
актуальное значение атома и пишет его в хранилище (схлопывает серию изменений в одну запись последнего
состояния); отказ записи логируется, атом уже закоммичен (политика деградации как у `reorderMyPlaylists`).

Форма оформления (`MyPlaylistsAppearanceForm`) на каждое изменение поля вызывает `updateSectionSettings`
(атом — сразу), а `persistSectionSettings` планирует через `useDebounce` (500 мс, trailing) —
`lib/useScheduleSectionSettingsPersist.ts`. Отложенная запись **флашится** на blur поля «Строк» и на
размонтирование формы (`flushOnUnmount`), поэтому настройки переживают перезапуск без отдельной кнопки
«Сохранить» и без записи на каждый символ. Локальный текст поля «Строк» синхронизируется с внешним
изменением `settings.itemsRows` (React-паттерн «adjust state during render»), не перетирая уже набранное
совпадающее значение.

## UI

### Секция «Мои плейлисты» на экране «Слушать»

`MyPlaylistsSlider` (`src/pages/listen/ui/MyPlaylistsSlider.tsx`) рендерится после
`DynamicSectionsSlider` на экране «Слушать» — завершающая секция. Заголовок — «Мои плейлисты»
(тап → отдельный экран `/listen/my-playlists`, `navigateToMyPlaylists`). Секция рендерится через
общий `Slider` (`shared/ui`): карточки — `SliderItemsElement`, «Избранные» — первая карточка с
`artworkIcon` (сердце `Ionicons 'heart'` цвета `currentTheme.primary`, размер из
`getSliderCardLayout(itemsSize, getSliderLayoutViewport()).cardWidth * AVATAR_CONTENT_SIZE_RATIO` (`shared/ui`); иконка следует за шириной карточки, а геометрия ограничена cap `430`, поэтому на больших экранах не раздувается). Собственных боковых отступов секция не добавляет — все инсеты живут внутри `Slider` (см. [screens/listen.md](../screens/listen.md) → «Что показывается»): `itemsSize` задаёт ширину карточки по общей модели (XLarge — 77% базы, Large — 50%, Middle/Small — прежний контракт), карточки и заголовок стоят на линии покоя 24. Остальные локальные плейлисты — обычные карточки с
`title = playlist.title` **без `artworkIcon`**: без обложки общий `SliderItem` сам рисует
плитку-букву (`PlaylistLetterAvatar`) поверх блюра. Тап по карточке навигирует на
`/listen/playlist?playlist=<id>`.
Параметры отображения берутся из `sectionSettingsAtom` и прогоняются через мапперы
`entities/section` (`mapItemsSize`/`mapTransform`/`mapWhereIsTitleLocated`):
`itemsRows`/`itemsSize`/`transform`/`whereIsSlideTitleLocated`/`isDescriptionTitleOnSlideLarge`/
`borderRadius` (`borderRadius` уходит в `Slider` пропом, а не в прозрачную обёртку).
Редактирования порядка в секции **нет** — секция только читает `myPlaylistsAtom` и
`sectionSettingsAtom` и гидратирует их (`loadMyPlaylists`, `loadSectionSettings`) при монтировании.
**Завершающая карточка «Создать»** (та же геометрия, `artworkIcon` — плюс `Ionicons 'add'`)
открывает модалку создания; остальные карточки навигируют. Элемент секции — размеченное
объединение `MyPlaylistsItem` (`{ kind: 'create' } | { kind: 'playlist' }`), поэтому тап
диспетчеризуется без sentinel-id.

**`artworkIcon` и заголовок:** при заданном `artworkIcon` обложка не рендерится — карточка
получает тематическую подложку (`currentTheme.surface`). Заголовок карточки — статичный,
с обрезкой троеточием: под карточкой до 2 строк, всегда 16px; на карточке — одна строка,
шрифт растёт с размером карточки (16/18/20/24, в both-режиме 14/16/18/20). Он следует
настройке `whereIsSlideTitleLocated`: при `on`
рендерится оверлеем по центру подложки, при `under` — подписью под карточкой во всю ширину
карточки, без боковых отступов, при `bothOnAndUnder` — внизу подложки: заголовок и описание
(если включено) лежат в одной тёмной полупрозрачной плашке внизу карточки (вертикальные/горизонтальные
отступы middle, зазор между строками minimal), тексты без собственных плашек. Описание плейлиста
(`isDescriptionTitleOnSlideLarge`) на icon-карточках
не показывается — у них нет обложки, к низу которой оно прижимается. Карточки локальных
плейлистов (`artworkIcon` не задан) следуют обеим настройкам, а при `whereIsSlideTitleLocated === on`
буква плитки скрывается (`showLetter={false}`) — иначе она перекрывала бы заголовок. Впрочем
локальные плейлисты (`LocalPlaylistData`) описания не хранят, поэтому блок описания на карточке
рендерится только у серверных плейлистов (`renderSection`).

**Типографика карточки:** заголовок под карточкой — до 2 строк, всегда 16px; заголовок на
карточке — одна строка, шрифт растёт с размером карточки (16/18/20/24, в both-режиме
14/16/18/20). Начертание заголовка карточки одинаково во всех режимах (`on`, `under`,
`bothOnAndUnder`) — полужирное. Описание — 10/12/14/14, строки 1/2/2/3 с поправкой на высоту карточки
(`short` −1, `high` +1, минимум 1, максимум 4); описание всегда мельче заголовка. Заголовок на
карточке без плашки получает размытую тень-ореол контрастного тона (белую для тёмного текста,
чёрную для светлого) — для читаемости на обложке близкого тона; на плашках и под карточкой тени нет.

### Экран «Мои плейлисты» (админ-подобная форма оформления + порядок)

`MyPlaylistsScreen` (`src/pages/my-playlists/ui/MyPlaylistsScreen.tsx`) — владелец режима
редактирования; подробнее — [screens/my-playlists.md](../screens/my-playlists.md). **Обычный
режим** (`MyPlaylistsNormalView`) теперь переиспользует то же тело списка, что серверный список
секции — общий виджет `PlaylistList` (`src/widgets/playlist-list/`): схлопывающийся контентный
заголовок, карточные строки (`ListItemBase` card-вариант, плитка обложки
`LIST_ITEM_CARD_ARTWORK_SIZE`) и разделители. Первым элементом списка идёт «Избранные» — её
обложку подменяет маркер-сердце `MyPlaylistsMarkerAvatar` (`Ionicons 'heart'`, размер
`size * AVATAR_CONTENT_SIZE_RATIO`); ниже — локальные плейлисты; **завершающей строкой футера
списка** — «Создать плейлист» (`MyPlaylistsCreateRow`, `listFooter`), то есть под плейлистами.
Нативная шапка в обычном режиме прозрачна (большой заголовок рисует список), а карандаш остаётся
в `headerRight`. Список резервирует нижний отступ под плавающий мини-плеер и таб-бар
(`tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low`, как в `PlaylistTrackList`).

**Режим редактирования намеренно НЕ унифицирован с серверным списком.** На время правки он
остаётся админ-подобной формой (`MyPlaylistsEditHeader` + `MyPlaylistsAppearanceForm`) поверх
`MyPlaylistsDragList` — вертикального `DraggableFlatList` без заголовка-схлопывания: там нужны
drag-to-reorder, кнопки удаления и живые настройки оформления, которых у серверного списка нет.
`DraggableFlatList` рендерит собственный контейнер без `flex` — на react-native-web он
растягивается по контенту, и список не скроллится (низ обрезается `body { overflow: hidden }` из
`public/index.html`); поэтому контейнеру задан `containerStyle={styles.listContainer}` с `flex: 1`
(как у `DraggableFlatList` админки, см. [admin.md](./admin.md)). Горизонтальный отступ контента
(`contentContainerStyle.paddingHorizontal = INDENTS.medium`) задан на самом списке и покрывает и
шапку с «Избранными», и drag-строки — карточки выровнены по одной вертикали с «Избранными»
(раньше инсет несла только шапка `MyPlaylistsEditHeader`, а строки `renderItem` шли без отступа).

**Режим редактирования.** Перестановка строк включается **явно** — двумя состояниями, обычным и
редактирования, управляет локальный state `localOrderIds` (`null` — обычный режим; массив id —
открытый режим). Опции шапки собирает `useMyPlaylistsHeader`
(`src/pages/my-playlists/lib/useMyPlaylistsHeader.tsx`), действия рендерит `MyPlaylistsHeaderActions`
(`src/pages/my-playlists/ui/MyPlaylistsHeaderActions.tsx`): в обычном режиме `IconButton` с
карандашом (`Ionicons 'create-outline'`, `accessibilityLabel` «Изменить порядок»), в режиме
редактирования карандаш **скрывается** и остаётся только `IconButton` с галочкой (`checkmark`,
«Сохранить»). **Карандаш виден и активен в обычном режиме**, даже когда редактировать нечего (только
«Избранные») — в этом случае форма оформления всё равно доступна. Выйти из режима **без сохранения**
порядка можно только уходом с экрана (`useFocusEffect` cleanup; изменения оформления уже применены).

В режиме редактирования представление становится **админ-подобной формой** (шапка списка —
`MyPlaylistsEditHeader`):

- `FormGroupTitle` «Оформление» + `MyPlaylistsAppearanceForm` — те же поля, что у формы раздела в
  админке (`SelectField` ×3 → размер/высота/расположение заголовка, `FormField` «Строк» с
  `number-pad` и разбором через `parseItemsRows`, `CheckboxField` ×2 → «Описание на карточке» и
  «Скруглённые углы карточек»), **без поля названия**. Подписи — из `entities/section`
  (`ITEMS_SIZE_LABELS`/`TRANSFORM_LABELS`/`SLIDE_TITLE_LOCATION_LABELS`; в select расположения
  заголовка `on`/`under`/`bothOnAndUnder`). Каждое изменение поля
  применяется **мгновенно** через `updateSectionSettings` (instant-apply, отдельной кнопки нет).
- `FormGroupTitle` «Плейлисты раздела» + закреплённая строка «Избранные» (`MyPlaylistsFavoritesRow`),
  ниже — drag-список остальных плейлистов.

- **Обычный режим:** drag выключен — `MyPlaylistsDragList` получает `isDraggingEnabled = false`,
  поэтому drag-ручка не рендерится, а тап по строке навигирует.
- **Режим редактирования:** строки получают drag-ручку (`ListItemDragHandle`,
  `accessibilityLabel` «Переместить плейлист»), как строки админ-экранов раздела; перестановка
  стартует **только с ручки** (native `drag` из `renderItem`), long-press по телу строки ничего не
  делает, тап по строкам (включая «Избранные») **не** навигирует. Каждая строка несёт также кнопку
  удаления (корзина, `accessibilityLabel` «Удалить плейлист») — см. ниже. Перестановка меняет
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
(`currentTheme.surface`). Заголовок и `whereIsSlideTitleLocated` работают и на icon-карточках
(при `on` — оверлеем по центру, при `bothOnAndUnder` — внизу). Когда у карточки нет ни `artwork`, ни `artworkIcon`, `SliderItem` сам
рисует плитку-букву `PlaylistLetterAvatar` (дефолтная обложка под блюром + тематическая вуаль),
поэтому серверные секции и «Мои плейлисты» выглядят одинаково; при `whereIsSlideTitleLocated === on`
или `bothOnAndUnder` буква скрывается (`showLetter={false}`), чтобы не перекрывать заголовок. API обратной
совместимости: слайдеры с заданным `artwork`/`artworkIcon` не затрагиваются.

## Формы создания и экран редактирования

Фича `src/features/local-playlist-form/` держит модалку создания (паттерн — общий
`shared/ui/modal`, как у «Добавить в плейлист»):

- `CreateLocalPlaylistModal` — поле «Название» (`FormField`) + кнопка «Создать»,
  недоступная, пока название пустое/пробельное или пока создание в полёте
  (`submitting`). Состояние формы живёт в общем хуке
  `useCreateLocalPlaylist` (`entities/playlist`), а `useCreateLocalPlaylistForm`
  (`src/features/local-playlist-form/lib/useCreateLocalPlaylistForm.ts`) добавляет к
  нему закрытие модалки и переход на созданный плейлист. Тот же хук переиспользует
  встроенная форма в модалке «Добавить в плейлист» (см.
  [add-to-playlist.md](./add-to-playlist.md) → «Создание плейлиста из модалки»).
  По отправке (кнопка или Enter в поле):
  гидратация `myPlaylistsAtom` (`loadMyPlaylists`, если он ещё не загружен по
  `myPlaylistsLoadedAtom`), затем `createLocalPlaylist({ title: trimmed, sermonIds: [] })`,
  закрытие и переход на созданный плейлист (`/listen/playlist?playlist=<id>`). Гидратация
  перед созданием нужна, чтобы read-modify-write не шёл по сиду «Избранного» и не был
  перезаписан в полёте гидратации. Модалка открывается и из
  завершающей карточки секции «Слушать», и из строки «Создать плейлист» на экране
  «Мои плейлисты» (`MyPlaylistsCreateRow`, `ListItemBase` с плюсом, футером под
  списком плейлистов).

**Редактирование — отдельный экран** `/listen/playlist-edit?playlist=<id>`
(`src/pages/playlist-edit/`, см. [screens/playlist-edit.md](../screens/playlist-edit.md)),
а не модалка. Экран держит поле «Название» (предзаполнено текущим; «Сохранить» доступна
при непустом и **изменённом** названии либо изменённом порядке) и drag-список проповедей
**только для перестановки** (drag-ручка всегда видна, перестановка стартует только с ручки;
строки показывают бегущее однострочное название и подпись «проповедник · ссылка на Писание»
через `sermonSubtitle` из `entities/sermon`, как в админ-строках).
Сохранение вызывает `renameLocalPlaylist` и/или `reorderLocalPlaylistSermons` и `router.back()`.
Перед сохранением форма при необходимости гидратирует `myPlaylistsAtom`
(`loadMyPlaylists`, гейт по `myPlaylistsLoadedAtom`), чтобы read-modify-write не шёл
по негидратированному атому. Строки списка рендерит стабильный
`usePlaylistEditItemRenderer` (`useCallback`), поэтому длинный список не
перерисовывается на каждый символ в поле названия.
«Избранные» этой формой не редактируются: экшены защищают инвариант, а кнопка показывается
только для локального не-избранного плейлиста. Модалка создания монтируется только при
`visible`, поэтому её состояние (название) сбрасывается между открытиями.

**Удаление локального плейлиста — три точки входа, одна логика.** Подтверждение и вызов
`deleteLocalPlaylist` общие: `LocalPlaylistDeleteDialog` (`ConfirmDialog`) + хук
`useLocalPlaylistDelete` (`src/features/local-playlist-form/lib/useLocalPlaylistDelete.ts`),
который хранит id-кандидат и вызывает удаление только после подтверждения. Перед
удалением хук гидратирует `myPlaylistsAtom` (`loadMyPlaylists`), если он ещё не
загружен (`myPlaylistsLoadedAtom`), — иначе read-modify-write шёл бы по сиду и
мог быть перезаписан в полёте гидратации.

1. **Экран редактирования** (`src/pages/playlist-edit/`, кнопка «Удалить плейлист» в футере списка):
   после удаления — `router.back()`.
2. **Меню шапки экрана плейлиста** (`PlaylistHeaderMenu`): пункт «Удалить плейлист» (только для
   локального не-избранного плейлиста и только на экране — `isEditEnabled`; в шторке плеера нет);
   после подтверждения — закрытие меню и `router.back()`.
3. **Режим редактирования секции** (`MyPlaylistsScreen` + `MyPlaylistsRow`): кнопка удаления в
   каждой строке; после подтверждения удалённый id убирается из локальной копии порядка,
   с экрана не уходим.

«Избранные» защищены на всех уровнях: экшен игнорирует `FAVORITES_PLAYLIST.id`, а UI не
показывает удаление для «Избранного».

**Кнопка редактирования в шапке экрана плейлиста** (`PlaylistEditButton`,
`PlaylistHeaderActions`): карандаш (`Ionicons 'create-outline'`) слева от меню-кнопки,
виден **только** для локальных не-избранных плейлистов **и только когда вызывающий
включил `isEditEnabled`** (это делает шапка экрана плейлиста; шторка плеера
`PlaylistSheetMenu` его не включает, чтобы правка не уводила из шторки). Тап
**навигирует** на экран редактирования (`router.push('/listen/playlist-edit?playlist=<id>')`).

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

Примитивы резолва (`buildSermonIndex` + `buildLocalPlaylist`) живут в `entities/playlist`
(публичный API; тип-only ребро на `SectionData` — через `section/@x/playlist`) и
переиспользуются экраном редактирования: `usePlaylistDisplaySermons`
(`src/pages/playlist-edit/lib/`) отдаёт снапшоты как есть, а для id-only плейлиста
(импорт из ссылки «только по id») резолвит id по каталогу. Сохранение перестановки на
этом экране по-прежнему пишет только `sermonIds` (`reorderLocalPlaylistSermons`),
снапшоты не материализуются.

## Roadmap (следующая итерация — запланированная фича, не долг)

- **Добавление/удаление проповедей** в локальные плейлисты — «Избранное»
  и наполнение из контекст-меню уже реализованы (`togglePlaylistSermon` со снапшотами +
  модалка мультивыбора, см. [add-to-playlist.md](./add-to-playlist.md)); в этом пункте остаётся
  удаление/управление из самого экрана плейлиста, если понадобится.
- **Публикация локального плейлиста в глобальные** (админ-форма создания) — предзаполнение
  названием, id и **снапшотами** проповедей уже реализовано
  (`buildPublishSermonsParam` + `parsePublishSermonsParam`); пункт меню показывается только
  при админ-сессии (`canAccessAdmin`).

## Связанные документы

- [screens/listen.md](../screens/listen.md)
- [screens/my-playlists.md](../screens/my-playlists.md)
- [screens/playlist.md](../screens/playlist.md)
- [contracts/storage.md](../contracts/storage.md)
