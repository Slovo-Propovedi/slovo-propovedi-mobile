import {
  BAR_ROW_MIN_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

// The shade top ends this far above the chrome top so the ramp never lands a
// hard edge on the glass rim.
export const SHADE_TOP_OVERSCAN_PX = 10

/**
 * Ramp zone: the shade top down to the pill's vertical middle (overscan plus the
 * pill's upper half). The single gradient keeps full opacity from there down.
 */
export const SHADE_CAP_HEIGHT_PX = SHADE_TOP_OVERSCAN_PX + PLAYER_SIZES.miniPlayerHeight / 2

// The stops must stay strictly increasing: a clamped ratio keeps the gradient
// continuous even if a degenerate shade height ever reaches the helper.
const CAP_RATIO_MIN = 0.01
const CAP_RATIO_MAX = 0.99

/**
 * Shade height while a mini pill is visible: from the pill bottom down past the
 * pill height and the overscan above its top.
 *
 * Worklet-safe: called from Reanimated animated styles.
 * @param bottom - Mini-pill bottom edge (see `getMiniPlayerGeometry`).
 */
const getShadeHeight = (bottom: number) => {
  'worklet'
  return bottom + PLAYER_SIZES.miniPlayerHeight + SHADE_TOP_OVERSCAN_PX
}

/**
 * Locations of the shade's single continuous gradient: transparent at the shade
 * top, fully opaque at the pill's vertical middle, constant to the bottom.
 *
 * Pure helper, not a worklet: the component recomputes it only when the settled
 * geometry commits, so the stops never fight the animated height. During the
 * 300 ms morph the ramp endpoint drifts at most a few pixels.
 * @param settledShadeHeight - Shade height at the settled bar/expand state.
 */
export const getShadeLocations = (
  settledShadeHeight: number,
): readonly [number, number, number] => {
  const capRatio = SHADE_CAP_HEIGHT_PX / settledShadeHeight

  return [0, Math.min(Math.max(capRatio, CAP_RATIO_MIN), CAP_RATIO_MAX), 1]
}

/**
 * Shade height while no mini pill is visible: the ramp rises from the screen
 * bottom to the top of the islands (tab island / search circle / open search
 * pill share the row top) plus the overscan.
 *
 * The row is `BAR_ROW_MIN_HEIGHT + bottomPadding` tall with the islands centered
 * in its content box, so the island top sits `(BAR_ROW_MIN_HEIGHT − island) / 2`
 * below the row top. The island height morphs 76 ⇄ 64 with the bar progress, so
 * the no-pill shade follows the collapse as well.
 *
 * Worklet-safe: called from Reanimated animated styles.
 * @param barProgress - 0 = expanded bar, 1 = collapsed bar.
 * @param bottomPadding - Row bottom padding (`max(insets.bottom, BAR_BOTTOM_INSET_MIN)`).
 */
export const getBarShadeHeight = (barProgress: number, bottomPadding: number) => {
  'worklet'
  const progress = Math.min(Math.max(barProgress, 0), 1)
  const islandHeight =
    TAB_BAR_ISLAND_HEIGHT_EXPANDED +
    (TAB_BAR_ISLAND_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED) * progress
  const islandTopGap = (BAR_ROW_MIN_HEIGHT - islandHeight) / 2

  return BAR_ROW_MIN_HEIGHT + bottomPadding - islandTopGap + SHADE_TOP_OVERSCAN_PX
}

interface PillShadeHeightInput {
  barProgress: number
  bottomPadding: number
  focusProgress: number
  fullScreenHeight: number
  screenWidth: number
  tabBarHeight: number
}

/**
 * Shade height with a mini pill, retracting to the islands-row height as the
 * search field gains focus and the pill tucks under the row.
 *
 * Worklet-safe: called from Reanimated animated styles.
 * @param input - Pill, row and focus geometry inputs.
 * @param input.barProgress - 0 = expanded bar, 1 = collapsed bar.
 * @param input.bottomPadding - Row bottom padding (max(inset, minimum inset)).
 * @param input.focusProgress - 0 = pill visible, 1 = pill tucked/focused.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.screenWidth - Current window width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getPillShadeHeight = ({
  barProgress,
  bottomPadding,
  focusProgress,
  fullScreenHeight,
  screenWidth,
  tabBarHeight,
}: PillShadeHeightInput) => {
  'worklet'
  const rowHeight = getBarShadeHeight(barProgress, bottomPadding)
  const { bottom } = getMiniPlayerGeometry({
    barProgress,
    fullScreenHeight,
    screenWidth,
    tabBarHeight,
  })
  const pillHeight = getShadeHeight(bottom)
  const focus = Math.min(Math.max(focusProgress, 0), 1)

  return pillHeight + (rowHeight - pillHeight) * focus
}
