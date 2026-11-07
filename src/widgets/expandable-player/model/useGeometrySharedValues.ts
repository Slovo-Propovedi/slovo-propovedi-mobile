import { useEffect } from 'react'
import { useSharedValue } from 'react-native-reanimated'

interface GeometrySharedValuesInput {
  fullScreenHeight: number
  screenWidth: number
  tabBarHeight: number
}

/**
 * Mirrors of layout geometry as shared values that may change after mount (e.g.
 * Late tabBarHeight measurement, safe-area insets on Android). Writing to
 * `.value` is the reliable cross-thread channel; worklet closure updates alone
 * can be dropped during busy startup windows (Issue #63).
 * @param input - Current layout geometry.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.screenWidth - Current window width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const useGeometrySharedValues = ({
  fullScreenHeight,
  screenWidth,
  tabBarHeight,
}: GeometrySharedValuesInput) => {
  const tabBarHeightShared = useSharedValue(tabBarHeight)
  const screenWidthShared = useSharedValue(screenWidth)
  const fullScreenHeightShared = useSharedValue(fullScreenHeight)

  useEffect(() => {
    tabBarHeightShared.value = tabBarHeight
    screenWidthShared.value = screenWidth
    fullScreenHeightShared.value = fullScreenHeight
  }, [
    fullScreenHeight,
    fullScreenHeightShared,
    screenWidth,
    screenWidthShared,
    tabBarHeight,
    tabBarHeightShared,
  ])

  return { fullScreenHeightShared, screenWidthShared, tabBarHeightShared }
}
