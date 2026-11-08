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
import { INDENTS } from 'shared/ui/theme'

// The magnifier is the one always-mounted piece of the morph: it is centred in
// the closed circle and shrinks into the pill's left inset as the field opens.
const ICON_SIZE_CIRCLE = 32
const ICON_SIZE_PILL = 22

interface SearchIslandGeometry {
  bottom: number
  /** Right inset of the external close circle, aligned with the search circle. */
  closeRight: number
  height: number
  /** Distance from the container's left edge to the always-mounted magnifier. */
  iconInset: number
  /** Diameter of the magnifier, interpolated between circle and pill. */
  iconSize: number
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
 * The always-mounted magnifier is anchored to the frame's left edge at
 * `iconInset`; its `iconSize` shrinks from the circle size to the pill size, so
 * it travels with the animated edge instead of crossfading.
 *
 * Worklet-safe: called from the morph's Reanimated animated styles.
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
  // The icon is the first child of the morphing frame, so its inset defines how
  // far it travels with the moving left edge. Closed it is centred in the
  // circle (whose diameter follows the bar morph); open it keeps the pill's
  // compact 8dp inset. Interpolating both keeps the glyph centred at every
  // resting size instead of drifting off-centre when the bar is expanded.
  const iconSize = ICON_SIZE_PILL + (ICON_SIZE_CIRCLE - ICON_SIZE_PILL) * (1 - open)
  const circleIconInset = (height - iconSize) / 2
  const iconInset = INDENTS.low + (circleIconInset - INDENTS.low) * (1 - open)

  return {
    // The row is BAR_ROW_MIN_HEIGHT tall plus the bottom safe-area padding and
    // islands are centered in it, so the pill sits on the same axis.
    bottom: tabBarHeight - (BAR_ROW_MIN_HEIGHT + height) / 2,
    closeRight: rowInnerLeft,
    height,
    iconInset,
    iconSize,
    left,
    radius: height / 2,
    width,
  }
}
