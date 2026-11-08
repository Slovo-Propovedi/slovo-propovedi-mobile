# Навигация (Expo Router)

**Стек:** `expo-router`, настройка — `app/`
**Статус:** готов (таб «Читать» заблокирован, «Учиться» скрыт из бара)

## Точка входа

`app/index.tsx` — `<Redirect href='/listen' />`. Первый экран приложения — таб «Слушать».

## Корневой стек

`app/_RootLayout.tsx` (`_RootLayout`) — содержит `Stack`:

- `index` и `(tabs)` — без шапки (`headerShown: false`);
- `settings` — заголовок «Настройки»;
- `about` — заголовок «О приложении»;
- `history` — заголовок «История прослушивания», вход из вкладки «Ещё» (`router.push('/history')`);
- `offline` — заголовок «Офлайн», вход из вкладки «Ещё» (`router.push('/offline')`);
- `share` — заголовок «Поделиться приложением» (см. [`../screens/share.md`](../screens/share.md)).
- цвет фона контента и шапки — из `currentTheme`; `headerTitleAlign: 'center'` в `screenOptions` — заголовок центрирован в шапке, а не прижат к кастомной кнопке «Назад» (см. ниже).

Список пяти под-экранов (`settings`/`history`/`offline`/`about`/`share`) — константа `SUB_SCREENS` в `src/shared/routing/rootStackScreens.ts` (вынесена из `_RootLayout.tsx`, чтобы файл уложился в лимит 130 строк ESLint).

**Кнопка «Назад» в шапке (`headerLeft`)** — кастомный `HeaderBackButton` (`src/widgets/sub-screen-header-back/ui/HeaderBackButton.tsx`) вместо стандартной кнопки react-navigation, используется в двух местах:

- пять под-экранов корневого стека (`settings`/`history`/`offline`/`about`/`share`, `_RootLayout.tsx`) — фолбэк `/more` (экран «Ещё», логический родитель всех пяти);
- стек «Слушать» (`search-results`/`playlist`/`playlist-list`/`my-playlists`, `app/(tabs)/listen/_layout.tsx`) — фолбэк `/listen`.

Только иконка (`Ionicons 'chevron-back'`), без текста «Назад» рядом — раньше в стеке «Слушать» использовалась нативная кнопка с `headerBackTitle: 'Назад'` (текст виден только на iOS), теперь оба стека выглядят одинаково. Контейнер 48×48 (без `hitSlop`) даёт полноразмерную область нажатия и frame для скринридеров без изменения размера иконки (24); `marginLeft: -8` сохраняет визуальное положение шеврона.

- Проп `fallbackRoute` (по умолчанию `'/more'`) задаёт, куда уходить, если истории нет — каждый стек передаёт свой через `headerLeft: props => <HeaderBackButton tintColor={props.tintColor} fallbackRoute='...' />`.
- По нажатию: если `router.canGoBack()` — `router.back()`; иначе — `router.replace(fallbackRoute)`.
- **Почему не стандартная кнопка:** на web после **полной перезагрузки страницы** (например, `F5` на `/settings`) история навигации react-navigation пуста — экран становится «корневым» в стеке, и `router.canGoBack()` возвращает `false`, поэтому системная кнопка «Назад» вообще не рендерится (react-navigation её не показывает, когда идти некуда) — пользователь не может вернуться в приложение. Кастомная кнопка рендерится всегда и в этом случае уводит на `fallbackRoute`.
- **Ограничение:** фолбэк всегда ведёт на корень стека, а не восстанавливает реальный стек навигации (например, `/listen/playlist` после релоада уйдёт на `/listen`, а не на предыдущий экран, если он был глубже). Приемлемо для текущих под-экранов; подробнее — [`debt.md`](../debt.md) → Navigation.

Глобальные элементы поверх стека: `NetworkBanner`, `ServerErrorToast`, `UpdateDialogRoot` (все — внутри `_RootLayout`).

**Аппаратная кнопка «Назад» (Android)** — обработчик `BackHandler.addEventListener('hardwareBackPress', ...)` с каскадом:

1. открыт оверлей «Подробнее» (`showDetailsAtom`) → закрыть;
2. открыто меню плеера (`showMenuAtom`) → закрыть;
3. открыты настройки звука (`showSoundSettingsAtom`) → закрыть;
4. открыта плейлист-шторка (`showPlaylistAtom`) → закрыть;
5. развёрнут плеер (`isPlayerExpandedAtom`) → `closePlayerSheetAction`;
6. открыт поиск (`isSearchOpenAtom`) → `closeSearch` (поле поиска общее для всех таб-экранов, см. ниже);
7. есть история (`router.canGoBack()`) → `router.back()`;
8. иначе — ничего (возврат `false`).

