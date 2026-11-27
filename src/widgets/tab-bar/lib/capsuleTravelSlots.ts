import { getSlotRects } from './capsuleTravel'
import { ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'
import { SEARCH_ROUTE_NAME } from './getVisibleTabRoutes'

interface CapsuleSlotLayout {
  hideSearch: boolean
  searchWidth: number
  tabCount: number
  tabWidth: number
}

// Width of every slot, in the one slot order the travel uses everywhere.
const getSlotWidths = (layout: CapsuleSlotLayout) => {
  const { hideSearch, searchWidth, tabCount, tabWidth } = layout
  const widths = Array.from({ length: tabCount }, () => tabWidth)

  if (!hideSearch) widths.push(searchWidth)

  return widths
}

/**
 * Route key of every slot in the one numeric ordering the travel uses in BOTH
 * directions: the routed tabs take 0..n-1 and the trailing search slot is n.
 * A start and a destination index therefore always name the same slot.
 * @param tabRouteKeys - Routed tab keys, in slot order.
 * @param hideSearch - Admin layouts have no search slot.
 */
export const getCapsuleSlotKeys = (tabRouteKeys: readonly string[], hideSearch: boolean) => {
  const keys = [...tabRouteKeys]

  if (!hideSearch) keys.push(SEARCH_ROUTE_NAME)

  return keys
}

/**
 * Per-slot capsule rects derived from the per-kind widths in the same ordering
 * as {@link getCapsuleSlotKeys}, so the geometry and the indices never drift.
 * @param layout - Slot widths, counts and the search visibility.
 */
export const getCapsuleSlotRects = (layout: CapsuleSlotLayout) =>
  getSlotRects(getSlotWidths(layout), ISLAND_CONTENT_PADDING_HORIZONTAL)
