# Навигация (Expo Router)

**Стек:** `expo-router` (`~57.0.19`), настройка — `app/`
**Статус:** готов (табы «Читать»/«Учиться» заблокированы)

## Точка входа

`app/index.tsx` — `<Redirect href='/listen' />`. Первый экран приложения — таб «Слушать».

## Корневой стек

`app/_RootLayout.tsx` (`_RootLayout`) — содержит `Stack`:

- `index` и `(tabs)` — без шапки (`headerShown: false`);
- `settings` — заголовок «Настройки»;
- `about` — заголовок «О приложении»;
- `history` — заголовок «История прослушивания», вход из вкладки «Еще» (`router.push('/history')`);
- `offline` — заголовок «Офлайн», вход из вкладки «Еще» (`router.push('/offline')`);
- `share` — заголовок «Поделиться приложением» (см. [`../screens/share.md`](../screens/share.md)).
- цвет фона контента и шапки — из `currentTheme`; `headerTitleAlign: 'center'` в `screenOptions` — заголовок центрирован в шапке, а не прижат к кастомной кнопке «Назад» (см. ниже).

**Кнопка «Назад» в шапке (`headerLeft`)** — кастомный `HeaderBackButton` (`src/widgets/sub-screen-header-back/ui/HeaderBackButton.tsx`) вместо стандартной кнопки react-navigation, используется в двух местах:

- пять под-экранов корневого стека (`settings`/`history`/`offline`/`about`/`share`, `_RootLayout.tsx`) — фолбэк `/more` (таб «Еще», логический родитель всех пяти);
- стек «Слушать» (`playlist`/`playlist-list`, `app/(tabs)/listen/_layout.tsx`) — фолбэк `/listen`.

Только иконка (`Ionicons 'chevron-back'`), без текста «Назад» рядом — раньше в стеке «Слушать» использовалась нативная кнопка с `headerBackTitle: 'Назад'` (текст виден только на iOS), теперь оба стека выглядят одинаково. Контейнер 48×48 (без `hitSlop`) даёт полноразмерную область нажатия и frame для скринридеров без изменения размера иконки (24); `marginLeft: -8` сохраняет визуальное положение шеврона.

- Проп `fallbackRoute` (по умолчанию `'/more'`) задаёт, куда уходить, если истории нет — каждый стек передаёт свой через `headerLeft: props => <HeaderBackButton tintColor={props.tintColor} fallbackRoute='...' />`.
- По нажатию: если `router.canGoBack()` — `router.back()`; иначе — `router.replace(fallbackRoute)`.
- **Почему не стандартная кнопка:** на web после **полной перезагрузки страницы** (например, `F5` на `/settings`) история навигации react-navigation пуста — экран становится «корневым» в стеке, и `router.canGoBack()` возвращает `false`, поэтому системная кнопка «Назад» вообще не рендерится (react-navigation её не показывает, когда идти некуда) — пользователь не может вернуться в приложение. Кастомная кнопка рендерится всегда и в этом случае уводит на `fallbackRoute`.
- **Ограничение:** фолбэк всегда ведёт на корень стека, а не восстанавливает реальный стек навигации (например, `/listen/playlist` после релоада уйдёт на `/listen`, а не на предыдущий экран, если он был глубже). Приемлемо для текущих под-экранов; подробнее — [`debt.md`](../debt.md) → Navigation.

Глобальные элементы поверх стека: `NetworkBanner`, `ServerErrorToast`, `UpdateDialogRoot` (все — внутри `_RootLayout`).

**Аппаратная кнопка «Назад» (Android)** — обработчик `BackHandler.addEventListener('hardwareBackPress', ...)` с каскадом:

1. открыт оверлей «Подробнее» (`showDetailsAtom`) → закрыть;
2. открыто меню плеера (`showMenuAtom`) → закрыть;
3. открыта плейлист-шторка (`showPlaylistAtom`) → закрыть;
4. развёрнут плеер (`isPlayerExpandedAtom`) → `closePlayerSheetAction`;
5. есть история (`router.canGoBack()`) → `router.back()`;
6. иначе — ничего (возврат `false`).

В `_RootLayout.tsx` также: подписка `subscribeToNetwork()` (модульный вызов), `checkForUpdateAction` после `InteractionManager`, персист позиции каждые 5с, `useUpdateNotificationResponse()`.

Провайдеры — `app/_layout.tsx`: `reatomContext.Provider` (единый `ctx`), `ThemeProvider`, `GestureHandlerRootView`, `ErrorBoundary` + `GlobalErrorHandler`. Здесь же модульные `initializePlayer()` и `initServerUrlAction(ctx)`.

### Патч expo-router: отложенный `onUnhandledLinking` (SDK 57)

