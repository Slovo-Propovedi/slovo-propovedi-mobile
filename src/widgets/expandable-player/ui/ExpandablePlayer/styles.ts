import type { ThemeColors } from 'shared/ui/theme'
import { createExpandedStyles } from '../FullscreenContent/expandedStyles'
import { createCommonStyles } from './commonStyles'

export const createStyles = (theme: ThemeColors) => ({
  ...createCommonStyles(theme),
  ...createExpandedStyles(theme),
})