В `_RootLayout.tsx` также: подписка `subscribeToNetwork()` (модульный вызов), `checkForUpdateAction` через `setTimeout(0)` в `useEffect` (вместо `InteractionManager.runAfterInteractions`), персист позиции каждые 5с, `useUpdateNotificationResponse()`.

Провайдеры — `app/_layout.tsx`: `reatomContext.Provider` (единый `ctx`), `ThemeProvider`, `GestureHandlerRootView`, `ErrorBoundary` + `GlobalErrorHandler`. Здесь же модульные `initializePlayer()` и `initServerUrlAction(ctx)`.

### Патч expo-router: guard для `onUnhandledLinking` (удалён в SDK 58)

`patches/expo-router+57.0.28.patch` **удалён** при миграции на SDK 58: в expo-router 58.0.24 символ `onUnhandledLinking` полностью убран из сборки, поэтому и источника DEV-warning'а «Can't perform a React state update on a component that hasn't mounted yet» больше нет. В SDK 57 патч правил `build/fork/useLinking.native.js`, где `.then()` `getInitialState()` до монтирования `NavigationContainer` дёргал `onUnhandledLinking` (= `setLastUnhandledLink`, setState); патч откладывал вызов через `setTimeout(..., 0)` и пропускал его через guard `isMountedRef`. К коду приложения отношения не имел — Reatom-атомы не трогают навигационное состояние. Отдельно от этого живёт workaround cold-start гонки 150 мс — `useColdStartLinkRecovery` остаётся (см. [`../debt.md`](../debt.md) → Navigation).

## Табы

`app/(tabs)/_layout.tsx` — `Tabs` с кастомной панелью:

- 3 кнопки таба: `listen` «Слушать», `read` «Читать», `more` «Ещё» (`title` в `_layout.tsx`). Маршрут `study` остаётся в навигаторе (`app/(tabs)/study.tsx` → `StudyScreen`) для прямых ссылок, но `CustomTabBar` его не рендерит (`HIDDEN_TAB_ROUTE_NAMES`).
- `tabBar` → `CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`) + `ExpandablePlayer` и `SearchIsland` рендерятся поверх на всех табах. Остров поиска смонтирован **один раз** в layout (а не в `ListenScreen`), поэтому поле поиска доступно и на вложенных экранах стека «Слушать» (`/listen/playlist`, `/listen/playlist-list`, `/listen/search-results` и т.д.); список результатов при этом остаётся только внутри `ListenScreen`.
- **ВАЖНО:** таб «Читать» гейтится фича-флагом `read` — при выключенном/незагруженном флаге `CustomTabBar` показывает глобальный информационный диалог через `showInfo` («Скоро будет доступно», `useTabPress` → `shared/model/info-dialog`) и не навигирует (`isDisabled={!isTabAvailable(route.name)}`). `ReadScreen` дополнительно проверяет флаг через `useFeatureFlag` и при `false` рендерит `null`. Экран «Учиться» (`StudyScreen`) по-прежнему гейтится флагом `study` и рендерит `null` без доступа, но кнопки в баре у него больше нет (см. [feature-flags.md](./feature-flags.md)).

## Стек раздела «Слушать»

`app/(tabs)/listen/_layout.tsx` — `Stack` внутри таба:

- `index` — без шапки (`headerShown: false`);
- `search-results` — нативная шапка (`headerShown: true`, `title: ''`), заголовок **динамический**: экран ставит его через `useHeaderTitle` + `buildSearchResultsTitle` («Проповеди "<q>"» / «Плейлисты "<q>"» / «Проповедники "<q>"» по параметру `type`); кнопка «Назад» — общий `HeaderBackButton` с фолбэком `/listen` (см. [../screens/search-results.md](../screens/search-results.md));
- `my-playlists` — шапка **динамическая**: в обычном режиме прозрачная (`headerTransparent: true`, `title: ''`, большой заголовок «Мои плейлисты» рисует сам список) с `headerRight` (карандаш «Изменить порядок»); в режиме редактирования снова непрозрачная (`headerStyle.backgroundColor = currentTheme.background`), заголовок «Мои плейлисты» и `headerRight` (галочка «Сохранить»). Опции собирает `useMyPlaylistsHeader` (см. [../screens/my-playlists.md](../screens/my-playlists.md));
- `playlist-list` — прозрачная шапка (`headerTransparent: true`, `title: ''`);
- `playlist` — прозрачная шапка;
- `playlist-edit` — нативная шапка с заголовком «Редактировать плейлист» (экран редактирования локального плейлиста, см. [../screens/playlist-edit.md](../screens/playlist-edit.md)).

