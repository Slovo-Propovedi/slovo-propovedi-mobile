import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getBarBottomPadding } from '../bottomBarLayout'

/**
 * Bottom padding of the floating chrome (islands row, search pill, fullscreen
 * player controls). A real bottom inset puts the chrome flush on the safe-area
 * line; inset-less screens keep the clearance floor everywhere — on native
 * (early frames), desktop web and mobile browsers alike.
 */
export const useBarBottomPadding = (): number => {
  const { bottom } = useSafeAreaInsets()

  return getBarBottomPadding(bottom)
}
