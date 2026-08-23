# Поделиться приложением

**Маршрут:** `/share`
**Файлы:** `app/share.tsx` → реэкспорт `ShareScreen` из `src/pages/share/ui/ShareScreen.tsx`
**Статус:** готов

## Что делает

Экран для распространения приложения: показывает QR-код со ссылкой на страницу последнего релиза и позволяет скопировать эту ссылку в буфер обмена.

## Что показывается

`ShareScreen` (`src/pages/share/ui/ShareScreen.tsx`, стили `src/pages/share/ui/styles.ts`):

- Название релиза (`release.name`) и версия («Версия {release.version}»);
- QR-код со ссылкой на страницу релиза (`release.htmlUrl`) на белой карточке (QR всегда рендерится с тёмными модулями на светлом фоне, независимо от темы);
- Текст ссылки `release.htmlUrl` (muted, selectable);
- Кнопка «Скопировать ссылку» (`CopyLinkButton`, иконка `copy-outline`); после успешного копирования на ~2 секунды меняется на «Скопировано» с иконкой `checkmark-circle-outline`.

## Откуда данные

- Хук `useLatestReleaseUrl` (`src/pages/share/lib/useLatestReleaseUrl.ts`) — дискриминированное объединение `LatestReleaseState` (`loading` / `error` / `ready`);
- Данные релиза — `fetchLatestRelease()` из `shared/lib/version-check` (Forgejo API с фолбэком на GitHub API).

## Куда можно перейти

- Навигационных переходов нет; возврат назад — системная кнопка/заголовок стека.

## Состояния

- Загрузка: центрированный `ActivityIndicator`;
- Ошибка: текст «Не удалось загрузить информацию о релизе» + кнопка «Повторить» (повторный запрос);
- Готово: название/версия релиза, QR-код, ссылка, кнопка копирования.

## Связанные документы

- [screens/more.md](./more.md) — пункт меню «Поделиться приложением»
- [features/updates.md](../features/updates.md) — тот же источник данных о релизах (`fetchLatestRelease`)
- [decisions.md](../decisions.md) — `react-native-qrcode-svg`, `react-native-svg` в Approved stack
