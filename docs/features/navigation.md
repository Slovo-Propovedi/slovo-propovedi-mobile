# Навигация (Expo Router)

**Стек:** `expo-router` (`~57.0.12`), настройка — `app/`
**Статус:** готов (табы «Читать»/«Учиться» заблокированы)

## Точка входа

`app/index.tsx` — `<Redirect href='/listen' />`. Первый экран приложения — таб «Слушать».

## Корневой стек

`app/_RootLayout.tsx` (`_RootLayout`) — содержит `Stack`:

- `index` и `(tabs)` — без шапки (`headerShown: false`);
- `settings` — заголовок «Настройки»;
- `about` — заголовок «О приложении»;
- `history` — заголовок «История прослушивания», вход из вкладки «Еще» (`router.push('/history')`);
- `share` — заголовок «Поделиться приложением» (см. [`../screens/share.md`](../screens/share.md)).
- цвет фона контента и шапки — из `currentTheme`; `headerTitleAlign: 'center'` в `screenOptions` — заголовок центрирован в шапке, а не прижат к кастомной кнопке «Назад» (см. ниже).

**Кнопка «Назад» в шапке (`headerLeft`)** — все четыре под-экрана (`settings`/`history`/`about`/`share`) используют кастомный `HeaderBackButton` (`src/widgets/sub-screen-header-back/ui/HeaderBackButton.tsx`) вместо стандартной кнопки react-navigation:

- По нажатию: если `router.canGoBack()` — `router.back()`; иначе — `router.replace('/more')` (таб «Еще», логический родитель всех четырёх под-экранов).
- **Почему не стандартная кнопка:** на web после **полной перезагрузки страницы** (например, `F5` на `/settings`) история навигации react-navigation пуста — экран становится «корневым» в стеке, и `router.canGoBack()` возвращает `false`, поэтому системная кнопка «Назад» вообще не рендерится (react-navigation её не показывает, когда идти некуда) — пользователь не может вернуться в приложение. Кастомная кнопка рендерится всегда и в этом случае уводит на `/more`.
- **Ограничение:** фолбэк всегда ведёт на `/more`, а не восстанавливает реальный стек навигации (например, `/listen/playlist` после релоада уйдёт на `/more`, а не на `/listen`). Приемлемо для текущих под-экранов (все они одноуровневые, доступны только из «Еще»); подробнее — [`debt.md`](../debt.md) → Navigation.

Глобальные элементы поверх стека: `NetworkBanner`, `ServerErrorToast`, `UpdateDialogRoot` (все — внутри `_RootLayout`).

**Аппаратная кнопка «Назад» (Android)** — обработчик `BackHandler.addEventListener('hardwareBackPress', ...)` с каскадом:

1. открыто меню плеера (`showMenuAtom`) → закрыть;
2. открыта плейлист-шторка (`showPlaylistAtom`) → закрыть;
3. развёрнут плеер (`isPlayerExpandedAtom`) → `closePlayerSheetAction`;
4. есть история (`router.canGoBack()`) → `router.back()`;
5. иначе — ничего (возврат `false`).

В `_RootLayout.tsx` также: подписка `subscribeToNetwork()` (модульный вызов), `checkForUpdateAction` после `InteractionManager`, персист позиции каждые 5с, `useUpdateNotificationResponse()`.

Провайдеры — `app/_layout.tsx`: `reatomContext.Provider` (единый `ctx`), `ThemeProvider`, `GestureHandlerRootView`, `ErrorBoundary` + `GlobalErrorHandler`. Здесь же модульные `initializePlayer()` и `initServerUrlAction(ctx)`.

## Табы

`app/(tabs)/_layout.tsx` — `Tabs` с кастомной панелью:

- 4 таба: `listen` «Слушать», `read` «Читать», `study` «Учаться», `more` «Еще» (`title` в `_layout.tsx`; в `CustomTabBar` ROUTES — «Учиться»).
- `tabBar` → `CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`) + `ExpandablePlayer` рендерится поверх на всех табах.
- **ВАЖНО:** «Читать» и «Учиться» заблокированы — при тапе `CustomTabBar` показывает `ConfirmDialog` «Скоро будет доступно» (`isDisabled={route.name === 'read' || route.name === 'study'}`). Реальные экраны табов (`app/(tabs)/read.tsx`, `study.tsx`) существуют и рендерят `ReadScreen`/`StudyScreen`, но переход к ним блокируется.

## Стек раздела «Слушать»

`app/(tabs)/listen/_layout.tsx` — `Stack` внутри таба:

- `index` — без шапки (`headerShown: false`);
- `playlist-list` — прозрачная шапка (`headerTransparent: true`, `title: ''`);
- `playlist` — прозрачная шапка.

