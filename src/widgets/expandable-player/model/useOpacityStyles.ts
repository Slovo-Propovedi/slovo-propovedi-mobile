import { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { getMiniPlayerOpacity } from '../lib/getContainerOpacity'

// Opacity animated styles for the expandable player layers.
// Extracted from useExpandAnimation to keep the main hook within the 130-line limit.
export const useOpacityStyles = (progress: SharedValue<number>) => {
  // Background image animation: fullscreen, just fades in/out
  const backgroundImageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [0, 1]),
  }))
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [0, 0.5]),
  }))
  // Crossfade partner of the container sheet: fully opaque while the sheet is
  // still dissolving, gone once the opaque sheet covers the player again.
  const miniStyle = useAnimatedStyle(() => ({
    opacity: getMiniPlayerOpacity(progress.value),
  }))
  const fullStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 0.8], [0, 1]),
  }))

  return {
    backdropStyle,
    backgroundImageStyle,
    fullStyle,
    miniStyle,
  }
}
