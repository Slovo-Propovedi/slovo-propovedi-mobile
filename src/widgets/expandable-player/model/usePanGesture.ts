import { Gesture } from 'react-native-gesture-handler'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { SCREEN_HEIGHT } from 'shared/config'
import { INDENTS, PLAYER_SIZES } from 'shared/themed'
import type { SharedValue } from 'react-native-reanimated'

const TAB_H = PLAYER_SIZES.tabBarHeight
const MINI_BOTTOM = TAB_H + INDENTS.low

// Full travel distance from mini player to fullscreen
const DRAG_DISTANCE = SCREEN_HEIGHT - MINI_BOTTOM

// Velocity threshold for snap direction detection
const VELOCITY_THRESHOLD = 500

// Duration for snap animations
const OPEN_DURATION = 300
const CLOSE_DURATION = 250

interface UsePanGestureParams {
  progress: SharedValue<number>
}

export const usePanGesture = ({ progress }: UsePanGestureParams) => {
  // Use SharedValue for worklet-safe state sharing between gesture callbacks
  const startProgress = useSharedValue(0)

  return Gesture.Pan()
    .onStart(() => {
      'worklet'
      // Capture current progress at gesture start
      startProgress.value = progress.value
    })
    .onUpdate(e => {
      'worklet'
      // translationY: positive = drag down, negative = drag up
      // Normalize drag to progress change (0-1 range)
      const dragProgress = e.translationY / DRAG_DISTANCE

      if (startProgress.value >= 0.5)
        // Started expanded: drag down (positive Y) decreases progress
        progress.value = Math.max(0, Math.min(1, 1 - dragProgress))
      else
        // Started collapsed: drag up (negative Y) increases progress
        progress.value = Math.max(0, Math.min(1, -dragProgress))
    })
    .onEnd(e => {
      'worklet'
      const velocity = e.velocityY

      // High velocity determines snap direction
      if (velocity > VELOCITY_THRESHOLD)
        // Fast swipe down - close
        progress.value = withTiming(0, { duration: CLOSE_DURATION })
      else if (velocity < -VELOCITY_THRESHOLD)
        // Fast swipe up - open
        progress.value = withTiming(1, { duration: OPEN_DURATION })
      else if (progress.value >= 0.5)
        // No strong velocity - snap to nearest state
        progress.value = withTiming(1, { duration: OPEN_DURATION })
      else progress.value = withTiming(0, { duration: CLOSE_DURATION })
    })
}
