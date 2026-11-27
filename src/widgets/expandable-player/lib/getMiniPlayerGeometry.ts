import { BAR_OUTER_GAP, CONTENT_COLUMN_WIDTH, getColumnSideInset } from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getCompactMiniPlayerGeometry } from './getCompactMiniPlayerGeometry'
import { type MiniPlayerGeometry } from './getMiniPlayerGeometry.types'
import { getWideMiniPlayerGeometry } from './getWideMiniPlayerGeometry'

/**
 * Slide-down distance that tucks the pill behind the focused search row: its
 * own height plus the two outer gaps hides it fully behind the row.
 */
export const MINI_PILL_TUCK_DISTANCE = PLAYER_SIZES.miniPlayerHeight + BAR_OUTER_GAP * 2

interface MiniPlayerGeometryInput {
  /** 0 = detached pill above the tab row, 1 = pill in the collapsed bottom line. */
  barProgress: number
  /**
   * Chrome content width the compact pill is SIZED from (the window's short
   * side on phones). Position still centres inside the live window, so a
   * rotation moves the pill without resizing it. Defaults to `screenWidth`.
   */
  contentWidth?: number
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
 * Compact screens lay the pill out in the chrome column — the orientation-
 * independent layout base, capped by the content column — while its position
 * follows the live window, so a phone rotation changes no size at all. The wide
 * layout keeps live, content-driven widths (tablets are not rotation-frozen).
 *
 * Worklet-safe: called from React resting styles and Reanimated animated styles.
 * @param input - Geometry inputs and morph progress.
 * @param input.barProgress - 0 = detached pill, 1 = pill in the collapsed row.
 * @param input.contentWidth - Width the compact pill is sized from; defaults to `screenWidth`.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.isWideLayout - Whether the wide layout applies.
 * @param input.screenWidth - Current window width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 * @param input.wideBottomInset - The chrome's bottom padding, the wide pill's rest line.
 */
export const getMiniPlayerGeometry = ({
  barProgress,
  contentWidth,
  fullScreenHeight,
  isWideLayout = false,
  screenWidth,
  tabBarHeight,
  wideBottomInset,
}: MiniPlayerGeometryInput): MiniPlayerGeometry => {
  'worklet'
  if (isWideLayout)
    return getWideMiniPlayerGeometry({ fullScreenHeight, screenWidth, wideBottomInset })

  // The compact pill lays out in the chrome column but is centred in the LIVE
  // window, so a rotation only moves it.
  const columnWidth = Math.min(contentWidth ?? screenWidth, CONTENT_COLUMN_WIDTH)
  const rowLeft = getColumnSideInset(screenWidth, 0, columnWidth)

  return getCompactMiniPlayerGeometry({
    barProgress,
    columnWidth,
    fullScreenHeight,
    rowLeft,
    tabBarHeight,
  })
}
