import { type ColorValue } from 'react-native'

export const ThemeMode = {
  Dark: 'dark',
  Light: 'light',
  System: 'system',
} as const

export interface ThemeColors {
  backdrop: ColorValue
  background: ColorValue
  card: ColorValue
  icon: ColorValue
  primary: ColorValue
  skeleton: ColorValue
  surface: ColorValue
  text: ColorValue
  textMuted: ColorValue
}

export type ThemedColors = {
  icon: ColorValue
  maximumTrackTintColor: ColorValue
  minimumTrackTintColor: ColorValue
} & ThemeColors

export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode]
