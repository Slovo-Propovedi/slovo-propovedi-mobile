import { useAtom } from '@reatom/npm-react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PLAYER_SIZES } from '../../theme/themed'
import { BAR_OUTER_GAP, BAR_TOP_ISLAND_MARGIN } from '../bottomBarLayout'
import { tabBarHeightAtom } from '../model'
import { useBarBottomPadding } from './useBarBottomPadding'
import { useIsWideLayout } from './useIsWideLayout'

/**
 * Space the floating chrome occupies around screen content. Compact keeps the
 * tab bar and mini player at the bottom; wide moves the tab island to the top,
 * so screens reserve the top chrome instead and leave only the mini pill below.
 *
 * Both sides derive from one authority: the wide pill sits on the chrome's
 * bottom padding (`useBarBottomPadding`).
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
    topChromeHeight: insets.top + BAR_TOP_ISLAND_MARGIN + tabBarHeight + BAR_OUTER_GAP,
  }
}
