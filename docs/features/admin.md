# Интерфейс администратора (admin)

Зона `/admin` — отдельный стек внутри приложения (см. [navigation.md](./navigation.md) и [`../architecture.md`](../architecture.md)). Доступ — после входа в `/admin/login`; аутентификация — `entities/auth` (JWT в `expo-secure-store`). Табы: «Главная», «Разделы», «Плейлисты», «Проповеди», «Медиа», «Пользователи» (последний — только для роли admin).

Экраны админки оперируют **generated-типами** (`APITypes.*` из `shared/api`), а не доменными `SectionData`/`PlaylistData`: CRUD-формы работают с сущностями API напрямую.

## Общие UI-паттерны списков

- **Сортировка — селект, не кнопка.** В шапках списков проповедей и плейлистов сортировка выбирается из модалки (`AdminSelect` из `shared/ui`, `shared/ui/admin-select`): триггер показывает выбранную метку, тап открывает модалку с вариантами и галочкой на активном; порядок `asc`/`desc` остаётся отдельной иконкой-кнопкой (`IconButton` со стрелкой). У списка пользователей сортировки нет (только поиск).
- **Скелетоны вместо спиннеров.** Загрузка списков не прячет экран: шапка и фильтры остаются, а тело списка показывает плейсхолдер-строки. Скелетон каждого компонента прикреплён к нему через composition API как статическое свойство `Component.Skeleton` (`AdminSermonRow.Skeleton`, `AdminPlaylistRow.Skeleton`, `AdminSectionRow.Skeleton`, `AdminUserRow.Skeleton`, `MediaTile.Skeleton`) и определён рядом с самим компонентом (присваивание свойства после объявления: `Component.Skeleton = ComponentSkeleton`) — плейсхолдер не может «отъехать» от компонента, а геометрия выводится из его же стилей/констант. Строковые плейсхолдеры живут в `shared/ui/admin-skeleton` и прикреплены к строкам слоя pages (обратное направление импорта FSD запрещено). Дозагрузка (автоподгрузка следующей страницы при достижении конца списка) показывает скелетон-строку в футере, без полноэкранного спиннера; если страница упала — в футере тапабельная строка «Повторить загрузку». Детальные/формовые экраны на время загрузки сущности показывают `AdminContentSkeleton`, медиатека — `pages/admin-media/ui/AdminMediaGridSkeleton` (ряды `MediaTile.Skeleton`), карточки статистики главной — скелетон-числа. Пульсация — общий `useSkeletonPulse` из `shared/ui/skeleton`. Спиннеры остались только в кнопках (вход, загрузка файла, submit-кнопки).
- **Бегущие заголовки строк.** Длинные названия строк (проповеди, плейлисты, разделы, пользователи) не обрезаются статически, а используют общий `MovingText` из `shared/ui` (тот же marquee, что в плеере и карточках слайдера) — drag-активируемая прокрутка при переполнении. Тот же компонент применяется в строках деталей плейлиста/раздела/проповеди.
- **Отступ под плавающим таб-баром.** Таб-бар админки — абсолютный (`widgets/tab-bar`), контент скроллится под ним. Экраны списков резервируют `paddingBottom: tabBarHeight + INDENTS.low` (`tabBarHeightAtom` актуальной высоты); `PLAYER_SIZES.miniPlayerHeight` в формуле не участвует — в админке нет мини-плеера (в отличие от публичных табов). На web низ не добрать документным скроллом: `public/index.html` ставит `body { overflow: hidden }` — прокрутка обязана происходить внутри списка. У всех `DraggableFlatList` админки (список разделов, деталь раздела, деталь плейлиста) для этого задан `containerStyle={styles.listContainer}` (`flex: 1`): их собственный контейнер без `flex` на react-native-web растягивается по контенту и клипает низ.
- **Автодозагрузка вместо кнопки.** Пагинированные списки (проповеди, плейлисты, пользователи) подгружают следующую страницу по `onEndReached` (`onEndReachedThreshold={0.5}`); механика осталась офсетной (`page`/`limit=20`). Пока страница грузится, в футере — скелетон-строка; если дозагрузка упала, в футере показывается тапабельная строка «Повторить загрузку» (повторный `loadMore`), состояние ошибки сбрасывается при следующей удачной дозагрузке и при перезагрузке списка с первой страницы.
- **Обновление списка при возврате.** Списки плейлистов и проповедей перезагружают первую страницу через `useFocusEffect` при повторном фокусе экрана (возврат после создания/редактирования/удаления), поэтому изменения — в том числе очистка обложки — видны сразу, без ручного переоткрытия детали. Повторная загрузка молчаливая: скелетон показывается только до первой успешной загрузки, на маунте и при смене поиска/сортировки список грузится с первой страницы.

