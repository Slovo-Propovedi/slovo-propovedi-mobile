import { Color } from 'expo-router'
import { Appearance, type ColorValue, Platform } from 'react-native'
import { type ThemeColors } from './types'

export const LightTheme = {
  backdrop: 'rgba(0, 0, 0, 0.5)',
  background: '#fff',
  card: '#f5f5f5',
  icon: '#000',
  onPrimary: '#fff',
  // Dimmer than textMuted (#666) so placeholders read as hints, not real values.
  placeholder: '#aaa',
  primary: '#f16031',
  skeleton: '#e0e0e0',
  surface: '#e8e8e8',
  text: '#000',
  textMuted: '#666',
} as const satisfies ThemeColors

export const DarkTheme = {
  backdrop: 'rgba(0, 0, 0, 0.8)',
  background: '#000',
  card: '#151515',
  icon: '#fff',
  onPrimary: '#000',
  // Dimmer than textMuted (#9ca3af) so placeholders read as hints, not real values.
  placeholder: '#5c636e',
  primary: '#f16031',
  skeleton: '#333333',
  surface: '#252525',
  text: '#fff',
  textMuted: '#9ca3af',
} as const satisfies ThemeColors

// Dynamic Material You colors are native strings when available; anything else
// (null on an unavailable pocket of the API, a non-string platform value) falls
// back to the static palette so every theme slot stays a concrete color.
const resolveDynamicColor = (value: ColorValue, fallback: string): string =>
  typeof value === 'string' ? value : fallback

// Returns Material You dynamic theme, or null when unsupported (iOS / Android <12).
// Lazily accesses Color.android so the iOS bundle never touches it.
export const buildDynamicTheme = (): null | ThemeColors => {
  if (Platform.OS !== 'android') return null

  const fallback = Appearance.getColorScheme() === 'light' ? LightTheme : DarkTheme

  return {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    background: resolveDynamicColor(Color.android.dynamic.background, fallback.background),
    card: resolveDynamicColor(Color.android.dynamic.surfaceContainerHighest, fallback.card),
    icon: resolveDynamicColor(Color.android.dynamic.onSurface, fallback.icon),
    onPrimary: resolveDynamicColor(Color.android.dynamic.onPrimary, fallback.onPrimary),
    placeholder: resolveDynamicColor(Color.android.dynamic.onSurfaceVariant, fallback.placeholder),
    primary: resolveDynamicColor(Color.android.dynamic.primary, fallback.primary),
    skeleton: resolveDynamicColor(Color.android.dynamic.surfaceVariant, fallback.skeleton),
    surface: resolveDynamicColor(Color.android.dynamic.surfaceContainerHigh, fallback.surface),
    text: resolveDynamicColor(Color.android.dynamic.onSurface, fallback.text),
    textMuted: resolveDynamicColor(Color.android.dynamic.onSurfaceVariant, fallback.textMuted),
  }
}

export const getTheme = (mode: string, systemTheme: 'dark' | 'light'): ThemeColors => {
  if (mode === 'system') return systemTheme === 'light' ? LightTheme : DarkTheme

  return mode === 'light' ? LightTheme : DarkTheme
}
