import { useAction } from '@reatom/npm-react'
import { useState } from 'react'
import { type LayoutChangeEvent } from 'react-native'
import { setTabBarHeight } from 'shared/ui/layout'

/**
 * Measures the floating tab row and publishes its height.
 *
 * A hidden tab screen (display: none) reports 0×0; publishing that zero would
 * collapse every consumer of `tabBarHeightAtom` for a frame, so a zero height is
 * ignored and only a real layout updates the measured values.
 */
export const useTabBarMeasurement = () => {
  const setMeasuredTabBarHeight = useAction(setTabBarHeight)
  const [rowWidth, setRowWidth] = useState(0)

  const onLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout

    if (height <= 0) return

    setRowWidth(width)
    setMeasuredTabBarHeight(height)
  }

  return { onLayout, rowWidth }
}
