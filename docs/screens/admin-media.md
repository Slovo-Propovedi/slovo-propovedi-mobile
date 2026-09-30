# Экран «Медиа» (админка)

**Маршруты:**

- `/admin/media` — каталог медиа-библиотеки, загрузка обложек и очистка осиротевших файлов (таб `app/admin/(tabs)/media.tsx` → `pages/admin-media`)

**Статус:** готов

Медиа — общая библиотека файлов bucket. Сюда попадает каждое загруженное изображение (из этого экрана или из `CoverPicker`/`FileUploadField` форм проповеди и плейлиста). Экран доступен ролям **admin** и **moderator** (таб «Медиа»). Порт Svelte-экрана «Медиафайлы» (`slovo-propovedi-admin`, `Covers.svelte`).

## Каталог

**Файлы:** `src/pages/admin-media/ui/AdminMediaScreen.tsx`, `MediaTile.tsx`, `lib/useAdminMedia.ts`, `lib/fileKind.ts`, `lib/usePickImage.ts`

- **Что показывается:** шапка «Медиафайлы» + кнопка «Загрузить обложку»; при загрузке — прогресс-бар и подпись «Загрузка N%». Сетка изображений (3 колонки, `FlatList numColumns={3}`): обложка через `expo-image`, имя файла, размер (`formatFileSize`) и бейдж «используется» при `used = true`. На каждой карточке — оверлейная кнопка удаления.
- **Откуда данные:** `getFiles` (`GET /files`) через `filesApi`; элемент — `FileMetadataDto { fileName, fileUrl, size, lastModified, used }`.
- **Навигация:** отдельного экрана-детали нет — карточка не открывает просмотр.
- **Состояния:** загрузка первичного каталога — скелетон-сетка (`AdminMediaGridSkeleton`); пусто — `EmptyState` «Обложек пока нет»; ошибка первичной загрузки — текст «Не удалось загрузить файлы» (`reportError`); ошибка загрузки — тост.

## Загрузка

- Кнопка «Загрузить обложку» открывает системный пикер (`expo-document-picker`, `accept` = `image/*`), расширение проверяется `isAllowedExtension('image', …)` из `widgets/admin-form-pickers` (не-изображение отклоняется тостом, до сети).
- Загрузка идёт через `uploadSermonFile` (`shared/api/uploadFile.ts`, multipart `POST /files`) с прогрессом по `onUploadProgress` (axios).
- **После успеха:** каталог перечитывается, тост «Обложка загружена». Новая обложка сразу доступна и в каталоге, и в пикерах форм.
- **Ошибка:** `getErrorMessage` → тост.

## Удаление

- Оверлейная кнопка `trash` на карточке → `ConfirmDialog` «Удалить обложку?» (имя файла в сообщении).
- **Мутация:** `appControllerRemoveFile` (`DELETE /files/{fileName}`) — удаляет только изображения.
- **409**: изображение используется как `artwork` — тост «Обложка используется в проповедях/плейлистах» (определяется через `getHttpStatus`). В остальных случаях — `getErrorMessage`.

## Осиротевшие файлы

**Файлы:** `src/pages/admin-media/ui/OrphansSection.tsx`, `OrphansBody.tsx`, `OrphanRow.tsx`, `CleanupResultBanner.tsx`, `lib/useOrphanedFiles.ts`

- Кнопка «Найти осиротевшие файлы» запускает скан; повторный клик пересканирует. Скан **опционален** — обходит весь bucket, поэтому не выполняется до запроса пользователя.
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
