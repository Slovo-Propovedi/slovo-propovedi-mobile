import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { Appearance } from 'react-native'
import { buildDynamicTheme, DarkTheme, LightTheme } from './constants'
import { type ThemeColors, ThemeMode } from './types'

const THEME_MODE_KEY = 'theme_mode'
const DYNAMIC_COLORS_KEY = 'dynamic_colors'

export const themeModeAtom = atom<ThemeMode>('system', 'themeModeAtom')

export const systemThemeAtom = atom<'dark' | 'light'>(
  Appearance.getColorScheme() === 'light' ? 'light' : 'dark',
  'systemThemeAtom',
)

const initialSystemTheme = Appearance.getColorScheme() === 'light' ? 'light' : 'dark'
const initialCurrentTheme = initialSystemTheme === 'light' ? LightTheme : DarkTheme
export const currentThemeAtom = atom<ThemeColors>(initialCurrentTheme, 'currentThemeAtom')

export const dynamicColorsEnabledAtom = atom<boolean>(false, 'dynamicColorsEnabledAtom')

const resolveTheme = (
  mode: ThemeMode,
  systemTheme: 'dark' | 'light',
  dynamicEnabled: boolean,
): ThemeColors => {
  if (dynamicEnabled) {
    const dynamic = buildDynamicTheme()
    if (dynamic) return dynamic
  }

  const isLight = mode === 'system' ? systemTheme === 'light' : mode === 'light'

  return isLight ? LightTheme : DarkTheme
}

export const setDynamicColors = action(async (ctx, enabled: boolean) => {
  await AsyncStorage.setItem(DYNAMIC_COLORS_KEY, String(enabled))

  await ctx.schedule(() => {
    dynamicColorsEnabledAtom(ctx, enabled)
  })

  await updateThemeBasedOnMode(ctx)

  return enabled
}, 'setDynamicColors')

export const loadDynamicColors = action(async ctx => {
  try {
    const saved = await AsyncStorage.getItem(DYNAMIC_COLORS_KEY)
    const enabled = saved === 'true'

    dynamicColorsEnabledAtom(ctx, enabled)

    return enabled
  } catch (error) {
    console.error('Failed to load dynamic colors:', error)
    dynamicColorsEnabledAtom(ctx, false)

    return false
  }
}, 'loadDynamicColors')

export const setThemeMode = action(async (ctx, mode: ThemeMode) => {
  if (!Object.values(ThemeMode).includes(mode)) throw new Error(`Invalid theme mode: ${mode}`)

  await AsyncStorage.setItem(THEME_MODE_KEY, mode)
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode)

  const systemTheme =
    mode === 'system'
      ? Appearance.getColorScheme() === 'light'
        ? 'light'
        : 'dark'
      : ctx.get(systemThemeAtom)

  const newTheme = resolveTheme(mode, systemTheme, ctx.get(dynamicColorsEnabledAtom))

  await ctx.schedule(() => {
    themeModeAtom(ctx, mode)
    currentThemeAtom(ctx, newTheme)
  })
  return mode
}, 'setThemeMode')

export const setSystemTheme = action((ctx, systemTheme: 'dark' | 'light') => {
  systemThemeAtom(ctx, systemTheme)
  const mode = ctx.get(themeModeAtom)
  const newTheme = resolveTheme(mode, systemTheme, ctx.get(dynamicColorsEnabledAtom))

  currentThemeAtom(ctx, newTheme)
  return systemTheme
}, 'setSystemTheme')

export const updateThemeBasedOnMode = action(async ctx => {
  const mode = ctx.get(themeModeAtom)
  const systemTheme = ctx.get(systemThemeAtom)
  const dynamicEnabled = ctx.get(dynamicColorsEnabledAtom)
  const newTheme = resolveTheme(mode, systemTheme, dynamicEnabled)

  currentThemeAtom(ctx, newTheme)
}, 'updateThemeBasedOnMode')

export const loadThemeMode = action(async ctx => {
  try {
    const savedMode = await AsyncStorage.getItem(THEME_MODE_KEY)
    const validMode: ThemeMode =
      savedMode && Object.values(ThemeMode).includes(savedMode as ThemeMode)
        ? (savedMode as ThemeMode)
        : 'system'

    const systemTheme = (Appearance.getColorScheme() === 'light' ? 'light' : 'dark') as
      'dark' | 'light'
    systemThemeAtom(ctx, systemTheme)

    const dynamicEnabled = ctx.get(dynamicColorsEnabledAtom)
    const newTheme = resolveTheme(validMode, systemTheme, dynamicEnabled)

    themeModeAtom(ctx, validMode)
    currentThemeAtom(ctx, newTheme)
    Appearance.setColorScheme(validMode === 'system' ? 'unspecified' : validMode)
    return validMode
  } catch (error) {
    console.error('Failed to load theme mode:', error)
    themeModeAtom(ctx, 'system')
    return 'system' as ThemeMode
  }
}, 'loadThemeMode')
