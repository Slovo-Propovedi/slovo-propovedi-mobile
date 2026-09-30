# Интерфейс администратора (admin)

Зона `/admin` — отдельный стек внутри приложения (см. [navigation.md](./navigation.md) и [`../architecture.md`](../architecture.md)). Доступ — после входа в `/admin/login`; аутентификация — `entities/auth` (JWT в `expo-secure-store`). Табы: «Главная», «Разделы», «Плейлисты», «Проповеди», «Загрузить», «Медиа», «Пользователи» (последний — только для роли admin).

Экраны админки оперируют **generated-типами** (`APITypes.*` из `shared/api`), а не доменными `SectionData`/`PlaylistData`: CRUD-формы работают с сущностями API напрямую.

## Общие UI-паттерны списков

- **Сортировка — селект, не кнопка.** В шапках списков проповедей и плейлистов сортировка выбирается из модалки (`AdminSelect` из `shared/ui`, `shared/ui/admin-select`): триггер показывает выбранную метку, тап открывает модалку с вариантами и галочкой на активном; порядок `asc`/`desc` остаётся отдельной иконкой-кнопкой (`IconButton` со стрелкой). У списка пользователей сортировки нет (только поиск).
- **Скелетоны вместо спиннеров.** Загрузка списков не прячет экран: шапка и фильтры остаются, а тело списка показывает плейсхолдер-строки (`AdminSermonRowSkeleton`, `AdminPlaylistRowSkeleton`, `AdminSectionRowSkeleton`, `AdminUserRowSkeleton` в `shared/ui/admin-skeleton`). Дозагрузка («Загрузить ещё») показывает скелетон-строку в футере, без полноэкранного спиннера. Детальные/формовые экраны на время загрузки сущности показывают `AdminContentSkeleton`, медиатека — `AdminMediaGridSkeleton`, карточки статистики главной — скелетон-числа. Пульсация — общий `useSkeletonPulse` из `shared/ui/skeleton`. Спиннеры остались только в кнопках (вход, загрузка файла, submit-кнопки).
- **Бегущие заголовки строк.** Длинные названия строк (проповеди, плейлисты, разделы, пользователи) не обрезаются статически, а используют общий `MovingText` из `shared/ui` (тот же marquee, что в плеере и карточках слайдера) — drag-активируемая прокрутка при переполнении. Тот же компонент применяется в строках деталей плейлиста/раздела/проповеди.

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

## Плейлисты (playlists)

Плейлист — набор проповедей, который может входить в разделы главной страницы. Экраны: [screens/admin-playlists.md](../screens/admin-playlists.md).

### Reorder проповедей

- **Плейлист:** `reorderSermonsInPlaylist` (`PATCH /playlists/{id}/sermons/reorder`) — тело `{ sermonIds }`, **полный** упорядоченный массив id.
- **Список плейлистов** пагинируется через `playlistControllerFindAll` (`GET /playlists`): `search` (дебаунс 300мс), `page`/`limit=20`, `sort` (`date`|`title`|`section`), `order` (`asc`|`desc`). Размер страницы — константа `PAGE_SIZE`.
- **Формы админки** — у всех (раздел/плейлист/проповедь/пользователь, и create, и edit) кнопка «Сохранить» живёт в шапке (`headerRight`) как иконка-дискета (`SaveButton` из `shared/ui/form`, `Ionicons save-outline`, `accessibilityLabel='Сохранить'`, спиннер во время отправки). Кнопка **disabled, пока форма не изменена**: в edit-режиме текущие значения сравниваются с исходным снапшотом (`omitEqualFields` из `shared/lib/utils` — массив сравнивается по значению, reorder считается изменением; пустой дифф → `isDirty=false`), в create-режиме pristine-форма (пустой набор значений) disabled, любое изменение включает кнопку. Флаг `isDirty` отдаёт каждый контроллер формы (`usePlaylistFormController`, `useSermonFormController`, `useUserFormController`, `SectionForm`) и прокидывается в `useAdminFormHeader`. Валидация при нажатии по-прежнему показывает тост. Шапка формы целиком собирается хуком `useAdminFormHeader` (`widgets/admin-form-header`): «назад» слева, заголовок по центру, «Сохранить» справа. Длинные пикеры (проповеди, разделы) не имеют отдельного внутреннего скролла, страница скроллится целиком, а сохранение всегда доступно. В пикерах выбранные элементы идут первыми (`orderSelectedFirst`).
- **Детали (раздел/плейлист/проповедь/пользователь)** — действие «Редактировать» вынесено из тела страницы в шапку (`headerRight`, иконка `create-outline`, `accessibilityLabel='Редактировать'`) через `useAdminDetailHeader`; в теле остаются только удаление/смена пароля.
- **URL-поля форм** — поле ввода ссылки (`EditableUrlField` из `shared/ui/form`) показывает значение read-only текстом с встроенной кнопкой-карандашом; тап переводит в режим ввода, blur/галочка возвращают read-only. Используется для YouTube, URL обложки и URL файлов аудио/текста.
- **Плейсхолдеры и фокус полей** — общие примитивы `shared/ui/form` (`FormField`, `EditableUrlField`) красят `placeholderTextColor` в `currentTheme.placeholder` (тусклее `textMuted`, чтобы подсказка не читалась как значение) и дают сфокусированному `TextInput` рамку `currentTheme.primary` (`borderWidth: 2`, радиус из `RADIUSES.low`); в покое — прежняя тонкая рамка `textMuted`. Инлайн-рамка обязательна, т.к. цвета темы нельзя захватывать в `StyleSheet.create`.
- **Keyboard-avoidance форм** — тело каждой формы (раздел/плейлист/проповедь/пользователь) скроллится через общий `FormScrollView` (`shared/ui/form`): на iOS это `KeyboardAvoidingView` (`behavior='padding'`, `keyboardVerticalOffset = safe-area.top + высота шапки стека`), на Android — обычный `ScrollView`. Отдельный Android-KAV не нужен: `MainActivity` объявлена с `windowSoftInputMode=adjustResize` (манифест из Expo prebuild), поэтому контент сам поднимается над клавиатурой. Кнопка «Сохранить» живёт в шапке (`headerRight`) и остаётся доступной при поднятой клавиатуре.

