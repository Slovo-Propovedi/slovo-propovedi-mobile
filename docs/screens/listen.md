# Экран «Слушать» (главный)

**Маршрут:** `/listen` (стартовый после редиректа из `/` в `app/index.tsx`)
**Файлы:** `app/(tabs)/listen/index.tsx` → `export default ListenScreen` из `pages/listen`
**Статус:** готов

## Что делает

Главный экран приложения. Показывает вертикальный скролл динамических секций проповедей (`DynamicSectionsSlider`); каждая секция — горизонтальный слайдер плейлистов. Кнопка-лупа поиска — обычный ребёнок скролл-контента и **скроллится вместе с секциями**: когда поиск закрыт, лупа уезжает при прокрутке и не занимает место сверху. Когда поиск открыт — строка поиска **закреплена** над скролл-областью (`SearchBar` вне всех скролл-контейнеров, не скроллится), а контент ниже скроллится. При активном запросе секции скрываются и рендерится список найденных проповедей. Настроен в `app/(tabs)/_layout.tsx` как первый таб (`title: 'Слушать'`, `headerShown: false`).

## Что показывается

- Вертикальный список секций; каждая секция рендерится через `renderSection` (`src/pages/listen/ui/renderSection.tsx`) в компонент `Slider` (заголовок секции + горизонтальный слайдер плейлистов с обложками). Рендеринг обложек — через `CoverImage` (`shared/ui/cover-image`), lazy-загрузка по умолчанию; при отсутствии `artwork` используется `IMAGE_PLACEHOLDER` (иконка приложения). Подробнее — [features/images.md](../features/images.md).
- Параметры отображения секции (размер слайдов, трансформация, строки, скругление) приходят с сервера и мапятся в `src/pages/listen/lib/` (`mapItemsSize.ts`, `mapTransform.ts`, `mapWhereIsTitleLocated.ts`).
- Тап на заголовок секции («показать все») открывает список плейлистов секции.

## Кнопка «Продолжить» (ContinueListeningButton)

Акцентная кнопка вверху главного экрана (`ContinueListeningButton`, `src/pages/listen/ui/ContinueListeningButton.tsx`). Передаётся в `DynamicSectionsSlider` как проп `leadingElement` и рендерится в **фиксированной левой колонке** рядом с первым разделом (см. «Размещение»). Кнопка скрывается **только когда активны результаты поиска** (`leadingElement={!isSearchActive ? <ContinueListeningButton /> : undefined}`): при открытом, но неактивном поиске (запрос короче порога `MIN_QUERY_LENGTH`) кнопка остаётся видимой. Когда скрыта — первый раздел занимает всю ширину.

### Размещение

Кнопка стоит **под** кнопкой-лупой поиска и **справа от первого раздела**, в две колонки:

- **Левая колонка** — первый раздел целиком (заголовок + карточки, `flex: 1` — забирает всё, что осталось после кнопки).
- **Правая колонка** — блок кнопки: ширина фиксирована размером самого круга (`width: TOTAL_SIZE` = 224px, не доля строки), `alignSelf: 'stretch'`. Фиксированная колонка, **не скроллится** вместе с карточками первого раздела.
- Между колонками и по краям строки — отступ `INDENTS.medium` (`gap` + `paddingHorizontal` на строке), чтобы ни секция, ни кнопка не упирались в край экрана.
- Разделы со 2-го — на всю ширину, как раньше.

Строка двух колонок рендерится в `FirstSectionRow` (`src/pages/listen/ui/FirstSectionRow.tsx`): `View` с `flexDirection: 'row'` + `alignItems: 'stretch'` + `gap`/`paddingHorizontal: INDENTS.medium` → `View flex: 1` с первым разделом, затем `leadingElement` (порядок в JSX = порядок на экране). Блок кнопки растянут по высоте первого раздела; внутри — центральная зона `mainArea` с круглой кнопкой (см. «UI»), контент центрирован (`alignItems: 'center'`, `justifyContent: 'center'`) — раньше кнопка занимала ровно половину строки и центр круга уезжал к правому краю экрана; фиксированная ширина под сам круг убрала эту проблему.

