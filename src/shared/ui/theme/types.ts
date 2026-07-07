export const ThemeMode = {
  Dark: 'dark',
  Light: 'light',
  System: 'system',
} as const

export interface ThemeColors {
  backdrop: string
  background: string
  card: string
  icon: string
  skeleton: string
  surface: string
  text: string
  textMuted: string
}

export type ThemedColors = {
  icon: string
  maximumTrackTintColor: string
  minimumTrackTintColor: string
} & ThemeColors

export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode]
