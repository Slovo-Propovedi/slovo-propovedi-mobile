import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useHasFinePointer } from '../../../lib/hooks/useHasFinePointer'
import { getBarBottomPadding } from '../bottomBarLayout'

/**
 * Bottom padding of the floating chrome (islands row, search pill, fullscreen
 * player controls). A real bottom inset puts the chrome flush on the safe-area
 * line; inset-less screens keep the clearance floor on desktop web and native
 * (early frames), while mobile web opts out so the chrome sits on the viewport
 * bottom.
 */
export const useBarBottomPadding = (): number => {
  const { bottom } = useSafeAreaInsets()
  const hasFinePointer = useHasFinePointer()

  return getBarBottomPadding(bottom, Platform.OS !== 'web' || hasFinePointer)
}
