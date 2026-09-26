# Экран «Страница не найдена»

**Маршрут:** `*not-found` — любой несовпавший путь (для кастомных схем — `slovo-propovedi://<путь>`)
**Файлы:** `app/+not-found.tsx` → `export { NotFoundScreen as default }` из `pages/not-found` (`src/pages/not-found/ui/NotFoundScreen.tsx`)
**Статус:** готов

## Что делает

Заглушка для несовпавших маршрутов: сообщает пользователю, что страница не найдена, выводит нераспознанный путь и предлагает вернуться на главный экран. Заменяет встроенный системный экран Unmatched из expo-router (см. [features/deep-links.md](../features/deep-links.md) → «Поведение незаявленных путей») и тем самым устраняет падение release-сборки на `resolveScheme`.

## Что показывается

`NotFoundScreen` (`src/pages/not-found/ui/NotFoundScreen.tsx`) — полноэкранный центрированный блок в `SafeAreaView` (фон — `currentTheme.background`, `FONT_SIZES`/`INDENTS`/`RADIUSES` из `shared/ui/theme`):

- заголовок «Страница не найдена»;
- подзаголовок с несовпавшим путём (`/<сегменты>`, например `/foo/bar`) — формируется из параметра `not-found`; если параметра нет, подзаголовок не рендерится;
- кнопка **«На главный экран»** (`PressableButton` из `shared/ui/pressable-button` с `accessibilityLabel`) — `router.replace('/listen')`.

## Откуда данные

- Параметр маршрута `not-found` (`useLocalSearchParams<{ 'not-found'?: string | string[] }>` из `expo-router`) — массив сегментов несовпавшего пути; может прийти строкой или отсутствовать (оба случая нормализуются в `formatUnmatchedPath`).
- Тема — `useTheme()`.

## Куда можно перейти

- Кнопка «На главный экран» → `router.replace('/listen')`. Именно `replace`, а не `push`: у холодного старта по ссылке нет истории для возврата.

## Состояния

- Загрузка/пусто/ошибка: нет — экран статичен.
- Без параметра пути: заголовок и кнопка на месте, подзаголовок с путём скрыт.

## Связанные документы

- [features/deep-links.md](../features/deep-links.md) — поведение незаявленных путей, фикс `resolveScheme`-краша
- [features/navigation.md](../features/navigation.md) — маршруты приложения
- [screens/listen.md](./listen.md) — главный экран, куда ведёт кнопка
