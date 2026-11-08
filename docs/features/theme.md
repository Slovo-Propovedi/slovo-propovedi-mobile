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

**Правило:** мутируемые слоты темы (`primary`, `background`, `card`, `surface`, `text`, `textMuted`, `placeholder`, `skeleton`, `icon`, `backdrop`) **никогда** не захватываются внутри `StyleSheet.create` — `StyleSheet.create` фиксирует примитив на момент вычисления модуля, и цвет перестаёт следовать за сменой темы/динамических цветов. Цвета темы задавай через `useTheme()` + инлайн-стиль; `COLORS.<slot>` в styles-файлах допустим только для статичных слотов (`white`, `black`, `disabled` и т.п.).

## Токены

Интерфейс `ThemeColors` (`src/shared/ui/theme/types.ts`): `backdrop, background, card, icon, placeholder, primary, skeleton, surface, text, textMuted`. Объекты `LightTheme`/`DarkTheme` — `src/shared/ui/theme/constants.ts`.

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

Единый рецепт стекла для четырёх плавающих поверхностей — острова табов, круга поиска, пилюли мини-плеера и пилюли поиска с её кругом «✕» — живёт в `src/shared/ui/glass/`:

- `glass.ts` — константы `GLASS` (интенсивность блюра, web-фильтр, android-подсказки глубины, альфы заливки/рамки, параметры тени) и чистые геттеры `getGlassFill`/`getGlassBorder`/`getGlassTint`/`getWebGlassStyle`; фабрика `createGlassStyles(isLight, radius)` собирает слои (`blur`, `fill`, `rim`, `container`-тень) на каждый рендер. Модульного `StyleSheet.create` с цветами темы нет — это то же правило про мутируемые слоты, что и выше.
- `GlassSurface.tsx` — общий компонент фона: платформенный блюр под полупрозрачной заливкой и 1px белая рамка. Сам клипует слои по радиусу, поэтому хост не обязан ставить `overflow: 'hidden'` (важно для пилюли поиска — иначе обрезался бы выпадающий список подсказок).
- `BlurBackdrop.tsx` + `blurTargets.ts` + `BlurTargetProvider.tsx` + `useActiveBlurTarget.ts` — инфраструктура реального Android-блюра: страница публикует свой `BlurTargetView`, провайдер резолвит активный маршрут, поверхности читают target из контекста (см. ниже).

Значения рецепта: `intensity = 40` (умеренный блюр — контент за островом остаётся читаемым, как в Apple Music); заливка light `rgba(255, 255, 255, 0.45)`, dark `rgba(0, 0, 0, 0.35)`; рамка 1px `rgba(255, 255, 255, 0.25)` / `0.12`; тень `0px 5px 14px rgba(0, 0, 0, 0.25)` (на острове табов остаётся и прежний `elevation: 12` контейнера — он отвечает за слоистость). Радиус передаётся поверхности отдельно: круглые острова — `RADIUSES.round`, пилюля мини-плеера — `PLAYER_SIZES.miniPlayerHeight / 2`; сами слои стекла одинаковые.

Платформы:

- **iOS** — нативный `BlurView` с `tint` light/dark; refraction уже даёт сам материал.
- **Web** — `expo-blur` ограничивает `backdrop-filter` формулой `saturate(180%) blur(intensity × 0.2px)` и не умеет `brightness`, поэтому `GlassSurface` на web **не рендерит** `BlurView`, а кладёт два обычных `View`: базовый слой с `backdropFilter: blur(4px) saturate(180%) brightness(1.1)` (`GLASS.web.backdropFilter`) и полупрозрачной заливкой, а поверх него — **кольцо рефракции** без заливки: `backdropFilter: url(#sp-glass-refraction)` (`getWebRefractionStyle()`), замаскированное CSS-маской до внешних 10px (`GLASS.web.edgeRingWidth`). SVG-фильтр `feTurbulence` + `feDisplacementMap scale="28"` из `public/index.html` даёт сильное «преломление», но маска оставляет его только у кромки: центр остаётся чистым, а не превращается в однородную кашу, тогда как кромка гнётся, как толстое стекло. Рефракция — **progressive enhancement**: если движок не поддерживает `url()` в `backdrop-filter`, он отбрасывает только кольцо, а базовый блюр и заливка остаются; если не поддерживается маска — кольцо деградирует до прежнего full-surface преломления. Именно поэтому фильтр-ссылка вынесена в отдельный слой, а не в общую цепочку с `blur()` — иначе невалидное объявление отбросилось бы целиком вместе с блюром. `backdropFilter` и mask-свойства отсутствуют в типах RN `ViewStyle`, поэтому стиль описан локальным интерфейсом `WebGlassStyle` (без `as`). См. [web.md](./web.md#стекло-и-backdrop-filter).
- **Android 12+** — реальный backdrop blur (dimezis). `expo-blur` включает его только при `blurTarget` — ref на `BlurTargetView`, **внутри** которого рендерится размываемый контент; сам `BlurView` обязан быть его сиблингом, а не потомком (иначе захватывает сам себя). Поэтому в `BlurBackdrop` (`glass/BlurBackdrop.tsx`) обёрнут корень **каждого экрана, над которым видна нижняя строка**: корневые табы (`/listen`, `/read`, `/study`, `/more`), вложенные маршруты стека «Слушать» (`/listen/playlist`, `/listen/playlist-list`, `/listen/my-playlists`, `/listen/search-results`, `/listen/playlist-edit`) и все табы админки (`/admin`, `/admin/sections`, `/admin/playlists`, `/admin/sermons`, `/admin/media`, `/admin/flags`, `/admin/users`). На первом `onLayout` экран регистрирует ref нативного target в реестре `glass/blurTargets.ts` по ключу маршрута (`BLUR_TARGET_ROUTES`), `BlurTargetProvider` в `app/(tabs)/_layout.tsx` и `app/admin/(tabs)/_layout.tsx` резолвит `usePathname()` в этот ref и раздаёт через контекст, а `GlassSurface` прокидывает `blurMethod: 'dimezisBlurViewSdk31Plus'` + `blurTarget` только когда ref реально есть. Ключи — точные значения `usePathname()`: Expo Router не включает в pathname групповые сегменты (`(tabs)`) и query-параметры, поэтому маршрут с параметрами (`/listen/playlist?playlist=…`) резолвится по своему стабильному пути. Реестр живёт вне React-дерева: переход между экранами и размонтирование страницы обновляют target без пересоздания островов, `BlurView` перецеливается на лету (`expo-blur` пересоздаёт dimezis-контроллер при смене `blurTarget`). Геометрия и анимации островов не участвуют — меняется только источник блюра. Пока target не зарегистрирован (страница ещё не разложена, экран вне нижней строки — детали админки, логин) — tint-фолбэк, и `dimezis` без target не передаётся никогда (иначе `expo-blur` пишет warning и молча откатывается).
- **Android 11 и ниже** — dimezis на этих API ненадёжен по производительности, поэтому `supportsAndroidBackdropBlur()` (SDK ≥ 31) отключает и обёртку target, и сам метод: остаются подсказки глубины — верхняя внутренняя «sheen»-градиентная полоса `rgba(255,255,255,0.10) → 0` на 40% высоты (`GLASS.android.sheen`) и чуть более плотная заливка (`GLASS.android.fillAlphaBoost`, +0.06 к альфе). На iOS/web эти слои не рендерятся.

**Стекло требует прозрачного фона под ним.** Пилюля мини-плеера монтируется поверх контейнера полноэкранного плеера (`ContainerView`), который в свёрнутом состоянии занимает ровно тот же прямоугольник и исторически красился непрозрачным `theme.surface` — `BlurView` пилюли видел только эту заливку, и «стекло» выглядело сплошным. Поэтому контейнер получает `opacity: 0` в покое через `getContainerOpacity` в анимированном `containerStyle`: при `progress = 0` (точное состояние покоя) лист не красится вовсе, при любой ненулевой фазе разворота/сворачивания остаётся видимым (в это время пилюля уже/ещё видна сама). Цветность держим только в анимированном слое сознательно: React-коммит `opacity: 0` из resting-стиля сработал бы в кадре старта сворачивания и на один кадр погасил бы развёрнутый лист; resting-слой по-прежнему отвечает за геометрию (Issue #63). Новые слои под стеклянной поверхностью не должны закрашивать её прямоугольник. На Android 12+ пилюля размывает не `ContainerView`, а target страницы (см. платформы выше), поэтому правило остаётся критичным для iOS/web и для tint-фолбэка на Android 11 и ниже.

## Разрешение текущей темы

Функция `resolveTheme(mode, systemTheme, dynamicEnabled)` (`src/shared/ui/theme/model.ts`):

1. если `dynamicEnabled` — пробует `buildDynamicTheme()`, при успехе использует её;
2. иначе `isLight = mode === 'system' ? systemTheme === 'light' : mode === 'light'`;
3. возвращает `LightTheme` / `DarkTheme`.

Та же логика дублируется в `getTheme(mode, systemTheme)` (`constants.ts`, без учёта динамики). `updateThemeBasedOnMode` пересчитывает `currentThemeAtom` из текущих атомов без побочных эффектов.

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
