import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry, MINI_PILL_TUCK_DISTANCE } from './getMiniPlayerGeometry'
import { EMPTY_SHADE_HOLE, type ShadeHole, type ShadeRow } from './shadeRow'

interface PillShadeInput {
  focusProgress: number
  fullScreenHeight: number
  hasPill: boolean
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
 * Cutout of the mini-player pill. Position and width follow the pill's glass
 * geometry for the same pill progress; focus tucks the pill down by the exact
 * glass tuck distance while the hole height collapses, so the tucked pill never
 * leaves a sliver of gradient behind.
 *
 * Worklet-safe: called from the animated hole props.
 * @param row - Islands row at the current frame.
 * @param input - Pill morph/focus progress and viewport geometry.
 */
export const getPillShadeHole = (row: ShadeRow, input: PillShadeInput): ShadeHole => {
  'worklet'
  if (!input.hasPill) return EMPTY_SHADE_HOLE

  const focus = clampProgress(input.focusProgress)
  const height = PLAYER_SIZES.miniPlayerHeight * (1 - focus)

  if (height <= 0) return EMPTY_SHADE_HOLE

  const pill = getMiniPlayerGeometry({
    barProgress: input.pillProgress,
    fullScreenHeight: input.fullScreenHeight,
    screenWidth: input.screenWidth,
    tabBarHeight: input.tabBarHeight,
  })
  const visibleBottom = pill.bottom - MINI_PILL_TUCK_DISTANCE * focus

  return {
    height,
    width: pill.width,
    x: pill.left,
    y: row.shadeHeight - (visibleBottom + height),
  }
}
