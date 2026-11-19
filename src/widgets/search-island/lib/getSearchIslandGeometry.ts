import {
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  CONTENT_COLUMN_WIDTH,
  getBarSideInset,
  getColumnSideInset,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { INDENTS } from 'shared/ui/theme'
import {
  type SearchIslandGeometry,
  type SearchIslandGeometryInput,
} from './getSearchIslandGeometry.types'

// The magnifier is the one always-mounted piece of the morph: it keeps one size
// throughout, so opening the pill only moves it with the travelling left edge.
const ICON_SIZE = 32

/**
 * Geometry of the bottom-bar search pill, mirroring the tab island's morph.
 *
 * `openProgress` owns left/width: at 0 the pill is exactly the search chip
 * circle at the row's right inner edge, at 1 it fills the slot right of the
 * collapsed active-tab circle. Growing from the circle (left moves left, width
 * grows, right edge anchored) is the same motion as the island collapsing into
 * the circle, so both run off one frame-synced `BAR_MORPH_DURATION_MS` progress.
 *
 * `oneLineProgress` owns the closed pill's height/radius: the closed chip is the
 * compact circle (48) only when the bar is one-line, and stays 68 while the bar
 * is expanded. `openProgress` lifts that height to the expanded bar height, so
 * an open field is always 68 — and a field opening from the expanded bar never
 * dips to the compact size on its first frames.
 *
 * `focusProgress` retracts the active-tab circle: at 1 the pill stretches to the
 * row's left inner edge (still yielding the external close slot when shown).
 *
 * The always-mounted magnifier sits at `iconInset`; its constant `iconSize`
 * makes it travel with the animated edge instead of crossfading or shrinking.
 *
 * Worklet-safe: called from the morph's Reanimated animated styles.
 * @param input - Screen geometry, morph progress and focus progress.
 * @param input.closeProgress - 0..1 presence of the external close circle.
 * @param input.focusProgress - 0..1 retraction of the active-tab circle.
 * @param input.oneLineProgress - 0 = expanded bar, 1 = one-line bar (morphs the height and the outer inset).
 * @param input.openProgress - 0 = collapsed onto the search circle, 1 = full slot.
 * @param input.screenWidth - Current viewport width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getSearchIslandGeometry = ({
  closeProgress = 0,
  focusProgress = 0,
  oneLineProgress,
  openProgress,
  screenWidth,
  tabBarHeight,
}: SearchIslandGeometryInput): SearchIslandGeometry => {
  'worklet'
  const open = Math.min(Math.max(openProgress, 0), 1)
  const close = Math.min(Math.max(closeProgress, 0), 1)
  const focus = Math.min(Math.max(focusProgress, 0), 1)
  const oneLine = Math.min(Math.max(oneLineProgress, 0), 1)
  // The islands row is capped to the content column and centered; absolute
  // offsets must follow the column, not the raw viewport edges. The outer side
  // inset morphs with the one-line state of the bar, not with the island axis:
  // an open field always sits on the expanded inset.
  const sideInset = getBarSideInset(oneLine)
  const rowLeft = getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH)
  const rowInnerLeft = rowLeft + sideInset
  // Inner row width: the span the expanded island/search pill can occupy.
  const rowInnerWidth = Math.min(screenWidth, CONTENT_COLUMN_WIDTH) - sideInset * 2
  // The closed pill is the bar state's search chip: the compact 48 circle only
  // in the one-line row, the expanded 68 otherwise. It must follow the one-line
  // axis rather than the island's shape axis, because opening the field also
  // collapses the island shape — binding the height to that shape would shrink
  // the chip 68 -> 48 for the first frames of every unfold.
  const closedHeight =
    TAB_BAR_ISLAND_HEIGHT + (TAB_BAR_ISLAND_HEIGHT_EXPANDED - TAB_BAR_ISLAND_HEIGHT) * (1 - oneLine)
  const height = closedHeight + (TAB_BAR_ISLAND_HEIGHT_EXPANDED - closedHeight) * open
  // The pill grows out of the search chip: a circle pinned to the row's right
  // inner edge, expanding leftwards into the slot right of the active-tab circle.
  // The anchor uses the CLOSED diameter, so left/width stay linear in the open
  // progress (the growing field must not feed its mid-morph height back into its
  // own anchor); at open 0 it is exactly the search circle.
  const circleLeft = rowInnerLeft + rowInnerWidth - closedHeight
  // The active-tab circle fades out of the layout as the field gains focus, so
  // the pill's left target travels all the way to the row's inner edge. While
  // the field is open, the island beside it is always the expanded-height circle
  // (68), so the slot clears that circle and its outer gap.
  const tabSlot = (TAB_BAR_ISLAND_HEIGHT_EXPANDED + BAR_OUTER_GAP) * (1 - focus)
  const slotLeft = rowInnerLeft + tabSlot
  const left = circleLeft + (slotLeft - circleLeft) * open
  // The close circle sits at the same right inner edge; the pill shrinks
  // leftwards by exactly circle + gap so the outer gap stays constant. Its
  // diameter is the open field's height, so it yields the expanded-height circle
  // (68 + gap), never the compact constant. Weighted by `open` so a closing pill
  // never drifts away from the search chip.
  const closeSlot = (TAB_BAR_ISLAND_HEIGHT_EXPANDED + BAR_OUTER_GAP) * close * open
  const openWidth = rowInnerWidth - tabSlot - closeSlot
  const width = closedHeight + (openWidth - closedHeight) * open
  // The icon is the first child of the morphing frame, so its inset defines how
  // far it travels with the moving left edge. Closed it is centred in the
  // circle (whose diameter follows the one-line axis); open it keeps the pill's
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
