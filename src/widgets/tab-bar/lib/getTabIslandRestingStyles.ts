import { TAB_BAR_ISLAND_HEIGHT, TAB_BAR_ISLAND_HEIGHT_EXPANDED } from 'shared/ui/layout'
import { getIslandContentStyle } from './getBarMorphStyles'
import { getIslandStyle } from './getIslandStyle'

interface TabIslandRestingInput {
  collapsedWidth: number
  expandedWidth: number
  isCollapsed: boolean
}

// Non-animated resting geometry of the tab island for the current settled bar
// state. Committed through the React shadow tree as the LAST style after the
// animated island style: the theme remount key on GlassSurface re-applies the
// host's shadow-tree props, and Reanimated commits only first-render animated
// values there — without this layer a collapsed island reverts to the expanded
// launch geometry on a system theme flip (same mechanism as Issue #63; see
// expandable-player getRestingContainerStyle). At rest both layers agree.
export const getTabIslandRestingStyles = ({
  collapsedWidth,
  expandedWidth,
  isCollapsed,
}: TabIslandRestingInput) => {
  const settledProgress = isCollapsed ? 1 : 0

  return {
    content: getIslandContentStyle(settledProgress),
    island: getIslandStyle(settledProgress, {
      collapsedHeight: TAB_BAR_ISLAND_HEIGHT,
      collapsedWidth,
      expandedHeight: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      expandedWidth,
    }),
  }
}
