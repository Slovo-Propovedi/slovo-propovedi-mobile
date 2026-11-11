# Экран «Ещё»

**Маршрут:** `/more` (таб)
**Файлы:** `app/(tabs)/more.tsx` → `export { MoreMenu as default }` из `pages/more`
**Статус:** готов

## Что делает

Меню приложения. Показывает название, версию, описание и список пунктов навигации.

## Что показывается

`MoreScreen` (`src/pages/more/ui/MoreScreen.tsx`, стили `src/pages/more/ui/styles.ts`):

- **Крупный заголовок:** «Ещё» (`ScreenTitleRow` из `shared/ui`: `FONT_SIZES.h1`, `fontWeight: '700'`, цвет `currentTheme.text`, отступ слева `INDENTS.high`) — слева в верхней строке, как в Apple Music; заголовок `flex: 1`, поэтому кнопки справа прижаты к краю, а строка держит `minHeight: MIN_TOUCH_TARGET`. Строка — первый блок скролл-контента и скроллится вместе с содержимым.
- **Блок приложения под заголовком:** `styles.headerTexts` — название `APP_NAME` («Слово.Проповеди») и версия `v{APP_VERSION}` (из `shared/config`) с горизонтальным отступом `INDENTS.high` и небольшим верхним зазором после заголовка.
- **Кнопка «В админ панель»** (`AdminPanelButton`, `IconButton` с иконкой `shield-outline`, `accessibilityLabel='В админ панель'`) — справа в строке заголовка рядом с «?» (`HelpHeaderButton`), in-flow, без absolute-позиционирования. Показывается **только** аутентифицированному пользователю с ролью `admin`/`moderator` (проверка `canAccessAdmin`, `entities/auth`); при `idle`/`loading` или у обычного пользователя кнопки нет. Корневой `SafeAreaView` использует явные края `edges={['left', 'right']}` + `paddingTop: insets.top` (как на «Слушать»), верхний инсет снимается один раз;
- Описание: «Приложение для прослушивания и чтения проповедей»;
- Пункты меню (`MoreMenuSettingsItem`): «Офлайн» (иконка `cloud-offline-outline`, первый в списке), «История прослушивания» (иконка `time-outline`), «Настройки» (иконка `settings-outline`), «О приложении» (иконка `information-circle-outline`) и «Поделиться приложением» (иконка `share-social-outline`).
- Кнопка «?» в строке заголовка (рядом с кнопкой «В админ панель», не в нативной шапке) — онбординг/обзор возможностей (см. [../features/onboarding.md](../features/onboarding.md)). Локальные сценарии экрана — `history`, `offline`, `settings`, а также `backup` и `share` (их `screens` начинаются с `/more`); на прочих экранах `backup` и `share` остаются в группе «Глобальные» (`globalFallback: true`). Тур `backup` со «Ещё» стартует с интро-карточки «Резервная копия» (безмаршрутное интро и мигание таба `tab.more` пропущены) и ведёт тапом по пункту «Настройки» `more.settings-item` к секции копий на `/settings`; с чужого экрана играет полную подводку (интро → мигание таба → интро-карточка → «Настройки»). `share` со «Ещё» стартует с интро-карточки пункта «Поделиться приложением» (безмаршрутное интро и мигание таба `tab.more` пропущены) и ведёт миганием пункта `more.share-item` на `/share`; с чужого экрана играет полную подводку (интро → мигание таба → интро-карточка пункта → `/share`). С «Ещё» также стартует сценарий `search` (интро → мигание таба `tab.listen` и переход на `/listen` → открытие поиска).

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
