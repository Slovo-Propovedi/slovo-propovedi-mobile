import { type PropsWithChildren } from 'react'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useLayoutEffectSharedValue } from 'shared/lib/hooks/useLayoutEffectSharedValue'
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
  isWideLayout = false,
  oneLineProgress,
  progress,
}: PropsWithChildren<{
  expandedWidth: number
  isActive: boolean
  isCollapsed: boolean
  /** Settled (lagged) shape state feeding the committed resting geometry. */
  isSettledCollapsed: boolean
  /** Settled (lagged) one-line state: owns the circle's diameter (60 or 48). */
  isSettledOneLine: boolean
  /** Wide layout: the slot height matches the slim constant island height. */
  isWideLayout?: boolean
  /** One-line axis: the collapsed slot width equals the island's current height. */
  oneLineProgress: SharedValue<number>
  progress: SharedValue<number>
}>) => {
  // The slot width must reach the animated layer in the same commit as the
  // resting layer below: a worklet closure is re-registered after the commit,
  // so a resize would paint one frame at the old slot width while the island
  // already carries the new one. The pre-paint channel closes that gap.
  const expandedWidthShared = useLayoutEffectSharedValue(expandedWidth)
  const animatedStyle = useAnimatedStyle(() =>
    getTabSlotStyle(
      progress.value,
      { expandedWidth: expandedWidthShared.value, isActive },
      oneLineProgress.value,
      isWideLayout,
    ),
  )

  // Non-animated resting geometry committed as the LAST style after the
  // animated one (same pattern as the island itself, Issue #63): on iPad
  // Safari the animated slot style can freeze mid-morph while the island
  // shrinks (Issue #152), and the React commit at settle still writes the
  // final slot geometry (width and the island-matching height). Mid-morph it
  // carries the START geometry because the settled flags lag until the
  // animation lands.
  const restingStyle = getTabSlotStyle(
    isSettledCollapsed ? 1 : 0,
    { expandedWidth, isActive },
    isSettledOneLine ? 1 : 0,
    isWideLayout,
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
