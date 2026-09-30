# Экран «Плейлисты» (админка)

**Маршруты:**

- `/admin/playlists` — список плейлистов с поиском, сортировкой и пагинацией (таб `app/admin/(tabs)/playlists.tsx` → `pages/admin-playlists`)
- `/admin/playlists/create` — создание плейлиста (`app/admin/playlists/create.tsx` → `pages/admin-playlist-form`)
- `/admin/playlists/[id]` — деталь плейлиста (`app/admin/playlists/[id].tsx` → `pages/admin-playlist-detail`)
- `/admin/playlists/[id]/edit` — редактирование плейлиста (`app/admin/playlists/[id]/edit.tsx` → `pages/admin-playlist-form`)

**Статус:** готов

Плейлист — набор проповедей, который может входить в разделы главной страницы. Экраны портированы из Svelte-админки (`slovo-propovedi-admin`). Доменные детали (связь с разделами, reorder) — в [`../features/admin.md`](../features/admin.md).

## Список

**Файлы:** `src/pages/admin-playlists/ui/AdminPlaylistsScreen.tsx`, `AdminPlaylistsHeader.tsx`, `AdminPlaylistRow.tsx`, `lib/useAdminPlaylists.ts`

- **Что показывается:** шапка «Плейлисты» + счётчик + кнопка «Создать плейлист»; поле поиска; кнопка-переключатель сортировки (по дате → по названию → по разделу, по кругу) и кнопка направления (возрастание/убывание); карточки: обложка, название, «N проповедей · M разделов».
- **Откуда данные:** `playlistControllerFindAll` (`GET /playlists?search&page&limit=20&sort&order`) через `playlistsApi`; поиск дебаунсится 300мс (`shared/lib/hooks/useDebounce`).
- **Пагинация:** «Загрузить ещё» (кнопка в футере `FlatList`), размер страницы 20; `hasMore` — пришла ли полная страница.
- **Навигация:** тап по карточке → `/admin/playlists/[id]`; «Создать плейлист» → `/admin/playlists/create`.
- **Состояния:** загрузка — `ActivityIndicator`; пусто — `EmptyState` «Плейлистов пока нет»; ошибка загрузки — `reportError` + текст в пустом состоянии.

## Деталь

**Файлы:** `src/pages/admin-playlist-detail/ui/AdminPlaylistDetailScreen.tsx`, `PlaylistDetailHeader.tsx`, `PlaylistDetailSermonRow.tsx`, `lib/useAdminPlaylistDetail.ts`

- **Что показывается:** герой (обложка через `expo-image`, название, описание), плитки «Проповеди»/«Разделы», действие «Удалить»; «Редактировать» — иконка в шапке (`headerRight`, `useAdminDetailHeader`); блок «Проповеди плейлиста (N)» с drag-переупорядочиванием (ручка `reorder-three`).
- **Откуда данные:** `playlistControllerFindOne` (`GET /playlists/{id}`); reorder — `reorderSermonsInPlaylist` (`PATCH /playlists/{id}/sermons/reorder`, тело `{ sermonIds }` — **полный** упорядоченный массив id); удаление — `playlistControllerRemove` (`DELETE /playlists/{id}`).
- **Optimistic reorder:** локальное состояние перекрывает ответ сети; при ошибке — откат + `showToast`; запрос пропускается, если порядок не изменился (`hasOrderChanged`).
- **Навигация:** иконка «Редактировать» в шапке → `/admin/playlists/[id]/edit`; тап по строке проповеди → `/admin/sermons/[id]`; после удаления — `router.back()` в список + тост.
- **Удаление:** `ConfirmDialog` («Удалить плейлист?») с подтверждением.
- **Состояния:** загрузка — `ActivityIndicator`; не найдено — `EmptyState` «Плейлист не найден»; нет проповедей — `EmptyState` «Проповедей пока нет»; ошибка reorder — откат + тост; ошибка удаления — `reportError`.

## Форма (создание / редактирование)

**Файлы:** `src/pages/admin-playlist-form/ui/PlaylistForm.tsx` (+ `AdminPlaylistCreateScreen.tsx`, `AdminPlaylistEditScreen.tsx`, `PlaylistFormMainFields.tsx`, `SermonPicker.tsx`, `SermonPickerRow.tsx`, `SectionPicker.tsx`, `SectionPickerRow.tsx`, `PlaylistSaveButton.tsx`), `lib/playlistFormState.ts`, `lib/usePlaylistFormController.ts`, `lib/useSermonSearch.ts`, `lib/useSectionOptions.ts`, `lib/usePlaylistFormHeader.tsx`, `lib/orderSelectedFirst.ts`

- **Поля:** название (обязательно), описание (textarea, nullable); обложка — `CoverPicker` из `widgets/admin-form-pickers` (ручной URL + галерея изображений + прямая multipart-загрузка с прогрессом); проповеди — поисковый список с чекбоксами и обложками (`GET /sermons?search`, дебаунс 300мс); разделы — чекбокс-список (`GET /section`).
- **Порядок пикеров:** выбранные (отмеченные) элементы идут первыми, затем остальные — `orderSelectedFirst`; `selectedIds` — источник истины, переживает поиск.
- **Кнопка «Сохранить» — в шапке экрана** (`headerRight`, иконка-дискета `SaveButton`), всегда доступна при скролле страницы. Шапка формы собирается хуком `useAdminFormHeader` (`widgets/admin-form-header`). Страница скроллится целиком, у пикеров нет отдельного внутреннего скролла. Опции шапки мемоизированы, обработчик сохранения держится в ref — чтобы expo-router не переустанавливал options каждый рендер.
- **Мутации:** `playlistControllerCreate` (`POST /playlists`) / `playlistControllerUpdate` (`PATCH /playlists/{id}`); тело всегда содержит `sermonsIds` и `sectionsIds` (пустой массив очищает связь); очищенные nullable-поля уходят как `null`.
- **Валидация:** название непустое; при пустом названии — inline-ошибка + тост, отправки нет; во время запроса кнопка показывает `ActivityIndicator`.
- **После успеха:** тост и `router.back()`; ошибка — баннер в форме.
- **Режим edit:** сущность грузится до монтирования формы (`useAdminPlaylistEntity`), пропсы формы стабильны.

## Связанные документы

- [../features/admin.md](../features/admin.md) — домен плейлиста, связь с разделами, reorder
- [../contracts/rest-api.md](../contracts/rest-api.md) — playlist-эндпоинты
- [admin-sections.md](./admin-sections.md) — разделы (обратная сторона связи)
- [README.md](./README.md) — индекс screens
