import { INDENTS, MIN_TOUCH_TARGET } from 'shared/ui/theme'

export const RESULTS_TRANSITION_DURATION_MS = 260

// Fixed starting heights keep the fold measurable without a layout pass: the
// title row's min height, the scope row (48 track + 4/8 paddings), the category
// row (36 pill + 4/4 row paddings).
const CATEGORY_PILL_HEIGHT = 36
const TITLE_BLOCK_HEIGHT = MIN_TOUCH_TARGET
const SCOPE_BLOCK_HEIGHT = MIN_TOUCH_TARGET + INDENTS.lowest + INDENTS.low
const CATEGORY_ROW_HEIGHT = CATEGORY_PILL_HEIGHT + 2 * INDENTS.lowest
// The pills wait until the title has mostly folded, then rise into its place.
const CATEGORIES_REVEAL_START = 0.55
const CATEGORIES_RISE = INDENTS.low

interface TransitionStyles {
  categories: { height: number; opacity: number; transform: [{ translateY: number }] }
  scope: { height: number; opacity: number }
  title: { height: number; opacity: number }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Maps the shared results progress (0 = home, 1 = results) to the page chrome
 * geometry: the title and scope fold away first, then the category row unfolds
 * below the field.
 * @param progress - Shared 0→1 results progress.
 */
export const getResultsTransitionStyles = (progress: number): TransitionStyles => {
  const fold = clamp01(progress)
  const reveal = clamp01((progress - CATEGORIES_REVEAL_START) / (1 - CATEGORIES_REVEAL_START))

  return {
    categories: {
      height: CATEGORY_ROW_HEIGHT * reveal,
      opacity: reveal,
      transform: [{ translateY: (1 - reveal) * -CATEGORIES_RISE }],
    },
    scope: { height: SCOPE_BLOCK_HEIGHT * (1 - fold), opacity: 1 - fold },
    title: { height: TITLE_BLOCK_HEIGHT * (1 - fold), opacity: 1 - fold },
  }
}
