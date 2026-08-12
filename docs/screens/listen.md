# Экран «Слушать» (главный)

**Маршрут:** `/listen` (стартовый после редиректа из `/` в `app/index.tsx`)
**Файлы:** `app/(tabs)/listen/index.tsx` → `export default ListenScreen` из `pages/listen`
**Статус:** готов

## Что делает

Главный экран приложения. Показывает вертикальный скролл динамических секций проповедей (`DynamicSectionsSlider`); каждая секция — горизонтальный слайдер плейлистов. Настроен в `app/(tabs)/_layout.tsx` как первый таб (`title: 'Слушать'`, `headerShown: false`).

## Что показывается

- Вертикальный список секций; каждая секция рендерится через `renderSection` (`src/pages/listen/ui/renderSection.tsx`) в компонент `Slider` (заголовок секции + горизонтальный слайдер плейлистов с обложками).
- Параметры отображения секции (размер слайдов, трансформация, строки, скругление) приходят с сервера и мапятся в `src/pages/listen/lib/` (`mapItemsSize.ts`, `mapTransform.ts`, `mapWhereIsTitleLocated.ts`).
- Тап на заголовок секции («показать все») открывает список плейлистов секции.

## Откуда данные

- `fetchAllSections` из `src/pages/listen/model.ts`:
  - сначала `sectionsApi.getSections().sectionControllerFindAll()` (сеть);
  - при ошибке сети — кэш из AsyncStorage (`getCachedSections`, ключ `CACHED_SECTIONS` из `src/shared/config/cache-storage-keys.ts`);
  - успешный ответ всегда пишется в кэш (fire-and-forget `setCachedSections`).
- Атомы: `dynamicSectionsAtom`, `isLoadingSectionsAtom`, `sectionDataSourceAtom` (`'cache' | 'network' | 'unknown'`).
- Хук `useOfflineRetry` (`src/shared/lib/network/useOfflineRetry.ts`) перезапрашивает при возврате онлайн/в foreground/по таймеру, если последний ответ был не из сети.

## Куда можно перейти

- Тап на плейлист: если треков `< 2` — сразу запуск воспроизведения (`usePlayNewSermon`); иначе → `/listen/playlist?playlist=<JSON PlaylistData>` (`navigateToPlaylist` из `src/shared/routing/useListenNavigation.ts`).
- Тап на заголовок секции → `/listen/playlist-list?playlists=<JSON PlaylistData[]>&title=<строка>` (`navigateToPlaylistList`).

## Состояния

- Загрузка: `SectionsSkeleton` (`src/pages/listen/ui/skeleton.tsx`) — пока идёт загрузка и секций ещё нет.
- Пусто: `EmptyState` (`shared/ui`), когда загрузка завершена, а секций нет.
- Офлайн: показывается кэш (`sectionDataSourceAtom === 'cache'`), фоновые повторы через `useOfflineRetry`; при отсутствии кэша — `EmptyState`.
- Ошибка: сетевые ошибки логируются (`console.error`), при наличии кэша он показывается.

## Связанные документы

- [features/navigation.md](../features/navigation.md)
- [features/offline-and-network.md](../features/offline-and-network.md)
- [screens/playlist.md](./playlist.md)
- [screens/playlist-list.md](./playlist-list.md)
