import { useAtom } from '@reatom/npm-react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PLAYER_SIZES } from '../../theme/themed'
import {
  BAR_OUTER_GAP,
  BAR_TOP_ISLAND_MARGIN,
  WIDE_BAR_ROW_HEIGHT,
  WIDE_CONTENT_TOP_GAP,
} from '../bottomBarLayout'
import { tabBarHeightAtom } from '../model'
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
 * `topChromeScrollInset` is the part of `topChromeHeight` that belongs to a
 * scroll container's CONTENT, not to the screen layout: the safe-area strip
 * stays outside the scroller, while the island clearance lives in the content.
 * That keeps the first item below the island at rest yet lets it scroll under
 * the floating glass instead of being clipped by an opaque full-width band.
 */
export const useScreenChromePadding = (): {
  bottomChromeHeight: number
  topChromeHeight: number
  topChromeScrollInset: number
} => {
  const isWide = useIsWideLayout()
  const insets = useSafeAreaInsets()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const barBottomPadding = useBarBottomPadding()
  const miniPlayerHeight = PLAYER_SIZES.miniPlayerHeight

  if (!isWide)
    return {
      bottomChromeHeight: tabBarHeight + miniPlayerHeight,
      topChromeHeight: 0,
      topChromeScrollInset: 0,
    }

  return {
    bottomChromeHeight: PLAYER_SIZES.wideMiniPlayerHeight + barBottomPadding + BAR_OUTER_GAP,
    topChromeHeight: insets.top + BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP,
    topChromeScrollInset:
      BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP + WIDE_CONTENT_TOP_GAP,
  }
}
