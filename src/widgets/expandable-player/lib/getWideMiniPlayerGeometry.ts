import {
  BAR_SIDE_INSET_EXPANDED,
  getColumnSideInset,
  getWideChromeWidth,
  WIDE_MINI_PLAYER_MAX_WIDTH,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { type MiniPlayerGeometry } from './getMiniPlayerGeometry.types'

interface WideMiniPlayerGeometryInput {
  /** Chrome content width the pill is sized on (the layout base); defaults to `screenWidth`. */
  contentWidth?: number
  fullScreenHeight: number
  screenWidth: number
  /** The chrome's bottom padding (`useBarBottomPadding`) — the wide pill's rest line. */
  wideBottomInset: number
}

/**
 * Wide resting geometry of the mini pill.
 *
 * The tab island lives at the top, so the pill is the only bottom chrome: it
 * rests on the chrome's bottom padding and is sized on the SAME natively centred
 * column its UI host uses (`MiniPlayer`). A pill wider than that column would
 * span outside the host and Android's TouchTargetHelper would drop touches in
 * the bands beside it, so the pill can never exceed the column.
 * Worklet-safe: called from React resting styles and Reanimated animated styles.
 * @param input - Live window geometry and the chrome's rest line.
 * @param input.contentWidth - Width the pill is sized on; defaults to `screenWidth`.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.screenWidth - Current window width.
 * @param input.wideBottomInset - The chrome's bottom padding, the wide pill's rest line.
 */
export const getWideMiniPlayerGeometry = ({
  contentWidth,
  fullScreenHeight,
  screenWidth,
  wideBottomInset,
}: WideMiniPlayerGeometryInput): MiniPlayerGeometry => {
  'worklet'
  const height = PLAYER_SIZES.wideMiniPlayerHeight
  const bottom = wideBottomInset
  const columnWidth = Math.min(contentWidth ?? screenWidth, WIDE_MINI_PLAYER_MAX_WIDTH)

  return {
    bottom,
    height,
    left: getColumnSideInset(screenWidth, BAR_SIDE_INSET_EXPANDED, columnWidth),
    radius: height / 2,
    top: fullScreenHeight - bottom - height,
    width: Math.min(getWideChromeWidth(screenWidth, WIDE_MINI_PLAYER_MAX_WIDTH), columnWidth),
  }
}
