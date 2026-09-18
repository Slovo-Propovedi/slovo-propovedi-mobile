export const DRAG_ACTIVATION_THRESHOLD_PX = 3

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

// A click that follows a marquee pan drag must be swallowed on web: the
// browser still dispatches `click` on the gesture view after the drag, and it
// would bubble to the parent pressable and navigate. Native RNGH cancels the
// parent press on activation; this restores that behavior on web.
export const shouldSwallowClick = (didDrag: boolean): boolean => didDrag

// The marquee loop only starts after the user actually dragged the title once
// (a long-press without movement must not arm it). The pan-end translation is
// the total gesture distance; anything below the threshold is finger jitter.
export const shouldArmMarquee = (translationX: number): boolean => {
  'worklet'
  return Math.abs(translationX) >= DRAG_ACTIVATION_THRESHOLD_PX
}
