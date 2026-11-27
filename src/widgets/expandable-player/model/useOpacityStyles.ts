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
  // Crossfade partner of the container sheet: it fades in under the still
  // opaque sheet on collapse and is fully opaque before the sheet dissolves.
  const miniStyle = useAnimatedStyle(() => ({
    opacity: getMiniPlayerOpacity(progress.value),
  }))
  // Fully faded out by the point the sheet starts dissolving (0.5) and fully
  // back once it is solid again on expand; no content ghosts through the ramp.
  const fullStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 0.8], [0, 1]),
  }))

  return {
    backdropStyle,
    backgroundImageStyle,
    fullStyle,
    miniStyle,
  }
}
