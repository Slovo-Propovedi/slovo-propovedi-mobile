import {
  BAR_CIRCLE_SIZE,
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_PILL_ROW_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  getColumnSideInset,
  TAB_BAR_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'

/**
 * Slide-down distance that tucks the pill behind the focused search row: its
 * own height plus the two outer gaps lands its top on the row's top edge. The
 * shade's pill cutout mirrors the same distance.
 */
export const MINI_PILL_TUCK_DISTANCE = PLAYER_SIZES.miniPlayerHeight + BAR_OUTER_GAP * 2

interface MiniPlayerGeometry {
  bottom: number
  height: number
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
 * and left of the search circle, bottom-aligned with the islands and grown to
 * their full height (Issue #153).
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
  // The measured row height includes the bottom safe-area padding and its fixed
  // BAR_ROW_MIN_HEIGHT content box, with the islands centered in that box. The
  // expanded pill therefore rests one pill-row gap above the expanded island's
  // top edge — visibly detached, the Apple Music floating pair (Issue #153).
  const expandedBottom = tabBarHeight - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_PILL_ROW_GAP
  // Islands are centered in the content box, so the collapsed island's bottom
  // sits (row content - island) / 2 above the content box's bottom edge.
  const collapsedBottom = tabBarHeight - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT) / 2
  const expandedLeft = rowLeft + BAR_SIDE_INSET
  const collapsedLeft = rowLeft + BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP
  const expandedWidth = rowContentWidth
  const collapsedWidth = screenWidth - collapsedLeft * 2
  // The detached pill keeps the compact mini height; folded into the row it
  // grows to the islands' height and fills its slot like the neighbours.
  const height =
    PLAYER_SIZES.miniPlayerHeight +
    (TAB_BAR_ISLAND_HEIGHT - PLAYER_SIZES.miniPlayerHeight) * progress
  const bottom = expandedBottom + (collapsedBottom - expandedBottom) * progress
  const left = expandedLeft + (collapsedLeft - expandedLeft) * progress
  const width = expandedWidth + (collapsedWidth - expandedWidth) * progress

  return {
    bottom,
    height,
    left,
    radius: height / 2,
    top: fullScreenHeight - bottom - height,
    width,
  }
}
