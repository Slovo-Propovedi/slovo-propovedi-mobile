# Проверка обновлений

**Слой:** `shared/model/update`, `shared/lib/version-check`, `widgets/update-status`, `features/update-notification`
**Статус:** готов

## Проверка версии

`checkForUpdateAction` — `src/shared/model/update.ts`:

- выходит, если `!ctx.get(isOnlineAtom)`;
- получает последний релиз через `fetchLatestRelease()`; если нет — выходит;
- сравнивает `compareVersions(release.version, APP_VERSION)`; если релиз новее — ставит атомы и планирует уведомление.

`src/shared/lib/version-check/`:

- `fetchLatestRelease.ts` — источник **Forgejo** (`git.lightnode.ru/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest`), при провале — **fallback на GitHub** (`api.github.com/repos/Slovo-Propovedi/...`). Отбрасывает prerelease и теги с дефисом; извлекает `.apk`-ассет.
- `compareVersions.ts` — сем-вер сравнение (`a`/`b` → `-1 | 0 | 1`).
- `types.ts` — `LatestReleaseInfo` (`version`, `htmlUrl`, `apkDownloadUrl`, `body`, ...).

### Валидация ответа релиза

`fetchLatestRelease` валидирует ответ Zod-схемами (`rawReleaseSchema`, `releaseAssetSchema`) и `parseRelease`:

- отклоняет `prerelease === true`;
- отклоняет теги, содержащие `-` (например, `v0.4.0-rc1`);
- `version` берётся из `tag_name` с отрезанной ведущей `v`;
- `apkDownloadUrl` — первый ассет с расширением `.apk` (может быть `null`).
- Сетевые ошибки логируются (`console.warn`) и не прерывают `checkForUpdateAction`.

## Состояние

`src/shared/model/update.ts`:

- `updateAvailableAtom` (boolean);
- `latestVersionAtom` (строка версии);
- `releaseUrlAtom` (URL страницы релиза).

Проверка запускается в `app/_RootLayout.tsx` после `InteractionManager.runAfterInteractions`.

## UI

`UpdateBanner` (`src/widgets/update-status/ui/UpdateBanner.tsx`) — пилюля «Обновление» (`testID='update-banner'`), видна при `updateAvailable`. Тап: сначала разворот пилюли, затем `Linking.openURL(releaseUrl)`. Анимация — `useUpdateIslandAnimation.ts`. Располагается ниже `NetworkBanner`.

## Push-уведомления

`src/shared/lib/notifications/`:

- `notificationsHelpers.ts` — `scheduleNotification`, `requestPermissions`, `hideNotification`, `ensureNotifications` (ленивый импорт `expo-notifications`; в Expo Go — no-op).
- `notificationActions.ts` — `setupUpdateNotificationCategory` (категория `app-update` с действием `open-release-url`, канал `app-update`), `addNotificationResponseListener`.
- `NotificationsApi.ts` — тип-фасад над `expo-notifications`.

При доступном обновлении `checkForUpdateAction` планирует локальное уведомление «Доступна новая версия» (если для этой версии ещё не показывалось — ключ `LAST_UPDATE_NOTIFIED_KEY`).

### Поток планирования уведомления

1. `requestPermissions()` — запрос разрешений (в Expo Go возвращает `false`).
2. `scheduleNotification({ title, body, categoryIdentifier: 'app-update', data: { releaseUrl } }, UPDATE_NOTIFICATION_ID, UPDATE_NOTIFICATION_GROUP)` — отложенное уведомление с `trigger: null` (мгновенное).
3. запись `LAST_UPDATE_NOTIFIED_KEY = release.version`, чтобы не повторять уведомление на ту же версию.

## Фича update-notification

`src/features/update-notification/lib/useUpdateNotificationResponse.ts` — `useUpdateNotificationResponse()`, вызывается в `_RootLayout`. Слушает ответы на push; при `actionIdentifier === 'open-release-url'` открывает `releaseUrl` через `Linking.openURL` (только `https://`).

### compareVersions

`compareVersions(a, b)` (`src/shared/lib/version-check/compareVersions.ts`) нормализует версии (`normalizeVersion`): убирает `v` и всё после `-`, разбивает на части по `.` и сравнивает покомпонентно (отсутствующие части = 0). Возвращает `1` если `a > b`, `-1` если `a < b`, иначе `0`.

### Позиция баннера

`UpdateBanner` позиционируется ниже `NetworkBanner` (константа `PILL_HEIGHT = 36`, `top: insets.top + INDENTS.low + PILL_HEIGHT + INDENTS.low`), чтобы пилюли не перекрывались. Скрывается, когда `!updateAvailable`.

## Связанные документы

- [state.md](./state.md) — атомы обновления в карте состояния
- [offline-and-network.md](./offline-and-network.md) — гейт проверки по `isOnlineAtom`
- [storage.md](../contracts/storage.md) — ключ `last-update-notified-version`
