import { useAtom } from '@reatom/npm-react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PLAYER_SIZES } from '../../theme/themed'
import { BAR_OUTER_GAP, BAR_ROW_MIN_HEIGHT, BAR_TOP_ISLAND_MARGIN } from '../bottomBarLayout'
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
 * CONTENT height — the measured row also carries the bottom padding, which must
 * not inflate the top chrome.
 */
export const useScreenChromePadding = (): {
  bottomChromeHeight: number
  topChromeHeight: number
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
    }

  return {
    bottomChromeHeight: miniPlayerHeight + barBottomPadding + BAR_OUTER_GAP,
    topChromeHeight: insets.top + BAR_TOP_ISLAND_MARGIN + BAR_ROW_MIN_HEIGHT + BAR_OUTER_GAP,
  }
}
