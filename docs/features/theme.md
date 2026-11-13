# Тема и Material You

**Слой:** `shared/ui/theme`

**Миграция:** `shared/ui/themed.ts` перемещён в `shared/ui/theme/themed.ts`. Символы темы (`COLORS`, `FONT_SIZES`, `INDENTS`, `RADIUSES`, `useTheme`) экспортируются из `shared/ui/theme`, **не** из `shared/ui`. Barrel `shared/ui/index.ts` больше не реэкспортирует символы темы.
**Статус:** готов

## Режимы темы

Три режима: `light`, `dark`, `system` (enum `ThemeMode` в `src/shared/ui/theme/types.ts`).

Атомы и экшены — `src/shared/ui/theme/model.ts`:

- `themeModeAtom` (по умолчанию `'system'`);
- `currentThemeAtom` — текущий объект `ThemeColors`;
- `systemThemeAtom` — `'dark' | 'light'` (из `Appearance.getColorScheme()`);
- `dynamicColorsEnabledAtom` — включены ли Material You цвета;
- экшены `setThemeMode`, `loadThemeMode`, `setSystemTheme`, `updateThemeBasedOnMode`, `setDynamicColors`, `loadDynamicColors`.

`setThemeMode` дополнительно вызывает `Appearance.setColorScheme(...)` и персистит режим в AsyncStorage (`THEME_MODE_KEY = 'theme_mode'`). `loadThemeMode`/`loadDynamicColors` восстанавливают сохранённые значения при старте.

## Material You / Динамические цвета

- **Только Android.** Поддержка проверяется `isMaterialYouSupported()` (`src/shared/ui/theme/materialYou.ts`): `Platform.OS === 'android' && Platform.Version >= 31` (Android 12+).
- Динамическая тема строится `buildDynamicTheme()` (`src/shared/ui/theme/constants.ts`) через `Color.android.dynamic.*` (`expo-router`). На iOS/null-Android возвращает `null`.
- `setDynamicColors(enabled)` персистит флаг в `dynamic_colors` и пересчитывает `currentThemeAtom`.

## ThemeProvider / useTheme

- `ThemeProvider` — `src/shared/ui/theme/ThemeContext/ThemeProvider.tsx`, монтируется в `app/_layout.tsx`.
- `useTheme` — `src/shared/ui/theme/ThemeContext/useTheme.ts`, возвращает `{ currentTheme, isLight }`.
- `ThemeContext` (React-контекст) — `src/shared/ui/theme/ThemeContext/themeContext.tsx`; тип значения контекста `ThemeContextValue` — `src/shared/ui/theme/ThemeContext/ThemeContextValue.ts` (тип-only файл).
- **Правило именования:** в `ThemeContext/` нет двух файлов, отличающихся только регистром имени (`ThemeContext.ts` переименован в `ThemeContextValue.ts`): на case-insensitive ФС (macOS по умолчанию) `./themeContext` резолвится в `themeContext.ts` → case-insensitive матчинг с типом-only `ThemeContext.ts`, ломая tsc (TS1149/TS2305), jest (`Cannot read properties of undefined (reading 'Provider')`) и typed-линт. Новые файлы не должны отличаться от соседей только регистром.
- Также есть мутируемый объект `COLORS` + `updateCOLORS()` — `src/shared/ui/theme/colors.ts` (инициализируется `initializeCOLORS(ctx)` в `themed.ts`).

**Правило:** мутируемые слоты темы (`primary`, `onPrimary`, `background`, `card`, `surface`, `text`, `textMuted`, `placeholder`, `skeleton`, `icon`, `backdrop`) **никогда** не захватываются внутри `StyleSheet.create` — `StyleSheet.create` фиксирует примитив на момент вычисления модуля, и цвет перестаёт следовать за сменой темы/динамических цветов. Цвета темы задавай через `useTheme()` + инлайн-стиль; `COLORS.<slot>` в styles-файлах допустим только для статичных слотов (`white`, `black`, `disabled` и т.п.).

## Токены

