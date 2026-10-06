# Экран «Настройки»

**Маршрут:** `/settings`
**Файлы:** `app/settings.tsx` → `export { SettingsScreen as default }` из `pages/settings`
**Статус:** готов

## Что делает

Управление настройками приложения: тема оформления, динамические цвета, виброотклик, адрес сервера API.

## Что показывается

`SettingsScreen` (`src/pages/settings/ui/SettingsScreen.tsx`) — вертикальный `ScrollView` из пунктов:

- **Тема оформления** — `ThemeDialog` + `ThemeSelector` (`src/pages/settings/ui/ThemeDialog.tsx`, `ThemeSelector.tsx`, `ThemeSelectorOption.tsx`, `themeOptions.ts`): светлая / тёмная / как в системе.
- **Динамические цвета** — `DynamicColorsItem` (`src/pages/settings/ui/DynamicColorsItem.tsx`), Material You; показывается только если `isMaterialYouSupported()` (Android).
- **Виброотклик** — `HapticsSettingsItem` (`src/pages/settings/ui/HapticsSettingsItem.tsx`): глобальный переключатель вибрации при перемотке и нажатиях. На web строка скрыта (`Platform.OS !== 'web'`) — вибрации в браузере нет, хук-обёртка `shared/lib/haptics` там no-op.
- **URL сервера API** — `ServerUrlSettings` (`src/pages/settings/ui/ServerUrlSettings.tsx`): аккордеон, свёрнут по умолчанию (заголовок + «Текущий: …» + шеврон), тап по строке разворачивает форму (`ServerUrlForm.tsx`): изменение/сброс адреса сервера, валидация `http(s)://`, индикатор «Сохранено!». Форма остаётся смонтированной (`display:none`) в свёрнутом виде, поэтому черновик ввода не теряется при сворачивании аккордеона. Заголовок-строка отдаёт `accessibilityState={{ expanded }}`.

В **теле экрана пункта админ-доступа нет**. Единственная точка входа — иконка-кебаб (`MaterialCommunityIcons` `dots-vertical`) в шапке (`SettingsHeaderMenu`, `src/pages/settings/ui/SettingsHeaderMenu.tsx`; подключается как `headerRight` для маршрута `settings` в `app/_RootLayout.tsx`). По нажатию открывается `MenuDropdown` (`shared/ui/menu`) с одним пунктом: для неаутентифицированных — «Войти в аккаунт администратора» (`shield-outline`) → `useAdminEntry` (`/admin` или `/admin/login`); для аутентифицированных — «Выйти из аккаунта админа» (`log-out-outline`) → `signOut` (`entities/auth`).

> Переключателя «Кеширование проповедей» на этом экране нет: он живёт в шапке экрана [«Офлайн»](./offline.md) как переключатель-тумблер (`SermonCachingHeaderSwitch`) — рядом со списком скачанного, которым он и управляет.

## Откуда данные

- Тема: `themeModeAtom`, `dynamicColorsEnabledAtom` (из `shared/ui/theme`, слой `shared`).
- Виброотклик: `hapticsEnabledAtom` (из `shared/model`); на web пункт не рендерится, значение остаётся в хранилище.
- URL сервера: `serverUrlAtom`, `setServerUrlAction` (из `shared/model`, файл `src/shared/model/settings.ts`), дефолт `DEFAULT_API_URL` из `src/shared/config`.

## Куда можно перейти

- **Админ-доступ** (кебаб-меню в шапке) — `/admin` или `/admin/login` (или выход из аккаунта админа, без навигации).
- Внутри экрана — диалог темы, других переходов нет.

## Состояния

- Загрузка: данные атомов инициализируются при старте; на экране нет отдельного состояния загрузки.
- Валидация: кнопка «Сохранить» для URL активна только при валидном и изменённом значении.

## Связанные документы

- [features/theme.md](../features/theme.md)
- [features/audio-cache.md](../features/audio-cache.md)
- [features/state.md](../features/state.md)
- [contracts/storage.md](../contracts/storage.md)
