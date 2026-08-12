# Таб «Еще»

**Маршрут:** `/more` (таб)
**Файлы:** `app/(tabs)/more.tsx` → `export { MoreMenu as default }` из `pages/more`
**Статус:** готов

## Что делает

Меню приложения. Показывает название, версию, описание и список пунктов навигации.

## Что показывается

`MoreScreen` (`src/pages/more/ui.tsx`, стили `src/pages/more/styles.ts`):

- Заголовок: `APP_NAME` («Слово.Проповеди»), версия `v{APP_VERSION}` (из `shared/config`);
- Описание: «Приложение для прослушивания и чтения проповедей»;
- Пункты меню (`MoreMenuSettingsItem`): «Настройки» (иконка `settings-outline`) и «О приложении» (иконка `information-circle-outline`).

## Откуда данные

- Константы `APP_NAME`, `APP_VERSION` из `src/shared/config`.

## Куда можно перейти

- «Настройки» → `/settings` (`router.push('/settings')`).
- «О приложении» → `/about` (`router.push('/about')`).

## Состояния

- Данных для загрузки нет; экран статичный.

## Связанные документы

- [screens/settings.md](./settings.md)
- [screens/about.md](./about.md)
