import { Platform } from 'react-native'
import { buildDynamicTheme, DarkTheme, getTheme, LightTheme } from './constants'

const THEME_KEYS = [
  'backdrop',
  'background',
  'card',
  'icon',
  'primary',
  'skeleton',
  'surface',
  'text',
  'textMuted',
] as const

describe('getTheme', () => {
  test('returns LightTheme when mode is "light"', () => {
    expect(getTheme('light', 'dark')).toBe(LightTheme)
    expect(getTheme('light', 'light')).toBe(LightTheme)
  })

  test('returns DarkTheme when mode is "dark"', () => {
    expect(getTheme('dark', 'light')).toBe(DarkTheme)
    expect(getTheme('dark', 'dark')).toBe(DarkTheme)
  })

  test('returns LightTheme when mode is "system" and systemTheme is "light"', () => {
    expect(getTheme('system', 'light')).toBe(LightTheme)
  })

  test('returns DarkTheme when mode is "system" and systemTheme is "dark"', () => {
    expect(getTheme('system', 'dark')).toBe(DarkTheme)
  })

  test('returns DarkTheme when mode is an unknown string', () => {
    expect(getTheme('purple', 'light')).toBe(DarkTheme)
    expect(getTheme('', 'light')).toBe(DarkTheme)
  })

  test('returns the exact same object reference as LightTheme/DarkTheme', () => {
    const fromLight = getTheme('light', 'dark')
    const fromDark = getTheme('dark', 'light')

    expect(fromLight).toBe(LightTheme)
    expect(fromDark).toBe(DarkTheme)
  })
})

describe('buildDynamicTheme', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns null on iOS', () => {
    jest.replaceProperty(Platform, 'OS', 'ios')
    expect(buildDynamicTheme()).toBeNull()
  })

  test('returns null on web', () => {
    jest.replaceProperty(Platform, 'OS', 'web')
    expect(buildDynamicTheme()).toBeNull()
  })
})

describe('theme constants', () => {
  test('LightTheme has all ThemeColors keys', () => {
    THEME_KEYS.forEach(key => {
      expect(LightTheme).toHaveProperty(key)
    })
  })

  test('DarkTheme has all ThemeColors keys', () => {
    THEME_KEYS.forEach(key => {
      expect(DarkTheme).toHaveProperty(key)
    })
  })

  test('LightTheme and DarkTheme share the same primary color', () => {
    expect(LightTheme.primary).toBe(DarkTheme.primary)
    expect(LightTheme.primary).toBe('#f16031')
  })
})
