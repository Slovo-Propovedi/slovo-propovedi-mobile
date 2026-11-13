import { BAR_CIRCLE_SIZE, BAR_OUTER_GAP } from 'shared/ui/layout'
import { type ShadeHole, type ShadeRow, toShadeHole } from './shadeRow'

/**
 * Cutouts for the search frame and its external close circle. The geometry
 * mirrors `widgets/search-island`'s settled branch; it is re-derived here
 * because widgets cannot import each other's internals.
 * @param row - Settled islands row the search chrome lives in.
 * @param input - Search morph state and viewport width.
 * @param input.hasClose - The external ✕ is on screen.
 * @param input.isFocused - The field is focused, so the pill owns the row edge.
 * @param input.isSearchVisible - Whether the search field occupies the row.
 * @param input.screenWidth - Current viewport width.
 */
export const getSearchShadeHoles = (
  row: ShadeRow,
  {
    hasClose,
    isFocused,
    isSearchVisible,
    screenWidth,
  }: {
    hasClose: boolean
    isFocused: boolean
    isSearchVisible: boolean
    screenWidth: number
  },
): ShadeHole[] => {
  const slot = BAR_CIRCLE_SIZE + BAR_OUTER_GAP

  // Closed, the search frame is the circle at the row's right inner edge.
  if (!isSearchVisible)
    return [toShadeHole(row, row.innerLeft + row.innerWidth - row.height, row.height)]

  // Open, it starts right of the active-tab circle, or at the row edge once the
  // focused field retracts that circle.
  const left = isFocused ? row.innerLeft : row.innerLeft + slot
  const width = row.innerWidth - (isFocused ? 0 : slot) - (hasClose ? slot : 0)
  const holes = [toShadeHole(row, left, width)]

  if (hasClose) holes.push(toShadeHole(row, screenWidth - row.innerLeft - row.height, row.height))

  return holes
}
