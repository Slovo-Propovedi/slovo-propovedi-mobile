import { type PropsWithChildren } from 'react'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { BAR_CIRCLE_SIZE } from 'shared/ui/layout'
import { getTabSlotStyle } from '../lib/getIslandStyle'

// One morphing tab slot: the active tab grows into the circle, hidden tabs
// shrink/fade. Keeping every slot mounted avoids remount flashes mid-animation.
export const TabSlot = ({
  children,
  expandedWidth,
  isActive,
  progress,
}: PropsWithChildren<{
  expandedWidth: number
  isActive: boolean
  progress: SharedValue<number>
}>) => {
  const animatedStyle = useAnimatedStyle(() =>
    getTabSlotStyle(progress.value, {
      collapsedWidth: BAR_CIRCLE_SIZE,
      expandedWidth,
      isActive,
    }),
  )

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