## Разделы (sections)

Раздел — слайдер с плейлистами на главной странице сайта. Экраны: [screens/admin-sections.md](../screens/admin-sections.md).

### Enums и поля оформления

Значения приходят из OpenAPI (`CreateSectionDto` / `SectionEntity`), русские подписи — `entities/section/lib/sectionLabels.ts`:

- `itemsSize`: `small` | `middle` | `large` | `xLarge` → «Маленький»/«Средний»/«Большой»/«Очень большой».
- `transform`: `high` | `middle` | `short` → «Высокий»/«Средний»/«Низкий».
- `whereIsSlideTitleLocated`: `on` | `under` → «На карточке»/«Под карточкой». Заголовок при `on`
  рендерится оверлеем по центру карточки, при `under` — подписью под карточкой. Legacy-значение
  `bothOnAndUnder` **удалено из выбора** и при чтении мапится в `under`.
- `isDescriptionTitleOnSlideLarge`: переосмыслено как «описание плейлиста на карточке» (`true` —
  показывать реальное описание `item.description`; `false` — скрыто; по умолчанию скрыто).
  На icon-карточках не рендерится.
- `borderRadius`: скруглённые углы карточек (checkbox «Скруглённые углы карточек»).

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
- **Список плейлистов** пагинируется через `playlistControllerFindAll` (`GET /playlists`): `search` (дебаунс 300мс), `page`/`limit=20`, `sort` (`date`|`title`|`section`), `order` (`asc`|`desc`). Размер страницы — константа `PLAYLISTS_PAGE_SIZE` (в `lib/fetchPlaylistsPage.ts`); следующая страница подгружается автоматически по `onEndReached` (порог 0.5), кнопки «Загрузить ещё» нет.
- **Формы админки** — у всех (раздел/плейлист/проповедь/пользователь, и create, и edit) кнопка «Сохранить» живёт в шапке (`headerRight`) как иконка-галочка (`SaveButton` из `shared/ui/form`, `Ionicons checkmark`, `accessibilityLabel='Сохранить'`, спиннер во время отправки). Кнопка **disabled, пока форма не изменена**: в edit-режиме текущие значения сравниваются с исходным снапшотом (`omitEqualFields` из `shared/lib/utils` — массив сравнивается по значению, reorder считается изменением; пустой дифф → `isDirty=false`), в create-режиме pristine-форма (пустой набор значений) disabled, любое изменение включает кнопку. Флаг `isDirty` отдаёт каждый контроллер формы (`usePlaylistFormController`, `useSermonFormController`, `useUserFormController`, `SectionForm`) и прокидывается в `useAdminFormHeader`. Валидация при нажатии по-прежнему показывает тост. Шапка формы целиком собирается хуком `useAdminFormHeader` (`widgets/admin-form-header`): «назад» слева, заголовок по центру, «Сохранить» справа. Длинные пикеры (проповеди, разделы) не имеют отдельного внутреннего скролла, страница скроллится целиком, а сохранение всегда доступно. В пикерах выбранные элементы идут первыми (`orderSelectedFirst`). В пикере проповедей формы плейлиста список грузится курсорно (`sermonControllerFindAll` с `take`/`cursor` — `page`/`limit` взаимоисключающи с курсором), а дозагрузку запускает внешний скролл формы: `FormScrollView` зовёт `onNearEnd` при приближении к низу (порог — половина вьюпорта), `PlaylistForm` транслирует его в `loadMore` счётчика; `onEndReached` у не-скроллящегося `FlatList` пикера не используется. Уже включённые в плейлист проповеди показываются наверху и отмеченными, даже если не попали в загруженную страницу (объединение по id `mergeById` + `orderSelectedFirst`); при ошибке дозагрузки в футере — «Повторить загрузку».
- **Enter отправляет форму (hardware-клавиатура и web).** `FormScrollView` принимает `onSubmit` и публикует его через `FormSubmitContext`; однострочные `FormField` внутри показывают `returnKeyType='done'` и вызывают отправку по `onSubmitEditing`, а `multiline`-поля (описание) сохраняют поведение по умолчанию — Enter вставляет перенос строки и не отправляет. `onSubmit` прокидывают формы раздела, плейлиста и проповеди (create/edit) и повторяет доступность кнопки «Сохранить»: отправка идёт только при `isDirty` и не во время `isSubmitting`. Формы без `onSubmit` (например, пользователя) не меняют поведение — контекст по умолчанию `null`.
- **Детали (раздел/плейлист/проповедь/пользователь)** — действие «Редактировать» вынесено из тела страницы в шапку (`headerRight`, иконка `create-outline`, `accessibilityLabel='Редактировать'`) через `useAdminDetailHeader`; в теле остаются только удаление/смена пароля.
- **URL-поля форм** — поле ввода ссылки (`EditableUrlField` из `shared/ui/form`) показывает значение read-only текстом с встроенной кнопкой-карандашом; тап переводит в режим ввода, Enter/blur/галочка возвращают read-only. Enter не отправляет форму, а завершает редактирование поля (коммитит URL). Используется для YouTube, URL обложки и URL файлов аудио/текста.
- **Плейсхолдеры и фокус полей** — общие примитивы `shared/ui/form` (`FormField`, `EditableUrlField`) красят `placeholderTextColor` в `currentTheme.placeholder` (тусклее `textMuted`, чтобы подсказка не читалась как значение) и дают сфокусированному `TextInput` рамку `currentTheme.primary` (`borderWidth: 2`, радиус из `RADIUSES.low`); в покое — прежняя тонкая рамка `textMuted`. Инлайн-рамка обязательна, т.к. цвета темы нельзя захватывать в `StyleSheet.create`.
- **Обязательные поля: звёздочка + inline-подсветка.** Примитивы `shared/ui/form` (`FormField`, `SelectField`, `FormGroupTitle`) принимают `required` и рисуют красную звёздочку (`RequiredAsterisk`, `COLORS.error`) после подписи. Контроллеры форм отслеживают тронутые поля через общий `useFormTouched` (`shared/lib/hooks/useFormTouched`: `markTouched` на `onBlur`, `markAllTouched` при отправке) и красят пустое тронутое обязательное поле красной рамкой (`invalid`, цвет `COLORS.error`, `borderWidth: 2`) — до попытки отправки. Обязательные поля: раздел/плейлист — «Название»; проповедь — «Название», «Проповедник»; пользователь — «Имя», «Email», «Логин», «Пароль» (пароль только в create). Невалидную отправку по-прежнему блокирует валидация в контроллере с тостом — подсветка лишь дублирует её визуально.
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

