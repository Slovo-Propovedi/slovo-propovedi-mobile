import {
  BAR_BOTTOM_INSET_MIN,
  BAR_PILL_ROW_GAP,
  BAR_ROW_MIN_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { getExpandedRestingBottom } from './getExpandedRestingBottom'

describe('getExpandedRestingBottom', () => {
  test('sits one pill-row gap above the expanded island top', () => {
    const paddingBottom = 34
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
    const islandTop = paddingBottom + TAB_BAR_ISLAND_HEIGHT_EXPANDED

    // 34 bottom padding + 60 expanded island height (TAB_BAR_ISLAND_HEIGHT_EXPANDED).
    expect(islandTop).toBe(94)
    expect(getExpandedRestingBottom(tabBarHeight) - islandTop).toBe(BAR_PILL_ROW_GAP)
  })

  test('wide layout: rests on the screen bottom edge, ignoring the top tab row', () => {
    // The tab island is at the top in wide, so the measured row height is not a
    // reference for the bottom pill at all.
    expect(getExpandedRestingBottom(98, true)).toBe(BAR_BOTTOM_INSET_MIN)
    expect(getExpandedRestingBottom(98, true, true)).toBe(25)
  })
})
