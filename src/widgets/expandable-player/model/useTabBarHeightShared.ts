import { useEffect } from 'react'
import { useSharedValue } from 'react-native-reanimated'

/**
 * UI-thread mirror of the measured tab-row height.
 *
 * The height is the one geometry input that changes after mount on a channel the
 * player cannot see in the same commit (the row measures on its first layout
 * pass), and a worklet-closure update alone can be dropped during busy startup
 * windows (Issue #63), so it keeps the shared-value channel. Window dimensions do
 * NOT belong here: they are captured as plain worklet closure values at render,
 * so the animated layer lands on the same commit as the rotated window.
 * @param tabBarHeight - Measured height of the floating tab row.
 */
export const useTabBarHeightShared = (tabBarHeight: number) => {
  const tabBarHeightShared = useSharedValue(tabBarHeight)

  useEffect(() => {
    tabBarHeightShared.value = tabBarHeight
  }, [tabBarHeight, tabBarHeightShared])

  return tabBarHeightShared
}
