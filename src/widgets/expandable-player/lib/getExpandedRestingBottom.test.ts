import {
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

    expect(islandTop).toBe(paddingBottom + TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(getExpandedRestingBottom(tabBarHeight) - islandTop).toBe(BAR_PILL_ROW_GAP)
  })
})
