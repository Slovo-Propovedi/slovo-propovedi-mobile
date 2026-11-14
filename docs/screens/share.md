# Поделиться приложением

**Маршрут:** `/share`
**Файлы:** `app/share.tsx` → реэкспорт `ShareScreen` из `src/pages/share/ui/ShareScreen.tsx`
**Статус:** готов

## Что делает

Экран для распространения приложения: три сворачиваемые секции — ссылка на сайт-лендинг, ссылка на веб-версию приложения и ссылка на страницу последнего релиза в репозитории — каждая с QR-кодом, кликабельной ссылкой и кнопкой копирования. Открыта может быть только одна секция одновременно.

## Что показывается

`ShareScreen` (`src/pages/share/ui/ShareScreen.tsx`, стили `src/pages/share/ui/styles.ts`) — три `CollapsibleSection` (`src/pages/share/ui/CollapsibleSection.tsx`), управляемые одним состоянием `expandedSection: 'landing' | 'webApp' | 'release' | null` в `ShareScreen`; при открытии одной секции другая закрывается (нажатие на уже открытую секцию сворачивает её, оставляя обе закрытыми).

- **«Сайт»** — открыта по умолчанию (`expandedSection` инициализируется `'landing'`). Содержимое — `ShareLinkCard` (`src/pages/share/ui/ShareLinkCard.tsx`) со статической ссылкой `LANDING_URL` (`src/pages/share/lib/constants.ts` — `https://slovo-propovedi.ru/`).
- **«Веб-версия»** — свёрнута по умолчанию. Содержимое — `ShareLinkCard` со ссылкой `WEB_APP_URL` (`src/pages/share/lib/constants.ts` — ссылка собирается из `ENV.webHostname`: env `EXPO_PUBLIC_WEB_HOSTNAME`, prod `app.slovo-propovedi.ru`; тот же web-билд приложения, см. [features/web.md](../features/web.md)).
- **«Приложение»** — свёрнута по умолчанию. Содержимое зависит от `useLatestReleaseUrl`:
  - Загрузка: центрированный `ActivityIndicator`;
  - Ошибка: текст «Не удалось загрузить информацию о релизе» + кнопка «Повторить» (повторный запрос);
  - Готово: название релиза (`release.name`), версия («Версия {release.version}»), `ShareLinkCard` со ссылкой `release.htmlUrl` — страница релиза того источника, который ответил на проверку версии (обычно git.lightnode.ru; codeberg/github — только если ответил fallback).
  - Хук вызывается независимо от того, открыта ли секция — данные о релизе подгружаются сразу при монтировании экрана, а не при первом раскрытии.

`ShareLinkCard` — общий блок для всех трёх секций: QR-код на белой карточке (QR всегда рендерится с тёмными модулями на светлом фоне, независимо от темы), текст ссылки (подчёркнутый, цвета `primary`, selectable), кнопка «Скопировать ссылку» (`CopyLinkButton`, иконка `copy-outline`); после успешного копирования на ~2 секунды меняется на «Скопировано» с иконкой `checkmark-circle-outline`. В буфер обмена кладётся не голая ссылка, а сообщение с описанием приложения — `SHARE_MESSAGE` (`src/pages/share/lib/constants.ts`) + перевод строки + сама ссылка, поэтому скопированный текст можно сразу пересылать в мессенджер. Рядом с копированием — кнопка «Поделиться ссылкой» (`ShareLinkButton`, иконка `share-outline`): открывает системный шит шаринга с тем же текстом (`SHARE_MESSAGE` + ссылка) через `shareLink` (`src/shared/lib/shareLink.ts` / `.web.ts`); ошибка шаринга — тост «Не удалось поделиться. Попробуйте ещё раз», успех и закрытие шита пользователем — молча. Кнопка рендерится **только при поддержке шаринга платформой** (`isShareSupported`, `src/shared/lib/isShareSupported.ts` / `.web.ts`: на нативе — всегда, на web — лишь при наличии Web Share API), на десктопных браузерах без `navigator.share` её нет. QR-код и текст ссылки обёрнуты в отдельные `Pressable` и открывают ссылку в браузере по тапу (`Linking.openURL`) — обычный `TouchableItem` не подошёл, у него зашита `width: '100%'`, из-за которой QR-карточка растягивалась на всю ширину строки.

`CollapsibleSection` — контролируемый компонент (`isExpanded`/`onToggle` пропсами, состояние не хранит сам). Заголовок — `TouchableItem` (роль `button`, в тестах ищется по тексту заголовка) с декоративной иконкой-глифом `Ionicons` (`chevron-up`/`chevron-down`, скрытой от доступности через `accessibilityElementsHidden` + `importantForAccessibility='no'`).

- Кнопка «?» в шапке (общий `renderHelp` корневого стека, `app/_RootLayout.tsx`) — онбординг/обзор возможностей (см. [../features/onboarding.md](../features/onboarding.md)). Сценарий `share` («Поделиться приложением») на «Ещё» и «Поделиться приложением» попадает в группу «На этом экране», на прочих экранах — в «Глобальные» (`globalFallback: true`). Начатый со `/share`, тур пропускает подводку и сразу подсвечивает QR-код (`share.qr`), кнопки «Скопировать ссылку» (`share.copy`) и «Поделиться ссылкой» (`share.send`) лендинга, а последний шаг — текстовый, про содержимое сайта (счётчик «1 из 4»); шаг `share.send` условный (`skipIfMissing`) — там, где кнопки нет (web без Web Share API), он выбывает. Начатый с «Ещё» — стартует с интро-карточки пункта «Поделиться приложением» (вводное интро и мигание таба `tab.more` пропущены), затем **переход входа** мигает пунктом `more.share-item` и открывает `/share`, после чего играет те же карточки (счётчик «1 из 5»); начатый с чужого экрана — играет полную подводку: интро → мигание таба `tab.more` с переключением на «Ещё» → интро-карточка пункта → мигание пункта `more.share-item` → `/share`.

## Откуда данные

- Хук `useLatestReleaseUrl` (`src/pages/share/lib/useLatestReleaseUrl.ts`) — дискриминированное объединение `LatestReleaseState` (`loading` / `error` / `ready`);
- Данные релиза — `fetchLatestRelease()` из `shared/lib/version-check` (Forgejo API → Codeberg API → GitHub API);
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
