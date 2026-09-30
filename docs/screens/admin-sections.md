# Экран «Разделы» (админка)

**Маршруты:**

- `/admin/sections` — список разделов с drag-and-drop переупорядочиванием (таб `app/admin/(tabs)/sections.tsx` → `pages/admin-sections`)
- `/admin/sections/create` — создание раздела (`app/admin/sections/create.tsx` → `pages/admin-section-form`)
- `/admin/sections/[id]` — деталь раздела (`app/admin/sections/[id].tsx` → `pages/admin-section-detail`)
- `/admin/sections/[id]/edit` — редактирование раздела (`app/admin/sections/[id]/edit.tsx` → `pages/admin-section-form`)

**Статус:** готов

Раздел — это слайдер с плейлистами на главной странице сайта. Экраны портированы из Svelte-админки (`slovo-propovedi-admin`). Доменные детали (enums, reorder, зависимость drag) — в [`../features/admin.md`](../features/admin.md).

## Список

**Файлы:** `src/pages/admin-sections/ui/AdminSectionsScreen.tsx`, `AdminSectionsHeader.tsx`, `AdminSectionRow.tsx`, `AdminSectionBadges.tsx`, `lib/useAdminSections.ts`

- **Что показывается:** шапка «Разделы» + подзаголовок + кнопка «Создать раздел»; список карточек: название, описание либо «N плейлистов», бейджи размера карточек и высоты (русские подписи из `entities/section` → `sectionLabels`); ручка `reorder-three` запускает drag.
- **Откуда данные:** `sectionControllerFindAll` (`GET /section`) через `sectionsApi`; reorder — `reorderSections` (`PATCH /section/reorder`, тело `{ ids }` — **полный** упорядоченный массив id).
- **Навигация:** тап по карточке → `/admin/sections/[id]`; «Создать раздел» → `/admin/sections/create`.
- **Optimistic reorder:** локальное состояние перекрывает ответ сети; на каждый `onDragEnd` сначала применяется новый порядок, при ошибке — откат к прежнему + `showToast`; запрос пропускается, если порядок не изменился (`hasOrderChanged`).
- **Состояния:** загрузка — `ActivityIndicator`; пусто — `EmptyState` «Разделов пока нет»; ошибка загрузки — `reportError`; ошибка reorder — откат + тост.

## Деталь

**Файлы:** `src/pages/admin-section-detail/ui/AdminSectionDetailScreen.tsx`, `SectionDetailHeader.tsx`, `SectionDetailStats.tsx`, `SectionDetailStat.tsx`, `SectionDetailPlaylistRow.tsx`, `lib/useAdminSectionDetail.ts`

- **Что показывается:** заголовок (динамически в шапке через `Stack.Screen`), описание, действия «Редактировать» и «Удалить»; сетка статистики (размер карточек, высота, расположение заголовка, строки, крупный заголовок, скруглённые углы); блок «Плейлисты раздела (N)» с drag-переупорядочиванием.
- **Откуда данные:** `sectionControllerFindOne` (`GET /section/{id}`); reorder — `reorderPlaylistsInSection` (`PATCH /section/{id}/playlists/reorder`, тело `{ playlistIds }`); удаление — `sectionControllerRemove` (`DELETE /section/{id}`).
- **Навигация:** «Редактировать» → `/admin/sections/[id]/edit`; тап по плейлисту → `/admin/playlists/[id]` (внутри админки, не в пользовательский плеер); после удаления — `router.back()` в список + тост.
- **Удаление:** `ConfirmDialog` («Удалить раздел?») с подтверждением.
- **Состояния:** загрузка — `ActivityIndicator`; не найдено — `EmptyState` «Раздел не найден»; нет плейлистов — `EmptyState` «Плейлистов пока нет»; ошибка reorder — откат + тост; ошибка удаления — `reportError`.

## Форма (создание / редактирование)

**Файлы:** `src/pages/admin-section-form/ui/SectionForm.tsx` (+ `AdminSectionCreateScreen.tsx`, `AdminSectionEditScreen.tsx`, `FormField.tsx`, `SelectField.tsx`, `SelectOptionRow.tsx`, `CheckboxField.tsx`, `PlaylistPicker.tsx`, `PlaylistPickerRow.tsx`), `lib/sectionFormState.ts`, `lib/sectionFormOptions.ts`, `lib/usePlaylistSearch.ts`, `lib/useAdminSectionEntity.ts`

- **Поля:** название (обязательно), описание (textarea, nullable); размер карточек (`small/middle/large/xLarge`), высота (`high/middle/short`), расположение заголовка (`on/under/bothOnAndUnder`) — как `SelectField` в модалке; строки (number, nullable); чекбоксы «Крупный заголовок описания на слайде» и «Скруглённые углы карточек» (`expo-checkbox`).
- **Режим edit** дополнительно: «Плейлисты раздела» — поисковый список с чекбоксами (`playlistControllerFindAll` с `search`/`sort=title`/`order=asc`, дебаунс 300мс); `selectedPlaylistIds` — источник истины, переживает поиск.
- **Мутации:** `sectionControllerCreate` (`POST /section`) / `sectionControllerUpdate` (`PATCH /section/{id}`); в edit тело всегда содержит `playlistsIds` (пустой массив очищает состав); очищенные nullable-поля уходят как `null`.
- **Валидация:** название непустое; кнопка отправки блокируется и показывает `ActivityIndicator` во время запроса.
- **После успеха:** тост и `router.back()`; ошибка — баннер в форме.
- **Режим edit:** сущность грузится до монтирования формы (`useAdminSectionEntity`), пропсы формы стабильны.

## Связанные документы

- [../features/admin.md](../features/admin.md) — домен разделов, enums, reorder
- [../contracts/rest-api.md](../contracts/rest-api.md) — section-эндпоинты
- [admin-home.md](./admin-home.md) — вход в раздел из дашборда
- [README.md](./README.md) — индекс screens
