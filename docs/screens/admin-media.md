# Экран «Медиа» (админка)

**Маршруты:**

- `/admin/media` — каталог медиа-библиотеки, загрузка обложек и очистка осиротевших файлов (таб `app/admin/(tabs)/media.tsx` → `pages/admin-media`)

**Статус:** готов

Медиа — общая библиотека файлов bucket. Сюда попадает каждое загруженное изображение (из этого экрана или из `CoverPicker`/`FileUploadField` форм проповеди и плейлиста). Экран доступен ролям **admin** и **moderator** (таб «Медиа»). Порт Svelte-экрана «Медиафайлы» (`slovo-propovedi-admin`, `Covers.svelte`).

## Каталог

**Файлы:** `src/pages/admin-media/ui/AdminMediaScreen.tsx`, `AdminMediaHeader.tsx`, `AdminMediaGridSkeleton.tsx`, `MediaTile.tsx`, `MediaViewerModal.tsx`, `lib/useAdminMedia.ts`, `lib/fileKind.ts`, `lib/usePickImage.ts`

- **Что показывается:** внутриэкранная шапка «Медиа» (`AdminMediaHeader`) с иконкой-кнопкой загрузки (`cloud-upload-outline`, `accessibilityLabel='Загрузить файл'`) справа; при загрузке — прогресс-бар. Наверху страницы — блок «Осиротевшие файлы» (скан/очистка), ниже — сетка квадратных плиток. Число колонок считается от ширины экрана (`numColumnsFor`, целевая плитка `TARGET_TILE_SIZE = 120`, минимум 1), промежутки — `INDENTS.low`. Плитка: обложка через `expo-image`, имя файла, размер (`formatFileSize`) и бейдж «используется» при `used = true`; оверлейная кнопка удаления.
- **Откуда данные:** `getFiles` (`GET /files`) через `filesApi`; элемент — `FileMetadataDto { fileName, fileUrl, size, lastModified, used }`.
- **Навигация:** тап по плитке открывает полноэкранный просмотр (`MediaViewerModal`: `Modal` + `expo-image` `contentFit='contain'`, закрытие по X, тапу на фон и системному «назад» Android `onRequestClose`). Отдельного маршрута-детали нет.
- **Состояния:** загрузка первичного каталога — скелетон-сетка (`AdminMediaGridSkeleton`) в теле списка (`ListEmptyComponent` того же `FlatList`); шапка «Медиа» и блок осиротевших файлов видны сразу, полноэкранного раннего возврата нет. Плейсхолдер-плитка — `MediaTile.Skeleton` (composition API: скелетон объявлен в `MediaTile.tsx` и прикреплён `Object.assign(MediaTile, { Skeleton })`, геометрия берётся из тех же `styles.tile`/`styles.tileImage`/`styles.tileBody`): квадрат-обложка `tileSize`, тело с двумя строками, пульсация `useSkeletonPulse`; число плейсхолдеров — `numColumns × 4` при том же `numColumns`, что и у реального списка (без сдвига раскладки и смены числа колонок). Пусто — `EmptyState` «Обложек пока нет»; ошибка первичной загрузки — текст «Не удалось загрузить файлы» (`reportError`); ошибка загрузки — тост.

## Загрузка

- Иконка-кнопка «Загрузить файл» в шапке открывает системный пикер (`expo-document-picker`, `accept` = `image/*`), расширение проверяется `isAllowedExtension('image', …)` из `widgets/admin-form-pickers` (не-изображение отклоняется тостом, до сети).
- Загрузка идёт через `uploadSermonFile` (`shared/api/uploadFile.ts`, multipart `POST /files`) с прогрессом по `onUploadProgress` (axios).
- **После успеха:** каталог перечитывается, тост «Обложка загружена». Новая обложка сразу доступна и в каталоге, и в пикерах форм.
- **Ошибка:** `getErrorMessage` → тост.

## Удаление

- Оверлейная кнопка `trash` на карточке → `ConfirmDialog` «Удалить обложку?» (имя файла в сообщении).
- **Мутация:** `appControllerRemoveFile` (`DELETE /files/{fileName}`) — удаляет только изображения.
- **409**: изображение используется как `artwork` — тост «Обложка используется в проповедях/плейлистах» (определяется через `getHttpStatus`). В остальных случаях — `getErrorMessage`.

## Осиротевшие файлы

**Файлы:** `src/pages/admin-media/ui/OrphansSection.tsx`, `OrphansBody.tsx`, `OrphanRow.tsx`, `CleanupResultBanner.tsx`, `lib/useOrphanedFiles.ts`

- Кнопка «Найти осиротевшие файлы» запускает скан; повторный клик пересканирует. Скан **опционален** — обходит весь bucket, поэтому не выполняется до запроса пользователя. На web-десктопе кнопка не растягивается на всю ширину вьюпорта (`styles.secondaryButton` добавляет `maxWidth = SCAN_BUTTON_MAX_WIDTH = 320` **только** при `Platform.OS === 'web'`); на нативе cap не задаётся — кнопка остаётся на всю ширину, как раньше.
- **Откуда данные:** `appControllerGetOrphanedFiles` (`GET /files/orphans`) → `{ orphaned, count }`; элементы — `FileMetadataDto` (`used` всегда `false`).
- **Что показывается:** строки `OrphanRow` — бейдж типа (аудио/текст/изображение по расширению), имя, размер; у изображений пометка «удаляется вручную из каталога».
- **Кнопка «Удалить (N)»:** `N` — число **удаляемых** осиротевших файлов (только аудио/текст; изображения не считаются). Появляется при `N > 0`.
- **Подтверждение:** `ConfirmDialog` «Удалить осиротевшие файлы?».
- **Мутация:** `appControllerCleanupOrphanedFiles` (`POST /files/orphans/cleanup`) — идемпотентная best-effort очистка `.mp3/.pdf/.fb2`; ошибка отдельного объекта не роняет запрос. После успеха список пересканируется.
- **Результат:** `CleanupResultBanner` («Удалено файлов: N») со списком неудачных (`fileName — reason`); тост «Удалено файлов: N».
- **Состояния:** скан — `ActivityIndicator`; пусто — `EmptyState` «Осиротевших файлов нет»; ошибка — текст «Не удалось получить список осиротевших файлов».

## Связанные документы

- [../features/admin.md](../features/admin.md) — интерфейс администратора, загрузка файлов
- [../contracts/rest-api.md](../contracts/rest-api.md) — карта `/files`-эндпоинтов
- [admin-sermons.md](./admin-sermons.md), [admin-playlists.md](./admin-playlists.md) — формы, переиспользующие `CoverPicker`/`FileUploadField`
- [README.md](./README.md) — индекс screens