`GET /sermons/distinct-values` (`SermonDistinctValuesResponse` — `{artists, books}`) даёт ранее использованных проповедников и книги. Форма грузит их один раз (`useSermonSuggestions`) и показывает тапабельные подсказки под полями «Проповедник» и «Книга» (`SuggestionField`); ошибка загрузки тихо деградирует к пустому списку. Список открывается сразу при фокусе на поле, даже пустом: тогда показываются первые до `SUGGESTION_LIMIT = 10` значений; при непустом вводе — case-insensitive substring с исключением точного совпадения; блюр скрывает ряд (с задержкой `BLUR_HIDE_DELAY_MS`, чтобы тап по чипу не потерялся).

### Загрузка файлов

Аудио (только MP3) и текстовый файл грузятся `POST /files` (multipart) через `shared/api/uploadFile.ts` (`uploadSermonFile`) с прогрессом по `onUploadProgress` (axios). Файл оборачивается в `expo-file-system`'s `File` (реализует `Blob`), а `RN FormData` читает из него `uri`/`type` на рантайме. Проверка расширения до загрузки — `widgets/admin-form-pickers/lib/fileKinds.ts`: не-MP3 отклоняется с сообщением, до сети. Выбор обложки/файлов переиспользует виджеты `widgets/admin-form-pickers` (`CoverPicker`, `FileUploadField`, `PlaylistPicker`).

`CoverPicker` виджета умеет и ручной URL (`EditableUrlField`), и галерею библиотеки, и прямую загрузку изображения (`appControllerUploadFile` с прогрессом) — им пользуются и форма проповеди, и форма плейлиста. Кнопки «Выбрать из библиотеки» и «Загрузить …» стоят в одну строку; у «Выбрать из библиотеки» слева иконка `Ionicons albums-outline`, у «Загрузить …» — `cloud-upload-outline` (цвет обложки — `currentTheme.primary` / `COLORS.white`, размер 20). Галерея выбора — общий `FileLibraryModal` (`widgets/admin-form-pickers`): заголовок + кнопка «Закрыть» (X), safe-area отступы, закрытие по фону/системному «назад» Android (общий `shared/ui/modal`).

### Создание проповеди

