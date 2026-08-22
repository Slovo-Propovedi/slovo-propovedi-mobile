# Проверка обновлений

**Слой:** `shared/model/update`, `shared/model/updateInstall`, `shared/lib/version-check`, `shared/lib/update-service`, `widgets/update-status`, `features/app-update`, `features/update-notification`
**Статус:** готов

## Проверка версии

`checkForUpdateAction` — `src/shared/model/update.ts`:

- выходит, если `!ctx.get(isOnlineAtom)`;
- получает последний релиз через `fetchLatestRelease()`; если нет — выходит;
- сравнивает `compareVersions(release.version, APP_VERSION)`; если релиз новее — ставит атомы и планирует уведомление.

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

## Состояние

`src/shared/model/update.ts`:

- `updateAvailableAtom` (boolean);
- `latestVersionAtom` (строка версии);
- `releaseUrlAtom` (URL страницы релиза);
- `zipDownloadUrlAtom` (URL скачивания ZIP-ассета с APK, используется самообновлением).

`src/shared/model/updateInstall.ts` — состояние процесса самообновления (общее для баннера, диалога и push-уведомления):

- `updateStateAtom` (`UpdateState`): `'idle' | 'downloading' | 'extracting' | 'installing' | 'error'` — этап самообновления;
- `updateProgressAtom` (number 0–100): процент загрузки ZIP;
- `updateErrorAtom` (`null | string`): текст ошибки для диалога;
- `updateDialogVisibleAtom` (boolean): видимость диалога обновления;
- `startUpdateAction` — запуск самообновления (см. ниже);
- `resetUpdateAction` — сброс состояния и скрытие диалога.

Проверка запускается в `app/_RootLayout.tsx` после `InteractionManager.runAfterInteractions`.

## UI

`UpdateBanner` (`src/widgets/update-status/ui/UpdateBanner.tsx`) — пилюля «Обновление» (`testID='update-banner'`), видна при `updateAvailable`. Анимация — `useUpdateIslandAnimation.ts`. Располагается ниже `NetworkBanner`.

Поток нажатий:

1. первый тап — разворот пилюли (`expand()`);
2. тап по развёрнутой пилюле — открытие `UpdateDialog` (`updateDialogVisibleAtom = true`). URL больше не открывается напрямую из баннера.

### UpdateDialog

`src/widgets/update-status/ui/UpdateDialog.tsx` — модальный диалог самообновления (RN `Modal`, fade). Состояния определяются `updateState` из хука `useUpdateInstall` (`features/app-update`):

| Состояние            | Заголовок              | Содержимое                                                                 |
| -------------------- | ---------------------- | -------------------------------------------------------------------------- |
| `idle`               | «Доступно обновление»  | версия из `latestVersionAtom`, кнопки «Обновить» / «Не обновлять», ссылка «Все версии обновлений» |
| `downloading`        | «Обновление»           | прогресс-бар + «Загрузка... N%»                                            |
| `extracting`         | «Обновление»           | «Распаковка...»                                                            |
| `installing`         | «Обновление»           | «Запуск установки...»                                                      |
| `error`              | «Ошибка обновления»    | текст ошибки, кнопки «Открыть в браузере» / «Закрыть»                      |

- «Обновить» → `startUpdate()`; во время загрузки закрытие диалога заблокировано (`onRequestClose` — no-op).
- Закрытие («Не обновлять», «Закрыть», back) вызывает `reset()` хука и `onClose`.
- Ссылки открывают `releaseUrlAtom` через `openReleaseUrl` (`lib/openReleaseUrl.ts`) с защитой: только `https://`.

Составные части: `UpdateDialogConfirm.tsx`, `UpdateDialogProgress.tsx`, `UpdateDialogError.tsx`, общие стили — `updateDialogStyles.ts`. Кнопки переиспользуют `shared/ui/confirm-dialog/ConfirmDialogButton`.

## Самообновление (in-app)

Полный поток: **баннер → диалог подтверждения → скачивание ZIP → распаковка APK → запуск системного установщика Android**. Работает только на Android; на iOS и при ошибках — фолбэк на открытие страницы релизов в браузере.

### Фича app-update

`src/features/app-update/lib/useUpdateInstall.ts` — хук `useUpdateInstall()`, тонкая обёртка над общим состоянием из `shared/model/updateInstall.ts`. Публичный API хука не изменился: `{ error, progress, reset, startUpdate, updateState }`. Атомы и логика переехали в `shared/model`, чтобы и `features/update-notification` (обработчик push), и `widgets/update-status` (диалог/баннер) могли их использовать без нарушения FSD (импорт features → features запрещён).

Логика `startUpdateAction` (guard-клаузы по порядку):

1. уже идёт загрузка/распаковка/установка (`isBusyUpdateState`) → повторно показать диалог с текущим прогрессом и выйти (защита от повторного входа при повторном тапе по кнопке уведомления);
2. платформа не Android (iOS) → открыть страницу релизов в браузере;
3. офлайн (`!isOnlineAtom`) → `updateErrorAtom = «Нет подключения к интернету»`, состояние `error`, диалог видим;
4. нет `zipDownloadUrlAtom` → открыть страницу релизов в браузере;
5. иначе: `updateDialogVisibleAtom = true`, `updateProgressAtom = 0`, `updateErrorAtom = null`, последовательно `downloading` → `extracting` → `installing`; любой шаг упал — состояние `error` с текстом ошибки; в `finally` — `cleanupUpdateFiles()`.

