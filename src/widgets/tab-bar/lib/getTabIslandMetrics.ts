import {
  BAR_CIRCLE_SIZE_EXPANDED,
  BAR_SIDE_INSET_EXPANDED,
  CONTENT_COLUMN_WIDTH,
} from 'shared/ui/layout'
import { getWideIslandWidth, ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'

interface TabIslandMetricsInput {
  baseWidth: number
  hideSearch: boolean
  /** Wide layout pins the island open and hugs its per-kind slot widths. */
  isForceExpanded: boolean
  routeCount: number
}

/**
 * Render-time island metrics derived from the frozen layout base.
 *
 * The row is exactly the base width capped to the content column (`width:
 * '100%'` in a full-width container with `maxWidth`), so it needs no onLayout
 * round-trip: deriving the widths here keeps the island on the same commit as
 * the (natively re-centred) row. The animated style mirrors
 * `expandedIslandWidth` in a shared value because a worklet closure
 * re-registers after the commit.
 * @param input - Layout mode, visible tabs and the frozen layout base.
 * @param input.hideSearch - Whether the search slot is hidden (admin layouts).
 * @param input.isForceExpanded - Whether the wide layout pins the expanded pose.
 * @param input.routeCount - Visible routed tabs.
 * @param input.baseWidth - Frozen layout base (window short side on native).
 */
export const getTabIslandMetrics = ({
  baseWidth,
  hideSearch,
  isForceExpanded,
  routeCount,
}: TabIslandMetricsInput) => {
  // Both layouts fold search into the island: wide always, compact while
  // expanded. Wide pins the island open and hugs its per-kind slot widths
  // (Apple Music iPad pill); the search button is a slot in both.
  const expandedSlotCount = routeCount + (hideSearch ? 0 : 1)
  // The expanded island follows the expanded side inset; the collapsed circle
  // takes its diameter from the island height and the row's padding.
  const rowContentWidth = Math.min(baseWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET_EXPANDED * 2
  const expandedIslandWidth = isForceExpanded
    ? getWideIslandWidth(routeCount, !hideSearch)
    : Math.max(BAR_CIRCLE_SIZE_EXPANDED, rowContentWidth)
  // Compact: every slot gets an equal share of the island minus its padding.
  const compactSlotWidth =
    (expandedIslandWidth - ISLAND_CONTENT_PADDING_HORIZONTAL * 2) / Math.max(expandedSlotCount, 1)

  return { compactSlotWidth, expandedIslandWidth }
}
