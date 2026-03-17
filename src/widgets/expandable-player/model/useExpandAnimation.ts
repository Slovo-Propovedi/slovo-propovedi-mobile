import { useEffect } from 'react'
import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from 'shared/config'
import { INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/themed'
import type { SharedValue } from 'react-native-reanimated'

const MINI_H = PLAYER_SIZES.miniPlayerHeight
const TAB_H = PLAYER_SIZES.tabBarHeight
const MINI_BOTTOM = TAB_H + INDENTS.low
const MINI_COVER_SIZE = PLAYER_SIZES.albumArtMini

// Mini cover center position (relative to container when collapsed)
const MINI_COVER_CENTER_X = INDENTS.low + MINI_COVER_SIZE / 2
const MINI_COVER_CENTER_Y = MINI_H / 2
const SCREEN_CENTER_X = SCREEN_WIDTH / 2
const SCREEN_CENTER_Y = SCREEN_HEIGHT / 2

interface UseExpandAnimationResult {
  backdropStyle: ReturnType<typeof useAnimatedStyle>
  backgroundImageStyle: ReturnType<typeof useAnimatedStyle>
  blurStyle: ReturnType<typeof useAnimatedStyle>
  containerStyle: ReturnType<typeof useAnimatedStyle>
  fullStyle: ReturnType<typeof useAnimatedStyle>
  miniOverlayStyle: ReturnType<typeof useAnimatedStyle>
  miniStyle: ReturnType<typeof useAnimatedStyle>
  progress: SharedValue<number>
}

export const useExpandAnimation = (expanded: boolean): UseExpandAnimationResult => {
  const progress = useSharedValue(0)

  // Sync progress with expanded prop changes (e.g., tap to open/close)
  // Gesture controls progress during drag; this syncs on external state changes
  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, { duration: expanded ? 300 : 250 })
  }, [expanded, progress])

  const containerStyle = useAnimatedStyle(() => ({
    borderBottomLeftRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
    borderBottomRightRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
    borderTopLeftRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
    borderTopRightRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
    bottom: interpolate(progress.value, [0, 1], [MINI_BOTTOM, 0]),
    height: interpolate(progress.value, [0, 1], [MINI_H, SCREEN_HEIGHT]),
    left: interpolate(progress.value, [0, 1], [INDENTS.low, 0]),
    width: interpolate(progress.value, [0, 1], [SCREEN_WIDTH - INDENTS.low * 2, SCREEN_WIDTH]),
  }))

  // Background image animation: grows from mini cover position to fullscreen
  const backgroundImageStyle = useAnimatedStyle(() => {
    const progressValue = progress.value

    // Scale: from small (MINI_COVER_SIZE / SCREEN_WIDTH) to fullscreen (1)
    const scale = interpolate(progressValue, [0, 1], [MINI_COVER_SIZE / SCREEN_WIDTH, 1])

    // Position: translate from mini cover center to screen center
    const translateX = interpolate(
      progressValue,
      [0, 1],
      [MINI_COVER_CENTER_X - SCREEN_CENTER_X, 0],
    )
    const translateY = interpolate(
      progressValue,
      [0, 1],
      [MINI_COVER_CENTER_Y - SCREEN_CENTER_Y, 0],
    )

    // Opacity: start invisible, fade in as it expands
    const opacity = interpolate(progressValue, [0, 0.1, 1], [0, 0.3, 1])

    return {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }],
    }
  })

  // Dark overlay for mini player - fades out as it expands
  const miniOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0]),
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [0, 0.5]),
  }))

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [0, 1]),
  }))

  const miniStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [1, 0]),
  }))

  const fullStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 0.8], [0, 1]),
  }))

  return {
    backdropStyle,
    backgroundImageStyle,
    blurStyle,
    containerStyle,
    fullStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
  }
}