`resetUpdateAction` возвращает атомы в исходное состояние и скрывает диалог — вызывается при закрытии диалога.

### Сервис update-service

`src/shared/lib/update-service/updateService.ts`:

| Функция                                       | Назначение                                                                                                                                                                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `downloadUpdateZip(url, onProgress?)`         | Скачивание ZIP через `File.createDownloadTask` (expo-file-system) в `<cache>/updates/slovo-propovedi-update.zip`; прогресс в процентах через колбэк. Guard: URL только `https://`.                                                       |
| `extractApkFromZip(zipPath)`                  | Поиск первого `.apk` внутри архива (`listContents`), селективная распаковка (`unzip`, `react-native-zip-archive`) и переименование в `update.apk` — оригинальное имя `Slovo.Propovedi v<версия>.apk` содержит пробелы и небезопасно для shell. |
| `installApk(apkPath)`                         | Запуск системного установщика: `IntentLauncher.startActivityAsync(VIEW_ACTION, ...)` с флагами `FLAG_ACTIVITY_NEW_TASK \| FLAG_GRANT_READ_URI_PERMISSION` и MIME `application/vnd.android.package-archive`.                              |
| `cleanupUpdateFiles()`                        | Удаление каталога `<cache>/updates` (вызывается в `finally`); ошибки логируются, не бросаются. На не-Android — no-op.                                                                                                                   |

Все функции установки бросают ошибку при вызове не на Android (`assertAndroid`) — Fail Fast.

### Разрешение и зависимость

- **`REQUEST_INSTALL_PACKAGES`** объявлен в `app.json` (`android.permissions`) — разрешение Android на установку APK из приложения.
- **`react-native-zip-archive`** — распаковка ZIP-ассета (см. [`../decisions.md`](../decisions.md) → Approved stack → Обновления).

## Push-уведомления vs баннер

Категория `app-update` содержит два действия, оба открывают приложение:

| Триггер                          | Действие                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| Тап по баннеру в приложении       | In-app установка (диалог → скачивание → установщик)                      |
| Push: кнопка «Обновить»           | In-app установка: `startUpdateAction(ctx)` — диалог открывается автоматически с прогрессом |
| Push: кнопка «Перейти»            | Открытие страницы релизов в браузере (`Linking.openURL`)                 |

Push обрабатывается через `useUpdateNotificationResponse`: `start-in-app-update` запускает `startUpdateAction` (диалог виден благодаря `updateDialogVisibleAtom`), `open-release-url` ведёт в браузер.

## Push-уведомления

`src/shared/lib/notifications/`:

- `notificationsHelpers.ts` — `scheduleNotification`, `requestPermissions`, `hideNotification`, `ensureNotifications` (ленивый импорт `expo-notifications`; в Expo Go — no-op).
- `notificationActions.ts` — `setupUpdateNotificationCategory` (категория `app-update` с действиями `start-in-app-update` («Обновить») и `open-release-url` («Перейти»), канал `app-update`), `addNotificationResponseListener`.
- `NotificationsApi.ts` — тип-фасад над `expo-notifications`.

При доступном обновлении `checkForUpdateAction` планирует локальное уведомление «Доступна новая версия» (если для этой версии ещё не показывалось — ключ `LAST_UPDATE_NOTIFIED_KEY`).

### Поток планирования уведомления

1. `requestPermissions()` — запрос разрешений (в Expo Go возвращает `false`).
2. `scheduleNotification({ title, body, categoryIdentifier: 'app-update', data: { releaseUrl } }, UPDATE_NOTIFICATION_ID, UPDATE_NOTIFICATION_GROUP)` — отложенное уведомление с `trigger: null` (мгновенное).
3. запись `LAST_UPDATE_NOTIFIED_KEY = release.version`, чтобы не повторять уведомление на ту же версию.

## Фича update-notification

`src/features/update-notification/lib/useUpdateNotificationResponse.ts` — `useUpdateNotificationResponse()`, вызывается в `_RootLayout`. Слушает ответы на push; при `actionIdentifier === 'start-in-app-update'` запускает `startUpdateAction(ctx)` (in-app установка с автоматически открытым диалогом); при `actionIdentifier === 'open-release-url'` открывает `releaseUrl` через `Linking.openURL` (только `https://`).

### compareVersions

`compareVersions(a, b)` (`src/shared/lib/version-check/compareVersions.ts`) нормализует версии (`normalizeVersion`): убирает `v` и всё после `-`, разбивает на части по `.` и сравнивает покомпонентно (отсутствующие части = 0). Возвращает `1` если `a > b`, `-1` если `a < b`, иначе `0`.

### Позиция баннера

`UpdateBanner` позиционируется ниже `NetworkBanner` (константа `PILL_HEIGHT = 36`, `top: insets.top + INDENTS.low + PILL_HEIGHT + INDENTS.low`), чтобы пилюли не перекрывались. Скрывается, когда `!updateAvailable`.

## Связанные документы

- [state.md](./state.md) — атомы обновления в карте состояния
- [offline-and-network.md](./offline-and-network.md) — гейт проверки по `isOnlineAtom`
- [storage.md](../contracts/storage.md) — ключ `last-update-notified-version`
- [../decisions.md](../decisions.md) — `react-native-zip-archive` в Approved stack
