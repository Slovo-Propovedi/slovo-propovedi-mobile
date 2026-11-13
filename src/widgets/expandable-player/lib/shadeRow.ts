import {
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  getColumnSideInset,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'

/** Rounded cutout of the shade, in the shade box's top-left coordinate space. */
export interface ShadeHole {
  height: number
  width: number
  x: number
  y: number
}

/** Settled islands row: the strip the tab island and search frame share. */
export interface ShadeRow {
  bottom: number
  collapsed: boolean
  height: number
  innerLeft: number
  innerWidth: number
  shadeHeight: number
}

/**
 * Settled geometry of the islands row inside the measured tab row. A visible
 * search field forces the collapsed row even before the bar itself collapses:
 * the row then reads [active-tab circle][field].
 * @param input - Row state and the measured tab row.
 * @param input.barCollapsed - Settled bar morph (0 expanded, 1 collapsed).
 * @param input.isSearchVisible - Whether the search field occupies the row.
 * @param input.screenWidth - Current viewport width.
 * @param input.shadeHeight - Settled shade height the holes are anchored in.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getShadeRow = ({
  barCollapsed,
  isSearchVisible,
  screenWidth,
  shadeHeight,
  tabBarHeight,
}: {
  barCollapsed: boolean
  isSearchVisible: boolean
  screenWidth: number
  shadeHeight: number
  tabBarHeight: number
}): ShadeRow => {
  const collapsed = barCollapsed || isSearchVisible
  const height = collapsed ? TAB_BAR_ISLAND_HEIGHT : TAB_BAR_ISLAND_HEIGHT_EXPANDED
  const innerLeft = getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH) + BAR_SIDE_INSET
  const innerWidth = Math.min(screenWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2

  return {
    bottom: tabBarHeight - (BAR_ROW_MIN_HEIGHT + height) / 2,
    collapsed,
    height,
    innerLeft,
    innerWidth,
    shadeHeight,
  }
}

/**
 * Bottom-anchored rect of the shade box from a row-anchored left/width/height.
 * @param row - Settled islands row the hole belongs to.
 * @param x - Left edge in screen coordinates.
 * @param width - Hole width.
 * @param height - Hole height; defaults to the row height.
 */
export const toShadeHole = (
  row: ShadeRow,
  x: number,
  width: number,
  height = row.height,
): ShadeHole => ({
  height,
  width,
  x,
  y: row.shadeHeight - (row.bottom + height),
})