### Состояния

- **История ещё не загружена** (`isHistoryLoadedAtom === false`) → кнопка **не рендерится** (`if (!isLoaded) return null`), чтобы не мигать disabled на холодном старте, пока `loadHistoryAction` читает AsyncStorage.
- **История пуста** (нет записей с проповедью) → блок **disabled**: `opacity: 0.5`, `accessibilityState={{ disabled: true }}`, `onPress` не срабатывает. Визуально — та же круглая кнопка с play-иконкой, но приглушённая.
- **История не пуста** → кнопка активна, play-иконка; возобновляет последнюю проповедь (первая запись из `historyAtom`, у которой `getEntrySermon(entry)` определён; записи отсортированы по `lastPlayedAt` DESC, записи без проповеди пропускаются). Выбор записи — через хук `useLastListeningEntry` (`entities/listening-history`).
- **Что-то играет** (`isPlayingAtom === true`) → иконка меняется на **паузу**, анимированное свечение **замирает** (анимация отменяется, кольцо остаётся статичным). Кнопка имеет **приоритет над disabled**: даже если история пуста, но что-то играет — кнопка активна (клик = пауза), `accessibilityState.disabled === false`.

### Тап

- **Когда ничего не играет** — возобновляет воспроизведение последней проповеди с сохранённой позиции: `resolveEntryPlaylist(entry)` (из `entities/listening-history`) резолвит полный `PlaylistData` (live `dynamicSectionsAtom` → `sections-cache` → снапшот `entry.playlist`), затем `usePlayNewSermon({ playlist, sermon })` — позиция восстанавливается автоматически через `getResumePosition` (см. [features/listening-history.md](../features/listening-history.md) → «Resume-логика»). Ошибки оборачиваются в try/catch → `reportError` (никаких тихих unhandled rejection).
- **Когда что-то играет** — клик = **пауза** (`pause()` из `usePlayer`), фуллскрин-плеер **не открывается**, `playNewSermon` не вызывается. Ошибки паузы — по паттерну `PlayerControls`: AppState-ошибка `'activity is no longer available'` → `console.warn` и гасится, остальное → `reportError`.

### UI

