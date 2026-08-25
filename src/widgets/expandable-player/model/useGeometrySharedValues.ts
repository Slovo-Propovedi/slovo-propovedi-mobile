import { useEffect } from 'react'
import { useSharedValue } from 'react-native-reanimated'

/**
 * Mirrors of layout geometry as shared values that may change after mount (e.g.
 * Late tabBarHeight measurement, safe-area insets on Android). Writing to
 * `.value` is the reliable cross-thread channel; worklet closure updates alone
 * can be dropped during busy startup windows (Issue #63).
 * @param miniBottom - Bottom offset for the mini player (tabBarHeight minus overlap).
 * @param screenWidth - Current window width from useWindowDimensions.
 * @param fullScreenHeight - Full device screen height from Dimensions.get('screen').
 */
export const useGeometrySharedValues = (
  miniBottom: number,
  screenWidth: number,
  fullScreenHeight: number,
) => {
  const miniBottomShared = useSharedValue(miniBottom)
  const screenWidthShared = useSharedValue(screenWidth)
  const fullScreenHeightShared = useSharedValue(fullScreenHeight)

  useEffect(() => {
    miniBottomShared.value = miniBottom
    screenWidthShared.value = screenWidth
    fullScreenHeightShared.value = fullScreenHeight
  }, [
    fullScreenHeight,
    fullScreenHeightShared,
    miniBottom,
    miniBottomShared,
    screenWidth,
    screenWidthShared,
  ])

  return { fullScreenHeightShared, miniBottomShared, screenWidthShared }
}