Экраны реэкспортируются из `src/pages/` (`app/(tabs)/listen/index.tsx` → `ListenScreen`, `search-results.tsx` → `SearchResultsScreen`, `my-playlists.tsx` → `MyPlaylistsScreen`, `playlist.tsx` → `PlaylistScreen`, `playlist-edit.tsx` → `PlaylistEditScreen`, `playlist-list.tsx` → `PlaylistListScreen`).

## Передача параметров

Параметры передаются **строками** через `router.push({ pathname, params })` (не JSON — полный объект экран резолвит сам):

- `/listen/playlist?playlist=<UUID>` — `navigateToPlaylist` передаёт только `playlist.id`, полный `PlaylistData` экран достаёт через `usePlaylistById` (секции → кэш → API, см. [../screens/playlist.md](../screens/playlist.md));
- `/listen/playlist-edit?playlist=<UUID>` — карандаш в шапке экрана плейлиста (`PlaylistHeaderActions`) передаёт `playlist.id`; экран редактирования берёт плейлист из `myPlaylistsAtom` (см. [../screens/playlist-edit.md](../screens/playlist-edit.md));
- `/listen/playlist-list?sectionId=<строка>` — `navigateToPlaylistList` (параметр `title` в URL не передаётся, заголовок берётся из резолвнутого раздела);
- `/listen/my-playlists` — `navigateToMyPlaylists` (без параметров) — экран редактирования порядка локальных плейлистов;
- `/listen/search-results?type=<sermons|playlists|preachers>&query=<строка>` — `useListenSearchNavigation` (`src/pages/listen/lib/`): `onShowAllGroup` передаёт `type` и `query` группы из компактной выдачи поиска, `onPreacherPress` — `type=sermons` с именем проповедника. Экран сам оборонительно валидирует параметры (`parseSearchResultsParams`) и рендерит пусто при невалидных (см. [../screens/search-results.md](../screens/search-results.md)).

Хелперы навигации:

- `useListenNavigation.ts` (`src/pages/listen/lib/`) — `navigateToPlaylist`, `navigateToPlaylistList`, `navigateToMyPlaylists`;
- `useReadNavigation.ts` (`src/pages/read/lib/`) — `navigateToBookReader` (`/read/book-reader`), `navigateToBooksList` (`/read/books-list`);
- `src/shared/routing/` — `useColdStartLinkRecovery.ts` (Android-only safety net холодного старта, см. «Android App Links» ниже), `launchPath.ts` (pure-хелперы разбора launch URL: `extractLaunchPath`, `shouldAttemptRecovery`), `rootStackScreens.ts` (`SUB_SCREENS` корневого стека), `useHeaderTitle.ts`.

## Android App Links

Хост `https://app.slovo-propovedi.ru` заявлен через App Links: точные пути `/listen` и `/listen/playlist` открывают приложение (холодный старт или поверх запущенного — работает «из коробки» через expo-router, без кастомной linking-конфигурации), остальные маршруты остаются в браузере. Подробности (конфиг, assetlinks.json, nginx, adb-тесты, ограничения) — [deep-links.md](./deep-links.md).

Дополнительно приложение подстраховывает **холодный старт на Android**: expo-router может потерять launch-ссылку в гонке 150 мс и оставить приложение на `/listen` — хук `useColdStartLinkRecovery` (`src/shared/routing/`, вызов из `_RootLayout.tsx`) через ~1 с повторно читает launch intent и восстанавливает переход; корректно обработанные ссылки, ручная навигация и iOS не затрагиваются. Подробности — [deep-links.md](./deep-links.md) → «Android: гонка 150 мс при холодном старте».

## Зона администратора `/admin`

Отдельный маршрут вне публичных табов (объявлен в корневом стеке как `admin` с `headerShown: false`):

