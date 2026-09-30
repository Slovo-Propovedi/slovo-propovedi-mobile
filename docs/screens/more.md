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
- Кнопка **«В админ панель»** (`AdminPanelButton`, иконка `shield-outline`, фон `primary`) — **первой**, выше блока меню. Показывается **только** аутентифицированному пользователю с ролью `admin`/`moderator` (проверка `canAccessAdmin`, `entities/auth`); при `idle`/`loading` или у обычного пользователя кнопки нет;
- Пункты меню (`MoreMenuSettingsItem`): «Офлайн» (иконка `cloud-offline-outline`, первый в списке), «История прослушивания» (иконка `time-outline`), «Настройки» (иконка `settings-outline`), «О приложении» (иконка `information-circle-outline`) и «Поделиться приложением» (иконка `share-social-outline`).

## Откуда данные

- Константы `APP_NAME`, `APP_VERSION` из `src/shared/config`.
- Кнопка «В админ панель» — видимость из `authStatusAtom`/`authUserAtom` + `canAccessAdmin` (`entities/auth`). `MoreScreen` при монтировании восстанавливает сессию (`restoreSession`), если статус `idle`, чтобы роль была известна. Нажатие пушит `/admin`.

## Куда можно перейти

- «В админ панель» → `/admin` (`router.push('/admin')`); кнопка видна только для `admin`/`moderator`.
- «Офлайн» → `/offline` (`router.push('/offline')`).
- «История прослушивания» → `/history` (`router.push('/history')`).
- «Настройки» → `/settings` (`router.push('/settings')`).
- «О приложении» → `/about` (`router.push('/about')`).
- «Поделиться приложением» → `/share` (`router.push('/share')`).

## Состояния

- Данных для загрузки нет; экран статичный.
- При первом монтировании (`authStatus === 'idle'`) запускается `restoreSession`; до завершения кнопка «В админ панель» не рендерится.

## Связанные документы

- [screens/history.md](./history.md)
- [screens/offline.md](./offline.md)
- [screens/settings.md](./settings.md)
- [screens/about.md](./about.md)
- [screens/share.md](./share.md)
