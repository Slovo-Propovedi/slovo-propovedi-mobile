import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useIsSearchOpen } from 'features/sermon-search'
import {
  BAR_CIRCLE_SIZE,
  BAR_MORPH_DURATION_MS,
  BAR_OUTER_GAP,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  isBarCollapsedAtom,
} from 'shared/ui/layout'
import { getIslandStyle } from './getIslandStyle'

interface TabIslandMorphInput {
  hideSearch: boolean
  routeCount: number
  /** Row width measured via onLayout; 0 until the first layout pass. */
  rowWidth: number
  windowWidth: number
}

// Drives the island's width morph (expanded ⇄ circle). Opening search forces the
// collapsed shape even when the scroll driver has not collapsed the bar yet.
export const useTabIslandMorph = ({
  hideSearch,
  routeCount,
  rowWidth,
  windowWidth,
}: TabIslandMorphInput) => {
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const isSearchOpen = useIsSearchOpen()
  const isCollapsed = isBarCollapsed || isSearchOpen
  const progress = useSharedValue(isCollapsed ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(isCollapsed ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [isCollapsed, progress])

  const rowContentWidth =
    Math.min(rowWidth || windowWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2
  const expandedIslandWidth = Math.max(
    BAR_CIRCLE_SIZE,
    hideSearch ? rowContentWidth : rowContentWidth - BAR_CIRCLE_SIZE - BAR_OUTER_GAP,
  )

  const islandStyle = useAnimatedStyle(() =>
    getIslandStyle(progress.value, {
      collapsedWidth: BAR_CIRCLE_SIZE,
      expandedWidth: expandedIslandWidth,
    }),
  )

  return {
    expandedTabWidth: expandedIslandWidth / Math.max(routeCount, 1),
    islandStyle,
    progress,
  }
}