## Проповеди (sermons)

Проповедь — единица контента: аудио/видео/текст, ссылка на Писание, обложка и связи с плейлистами. Экраны: [screens/admin-sermons.md](../screens/admin-sermons.md).

### Нотация Писания

`chapter`/`verse` на проводе — union-формы (см. [contracts/rest-api.md](../contracts/rest-api.md) → «Диапазоны Писания»). Разбор и сериализация полей формы — порт `parseVerseInput`/`parseChapter`/`serializeVerseInput` из Svelte-админки:

- `entities/sermon/lib/scriptureNotation.ts` — типы (`Chapter`/`Verse`), `isVerseRangeTuple`, `parseChapter`, `parseVerseInput`. `parseVerseInput` разбирает свободный текст «16, 16–18, 9–18, 20»; два разрозненных одиночных стиха оборачиваются в `[n, n]`, чтобы не читаться на проводе как диапазон.
- `entities/sermon/lib/scriptureSerialization.ts` — `serializeVerseInput` (обратное направление, зеркалит нормализацию отображения).
- `entities/sermon/lib/sermonSubtitle.ts` — подпись «проповедник · ссылка на Писание» для строк списка/деталей (переиспользуется в списках админки и пикерах).

Смена поля «Глава (по)» переключает режим стихов формы (`applyChapterEndChange` в `pages/admin-sermon-form/lib/sermonFormState.ts`): непустое «до» входит в режим диапазона и переносит введённое в пару «от/до», очистка — выходит обратно в свободный текст.

### Автодополнение

`GET /sermons/distinct-values` (`SermonDistinctValuesResponse` — `{artists, books}`) даёт ранее использованных проповедников и книги. Форма грузит их один раз (`useSermonSuggestions`) и показывает тапабельные подсказки под полями «Проповедник» и «Книга» (`SuggestionField`); ошибка загрузки тихо деградирует к пустому списку.

### Загрузка файлов

Аудио (только MP3) и текстовый файл грузятся `POST /files` (multipart) через `shared/api/uploadFile.ts` (`uploadSermonFile`) с прогрессом по `onUploadProgress` (axios). Файл оборачивается в `expo-file-system`'s `File` (реализует `Blob`), а `RN FormData` читает из него `uri`/`type` на рантайме. Проверка расширения до загрузки — `widgets/admin-form-pickers/lib/fileKinds.ts`: не-MP3 отклоняется с сообщением, до сети. Выбор обложки/файлов переиспользует виджеты `widgets/admin-form-pickers` (`CoverPicker`, `FileUploadField`, `PlaylistPicker`).

`CoverPicker` виджета умеет и ручной URL (`EditableUrlField`), и галерею библиотеки, и прямую загрузку изображения (`appControllerUploadFile` с прогрессом) — им пользуются и форма проповеди, и форма плейлиста. Кнопки «Выбрать из библиотеки» и «Загрузить …» стоят в одну строку; у «Выбрать из библиотеки» слева иконка `Ionicons albums-outline`, у «Загрузить …» — `cloud-upload-outline` (цвет обложки — `currentTheme.primary` / `COLORS.white`, размер 20). Галерея выбора — общий `FileLibraryModal` (`widgets/admin-form-pickers`): заголовок + кнопка «Закрыть» (X), safe-area отступы, закрытие по фону/системному «назад» Android (общий `shared/ui/modal`).

