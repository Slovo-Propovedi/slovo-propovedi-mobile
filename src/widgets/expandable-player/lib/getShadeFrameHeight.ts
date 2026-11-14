import { getBarShadeHeight, getPillShadeHeight } from './getBarShadeHeight'

interface ShadeFrameHeightInput {
  /** 0 = detached pill above the row, 1 = pill inside the collapsed line. */
  barProgress: number
  bottomPadding: number
  /** 0 = pill visible, 1 = pill tucked behind the focused search row. */
  focusProgress: number
  fullScreenHeight: number
  hasPill: boolean
  screenWidth: number
  tabBarHeight: number
}

/**
 * Animated height of the shade box for one frame. The gradient's `height` style
 * and every bottom-anchored hole derive from this same helper, so the mask
 * stretches in lockstep with the box instead of anchoring to a settled height.
 *
 * Worklet-safe: called from the animated style and hole props.
 * @param input - Pill, focus and viewport geometry inputs.
 */
export const getShadeFrameHeight = (input: ShadeFrameHeightInput) => {
  'worklet'
  if (!input.hasPill) return getBarShadeHeight(input.barProgress, input.bottomPadding)

  return getPillShadeHeight(input)
}
