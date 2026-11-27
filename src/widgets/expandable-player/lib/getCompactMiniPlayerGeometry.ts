import {
  BAR_CIRCLE_SIZE,
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_PILL_ROW_GAP,
  BAR_ROW_MIN_HEIGHT,
  getBarSideInset,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { type MiniPlayerGeometry } from './getMiniPlayerGeometry.types'

interface CompactMiniPlayerGeometryInput {
  /** 0 = detached pill above the tab row, 1 = pill in the collapsed bottom line. */
  barProgress: number
  /** Chrome column the pill is sized in (the layout base, capped by the content column). */
  columnWidth: number
  fullScreenHeight: number
  /** Left offset of that column inside the LIVE window (its centring inset). */
  rowLeft: number
  tabBarHeight: number
}

/**
 * Compact resting geometry of the mini pill at a given bar-morph progress.
 *
 * Expanded (0): a detached pill above the tab row, spanning the row's inner
 * content edges (column width minus the side insets), so its left/right edges
 * line up with the tab island and the search circle. Collapsed (1): a narrower
 * pill inside the row, right of the active-tab circle and left of the search
 * circle, bottom-aligned with the islands. The pill never grows: the one-line
 * row is uniform at the mini player height.
 *
 * Worklet-safe: called from React resting styles and Reanimated animated styles.
 * @param input - Morph progress, the chrome column and the row height.
 * @param input.barProgress - 0 = detached pill, 1 = pill in the collapsed row.
 * @param input.columnWidth - Width the pill is sized in.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.rowLeft - Left offset of the column inside the live window.
 * @param input.tabBarHeight - Height of the floating tab row, derived from its content box plus the chrome's bottom padding.
 */
export const getCompactMiniPlayerGeometry = ({
  barProgress,
  columnWidth,
  fullScreenHeight,
  rowLeft,
  tabBarHeight,
}: CompactMiniPlayerGeometryInput): MiniPlayerGeometry => {
  'worklet'
  const height = PLAYER_SIZES.miniPlayerHeight
  const progress = Math.min(Math.max(barProgress, 0), 1)
  // The islands row is capped to the content column and padded by the side
  // inset, which morphs with the one-line state of the bar; the pill must line
  // up with the row's inner edges on every width and in every bar state.
  const sideInset = getBarSideInset(progress)
  const innerWidth = columnWidth - sideInset * 2
  // The derived row height includes the bottom safe-area padding and its fixed
  // BAR_ROW_MIN_HEIGHT content box, with the islands anchored to the box's
  // bottom edge (the safe-area line). The expanded pill therefore rests one
  // pill-row gap above the expanded island's top edge — visibly detached, the
  // Apple Music floating pair (Issue #153).
  const expandedBottom = tabBarHeight - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_PILL_ROW_GAP
  // The collapsed pill joins the islands on the row's bottom edge.
  const collapsedBottom = tabBarHeight - BAR_ROW_MIN_HEIGHT
  const expandedLeft = rowLeft + sideInset
  const collapsedLeft = rowLeft + sideInset + BAR_CIRCLE_SIZE + BAR_OUTER_GAP
  const expandedWidth = innerWidth
  const collapsedWidth = columnWidth - (collapsedLeft - rowLeft) * 2
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