Интерфейс `ThemeColors` (`src/shared/ui/theme/types.ts`): `backdrop, background, card, icon, onPrimary, placeholder, primary, skeleton, surface, text, textMuted`. Объекты `LightTheme`/`DarkTheme` — `src/shared/ui/theme/constants.ts`.

`onPrimary` — цвет подписи/иконки поверх `primary` (кнопки, бейджи): в светлой теме `#fff`, в тёмной `#000`; динамическая тема берёт `Color.android.dynamic.onPrimary`.

`placeholder` — отдельный слот для `placeholderTextColor` текстовых полей: намеренно тусклее `textMuted`, чтобы подсказка поля не читалась как введённое значение (см. [`/screens/admin-playlists.md`](../screens/admin-playlists.md), общие примитивы `shared/ui/form`).

Константы вёрстки — `src/shared/ui/theme/themed.ts`:

- `COLORS` (мутируемые слоты темы + статичные цвета),
- `FONT_SIZES`, `INDENTS`, `RADIUSES`, `PLAYER_SIZES`,
- `MIN_TOUCH_TARGET` (`48`) — минимальный размер доступной touch-зоны иконочных кнопок (Apple HIG 44pt / Android Material 48dp). Применяется централизованно в `shared/ui/icon-button` базовым стилем (`minWidth`/`minHeight` + центрирование иконки); вызывающий стиль идёт после базового и может переопределить размер.

Пример использования в стилях:

```tsx
import { StyleSheet } from 'react-native'
import { useTheme } from 'shared/ui/theme'

const { currentTheme } = useTheme()

<View style={[styles.card, { backgroundColor: currentTheme.card }]} />

const styles = StyleSheet.create({
  card: { borderRadius: RADIUSES.middle, padding: INDENTS.medium },
})
```

Тип `ThemeColors` (базовый набор слотов темы) — `src/shared/ui/theme/types.ts`.

## Стеклянные нижние острова (frosted glass)

Единый рецепт стекла для плавающих поверхностей — острова табов, морфящего поискового кадра (круг ⇄ пилюля) с его кругом «✕» и пилюли мини-плеера — живёт в `src/shared/ui/glass/`:

- `glass.ts` — константы `GLASS` (интенсивность блюра, web-фильтр, android-подсказки глубины, альфы заливки/рамки) и чистые геттеры `getGlassFill`/`getGlassBorder`/`getGlassTint` + web-геттеры `getWebGlassFill`/`getWebGlassBorder`; фабрика `createGlassStyles(isLight, radius)` собирает нативные слои (`blur`, `fill`, `rim`, `containerPlain` — хост без собственной тени, глубину даёт общая градиентная подложка) на каждый рендер. Модульного `StyleSheet.create` с цветами темы нет — это то же правило про мутируемые слоты, что и выше. `webGlass.ts` собирает из этих геттеров единый web-стиль `getWebGlassStyle(isLight, radius)`.
- `GlassSurface.tsx` — общий компонент фона: платформенный блюр под полупрозрачной заливкой и 1px белая рамка. Сам клипует слои по радиусу, поэтому хост не обязан ставить `overflow: 'hidden'` (важно для пилюли поиска — иначе обрезался бы выпадающий список подсказок).
- `BlurBackdrop.tsx` + `blurTargets.ts` + `BlurTargetProvider.tsx` + `useActiveBlurTarget.ts` — инфраструктура реального Android-блюра: страница публикует свой `BlurTargetView`, провайдер резолвит активный маршрут, поверхности читают target из контекста (см. ниже).

