import { DarkTheme, DefaultTheme } from 'expo-router/react-navigation'
import { buildNavigationTheme } from './navigationTheme'
import { type ThemeColors } from './types'

const darkAppTheme: ThemeColors = {
  backdrop: '#0a0a0a',
  background: '#000000',
  card: '#161616',
  icon: '#eeeeee',
  onPrimary: '#ffffff',
  placeholder: '#555555',
  primary: '#f16031',
  skeleton: '#222222',
  surface: '#101010',
  text: '#fafafa',
  textMuted: '#999999',
}

const lightAppTheme: ThemeColors = {
  backdrop: '#f5f5f5',
  background: '#ffffff',
  card: '#fdfdfd',
  icon: '#111111',
  onPrimary: '#ffffff',
  placeholder: '#aaaaaa',
  primary: '#f16031',
  skeleton: '#eeeeee',
  surface: '#f8f8f8',
  text: '#111111',
  textMuted: '#666666',
}

describe('buildNavigationTheme', () => {
  test('returns dark navigation theme from app dark theme', () => {
    const theme = buildNavigationTheme(false, darkAppTheme)

    expect(theme.dark).toBe(true)
    expect(theme.colors.background).toBe(darkAppTheme.background)
    expect(theme.colors.primary).toBe(darkAppTheme.primary)
    expect(theme.colors.card).toBe(darkAppTheme.card)
    expect(theme.colors.text).toBe(darkAppTheme.text)
    expect(theme.colors.border).toBe(darkAppTheme.textMuted)
    expect(theme.colors.notification).toBe(darkAppTheme.primary)
    expect(theme.fonts).toEqual(DarkTheme.fonts)
  })

  test('returns light navigation theme from app light theme', () => {
    const theme = buildNavigationTheme(true, lightAppTheme)

    expect(theme.dark).toBe(false)
    expect(theme.colors.background).toBe(lightAppTheme.background)
    expect(theme.fonts).toEqual(DefaultTheme.fonts)
  })
})
