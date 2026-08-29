# Проверка обновлений

**Слой:** `shared/model/update`, `shared/model/updateInstall`, `shared/lib/version-check`, `shared/lib/update-service`, `widgets/update-status`, `features/app-update`, `features/update-notification`
**Статус:** готов

## Проверка версии

`checkForUpdateAction` — `src/shared/model/update.ts`:

- выходит, если `!ctx.get(isOnlineAtom)`;
- получает последний релиз через `fetchLatestRelease()`; если нет — выходит;
- сравнивает `compareVersions(release.version, APP_VERSION)`; если релиз новее — планирует уведомление и открывает диалог обновления.

`src/shared/lib/version-check/`:

- `fetchLatestRelease.ts` — источник **Forgejo** (`git.lightnode.ru/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest`), при провале — **fallback на GitHub** (`api.github.com/repos/Slovo-Propovedi/...`). Отбрасывает prerelease и теги с дефисом; извлекает `.zip`-ассет.
- `compareVersions.ts` — сем-вер сравнение (`a`/`b` → `-1 | 0 | 1`).
- `types.ts` — `LatestReleaseInfo` (`version`, `htmlUrl`, `zipDownloadUrl`, `body`, ...).

### Валидация ответа релиза

`fetchLatestRelease` валидирует ответ Zod-схемами (`rawReleaseSchema`, `releaseAssetSchema`) и `parseRelease`:

- отклоняет `prerelease === true`;
- отклоняет теги, содержащие `-` (например, `v0.4.0-rc1`);
- `version` берётся из `tag_name` с отрезанной ведущей `v`;
- `zipDownloadUrl` — первый ассет с расширением `.zip` (может быть `null`). Релизный пайплайн (`.forgejo/workflows/release.yml`) загружает единственный ассет `slovo-propovedi-v<версия>.zip`, внутри которого лежит APK `Slovo.Propovedi v<версия>.apk`.
- Сетевые ошибки логируются (`console.warn`) и не прерывают `checkForUpdateAction`.

### Зеркалирование релиза в GitHub (CI)

`.forgejo/workflows/release.yml` после публикации релиза в Forgejo выполняет шаг **«Mirror release to GitHub»** (опциональный): создаёт/обновляет релиз в `Slovo-Propovedi/slovo-propovedi-mobile` и загружает ZIP-ассет через GitHub REST API v3 (`Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`). Шаг пропускается (`exit 0`), если секрет `GITHUB_MIRROR_TOKEN` не задан — пайплайн остаётся зелёным без конфигурации. Любая ошибка GitHub API — `::warning::`, джоба не падает (релиз Forgejo уже опубликован). HTTP 422 при загрузке ассета (имя уже занято) трактуется как успех.

**Настройка:**

1. В GitHub создать PAT (Personal Access Token) со scope `repo` (для публичного репозитория достаточно `public_repo`) — права на создание релизов и загрузку ассетов.
2. В настройках Forgejo-репозитория (`Settings → Actions → Secrets`) добавить секрет `GITHUB_MIRROR_TOKEN` со значением PAT.
3. Тег `v*` должен быть запушен в GitHub (репозиторий зеркалируется) — если тега ещё нет, создание релиза упадёт с предупреждением, джоба продолжит работу.

## Состояние

`src/shared/model/update.ts`:

- `latestVersionAtom` (строка версии);
- `releaseUrlAtom` (URL страницы релиза);
- `zipDownloadUrlAtom` (URL скачивания ZIP-ассета с APK, используется самообновлением).

При обнаружении новой версии `checkForUpdateAction` открывает диалог (`updateDialogVisibleAtom = true`) — при каждом запуске приложения, пока доступна новая версия (без гейта «показывать раз на версию»). Диалог открывается **в конце** экшена: сначала устанавливаются атомы версии/URL, затем выполняется необязательная секция push-уведомления (запрос разрешений через `requestPermissions()` и планирование), и только потом — `updateDialogVisibleAtom = true`. Такой порядок нужен, чтобы системный промпт разрешений не появлялся поверх модалки обновления.

