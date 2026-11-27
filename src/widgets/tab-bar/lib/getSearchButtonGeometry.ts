import { getSearchIslandGeometry } from 'widgets/search-island/@x/morph'
import { BAR_SIDE_INSET_EXPANDED, CONTENT_COLUMN_WIDTH, getColumnSideInset } from 'shared/ui/layout'
import { clampProgress, getIslandHeight, interpolateSize } from './getIslandMath'
import { ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'

interface SearchButtonGeometry {
  bottom: number
  height: number
  left: number
  /** Inset from the centred column's right edge (the native host's frame). */
  right: number
  width: number
}

interface SearchButtonGeometryInput {
  /** Chrome content width the slots are sized from; defaults to `screenWidth`. */
  contentWidth?: number
  /** Expanded width of the search slot inside the compact island. */
  expandedSearchWidth: number
  /** Expanded width of one routed tab slot (the search slot trails them). */
  expandedTabWidth: number
  oneLineProgress: number
  /** Visible routed tabs; the search slot follows them. */
  routeCount: number
  screenWidth: number
  /** 0 = resting in the island slot, 1 = the detached search circle. */
  separation: number
  tabBarHeight: number
}

/**
 * Rect of the compact search button as it tears off the tab island.
 *
 * The element is ONE node interpolated between two anchors: the in-island
 * search slot (expanded row: row inner left + content padding + the routed tab
 * shares) and the closed search circle at the row's inner right edge (the same
 * geometry the mini pill clears). Interpolating `left`/`width`/`height` keeps
 * the button visible the whole way, so it detaches instead of fading in at the
 * circle. Both anchors share the circle's bottom line.
 *
 * Worklet-safe: called from the moving button's animated style.
 * @param input - Layout anchors, morph axes and screen geometry.
 * @param input.expandedSearchWidth - Expanded width of the search slot.
 * @param input.expandedTabWidth - Expanded width of one routed tab slot.
 * @param input.contentWidth - Width the slots are sized from; defaults to `screenWidth`.
 * @param input.oneLineProgress - 0 = expanded bar, 1 = one-line bar (circle diameter).
 * @param input.routeCount - Visible routed tabs before the search slot.
 * @param input.screenWidth - Current viewport width.
 * @param input.separation - 0 = in-island slot, 1 = separate circle.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getSearchButtonGeometry = ({
  contentWidth,
  expandedSearchWidth,
  expandedTabWidth,
  oneLineProgress,
  routeCount,
  screenWidth,
  separation: separationProgress,
  tabBarHeight,
}: SearchButtonGeometryInput): SearchButtonGeometry => {
  'worklet'
  const separation = clampProgress(separationProgress)
  const oneLine = clampProgress(oneLineProgress)
  const columnWidth = Math.min(contentWidth ?? screenWidth, CONTENT_COLUMN_WIDTH)
  // The expanded slot sits in the island's content box: the centred column,
  // its expanded side inset, the island content padding and the routed tabs.
  const rowLeft = getColumnSideInset(screenWidth, 0, columnWidth)
  const slotLeft =
    rowLeft +
    BAR_SIDE_INSET_EXPANDED +
    ISLAND_CONTENT_PADDING_HORIZONTAL +
    routeCount * expandedTabWidth
  const slotHeight = getIslandHeight(oneLine)
  const circle = getSearchIslandGeometry({
    closeProgress: 0,
    contentWidth,
    focusProgress: 0,
    oneLineProgress: oneLine,
    openProgress: 0,
    screenWidth,
    tabBarHeight,
  })

  const height = interpolateSize(slotHeight, circle.height, separation)
  const left = interpolateSize(slotLeft, circle.left, separation)
  const width = interpolateSize(expandedSearchWidth, circle.width, separation)

  return {
    bottom: circle.bottom,
    height,
    left,
    // Right inset inside the centred column: the native host IS that column, so
    // Yoga positions the circle and a rotation cannot leave it on a stale
    // live-window left while the islands row already re-centred.
    right: columnWidth - (left - rowLeft) - width,
    width,
  }
}
