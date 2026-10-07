# Таб «Ещё»

**Маршрут:** `/more` (таб)
**Файлы:** `app/(tabs)/more.tsx` → `export { MoreMenu as default }` из `pages/more`
**Статус:** готов

## Что делает

Меню приложения. Показывает название, версию, описание и список пунктов навигации.

## Что показывается

`MoreScreen` (`src/pages/more/ui/MoreScreen.tsx`, стили `src/pages/more/ui/styles.ts`):

- Заголовок: `APP_NAME` («Слово.Проповеди»), версия `v{APP_VERSION}` (из `shared/config`) — слева в строке заголовка `styles.header` (`flexDirection: 'row'`, `alignItems: 'center'`, `minHeight: MIN_TOUCH_TARGET`) вместе с кнопкой **«В админ панель»** (`AdminPanelButton`, `IconButton` с иконкой `shield-outline`, `accessibilityLabel='В админ панель'`) — она **in-flow сиблинг строки заголовка**, справа от блока `headerTexts` (тексты версии/названия), без absolute-позиционирования. На конце строки кнопку удерживает `headerTexts.flex: 1`; резерв высоты строки совпадает с 48pt тач-таргетом щита. Показывается **только** аутентифицированному пользователю с ролью `admin`/`moderator` (проверка `canAccessAdmin`, `entities/auth`); при `idle`/`loading` или у обычного пользователя кнопки нет. Строка заголовка `styles.header` — первый ребёнок скролл-контента на `y=0` (`contentContainerStyle` не задаёт `paddingTop`); содержимое заголовка выровнено по центру верхней строки экрана «Слушать» (≈28pt ниже верхнего инсета): строка «Слушать» высотой 56pt из-за `INDENTS.medium`-паддинга `SearchToggleButton`, а «Ещё» добирает разницу `paddingTop` над своим 48pt (`MIN_TOUCH_TARGET`) заголовком, поэтому оба щита админки стоят на одной высоте. Корневой `SafeAreaView` использует явные края `edges={['top', 'left', 'right']}` (как на «Слушать»), верхний инсет снимается один раз;
- Описание: «Приложение для прослушивания и чтения проповедей»;
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
