import {
  BAR_CIRCLE_SIZE,
  BAR_OUTER_GAP,
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

/** Islands row at a given island progress, expressed inside the shade box. */
export interface ShadeRow {
  /** Distance from the screen bottom to the row's bottom edge. */
  bottom: number
  height: number
  innerLeft: number
  innerWidth: number
  shadeHeight: number
}

/** A close circle plus the outer gap the pill yields to it. */
export const SEARCH_SLOT_WIDTH = BAR_CIRCLE_SIZE + BAR_OUTER_GAP

/** A slot that is not on screen cuts nothing. */
export const EMPTY_SHADE_HOLE: ShadeHole = { height: 0, width: 0, x: 0, y: 0 }

const clampProgress = (progress: number) => {
  'worklet'

  return Math.min(Math.max(progress, 0), 1)
}

/**
 * Islands row geometry at a frame of the island morph. Unlike the boolean
 * settled row it replaces, height/bottom are continuous, so a hole anchored to
 * this row never jumps while the glass is mid-morph.
 *
 * Worklet-safe: called from the animated hole props.
 * @param input - Island morph progress and the shade box geometry.
 * @param input.islandProgress - 0 = expanded 76dp row, 1 = collapsed 64dp row.
 * @param input.screenWidth - Current viewport width.
 * @param input.shadeHeight - Animated shade height the hole is anchored in.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getShadeRow = ({
  islandProgress,
  screenWidth,
  shadeHeight,
  tabBarHeight,
}: {
  islandProgress: number
  screenWidth: number
  shadeHeight: number
  tabBarHeight: number
}): ShadeRow => {
  'worklet'
  const progress = clampProgress(islandProgress)
  const height =
    TAB_BAR_ISLAND_HEIGHT_EXPANDED +
    (TAB_BAR_ISLAND_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED) * progress
  const innerLeft = getColumnSideInset(screenWidth, 0, CONTENT_COLUMN_WIDTH) + BAR_SIDE_INSET
  const innerWidth = Math.min(screenWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2

  return {
    bottom: tabBarHeight - (BAR_ROW_MIN_HEIGHT + height) / 2,
    height,
    innerLeft,
    innerWidth,
    shadeHeight,
  }
}

/**
 * Bottom-anchored rect of the shade box from a row-anchored left/width/height.
 *
 * Worklet-safe: called from the animated hole props.
 * @param row - Islands row at the current frame.
 * @param x - Left edge in screen coordinates.
 * @param width - Hole width.
 * @param height - Hole height; defaults to the row height.
 */
export const toShadeHole = (
  row: ShadeRow,
  x: number,
  width: number,
  height = row.height,
): ShadeHole => {
  'worklet'

  return { height, width, x, y: row.shadeHeight - (row.bottom + height) }
}
