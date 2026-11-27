import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PLAYER_SIZES } from '../../theme/themed'
import {
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_TOP_ISLAND_MARGIN,
  WIDE_BAR_ROW_HEIGHT,
  WIDE_CONTENT_TOP_GAP,
} from '../bottomBarLayout'
import { useBarBottomPadding } from './useBarBottomPadding'
import { useIsWideLayout } from './useIsWideLayout'

/**
 * Space the floating chrome occupies around screen content. Compact keeps the
 * tab bar and mini player at the bottom; wide moves the tab island to the top,
 * so screens reserve the top chrome instead and leave only the mini pill below.
 *
 * Both sides derive from one authority: the wide pill sits on the chrome's
 * bottom padding (`useBarBottomPadding`), and the top reserves the islands row's
 * CONTENT height — the derived row also carries the bottom padding, which must
 * not inflate the top chrome.
 *
 * The bar height is derived from the layout mode and the live insets, never from
 * `tabBarHeightAtom`: the atom is published a React hop after the insets commit
 * and still holds the other orientation's height right after a rotation, so
 * reading it here would settle the content's top and bottom paddings in
 * different commits. The atom remains the player worklet channel only.
 *
 * `topChromeScrollInset` is the part of `topChromeHeight` that belongs to a
 * scroll container's CONTENT, not to the screen layout: the safe-area strip
 * stays outside the scroller, while the island clearance lives in the content.
 * That keeps the first item below the island at rest yet lets it scroll under
 * the floating glass instead of being clipped by an opaque full-width band.
 */
export const useScreenChromePadding = (): {
  bottomBarHeight: number
  bottomChromeHeight: number
  topChromeHeight: number
  topChromeScrollInset: number
} => {
  const isWide = useIsWideLayout()
  const insets = useSafeAreaInsets()
  const barBottomPadding = useBarBottomPadding()
  const miniPlayerHeight = PLAYER_SIZES.miniPlayerHeight
  const barHeight = (isWide ? WIDE_BAR_ROW_HEIGHT : BAR_ROW_MIN_HEIGHT) + barBottomPadding

  if (!isWide)
    return {
      bottomBarHeight: barHeight,
      bottomChromeHeight: barHeight + miniPlayerHeight,
      topChromeHeight: 0,
      topChromeScrollInset: 0,
    }

  return {
    bottomBarHeight: barHeight,
    bottomChromeHeight: PLAYER_SIZES.wideMiniPlayerHeight + barBottomPadding + BAR_OUTER_GAP,
    topChromeHeight: insets.top + BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP,
    topChromeScrollInset:
      BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP + WIDE_CONTENT_TOP_GAP,
  }
}