`patches/expo-router+57.0.21.patch` — исправляет DEV-only warning «Can't perform a React state update on a component that hasn't mounted yet» при старте приложения. Корень: в `useLinking.native.js` промис `getInitialState()` резолвится до монтирования `ContextNavigator`, и `onUnhandledLinking` (setState) вызывается в `.then()` во время рендера. Патч оборачивает вызов в `setTimeout(..., 0)`, откладывая его до первого кадра после маунта. Удалить при миграции на Expo SDK 58 — апстрим переписывает `getInitialState` (expo#47659 bot-closed, PR #46653 closed unmerged, направление фикса — PR #49063).

## Табы

`app/(tabs)/_layout.tsx` — `Tabs` с кастомной панелью:

- 4 таба: `listen` «Слушать», `read` «Читать», `study` «Учиться», `more` «Еще» (`title` в `_layout.tsx`; в `CustomTabBar` ROUTES — «Учиться»).
- `tabBar` → `CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`) + `ExpandablePlayer` рендерится поверх на всех табах.
- **ВАЖНО:** «Читать» и «Учиться» заблокированы — при тапе `CustomTabBar` показывает глобальный информационный диалог через `showInfo` («Скоро будет доступно», `useTabPress` → `shared/model/info-dialog`) (`isDisabled={isUnavailableTabRoute(route.name)}`). Реальные экраны табов (`app/(tabs)/read.tsx`, `study.tsx`) существуют и рендерят `ReadScreen`/`StudyScreen`, но переход к ним блокируется.

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
| `/offline`                             | `OfflineScreen`      | `pages/offline`           |
| `/share`                                | `ShareScreen`        | `pages/share`               |
| `/read` (таб)                           | `ReadScreen`         | `pages/read` (заблокирован) |
| `/read/book-reader`, `/read/books-list` | —                    | **не зарегистрированы**     |

## Загрузочное состояние (Suspense)

`app/_layout.tsx` (`SuspenseFallback`) и `app/(tabs)/_layout.tsx` (`SuspenseFallback`) показывают `ActivityIndicator` + текст «Загрузка...» на фоне `currentTheme.background`, пока роут грузится через Suspense.

## Кастомный таб-бар

`CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`) — плавающий остров с `BlurView` и анимированным индикатором (`TabIndicator`, `useTabIndicator`). Учитывает `dynamicColorsEnabledAtom` для цвета индикатора (Material You) и скрывает плавающий плеер при развороте (`hideFloatingPlayer`).

Подписи табов не переносятся и почти не масштабируются шрифтом: в `TabButton.tsx` у текста заданы `numberOfLines={1}` и `maxFontSizeMultiplier={1.2}` (фикс «сломанного» таб-бара на узких экранах / крупном системном шрифте, Issue #53).

Тап по уже активному табу полностью «молчалив»: без хаптик-отклика и без нажимного затемнения (blink) — `TabButton` передаёт `hapticDisabled` в `TouchableButton` и `activeOpacity={1}` для активного таба; навигация для активного таба и так пропускается в `useTabPress`.

На web кнопки табов (`TabButton`) и вложенный таб-бар (`shared/lib/tab-bar/renderTabBar.tsx`) рендерятся как настоящие `<button>` — у них задан `accessibilityRole='button'` (иначе RNW отдаёт `<div tabindex="0">`, который не получает Vimium-хинты). Подробнее — [web.md](./web.md#настоящие-button-для-vimium-хинтов).

Нижний внутренний отступ таб-бара задаётся динамически: `Math.max(insets.bottom, MIN_TAB_BAR_BOTTOM_PADDING = 30)` через `useSafeAreaInsets` (`react-native-safe-area-context`; приложение рендерится edge-to-edge). На навигации жестами остаётся 30 (как и раньше), на 3-кнопочной навигации контент приподнимается над системными кнопками (Issue #56). Так как высота острова измеряется через `onLayout` (см. ниже), при росте таб-бара мини-плеер и экраны адаптируются автоматически — через `tabBarHeightAtom`.

Тот же принцип применён к нижнему отступу контролов полноэкранного плеера: `Math.max(bottomInset, 30)` через `getFullscreenPlayerBottomPadding` (`widgets/expandable-player/lib/getFullscreenPlayerBottomPadding.ts`) — формула повторяет таб-бар, поэтому контролы встают на одном уровне с кнопками таб-бара и на жестовой навигации, и на 3-кнопочной (Issue #105).

Высота острова измеряется через `onLayout` на `BlurView` и записывается в `tabBarHeightAtom` (`src/shared/ui/layout`, экшен `setTabBarHeight`) — это единственный источник правды о высоте таб-бара. Начальное значение атома — приближение `PLAYER_SIZES.tabBarHeight` из темы, только до первого измерения. Потребители высоты (мини-плеер, нижние отступы экранов) читают атом, константу напрямую больше не используют — см. [player.md](./player.md) и [state.md](./state.md).

## Связанные документы

- [../screens/listen.md](../screens/listen.md) — главный экран и переходы
- [../screens/playlist.md](../screens/playlist.md) — экран плейлиста
- [../screens/playlist-list.md](../screens/playlist-list.md) — список плейлистов
- [../screens/share.md](../screens/share.md) — использует `HeaderBackButton` через общий `_RootLayout`
- [state.md](./state.md) — атомы, используемые в обработчике hardware-back
