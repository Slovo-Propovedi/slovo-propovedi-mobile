import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx, type Ctx } from '@reatom/framework'
import { Appearance } from 'react-native'
import { DarkTheme, LightTheme } from './constants'
import {
  currentThemeAtom,
  dynamicColorsEnabledAtom,
  loadDynamicColors,
  loadThemeMode,
  setDynamicColors,
  setSystemTheme,
  setThemeMode,
  systemThemeAtom,
  themeModeAtom,
} from './model'
import { type ThemeMode } from './types'

describe('theme model', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light')
    jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {})
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null)
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('atom initial values', () => {
    test('themeModeAtom initial value is system', () => {
      expect(ctx.get(themeModeAtom)).toBe('system')
    })

    test('dynamicColorsEnabledAtom initial value is false', () => {
      expect(ctx.get(dynamicColorsEnabledAtom)).toBe(false)
    })

    test('currentThemeAtom has valid initial theme', () => {
      // Module initializes before beforeEach mock; jest-expo default getColorScheme is null → dark
      const initial = ctx.get(currentThemeAtom)
      expect(initial === LightTheme || initial === DarkTheme).toBe(true)
    })

    test('currentThemeAtom is DarkTheme when system is dark', () => {
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')
      const darkCtx = createCtx()
      expect(darkCtx.get(currentThemeAtom)).toBe(DarkTheme)
    })
  })

  describe('setThemeMode', () => {
    test('sets themeModeAtom to light and resolves LightTheme', async () => {
      await setThemeMode(ctx, 'light')

      expect(ctx.get(themeModeAtom)).toBe('light')
      expect(ctx.get(currentThemeAtom)).toBe(LightTheme)
    })

    test('sets themeModeAtom to dark and resolves DarkTheme', async () => {
      await setThemeMode(ctx, 'dark')

      expect(ctx.get(themeModeAtom)).toBe('dark')
      expect(ctx.get(currentThemeAtom)).toBe(DarkTheme)
    })

    test('sets themeModeAtom to system and resolves based on system theme', async () => {
      await setThemeMode(ctx, 'system')

      expect(ctx.get(themeModeAtom)).toBe('system')
      expect(ctx.get(currentThemeAtom)).toBe(LightTheme)
    })

    test('throws error for invalid mode', async () => {
      await expect(setThemeMode(ctx, 'purple' as ThemeMode)).rejects.toThrow(
        'Invalid theme mode: purple',
      )
    })

    test('calls AsyncStorage.setItem with the mode', async () => {
      await setThemeMode(ctx, 'light')

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_mode', 'light')
    })

    test('calls Appearance.setColorScheme', async () => {
      await setThemeMode(ctx, 'light')

      expect(Appearance.setColorScheme).toHaveBeenCalledWith('light')
    })

    test('calls Appearance.setColorScheme with unspecified for system', async () => {
      await setThemeMode(ctx, 'system')

      expect(Appearance.setColorScheme).toHaveBeenCalledWith('unspecified')
    })
  })

  describe('setSystemTheme', () => {
    test('sets systemThemeAtom to light and resolves LightTheme when mode is system', () => {
      setSystemTheme(ctx, 'light')

      expect(ctx.get(systemThemeAtom)).toBe('light')
      expect(ctx.get(currentThemeAtom)).toBe(LightTheme)
    })

    test('sets systemThemeAtom to dark and resolves DarkTheme when mode is system', () => {
      setSystemTheme(ctx, 'dark')

      expect(ctx.get(systemThemeAtom)).toBe('dark')
      expect(ctx.get(currentThemeAtom)).toBe(DarkTheme)
    })

    test('respects explicit light mode over system theme', async () => {
      await setThemeMode(ctx, 'light')
      setSystemTheme(ctx, 'dark')

      expect(ctx.get(currentThemeAtom)).toBe(LightTheme)
    })

    test('respects explicit dark mode over system theme', async () => {
      await setThemeMode(ctx, 'dark')
      setSystemTheme(ctx, 'light')

      expect(ctx.get(currentThemeAtom)).toBe(DarkTheme)
    })
  })

  describe('loadThemeMode', () => {
    test('loads saved dark mode from AsyncStorage', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark')

      const result = await loadThemeMode(ctx)

      expect(result).toBe('dark')
      expect(ctx.get(themeModeAtom)).toBe('dark')
      expect(ctx.get(currentThemeAtom)).toBe(DarkTheme)
    })

    test('loads saved light mode from AsyncStorage', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('light')

      const result = await loadThemeMode(ctx)

      expect(result).toBe('light')
      expect(ctx.get(themeModeAtom)).toBe('light')
      expect(ctx.get(currentThemeAtom)).toBe(LightTheme)
    })

    test('defaults to system when AsyncStorage returns null', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await loadThemeMode(ctx)

      expect(result).toBe('system')
      expect(ctx.get(themeModeAtom)).toBe('system')
      expect(ctx.get(currentThemeAtom)).toBe(LightTheme)
    })

    test('defaults to system when AsyncStorage returns invalid value', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid_mode')

      const result = await loadThemeMode(ctx)

      expect(result).toBe('system')
      expect(ctx.get(themeModeAtom)).toBe('system')
    })

    test('updates systemThemeAtom based on Appearance', async () => {
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      await loadThemeMode(ctx)

      expect(ctx.get(systemThemeAtom)).toBe('dark')
    })

    test('calls Appearance.setColorScheme', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('light')

      await loadThemeMode(ctx)

      expect(Appearance.setColorScheme).toHaveBeenCalledWith('light')
    })

    test('returns system and sets atom on error', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage failure'))

      const result = await loadThemeMode(ctx)

      expect(result).toBe('system')
      expect(ctx.get(themeModeAtom)).toBe('system')
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('loadDynamicColors', () => {
    test('loads true from AsyncStorage', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('true')

      const result = await loadDynamicColors(ctx)

      expect(result).toBe(true)
      expect(ctx.get(dynamicColorsEnabledAtom)).toBe(true)
    })

    test('loads false from AsyncStorage', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('false')

      const result = await loadDynamicColors(ctx)

      expect(result).toBe(false)
      expect(ctx.get(dynamicColorsEnabledAtom)).toBe(false)
    })

    test('defaults to false when AsyncStorage returns null', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await loadDynamicColors(ctx)

      expect(result).toBe(false)
      expect(ctx.get(dynamicColorsEnabledAtom)).toBe(false)
    })

    test('returns false on error and logs error', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage failure'))

      const result = await loadDynamicColors(ctx)

      expect(result).toBe(false)
      expect(ctx.get(dynamicColorsEnabledAtom)).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load dynamic colors:',
        expect.any(Error),
      )
    })
  })

  describe('setDynamicColors', () => {
    test('saves to AsyncStorage and updates atom', async () => {
      await setDynamicColors(ctx, true)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('dynamic_colors', 'true')
      expect(ctx.get(dynamicColorsEnabledAtom)).toBe(true)
    })

    test('calls updateThemeBasedOnMode internally', async () => {
      await setThemeMode(ctx, 'light')
      await setDynamicColors(ctx, true)

      // buildDynamicTheme returns null on non-Android, so falls back to LightTheme
      expect(ctx.get(currentThemeAtom)).toBe(LightTheme)
    })

    test('disables dynamic colors', async () => {
      await setDynamicColors(ctx, true)
      await setDynamicColors(ctx, false)

      expect(ctx.get(dynamicColorsEnabledAtom)).toBe(false)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('dynamic_colors', 'false')
    })
  })

  describe('updateThemeBasedOnMode', () => {
    test('resolves LightTheme for light mode', async () => {
      await setThemeMode(ctx, 'light')
      // Reset currentThemeAtom to verify updateThemeBasedOnMode changes it
      currentThemeAtom(ctx, DarkTheme)

      await setThemeMode(ctx, 'light')

      expect(ctx.get(currentThemeAtom)).toBe(LightTheme)
    })

    test('resolves DarkTheme for dark mode', async () => {
      await setThemeMode(ctx, 'dark')

      expect(ctx.get(currentThemeAtom)).toBe(DarkTheme)
    })

    test('resolves based on systemThemeAtom when mode is system', async () => {
      setSystemTheme(ctx, 'dark')

      expect(ctx.get(currentThemeAtom)).toBe(DarkTheme)
    })
  })
})
