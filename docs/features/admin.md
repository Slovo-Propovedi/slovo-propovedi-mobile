# Интерфейс администратора (admin)

Зона `/admin` — отдельный стек внутри приложения (см. [navigation.md](./navigation.md) и [`../architecture.md`](../architecture.md)). Доступ — после входа в `/admin/login`; аутентификация — `entities/auth` (JWT в `expo-secure-store`). Табы: «Главная», «Разделы», «Плейлисты», «Проповеди», «Загрузить», «Медиа», «Пользователи» (последний — только для роли admin).

Экраны админки оперируют **generated-типами** (`APITypes.*` из `shared/api`), а не доменными `SectionData`/`PlaylistData`: CRUD-формы работают с сущностями API напрямую.

## Разделы (sections)

Раздел — слайдер с плейлистами на главной странице сайта. Экраны: [screens/admin-sections.md](../screens/admin-sections.md).

### Enums оформления

Значения приходят из OpenAPI (`CreateSectionDto` / `SectionEntity`), русские подписи — `entities/section/lib/sectionLabels.ts`:

- `itemsSize`: `small` | `middle` | `large` | `xLarge` → «Маленький»/«Средний»/«Большой»/«Очень большой».
- `transform`: `high` | `middle` | `short` → «Высокий»/«Средний»/«Низкий».
- `whereIsSlideTitleLocated`: `on` | `under` | `bothOnAndUnder` → «На слайде»/«Под слайдом»/«И на, и под слайдом».

### Reorder

- **Список:** `reorderSections` (`PATCH /section/reorder`) — тело `{ ids }` содержит **полный** упорядоченный массив id разделов.
- **Плейлисты раздела:** `reorderPlaylistsInSection` (`PATCH /section/{id}/playlists/reorder`) — тело `{ playlistIds }` (полный массив).

Оба — оптимистичные: новый порядок применяется локально сразу, при ошибке откат к прежнему + `showToast`; запрос не отправляется, если порядок не изменился (`shared/lib/utils/hasOrderChanged`).

### Связь «раздел ↔ плейлисты»

Двунаправленная: форма раздела управляет связью через `playlistsIds` (`UpdateSectionDto`), форма плейлиста — через `sectionsIds` (`UpdatePlaylistDto`). В `CreateSectionDto` связи нет — состав задаётся при редактировании.

## Drag-списки

Переупорядочивание реализовано `react-native-draggable-flatlist` (pure JS). Обоснование выбора — [decisions.md](../decisions.md) → «Drag-списки админки». Компонент требует `react-native-reanimated` и `react-native-gesture-handler` (оба в стеке); `expo prebuild` не нужен.

## Реализованные / нереализованные разделы

Готовы: «Главная» ([admin-home.md](../screens/admin-home.md)), «Разделы». Заглушки — плейлисты, проповеди, загрузка, медиа, пользователи (см. [../debt.md](../debt.md), раздел «Auth flow»).

## Связанные документы

- [../screens/admin-sections.md](../screens/admin-sections.md) — экраны разделов
- [../screens/admin-home.md](../screens/admin-home.md) — дашборд
- [../contracts/rest-api.md](../contracts/rest-api.md) — section-эндпоинты
- [state.md](./state.md) — состояние (Reatom)
