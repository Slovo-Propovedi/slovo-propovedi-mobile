# Экран «О приложении»

**Маршрут:** `/about`
**Файлы:** `app/about.tsx` → `export { AboutScreen as default }` из `pages/about`
**Статус:** готов

## Что делает

Информация о приложении: иконка, название, версия, описание, ссылки на исходный код и лицензию, копирайт.

## Что показывается

`AboutScreen` (`src/pages/about/ui/AboutScreen.tsx`) — `ScrollView` из секций:

- Иконка приложения (`assets/icon.png` через `expo-asset`), `APP_NAME`, `Версия {APP_VERSION}`;
- Блок «Информация» — краткое описание;
- Блок «Исходный код» — текст + `LinkButton` «Исходный код на Forgejo» (`src/pages/about/ui/LinkButton.tsx`, иконка `git-branch-outline`), открывает `PROJECT_URL` через `openURL`;
- `LinkButton` «Лицензия GPL-3.0-or-later» (иконка `document-text-outline`), открывает `LICENSE_URL`;
- Копирайт: `© {COPYRIGHT_YEAR} {COPYRIGHT_HOLDER}`.

## Откуда данные

- Константы из `src/shared/config`: `APP_NAME`, `APP_VERSION`, `COPYRIGHT_HOLDER`, `COPYRIGHT_YEAR`, `LICENSE_NAME`, `LICENSE_URL`, `PROJECT_URL`.
  - `PROJECT_URL = https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/`
  - `LICENSE_NAME = GPL-3.0-or-later`, `COPYRIGHT_HOLDER = Slovo.Propovedi`, `COPYRIGHT_YEAR = 2026`.

## Куда можно перейти

- Внешние ссылки: исходный код (Forgejo) и текст лицензии — через `expo-linking` `openURL`.

## Состояния

- Статичный экран; переходы по ссылкам открываются во внешнем браузере.

## Связанные документы

- [screens/more.md](./more.md)
