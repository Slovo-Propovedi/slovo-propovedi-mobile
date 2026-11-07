import {
  BAR_CIRCLE_SIZE,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  getColumnSideInset,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'

interface SearchIslandGeometry {
  bottom: number
  /** Right inset of the external close circle, aligned with the search circle. */
  closeRight: number
  height: number
  left: number
  radius: number
  right: number
}

interface SearchIslandGeometryInput {
  /** 0 = pill spans the whole row, 1 = pill rests right of the active-tab circle. */
  barProgress: number
  /** 0 = no external close circle, 1 = the pill yields a full circle + gap to it. */
  closeProgress?: number
  screenWidth: number
  tabBarHeight: number
}

/**
 * Resting geometry of the bottom-bar search pill.
 *
 * At rest (progress 1) the pill occupies the middle+right space of the row:
 * it starts right of the collapsed active-tab circle and ends at the row's
 * right inner edge. At progress 0 it still spans the whole row, revealed from
 * behind the tab island while the island morphs into the circle.
 *
 * Worklet-safe: called from the pill's Reanimated animated style.
 * @param input - Screen geometry and bar morph progress.
 * @param input.barProgress - 0 = island expanded, 1 = island collapsed.
 * @param input.closeProgress - 0..1 presence of the external close circle.
 * @param input.screenWidth - Current viewport width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getSearchIslandGeometry = ({
  barProgress,
  closeProgress = 0,
  screenWidth,
  tabBarHeight,
}: SearchIslandGeometryInput): SearchIslandGeometry => {
  'worklet'
  const progress = Math.min(Math.max(barProgress, 0), 1)
  const close = Math.min(Math.max(closeProgress, 0), 1)
  // The islands row is capped to the content column and centered; absolute
  // offsets must follow the column, not the raw viewport edges.
  const rowLeft = getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH)
  const rowInnerLeft = rowLeft + BAR_SIDE_INSET
  const collapsedLeft = rowInnerLeft + BAR_CIRCLE_SIZE + BAR_OUTER_GAP
  const left = rowInnerLeft + (collapsedLeft - rowInnerLeft) * progress
  // The pill follows the island height through the morph; both stay round and
  // centered on the same row axis.
  const height =
    TAB_BAR_ISLAND_HEIGHT +
    (TAB_BAR_ISLAND_HEIGHT_EXPANDED - TAB_BAR_ISLAND_HEIGHT) * (1 - progress)
  // The close circle sits at the row's right inner edge (the search circle's
  // collapsed axis); the pill shrinks leftwards by exactly circle + gap so the
  // outer gap stays constant.
  const closeSlot = (BAR_CIRCLE_SIZE + BAR_OUTER_GAP) * close

  return {
    // The row is BAR_ROW_MIN_HEIGHT tall plus the bottom safe-area padding and
    // islands are centered in it, so the pill sits on the same axis.
    bottom: tabBarHeight - (BAR_ROW_MIN_HEIGHT + height) / 2,
    closeRight: rowInnerLeft,
    height,
    left,
    radius: height / 2,
    right: rowInnerLeft + closeSlot,
  }
}
