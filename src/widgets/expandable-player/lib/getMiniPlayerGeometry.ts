import {
  BAR_CIRCLE_SIZE,
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_PILL_ROW_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET_EXPANDED,
  CONTENT_COLUMN_WIDTH,
  getBarSideInset,
  getColumnSideInset,
  getWideChromeWidth,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'

/**
 * Slide-down distance that tucks the pill behind the focused search row: its
 * own height plus the two outer gaps hides it fully behind the row.
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
  /**
   * Wide layout (>= 768 wide and >= 600 shortest side). The tab island lives at
   * the top, so the pill is the only bottom chrome: it rests on the chrome's
   * bottom padding below the content column and is always in the expanded pose.
   */
  isWideLayout?: boolean
  screenWidth: number
  tabBarHeight: number
  /** The chrome's bottom padding (`useBarBottomPadding`) — the wide pill's rest line. */
  wideBottomInset: number
}

/**
 * Resting geometry of the mini-player pill at a given bar-morph progress.
 *
 * Compact — expanded (0): a detached pill above the tab row, spanning the row's
 * inner content edges (column width minus the side insets), so its left/right
 * edges line up with the tab island and the search circle. Collapsed (1): a
 * narrower pill inside the row, right of the active-tab circle and left of the
 * search circle, bottom-aligned with the islands. The pill never grows: the
 * one-line row is uniform at the mini player height.
 *
 * Wide — no tab row at the bottom (the island is anchored to the top), so the
 * pill rests on the chrome's bottom padding (`wideBottomInset`) and spans the top
 * island's content column. The one-line morph does not exist there: the expanded
 * pose is forced and `tabBarHeight` is ignored.
 *
 * Worklet-safe: called from React resting styles and Reanimated animated styles.
 * @param input - Geometry inputs and morph progress.
 * @param input.barProgress - 0 = detached pill, 1 = pill in the collapsed row.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.isWideLayout - Whether the wide layout applies.
 * @param input.screenWidth - Current window width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 * @param input.wideBottomInset - The chrome's bottom padding, the wide pill's rest line.
 */
export const getMiniPlayerGeometry = ({
  barProgress,
  fullScreenHeight,
  isWideLayout = false,
  screenWidth,
  tabBarHeight,
  wideBottomInset,
}: MiniPlayerGeometryInput): MiniPlayerGeometry => {
  'worklet'
  const height = PLAYER_SIZES.miniPlayerHeight
  const rowLeft = getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH)
  const rowContentWidth = Math.min(screenWidth, CONTENT_COLUMN_WIDTH)

  if (isWideLayout) {
    // The pill is the only bottom chrome: it sits on the same bottom padding as
    // the chrome and lines up with the top island's column.
    const bottom = wideBottomInset

    return {
      bottom,
      height,
      left: rowLeft + BAR_SIDE_INSET_EXPANDED,
      radius: height / 2,
      top: fullScreenHeight - bottom - height,
      width: getWideChromeWidth(screenWidth),
    }
  }

  const progress = Math.min(Math.max(barProgress, 0), 1)
  // The islands row is capped to the content column and padded by the side
  // inset, which morphs with the one-line state of the bar; the pill must line
  // up with the row's inner edges on every width and in every bar state.
  const sideInset = getBarSideInset(progress)
  const contentWidth = rowContentWidth - sideInset * 2
  // The measured row height includes the bottom safe-area padding and its fixed
  // BAR_ROW_MIN_HEIGHT content box, with the islands anchored to the box's
  // bottom edge (the safe-area line). The expanded pill therefore rests one
  // pill-row gap above the expanded island's top edge — visibly detached, the
  // Apple Music floating pair (Issue #153).
  const expandedBottom = tabBarHeight - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_PILL_ROW_GAP
  // The collapsed pill joins the islands on the row's bottom edge.
  const collapsedBottom = tabBarHeight - BAR_ROW_MIN_HEIGHT
  const expandedLeft = rowLeft + sideInset
  const collapsedLeft = rowLeft + sideInset + BAR_CIRCLE_SIZE + BAR_OUTER_GAP
  const expandedWidth = contentWidth
  const collapsedWidth = screenWidth - collapsedLeft * 2
  // The pill keeps the compact mini height in every bar state: folded into the
  // row it fills the uniform one-line slot without growing.
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
