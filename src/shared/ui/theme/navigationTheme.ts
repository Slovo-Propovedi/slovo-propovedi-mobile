import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation'
import { type ThemeColors } from './types'

/**
 * Expo-router SDK 58 vendors its own react-navigation fork with its own ThemeContext.
 * Without a provided theme every scene's Background element (elements/Screen.js) and the
 * stack container paint the fork's light DefaultTheme rgb(242,242,242). On stack pops the
 * re-attaching screen exposes that light layer behind the translucent glass islands for a
 * frame — a white flash in dark theme. This factory derives the fork's Theme from the app.
 * Border/notification are not visible here (custom chrome, explicit headerStyle/contentStyle)
 * and are mapped to muted slots.
 * @param isLight - Whether the app light theme is active.
 * @param theme - App theme colors.
 */
export const buildNavigationTheme = (isLight: boolean, theme: ThemeColors): Theme => {
  const base = isLight ? DefaultTheme : DarkTheme

  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.background,
      border: theme.textMuted,
      card: theme.card,
      notification: theme.primary,
      primary: theme.primary,
      text: theme.text,
    },
    dark: !isLight,
  }
}
