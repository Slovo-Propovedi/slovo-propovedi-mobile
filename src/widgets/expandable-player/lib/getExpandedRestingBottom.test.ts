import { BAR_OUTER_GAP, BAR_ROW_MIN_HEIGHT, TAB_BAR_ISLAND_HEIGHT_EXPANDED } from 'shared/ui/layout'
import { getExpandedRestingBottom } from './getExpandedRestingBottom'

describe('getExpandedRestingBottom', () => {
  test('sits one outer gap above the expanded island top', () => {
    const paddingBottom = 34
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
    const islandTop =
      paddingBottom +
      (BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2 +
      TAB_BAR_ISLAND_HEIGHT_EXPANDED

    expect(islandTop).toBe(114)
    expect(getExpandedRestingBottom(tabBarHeight) - islandTop).toBe(BAR_OUTER_GAP)
  })
})
