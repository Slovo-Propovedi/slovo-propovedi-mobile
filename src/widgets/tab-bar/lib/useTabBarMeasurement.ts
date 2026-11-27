import { useAction } from '@reatom/npm-react'
import { type LayoutChangeEvent } from 'react-native'
import { setTabBarHeight } from 'shared/ui/layout'

/**
 * Measures the floating tab row and publishes its height.
 *
 * The WIDTH is deliberately not measured here: the row is exactly
 * `min(windowWidth, content column)` (a full-width '100%' row capped by
 * `maxWidth`), so the island derives it from `useWindowDimensions` at render.
 * Reading it through an onLayout React-state hop left the island a frame behind
 * the window on rotation while the pill and search button already used the new
 * width (crooked chrome).
 *
 * A hidden tab screen (display: none) reports 0×0; publishing that zero would
 * collapse every consumer of `tabBarHeightAtom` for a frame, so a zero height is
 * ignored and only a real layout updates the measured values.
 */
export const useTabBarMeasurement = () => {
  const setMeasuredTabBarHeight = useAction(setTabBarHeight)

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout

    if (height <= 0) return

    setMeasuredTabBarHeight(height)
  }

  return { onLayout }
}
