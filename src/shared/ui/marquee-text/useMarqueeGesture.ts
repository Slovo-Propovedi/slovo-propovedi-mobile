import { useMemo } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { createMarqueeGesture } from './createMarqueeGesture'

interface MarqueeGestureParams {
  clockPaused: SharedValue<boolean>
  didDrag: SharedValue<boolean>
  marqueeArmed: SharedValue<boolean>
  maxOffset: SharedValue<number>
  startIdleMarquee: () => void
  startX: SharedValue<number>
  translateX: SharedValue<number>
}

// All arguments are per-instance shared values plus the clock's stable
// `startIdleMarquee`, so the gesture is created once per component instance.
// Without this, every parent re-render (audio position ticks ~2/s) rebuilt the
// pan and made RNGH reconfigure the native handler.
export const useMarqueeGesture = ({
  clockPaused,
  didDrag,
  marqueeArmed,
  maxOffset,
  startIdleMarquee,
  startX,
  translateX,
}: MarqueeGestureParams) =>
  useMemo(
    () =>
      createMarqueeGesture(
        translateX,
        startX,
        maxOffset,
        startIdleMarquee,
        didDrag,
        marqueeArmed,
        clockPaused,
      ),
    [clockPaused, didDrag, marqueeArmed, maxOffset, startIdleMarquee, startX, translateX],
  )
