# Экран «Настройки»

**Маршрут:** `/settings`
**Файлы:** `app/settings.tsx` → `export { SettingsScreen as default }` из `pages/settings`
**Статус:** готов

## Что делает

Управление настройками приложения: тема оформления, динамические цвета, очистка кэша, адрес сервера API.

## Что показывается

`SettingsScreen` (`src/pages/settings/ui/SettingsScreen.tsx`) — вертикальный `ScrollView` из пунктов `SettingsItem`:

- **Тема оформления** — `ThemeDialog` + `ThemeSelector` (`src/pages/settings/ui/ThemeDialog.tsx`, `ThemeSelector.tsx`, `ThemeSelectorOption.tsx`, `themeOptions.ts`): светлая / тёмная / как в системе.
- **Динамические цвета** — `DynamicColorsItem` (`src/pages/settings/ui/DynamicColorsItem.tsx`), Material You; показывается только если `isMaterialYouSupported()` (Android).
- **Очистить кэш** — `ClearCacheDialog` (`src/pages/settings/ui/ClearCacheDialog.tsx`): удаление всех скачанных аудиофайлов; ошибки через `ErrorDialog` (`shared/ui/error-dialog`).
- **URL сервера API** — `ServerUrlSettings` (`src/pages/settings/ui/ServerUrlSettings.tsx`): изменение/сброс адреса сервера, валидация `http(s)://`, индикатор «Сохранено!».

## Откуда данные

- Тема: `themeModeAtom`, `dynamicColorsEnabledAtom` (из `shared/ui/theme`, слой `shared`).
- URL сервера: `serverUrlAtom`, `setServerUrlAction` (из `entities/settings`), дефолт `DEFAULT_API_URL` из `src/shared/config`.
- Очистка кэша: `clearCacheAction` из `src/pages/settings/model.ts` → `clearCache` из `src/pages/settings/lib/clearCache.ts`.

## Куда можно перейти

- Внутри экрана — диалоги (тема, очистка кэша), переходов на другие маршруты нет.

## Состояния

- Загрузка: данные атомов инициализируются при старте; на экране нет отдельного состояния загрузки.
- Ошибка: при очистке кэша — `ErrorDialog` («Не удалось очистить кеш. Попробуйте снова.»).
- Валидация: кнопка «Сохранить» для URL активна только при валидном и изменённом значении.

## Связанные документы

- [features/theme.md](../features/theme.md)
- [features/audio-cache.md](../features/audio-cache.md)
- [features/state.md](../features/state.md)
- [contracts/storage.md](../contracts/storage.md)