Экраны реэкспортируются из `src/pages/` (`app/(tabs)/listen/index.tsx` → `ListenScreen`, `playlist.tsx` → `PlaylistScreen`, `playlist-list.tsx` → `PlaylistListScreen`).

## Передача параметров

Параметры передаются **JSON-строками** через `router.push({ pathname, params })`:

- `/listen/playlist?playlist=<JSON PlaylistData>` — `navigateToPlaylist`;
- `/listen/playlist-list?sectionId=<строка>&title=<строка>` — `navigateToPlaylistList`.

Хелперы — `src/shared/routing/`:

- `useListenNavigation.ts` — `navigateToPlaylist`, `navigateToPlaylistList`;
- `useReadNavigation.ts` — `navigateToBookReader` (`/read/book-reader`), `navigateToBooksList` (`/read/books-list`);
- `base.ts` — тип `BaseParamList`.

## Незарегистрированные маршруты

`useReadNavigation` навигирует на `/read/book-reader` и `/read/books-list`, но соответствующих папок нет ни в `app/(tabs)/read/`, ни в `app/read/`. Фича чтения книг **не подключена к роутеру** (см. [book-reader.md](./book-reader.md)). Экраны `BookReaderScreen`/`BooksListScreen` существуют в `src/pages/book-reader` и `src/pages/books-list`, но не смонтированы.

## Типичные маршруты

| Маршрут                                 | Экран                | Источник                    |
| --------------------------------------- | -------------------- | --------------------------- |
| `/`                                     | редирект → `/listen` | `app/index.tsx`             |
| `/listen`                               | `ListenScreen`       | `pages/listen`              |
| `/listen/playlist`                      | `PlaylistScreen`     | `pages/playlist`            |
| `/listen/playlist-list`                 | `PlaylistListScreen` | `pages/playlist-list`       |
| `/settings`                             | `SettingsScreen`     | `pages/settings`            |
| `/about`                                | `AboutScreen`        | `pages/about`               |
| `/history`                              | `HistoryScreen`      | `pages/history`             |
| `/share`                                | `ShareScreen`        | `pages/share`               |
| `/read` (таб)                           | `ReadScreen`         | `pages/read` (заблокирован) |
| `/read/book-reader`, `/read/books-list` | —                    | **не зарегистрированы**     |

## Загрузочное состояние (Suspense)

`app/_layout.tsx` (`SuspenseFallback`) и `app/(tabs)/_layout.tsx` (`SuspenseFallback`) показывают `ActivityIndicator` + текст «Загрузка...» на фоне `currentTheme.background`, пока роут грузится через Suspense.

## Кастомный таб-бар

`CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`) — плавающий остров с `BlurView` и анимированным индикатором (`TabIndicator`, `useTabIndicator`). Учитывает `dynamicColorsEnabledAtom` для цвета индикатора (Material You) и скрывает плавающий плеер при развороте (`hideFloatingPlayer`).

Подписи табов не переносятся и почти не масштабируются шрифтом: в `TabButton.tsx` у текста заданы `numberOfLines={1}` и `maxFontSizeMultiplier={1.2}` (фикс «сломанного» таб-бара на узких экранах / крупном системном шрифте, Issue #53).

Нижний внутренний отступ таб-бара задаётся динамически: `Math.max(insets.bottom, MIN_TAB_BAR_BOTTOM_PADDING = 30)` через `useSafeAreaInsets` (`react-native-safe-area-context`; приложение рендерится edge-to-edge). На навигации жестами остаётся 30 (как и раньше), на 3-кнопочной навигации контент приподнимается над системными кнопками (Issue #56). Так как высота острова измеряется через `onLayout` (см. ниже), при росте таб-бара мини-плеер и экраны адаптируются автоматически — через `tabBarHeightAtom`.

Высота острова измеряется через `onLayout` на `BlurView` и записывается в `tabBarHeightAtom` (`src/shared/ui/layout`, экшен `setTabBarHeight`) — это единственный источник правды о высоте таб-бара. Начальное значение атома — приближение `PLAYER_SIZES.tabBarHeight` из темы, только до первого измерения. Потребители высоты (мини-плеер, нижние отступы экранов) читают атом, константу напрямую больше не используют — см. [player.md](./player.md) и [state.md](./state.md).

## Связанные документы

- [../screens/listen.md](../screens/listen.md) — главный экран и переходы
- [../screens/playlist.md](../screens/playlist.md) — экран плейлиста
- [../screens/playlist-list.md](../screens/playlist-list.md) — список плейлистов
- [../screens/share.md](../screens/share.md) — использует `HeaderBackButton` через общий `_RootLayout`
- [state.md](./state.md) — атомы, используемые в обработчике hardware-back