Весь блок — один `Pressable` (`accessible` — склеивает детей в один фокус TalkBack, `accessibilityRole='button'`). **Видимого текста нет** (issue #72): смысл передаётся только через `accessibilityLabel`. `accessibilityLabel`: когда играет — **«Воспроизводится: <название текущей проповеди>»** (или просто **«Воспроизводится»**, если `currentAudio` недоступен) + `accessibilityHint` **«Приостановить воспроизведение»**; иначе — «Продолжить: <название>» / «Начать слушать» (без hint). Константа `NOW_PLAYING_LABEL = 'Воспроизводится'` экспортируется из `ContinueListeningButton.tsx` (единый источник). **Центральная зона** `mainArea` (`flex: 1`, `justifyContent: 'center'`, `alignItems: 'center'`, `width: '100%'`) занимает всё пространство блока, поэтому контент оказывается **вертикально по центру** доступной высоты.

В `mainArea` рендерится **круглая кнопка** `ContinueCircleButton` (`src/pages/listen/ui/ContinueCircleButton.tsx`) — композиция из двух слоёв, наложенных друг на друга концентрически:

- **Свечение** `GlowRing` (`src/pages/listen/ui/GlowRing.tsx`) — волнообразный ореол вокруг кнопки (абсолютный оверлей, не в потоке). Один `react-native-svg`-холст `RING_SIZE = 224` (`glowConfig.ts`), центрированный через `viewBox="-112 -112 224 224"`; в нём `Defs` с общим набором `RadialGradient` (стопы `0.9 → 0.3 → 0`, accent `-1..3`) и три группы `GlowLayer` (`GlowLayer.tsx`) — каждая `<G>` с набором `Circle`-клякс, залитых этими градиентами: **подложка** `LAYER_BASE` (6 клякс по кругу, низкая непрозрачность — свечение не гаснет в промежутках) + две «кометы» `LAYER_CW` / `LAYER_CCW` (по 4 кляксы: яркая крупная «голова» + тусклеющий хвост). Палитра — тёплая, в оттенках брендового оранжевого (issue #72): `accent -1` = `currentTheme.primary` (Material You), `accent 0..3` = фиксированные акценты (`#ff8a3d` янтарь, `#ffb14d` золото, `#ff5c6e` коралл, `#ff9aa8` розовато-коралловый).
  - Анимация на **react-native-reanimated** через `useAnimatedProps` → `animatedProps` группы `<G>` (RN-style массив `transform: [{ rotate }, { scale }]`). Крутим именно `<G>`, а **не** родительский `View` вокруг SVG (тот на Android не всегда перерисовывается) и **не** через SVG-строку `transform` (её reanimated не умеет обрабатывать — падает `invalidTransform`).
  - Поворот слоёв — **не равномерный**. Один `withRepeat(withTiming(1, linear))` гоняет фазу `0 → 1` (CW ~16с, CCW ~23с), а угол считается в worklet: `±360° * phase + Σ ампл·sin(2π·freq·phase + offset)` (3 гармоники на слой, `glowConfig.cwAngle` / `ccwAngle`). Частоты **целочисленные**, поэтому на стыке `phase 1 ≡ 0` совпадают и угол, и угловая скорость — **переход бесшовный, без рывка**. Большие амплитуды → слой то ускоряется, то откатывается назад: движение псевдослучайное, а не просто по кругу. У CW и CCW разные наборы гармоник и периоды.
  - Общее «дыхание» `breathe` (`withRepeat(withTiming(1, 1500), -1, true)`) — лёгкая пульсация масштаба и непрозрачности слоёв в противофазе.
  - **Все** `withTiming` / `withSequence` / `withRepeat` — с `ReduceMotion.Never`: свечение декоративное и работает даже при системном «уменьшить движение» (иначе reanimated сворачивает бесконечный `withRepeat` до одного прохода — «подвигалось и встало»).
  - **Пока играет** (`isPlaying === true`) — все анимации **отменяются** (`cancelAnimation`), свечение замирает; при паузе/простое — снова в движении.
- **Непрозрачный внутренний круг** — `View` с `borderRadius = INNER_SIZE / 2`, залитый `currentTheme.surface` (тёмный в тёмной теме), **без обводки**, по центру — иконка `Entypo` из `@expo/vector-icons` (`controller-play` при паузе / `controller-paus` при игре, `ICON_SIZE = 100`) цветом `currentTheme.primary`. Иконка: `includeFontPadding: false` (Android — иначе глиф уезжает вверх); у play дополнительно `translateX: PLAY_ICON_NUDGE` (`ICON_SIZE * 0.08`) — треугольник смещён вправо к оптическому центру (масса слева, вершина справа), пауза симметрична и сдвига не требует. Непрозрачный круг перекрывает центр свечения, поэтому структура SVG не зависит от цвета фона экрана.

Размеры — именованные константы: `TOTAL_SIZE = 224` (габарит кнопки со свечением, **совпадает** с `glowConfig.RING_SIZE`; `ORBIT` и `BLOB_R` заданы долями от него — `0.27` / `0.19`, экспортируется из `ContinueCircleButton.tsx`), `INNER_SIZE = 168` (диаметр непрозрачного круга), `ICON_SIZE = 100`. **Layout-бокс кнопки** `block` — `width: TOTAL_SIZE` (фиксированная ширина под сам круг, а не доля строки — первый раздел слева, `flex: 1`, забирает остаток). Pressed-состояние — `opacity: 0.8` при нажатии, disabled — `opacity: 0.5`.

## Поиск

Фича `src/features/sermon-search/` (баррель `index.ts`, атомы и действия в `model.ts`).

### Открытие/закрытие

- По умолчанию поиск закрыт: первым ребёнком скролл-контента (`ScrollView` в `ListenScreen.tsx`) рендерится кнопка-лупа `SearchToggleButton` (иконка `Ionicons 'search'`, `accessibilityLabel 'Поиск'`) — обычный элемент скролла, **скроллится вместе с секциями**.
- Тап по лупе открывает поиск (`openSearch` → `isSearchOpenAtom = true`): `SearchBar` монтируется в **закреплённой строке шапки над скролл-областью** (см. «UI»), поле получает авто-фокус с задержкой на один кадр (клавиатура показывается). Лупа исчезает из скролл-контента — при открытии контент ниже сдвигается вверх на высоту убранной строки лупы (56), это ожидаемое поведение по UX-решению.
- Поиск закрывается крестиком «✕» при пустом поле (`closeSearch`): сбрасываются `searchQueryAtom`, `searchResultsAtom`, `isSearchingAtom`, `isSearchOpenAtom`, инвалидируются in-flight запросы (bump `latestRequestId` — устаревший ответ не перезапишет результаты), клавиатура скрывается, закреплённая строка размонтируется, лупа снова появляется в скролл-контенте.

### UI

- `SearchBar` (`src/features/sermon-search/ui/SearchBar.tsx`) рендерится в **закреплённой строке шапки** (`View` высотой `SEARCH_HEADER_HEIGHT = 56`, определён в `src/features/sermon-search/lib/constants.ts`, публично переэкспортируется через баррель фичи `src/features/sermon-search/index.ts`; `ListenScreen.tsx` импортирует и константу, и `SearchBar` через баррель) — первым ребёнком `SafeAreaView`, **над** скролл-областью, вне всех скролл-контейнеров: строка поиска не скроллится и видна всегда, пока поиск открыт. Ряд ниже — скролл-область: при коротком запросе — `ScrollView` секций, при активном (`≥ MIN_QUERY_LENGTH`) — список результатов `SermonSearchResults`; оба контейнера скроллятся под закреплённой строкой. Строка поиска центрируется в 56-пиксельной строке (`alignItems: 'center'` + `flexDirection: 'row'`), высота строки совпадает с прежней высотой кнопки-лупы в скролле, поэтому при открытии/закрытии поиска сдвиг контента ограничен одной строкой.
  Тематизированный `TextInput` (фон `currentTheme.surface`, радиус `RADIUSES.middle`), при фокусе — тонкая рамка акцентного цвета (`currentTheme.primary`). Плейсхолдер — «Поиск проповедей». Строка поиска растягивается на всю ширину строки шапки (`flex: 1` в `container` + `marginHorizontal`), кнопка «✕» остаётся прижата к правому краю. Авто-фокус и обработка `keyboardDidHide` вынесены в `useSearchAutofocus` (`src/features/sermon-search/lib/useSearchAutofocus.ts`): фокус откладывается на один кадр (`requestAnimationFrame`) — на Android фокус, запрошенный в том же кадре, что и монтирование, теряется и клавиатура не появляется; подписка на `keyboardDidHide` игнорирует событие до применения авто-фокуса, чтобы «хвостовое» скрытие от предыдущего закрытия не сбросило свежий фокус (на web подписка отключена). При сворачивании клавиатуры (`keyboardDidHide`) фокус с поля уходит (`blur`), рамка акцента гаснет — курсор не мигает.
  `TextInput.value` берётся из **локального состояния** `SearchBar` (`inputValue`), а не из `searchQueryAtom`: локальное состояние — единственный источник текста поля, при монтировании оно инициализируется из атома (монтирование происходит один раз при открытии поиска). При `onChangeText` локальное состояние и атом обновляются мгновенно и синхронно (дебаунс сетевых запросов остаётся в `useDebouncedSearch`). Так асинхронные ре-рендеры — переключение спиннера, приход ответа для более старого запроса — не могут «откатить» нативный текст к прежнему запросу: это классическая гонка controlled `TextInput`, когда между `onChangeText` и коммитом состояния вклинивается внешнее обновление (в React 19 concurrent окно шире) и введённый символ пропадает.
- Кнопка «✕» (`Очистить поиск`) видна всегда, пока открыт поиск:
  - запрос непустой → `resetSearchResults` (сброс `searchResultsAtom`/`isSearchingAtom` + инвалидация in-flight запросов через bump `latestRequestId`) и очистка поля (секции возвращаются, поиск остаётся открытым, фокус сохраняется);
  - запрос пустой → закрывает поиск целиком (`closeSearch`, клавиатура скрывается).
- `SermonSearchResults` (`src/features/sermon-search/ui/SermonSearchResults.tsx`) — рендерится вместо секций, когда поиск открыт и `useIsSearchActive()` истинно (длина обрезанного запроса `≥ MIN_QUERY_LENGTH = 2`). `FlatList` строк `SermonSearchRow` (обложка через `CoverImage`, фолбэк `IMAGE_PLACEHOLDER` — заголовок жирным, артист, книга+глава+стих через `formatScripture`); под заголовком каждого результата — тонкая полоса прогресса прослушивания (сохранённая позиция из `entities/listening-history` через `useHistoryProgressMap`); полоса обновляется **только по событиям** — без live-тикания в реальном времени (live-чтение убрано). Пустое состояние/спиннер — `ListEmptyComponent`. В ходе миграции на спецификацию API v0.15.1 `formatScripture` расширяется на диапазоны глав/стихов (см. [contracts/rest-api.md](../contracts/rest-api.md) → «Главы и стихи»). Строка поиска **не входит** в список: она закреплена над скролл-областью на уровне экрана (`ListenScreen.tsx`), а список скроллится под ней.
- Тап по результату запускает воспроизведение: `usePlayNewSermon` из `entities/player` с `resolvePlaylist(sermon)` (первый плейлист проповеди или минимальный fallback из полей самой проповеди).

### Подсказки (автодополнение)

- Значения для подсказок грузятся **однократно при открытии поиска**: `fetchDistinctValues` (`src/features/sermon-search/model-distinctValues.ts`) вызывает `sermonsApi.getSermons().sermonControllerGetDistinctValues()` (`GET /sermons/distinct-values` → `{artists, books}` — ранее использованные проповедники и книги). Повторные сессии поиска не перезапрашивают: guard `distinctValuesAtom !== null` + in-flight guard + `requestId` от stale-ответов. Online-first: при сетевой ошибке — фолбэк на кэш `cachedDistinctValues` (`src/features/sermon-search/lib/distinctValuesCache.ts`), успешный ответ пишется в кэш fire-and-forget; если сети и кэша нет — подсказки тихо не показываются, ошибки (`console.error`) не ломают существующий поиск.
- `SearchSuggestions` (`src/features/sermon-search/ui/SearchSuggestions.tsx`) — компактный absolute-дропдаун под закреплённой шапкой поиска (`SEARCH_HEADER_HEIGHT = 56`), рендерится из `SearchBar` (владельца текста поля). Строка: значение + категория («проповедник»/«книга»). Тема: `useTheme` (фон `currentTheme.surface`, `RADIUSES.middle`). В `ListenScreen.tsx` шапке поиска задан `zIndex: 1`, чтобы дропдаун перекрывал скролл-область; `keyboardShouldPersistTaps='handled'` — тап по подсказке не закрывает клавиатуру.
- Показ: поиск открыт && запрос ≥ 1 символа && есть совпадения && поле в фокусе. Скрытие: пустой запрос / нет совпадений / потеря фокуса / сразу после выбора подсказки (флаг `hasSelectedSuggestion`; новый ввод снова показывает список).
- Ранжирование — чистая функция `getSuggestions` (`src/features/sermon-search/lib/suggestions.ts`): case-insensitive contains; `startsWith` ранжируется выше contains; при равенстве артисты раньше книг, внутри категории — по алфавиту. Лимит в UI — `MAX_SUGGESTIONS = 8`.
- Выбор подсказки подставляет значение **тем же путём, что и ручной ввод** — локальный `inputValue` + `searchQueryAtom` вместе (единый источник текста поля — локальный state `SearchBar`); поиск запускается существующим дебаунсом 400 мс автоматически; фокус сохраняется.

### Данные

- `searchQueryAtom`, `searchResultsAtom`, `isSearchingAtom`, `isSearchOpenAtom` в `src/features/sermon-search/model.ts`; действия `openSearch`, `closeSearch`, `resetSearchResults`, `fetchSearchResults`.
- `useDebouncedSearch` (`src/features/sermon-search/lib/useDebouncedSearch.ts`): при активном запросе (`≥ 2` символа) — дебаунс 400 мс и вызов `fetchSearchResults`. Сброс результатов при очистке выполняется в `SearchBar` (✕ → `resetSearchResults`), а не здесь: при падении запроса ниже порога компонент результатов размонтируется в том же коммите, и эффект хука не успевает выполниться.
- `fetchSearchResults`: `sermonsApi.getSermons().sermonControllerFindAll({ search, take: 20 })` → маппинг через `mapAllSermonsResponse` (`shared/api`). Защита от устаревших ответов: `latestRequestId` — ответ старого запроса игнорируется (в т.ч. медленное чтение кэша не перезаписывает более свежий результат).
- Порог `MIN_QUERY_LENGTH = 2`: один символ слишком шумный для поиска по русскому тексту, двух символов достаточно для осмысленных совпадений.

### Состояния

- Поиск идёт: `ActivityIndicator` (цвет `currentTheme.primary`).
- Пусто: `EmptyState` «Ничего не найдено».
- Ошибка сети: `console.error`, затем фолбэк на кэш запроса (online-first, `src/features/sermon-search/lib/searchCache.ts`); при отсутствии кэша — пустое состояние.
- Офлайн: показываются закэшированные результаты последних запросов (per-query ключи `cachedSermonSearch:<query>`, cap 30 запросов). UI-индикатора источника данных нет (см. `docs/debt.md`).

## Откуда данные

- `fetchAllSections` из `src/pages/listen/model.ts`:
  - сначала `sectionsApi.getSections().sectionControllerFindAll()` (сеть);
  - при ошибке сети — кэш из AsyncStorage (`getCachedSections`, ключ `CACHED_SECTIONS` из `src/shared/config/cache-storage-keys.ts`);
  - успешный ответ всегда пишется в кэш (fire-and-forget `setCachedSections`).
- Атомы: `dynamicSectionsAtom`, `isLoadingSectionsAtom`, `sectionDataSourceAtom` (`'cache' | 'network' | 'unknown'`).
- Хук `useOfflineRetry` (`src/shared/lib/network/useOfflineRetry.ts`) перезапрашивает при возврате онлайн/в foreground/по таймеру, если последний ответ был не из сети.

## Куда можно перейти

- Тап на плейлист: если треков `< 2` — сразу запуск воспроизведения (`usePlayNewSermon`); иначе → `/listen/playlist?playlist=<JSON PlaylistData>` (`navigateToPlaylist` из `src/shared/routing/useListenNavigation.ts`).
- Тап на заголовок секции → `/listen/playlist-list?sectionId=<id секции>&title=<строка>` (`navigateToPlaylistList`).
- Тап на проповедь в результатах поиска — запуск воспроизведения (без перехода).

## Состояния

- Загрузка: `SectionsSkeleton` (`src/pages/listen/ui/skeleton.tsx`) — пока идёт загрузка и секций ещё нет. При наличии `leadingElement` (кнопка «Продолжить») скелетон **сплитится**: первая строка = первая (самая узкая, Small) секция скелетона слева (`count={1}`) + кнопка справа, а остальные секции скелетона (`from={1}`) рендерятся ниже на всю ширину. Так кнопка растягивается только на высоту первой строки (~239px), а не на весь скелетон (~1255px). `SectionsSkeleton` принимает пропсы `from` (индекс, по умолчанию 0) и `count` (сколько секций, по умолчанию все) → `SKELETON_SECTIONS.slice(from, count ? from + count : undefined)`.
- Пусто: `EmptyState` (`shared/ui`), когда загрузка завершена, а секций нет.
- Офлайн: показывается кэш (`sectionDataSourceAtom === 'cache'`), фоновые повторы через `useOfflineRetry`; при отсутствии кэша — `EmptyState`.
- Ошибка: сетевые ошибки логируются (`console.error`), при наличии кэша он показывается.

## Связанные документы

- [features/navigation.md](../features/navigation.md)
- [features/offline-and-network.md](../features/offline-and-network.md)
- [screens/playlist.md](./playlist.md)
- [screens/playlist-list.md](./playlist-list.md)
