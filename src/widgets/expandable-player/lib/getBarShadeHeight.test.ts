import {
  BAR_ROW_MIN_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { getBarShadeHeight, SHADE_TOP_OVERSCAN_PX } from './getBarShadeHeight'

// Bottom safe-area padding of the fixture row (BAR_ROW_MIN_HEIGHT + 14 = 98).
const BOTTOM_PADDING = 14

describe('getBarShadeHeight', () => {
  test('anchors to the expanded islands row top', () => {
    expect(getBarShadeHeight(0, BOTTOM_PADDING)).toBe(
      BAR_ROW_MIN_HEIGHT +
        BOTTOM_PADDING -
        (BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2 +
        SHADE_TOP_OVERSCAN_PX,
    )
  })

  test('follows the collapsed island down as the bar morphs', () => {
    expect(getBarShadeHeight(1, BOTTOM_PADDING)).toBe(
      BAR_ROW_MIN_HEIGHT +
        BOTTOM_PADDING -
        (BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT) / 2 +
        SHADE_TOP_OVERSCAN_PX,
    )
  })

  test('drops by half the island shrink so the ramp stays above the chrome', () => {
    const expanded = getBarShadeHeight(0, BOTTOM_PADDING)
    const collapsed = getBarShadeHeight(1, BOTTOM_PADDING)

    expect(expanded - collapsed).toBe((TAB_BAR_ISLAND_HEIGHT_EXPANDED - TAB_BAR_ISLAND_HEIGHT) / 2)
  })
})
