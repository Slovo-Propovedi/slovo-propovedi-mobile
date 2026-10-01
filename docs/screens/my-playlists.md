# Экран «Мои плейлисты»

**Маршрут:** `/listen/my-playlists`
**Файлы:** `app/(tabs)/listen/my-playlists.tsx` → `export { MyPlaylistsScreen as default }` из `pages/my-playlists`
**Статус:** готов

## Что делает

Редактирование порядка локальных (пользовательских) плейлистов. Открывается по тапу на заголовок секции «Мои плейлисты» на главном экране «Слушать». Секция на «Слушать» осталась **только для чтения** — режим редактирования порядка переехал сюда.

## Что показывается

- Нативная шапка: заголовок «Мои плейлисты»; `headerRight` — действие «Изменить порядок» (карандаш `Ionicons 'create-outline'`), в режиме редактирования рядом появляется «Сохранить» (галочка `checkmark`). Опции шапки собирает `useMyPlaylistsHeader` (`src/pages/my-playlists/lib/useMyPlaylistsHeader.tsx`), действия рендерит `MyPlaylistsHeaderActions` (`src/pages/my-playlists/ui/MyPlaylistsHeaderActions.tsx`). Когда редактировать нечего (только «Избранные»), действия не рендерятся.
- Вертикальный список: первой строкой — закреплённые «Избранные» (`MyPlaylistsFavoritesRow`, `src/pages/my-playlists/ui/MyPlaylistsFavoritesRow.tsx`: сердце `Ionicons 'heart'` цвета `currentTheme.primary`, не перетаскивается); ниже — карточные строки локальных плейлистов (`MyPlaylistsDragList` + `MyPlaylistsRow`, `ListItemBase` card-вариант).

### Режим редактирования

Двумя состояниями управляет локальный state `localOrderIds` (`null` — обычный режим; массив id — открытый режим):

- **Обычный режим:** drag выключен; тап по строке навигирует на плейлист.
- **Режим редактирования:** long-press тянет строку целиком (native `drag`), тап по строкам **не** навигирует. Перестановка меняет локальную копию порядка, `myPlaylistsAtom` не трогается.
- «Сохранить» один раз коммитит итог через `reorderMyPlaylists` (полный порядок: `favorites` + локальный порядок; сущность пинит «Избранные» первыми) и выходит из режима. Повторный тап по карандашу или уход с экрана (`useFocusEffect` cleanup) локальную копию отбрасывает.

Пока идёт редактирование, порядок строк строится `sortByLocalOrder` (`src/pages/my-playlists/lib/sortByLocalOrder.ts`): id вне локального порядка (конкурентно добавленный плейлист) уезжают в конец.

## Откуда данные

- `myPlaylistsAtom` (`entities/playlist`); гидратация `loadMyPlaylists` при монтировании.
- `reorderMyPlaylists` — обёртка `useReorderMyPlaylists` (`src/pages/my-playlists/lib/useReorderMyPlaylists.ts`) с no-op, если порядок не изменился (`hasOrderChanged`).
- Порядок локален и переживает перезапуск через AsyncStorage (см. [contracts/storage.md](../contracts/storage.md)).

## Куда можно перейти

- Тап по строке (обычный режим) → `/listen/playlist?playlist=<id>`.
- Тап по строке «Избранные» → `/listen/playlist?playlist=favorites`.

## Состояния

- Пусто (только «Избранные», либо локальных плейлистов нет): `EmptyState` «Своих плейлистов пока нет», действия редактирования скрыты.
- Офлайн: список полностью локальный, работает без сети.

## Связанные документы

- [screens/listen.md](./listen.md)
- [screens/playlist.md](./playlist.md)
- [features/my-playlists.md](../features/my-playlists.md)
- [contracts/storage.md](../contracts/storage.md)
