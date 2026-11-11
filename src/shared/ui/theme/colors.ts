import { type Ctx } from '@reatom/framework'
import { currentThemeAtom } from './model'

const STATIC_COLORS = {
  black: '#000',
  black70: '#000000b3',
  blue: 'blue',
  disabled: '#d3d3d3',
  error: '#ff3b30',
  gray: '#808080',
  primary: '#f16031',
  // Полупрозрачный слой буфера/загрузки поверх трека плеера.
  progressBuffered: 'rgba(255,255,255,0.35)',
  white: '#fff',
} as const

interface MutableColorSlots {
  backdrop: string
  background: string
  card: string
  icon: string
  maximumTrackTintColor: string
  minimumTrackTintColor: string
  onPrimary: string
  primary: string
  skeleton: string
  surface: string
  text: string
  textMuted: string
}

type StaticColorsOnly = Omit<typeof STATIC_COLORS, keyof MutableColorSlots>

export const COLORS = {
  ...STATIC_COLORS,
} as MutableColorSlots & StaticColorsOnly

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

  Object.assign(COLORS, {
    ...newTheme,
    icon: newTheme.text,
    maximumTrackTintColor: 'rgba(128, 128, 128, 0.6)',
    minimumTrackTintColor: 'rgba(128, 128, 128, 0.4)',
  })
}
