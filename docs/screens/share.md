# Поделиться приложением

**Маршрут:** `/share`
**Файлы:** `app/share.tsx` → реэкспорт `ShareScreen` из `src/pages/share/ui/ShareScreen.tsx`
**Статус:** готов

## Что делает

Экран для распространения приложения: три сворачиваемые секции — ссылка на сайт-лендинг, ссылка на веб-версию приложения и ссылка на страницу последнего релиза в репозитории — каждая с QR-кодом, кликабельной ссылкой и кнопкой копирования. Открыта может быть только одна секция одновременно.

## Что показывается

`ShareScreen` (`src/pages/share/ui/ShareScreen.tsx`, стили `src/pages/share/ui/styles.ts`) — три `CollapsibleSection` (`src/pages/share/ui/CollapsibleSection.tsx`), управляемые одним состоянием `expandedSection: 'landing' | 'webApp' | 'release' | null` в `ShareScreen`; при открытии одной секции другая закрывается (нажатие на уже открытую секцию сворачивает её, оставляя обе закрытыми).

- **«Сайт»** — открыта по умолчанию (`expandedSection` инициализируется `'landing'`). Содержимое — `ShareLinkCard` (`src/pages/share/ui/ShareLinkCard.tsx`) со статической ссылкой `LANDING_URL` (`src/pages/share/lib/constants.ts` — `https://slovo-propovedi.ru/`).
- **«Веб-версия»** — свёрнута по умолчанию. Содержимое — `ShareLinkCard` со статической ссылкой `WEB_APP_URL` (`src/pages/share/lib/constants.ts` — `https://app.slovo-propovedi.ru/`, тот же web-билд приложения, см. [features/web.md](../features/web.md)).
- **«Приложение»** — свёрнута по умолчанию. Содержимое зависит от `useLatestReleaseUrl`:
  - Загрузка: центрированный `ActivityIndicator`;
  - Ошибка: текст «Не удалось загрузить информацию о релизе» + кнопка «Повторить» (повторный запрос);
  - Готово: название релиза (`release.name`), версия («Версия {release.version}»), `ShareLinkCard` со ссылкой `release.htmlUrl`.
  - Хук вызывается независимо от того, открыта ли секция — данные о релизе подгружаются сразу при монтировании экрана, а не при первом раскрытии.

`ShareLinkCard` — общий блок для всех трёх секций: QR-код на белой карточке (QR всегда рендерится с тёмными модулями на светлом фоне, независимо от темы), текст ссылки (подчёркнутый, цвета `primary`, selectable), кнопка «Скопировать ссылку» (`CopyLinkButton`, иконка `copy-outline`); после успешного копирования на ~2 секунды меняется на «Скопировано» с иконкой `checkmark-circle-outline`. QR-код и текст ссылки обёрнуты в отдельные `Pressable` и открывают ссылку в браузере по тапу (`Linking.openURL`) — обычный `TouchableItem` не подошёл, у него зашита `width: '100%'`, из-за которой QR-карточка растягивалась на всю ширину строки.

`CollapsibleSection` — контролируемый компонент (`isExpanded`/`onToggle` пропсами, состояние не хранит сам). Заголовок — `TouchableItem` с `testID={`share-section-header-${title}`}` (использован вместо accessible role/name — заголовок содержит декоративную иконку-глиф `Ionicons` рядом с текстом, из-за чего вычисляемое accessible-имя кнопки не совпадает точно с текстом заголовка; см. [`debt.md`](../debt.md) → Tests) и иконкой `chevron-up`/`chevron-down`.

## Откуда данные

- Хук `useLatestReleaseUrl` (`src/pages/share/lib/useLatestReleaseUrl.ts`) — дискриминированное объединение `LatestReleaseState` (`loading` / `error` / `ready`);
- Данные релиза — `fetchLatestRelease()` из `shared/lib/version-check` (Forgejo API с фолбэком на GitHub API);
- Ссылка на лендинг — константа `LANDING_URL` (`src/pages/share/lib/constants.ts`), не запрашивается.

## Куда можно перейти

- Навигационных переходов нет; возврат назад — кастомная кнопка в шапке стека, см. [features/navigation.md](../features/navigation.md).

## Состояния

- Секции «Сайт» и «Веб-версия»: единственное состояние — ссылка + QR всегда доступны (нет загрузки/ошибки, ссылка статическая).
- Секция «Приложение»: загрузка / ошибка+повтор / готово (см. выше).

## Связанные документы

- [screens/more.md](./more.md) — пункт меню «Поделиться приложением»
- [features/updates.md](../features/updates.md) — тот же источник данных о релизах (`fetchLatestRelease`)
- [features/navigation.md](../features/navigation.md) — кастомная кнопка «Назад» в шапке стека
- [decisions.md](../decisions.md) — `react-native-qrcode-svg`, `react-native-svg` в Approved stack
