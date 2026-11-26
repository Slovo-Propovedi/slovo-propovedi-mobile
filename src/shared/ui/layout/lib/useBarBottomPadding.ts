import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isIOSUserAgent } from '../../../lib/hooks/isIOSUserAgent'
import { BAR_BOTTOM_INSET_WEB, getBarBottomPadding, IOS_WEB_ISLANDS_GAP } from '../bottomBarLayout'

/**
 * Bottom padding of the floating chrome (islands row, search pill, fullscreen
 * player controls). Native: a real bottom inset puts the chrome flush on the
 * safe-area line; inset-less early frames keep the clearance floor. Web: the
 * visible bottom gap mirrors the expanded chrome's side insets (uniform frame
 * around the floating chrome, issue #154), while a larger real inset (installed
 * PWA safe-area line) still wins. On iOS web the OS already owns the home-
 * indicator clearance below the page, so the probe is ignored and only the
 * islands' breathing gap remains.
 */
export const useBarBottomPadding = (): number => {
  const { bottom } = useSafeAreaInsets()
  const isWeb = Platform.OS === 'web'

  if (isWeb && isIOSUserAgent()) return IOS_WEB_ISLANDS_GAP

  return getBarBottomPadding(bottom, isWeb, BAR_BOTTOM_INSET_WEB)
}
