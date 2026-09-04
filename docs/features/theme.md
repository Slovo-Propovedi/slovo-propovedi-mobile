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
- Также есть мутируемый объект `COLORS` + `updateCOLORS()` — `src/shared/ui/theme/colors.ts` (инициализируется `initializeCOLORS(ctx)` в `themed.ts`).

## Токены

Интерфейс `ThemeColors` (`src/shared/ui/theme/types.ts`): `backdrop, background, card, icon, primary, skeleton, surface, text, textMuted`. Объекты `LightTheme`/`DarkTheme` — `src/shared/ui/theme/constants.ts`.

Константы вёрстки — `src/shared/ui/theme/themed.ts`:

- `COLORS` (мутируемые слоты темы + статичные цвета),
- `FONT_SIZES`, `INDENTS`, `RADIUSES`, `SCREEN_PADDING`, `PLAYER_SIZES`.

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

Тип `ThemedColors` (добавляет track-tint-цвета слайдеров) — `src/shared/ui/theme/types.ts`.

## Разрешение текущей темы

Функция `resolveTheme(mode, systemTheme, dynamicEnabled)` (`src/shared/ui/theme/model.ts`):

1. если `dynamicEnabled` — пробует `buildDynamicTheme()`, при успехе использует её;
2. иначе `isLight = mode === 'system' ? systemTheme === 'light' : mode === 'light'`;
3. возвращает `LightTheme` / `DarkTheme`.

Та же логика дублируется в `getTheme(mode, systemTheme)` (`constants.ts`, без учёта динамики). `updateThemeBasedOnMode` пересчитывает `currentThemeAtom` из текущих атомов без побочных эффектов.

## Синхронизация `Appearance`

`setThemeMode` и `loadThemeMode` вызывают `Appearance.setColorScheme?.(...)` (`'system'` → `'unspecified'`), чтобы системный статус-бар и нативные элементы соответствовали выбранному режиму. При `setSystemTheme` (смена системной темы) `currentThemeAtom` пересчитывается, а `Appearance` не трогается. Опциональный вызов (`?.`) — на `react-native-web` метода `setColorScheme` нет.

## Скроллбары на web

`ThemeProvider` (эффект только при `Platform.OS === 'web'`) прокидывает цвета активной темы в CSS-переменные `--sp-scrollbar-thumb` (`currentTheme.textMuted`) и `--sp-scrollbar-thumb-hover` (`currentTheme.text`) на `document.documentElement`. Сами правила `::-webkit-scrollbar*` / `scrollbar-width` / `scrollbar-color` — в `public/index.html` (фолбэк — нейтральный серый). Переключение светлая/тёмная перекрашивает скроллбары автоматически. Подробнее — [web.md](./web.md#скроллбары).

## Настройки

Компоненты — `src/pages/settings/ui/`:

- `ThemeDialog.tsx` — модальное окно выбора темы;
- `ThemeSelector.tsx` + `ThemeSelectorOption.tsx` + `themeOptions.ts` — список режимов (light/dark/system);
- `DynamicColorsItem.tsx` — чекбокс Material You (рендерится только при `isMaterialYouSupported()`);
- `SettingsScreen.tsx` собирает пункты настроек.

## Связанные документы

- [state.md](./state.md) — атомы темы в карте состояния
- [../screens/settings.md](../screens/settings.md) — экран настроек
- [storage.md](../contracts/storage.md) — ключи `theme_mode` / `dynamic_colors`
