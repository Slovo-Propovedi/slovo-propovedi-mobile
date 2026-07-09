export const clampMarqueeOffset = (value: number, maxOffset: number): number => {
  'worklet'
  return Math.max(-maxOffset, Math.min(0, value)) || 0
}

export const shouldMarquee = (
  textLength: number,
  maxOffset: number,
  animationThreshold: number,
): boolean => {
  'worklet'
  return maxOffset > 0 && textLength > animationThreshold
}

export const HOLD_MS = 250

export const MARQUEE_MS_PER_PX = 18

export const MARQUEE_MS_PER_PX_NARROW = 33

export const MARQUEE_PAUSE = 2000

export const NARROW_WIDTH_THRESHOLD = 200

export const REPEAT_SPACER = 50
