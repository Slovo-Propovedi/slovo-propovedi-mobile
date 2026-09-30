# Экран «Проповеди» (админка)

**Маршруты:**

- `/admin/sermons` — список проповедей с поиском, сортировкой и пагинацией (таб `app/admin/(tabs)/sermons.tsx` → `pages/admin-sermons`)
- `/admin/sermons/create` — создание проповеди (`app/admin/sermons/create.tsx` → `pages/admin-sermon-form`); сюда же редиректит таб «Загрузить» (`app/admin/(tabs)/upload.tsx`)
- `/admin/sermons/[id]` — деталь проповеди (`app/admin/sermons/[id].tsx` → `pages/admin-sermon-detail`)
- `/admin/sermons/[id]/edit` — редактирование проповеди (`app/admin/sermons/[id]/edit.tsx` → `pages/admin-sermon-form`)

**Статус:** готов

Проповедь — единица контента: аудио/видео/текст, ссылка на Писание, обложка и связи с плейлистами. Экраны портированы из Svelte-админки (`slovo-propovedi-admin`). Доменные детали (нотация Писания, автодополнение, загрузка файлов) — в [`../features/admin.md`](../features/admin.md).

## Список

**Файлы:** `src/pages/admin-sermons/ui/AdminSermonsScreen.tsx`, `AdminSermonsHeader.tsx`, `AdminSermonRow.tsx`, `SermonBadges.tsx`, `lib/useAdminSermons.ts`

- **Что показывается:** шапка «Проповеди» + счётчик + кнопка «Загрузить проповедь»; поле поиска; кнопка-переключатель сортировки (по дате → по названию → по автору → по плейлисту, по кругу) и кнопка направления (возрастание/убывание); карточки: обложка, название, подпись «проповедник · ссылка на Писание», бейджи медиа (аудио / youtube / текст — показываются только у имеющихся).
- **Откуда данные:** `sermonControllerFindAll` (`GET /sermons?search&page&limit=20&sort&order`) через `sermonsApi`; поиск дебаунсится 300мс (`shared/lib/hooks/useDebounce`). Подпись строки — `sermonSubtitle` (`entities/sermon`).
- **Пагинация:** «Загрузить ещё» (кнопка в футере `FlatList`), размер страницы 20; `hasMore` — пришла ли полная страница.
- **Смена сортировки** подтягивает направление по умолчанию бэкенда: `date` — убывание, остальные — возрастание (`AdminSermonsScreen.handleSortChange`).
- **Навигация:** тап по карточке → `/admin/sermons/[id]`; «Загрузить проповедь» → `/admin/sermons/create`.
- **Состояния:** загрузка — `ActivityIndicator`; пусто — `EmptyState` «Проповедей пока нет»; ошибка загрузки — `reportError` + текст в пустом состоянии.

## Деталь

**Файлы:** `src/pages/admin-sermon-detail/ui/AdminSermonDetailScreen.tsx`, `SermonDetailHeader.tsx`, `SermonMediaCard.tsx`, `SermonAudioPreview.tsx`, `SermonPlaylistRow.tsx`, `lib/useAdminSermonDetail.ts`

- **Что показывается:** герой (обложка, название, подпись «проповедник · Писание»); «Редактировать» и «Удалить» — иконки в шапке экрана (`headerRight`, `useAdminDetailHeader`); описание (если есть); карточка «Медиа» с аудио-превью (play/pause + позиция), ссылками «Смотреть на YouTube» и «Открыть текст проповеди»; блок «Плейлисты (N)» списком обложка+название.
- **Откуда данные:** `sermonControllerFindOne` (`GET /sermons/{id}`); удаление — `sermonControllerRemove` (`DELETE /sermons/{id}`).
- **Аудио:** локальное превью на `expo-audio` (`useAudioPlayer`/`useAudioPlayerStatus`) — глобальный singleton-плеер приложения сознательно не переиспользуется, чтобы предпросмотр не влиял на очередь воспроизведения.
- **Внешние ссылки:** YouTube и текст открываются через `Linking.openURL` с проверкой протокола (`hasUriProtocol`) — URL с сервера недоверенный (см. [contracts/native-modules.md](../contracts/native-modules.md)).
- **Навигация:** иконка «Редактировать» в шапке → `/admin/sermons/[id]/edit`; тап по строке плейлиста → `/admin/playlists/[id]`; после удаления — `router.back()` в список + тост.
- **Удаление:** `ConfirmDialog` («Удалить проповедь?») с подтверждением.
- **Состояния:** загрузка — `ActivityIndicator`; не найдено — `EmptyState` «Проповедь не найдена»; нет медиа — карточка не рендерится; нет плейлистов — подпись «Проповедь не в плейлистах»; ошибка удаления — `reportError`.

