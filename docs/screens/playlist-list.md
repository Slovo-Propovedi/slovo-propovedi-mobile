# Экран «Список плейлистов секции»

**Маршрут:** `/listen/playlist-list?sectionId=<строка>&title=<строка>`
**Файлы:** `app/(tabs)/listen/playlist-list.tsx` → `export { PlaylistListScreen as default }` из `pages/playlist-list`
**Статус:** готов

## Что делает

Вертикальный список плейлистов конкретной секции. Открывается по тапу на заголовок секции на главном экране «Слушать».

## Что показывается

- Схлопывающаяся шапка с заголовком секции (`useCollapsingHeader` из `src/pages/playlist-list/lib/useCollapsingHeader.ts` + `useCollapsingNavbarDriver` из `shared/ui/collapsing-navbar-driver`).
- Вертикальный список плейлистов — `PlaylistListItem` (`src/pages/playlist-list/ui/PlaylistListItem.tsx`): обложка через `CoverImage` (при отсутствии artwork — фолбэк иконкой приложения), название, описание (одна строка каждое).

## Откуда данные

Резолвинг плейлистов происходит в два этапа:

1. **Atom** (`dynamicSectionsAtom` из `entities/section`): поиск секции по `sectionId` — мгновенно, без сериализации/парсинга. Это основной путь, когда пользователь открывает список сразу после загрузки главного экрана.
2. **Холодный старт** (fallback): если atom пуст (приложение только запущено, секции ещё не загружены), экран показывает краткое состояние загрузки и запрашивает `getCachedSections()` из AsyncStorage. При нахождении — список рендерится. При отсутствии — центрированное сообщение «Секция не найдена».

Параметры маршрута: `sectionId` (строка, идентификатор секции) и `title` (строка, заголовок для шапки).

## Куда можно перейти

- Тап на плейлист → `/listen/playlist?playlist=<JSON PlaylistData>` (`handlePlaylistPress` → `router.push`).

## Состояния

- Загрузка: кратковременный спиннер при холодном старте (atom пуст, чтение кэша).
- Пусто: `ListEmptyComponent` — «Нет плейлистов».
- Секция не найдена: центрированное сообщение «Секция не найдена» (если ни atom, ни кэш не содержат секцию с нужным `sectionId`).
- Офлайн: работает из кэша (`getCachedSections()`), если atom пуст.

## Связанные документы

- [screens/listen.md](./listen.md)
- [screens/playlist.md](./playlist.md)
