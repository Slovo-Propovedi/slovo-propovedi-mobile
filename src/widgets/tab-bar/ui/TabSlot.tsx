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
  isCollapsed,
  progress,
}: PropsWithChildren<{
  expandedWidth: number
  isActive: boolean
  isCollapsed: boolean
  progress: SharedValue<number>
}>) => {
  const animatedStyle = useAnimatedStyle(() =>
    getTabSlotStyle(progress.value, {
      collapsedWidth: BAR_CIRCLE_SIZE,
      expandedWidth,
      isActive,
    }),
  )

  // Collapsed, an inactive slot is zero-width but its pressable children still
  // overflow the island's edge (labels keep their intrinsic width), so they used
  // to swallow taps on the right half of the active circle. A zero-width slot
  // must not be a touch target; the active slot owns the whole circle instead.
  const pointerEvents = isActive || !isCollapsed ? 'auto' : 'none'

  return (
    <Animated.View style={animatedStyle} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  )
}
