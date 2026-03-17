import { Gesture } from 'react-native-gesture-handler'
import { runOnJS, useSharedValue, withTiming } from 'react-native-reanimated'
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
  onClose?: () => void
  onOpen?: () => void
  progress: SharedValue<number>
}

export const usePanGesture = ({ onClose, onOpen, progress }: UsePanGestureParams) => {
  const startProgress = useSharedValue(0)

  return Gesture.Pan()
    .activeOffsetY([-10, 10]) // Require 10px vertical movement to activate (allows taps to pass through)
    .onStart(() => {
      'worklet'
      startProgress.value = progress.value
    })
    .onUpdate(e => {
      'worklet'
      const dragProgress = e.translationY / DRAG_DISTANCE

      if (startProgress.value >= 0.5) progress.value = Math.max(0, Math.min(1, 1 - dragProgress))
      else progress.value = Math.max(0, Math.min(1, -dragProgress))
    })
    .onEnd(e => {
      'worklet'
      const velocity = e.velocityY

      let targetProgress: number
      let duration: number

      if (velocity > VELOCITY_THRESHOLD) {
        targetProgress = 0
        duration = CLOSE_DURATION
      } else if (velocity < -VELOCITY_THRESHOLD) {
        targetProgress = 1
        duration = OPEN_DURATION
      } else if (progress.value >= 0.5) {
        targetProgress = 1
        duration = OPEN_DURATION
      } else {
        targetProgress = 0
        duration = CLOSE_DURATION
      }

      progress.value = withTiming(targetProgress, { duration })

      // Call callbacks to update atom state
      if (targetProgress === 0 && onClose) runOnJS(onClose)()
      else if (targetProgress === 1 && onOpen) runOnJS(onOpen)()
    })
}
