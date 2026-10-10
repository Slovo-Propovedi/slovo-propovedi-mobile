# Таб «Учиться»

**Маршрут:** `/study` (таб)
**Файлы:** `app/(tabs)/study.tsx` → `export { StudyScreen as default }` из `pages/study`
**Статус:** **гейтится фича-флагом `study`** — кнопка в `CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`, `isDisabled={!isTabAvailable(route.name)}`) при выключенном флаге показывает глобальный информационный диалог «Скоро будет доступно» (`showInfo`) и не навигирует; `StudyScreen` дополнительно не рендерит контент при `useFeatureFlag('study') === false` (см. [features/feature-flags.md](../features/feature-flags.md)). Внутри экрана — заглушка.

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

- Никуда; таб доступен только при включённом фича-флаге `study` (иначе — блокировка в `CustomTabBar` с глобальным информационным диалогом «Скоро будет доступно» через `showInfo`).

## Состояния

- Таб гейтится фича-флагом `study`: при выключенном/незагруженном флаге `CustomTabBar` блокирует переход, `StudyScreen` рендерит `null`; при включённом — контент экрана (заглушки, не предназначенные для показа пользователю).

## Связанные документы

- [debt.md](../debt.md)
