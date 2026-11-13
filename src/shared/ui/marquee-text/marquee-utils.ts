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

// The follower's contribution to the pair cycle: its measured loop distance
// (text + spacer) while it actually travels — JS-confirmed overflow with the
// duplicate copy mounted; 0 when it is static or unmeasured, so the leader
// keeps its own loop length. Pure (like getSyncedOffset) so the partner-sync
// math stays unit-testable: the jest reanimated mock cannot execute
// useAnimatedReaction, which only plumbs this into the cycle shared value.
export const getPartnerLoopDistance = (overflows: boolean, textWidth: number): number => {
  'worklet'
  return overflows && textWidth > 0 ? textWidth + REPEAT_SPACER : 0
}

// Followers (the mini-player subtitle) do not own a clock: their offset is a
// pure function of the leader's (title's) scroll phase. Both lines advance at
// the leader's constant px/ms speed, so a shorter follower reaches its own loop
// end early and holds there (its duplicate copy at the line start) until the
// pair cycle ends; the pair cycle covers the longer of the two loops, so a
// longer follower finishes its own pass before the reset. `overflowing` is the
// JS-confirmed overflow that gates the duplicate copy, so a travelling follower
// always has a copy to land on.
export const getSyncedOffset = (
  scrollElapsed: number,
  msPerPx: number,
  overflowing: boolean,
  loopDistance: number,
): number => {
  'worklet'
  if (!overflowing || msPerPx <= 0) return 0

  const travelled = Math.max(0, scrollElapsed) / msPerPx

  return -Math.min(travelled, loopDistance) || 0
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
