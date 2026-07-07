import type { Ctx } from '@reatom/framework'
import { currentThemeAtom } from './model'

const STATIC_COLORS = {
  black: '#000',
  black70: '#000000b3',
  blue: 'blue',
  disabled: '#d3d3d3',
  error: '#ff3b30',
  gray: '#808080',
  onPrimary: '#fff',
  primary: '#f16031',
  skeleton: '#333333',
  tabBarActive: '#f16031',
  tabBarBackground: 'rgba(0, 0, 0, 0.8)',
  tabBarInactive: '#9ca3af',
  white: '#fff',
} as const

export const COLORS = {
  ...STATIC_COLORS,
} as {
  backdrop: string
  background: string
  card: string
  icon: string
  maximumTrackTintColor: string
  minimumTrackTintColor: string
  surface: string
  text: string
  textMuted: string
} & typeof STATIC_COLORS

export const initializeCOLORS = (ctx: Ctx) => {
  const initialTheme = ctx.get(currentThemeAtom)
  Object.assign(COLORS, {
    ...initialTheme,
    icon: initialTheme.text,
    maximumTrackTintColor: 'rgba(128, 128, 128, 0.4)',
    minimumTrackTintColor: 'rgba(128, 128, 128, 0.6)',
  })
}

export const updateCOLORS = (ctx: Ctx) => {
  const newTheme = ctx.get(currentThemeAtom)
  if (newTheme.background !== COLORS.background || newTheme.text !== COLORS.text)
    Object.assign(COLORS, {
      ...newTheme,
      icon: newTheme.text,
      maximumTrackTintColor: 'rgba(128, 128, 128, 0.6)',
      minimumTrackTintColor: 'rgba(128, 128, 128, 0.4)',
    })
}
