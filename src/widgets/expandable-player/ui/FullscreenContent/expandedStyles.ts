import type { ThemeColors } from 'shared/ui/theme'
import { expandedControlsStyles } from './expandedControlsStyles'
import { expandedDescriptionStyles } from './expandedDescriptionStyles'
import { expandedLayoutStyles } from './expandedLayoutStyles'
import { expandedTrackStyles } from './expandedTrackStyles'

export const createExpandedStyles = (_theme: ThemeColors) => ({
  ...expandedControlsStyles,
  ...expandedDescriptionStyles,
  ...expandedLayoutStyles,
  ...expandedTrackStyles,
})
