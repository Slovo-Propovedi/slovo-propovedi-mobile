import { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'

// Opacity animated styles for the expandable player layers.
// Extracted from useExpandAnimation to keep the main hook within the 130-line limit.
export const useOpacityStyles = (progress: SharedValue<number>) => {
  // Background image animation: fullscreen, just fades in/out
  const backgroundImageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [0, 1]),
  }))
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
    fullStyle,
    miniOverlayStyle,
    miniStyle,
  }
}
