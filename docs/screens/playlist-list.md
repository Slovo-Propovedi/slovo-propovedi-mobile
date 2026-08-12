# Экран «Список плейлистов секции»

**Маршрут:** `/listen/playlist-list?playlists=<PlaylistData[] JSON>&title=<строка>`
**Файлы:** `app/(tabs)/listen/playlist-list.tsx` → `export { PlaylistListScreen as default }` из `pages/playlist-list`
**Статус:** готов

## Что делает

Вертикальный список плейлистов конкретной секции. Открывается по тапу на заголовок секции на главном экране «Слушать».

## Что показывается

- Схлопывающаяся шапка с заголовком секции (`useCollapsingHeader` из `src/pages/playlist-list/lib/useCollapsingHeader.ts` + `useCollapsingNavbarDriver` из `shared/ui/collapsing-navbar-driver`).
- Вертикальный список плейлистов — `PlaylistListItem` (`src/pages/playlist-list/ui/PlaylistListItem.tsx`): обложка, название, описание (одна строка каждое).

## Откуда данные

- Параметры маршрута `playlists` и `title` (`useLocalSearchParams`), `playlists` парсится через `getParseJsonWithSchema(playlistsArraySchema)`; при ошибке — пустой массив.

## Куда можно перейти

- Тап на плейлист → `/listen/playlist?playlist=<JSON PlaylistData>` (`handlePlaylistPress` → `router.push`).

## Состояния

- Загрузка: данные приходят из параметра маршрута (загрузка отсутствует).
- Пусто: `ListEmptyComponent` — «Нет плейлистов».
- Офлайн: недоступен (данные передаются из секции, уже загруженной на главном экране).
- Ошибка: некорректный JSON → пустой список.

## Связанные документы

- [screens/listen.md](./listen.md)
- [screens/playlist.md](./playlist.md)
