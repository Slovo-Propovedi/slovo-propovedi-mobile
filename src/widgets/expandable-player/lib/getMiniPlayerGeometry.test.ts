import {
  BAR_BOTTOM_INSET_MIN,
  BAR_CIRCLE_SIZE_EXPANDED,
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_PILL_ROW_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  getColumnSideInset,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

const SCREEN_HEIGHT = 800
const SCREEN_WIDTH = 400

const geometryAt = (tabBarHeight: number, barProgress = 0) =>
  getMiniPlayerGeometry({
    barProgress,
    fullScreenHeight: SCREEN_HEIGHT,
    screenWidth: SCREEN_WIDTH,
    tabBarHeight,
  })

// Independent model of the real islands row: a fixed content box whose bottom
// edge sits on the bottom safe-area padding line, with the islands flush
// against it.
const islandTopFromScreenBottom = (paddingBottom: number) =>
  paddingBottom + TAB_BAR_ISLAND_HEIGHT_EXPANDED
const islandBottomFromScreenBottom = (paddingBottom: number) => paddingBottom

describe('getMiniPlayerGeometry', () => {
  test('measured 88dp row with 12dp bottom padding: pill rests one pill-row gap above the 80dp island top', () => {
    const paddingBottom = BAR_BOTTOM_INSET_MIN
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
    const { bottom } = geometryAt(tabBarHeight)

    expect(islandTopFromScreenBottom(paddingBottom)).toBe(80)
    expect(bottom).toBe(tabBarHeight - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_PILL_ROW_GAP)
    expect(bottom - islandTopFromScreenBottom(paddingBottom)).toBe(BAR_PILL_ROW_GAP)
  })

  test.each([0, BAR_BOTTOM_INSET_MIN, 44])(
    'expanded pill keeps exactly BAR_PILL_ROW_GAP above the island top (bottom padding %i)',
    paddingBottom => {
      const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
      const { bottom } = geometryAt(tabBarHeight)

      expect(bottom - islandTopFromScreenBottom(paddingBottom)).toBe(BAR_PILL_ROW_GAP)
    },
  )

  test.each([0, BAR_BOTTOM_INSET_MIN, 44])(
    'collapsed pill keeps its bottom aligned with the islands (bottom padding %i)',
    paddingBottom => {
      const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
      const { bottom } = geometryAt(tabBarHeight, 1)

      expect(bottom).toBe(islandBottomFromScreenBottom(paddingBottom))
    },
  )

  test('settled geometry: the pill floats BAR_PILL_ROW_GAP above the island and spans the row inner edges', () => {
    const paddingBottom = BAR_BOTTOM_INSET_MIN
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
    const { bottom, left, width } = geometryAt(tabBarHeight)

    // Independent model of the expanded islands row: the tab island and the
    // search circle split the row's inner width with one outer gap between them.
    const rowLeft = getColumnSideInset(SCREEN_WIDTH, 0, CONTENT_COLUMN_WIDTH)
    const rowContentWidth = Math.min(SCREEN_WIDTH, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2
    const islandWidth = rowContentWidth - BAR_CIRCLE_SIZE_EXPANDED - BAR_OUTER_GAP
    const horizontalGap = rowContentWidth - (islandWidth + BAR_CIRCLE_SIZE_EXPANDED)
    const verticalGap = bottom - islandTopFromScreenBottom(paddingBottom)

    // Apple Music reference (Issue #153): the pill floats with a wider vertical
    // gap than the horizontal gap between the island and the search circle.
    expect(horizontalGap).toBe(BAR_OUTER_GAP)
    expect(verticalGap).toBe(BAR_PILL_ROW_GAP)

    // The pill spans exactly the row's inner edges, so its left/right insets
    // match the island's and the search circle's.
    expect(left).toBe(rowLeft + BAR_SIDE_INSET)
    expect(width).toBe(rowContentWidth)
  })

  test('interpolates the bottom between the two resting forms', () => {
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN
    const expanded = geometryAt(tabBarHeight, 0)
    const collapsed = geometryAt(tabBarHeight, 1)
    const halfway = geometryAt(tabBarHeight, 0.5)

    expect(halfway.bottom).toBeCloseTo((expanded.bottom + collapsed.bottom) / 2)
    expect(halfway.top).toBe(SCREEN_HEIGHT - halfway.bottom - halfway.height)
  })

  test('grows from the compact pill to the islands height as the bar collapses', () => {
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN

    expect(geometryAt(tabBarHeight, 0).height).toBe(PLAYER_SIZES.miniPlayerHeight)
    expect(geometryAt(tabBarHeight, 1).height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(geometryAt(tabBarHeight, 0.5).height).toBe(
      (PLAYER_SIZES.miniPlayerHeight + TAB_BAR_ISLAND_HEIGHT) / 2,
    )
  })
})