## Форма (создание / редактирование)

**Файлы:** `src/pages/admin-sermon-form/ui/SermonForm.tsx` (+ `AdminSermonCreateScreen.tsx`, `AdminSermonEditScreen.tsx`, `SermonFormMainFields.tsx`, `SermonScriptureFields.tsx`, `SermonMediaFields.tsx`, `SuggestionField.tsx`, `SermonSaveButton.tsx`), `lib/sermonFormInitialValues.ts`, `lib/sermonFormState.ts`, `lib/useSermonFormController.ts`, `lib/useSermonSuggestions.ts`, `lib/useSermonFormHeader.tsx`, `lib/useAdminSermonEntity.ts`, `lib/useSermonScreens.tsx`

- **Поля:** название (обязательно), проповедник (обязательно, подсказки из `GET /sermons/distinct-values`), книга (подсказки оттуда же), описание (nullable); Писание — глава (пара «от/до», непустое «до» включает режим диапазона глав) и стихи (свободный текст `16, 16–18, 9–18, 20` в обычном режиме либо пара «от/до» в режиме диапазона); обложка — `CoverPicker` (ручной URL + галерея изображений библиотеки + загрузка); YouTube URL; аудио — загрузка MP3 (multipart, `POST /files`, прогресс); текст — загрузка любого файла тем же путём; плейлисты — поисковый чекбокс-список.
- **Порядок пикеров:** выбранные (отмеченные) плейлисты идут первыми — `orderSelectedFirst`; `selectedIds` — источник истины.
- **Кнопка «Сохранить» — в шапке экрана** (`headerRight`, иконка-дискета `SaveButton`), всегда доступна при скролле страницы. Шапка формы собирается хуком `useAdminFormHeader` (`widgets/admin-form-header`); страница скроллится целиком, внутренних скроллов у пикеров нет. Опции шапки мемоизированы, обработчик сохранения держится в ref. Кнопка **disabled, пока форма не изменена** (`isDirty` от `useSermonFormController`: edit — сравнение с исходным снапшотом через `omitEqualFields`; create — pristine-форма disabled).
- **Нотация Писания:** порт `parseVerseInput`/`parseChapter`/`serializeVerseInput` из Svelte-админки — `entities/sermon/lib/scriptureNotation.ts` (разбор) и `scriptureSerialization.ts` (сериализация), с юнит-тестами. Смена «Глава (по)» переключает режим стихов (`applyChapterEndChange`), перенося введённое между свободным текстом и парой полей.
- **Мутации:** `sermonControllerCreate` (`POST /sermons`) / `sermonControllerUpdate` (`PATCH /sermons/{id}`); тело всегда содержит `playlistsIds` (пустой массив очищает связь); очищенные nullable-поля уходят как `null`.
- **Валидация:** название и проповедник непустые; невалидный ввод стихов блокирует отправку (inline-ошибка); при ошибке — inline-ошибка + тост, отправки нет; во время запроса кнопка показывает `ActivityIndicator`.
- **После успеха:** тост и `router.back()`; ошибка — баннер в форме.
- **Режим edit:** сущность грузится до монтирования формы (`useAdminSermonEntity`), пропсы формы стабильны.
- **Отложено:** судьба загруженных, но не привязанных к проповеди файлов (orphaned files) — фаза 5 «Медиа» (см. [`../debt.md`](../debt.md)).

## Связанные документы

- [../features/admin.md](../features/admin.md) — домен проповеди, нотация Писания, автодополнение, загрузка файлов, редирект таба «Загрузить»
- [../contracts/rest-api.md](../contracts/rest-api.md) — sermon-эндпоинты
- [admin-playlists.md](./admin-playlists.md) — плейлисты (обратная сторона связи)
- [README.md](./README.md) — индекс screens
