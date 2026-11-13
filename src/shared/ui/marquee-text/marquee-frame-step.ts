import {
  MARQUEE_MS_PER_PX,
  MARQUEE_MS_PER_PX_NARROW,
  MARQUEE_PAUSE,
  NARROW_WIDTH_THRESHOLD,
  REPEAT_SPACER,
} from './marquee-utils'

interface MarqueeFrameStep {
  cycleElapsed: number
  /** Speed of the scrolling phase; 0 during the pause. */
  msPerPx: number
  /** Milliseconds into the scroll phase; 0 during the pause. */
  scrollElapsed: number
  /** Scroll-phase duration; 0 during the pause. */
  scrollMs: number
  /** True on the pause → scroll transition (a follower-visible cycle start). */
  started: boolean
  translateX: number
}

interface MarqueeFrameStepInput {
  containerWidth: number
  /** Milliseconds into the current cycle (pause + scroll). */
  cycleElapsed: number
  delta: number
  /** Partner (follower) loop distance in px; 0 when unknown, static, or not synced. */
  partnerLoopDistance?: number
  textWidth: number
}

// One frame of the marquee clock as pure math: the frame worklet only applies
// the result to shared values. Kept separate from the hook so the phase logic
// stays under the line budget and is easy to reason about.
export const getMarqueeFrameStep = ({
  containerWidth,
  cycleElapsed,
  delta,
  partnerLoopDistance = 0,
  textWidth,
}: MarqueeFrameStepInput): MarqueeFrameStep | null => {
  'worklet'
  const loopDistance = textWidth + REPEAT_SPACER
  const msPerPx =
    containerWidth < NARROW_WIDTH_THRESHOLD ? MARQUEE_MS_PER_PX_NARROW : MARQUEE_MS_PER_PX
  // The pair cycle lasts the LONGER line's pass: the shorter one finishes and
  // holds at its line start while its partner completes.
  const totalLoopDistance = Math.max(loopDistance, partnerLoopDistance)
  const scrollMs = totalLoopDistance * msPerPx

  if (scrollMs <= 0) return null

  const elapsed = cycleElapsed + delta

  if (elapsed <= MARQUEE_PAUSE)
    return {
      cycleElapsed: elapsed,
      msPerPx: 0,
      scrollElapsed: 0,
      scrollMs: 0,
      started: false,
      translateX: 0,
    }

  const scrolled = Math.min(elapsed - MARQUEE_PAUSE, scrollMs)
  const started = cycleElapsed <= MARQUEE_PAUSE

  // Cycle end: jump-cut to the pause state (rather than easing back) so the
  // duplicate copy lands exactly where the loop restarts, with no reverse
  // motion; the next cycle begins with its own MARQUEE_PAUSE.
  if (scrolled >= scrollMs)
    return { cycleElapsed: 0, msPerPx: 0, scrollElapsed: 0, scrollMs: 0, started, translateX: 0 }

  return {
    cycleElapsed: elapsed,
    msPerPx,
    scrollElapsed: scrolled,
    scrollMs,
    started,
    // Constant px/ms speed. Once the own pass is complete the row holds at its
    // line start (the duplicate copy sits at 0) while a longer partner finishes.
    translateX: -Math.min(scrolled / msPerPx, loopDistance),
  }
}