`src/shared/model/updateInstall.ts` — состояние процесса самообновления (общее для диалога и push-уведомления):

- `updateStateAtom` (`UpdateState`): `'idle' | 'downloading' | 'extracting' | 'installing' | 'permission' | 'error'` — этап самообновления;
- `updateProgressAtom` (number 0–100): процент загрузки ZIP;
- `updateErrorAtom` (`null | string`): текст ошибки для диалога;
- `updateDialogVisibleAtom` (boolean): видимость диалога обновления;
- `startUpdateAction` — запуск самообновления (см. ниже);
- `resumeUpdateAfterPermissionAction` — продолжение после возврата из настроек разрешения (см. ниже);
- `resetUpdateAction` — сброс состояния и скрытие диалога.

Файл разбит на `updateInstall.ts` (типы, атомы, чистые хелперы `isBusyUpdateState`/`decidePermissionResume`) и `updateInstallFlow.ts` (экшены и поток).

Проверка запускается в `app/_RootLayout.tsx` после `InteractionManager.runAfterInteractions`.

## UI

`UpdateDialogRoot` (`src/widgets/update-status/ui/UpdateDialogRoot.tsx`) — контейнер без пропсов, рендерится в `app/_RootLayout.tsx` рядом с `NetworkBanner` / `ServerErrorToast` / `GlobalErrorDialog`. Подписан на `updateDialogVisibleAtom` и рендерит `UpdateDialog`; закрытие диалога сбрасывает атом в `false`.

### UpdateDialog

`src/widgets/update-status/ui/UpdateDialog.tsx` — модальный диалог самообновления (RN `Modal`, fade). Состояния определяются `updateState` из хука `useUpdateInstall` (`features/app-update`):

| Состояние     | Заголовок              | Содержимое                                                                                        |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `idle`        | «Доступно обновление»  | версия из `latestVersionAtom`, кнопки «Обновить» / «Не обновлять», ссылка «Все версии обновлений» |
| `downloading` | «Обновление»           | прогресс-бар + «Загрузка... N%»                                                                   |
| `extracting`  | «Обновление»           | «Распаковка...»                                                                                   |
| `installing`  | «Обновление»           | «Запуск установки...»                                                                             |
| `permission`  | «Требуется разрешение» | объяснение + кнопки «Открыть настройки» / «Не сейчас»                                             |
| `error`       | «Ошибка обновления»    | текст ошибки, кнопки «Открыть в браузере» / «Закрыть»                                             |

- «Обновить» → `startUpdate()`; во время загрузки закрытие диалога заблокировано (`onRequestClose` — no-op).
- Закрытие («Не обновлять», «Закрыть», «Не сейчас», back) вызывает `reset()` хука и `onClose`.
- Ссылки открывают `releaseUrlAtom` через `openReleaseUrl` (`lib/openReleaseUrl.ts`) с защитой: только `https://`.

Составные части: `UpdateDialogConfirm.tsx`, `UpdateDialogProgress.tsx`, `UpdateDialogPermission.tsx`, `UpdateDialogError.tsx`, общие стили — `updateDialogStyles.ts`. Кнопки переиспользуют `shared/ui/confirm-dialog/ConfirmDialogButton`.

## Самообновление (in-app)

Полный поток: **диалог подтверждения → скачивание ZIP → распаковка APK → проверка разрешения → установка через `PackageInstaller`**. Работает только на Android; на iOS и при ошибках — фолбэк на открытие страницы релизов в браузере.

