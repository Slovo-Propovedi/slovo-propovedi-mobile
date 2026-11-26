import { useAtom } from '@reatom/npm-react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PLAYER_SIZES } from '../../theme/themed'
import {
  BAR_OUTER_GAP,
  BAR_TOP_ISLAND_MARGIN,
  getWideMiniPlayerBottomInset,
} from '../bottomBarLayout'
import { tabBarHeightAtom } from '../model'
import { useIsWideLayout } from './useIsWideLayout'

/**
 * Space the floating chrome occupies around screen content. Compact keeps the
 * tab bar and mini player at the bottom; wide moves the tab island to the top,
 * so screens reserve the top chrome instead and leave only the mini pill below.
 */
export const useScreenChromePadding = (): {
  bottomChromeHeight: number
  topChromeHeight: number
} => {
  const isWide = useIsWideLayout()
  const insets = useSafeAreaInsets()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const miniPlayerHeight = PLAYER_SIZES.miniPlayerHeight

  if (!isWide)
    return {
      bottomChromeHeight: tabBarHeight + miniPlayerHeight,
      topChromeHeight: 0,
    }

  return {
    bottomChromeHeight:
      miniPlayerHeight + getWideMiniPlayerBottomInset(Platform.OS === 'web') + BAR_OUTER_GAP,
    topChromeHeight: insets.top + BAR_TOP_ISLAND_MARGIN + tabBarHeight + BAR_OUTER_GAP,
  }
}
