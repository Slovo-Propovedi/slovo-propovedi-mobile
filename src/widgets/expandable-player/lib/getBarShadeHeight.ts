import {
  BAR_ROW_MIN_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'

// The shade top ends this far above the chrome top so the ramp never lands a
// hard edge on the glass rim.
export const SHADE_TOP_OVERSCAN_PX = 10

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
