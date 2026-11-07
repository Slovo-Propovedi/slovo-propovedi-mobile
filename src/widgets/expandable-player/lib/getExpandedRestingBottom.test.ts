import { BAR_OUTER_GAP } from 'shared/ui/layout'
import { getExpandedRestingBottom } from './getExpandedRestingBottom'

describe('getExpandedRestingBottom', () => {
  test('sits one outer gap above the tab row, matching the expanded pill', () => {
    const tabBarHeight = 100

    expect(getExpandedRestingBottom(tabBarHeight)).toBe(tabBarHeight + BAR_OUTER_GAP)
  })
})
