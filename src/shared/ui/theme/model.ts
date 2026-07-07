import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { Appearance } from 'react-native'
import type { ThemeColors } from './types'
import { DarkTheme, LightTheme } from './constants'
import { ThemeMode } from './types'

const THEME_MODE_KEY = 'theme_mode'

export const themeModeAtom = atom<ThemeMode>('system', 'themeModeAtom')

export const systemThemeAtom = atom<'dark' | 'light'>(
  Appearance.getColorScheme() === 'light' ? 'light' : 'dark',
  'systemThemeAtom',
)

const initialSystemTheme = Appearance.getColorScheme() === 'light' ? 'light' : 'dark'
const initialCurrentTheme = initialSystemTheme === 'light' ? LightTheme : DarkTheme
export const currentThemeAtom = atom<ThemeColors>(initialCurrentTheme, 'currentThemeAtom')

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
  const newTheme =
    mode === 'system'
      ? systemTheme === 'light'
        ? LightTheme
        : DarkTheme
      : mode === 'light'
        ? LightTheme
        : DarkTheme

  await ctx.schedule(() => {
    themeModeAtom(ctx, mode)
    currentThemeAtom(ctx, newTheme)
  })
  return mode
}, 'setThemeMode')

export const setSystemTheme = action((ctx, systemTheme: 'dark' | 'light') => {
  systemThemeAtom(ctx, systemTheme)
  const mode = ctx.get(themeModeAtom)
  const newTheme =
    mode === 'system'
      ? systemTheme === 'light'
        ? LightTheme
        : DarkTheme
      : mode === 'light'
        ? LightTheme
        : DarkTheme
  currentThemeAtom(ctx, newTheme)
  return systemTheme
}, 'setSystemTheme')

export const updateThemeBasedOnMode = action(async ctx => {
  const mode = ctx.get(themeModeAtom)
  const systemTheme = ctx.get(systemThemeAtom)

  let newTheme: ThemeColors
  if (mode === 'system') newTheme = systemTheme === 'light' ? LightTheme : DarkTheme
  else newTheme = mode === 'light' ? LightTheme : DarkTheme

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

    const newTheme =
      validMode === 'system'
        ? systemTheme === 'light'
          ? LightTheme
          : DarkTheme
        : validMode === 'light'
          ? LightTheme
          : DarkTheme

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
