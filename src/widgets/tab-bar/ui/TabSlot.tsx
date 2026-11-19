import { type PropsWithChildren } from 'react'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { getTabSlotStyle } from '../lib/getIslandStyle'

// One morphing tab slot: the active tab grows into the circle, hidden tabs
// shrink/fade. Keeping every slot mounted avoids remount flashes mid-animation.
export const TabSlot = ({
  children,
  expandedWidth,
  isActive,
  isCollapsed,
  isSettledCollapsed,
  isSettledOneLine,
  oneLineProgress,
  progress,
}: PropsWithChildren<{
  expandedWidth: number
  isActive: boolean
  isCollapsed: boolean
  /** Settled (lagged) shape state feeding the committed resting geometry. */
  isSettledCollapsed: boolean
  /** Settled (lagged) one-line state: owns the circle's diameter (68 or 48). */
  isSettledOneLine: boolean
  /** One-line axis: the collapsed slot width equals the island's current height. */
  oneLineProgress: SharedValue<number>
  progress: SharedValue<number>
}>) => {
  const animatedStyle = useAnimatedStyle(() =>
    getTabSlotStyle(progress.value, { expandedWidth, isActive }, oneLineProgress.value),
  )

  // Non-animated resting geometry committed as the LAST style after the
  // animated one (same pattern as the island itself, Issue #63): on iPad
  // Safari the animated slot style can freeze mid-morph while the island
  // shrinks (Issue #152), and the React commit at settle still writes the
  // final slot geometry. Mid-morph it carries the START geometry because the
  // settled flags lag until the animation lands.
  const restingStyle = getTabSlotStyle(
    isSettledCollapsed ? 1 : 0,
    { expandedWidth, isActive },
    isSettledOneLine ? 1 : 0,
  )

  // Collapsed, an inactive slot is zero-width but its pressable children still
  // overflow the island's edge (labels keep their intrinsic width), so they used
  // to swallow taps on the right half of the active circle. A zero-width slot
  // must not be a touch target; the active slot owns the whole circle instead.
  const pointerEvents = isActive || !isCollapsed ? 'auto' : 'none'

  return (
    <Animated.View pointerEvents={pointerEvents} style={[animatedStyle, restingStyle]}>
      {children}
    </Animated.View>
  )
}
