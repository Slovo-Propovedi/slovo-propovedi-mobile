const DRAG_ACTIVATION_THRESHOLD_PX = 3

export const HOLD_MS = 250

export const MARQUEE_MS_PER_PX = 18

export const MARQUEE_MS_PER_PX_NARROW = 33

export const MARQUEE_PAUSE = 2000

export const NARROW_WIDTH_THRESHOLD = 200

export const REPEAT_SPACER = 50

export const clampMarqueeOffset = (value: number, maxOffset: number): number => {
  'worklet'
  return Math.max(-maxOffset, Math.min(0, value)) || 0
}

// Sub-pixel guard: the measured text width (max-content on web, first-line
// width on native) can exceed the container by a fraction of a pixel for text
// that visually fits (font rounding between measurement and render). Overflow
// at or below the epsilon is treated as fitting — the title stays static and
// is hard-clipped by the container instead of scrolling.
export const MARQUEE_EPSILON_PX = 1

// Marquee eligibility is purely geometric: a title marquees when its measured
// width exceeds the container by more than the epsilon (maxOffset > EPSILON).
// Character length is a bad proxy for overflow — a short-but-wide title (long
// words, bold font) overflows with few characters, and a long title can fit a
// wide container.
export const shouldMarquee = (maxOffset: number): boolean => {
  'worklet'
  return maxOffset > MARQUEE_EPSILON_PX
}

// Followers (the mini-player subtitle) do not own a clock: their offset is a
// pure function of the leader's (title's) scroll phase, so both lines start
// together, both rest during the leader's pause, and a follower pass always
// ends exactly at the leader's cycle boundary. One pass per leader cycle,
// time-normalized to the leader's duration, so the follower never overruns it.
export const getSyncedOffset = (
  scrollElapsed: number,
  scrollMs: number,
  overflowing: boolean,
  loopDistance: number,
): number => {
  'worklet'
  if (!overflowing || scrollMs <= 0) return 0

  const progress = Math.min(1, Math.max(0, scrollElapsed / scrollMs))

  return -progress * loopDistance || 0
}

// A click that follows a marquee pan drag must be swallowed on web: the
// browser still dispatches `click` on the gesture view after the drag, and it
// would bubble to the parent pressable and navigate. Native RNGH cancels the
// parent press on activation; this restores that behavior on web.
export const shouldSwallowClick = (didDrag: boolean): boolean => didDrag

// The pan-end translation is the total gesture distance. A slow click (held
// ≥ HOLD_MS, zero movement) activates the pan but is not a drag; anything below
// the threshold is finger jitter, so the click stays alive. A real drag keeps
// the post-drag click guard armed and (re)starts the marquee loop.
export const isRealDrag = (translationX: number): boolean => {
  'worklet'
  return Math.abs(translationX) >= DRAG_ACTIVATION_THRESHOLD_PX
}
