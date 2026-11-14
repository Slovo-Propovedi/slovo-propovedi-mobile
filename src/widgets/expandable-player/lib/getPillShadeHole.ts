import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry, MINI_PILL_TUCK_DISTANCE } from './getMiniPlayerGeometry'
import { EMPTY_SHADE_HOLE, type ShadeHole, type ShadeRow } from './shadeRow'

interface PillShadeInput {
  focusProgress: number
  fullScreenHeight: number
  hasPill: boolean
  /** Opacity of the tucking pill, 0..1; the cutout strength fades with it. */
  pillOpacity: number
  /** 0 = detached pill above the row, 1 = pill inside the collapsed line. */
  pillProgress: number
  screenWidth: number
  tabBarHeight: number
}

const clampProgress = (progress: number) => {
  'worklet'

  return Math.min(Math.max(progress, 0), 1)
}

/**
 * Cutout of the mini-player pill. Position, width and FULL glass height follow
 * the pill's geometry for the same pill progress; focus tucks the pill down by
 * the exact glass tuck distance, so the hole rect mirrors the glass rect on
 * every frame. The pill's fade drives the rect strength, so the cutout
 * disappears together with the glass instead of leaving a stale gradient gap.
 *
 * Worklet-safe: called from the animated hole props.
 * @param row - Islands row at the current frame.
 * @param input - Pill morph/focus progress, pill fade and viewport geometry.
 */
export const getPillShadeHole = (row: ShadeRow, input: PillShadeInput): ShadeHole => {
  'worklet'
  if (!input.hasPill) return EMPTY_SHADE_HOLE

  const focus = clampProgress(input.focusProgress)
  const pill = getMiniPlayerGeometry({
    barProgress: input.pillProgress,
    fullScreenHeight: input.fullScreenHeight,
    screenWidth: input.screenWidth,
    tabBarHeight: input.tabBarHeight,
  })
  const height = PLAYER_SIZES.miniPlayerHeight
  const visibleBottom = pill.bottom - MINI_PILL_TUCK_DISTANCE * focus

  return {
    height,
    opacity: clampProgress(input.pillOpacity),
    width: pill.width,
    x: pill.left,
    y: row.shadeHeight - (visibleBottom + height),
  }
}
