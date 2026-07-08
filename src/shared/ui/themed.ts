import { ctx } from '../lib/reatom-ctx/ctx'
import {
  initializeCOLORS,
  COLORS as THEME_COLORS,
  updateCOLORS as updateThemeColors,
} from './theme/colors'

// Initialize theme colors on module load
initializeCOLORS(ctx)

export const COLORS = THEME_COLORS

export const updateCOLORS = () => {
  updateThemeColors(ctx)
}

export const FONT_SIZES = {
  base: 14,
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 15,
  h5: 10,
  lg: 18,
  md: 16,
  sm: 12,
  xl: 20,
  xs: 10,
  xxl: 24,
  xxxl: 30,
} as const

export const SCREEN_PADDING = {
  horizontal: 16,
  vertical: 12,
} as const

export const PLAYER_SIZES = {
  albumArtLarge: '45%',
  albumArtMini: 40,
  controlButtonSize: FONT_SIZES.xxl,
  miniPlayerHeight: 60,
  progressThumbSize: 12,
  tabBarHeight: 78,
} as const

export const RADIUSES = {
  high: 16,
  large: 20,
  low: 8,
  middle: 12,
  round: 999,
} as const

export const INDENTS = {
  high: 24,
  highest: 32,
  low: 8,
  lowest: 4,
  medium: 16,
  middle: 12,
} as const

export { useTheme } from './theme'
