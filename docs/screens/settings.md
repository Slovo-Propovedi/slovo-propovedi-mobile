# Экран «Настройки»

**Маршрут:** `/settings`
**Файлы:** `app/settings.tsx` → `export { SettingsScreen as default }` из `pages/settings`
**Статус:** готов

## Что делает

Управление настройками приложения: тема оформления, динамические цвета, виброотклик, адрес сервера API, резервная копия (экспорт/импорт локальных данных).

## Что показывается

`SettingsScreen` (`src/pages/settings/ui/SettingsScreen.tsx`) — вертикальный `ScrollView` из пунктов:

- **Тема оформления** — `ThemeDialog` + `ThemeSelector` (`src/pages/settings/ui/ThemeDialog.tsx`, `ThemeSelector.tsx`, `ThemeSelectorOption.tsx`, `themeOptions.ts`): светлая / тёмная / как в системе.
- **Динамические цвета** — `DynamicColorsItem` (`src/pages/settings/ui/DynamicColorsItem.tsx`), Material You; показывается только если `isMaterialYouSupported()` (Android).
- **Виброотклик** — `HapticsSettingsItem` (`src/pages/settings/ui/HapticsSettingsItem.tsx`): глобальный переключатель вибрации при перемотке и нажатиях. На web строка показывается только при поддержке Vibration API (`isWebVibrationSupported()` из `shared/lib/haptics`); в браузерах без `navigator.vibrate` (большинство десктопов, iOS Safari) она скрыта. Обёртки `shared/lib/haptics` на web используют `navigator.vibrate`, вне поддержки — no-op.
- **URL сервера API** — `ServerUrlSettings` (`src/pages/settings/ui/ServerUrlSettings.tsx`): аккордеон, свёрнут по умолчанию (заголовок + «Текущий: …» + шеврон), тап по строке разворачивает форму (`ServerUrlForm.tsx`): изменение/сброс адреса сервера, валидация `http(s)://`, индикатор «Сохранено!». Форма остаётся смонтированной (`display:none`) в свёрнутом виде, поэтому черновик ввода не теряется при сворачивании аккордеона. Заголовок-строка отдаёт `accessibilityState={{ expanded }}`.
- **Резервная копия данных** — `BackupSection` (`src/features/settings-backup/ui/BackupSection.tsx`): кнопки «Создать новый экспорт» и «Импортировать». Если папка ещё не выбрана, «Создать новый экспорт» сначала открывает системный выбор папки и затем экспортирует в неё (отмена — без действий). На Android и web с File System Access API есть строка выбора папки («Выбрать папку» / «Сменить папку») и чекбокс «Автосинхронизация»; на iOS и в браузерах без FSA строки папки и автосинхронизации скрыты (`supportsFolderSync()` = false), экспорт идёт через share sheet (iOS) или скачивание файла (web), импорт — через системный выбор файла. Диалоги: `BackupImportModeDialog` («Объединить / Заменить») и `ServerUrlChangeDialog` (подтверждение смены URL сервера из файла). Подробно — в [features/settings-backup.md](../features/settings-backup.md).

В **теле экрана пункта админ-доступа нет**. Единственная точка входа — иконка-кебаб (`MaterialCommunityIcons` `dots-vertical`) в шапке (`SettingsHeaderMenu`, `src/pages/settings/ui/SettingsHeaderMenu.tsx`; подключается как `headerRight` для маршрута `settings` в `app/_RootLayout.tsx`). По нажатию открывается `MenuDropdown` (`shared/ui/menu`) с одним пунктом: для неаутентифицированных — «Войти в аккаунт администратора» (`shield-outline`) → `useAdminEntry` (`/admin` или `/admin/login`); для аутентифицированных — «Выйти из аккаунта админа» (`log-out-outline`) → `signOut` (`entities/auth`).

> Переключателя «Кеширование проповедей» на этом экране нет: он живёт в шапке экрана [«Офлайн»](./offline.md) как переключатель-тумблер (`SermonCachingHeaderSwitch`) — рядом со списком скачанного, которым он и управляет.

## Откуда данные

- Тема: `themeModeAtom`, `dynamicColorsEnabledAtom` (из `shared/ui/theme`, слой `shared`).
- Виброотклик: `hapticsEnabledAtom` (из `shared/model`); на web пункт рендерится только при поддержке Vibration API, иначе значение остаётся в хранилище.
- URL сервера: `serverUrlAtom`, `setServerUrlAction` (из `shared/model`, файл `src/shared/model/settings.ts`), дефолт `DEFAULT_API_URL` из `src/shared/config`.
- Резервная копия: `backupFolderUriAtom`, `backupAutosyncEnabledAtom` (из `features/settings-backup`); данные читаются/пишутся через владельческие пути (`readHistory`/`writeHistory`, `persistMyPlaylists`, экшены темы/плеера) и скаляры из AsyncStorage. Ключи папки — `backup_dir_uri`, `backup_autosync` ([contracts/storage.md](../contracts/storage.md)).

## Куда можно перейти

- **Админ-доступ** (кебаб-меню в шапке) — `/admin` или `/admin/login` (или выход из аккаунта админа, без навигации).
- Внутри экрана — диалог темы, других переходов нет.

## Состояния

- Загрузка: данные атомов инициализируются при старте; на экране нет отдельного состояния загрузки.
- Валидация: кнопка «Сохранить» для URL активна только при валидном и изменённом значении.
- Резервная копия (режим папки): при недоступной сохранённой папке подзаголовок показывает «Папка недоступна — выберите заново», кнопка предлагает выбрать папку заново; при отсутствии файла в папке показывается ошибка чтения.

## Связанные документы

- [features/theme.md](../features/theme.md)
- [features/audio-cache.md](../features/audio-cache.md)
- [features/state.md](../features/state.md)
- [features/settings-backup.md](../features/settings-backup.md)
- [contracts/storage.md](../contracts/storage.md)