Значения рецепта: `intensity = 40` (умеренный блюр — контент за островом остаётся читаемым, как в Apple Music); прозрачная заливка light `rgba(255, 255, 255, 0.5)`, dark `rgba(0, 0, 0, 0.36)` — сквозь неё читаются смазы размытой подложки (воспринимаемая рефракция), а не молочный слой; рамка 1px `rgba(255, 255, 255, 0.25)` / `0.12`; верхняя sheen-полоса `rgba(255, 255, 255, 0.14) → 0` рендерится на всех платформах. Web живёт по классическому глассморфизму: `blur(12px) saturate(140%)`, заливка light `rgba(255, 255, 255, 0.2)` / dark `rgba(0, 0, 0, 0.3)` и рамка 1px `rgba(255, 255, 255, 0.45)` / `0.15`. Собственных теней у островов, поиска и пилюли нет: глубину даёт только единая заметная градиентная подложка `BarBackdropShade` (`widgets/expandable-player`), которая тянется во всю ширину экрана от низа (без safe-area: навбар прозрачный) и сопровождает весь видимый нижний хром: с пилюлей она якорится к верху миниплеера и движется вместе с ним, без пилюли — к верху ряда островов (остров табов, круг поиска и открытая пилюля поиска делят верх ряда) и следует за морфом бара: высота острова меняется 76⇄64, поэтому верхний зазор и высота подложки едут вместе с ним (чистый хелпер `getBarShadeHeight`). Подложка зависит от темы: в светлой — чёрный градиент (0.18), в тёмной — серый градиент той же воспринимаемой плотности (альфа удвоена до 0.36). От низа экрана до середины миниплеера она держит полную плотность; выше середины — один непрерывный градиент (прозрачный → плотный → плотный, стопы от settled-геометрии), стыка слоёв больше нет — на части устройств (Xiaomi, Android 15) шов на стыке читался как горизонтальная линия посередине пилюли. Стопы пересчитываются только на коммитах settled-состояния (во время морфа конец рампы смещается на считанные пиксели), а высоту подложки двигает общий морф-драйвер пилюли `barMorphProgressSv` (`barMorphDriver.ts`) — один `withTiming` на пилюлю и подложку, поэтому градиент не отстаёт от нижнего хрома. Подложка рендерится первым ребёнком `floatingContainer` таб-бара — выше экранов, ниже островков, на всех платформах. Она видна всегда, пока виден нижний хром, и скрывается только при полноэкранном плеере после завершения его морфа и до первого измерения таб-бара. `elevation: 12` теперь у ряда островов, а не у контейнера таб-бара: ряд по-прежнему рисует острова над контентом экранов, а сама подложка остаётся плоской и рисуется в документном порядке таб-бара — ниже пилюли мини-плеера; корень поддерева плеера (`recoveryOverlay`) несёт `zIndex: 20`, поэтому нижний хром, включая подложку, остаётся под плеером, — на Android это единственный надёжный рычаг порядка относительно сиблинга-`<Tabs>` (elevation упорядочивает только внутри групп сиблингов). Прежний `elevation` на контейнере проецировал всё поддерево таб-бара, включая градиент подложки, поверх поддерева плеера: на Android градиент композитился поверх мороза пилюли (темнее в светлой теме, светлее-серый в тёмной), тогда как острова внутри контейнера оставались чистыми — это и был root cause репорта 2026-11-10 (подтверждено непрозрачным красным зондом). Радиусы островов больше не передаются поверхностями — `GlassIsland` сам применяет full-round, который платформа клампит до половины высоты (пилюля/круги любой высоты остаются строгими полу-цилиндрами).

Платформы:

