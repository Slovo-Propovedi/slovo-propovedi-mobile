import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isIOSUserAgent } from '../../../lib/hooks/isIOSUserAgent'
import {
  BAR_BOTTOM_INSET_WEB,
  getBarBottomPadding,
  IOS_HOME_INDICATOR_INSET,
} from '../bottomBarLayout'

/**
 * Bottom padding of the floating chrome (islands row, search pill, fullscreen
 * player controls). Native: a real bottom inset puts the chrome flush on the
 * safe-area line; inset-less early frames keep the clearance floor. Web: the
 * visible bottom gap mirrors the expanded chrome's side insets (uniform frame
 * around the floating chrome, issue #154), while a larger real inset (installed
 * PWA safe-area line) still wins. On iOS web the floor is raised to the home-
 * indicator inset because the safe-area probe reports 0.
 */
export const useBarBottomPadding = (): number => {
  const { bottom } = useSafeAreaInsets()
  const webFloor = isIOSUserAgent() ? IOS_HOME_INDICATOR_INSET : BAR_BOTTOM_INSET_WEB

  return getBarBottomPadding(bottom, Platform.OS === 'web', webFloor)
}
