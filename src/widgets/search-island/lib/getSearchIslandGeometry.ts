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
  width: number
}

interface SearchIslandGeometryInput {
  /** 0 = island expanded (76 high), 1 = collapsed (64 high). */
  barProgress: number
  /** 0 = no external close circle, 1 = the pill yields a full circle + gap to it. */
  closeProgress?: number
  /** 0 = pill coincides with the search circle, 1 = pill fills its row slot. */
  openProgress: number
  screenWidth: number
  tabBarHeight: number
}

/**
 * Geometry of the bottom-bar search pill, mirroring the tab island's morph.
 *
 * `openProgress` owns left/width: at 0 the pill is exactly the search chip
 * circle at the row's right inner edge, at 1 it fills the slot between the
 * collapsed active-tab circle and that edge. Growing from the circle (left
 * moves left, width grows, right edge anchored) is the same motion as the
 * island collapsing into the circle, so both run off one frame-synced
 * `BAR_MORPH_DURATION_MS` progress.
 *
 * `barProgress` only owns vertical geometry (height/radius/bottom), so the pill
 * keeps matching the island height through the morph.
 *
 * Worklet-safe: called from the pill's Reanimated animated style.
 * @param input - Screen geometry, open progress and bar morph progress.
 * @param input.barProgress - 0 = island expanded, 1 = island collapsed.
 * @param input.closeProgress - 0..1 presence of the external close circle.
 * @param input.openProgress - 0 = collapsed onto the search circle, 1 = full slot.
 * @param input.screenWidth - Current viewport width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getSearchIslandGeometry = ({
  barProgress,
  closeProgress = 0,
  openProgress,
  screenWidth,
  tabBarHeight,
}: SearchIslandGeometryInput): SearchIslandGeometry => {
  'worklet'
  const bar = Math.min(Math.max(barProgress, 0), 1)
  const open = Math.min(Math.max(openProgress, 0), 1)
  const close = Math.min(Math.max(closeProgress, 0), 1)
  // The islands row is capped to the content column and centered; absolute
  // offsets must follow the column, not the raw viewport edges.
  const rowLeft = getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH)
  const rowInnerLeft = rowLeft + BAR_SIDE_INSET
  // Inner row width: the span the expanded island/search pill can occupy.
  const rowInnerWidth = Math.min(screenWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2
  // The pill follows the island height through the morph; both stay round and
  // centered on the same row axis. Collapsed (openProgress 0) the pill is
  // exactly the search chip at the current bar state, so the closed diameter
  // matches the island height (76 when expanded, 64 when collapsed).
  const height =
    TAB_BAR_ISLAND_HEIGHT + (TAB_BAR_ISLAND_HEIGHT_EXPANDED - TAB_BAR_ISLAND_HEIGHT) * (1 - bar)
  // The pill grows out of the search chip: a circle pinned to the row's right
  // inner edge, expanding leftwards into the slot right of the active-tab circle.
  const circleLeft = rowInnerLeft + rowInnerWidth - height
  const slotLeft = rowInnerLeft + BAR_CIRCLE_SIZE + BAR_OUTER_GAP
  const left = circleLeft + (slotLeft - circleLeft) * open
  // The close circle sits at the same right inner edge; the pill shrinks
  // leftwards by exactly circle + gap so the outer gap stays constant. Weighted
  // by `open` so a closing pill never drifts away from the search chip.
  const closeSlot = (BAR_CIRCLE_SIZE + BAR_OUTER_GAP) * close * open
  const openWidth = rowInnerWidth - BAR_CIRCLE_SIZE - BAR_OUTER_GAP - closeSlot
  const width = height + (openWidth - height) * open

  return {
    // The row is BAR_ROW_MIN_HEIGHT tall plus the bottom safe-area padding and
    // islands are centered in it, so the pill sits on the same axis.
    bottom: tabBarHeight - (BAR_ROW_MIN_HEIGHT + height) / 2,
    closeRight: rowInnerLeft,
    height,
    left,
    radius: height / 2,
    width,
  }
}
