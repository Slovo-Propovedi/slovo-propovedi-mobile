import { Gesture } from 'react-native-gesture-handler'
import { withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { SCREEN_HEIGHT } from 'shared/config'
import type { SharedValue } from 'react-native-reanimated'
import { getMiniPlayerBottom } from '../lib/getMiniPlayerBottom'

// Velocity threshold for fast swipe detection
const VELOCITY_THRESHOLD = 500

// Duration for snap animations
const OPEN_DURATION = 300
const CLOSE_DURATION = 250

// Progress threshold for snap decision
const SNAP_THRESHOLD = 0.3

interface UseMiniPanGestureParams {
  /** Called when gesture decides to open the player. */
  onOpen?: () => void
  /** Shared progress value (0 = collapsed, 1 = expanded). */
  progress: SharedValue<number>
  /** Measured tab bar height used to compute the mini player bottom offset. */
  tabBarHeight: number
}

/**
 * Creates a pan gesture that ONLY responds to swipe-up.
 * Used for mini player to expand on upward swipe.
 * Taps pass through to onPress handler.
 * @param params - The parameters object.
 * @param params.onOpen - Called when gesture decides to open the player.
 * @param params.progress - Shared progress value (0 = collapsed, 1 = expanded).
 * @param params.tabBarHeight - Measured tab bar height.
 */
export const useMiniPanGesture = ({ onOpen, progress, tabBarHeight }: UseMiniPanGestureParams) => {
  // Distance needed to fully expand (same as usePanGesture)
  const dragDistance = SCREEN_HEIGHT - getMiniPlayerBottom(tabBarHeight)

  return Gesture.Pan()
    .activeOffsetY(-10) // Only activate when swiping UP 10px (negative Y)
    .failOffsetY(5) // Fail immediately if swiping down more than 5px
    .onUpdate(e => {
      'worklet'
      // translationY is negative when swiping up, use absolute value
      const normalizedProgress = Math.abs(e.translationY) / dragDistance
      progress.value = Math.min(1, normalizedProgress)
    })
    .onEnd(e => {
      'worklet'
      const shouldOpen = progress.value >= SNAP_THRESHOLD || e.velocityY < -VELOCITY_THRESHOLD

      progress.value = withTiming(shouldOpen ? 1 : 0, {
        duration: shouldOpen ? OPEN_DURATION : CLOSE_DURATION,
      })

      if (shouldOpen && onOpen) scheduleOnRN(onOpen)
    })
}
