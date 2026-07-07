import type { ThemeColors, ThemeMode } from '../types'

export interface ThemeContextValue {
  currentTheme: ThemeColors
  isLight: boolean
  themeMode: ThemeMode
}
