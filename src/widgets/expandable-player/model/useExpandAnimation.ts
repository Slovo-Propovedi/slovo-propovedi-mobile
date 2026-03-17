import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from 'shared/config'
import { INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/themed'
import type { SharedValue } from 'react-native-reanimated'

const MINI_H = PLAYER_SIZES.miniPlayerHeight
const TAB_H = PLAYER_SIZES.tabBarHeight
const MINI_BOTTOM = TAB_H + INDENTS.low

interface UseExpandAnimationResult {
  backdropStyle: ReturnType<typeof useAnimatedStyle>
  blurStyle: ReturnType<typeof useAnimatedStyle>
  containerStyle: ReturnType<typeof useAnimatedStyle>
  fullStyle: ReturnType<typeof useAnimatedStyle>
  miniStyle: ReturnType<typeof useAnimatedStyle>
  progress: SharedValue<number>
}

export const useExpandAnimation = (expanded: boolean): UseExpandAnimationResult => {
  const progress = useSharedValue(0)

  // Animate progress based on expanded state
  if (expanded && progress.value !== 1) progress.value = withTiming(1, { duration: 300 })
  else if (!expanded && progress.value !== 0) progress.value = withTiming(0, { duration: 250 })

  const containerStyle = useAnimatedStyle(
    () => ({
      borderBottomLeftRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
      borderBottomRightRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
      borderTopLeftRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
      borderTopRightRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
      bottom: interpolate(progress.value, [0, 1], [MINI_BOTTOM, 0]),
      height: interpolate(progress.value, [0, 1], [MINI_H, SCREEN_HEIGHT]),
      left: interpolate(progress.value, [0, 1], [INDENTS.low, 0]),
      width: interpolate(progress.value, [0, 1], [SCREEN_WIDTH - INDENTS.low * 2, SCREEN_WIDTH]),
    }),
    [progress],
  )

  const backdropStyle = useAnimatedStyle(
    () => ({ opacity: interpolate(progress.value, [0, 0.5], [0, 0.5]) }),
    [progress],
  )
  const blurStyle = useAnimatedStyle(
    () => ({ opacity: interpolate(progress.value, [0, 0.5], [0, 1]) }),
    [progress],
  )
  const miniStyle = useAnimatedStyle(
    () => ({ opacity: interpolate(progress.value, [0, 0.3], [1, 0]) }),
    [progress],
  )
  const fullStyle = useAnimatedStyle(
    () => ({ opacity: interpolate(progress.value, [0.4, 0.8], [0, 1]) }),
    [progress],
  )

  return { backdropStyle, blurStyle, containerStyle, fullStyle, miniStyle, progress }
}
