import {
  BAR_ROW_MIN_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import {
  getBarShadeHeight,
  getShadeLocations,
  SHADE_CAP_HEIGHT_PX,
  SHADE_TOP_OVERSCAN_PX,
} from './getBarShadeHeight'
import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

// Bottom safe-area padding of the fixture row (BAR_ROW_MIN_HEIGHT + 14 = 98).
const BOTTOM_PADDING = 14
// Fixture device used by the mini-pill geometry helper.
const TAB_BAR_HEIGHT = 98
const SCREEN_WIDTH = 400
const FULL_SCREEN_HEIGHT = 800

// Shade height with a mini pill: the pill bottom plus the pill height and the
// overscan (mirrors BarBackdropShade's worklet).
const getPillShadeHeight = (barProgress: number) =>
  getMiniPlayerGeometry({
    barProgress,
    fullScreenHeight: FULL_SCREEN_HEIGHT,
    screenWidth: SCREEN_WIDTH,
    tabBarHeight: TAB_BAR_HEIGHT,
  }).bottom +
  PLAYER_SIZES.miniPlayerHeight +
  SHADE_TOP_OVERSCAN_PX

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

describe('getShadeLocations', () => {
  test.each([
    ['expanded pill', getPillShadeHeight(0)],
    ['collapsed pill', getPillShadeHeight(1)],
    ['expanded islands row', getBarShadeHeight(0, BOTTOM_PADDING)],
    ['collapsed islands row', getBarShadeHeight(1, BOTTOM_PADDING)],
  ])(
    'ramps transparent to opaque at the pill midline with a %s shade',
    (_name, settledShadeHeight) => {
      expect(getShadeLocations(settledShadeHeight)).toEqual([
        0,
        SHADE_CAP_HEIGHT_PX / settledShadeHeight,
        1,
      ])
    },
  )

  test('keeps the ramp stops strictly inside the shade for a degenerate height', () => {
    const [start, middle, end] = getShadeLocations(1)

    expect(start).toBe(0)
    expect(middle).toBeGreaterThan(0)
    expect(middle).toBeLessThan(1)
    expect(end).toBe(1)
  })
})
