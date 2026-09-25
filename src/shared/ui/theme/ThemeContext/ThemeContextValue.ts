import { type ThemeColors, type ThemeMode } from '../types'

export interface ThemeContextValue {
  currentTheme: ThemeColors
  isLight: boolean
  themeMode: ThemeMode
}
