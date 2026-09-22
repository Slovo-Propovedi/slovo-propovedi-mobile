/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated in frame worklets and reset effects */
import { useCallback, useEffect } from 'react'
import { useFrameCallback, useSharedValue } from 'react-native-reanimated'
import type { FrameInfo, SharedValue } from 'react-native-reanimated'
import {
  MARQUEE_MS_PER_PX,
  MARQUEE_MS_PER_PX_NARROW,
  MARQUEE_PAUSE,
  NARROW_WIDTH_THRESHOLD,
  REPEAT_SPACER,
} from './marquee-utils'

// Upper bound on a single frame delta: a resumed/backgrounded app reports a
// multi-second `timeSincePreviousFrame` that would otherwise teleport the row.
const MAX_FRAME_DELTA_MS = 100

interface MarqueeFrameClockParams {
  autoStart: boolean
  containerWidth: SharedValue<number>
  marqueeArmed: SharedValue<boolean>
  needsMarquee: SharedValue<boolean>
  needsRepeat: boolean
  startX: SharedValue<number>
  text: string
  textWidth: SharedValue<number>
  translateX: SharedValue<number>
}

// Deterministic frame clock for the marquee loop. Instead of chaining Reanimated
// animations (delay → timing → zero-duration tail → repeat), which makes Android
// re-schedule at every sequence boundary and stutter, one `useFrameCallback`
// advances a single phase value per frame. JS-side lifecycle (`needsRepeat`)
// activates the callback only for overflowing rows; worklet-side `clockPaused`
// freezes the phase during scrubs and while the drag gate is off.
export const useMarqueeFrameClock = ({
  autoStart,
  containerWidth,
  marqueeArmed,
  needsMarquee,
  needsRepeat,
  startX,
  text,
  textWidth,
  translateX,
}: MarqueeFrameClockParams) => {
  // Milliseconds into the current cycle (pause phase + scroll phase).
  const cycleElapsed = useSharedValue(0)
  // Worklet-readable pause flag: the clock keeps ticking while the callback is
  // active, but this freezes the phase during scrubs and while the gate is off.
  const clockPaused = useSharedValue(!autoStart)

  // Empty deps: the worklet reads only shared values and module constants, so
  // a stable identity keeps `useFrameCallback`'s [callback, autostart] effect
  // from re-registering the native frame callback on parent re-renders (audio
  // position ticks ~2/s used to unregister/re-register the clock each tick).
  const handleFrame = useCallback((frameInfo: FrameInfo) => {
    'worklet'
    if (!needsMarquee.value || !marqueeArmed.value || clockPaused.value) return

    const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 0, MAX_FRAME_DELTA_MS)
    const loopDistance = textWidth.value + REPEAT_SPACER
    const msPerPx =
      containerWidth.value < NARROW_WIDTH_THRESHOLD ? MARQUEE_MS_PER_PX_NARROW : MARQUEE_MS_PER_PX
    const scrollMs = loopDistance * msPerPx

    if (scrollMs <= 0) {
      translateX.value = 0
      return
    }

    const elapsed = cycleElapsed.value + delta

    if (elapsed <= MARQUEE_PAUSE) {
      cycleElapsed.value = elapsed
      translateX.value = 0
      return
    }

    const scrolled = Math.min(elapsed - MARQUEE_PAUSE, scrollMs)
    translateX.value = -(scrolled / scrollMs) * loopDistance
    cycleElapsed.value = elapsed

    // Cycle end: jump-cut to the pause state (rather than easing back) so the
    // duplicate copy lands exactly where the loop restarts, with no reverse
    // motion; the next cycle begins with its own MARQUEE_PAUSE.
    if (scrolled >= scrollMs) {
      cycleElapsed.value = 0
      translateX.value = 0
    }
  }, [])

  const frameCallback = useFrameCallback(handleFrame, false)

  // JS-side lifecycle: only overflowing rows activate the frame callback, so a
  // fitting title keeps the clock fully stopped. Drag pauses flip `clockPaused`
  // on the UI thread instead, avoiding a worklet -> JS hop per gesture.
  useEffect(() => {
    frameCallback.setActive(needsRepeat)
    return () => frameCallback.setActive(false)
  }, [frameCallback, needsRepeat])

  useEffect(() => {
    translateX.value = 0
    startX.value = 0
    marqueeArmed.value = autoStart
    cycleElapsed.value = 0
    clockPaused.value = !autoStart
  }, [text, autoStart])

  // Stable identity (reads shared values only): lets `marquee-text.tsx`
  // memoize the pan gesture once per instance instead of rebuilding it.
  const startIdleMarquee = useCallback(() => {
    'worklet'
    if (!needsMarquee.value || !marqueeArmed.value) {
      // Keep the clock paused: a fitting or still-gated row stays static. Reset
      // any offset left over from a previous cycle or a scrub.
      clockPaused.value = true
      translateX.value = 0
      return
    }
    cycleElapsed.value = 0
    translateX.value = 0
    clockPaused.value = false
  }, [])

  return { clockPaused, frameCallback, startIdleMarquee }
}
