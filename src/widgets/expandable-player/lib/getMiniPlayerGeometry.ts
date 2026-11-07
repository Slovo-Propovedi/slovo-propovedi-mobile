import {
  BAR_CIRCLE_SIZE,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  getColumnSideInset,
  TAB_BAR_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'

interface MiniPlayerGeometry {
  bottom: number
  left: number
  radius: number
  top: number
  width: number
}

interface MiniPlayerGeometryInput {
  /** 0 = detached pill above the tab row, 1 = pill in the collapsed bottom line. */
  barProgress: number
  fullScreenHeight: number
  screenWidth: number
  tabBarHeight: number
}

/**
 * Resting geometry of the mini-player pill at a given bar-morph progress.
 *
 * Expanded (0): a detached pill above the tab row, spanning the row's inner
 * content edges (column width minus the side insets), so its left/right edges
 * line up with the tab island and the search circle.
 * Collapsed (1): a narrower pill inside the row, right of the active-tab circle
 * and left of the search circle, bottom-aligned with the islands.
 *
 * Worklet-safe: called both from React (resting shadow-tree styles) and from
 * Reanimated animated styles.
 * @param input - Geometry inputs and morph progress.
 * @param input.barProgress - 0 = detached pill, 1 = pill in the collapsed row.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.screenWidth - Current window width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getMiniPlayerGeometry = ({
  barProgress,
  fullScreenHeight,
  screenWidth,
  tabBarHeight,
}: MiniPlayerGeometryInput): MiniPlayerGeometry => {
  'worklet'
  const progress = Math.min(Math.max(barProgress, 0), 1)
  // The islands row is capped to the content column and padded by BAR_SIDE_INSET;
  // the collapsed pill must line up with the row's inner edges on every width.
  const rowLeft = getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH)
  const rowContentWidth = Math.min(screenWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2
  // The row is BAR_ROW_MIN_HEIGHT tall plus the bottom safe-area padding; islands
  // are centered in that row, so their bottom sits (row - island) / 2 above the
  // row's bottom edge.
  const expandedBottom = tabBarHeight + BAR_OUTER_GAP
  const collapsedBottom = tabBarHeight - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT) / 2
  const expandedLeft = rowLeft + BAR_SIDE_INSET
  const collapsedLeft = rowLeft + BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP
  const expandedWidth = rowContentWidth
  const collapsedWidth = screenWidth - collapsedLeft * 2
  const bottom = expandedBottom + (collapsedBottom - expandedBottom) * progress
  const left = expandedLeft + (collapsedLeft - expandedLeft) * progress
  const width = expandedWidth + (collapsedWidth - expandedWidth) * progress

  return {
    bottom,
    left,
    radius: PLAYER_SIZES.miniPlayerHeight / 2,
    top: fullScreenHeight - bottom - PLAYER_SIZES.miniPlayerHeight,
    width,
  }
}
