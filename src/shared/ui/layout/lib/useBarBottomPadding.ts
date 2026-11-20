import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useIsBrowserWeb } from '../../../lib/hooks/useIsBrowserWeb'
import { getBarBottomPadding } from '../bottomBarLayout'

/**
 * Bottom padding of the floating chrome (islands row, search pill, fullscreen
 * player controls). A real bottom inset puts the chrome flush on the safe-area
 * line; inset-less screens keep the clearance floor everywhere — on native
 * (early frames), desktop web and mobile browsers alike. On web browsers (not
 * installed PWAs) a real inset additionally keeps the clearance floor above the
 * safe-area line: there it is the top edge of the browser chrome (iOS Safari
 * navbar), and flush reads as the chrome lying on the navbar.
 */
export const useBarBottomPadding = (): number => {
  const { bottom } = useSafeAreaInsets()
  const isBrowserWeb = useIsBrowserWeb()

  return getBarBottomPadding(bottom, Platform.OS === 'web' && isBrowserWeb)
}
