# Экран «Результаты поиска»

**Маршрут:** `/listen/search-results?type=<sermons|playlists|preachers>&query=<строка>`
**Файлы:** `app/(tabs)/listen/search-results.tsx` → `export { SearchResultsScreen as default }` из `pages/search-results`
**Статус:** готов

## Что делает

Полный список результатов поиска по одной группе («Проповеди» / «Плейлисты» / «Проповедники»). Открывается тапом по заголовку группы в компактном сгруппированном списке результатов на главном экране «Слушать» (см. [listen.md](./listen.md) → «Поиск»). В отличие от компактной выдачи на «Слушать» (до 4–5 строк на группу), здесь грузится **весь** список, который отдаёт сервер (лимиты 100).

## Что показывается

- Плоский вертикальный список строк (не карточки), разделённых тонким сепаратором `ResultsListSeparator` (`src/pages/search-results/ui/ResultsListSeparator.tsx`): высота 1px, цвет `currentTheme.surface`, горизонтальный отступ `INDENTS.medium`.
- Тип строки зависит от `type`:
  - `sermons` → `SermonResultRow` (`src/pages/search-results/ui/SermonResultRow.tsx`) на `TracksListItem` из `entities/track-list`: обложка, заголовок, сабтайтл `sermonSubtitle` (проповедник + книга/глава/стих), бейдж кэша (`useTrackItemCache`). `isPlaying` всегда `false` — строка не отражает текущее воспроизведение (в отличие от строк на «Слушать», здесь нет полосы прогресса прослушивания).
  - `playlists` → `SearchPlaylistRow` (`src/features/sermon-search/ui/SearchPlaylistRow.tsx`) на `ListItemBase`: artwork, название, описание.
  - `preachers` → `SearchPreacherRow` (`src/features/sermon-search/ui/SearchPreacherRow.tsx`) на `ListItemBase` только с именем, без обложки.
- Список рендерит `ResultsList` (`src/pages/search-results/ui/ResultsList.tsx`) — `FlatList` с `keyboardDismissMode='on-drag'`, `keyboardShouldPersistTaps='handled'` и нижним отступом `tabBarHeight + PLAYER_SIZES.miniPlayerHeight` (последний элемент очищается от таб-бара и мини-плеера).

## Откуда данные

- Параметры маршрута валидируются оборонительно в `parseSearchResultsParams` (`src/pages/search-results/lib/parseSearchResultsParams.ts`): `type` обязан быть одним из `sermons` / `playlists` / `preachers`, `query` — непустая строка (обрезается `trim`). Любое несоответствие → функция возвращает `undefined`, и экран рендерит `null` (шапка/заголовок тоже не ставятся).
- `useSearchResults(type, query)` (`src/pages/search-results/lib/useSearchResults.ts`) при монтировании **всегда** запрашивает полный список из сети (network-first), с защитой от гонок (`cancelled`-флаг в `useEffect`); офлайн-фолбэк — per-query кэши фичи поиска (`src/features/sermon-search/lib/searchSources.ts`):
  - `sermons`: `sermonsApi.getSermons().sermonControllerFindAll({ search: query, take: 100 })` → `fetchSermonResults(query, 100)`; фолбэк при ошибке сети — `getCachedSearchResults(query)` (ключ `cachedSermonSearch:q:<query>`).
  - `playlists`: `playlistsApi.getPlaylists().playlistControllerFindAll({ limit: 100, search: query })` → `fetchPlaylistTitleMatches(query, 100)`; фолбэк — `getCachedPlaylistSearch(query)` (ключ `cachedPlaylistSearch:q:<query>`).
  - `preachers`: производные **клиент-сайд** от тех же 100 проповедей — `collectMatchingPreachers(result.data, query)` (`src/features/sermon-search/lib/composeSearchResults.ts`): уникальные `artist` найденных проповедей, чьё имя содержит запрос (case-insensitive), в порядке первого появления. Отдельного сетевого запроса нет.
- Загруженный результат пишется обратно в общий per-query кэш (`persistSermonSearchResults` / `persistPlaylistSearchResults`) — только если данные пришли из сети (`fromNetwork`), fire-and-forget.

## Заголовок и кнопка «Назад»

- Шапка включена (`headerShown: true`, `title: ''` в `app/(tabs)/listen/_layout.tsx`). Динамический заголовок ставит сам экран через `useHeaderTitle` (`src/shared/routing/useHeaderTitle.ts`, обёртка над `navigation.setOptions`) и `buildSearchResultsTitle` (`src/pages/search-results/lib/searchResultsTitle.ts`): **«Проповеди "<q>"»**, **«Плейлисты "<q>"»**, **«Проповедники "<q>"»** (тип подставляется из валидированного `type`, `<q>` — обрезанный `query`).
- Кнопка «Назад» — общий `HeaderBackButton` стека «Слушать» (`headerLeft` в `app/(tabs)/listen/_layout.tsx`), фолбэк `/listen` (при отсутствии истории `router.replace('/listen')`).

## Куда можно перейти

- `sermons`: тап по строке запускает воспроизведение (перехода нет) — `usePlayNewSermon({ playlist: resolvePlaylist(sermon), sermon })` (`entities/player` + `resolvePlaylist` из `features/sermon-search`).
- `playlists`: тап → `/listen/playlist?playlist=<id плейлиста>` (`router.push`; полный `PlaylistData` экран плейлиста резолвит сам).
- `preachers`: тап → `/listen/search-results?type=sermons&query=<имя проповедника>` — открывает уже полный список проповедей этого проповедника.

## Состояния

- Загрузка: скелетон группы `SearchGroupedResults.GroupSkeleton` (Composition API) с `rowKind='track'` для `sermons` и `'list'` для остальных типов — рендерится, пока `isLoading`.
- Пусто: `EmptyState` «Ничего не найдено» (`ListEmptyComponent` в `ResultsList`).
- Офлайн: per-query кэш поиска (`cachedSermonSearch:q:<query>` / `cachedPlaylistSearch:q:<query>`); при отсутствии кэша — пустое состояние. UI-индикатора источника данных нет (см. [debt.md](../debt.md)).
- Ошибка сети: `console.error` в `searchSources.ts`, затем фолбэк на кэш; ошибки не пробрасываются (функции `fetch*` не реджектят).
- Невалидные параметры (`type` не из списка, пустой `query`, массив вместо строки): экран рендерит `null`.

## Связанные документы

- [screens/listen.md](./listen.md) — компактная выдача поиска и переход «показать все»
- [features/navigation.md](../features/navigation.md)
- [contracts/storage.md](../contracts/storage.md)
