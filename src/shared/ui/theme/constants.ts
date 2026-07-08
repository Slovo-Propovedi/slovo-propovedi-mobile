import { Color } from 'expo-router'
import { Platform } from 'react-native'
import { type ColorValue } from 'react-native'
import { type ThemeColors } from './types'

export const LightTheme = {
  backdrop: 'rgba(0, 0, 0, 0.5)' as ColorValue,
  background: '#fff' as ColorValue,
  card: '#f5f5f5' as ColorValue,
  icon: '#000' as ColorValue,
  primary: '#f16031' as ColorValue,
  skeleton: '#e0e0e0' as ColorValue,
  surface: '#e8e8e8' as ColorValue,
  text: '#000' as ColorValue,
  textMuted: '#666' as ColorValue,
} as const satisfies ThemeColors

export const DarkTheme = {
  backdrop: 'rgba(0, 0, 0, 0.8)' as ColorValue,
  background: '#000' as ColorValue,
  card: '#151515' as ColorValue,
  icon: '#fff' as ColorValue,
  primary: '#f16031' as ColorValue,
  skeleton: '#333333' as ColorValue,
  surface: '#252525' as ColorValue,
  text: '#fff' as ColorValue,
  textMuted: '#9ca3af' as ColorValue,
} as const satisfies ThemeColors

// Returns Material You dynamic theme, or null when unsupported (iOS / Android <12).
// Lazily accesses Color.android so the iOS bundle never touches it.
export const buildDynamicTheme = (): null | ThemeColors => {
  if (Platform.OS !== 'android') return null

  return {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    background: Color.android.dynamic.background,
    card: Color.android.dynamic.surfaceContainerHighest,
    icon: Color.android.dynamic.onSurface,
    primary: Color.android.dynamic.primary,
    skeleton: Color.android.dynamic.surfaceVariant,
    surface: Color.android.dynamic.surfaceContainerHigh,
    text: Color.android.dynamic.onSurface,
    textMuted: Color.android.dynamic.onSurfaceVariant,
  }
}

export const getTheme = (mode: string, systemTheme: 'dark' | 'light'): ThemeColors => {
  if (mode === 'system') return systemTheme === 'light' ? LightTheme : DarkTheme

  return mode === 'light' ? LightTheme : DarkTheme
}