### Редирект таба «Загрузить»

Таб «Загрузить» (`app/admin/(tabs)/upload.tsx`) — короткий путь к форме: `<Redirect href='/admin/sermons/create' />`. Отдельного экрана загрузки нет; стандартный сценарий — форма создания проповеди с встроенными загрузками.

## Медиа (media)

Библиотека файлов bucket: каталог изображений, загрузка обложек и очистка осиротевших файлов. Экран: [screens/admin-media.md](../screens/admin-media.md).

- **Каталог:** `GET /files` (`AllFilesResponse` → `FileMetadataDto { fileName, fileUrl, size, lastModified, used }`); `used` — изображение уже является `artwork` проповеди/плейлиста (бейдж «используется»).
- **Загрузка:** multipart `POST /files` через `shared/api/uploadFile.ts` (`uploadSermonFile`) с прогрессом; расширение проверяется до сети (`isAllowedExtension('image', …)`).
- **Удаление:** `DELETE /files/{fileName}` — только изображения; **409** означает «используется как обложка» (тост «Обложка используется в проповедях/плейлистах», статус через `getHttpStatus`).
- **Осиротевшие файлы:** `GET /files/orphans` (опциональный скан bucket, `limit`) и `POST /files/orphans/cleanup` — идемпотентная best-effort очистка **только** `.mp3/.pdf/.fb2`; изображения этой операцией не удаляются (убираются вручную из каталога). Результат `CleanupOrphansResponse { deleted, failed }` показывается баннером.
- Загрузка «самих по себе» файлов из медиатеки и очистка висячих файлов после отменённой формы проповеди закрыты этим разделом.

## Пользователи (users)

Домен админ-аккаунтов. Экраны: [screens/admin-users.md](../screens/admin-users.md). Доступен **только роли admin** (таб скрывается для не-admin, экраны защищены `useRequireAdminRole`).

- **Список:** `GET /users?page&limit=20` (`AllUsersResponse { users, count }`, офсетная пагинация); серверного `search` нет — клиентский фильтр по `name`/`email`/`username` (дебаунс 300мс) по загруженным страницам.
- **Деталь:** `GET /users/{id}`; удаление `DELETE /users/{id}` (кнопка скрыта для собственного аккаунта, `id === authUser.id`); смена пароля `PATCH /users/{id}/password` (`{ password }`).
- **Форма:** `POST /users` (name/email/username/password/role; `role` всегда) и `PATCH /users/{id}` (**только изменённые** поля name/email/username/role, без пароля). Роль по умолчанию — `user` (least-privilege). Подписи ролей — `ROLE_LABELS` из `entities/auth`.

## Drag-списки

Переупорядочивание реализовано `react-native-draggable-flatlist` (pure JS). Обоснование выбора — [decisions.md](../decisions.md) → «Drag-списки админки». Компонент требует `react-native-reanimated` и `react-native-gesture-handler` (оба в стеке); `expo prebuild` не нужен.

## Реализованные / нереализованные разделы

Готовы: «Главная» ([admin-home.md](../screens/admin-home.md)), «Разделы» ([admin-sections.md](../screens/admin-sections.md)), «Плейлисты» ([admin-playlists.md](../screens/admin-playlists.md)), «Проповеди» ([admin-sermons.md](../screens/admin-sermons.md)), «Медиа» ([admin-media.md](../screens/admin-media.md)), «Пользователи» ([admin-users.md](../screens/admin-users.md)) — только для роли admin, а также таб «Загрузить» (редирект на создание проповеди).

## Связанные документы

- [../screens/admin-sections.md](../screens/admin-sections.md) — экраны разделов
- [../screens/admin-playlists.md](../screens/admin-playlists.md) — экраны плейлистов
- [../screens/admin-sermons.md](../screens/admin-sermons.md) — экраны проповедей
- [../screens/admin-media.md](../screens/admin-media.md) — медиа-библиотека и осиротевшие файлы
- [../screens/admin-users.md](../screens/admin-users.md) — управление пользователями
- [../screens/admin-home.md](../screens/admin-home.md) — дашборд
- [../contracts/rest-api.md](../contracts/rest-api.md) — эндпоинты section/playlist/sermon/files/users
- [state.md](./state.md) — состояние (Reatom)
