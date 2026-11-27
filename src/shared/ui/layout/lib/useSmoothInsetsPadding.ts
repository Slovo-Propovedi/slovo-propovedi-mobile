import { useLayoutEffect, useRef } from 'react'
import {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useLayoutEffectSharedValue } from '../../../lib/hooks/useLayoutEffectSharedValue'

// Safe-area paddings GLIDE on an inset change instead of jumping: around a
// rotation Android hides and then restores the status/gesture bars, so the
// insets arrive in two waves (a transient 0 followed by the real value).
export const INSETS_GLIDE_MS = 250 as const

/**
 * Animated twin of an inset-derived size, so the paddings it feeds GLIDE on an
 * inset change instead of jumping. Rotation on Android hides and restores the
 * system bars, which dispatches the safe-area insets in two waves; snapping to
 * each wave moves the content twice. A rotation that lands the camera cutout on
 * a side sends the lateral insets the same way (the content briefly draws under
 * the cutout).
 *
 * The mirror channel is written before paint, so the tween starts in the same
 * commit that carries the new inset. The FIRST delivery (mount/hydration) is
 * assigned directly: there is no previous value to animate from.
 * @param inset - Inset-derived size in dp (safe-area padding or chrome reserve).
 * @returns Shared value the animated style reads on the UI thread.
 */
const useGlidedInset = (inset: number): SharedValue<number> => {
  const target = useLayoutEffectSharedValue(inset)
  const glide = useSharedValue(inset)
  const isFirstDelivery = useRef(true)

  useLayoutEffect(() => {
    if (isFirstDelivery.current) {
      isFirstDelivery.current = false
      glide.value = target.value

      return
    }

    glide.value = withTiming(target.value, { duration: INSETS_GLIDE_MS })
    // `inset` is the trigger; the pre-paint mirror is what the tween reads.
  }, [glide, inset, target])

  return glide
}

interface SmoothInsets {
  /** Safe-area left inset; 0 by default. */
  left?: number
  /** Safe-area right inset; 0 by default. */
  right?: number
  /** Safe-area top inset, or the resolved value a screen uses. */
  top: number
}

/**
 * Animated safe-area padding for a screen root: snaps each edge to the first
 * delivered inset and glides on every later change, lateral edges included.
 * Replaces a native `SafeAreaView edges={['left', 'right']}`, whose padding can
 * only snap.
 * @param insets - Target padding per edge in dp.
 */
export const useSmoothInsetsPadding = (insets: SmoothInsets) => {
  const top = useGlidedInset(insets.top)
  const left = useGlidedInset(insets.left ?? 0)
  const right = useGlidedInset(insets.right ?? 0)

  return useAnimatedStyle(() => ({
    paddingLeft: left.value,
    paddingRight: right.value,
    paddingTop: top.value,
  }))
}

/**
 * Animated bottom chrome reserve for a trailing spacer: snaps to the first
 * delivered reserve and glides on every later change.
 * @param space - Bottom chrome reserve in dp.
 */
export const useSmoothInsetsSpace = (space: number) => {
  const glide = useGlidedInset(space)

  return useAnimatedStyle(() => ({ height: glide.value }))
}
