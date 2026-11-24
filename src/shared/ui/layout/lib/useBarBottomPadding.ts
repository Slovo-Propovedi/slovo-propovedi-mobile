import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getBarBottomPadding } from '../bottomBarLayout'

/**
 * Bottom padding of the floating chrome (islands row, search pill, fullscreen
 * player controls). Native: a real bottom inset puts the chrome flush on the
 * safe-area line; inset-less early frames keep the clearance floor. Web: the
 * visible bottom gap mirrors the expanded chrome's side insets (uniform frame
 * around the floating chrome, issue #154), while a larger real inset (installed
 * PWA safe-area line) still wins.
 */
export const useBarBottomPadding = (): number => {
  const { bottom } = useSafeAreaInsets()

  return getBarBottomPadding(bottom, Platform.OS === 'web')
}