- `app/admin/_layout.tsx` — `Stack` зоны: при монтировании однократно вызывает `restoreSession` (`entities/auth`) и показывает `ActivityIndicator`, пока сессия не разрешена (`idle`, а на защищённых маршрутах также `loading`); редиректит неаутентифицированных на `/admin/login` (кроме самого login). Аутентифицированного пользователя на `/admin/login` в `/admin` не уводит — после успешного входа возвращаемся на «Ещё». Шапка есть только у `login` (`HeaderBackButton`, фолбэк `/settings`).
- `app/admin/login.tsx` → `AdminLoginScreen` (`pages/admin-login`).
- `app/admin/(tabs)/_layout.tsx` — `Tabs` с `headerShown: false` и тем же `CustomTabBar`, что и публичные табы: `index` (Главная), `sections`, `playlists`, `sermons`, `media`, `users`. Таб `users` скрыт (`href: null`) для роли не-`admin`.
- Файлы табов: `index.tsx` (admin-home), остальные — экраны отдельных слайсов `pages/admin-sections` / `admin-playlists` / `admin-sermons` / `admin-media` / `admin-users`. Отдельного таба «Загрузить» нет: проповедь создаётся через `/admin/sermons/create` из шапки списка проповедей и быстрых действий главной.

Вход в зону — из шапки «Настроек» (кебаб-меню `SettingsHeaderMenu` через `headerRight` в `app/_RootLayout.tsx`) и с экрана «Ещё» (компактная иконка-кнопка «В админ панель» → `AdminPanelButton`). В `SettingsHeaderMenu` используется хук `useAdminEntry` (`entities/auth`): при `idle` восстанавливает сессию (`restoreSession`), затем пушит `/admin` (есть права) или `/admin/login`; для аутентифицированных единственный пункт меню — «Выйти из аккаунта админа» (`signOut`). На экране «Ещё» `AdminPanelButton` рендерится только для аутентифицированных `admin`/`moderator` (проверка `canAccessAdmin`; `MoreScreen` при монтировании вызывает `restoreSession`, если статус `idle`) и пушит `/admin`. После успешного входа на `/admin/login` показывается тост «Вход выполнен» и выполняется `router.replace('/more')`.

## Незарегистрированные маршруты

`useReadNavigation` навигирует на `/read/book-reader` и `/read/books-list`, но соответствующих папок нет ни в `app/(tabs)/read/`, ни в `app/read/`. Фича чтения книг **не подключена к роутеру** (см. [book-reader.md](./book-reader.md)). Экраны `BookReaderScreen`/`BooksListScreen` существуют в `src/pages/book-reader` и `src/pages/books-list`, но не смонтированы.

## Типичные маршруты

| Маршрут                                 | Экран                | Источник                    |
| --------------------------------------- | -------------------- | --------------------------- |
| `/`                                     | редирект → `/listen` | `app/index.tsx`             |
| `/listen`                               | `ListenScreen`       | `pages/listen`              |
| `/listen/playlist`                      | `PlaylistScreen`     | `pages/playlist`            |
| `/listen/playlist-list`                 | `PlaylistListScreen` | `pages/playlist-list`       |
| `/listen/my-playlists`                  | `MyPlaylistsScreen`  | `pages/my-playlists`        |
| `/listen/search-results`                | `SearchResultsScreen` | `pages/search-results`     |
| `/settings`                             | `SettingsScreen`     | `pages/settings`            |
| `/about`                                | `AboutScreen`        | `pages/about`               |
| `/history`                              | `HistoryScreen`      | `pages/history`             |
| `/offline`                              | `OfflineScreen`      | `pages/offline`             |
| `/share`                                | `ShareScreen`        | `pages/share`               |
| `/admin`                                | `AdminHomeScreen`    | `pages/admin-home`          |
| `/admin/login`                          | `AdminLoginScreen`   | `pages/admin-login`         |
| `/read` (таб)                           | `ReadScreen`         | `pages/read` (заблокирован) |
| `/read/book-reader`, `/read/books-list` | —                    | **не зарегистрированы**     |

## Загрузочное состояние (Suspense)

`app/_layout.tsx` (`SuspenseFallback`) и `app/(tabs)/_layout.tsx` (`SuspenseFallback`) показывают `ActivityIndicator` + текст «Загрузка...» на фоне `currentTheme.background`, пока роут грузится через Suspense.

## Кастомный таб-бар