- **iOS** — нативный `BlurView` с `tint` light/dark; refraction уже даёт сам материал, поверх — общая верхняя sheen-полоса.
- **Web** — `expo-blur` на web ограничивает `backdrop-filter` и не даёт нужного контроля, поэтому `GlassSurface` **не рендерит** `BlurView`, а кладёт один слой классического глассморфизма (`getWebGlassStyle(isLight, radius)` из `src/shared/ui/glass/webGlass.ts`): `backdrop-filter: blur(12px) saturate(140%)` (`GLASS.web.backdropFilter`) с полупрозрачной заливкой и рамкой 1px, скруглённый по радиусу хоста. Фильтр эмитится дважды — обычным `backdropFilter` и `WebkitBackdropFilter` для Safari, который понимает только префиксную форму. Тени нет — глубину даёт общая подложка `BarBackdropShade`; поверх листа рендерится та же верхняя sheen-полоса (`LinearGradient` web-safe) — световая кромка рефракции. Стиль описан интерфейсом `WebGlassStyle extends ViewStyle`, потому что в типах RN `ViewStyle` этих ключей нет (без `as`). Браузеры без `backdrop-filter` показывают только заливку и рамку — контент под островом остаётся виден. Нативное стекло (expo-blur) не изменилось. См. [web.md](./web.md#стекло-и-backdrop-filter).
- **Android 12+** — реальный backdrop blur (dimezis). `expo-blur` включает его только при `blurTarget` — ref на `BlurTargetView`, **внутри** которого рендерится размываемый контент; сам `BlurView` обязан быть его сиблингом, а не потомком (иначе захватывает сам себя). Поэтому в `BlurBackdrop` (`glass/BlurBackdrop.tsx`) обёрнут корень **каждого экрана, над которым видна нижняя строка**: корневые табы (`/listen`, `/read`, `/more`), вложенные маршруты стека «Слушать» (`/listen/playlist`, `/listen/playlist-list`, `/listen/my-playlists`, `/listen/playlist-edit`) и табы админки (`/admin`, `/admin/sections`, `/admin/playlists`, `/admin/sermons`). Списочные экраны админки, открывающиеся из «Главной» (`/admin/media`, `/admin/flags`, `/admin/users`), — обычные стековые экраны с нативной шапкой: `BlurBackdrop` им не нужен (нижней строки на них нет). На первом `onLayout` экран регистрирует ref нативного target в реестре `glass/blurTargets.ts` по ключу маршрута (`BLUR_TARGET_ROUTES`), `BlurTargetProvider` в `app/(tabs)/_layout.tsx` и `app/admin/(tabs)/_layout.tsx` резолвит `usePathname()` в этот ref и раздаёт через контекст, а `GlassSurface` прокидывает `blurMethod: 'dimezisBlurViewSdk31Plus'` + `blurTarget` только когда ref реально есть. Ключи — точные значения `usePathname()`: Expo Router не включает в pathname групповые сегменты (`(tabs)`) и query-параметры, поэтому маршрут с параметрами (`/listen/playlist?playlist=…`) резолвится по своему стабильному пути. Реестр живёт вне React-дерева: переход между экранами и размонтирование страницы обновляют target без пересоздания островов, `BlurView` перецеливается на лету (`expo-blur` пересоздаёт dimezis-контроллер при смене `blurTarget`). Под одним маршрутом target'ы лежат стеком (страница + её полноэкранные оверлеи): открытая страница поиска (`SearchGate`) снова регистрирует свой target, и внутри него лежит непрозрачный фон темы — иначе blur читал бы фон окна (светло-серый в тёмной теме). При этом нижний хром размывает **собственную** подложку — градиентную область `BarBackdropShade` (`widgets/expandable-player/ui/ShadeBlurTarget.tsx`), смонтированную вместе с нижним хромом. На Android 12+ она регистрируется в реестре под отдельным ключом `BOTTOM_CHROME_SHADE_KEY`, а `getChromeBlurTarget` (`glass/blurTargets.ts`) предпочитает этот ключ target'у текущего маршрута: белый фон страницы поиска не просвечивает сквозь стекло островов, а смена scope, открытие/закрытие диалога и накрытые маршруты не перецеливают блюр и не дают исчезающей подложки. Исключение — мини-пилюля: она плавает **над** страницей, а не над подложкой, поэтому читает target страницы через `usePageBlurTarget` (игнорируя shade-ключ хрома). Иначе градиент подложки (полупрозрачный серый) давал бы пилюле светло-серый мороз на чёрной странице поиска — репорт 2026-11-13. Регистрация shade живёт только пока открыт поиск (`isSearchOpenAtom`); на остальных экранах хром, как раньше, размывает target страницы. Геометрия и анимации островов не участвуют — меняется только источник блюра. Пока target не зарегистрирован (страница ещё не разложена, экран вне нижней строки — детали админки, логин) — tint-фолбэк: `GlassSurface` в этом случае передаёт явный `blurMethod='none'`, а не `dimezis` (иначе `expo-blur` пишет warning и молча откатывается). Тот же явный `none` просит декоративная feather-тень `PillTabs` на странице поиска: у неё нет target по построению.
- **Android 11 и ниже** — dimezis на этих API ненадёжен по производительности, поэтому `supportsAndroidBackdropBlur()` (SDK ≥ 31) отключает и обёртку target, и сам метод: остаются подсказки глубины — верхняя внутренняя «sheen»-градиентная полоса `rgba(255,255,255,0.14) → 0` на 40% высоты (`GLASS.android.sheen`, рендерится на всех платформах) и чуть более плотная заливка (`GLASS.android.fillAlphaBoost`, +0.06 к альфе, только Android).

**Живое стекло на морфах (без деградации).** Во время морфов (остров табов, пилюля поиска и мини-плеер) живой блюр продолжается на всех платформах, включая Android 12+ с реально зарегистрированным target: эталон — web, где стекло всегда живое. Статичного фолбэка больше нет: раньше на время морфа стекло Android 12+ подменялось непрозрачной заливкой `currentTheme.background` + tint + sheen + 1px рамка ради бюджета кадров, но сплошная заливка фоном читалась как полностью белая/чёрная плита вместо стекла, и такой вид отвергнут. Если на слабых устройствах бюджет кадров морфов всё же просядет, фолбэк возвращать только полупрозрачным — не сплошной заливкой фоном (см. [debt.md](../debt.md)).

**Мини-пилюля: общее стекло на всех платформах.** Пилюля мини-плеера использует тот же общий `GlassSurface`, что и остальные острова, и на всех платформах морозит реальную подложку страницы (dimezis-таргет страницы на Android 12+, нативный материал на iOS, `backdrop-filter` на web, tint-фолбэк на Android 11 и ниже) — без панелей и платформенных развилок. Её мороз, как у любого стекла, отражает то, что реально находится за ней (при прокрутке контент уезжает под остров), поэтому полупрозрачность и механизм размытия идентичны кружкам табов и поиска. Все четыре нижних острова рендерятся через общий компонент-рамку `GlassIsland` (`shared/ui/glass`) — один хост, один `GlassSurface`, один слот контента — структурный паритет стекла по построению.

**Смена системной темы не сбрасывает геометрию островов.** У всех нижних островов (остров табов, пилюля поиска с её кругом «✕», мини-пилюля плеера) animated-геометрия дублируется последним plain resting-стилем, вычисленным из **settled**-состояния, а не из живых атомов (таб — `getTabIslandRestingStyles` от `settled` из `useAtomMorph`, поиск — resting-кадр из `getSearchIslandGeometry` по settled-флагам бара, поля и фокуса, плеер — `getRestingContainerStyle` от `settledCollapsed`/`settledExpanded`). Причина: `GlassSurface` получает remount-ключ от темы (пересоздание `BlurView` с новым `tint`), Fabric клонирует хост-ноду острова и пере-применяет из shadow tree значения animated-стилей **первого** рендера (Reanimated PropsFilter коммитит только первые значения, а mapper UI-потока не перезапускается — shared value не менялось), поэтому свёрнутый бар откатывался в развёрнутую launch-геометрию до следующего порога скролла. Resting-слой идёт после animated-слоя в массиве стилей и в покое совпадает с ним. **Settled-флаг запаздывает до завершения морфа:** на самом флипе он коммитит СТАРТОВОЕ состояние новой анимации (`!isTarget`), а цель — только по completion; иначе resting-слой красит остров в конечной позиции на кадр раньше анимированного слоя — видимый скачок «прыжок в цель → возврат → морф». Новый флип владеет коммитом сразу, поэтому потерянный или доставленный с опозданием settle прерванного морфа не может подменить геометрию чужой целью. Та же механика и защита, что у плеера (Issue #63, [player.md](./player.md)).

**Стекло требует прозрачного фона под ним.** Пилюля мини-плеера монтируется поверх контейнера полноэкранного плеера (`ContainerView`), который в свёрнутом состоянии занимает ровно тот же прямоугольник и исторически красился непрозрачным `theme.surface` — `BlurView` пилюли видел только эту заливку, и «стекло» выглядело сплошным. Поэтому контейнер получает `opacity: 0` в покое через `getContainerOpacity` в анимированном `containerStyle`: при `progress = 0` (точное состояние покоя) лист не красится вовсе, при любой ненулевой фазе разворота/сворачивания остаётся видимым (в это время пилюля уже/ещё видна сама). Цветность держим только в анимированном слое сознательно: React-коммит `opacity: 0` из resting-стиля сработал бы в кадре старта сворачивания и на один кадр погасил бы развёрнутый лист; resting-слой по-прежнему отвечает за геометрию (Issue #63). Новые слои под стеклянной поверхностью не должны закрашивать её прямоугольник. Пилюля мини-плеера подчиняется этому правилу на всех платформах: она морозит реальную подложку, а `ContainerView` в покое прозрачен (`opacity: 0`), поэтому стекло остаётся стеклом. Для остальных стеклянных слоёв правило остаётся в силе.

## Разрешение текущей темы

Функция `resolveTheme(mode, systemTheme, dynamicEnabled)` (`src/shared/ui/theme/model.ts`):

1. если `dynamicEnabled` — пробует `buildDynamicTheme()`, при успехе использует её;
2. иначе `isLight = mode === 'system' ? systemTheme === 'light' : mode === 'light'`;
3. возвращает `LightTheme` / `DarkTheme`.

Та же логика дублируется в `getTheme(mode, systemTheme)` (`constants.ts`, без учёта динамики). `updateThemeBasedOnMode` пересчитывает `currentThemeAtom` из текущих атомов без побочных эффектов.

### Навигационная тема react-navigation (форк expo-router)

Expo Router (эпоха SDK 58+) несёт собственный форк react-navigation (`node_modules/expo-router/build/react-navigation/`) со своим `ThemeContext`. `ThemeProvider` из `@react-navigation/native` на форк не влияет — это другой экземпляр контекста. Правильная точка — сабпас-экспорт `expo-router/react-navigation`, который реэкспортирует `ThemeProvider`, `DarkTheme` и `DefaultTheme` форка.

Без навигационной темы форк рисует светлый `DefaultTheme` (фон `rgb(242, 242, 242)`) в двух местах: элемент `Background` из `elements/Screen.js`, которым обёрнут **каждый** экран — и стековые, и таб-сцены, — и `nativeContainerStyle` нативного стека на iOS. На переходах назад (pop) пересобирающийся или анимирующийся экран на 1–2 кадра показывает этот светлый слой под собой, и полупрозрачное стекло нижних островов (таб-бар, поиск, мини-плеер) читает его как белую вспышку в тёмной теме. То же при выходе из админки — pop корневого стека к табам.

**Мост к теме приложения.** Чистая фабрика `buildNavigationTheme(isLight, currentTheme)` — `src/shared/ui/theme/navigationTheme.ts`; `NavThemeProvider` — `src/shared/ui/theme/NavThemeProvider.tsx`, монтируется в `app/_layout.tsx` внутри `ThemeProvider`. Слот-маппинг:

- `primary`, `background`, `card`, `text` — одноимённые слоты `ThemeColors`;
- `border` → `textMuted`, `notification` → `primary`;
- `fonts` наследуется от базовой темы форка.

Слоты `border` и `notification` в приложении не видны: хром собственный, у экранов явные `headerStyle`/`contentStyle`, поэтому заливка служебных рамок и бейджей нигде не проявляется.

**Android-блюр вспышку не даёт.** В `RenderNodeBlurController` (dimezis, Android 12+) кадры, когда у blur-target ещё нет записанного `RenderNode`, закрашиваются `frameClearDrawable` — это `decorView.background`. Фон окна следует night mode приложения (`Appearance.setColorScheme`), поэтому при тёмной теме приложения эта вспышка тёмная и не видна.

## Синхронизация `Appearance`

`setThemeMode` и `loadThemeMode` вызывают `Appearance.setColorScheme?.(...)` (`'system'` → `'unspecified'`), чтобы системный статус-бар и нативные элементы соответствовали выбранному режиму. При `setSystemTheme` (смена системной темы) `currentThemeAtom` пересчитывается, а `Appearance` не трогается. Опциональный вызов (`?.`) — на `react-native-web` метода `setColorScheme` нет.

## Системный навбар (Android)

- Навбар **всегда прозрачный** (включая область жестовой полоски): фон задаётся edge-to-edge + `android:navigationBarColor` transparent в `styles.xml`, а системная контрастная подложка отключена атрибутами `android:enforceNavigationBarContrast` / `expoEnforceNavigationBarContrast` в `android/app/src/main/res/values/styles.xml` (это то, что генерирует плагин `expo-navigation-bar` на prebuild; `enforceContrast: false` в `app.config.ts`).
- Таб-бар полупрозрачно закрашивает область навбара: размытый `BlurView` (`CustomTabBar`) с `paddingBottom: Math.max(bottom, BAR_BOTTOM_INSET_MIN)` покрывает и ряд кнопок, и полосу инсета — контент скроллится под полупрозрачную полосу (glass-эффект).
- Цвет кнопок/иконок следует теме приложения: тёмные глифы на светлой теме, светлые на тёмной. Реализовано в `ThemeProvider` (эффект по `isLight`): `NavigationBar.setStyle(isLight ? 'dark' : 'light')` — только Android, обёрнут в try-catch + `reportError` (косметика не должна ронять приложение).
- Требует нативной пересборки (`yarn run:android` / EAS build) — модуль и плагин применяются на этапе prebuild; атрибуты контраста закоммичены в `android/` (см. выше), поэтому работают и без повторного prebuild.
- **QA:** проверять на физическом устройстве — на эмуляторе Android 15 известный баг скрима (см. документацию `expo-navigation-bar`).

## Скроллбары на web

`ThemeProvider` (эффект только при `Platform.OS === 'web'`) прокидывает цвета активной темы в CSS-переменные `--sp-scrollbar-thumb` (`currentTheme.textMuted`) и `--sp-scrollbar-thumb-hover` (`currentTheme.text`) на `document.documentElement`. Там же он красит фон `documentElement` и `body` в `currentTheme.background` — перекрывая статичный бренд-фолбэк `#f16031` из `public/index.html`, чтобы тёмная тема не мигала светлым в зоне overscroll. Сами правила `::-webkit-scrollbar*` / `scrollbar-width` / `scrollbar-color` и сброс `html`/`body` (`overflow: hidden`, `overscroll-behavior: none`) — в `public/index.html` (фолбэк — нейтральный серый / бренд-цвет). Переключение светлая/тёмная перекрашивает скроллбары и фон автоматически. Подробнее — [web.md](./web.md#скроллбары).

Тот же эффект синхронизирует `<meta name="theme-color">` с `currentTheme.background` (хелпер `syncThemeColorMeta`): статус-бар/тулбар Chrome на Android следуют теме, а не статичному бренд-акценту. До загрузки JS в `public/index.html` стоят два scheme-scoped значения (`#ffffff` / `#000000`) — правильный цвет уже на первом кадре. Подробнее — [web.md](./web.md#цвет-системных-панелей-браузера-theme-color).

## Настройки

Компоненты — `src/pages/settings/ui/`:

- `ThemeDialog.tsx` — модальное окно выбора темы (на web закрывается по `Escape` — слой в общем стеке Escape `shared/lib/escape-key`, см. [web.md](./web.md#клавиатура-полноэкранного-плеера-web));
- `ThemeSelector.tsx` + `ThemeSelectorOption.tsx` + `themeOptions.ts` — список режимов (light/dark/system);
- `DynamicColorsItem.tsx` — чекбокс Material You (рендерится только при `isMaterialYouSupported()`);
- `SettingsScreen.tsx` собирает пункты настроек.

## Связанные документы

- [state.md](./state.md) — атомы темы в карте состояния
- [../screens/settings.md](../screens/settings.md) — экран настроек
- [storage.md](../contracts/storage.md) — ключи `theme_mode` / `dynamic_colors`
