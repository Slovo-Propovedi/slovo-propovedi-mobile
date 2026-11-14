import { BAR_CIRCLE_SIZE, BAR_CIRCLE_SIZE_EXPANDED, BAR_OUTER_GAP } from 'shared/ui/layout'
import { type ShadeHole, type ShadeRow, toShadeHole } from './shadeRow'

const clampProgress = (progress: number) => {
  'worklet'

  return Math.min(Math.max(progress, 0), 1)
}

/**
 * Cutout of the tab island, mirroring `getIslandStyle`: the width morphs from
 * the expanded row span to the 64dp circle and is multiplied by focus, because
 * focus fades the glass island out while its width reaches zero. Height keeps
 * the island's morph (focus does not change the glass height; the zero-width
 * hole already cuts nothing).
 *
 * Worklet-safe: called from the animated hole props.
 * @param row - Islands row at the current frame.
 * @param input - Focus progress and whether the row hosts search chrome.
 * @param input.focusProgress - 0 = island at rest, 1 = focused and width 0.
 * @param input.hasSearch - Whether the row hosts the search chrome.
 * @param input.islandProgress - 0 = expanded row, 1 = collapsed circle.
 */
export const getIslandShadeHole = (
  row: ShadeRow,
  {
    focusProgress,
    hasSearch,
    islandProgress,
  }: { focusProgress: number; hasSearch: boolean; islandProgress: number },
): ShadeHole => {
  'worklet'
  const progress = clampProgress(islandProgress)
  const focus = clampProgress(focusProgress)
  const expandedWidth = Math.max(
    BAR_CIRCLE_SIZE_EXPANDED,
    hasSearch ? row.innerWidth - BAR_CIRCLE_SIZE_EXPANDED - BAR_OUTER_GAP : row.innerWidth,
  )
  const width = (BAR_CIRCLE_SIZE + (expandedWidth - BAR_CIRCLE_SIZE) * (1 - progress)) * (1 - focus)

  return toShadeHole(row, row.innerLeft, width, row.height)
}
