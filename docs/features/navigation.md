# Навигация (Expo Router)

**Стек:** `expo-router` (`~57.0.12`), настройка — `app/`
**Статус:** готов (табы «Читать»/«Учиться» заблокированы)

## Точка входа

`app/index.tsx` — `<Redirect href='/listen' />`. Первый экран приложения — таб «Слушать».

## Корневой стек

`app/_RootLayout.tsx` (`_RootLayout`) — содержит `Stack`:

- `index` и `(tabs)` — без шапки (`headerShown: false`);
- `settings` — заголовок «Настройки», `headerBackTitle: 'Назад'`;
- `about` — заголовок «О приложении», «Назад»;
- `history` — заголовок «История прослушивания», вход из вкладки «Еще» (`router.push('/history')`).
- цвет фона контента и шапки — из `currentTheme`.

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
| `/read` (таб)                           | `ReadScreen`         | `pages/read` (заблокирован) |
| `/read/book-reader`, `/read/books-list` | —                    | **не зарегистрированы**     |

## Загрузочное состояние (Suspense)

`app/_layout.tsx` (`SuspenseFallback`) и `app/(tabs)/_layout.tsx` (`SuspenseFallback`) показывают `ActivityIndicator` + текст «Загрузка...» на фоне `currentTheme.background`, пока роут грузится через Suspense.

## Кастомный таб-бар

`CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`) — плавающий остров с `BlurView` и анимированным индикатором (`TabIndicator`, `useTabIndicator`). Учитывает `dynamicColorsEnabledAtom` для цвета индикатора (Material You) и скрывает плавающий плеер при развороте (`hideFloatingPlayer`).

## Связанные документы

- [../screens/listen.md](../screens/listen.md) — главный экран и переходы
- [../screens/playlist.md](../screens/playlist.md) — экран плейлиста
- [../screens/playlist-list.md](../screens/playlist-list.md) — список плейлистов
- [state.md](./state.md) — атомы, используемые в обработчике hardware-back