`CustomTabBar` (`src/widgets/tab-bar/ui/CustomTabBar.tsx`) — плавающая нижняя строка в стиле Apple Music: остров табов с `BlurView` слева и отдельная круглая кнопка поиска (`CircleButton`, Ionicons `search`, `accessibilityLabel='Поиск'`) справа. Остров ограничен `maxWidth: CONTENT_COLUMN_WIDTH` (600 px из `shared/ui/layout`): на планшетах и десктоп-web строка остаётся центрированной колонкой, на телефонах колонка шире экрана и ширина не меняется. Строка отступает по горизонтали на `BAR_SIDE_INSET` (`INDENTS.medium`, 16 — широкие боковые поля островов), поэтому её контент (остров табов + зазор + круг поиска) начинается от `getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH) + BAR_SIDE_INSET` и занимает `min(экран, CONTENT_COLUMN_WIDTH) − 2 × BAR_SIDE_INSET`; на эти же края опирается развёрнутая пилюля мини-плеера (см. [player.md](./player.md)), поэтому её левый/правый край совпадают с краями острова и круга поиска на любой ширине.

Фон острова и круга поиска — общий стеклянный рецепт `src/shared/ui/glass/` (`GlassSurface` + `createGlassStyles`), тот же, что у пилюли мини-плеера и пилюли поиска: полупрозрачная заливка, блюр и 1px светлая рамка; значения и платформенные оговорки — в [theme.md](./theme.md#стеклянные-нижние-острова-frosted-glass).

Высота острова и диаметр круглой кнопки поиска зависят от состояния бара: в развёрнутом виде — `TAB_BAR_ISLAND_HEIGHT_EXPANDED` / `BAR_CIRCLE_SIZE_EXPANDED` (76), в свёрнутом — `TAB_BAR_ISLAND_HEIGHT` / `BAR_CIRCLE_SIZE` (64). Оба размера анимируются тем же `progress`-значением (0 = развёрнут, 1 = свёрнут) и той же длительностью `BAR_MORPH_DURATION_MS`, что и ширина острова: круг поиска всегда остаётся идеально круглым (ширина = высота = `radius * 2`), а высота острова интерполируется в `getIslandStyle`. Строка островов при этом сохраняет фиксированную высоту `BAR_ROW_MIN_HEIGHT` (84 — хватает развёрнутому острову 76 с запасом), поэтому измеряемая высота таб-бара не скачет между состояниями.

Активный таб подсвечен капсулой: `TabButton` рисует под иконкой/подписью фон `withAlpha(currentTheme.primary, 0.18)` со скруглением `RADIUSES.round`; цвет иконки и подписи — `currentTheme.primary`, неактивные — `currentTheme.textMuted`. Капсула видна только в развёрнутом баре: её прозрачность считается `getCapsuleOpacity` (1 при `progress = 0`, 0 при `progress = 1`), поэтому в свёрнутом круге остаётся только иконка активного таба без подсветки. Внутренние отступы повторяют эталонные кадры (`getIslandContentPadding`, `ISLAND_CONTENT_PADDING_HORIZONTAL = 12`, `TAB_ITEM_GAP = 10`): контент острова отступает от скруглённых краёв, между табами есть зазор 10, а капсула выходит за свой слот на `CAPSULE_HORIZONTAL_OVERHANG = 10` с каждой стороны — так подпись не прилипает к её краям. Горизонтальный padding острова анимируется тем же `progress` и в свёрнутом круге становится 0, иначе активный слот шириной 64 не поместился бы в круг и иконка уехала бы из центра; ширина слота в развёрнутом состоянии — `(ширина острова − 2 × padding) / число табов`, а `getTabSlotStyle` держит `minWidth = MIN_TOUCH_TARGET` (48) с затуханием к 0 вместе со скрытыми слотами. Свёрнутый остров делает неактивные слоты неинтерактивными (`pointerEvents='none'` на `TabSlot`, `isCollapsed` из `useTabIslandMorph`): нулевая ширина слота не мешает его дочерним pressable-элементам вылезать за край острова, и без этого гейта невидимая кнопка «Ещё» перехватывала тапы по правой половине круга активного таба. Тап по кругу целиком принадлежит активному слоту. Отступы самого таб-элемента тоже анимируются: `getTabItemHorizontalMargin` гасит горизонтальный полу-зазор до 0 в свёрнутом круге (иначе остаточные 6dp сдвигали иконку вправо), а `getTabItemVerticalMargin` даёт развёрнутой капсуле чуть больше вертикального воздуха (6dp против компактных 4dp у свёрнутого круга). Сами анимированные стили собирают `getIslandContentStyle`/`getTabItemStyle` (`src/widgets/tab-bar/lib/getBarMorphStyles.ts`) и используют только longhand-свойства (`paddingLeft`/`marginTop`, а не `paddingHorizontal`/`marginVertical`): Reanimated обновляет web-стили через `createReactDOMStyle` из react-native-web, минуя `preprocess`, поэтому shortform в анимированном стиле залипает на значении первого рендера (12dp padding и 5dp margin оставались в свёрнутом круге — иконка прилипала к правому краю), тогда как `width`/`height`/`opacity` продолжали анимироваться.

Свёртывание (см. `isBarCollapsedAtom`, драйвер `useBarCollapseOnScroll`): остров плавно (300 мс, `BAR_MORPH_DURATION_MS`) сжимается из полной ширины строки в круг `BAR_CIRCLE_SIZE`, оставляя только активный таб — иконку без подписи. **Высоту острова и таб-элемента задаёт только анимированный стиль** (`getIslandStyle`, `getTabItemHeight`): статический `height` в том же массиве стилей перекрывает анимированный на устройстве (остров залипал в свёрнутых 64 при раскрытом баре — ниже круга поиска), а `flex: 1` на таб-элементе обнуляет flex-basis и сжимает иконку с подписью до контентной высоты. Поэтому в `styles.ts` у `floatingIsland`/`tabItem` нет ни статической высоты, ни `flex`. Подпись таба позиционирована абсолютно и не участвует в раскладке слота: иконка остаётся единственным flex-центрированным содержимым и не «уезжает» вверх в свёрнутом круге. В развёрнутом баре иконка поднята на фиксированный offset (`getTabIconOffset`) и уступает место подписи снизу, а при морфе плавно возвращается в центр; высота самого таб-элемента (`getTabItemHeight`) растёт вместе с островом, поэтому между иконкой и подписью остаётся чистый вертикальный зазор. Неактивные табы не размонтируются, а плавно уходят по ширине и прозрачности (`getTabSlotStyle`), чтобы не было мигания при морфе. Пока поле поиска видимо (`isSearchFieldVisibleAtom` — поиск открыт и бар развёрнут либо запрос активен), остров принудительно показан в свёрнутом виде даже без скролла. Когда бар свёрнут, а запрос пуст, поле поиска скрыто — остров остаётся свёрнутым по состоянию бара, а в строке снова видны круг поиска и компактный мини-плеер. Геометрия морфа вынесена в чистые хелперы `src/widgets/tab-bar/lib/getIslandStyle.ts` и хук `useTabIslandMorph`.

Скролл-драйвер подключён к основным скроллам «Слушать» (`ListenScreen`, `Animated.ScrollView` секций) и списку результатов поиска (`SearchGroupedResults`), помимо истории, офлайна, результатов поиска и плейлистов. Драйвер приостанавливается (`isSuspended`), пока развёрнут плеер (`isPlayerExpandedAtom`) **или** открыт поиск с активным запросом (`isSearchBarCollapseSuspendedAtom`, запрос после `trim` ≥ `MIN_QUERY_LENGTH`). Открытый поиск с пустым запросом драйвер **не** приостанавливает: прокрутка вниз сворачивает всю строку вместе с полем, возврат к верхнему краю — разворачивает и снова показывает поле. Драйвер подписан на `isBarCollapsedAtom` и зеркалит внешние изменения в свой UI-thread snapshot: тап по свёрнутому кружку разворачивает бар без события скролла, и без синхронизации следующий скролл вниз считал бы бар уже свёрнутым и не сворачивал бы его до пересечения верхнего порога. При этом драйвер запоминает последний обработанный offset: повторный `onScroll` с тем же offset (перестройка layout/клавиатуры, вызванная самим тапом) не считается скроллом и не сворачивает только что развёрнутый бар — иначе первый тап по кругу поиска или активного таба в свёрнутой строке визуально «не срабатывал». Реальный скролл (offset изменился) сворачивает бар как раньше. Работает одинаково на нативе и web: `onScroll` читает `event.contentOffset.y`, который react-native-web поставляет так же.

Изменение offset бывает и не жестом: когда над вьюпортом монтируется/размонтируется контент (на «Слушать» при открытии поиска скрывается `ListenTopRow`), scroll anchoring браузера сдвигает `scrollTop` на высоту этого блока и присылает обычный `onScroll` — например, 600 → 552. Раньше драйвер принимал такой сдвиг за скролл и сворачивал только что развёрнутый бар: первый тап по кругу поиска из свёрнутой строки открывал поле и тут же прятал его обратно (визуально «тап не сработал»), а закрытие ✕ на прокрученной странице снова сворачивало бар. Поэтому драйвер принимает `onContentSizeChange` от скролла (на «Слушать» он подключён к `Animated.ScrollView`): при изменении высоты контента следующий изменённый offset только перебазирует драйвер (`lastOffset`) без пересечения порогов; следующее настоящее событие скролла снова сворачивает/разворачивает бар. Замер высоты при монтировании (до первого скролла) перебазированием не считается, иначе первый скролл пользователя после запуска экрана терялся бы.

Пока поле поиска видимо (`isSearchFieldVisibleAtom`), круглая кнопка поиска скрывается, а её место (середина+правый край строки) занимает поле поиска — виджет `src/widgets/search-island/` (`SearchIsland`, смонтирован один раз в `app/(tabs)/_layout.tsx` рядом с `CustomTabBar`/`ExpandablePlayer`, поэтому доступен на всех таб-экранах). Видимость поля — единая формула: поиск открыт **и** (бар развёрнут **или** запрос активен после `trim`, ≥ `MIN_QUERY_LENGTH`). Отсюда матрица: открыт + пустой запрос + развёрнутый бар → поле видно; открыт + пустой + свёрнутый → поле скрыто, строка `[круг активного таба][компактный плеер][круг поиска]`; открыт + активный запрос + свёрнутый → поле видно и закреплено (результаты — отдельная скролл-область). Низ строки при видимом поле превращается в единую полосу `[круг активного таба][поле поиска]`: пилюля абсолютно позиционирована по геометрии строки (`BAR_SIDE_INSET`, `BAR_CIRCLE_SIZE`, `BAR_OUTER_GAP`, `TAB_BAR_ISLAND_HEIGHT`, кап `CONTENT_COLUMN_WIDTH`, `getSearchIslandGeometry`) и выезжает из-за острова с той же длительностью `BAR_MORPH_DURATION_MS`, что и морф острова. Высота/радиус пилюли тоже следуют `progress`: в развёрнутом состоянии 76, в свёрнутом — 64, поэтому она совпадает по высоте с островом на любом кадре морфа. Пока поле в фокусе, справа от пилюли виден отдельный круглый «✕» (`SearchIslandCloseSlot`): пилюля уступает ему место, уменьшаясь влево на `BAR_CIRCLE_SIZE + BAR_OUTER_GAP`, правый край круга совпадает с правым краем круга поиска, появление круга и сдвиг пилюли идут с `BAR_MORPH_DURATION_MS` (`getSearchIslandGeometry` принимает `closeProgress`). Закрытие поиска проигрывает обратный морф (opacity/геометрия 1→0 за `BAR_MORPH_DURATION_MS`), поэтому пилюля не исчезает скачком; в скрытом состоянии она остаётся смонтированной, но с `pointerEvents='none'`, скрыта от скринридеров и не держит фокус (при скрытии поле блюрится, чтобы клавиатура не висела над свёрнутой строкой). Тап по кругу поиска в свёрнутой строке вызывает `openSearch`, который разворачивает бар (`setBarCollapsed(false)`) и показывает поле, даже если поиск уже был открыт. Переход на другой таб и аппаратная кнопка «Назад» закрывают поиск. Строка таб-бара и её контейнер помечены `pointerEvents='box-none'`, чтобы пустая область строки не перехватывала тапы по полю поиска. Внутри пилюли при пустом запросе справа всегда виден микрофон (`SearchBarMicButton`, `accessibilityLabel 'Голосовой ввод'`) на любой платформе: при поддержке распознавателя он запускает web-распознавание/Android-intent, а без него (iOS, web без Web Speech API) показывает информационный диалог «Голосовой ввод недоступен на этом устройстве». При непустом запросе микрофон уступает место ⊗ очистки.

Строка табов имеет фиксированную высоту `BAR_ROW_MIN_HEIGHT` (84) плюс нижний отступ `Math.max(insets.bottom, BAR_BOTTOM_INSET_MIN = 12)` — этого хватает развёрнутому острову (76) с запасом, а свёрнутый остров (64) центрируется в той же строке. Высота самой строки не зависит от морфа острова (меняется только остров внутри), поэтому измеренная высота таб-бара не скачет между состояниями. На админских табах (`app/admin/(tabs)/_layout.tsx`) кнопка поиска скрыта пропом `hideSearch`.

Подписи табов не переносятся и почти не масштабируются шрифтом: в `TabButton.tsx` у текста заданы `numberOfLines={1}` и `maxFontSizeMultiplier={1.2}` (фикс «сломанного» таб-бара на узких экранах / крупном системном шрифте, Issue #53).

Тап по уже активному табу в развёрнутом баре полностью «молчалив»: без хаптик-отклика и без нажимного затемнения (blink) — `TabButton` передаёт `hapticDisabled` в `TouchableButton` и `activeOpacity={1}` для активного таба; навигация для активного таба и так пропускается в `useTabPress`. В свёрнутом баре виден только круг активного таба, и тап по нему **разворачивает бар** (`setBarCollapsed(false)`, тот же морф 300 мс), не навигируя: мини-плеер поднимается автоматически, потому что его геометрия читает тот же `isBarCollapsedAtom`. Если при этом сессия поиска была открыта (`isSearchOpenAtom`, например после прокрутки с пустым запросом), тот же тап **закрывает поиск** (`closeSearchAndExpand`): сброс сессии и разворот бара выполняются одной атомарной транзакцией, поэтому строка возвращается к обычному развёрнутому бару без пилюли поиска и без кадра, где пустое поле успевает показаться. Свёрнутость для этого тапа берётся из визуального состояния (`isBarCollapsedAtom || isSearchFieldVisibleAtom`), а не только из атома бара: видимое поле поиска принудительно держит остров в форме круга, даже когда живой запрос приостановил скролл-драйвер и `isBarCollapsedAtom` остался `false`. Иначе тап по кругу в этой позе уходил в «молчаливый» `tabPress` активного таба.

На web кнопки табов (`TabButton`) и вложенный таб-бар (`shared/lib/tab-bar/renderTabBar.tsx`) рендерятся как настоящие `<button>` — у них задан `accessibilityRole='button'` (иначе RNW отдаёт `<div tabindex="0">`, который не получает Vimium-хинты). Подробнее — [web.md](./web.md#настоящие-button-для-vimium-хинтов).

Нижний внутренний отступ таб-бара задаётся динамически: `Math.max(insets.bottom, BAR_BOTTOM_INSET_MIN = 12)` через `useSafeAreaInsets` (`react-native-safe-area-context`; приложение рендерится edge-to-edge). На навигации жестами/web/desktop, где системный inset не больше пола, острова сидят низко с небольшим нижним зазором 12; на 3-кнопочной навигации контент приподнимается над системными кнопками (Issue #56). Так как высота строки таб-бара измеряется через `onLayout` (см. ниже) и фиксирована между развёрнутым/свёрнутым состояниями, при росте таб-бара мини-плеер и экраны адаптируются автоматически — через `tabBarHeightAtom`.

Тот же принцип применён к нижнему отступу контролов полноэкранного плеера: `Math.max(bottomInset, BAR_BOTTOM_INSET_MIN)` через `getFullscreenPlayerBottomPadding` (`widgets/expandable-player/lib/getFullscreenPlayerBottomPadding.ts`) — формула повторяет таб-бар, поэтому контролы встают на одном уровне с кнопками таб-бара и на жестовой навигации, и на 3-кнопочной (Issue #105).

Высота строки таб-бара (`BAR_ROW_MIN_HEIGHT` + `Math.max(insets.bottom, BAR_BOTTOM_INSET_MIN)`) измеряется через `onLayout` на строке островов и записывается в `tabBarHeightAtom` (`src/shared/ui/layout`, экшен `setTabBarHeight`) — это единственный источник правды о высоте таб-бара. Неположительная высота — не измерение: `onLayout` игнорирует `height <= 0` и не публикует её (неактивный экран табов на web рендерится с `display: none` и измеряется как 0×0), поэтому в атом попадает только реальный замер. Высота строки не зависит от морфа острова (остров внутри меняет высоту 76 ⇄ 64, но строка остаётся 84), поэтому повторного измерения на каждом кадре морфа нет и высота не скачет между свёрнутым и развёрнутым состояниями. Начальное значение атома — приближение `PLAYER_SIZES.tabBarHeight` из темы, только до первого измерения. Потребители высоты (мини-плеер, нижние отступы экранов) читают атом, константу напрямую больше не используют — см. [player.md](./player.md) и [state.md](./state.md).

## Связанные документы

- [../screens/listen.md](../screens/listen.md) — главный экран и переходы
- [../screens/playlist.md](../screens/playlist.md) — экран плейлиста
- [../screens/playlist-list.md](../screens/playlist-list.md) — список плейлистов
- [../screens/search-results.md](../screens/search-results.md) — полный список результатов поиска и динамический заголовок
- [../screens/share.md](../screens/share.md) — использует `HeaderBackButton` через общий `_RootLayout`
- [state.md](./state.md) — атомы, используемые в обработчике hardware-back
