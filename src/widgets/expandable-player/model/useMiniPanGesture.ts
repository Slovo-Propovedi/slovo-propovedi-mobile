import { Gesture } from 'react-native-gesture-handler'
import { withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { SCREEN_HEIGHT } from 'shared/config'
import { INDENTS, PLAYER_SIZES } from 'shared/ui/themed'
import type { SharedValue } from 'react-native-reanimated'

const TAB_H = PLAYER_SIZES.tabBarHeight
const MINI_BOTTOM = TAB_H + INDENTS.low

// Distance needed to fully expand (same as usePanGesture)
const DRAG_DISTANCE = SCREEN_HEIGHT - MINI_BOTTOM

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
}

/**
 * Creates a pan gesture that ONLY responds to swipe-up.
 * Used for mini player to expand on upward swipe.
 * Taps pass through to onPress handler.
 * @param params - The parameters object.
 * @param params.onOpen - Called when gesture decides to open the player.
 * @param params.progress - Shared progress value (0 = collapsed, 1 = expanded).
 */
export const useMiniPanGesture = ({ onOpen, progress }: UseMiniPanGestureParams) =>
  Gesture.Pan()
    .activeOffsetY(-10) // Only activate when swiping UP 10px (negative Y)
    .failOffsetY(5) // Fail immediately if swiping down more than 5px
    .onUpdate(e => {
      'worklet'
      // translationY is negative when swiping up, use absolute value
      const normalizedProgress = Math.abs(e.translationY) / DRAG_DISTANCE
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