> **F-Droid:** сборки F-Droid подписываются собственным ключом F-Droid, поэтому самообновление в них не сработает — подпись установленной версии не совпадёт с подписью APK из релиза (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`). Обновление таких сборок — через клиент F-Droid.

### Фича app-update

`src/features/app-update/lib/useUpdateInstall.ts` — хук `useUpdateInstall()`, тонкая обёртка над общим состоянием из `shared/model/updateInstall.ts`. Публичный API хука не изменился: `{ error, progress, reset, startUpdate, updateState }`. Атомы и логика переехали в `shared/model`, чтобы и `features/update-notification` (обработчик push), и `widgets/update-status` (диалог) могли их использовать без нарушения FSD (импорт features → features запрещён).

Хук также подписывается на `AppState` (`change` → `active`, debounce 500 мс) и вызывает `resumeUpdateAfterPermissionAction` — это продолжает установку, когда пользователь вернулся из системных настроек разрешения.

Логика `startUpdateAction` (guard-клаузы по порядку):

1. уже идёт загрузка/распаковка/установка (`isBusyUpdateState`) → повторно показать диалог с текущим прогрессом и выйти (защита от повторного входа при повторном тапе по кнопке уведомления);
2. платформа не Android (iOS) → открыть страницу релизов в браузере;
3. офлайн (`!isOnlineAtom`) → `updateErrorAtom = «Нет подключения к интернету»`, состояние `error`, диалог видим;
4. нет `zipDownloadUrlAtom` → открыть страницу релизов в браузере;
5. иначе: `updateDialogVisibleAtom = true`, `updateProgressAtom = 0`, `updateErrorAtom = null`, последовательно `downloading` → `extracting` → `installing`; любой шаг упал — состояние `error` с текстом ошибки.

**Тайминг очистки:** `cleanupUpdateFiles()` вызывается в **начале** потока (перед скачиванием — чистит остатки прошлого запуска), а НЕ в `finally`. Файлы никогда не удаляются, пока сессия `PackageInstaller` может их читать (раньше `finally` удалял APK сразу после старта интента установщика — причина «Возникла проблема с файлом приложения»).

**Фолбэк скачивания (GitHub mirror):** если `downloadUpdateZip` упал (Forgejo ответил при проверке, но «умер» до тапа «Обновить»), `downloadUpdateZipWithFallback` (`src/shared/model/updateInstallFallback.ts`) один раз перезапрашивает `fetchLatestRelease()` и, если у свежего релиза `zipDownloadUrl` **отличается** от упавшего URL **и версия не старше** упавшей (`compareVersions(release.version, failedVersion) >= 0`, где `failedVersion` — `latestVersionAtom`), сбрасывает `updateProgressAtom` в 0, обновляет `latestVersionAtom`/`releaseUrlAtom`/`zipDownloadUrlAtom` (ссылка «Открыть в браузере» в диалоге ошибки ведёт на живую страницу) и повторяет скачивание с новым URL. Ретрай ровно один, без циклов. Если релиз недоступен, `zipDownloadUrl` пуст/совпадает с упавшим URL, версия фолбэка старше упавшей или повторное скачивание тоже упало — пробрасывается исходная ошибка (существующий поток `setErrorState`). Решение о ретрае — чистый хелпер `getFallbackDownloadUrl(failedUrl, failedVersion, release)` (тесты рядом, `updateInstallFallback.test.ts`). Фолбэк применяется **только** к шагу скачивания: ошибки распаковки/установки обрабатываются как раньше.

### Разрешение установки из этого источника

После распаковки APK `startUpdateAction` вызывает `canRequestPackageInstalls()`:

- разрешение есть → сразу `installing` → `installApk`;
- разрешения нет → путь APK сохраняется в module-level `pendingApkPath`, состояние `permission` (диалог «Требуется разрешение»).

Когда пользователь возвращается из настроек (`AppState` → `active`, debounce 500 мс), `resumeUpdateAfterPermissionAction`:

1. если состояние не `permission` — выход;
2. повторно `canRequestPackageInstalls()` + проверка существования APK (`apkFileExists`) через чистый хелпер `decidePermissionResume`:
   - `wait` (разрешения всё ещё нет) — остаёмся в `permission`;
   - `install` (разрешение есть, APK на месте) — `installing` → `installApk`;
   - `restart` (разрешение есть, APK пропал) — перезапуск всего потока `startUpdateAction`.

`resetUpdateAction` очищает `pendingApkPath` и возвращает атомы в исходное состояние.

### Сервис update-service

`src/shared/lib/update-service/updateService.ts`:

| Функция                               | Назначение                                                                                                                                                                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `downloadUpdateZip(url, onProgress?)` | Скачивание ZIP через `File.createDownloadTask` (expo-file-system) в `<cache>/updates/slovo-propovedi-update.zip`; прогресс в процентах через колбэк. Guard: URL только `https://`.                                                              |
| `extractApkFromZip(zipPath)`          | Поиск первого `.apk` внутри архива (`listContents`), селективная распаковка (`unzip`, `react-native-zip-archive`) и переименование в `update.apk` — оригинальное имя `Slovo.Propovedi v<версия>.apk` содержит пробелы и небезопасно для shell.  |
| `installApk(apkPath)`                 | Если доступен локальный модуль `apk-installer` — установка через `PackageInstaller` (сессия, стриминг APK, commit; результат приходит broadcast'ом). Иначе — фолбэк `IntentLauncher.startActivityAsync(VIEW_ACTION, ...)` (Expo Go / экзотика). |
| `canRequestPackageInstalls()`         | Обёртка над нативным `canRequestPackageInstalls()`; при недоступности модуля возвращает `true` (фолбэк-установщик сам решает).                                                                                                                  |
| `openInstallPermissionSettings()`     | Открывает системный экран «Разрешить установку из этого источника» (`Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES`).                                                                                                                              |
| `apkFileExists(apkPath)`              | Проверка существования APK на диске (`new File(path).exists`) — используется при возобновлении после разрешения.                                                                                                                                |
| `cleanupUpdateFiles()`                | Удаление каталога `<cache>/updates` (вызывается в начале потока обновления); ошибки логируются, не бросаются. На не-Android — no-op.                                                                                                            |

Все функции установки бросают ошибку при вызове не на Android (`assertAndroid`) — Fail Fast.

### Локальный модуль apk-installer

`modules/apk-installer` — локальный Expo-модуль (Kotlin, `expo-modules-core`), подключён через `"apk-installer": "file:./modules/apk-installer"` в корневом `package.json`. API:

- `installApk(apkPath)` — создаёт `PackageInstaller.SessionParams(MODE_FULL_INSTALL)` с `setAppPackageName(context.packageName)` (self-update), стримит APK в сессию (`openWrite("base.apk", 0, -1)` → `fsync`), коммитит с `PendingIntent` broadcast (`FLAG_UPDATE_CURRENT | FLAG_MUTABLE`). Promise резолвится из `BroadcastReceiver` (`STATUS_SUCCESS` → `{ status: 'success' }`; `STATUS_PENDING_USER_ACTION` → запуск системного диалога подтверждения; failure-статусы → reject с описанием). При self-update процесс обычно убивается до `STATUS_SUCCESS` — JS трактует промис как fire-and-forget после commit.
- `canRequestPackageInstalls()` — `packageManager.canRequestPackageInstalls()` (API 26+; ниже — `true`).
- `openInstallPermissionSettings()` — системный экран разрешения.
- `isApkInstallerAvailable()` — безопасная проверка наличия нативного модуля (try/catch вокруг `requireNativeModule`; `false` в Expo Go / web).

### Разрешение и зависимость

- **`REQUEST_INSTALL_PACKAGES`** объявлен в `app.json` (`android.permissions`) и в закоммиченном `android/app/src/main/AndroidManifest.xml` (CI `prebuild --clean` регенерирует манифест из `app.json`, локальные gradle-сборки используют закоммиченный).
- **`react-native-zip-archive`** — распаковка ZIP-ассета (см. [`../decisions.md`](../decisions.md) → Approved stack → Обновления).
- **`modules/apk-installer`** — локальный модуль для `PackageInstaller` (см. [`../decisions.md`](../decisions.md) → Approved stack → Обновления).

## Push-уведомления vs диалог

Категория `app-update` содержит два действия, оба открывают приложение:

| Триггер                            | Действие                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Автооткрытие при старте приложения | Диалог подтверждения (`checkForUpdateAction` ставит `updateDialogVisibleAtom = true` в конце экшена — после секции push) — каждый запуск, пока доступна новая версия |
| Push: кнопка «Обновить»            | In-app установка: `startUpdateAction(ctx)` — диалог открывается автоматически с прогрессом                                                                           |
| Push: кнопка «Перейти»             | Открытие страницы релизов в браузере (`Linking.openURL`)                                                                                                             |

Push обрабатывается через `useUpdateNotificationResponse`: `start-in-app-update` запускает `startUpdateAction` (диалог виден благодаря `updateDialogVisibleAtom`), `open-release-url` ведёт в браузер.

## Push-уведомления

`src/shared/lib/notifications/`:

- `ensureNotifications.ts` — ленивый синглтон `ensureNotifications` (динамический импорт `expo-notifications`, установка `setNotificationHandler` один раз за сессию; возвращает `null` при ошибке загрузки). Не зависит от остальных модулей папки — разрывает цикл зависимостей. Файл назван по единственному публичному экспорту (конвенция как у `usePlayer.ts`); прежнее имя `notificationsApi.ts` конфликтовало по регистру с тип-фасадом `NotificationsApi.ts` на файловых системах без учёта регистра, отсюда переименование.
- `notificationsHelpers.ts` — `scheduleNotification`, `requestPermissions`, `hideNotification` (в Expo Go — no-op). Перед планированием/скрытием уведомления гарантирует регистрацию категории через мемоизированный промис `ensureCategory()` (один вызов `setupUpdateNotificationCategory` за сессию; в `requestPermissions` — fire-and-forget).
- `notificationActions.ts` — `setupUpdateNotificationCategory` (категория `app-update` с действиями `start-in-app-update` («Обновить») и `open-release-url` («Перейти»), канал `app-update`), `addNotificationResponseListener`.
- `NotificationsApi.ts` — тип-фасад над `expo-notifications`.

Граф зависимостей ацикличен: `notificationsHelpers → notificationActions → ensureNotifications`; `index.ts` реэкспортирует публичное API.

При доступном обновлении `checkForUpdateAction` планирует локальное уведомление «Доступна новая версия» (если для этой версии ещё не показывалось — ключ `LAST_UPDATE_NOTIFIED_KEY`).

### Поток планирования уведомления

1. `requestPermissions()` — запрос разрешений (в Expo Go возвращает `false`).
2. `scheduleNotification({ title, body, categoryIdentifier: 'app-update', data: { releaseUrl } }, UPDATE_NOTIFICATION_ID, UPDATE_NOTIFICATION_GROUP)` — отложенное уведомление с `trigger: null` (мгновенное).
3. запись `LAST_UPDATE_NOTIFIED_KEY = release.version`, чтобы не повторять уведомление на ту же версию.

## Фича update-notification

`src/features/update-notification/lib/useUpdateNotificationResponse.ts` — `useUpdateNotificationResponse()`, вызывается в `_RootLayout`. Слушает ответы на push; при `actionIdentifier === 'start-in-app-update'` запускает `startUpdateAction(ctx)` (in-app установка с автоматически открытым диалогом); при `actionIdentifier === 'open-release-url'` открывает `releaseUrl` через `Linking.openURL` (только `https://`).

### compareVersions

`compareVersions(a, b)` (`src/shared/lib/version-check/compareVersions.ts`) нормализует версии (`normalizeVersion`): убирает `v` и всё после `-`, разбивает на части по `.` и сравнивает покомпонентно (отсутствующие части = 0). Возвращает `1` если `a > b`, `-1` если `a < b`, иначе `0`.

## Связанные документы

- [state.md](./state.md) — атомы обновления в карте состояния
- [offline-and-network.md](./offline-and-network.md) — гейт проверки по `isOnlineAtom`
- [storage.md](../contracts/storage.md) — ключ `last-update-notified-version`
- [../decisions.md](../decisions.md) — `react-native-zip-archive` в Approved stack
