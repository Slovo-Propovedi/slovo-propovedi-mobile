# Таб «Учиться»

**Маршрут:** `/study` (таб)
**Файлы:** `app/(tabs)/study.tsx` → `export { StudyScreen as default }` из `pages/study`
**Статус:** **заблокирован** — кнопка в `CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`, `isDisabled={route.name === 'study'}`) показывает диалог «Скоро будет доступно». Внутри экрана — заглушка.

## Что делает (планируемое)

Таб обучения. Планируется `TabView` с двумя вкладками. Сейчас экран — каркас с серыми заглушками-страницами.

## Что показывается

`StudyScreen` (`src/pages/study/ui.tsx`) — `TabView` из `react-native-tab-view` с двумя маршрутами:

- «Богословие» (`first`);
- «Душепопечение» (`second`).

Сцены — серые `View`-заглушки: `FirstRoute`/`SecondRoute` из `src/pages/study/scene-routes.tsx`, сборка в `src/pages/study/scene.tsx` через `SceneMap`.

## Откуда данные

- Данные отсутствуют (заглушки).

## Куда можно перейти

- Никуда; таб доступен только через блокировку в `CustomTabBar` (диалог «Скоро будет доступно»).

## Состояния

- Таб заблокирован в `CustomTabBar`; контент экрана — заглушки, не предназначенные для показа пользователю.

## Связанные документы

- [debt.md](../debt.md)