Отдельного экрана/таба загрузки нет: проповедь создаётся формой `/admin/sermons/create`. Точки входа — кнопка «Загрузить проповедь» в шапке списка проповедей (`AdminSermonsHeader` → `router.push('/admin/sermons/create')`) и быстрое действие «Загрузить проповедь» на главной админки (`AdminQuickActions`). «Назад» из формы возвращается на предыдущий админ-экран (`router.back()` при наличии истории), а при её отсутствии (web-reload, deep link) — `router.replace('/admin/sermons')` (`fallbackRoute` у `useAdminFormHeader`).

## Медиа (media)

Библиотека файлов bucket: каталог изображений, загрузка обложек и очистка осиротевших файлов. Экран: [screens/admin-media.md](../screens/admin-media.md).

- **Каталог:** `GET /files` (`AllFilesResponse` → `FileMetadataDto { fileName, fileUrl, size, lastModified, used }`); `used` — изображение уже является `artwork` проповеди/плейлиста (бейдж «используется»).
- **Загрузка:** multipart `POST /files` через `shared/api/uploadFile.ts` (`uploadSermonFile`) с прогрессом; расширение проверяется до сети (`isAllowedExtension('image', …)`).
- **Удаление:** `DELETE /files/{fileName}` — только изображения; **409** означает «используется как обложка» (тост «Обложка используется в проповедях/плейлистах», статус через `getHttpStatus`).
- **Осиротевшие файлы:** `GET /files/orphans` (опциональный скан bucket, `limit`), `POST /files/orphans/cleanup` — идемпотентная best-effort очистка **только** `.mp3/.pdf/.fb2` (изображения этой операцией не удаляются — убираются вручную из каталога) и поштучное `DELETE /files/{fileName}` для аудио/текста, включая `.m4a` (**409**, если файл ещё используется в проповеди, — тост «Файл используется в проповедях»). Результат `CleanupOrphansResponse { deleted, failed }` показывается баннером.
- Загрузка «самих по себе» файлов из медиатеки и очистка висячих файлов после отменённой формы проповеди закрыты этим разделом.

## Пользователи (users)

Домен админ-аккаунтов. Экраны: [screens/admin-users.md](../screens/admin-users.md). Доступен **только роли admin** (таб скрывается для не-admin, экраны защищены `useRequireAdminRole`).

- **Список:** `GET /users?page&limit=20` (`AllUsersResponse { users, count }`, офсетная пагинация; следующая страница — автоматически по `onEndReached`); серверного `search` нет — клиентский фильтр по `name`/`email`/`username` (дебаунс 300мс) по загруженным страницам.
- **Деталь:** `GET /users/{id}`; удаление `DELETE /users/{id}` (кнопка скрыта для собственного аккаунта, `id === authUser.id`); смена пароля `PATCH /users/{id}/password` (`{ password }`).
- **Форма:** `POST /users` (name/email/username/password/role; `role` всегда) и `PATCH /users/{id}` (**только изменённые** поля name/email/username/role, без пароля). Роль по умолчанию — `user` (least-privilege). Подписи ролей — `ROLE_LABELS` из `entities/auth`.

## Drag-списки

Переупорядочивание реализовано `react-native-draggable-flatlist` (pure JS). Обоснование выбора — [decisions.md](../decisions.md) → «Drag-списки админки». Компонент требует `react-native-reanimated` и `react-native-gesture-handler` (оба в стеке); `expo prebuild` не нужен.

## Реализованные / нереализованные разделы

Готовы: «Главная» ([admin-home.md](../screens/admin-home.md)), «Разделы» ([admin-sections.md](../screens/admin-sections.md)), «Плейлисты» ([admin-playlists.md](../screens/admin-playlists.md)), «Проповеди» ([admin-sermons.md](../screens/admin-sermons.md)), «Медиа» ([admin-media.md](../screens/admin-media.md)), «Пользователи» ([admin-users.md](../screens/admin-users.md)) — только для роли admin, Создание проповеди доступно из шапки списка проповедей и быстрых действий главной (см. «Создание проповеди»).

## Связанные документы

- [../screens/admin-sections.md](../screens/admin-sections.md) — экраны разделов
- [../screens/admin-playlists.md](../screens/admin-playlists.md) — экраны плейлистов
- [../screens/admin-sermons.md](../screens/admin-sermons.md) — экраны проповедей
- [../screens/admin-media.md](../screens/admin-media.md) — медиа-библиотека и осиротевшие файлы
- [../screens/admin-users.md](../screens/admin-users.md) — управление пользователями
- [../screens/admin-home.md](../screens/admin-home.md) — дашборд
- [../contracts/rest-api.md](../contracts/rest-api.md) — эндпоинты section/playlist/sermon/files/users
- [state.md](./state.md) — состояние (Reatom)
