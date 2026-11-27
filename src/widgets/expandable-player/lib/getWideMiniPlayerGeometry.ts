import {
  BAR_SIDE_INSET_EXPANDED,
  getColumnSideInset,
  getWideChromeWidth,
  WIDE_MINI_PLAYER_MAX_WIDTH,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { type MiniPlayerGeometry } from './getMiniPlayerGeometry.types'

interface WideMiniPlayerGeometryInput {
  fullScreenHeight: number
  screenWidth: number
  /** The chrome's bottom padding (`useBarBottomPadding`) — the wide pill's rest line. */
  wideBottomInset: number
}

/**
 * Wide resting geometry of the mini pill.
 *
 * The tab island lives at the top, so the pill is the only bottom chrome: it
 * rests on the chrome's bottom padding and spans its own wider cap, centred on
 * the LIVE window (tablets keep dynamic widths; only the phone base freezes).
 * Worklet-safe: called from React resting styles and Reanimated animated styles.
 * @param input - Live window geometry and the chrome's rest line.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.screenWidth - Current window width.
 * @param input.wideBottomInset - The chrome's bottom padding, the wide pill's rest line.
 */
export const getWideMiniPlayerGeometry = ({
  fullScreenHeight,
  screenWidth,
  wideBottomInset,
}: WideMiniPlayerGeometryInput): MiniPlayerGeometry => {
  'worklet'
  const height = PLAYER_SIZES.wideMiniPlayerHeight
  const bottom = wideBottomInset

  return {
    bottom,
    height,
    left: getColumnSideInset(screenWidth, BAR_SIDE_INSET_EXPANDED, WIDE_MINI_PLAYER_MAX_WIDTH),
    radius: height / 2,
    top: fullScreenHeight - bottom - height,
    width: getWideChromeWidth(screenWidth, WIDE_MINI_PLAYER_MAX_WIDTH),
  }
}
