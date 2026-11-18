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

// The magnifier is the one always-mounted piece of the morph: it keeps one size
// throughout, so opening the pill only moves it with the travelling left edge.
const ICON_SIZE = 32

interface SearchIslandGeometry {
  bottom: number
  /** Right inset of the external close circle, aligned with the search circle. */
  closeRight: number
  height: number
  /** Distance from the container's left edge to the always-mounted magnifier. */
  iconInset: number
  /** Diameter of the magnifier, constant in every state. */
  iconSize: number
  left: number
  radius: number
  width: number
}

interface SearchIslandGeometryInput {
  /** 0 = island expanded (68 high), 1 = collapsed (56 high). */
  barProgress: number
  /** 0 = no external close circle, 1 = the pill yields a full circle + gap to it. */
  closeProgress?: number
  /** 0 = active-tab circle still shown, 1 = field focused and the pill owns the row. */
  focusProgress?: number
  /** 0 = pill coincides with the search circle, 1 = pill fills its row slot. */
  openProgress: number
  screenWidth: number
  tabBarHeight: number
}

/**
 * Geometry of the bottom-bar search pill, mirroring the tab island's morph.
 *
 * `openProgress` owns left/width: at 0 the pill is exactly the search chip
 * circle at the row's right inner edge, at 1 it fills the slot right of the
 * collapsed active-tab circle. Growing from the circle (left moves left, width
 * grows, right edge anchored) is the same motion as the island collapsing into
 * the circle, so both run off one frame-synced `BAR_MORPH_DURATION_MS` progress.
 *
 * `barProgress` owns the pill's height/radius only, keeping it on the island's
 * height through the morph.
 *
 * `focusProgress` retracts the active-tab circle: at 1 the pill stretches to the
 * row's left inner edge (still yielding the external close slot when shown).
 *
 * The always-mounted magnifier sits at `iconInset`; its constant `iconSize`
 * makes it travel with the animated edge instead of crossfading or shrinking.
 *
 * Worklet-safe: called from the morph's Reanimated animated styles.
 * @param input - Screen geometry, morph progress and focus progress.
 * @param input.barProgress - 0 = island expanded, 1 = island collapsed.
 * @param input.closeProgress - 0..1 presence of the external close circle.
 * @param input.focusProgress - 0..1 retraction of the active-tab circle.
 * @param input.openProgress - 0 = collapsed onto the search circle, 1 = full slot.
 * @param input.screenWidth - Current viewport width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getSearchIslandGeometry = ({
  barProgress,
  closeProgress = 0,
  focusProgress = 0,
  openProgress,
  screenWidth,
  tabBarHeight,
}: SearchIslandGeometryInput): SearchIslandGeometry => {
  'worklet'
  const bar = Math.min(Math.max(barProgress, 0), 1)
  const open = Math.min(Math.max(openProgress, 0), 1)
  const close = Math.min(Math.max(closeProgress, 0), 1)
  const focus = Math.min(Math.max(focusProgress, 0), 1)
  // The islands row is capped to the content column and centered; absolute
  // offsets must follow the column, not the raw viewport edges.
  const rowLeft = getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH)
  const rowInnerLeft = rowLeft + BAR_SIDE_INSET
  // Inner row width: the span the expanded island/search pill can occupy.
  const rowInnerWidth = Math.min(screenWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2
  // The pill follows the island height through the morph; both share the row's
  // bottom line. Collapsed it is the bar state's search chip, so the closed
  // diameter matches the island height (68 when expanded, 56 when collapsed).
  const height =
    TAB_BAR_ISLAND_HEIGHT + (TAB_BAR_ISLAND_HEIGHT_EXPANDED - TAB_BAR_ISLAND_HEIGHT) * (1 - bar)
  // The pill grows out of the search chip: a circle pinned to the row's right
  // inner edge, expanding leftwards into the slot right of the active-tab circle.
  const circleLeft = rowInnerLeft + rowInnerWidth - height
  // The active-tab circle fades out of the layout as the field gains focus, so
  // the pill's left target travels all the way to the row's inner edge.
  const tabSlot = (BAR_CIRCLE_SIZE + BAR_OUTER_GAP) * (1 - focus)
  const slotLeft = rowInnerLeft + tabSlot
  const left = circleLeft + (slotLeft - circleLeft) * open
  // The close circle sits at the same right inner edge; the pill shrinks
  // leftwards by exactly circle + gap so the outer gap stays constant. Weighted
  // by `open` so a closing pill never drifts away from the search chip.
  const closeSlot = (BAR_CIRCLE_SIZE + BAR_OUTER_GAP) * close * open
  const openWidth = rowInnerWidth - tabSlot - closeSlot
  const width = height + (openWidth - height) * open
  // The icon is the first child of the morphing frame, so its inset defines how
  // far it travels with the moving left edge. Closed it is centred in the
  // circle (whose diameter follows the bar morph); open it keeps the pill's
  // compact 8dp inset. The glyph never changes size, so it stays crisp.
  const iconSize = ICON_SIZE
  const circleIconInset = (height - iconSize) / 2
  const iconInset = INDENTS.low + (circleIconInset - INDENTS.low) * (1 - open)

  return {
    // The islands are anchored to the row content box's bottom edge (the
    // padding line), so the pill shares that same bottom line.
    bottom: tabBarHeight - BAR_ROW_MIN_HEIGHT,
    closeRight: rowInnerLeft,
    height,
    iconInset,
    iconSize,
    left,
    radius: height / 2,
    width,
  }
}
