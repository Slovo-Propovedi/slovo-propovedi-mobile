/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated in frame worklets and reset effects */
import { useCallback, useEffect } from 'react'
import {
  type FrameInfo,
  type SharedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated'
import { type MarqueeCycle, publishMarqueePhase, resetMarqueeCycle } from './marquee-cycle'
import { getMarqueeFrameStep } from './marquee-frame-step'

// Upper bound on a single frame delta: a resumed/backgrounded app reports a
// multi-second `timeSincePreviousFrame` that would otherwise teleport the row.
const MAX_FRAME_DELTA_MS = 100

interface MarqueeFrameClockParams {
  autoStart: boolean
  containerWidth: SharedValue<number>
  marqueeArmed: SharedValue<boolean>
  needsMarquee: SharedValue<boolean>
  needsRepeat: boolean
  /** Publishes this row's scroll phase for synced followers (mini-player subtitle). */
  publishCycle?: MarqueeCycle
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
  publishCycle,
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

  // `publishCycle` is stable for the component lifetime (a `useMarqueeCycle`
  // holder), so the worklet keeps its identity across re-renders — the frame
  // callback is not re-registered on audio-position ticks (~2/s).
  const handleFrame = useCallback(
    (frameInfo: FrameInfo) => {
      'worklet'
      if (!needsMarquee.value || !marqueeArmed.value || clockPaused.value) return

      const step = getMarqueeFrameStep({
        containerWidth: containerWidth.value,
        cycleElapsed: cycleElapsed.value,
        delta: Math.min(frameInfo.timeSincePreviousFrame ?? 0, MAX_FRAME_DELTA_MS),
        partnerLoopDistance: publishCycle?.partnerLoopDistance.value ?? 0,
        textWidth: textWidth.value,
      })

      if (!step) {
        translateX.value = 0
        return
      }

      translateX.value = step.translateX
      cycleElapsed.value = step.cycleElapsed

      // The pause → scroll transition is the cycle start followers subscribe to.
      publishMarqueePhase(
        publishCycle,
        step.scrollElapsed,
        step.scrollMs,
        step.msPerPx,
        step.started,
      )
    },
    [publishCycle],
  )

  const frameCallback = useFrameCallback(handleFrame, false)

  // JS-side lifecycle: only overflowing rows activate the frame callback, so a
  // fitting title keeps the clock fully stopped. Drag pauses flip `clockPaused`
  // on the UI thread instead, avoiding a worklet -> JS hop per gesture.
  useEffect(() => {
    frameCallback.setActive(needsRepeat)
    // A row that stops overflowing publishes no phase: followers return to rest
    // instead of freezing mid-pass at the leader's last offset.
    if (!needsRepeat) resetMarqueeCycle(publishCycle)
    return () => frameCallback.setActive(false)
  }, [frameCallback, needsRepeat, publishCycle])

  useEffect(() => {
    translateX.value = 0
    startX.value = 0
    marqueeArmed.value = autoStart
    cycleElapsed.value = 0
    clockPaused.value = !autoStart
    resetMarqueeCycle(publishCycle)
  }, [text, autoStart, publishCycle])

  // Stable identity (reads shared values only): lets `marquee-text.tsx`
  // memoize the pan gesture once per instance instead of rebuilding it.
  const startIdleMarquee = useCallback(() => {
    'worklet'
    if (!needsMarquee.value || !marqueeArmed.value) {
      // Keep the clock paused: a fitting or still-gated row stays static. Reset
      // any offset left over from a previous cycle or a scrub.
      clockPaused.value = true
      translateX.value = 0
      resetMarqueeCycle(publishCycle)
      return
    }
    cycleElapsed.value = 0
    translateX.value = 0
    clockPaused.value = false
  }, [publishCycle])

  return { clockPaused, frameCallback, startIdleMarquee }
}
