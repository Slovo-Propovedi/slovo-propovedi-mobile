import { Gesture } from 'react-native-gesture-handler'
import { type SharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { SCREEN_HEIGHT } from 'shared/config'
import { getExpandedRestingBottom } from '../lib/getExpandedRestingBottom'
import { COLLAPSE_DURATION_MS, EXPAND_DURATION_MS } from './expandDurations'

// Velocity threshold for fast swipe detection
const VELOCITY_THRESHOLD = 500

// Progress threshold for snap decision
const SNAP_THRESHOLD = 0.3

interface UseMiniPanGestureParams {
  /** Called when gesture decides to open the player. */
  isWideLayout: boolean
  onOpen?: () => void
  /** Shared progress value (0 = collapsed, 1 = expanded). */
  progress: SharedValue<number>
  /** Measured tab bar height used to compute the mini player bottom offset. */
  tabBarHeight: number
  /** The chrome's bottom padding, the wide pill's rest line. */
  wideBottomInset: number
}

/**
 * Creates a pan gesture that ONLY responds to swipe-up.
 * Used for mini player to expand on upward swipe.
 * Taps pass through to onPress handler.
 * @param params - The parameters object.
 * @param params.isWideLayout - Whether the wide layout applies.
 * @param params.onOpen - Called when gesture decides to open the player.
 * @param params.progress - Shared progress value (0 = collapsed, 1 = expanded).
 * @param params.tabBarHeight - Measured tab bar height.
 * @param params.wideBottomInset - The chrome's bottom padding, the wide pill's rest line.
 */
export const useMiniPanGesture = ({
  isWideLayout,
  onOpen,
  progress,
  tabBarHeight,
  wideBottomInset,
}: UseMiniPanGestureParams) => {
  // Distance from the screen bottom to the expanded pill's real resting edge, so
  // a full swipe-up lands exactly on the expanded bar state.
  // shortcut: drag distance derives from the module-load SCREEN_HEIGHT, so it goes
  // stale after rotation/multi-window; revisit when rotation complaints appear
  // (tracked in docs/debt.md → stale screen-dimension constants).
  const dragDistance =
    SCREEN_HEIGHT - getExpandedRestingBottom(tabBarHeight, isWideLayout, wideBottomInset)

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
        duration: shouldOpen ? EXPAND_DURATION_MS : COLLAPSE_DURATION_MS,
      })

      if (shouldOpen && onOpen) scheduleOnRN(onOpen)
    })
}
