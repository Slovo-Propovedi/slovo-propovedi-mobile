import {
  BAR_BOTTOM_INSET_MIN,
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
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

// Independent model of the real islands row: a fixed content box, islands
// centered in it, and the bottom safe-area padding below the content box.
const islandTopFromScreenBottom = (paddingBottom: number) =>
  paddingBottom +
  (BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2 +
  TAB_BAR_ISLAND_HEIGHT_EXPANDED
const islandBottomFromScreenBottom = (paddingBottom: number) =>
  paddingBottom + (BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT) / 2

describe('getMiniPlayerGeometry', () => {
  test('measured 96dp row with 12dp bottom padding: pill rests one outer gap above the 92dp island top', () => {
    const paddingBottom = BAR_BOTTOM_INSET_MIN
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
    const { bottom } = geometryAt(tabBarHeight)

    expect(islandTopFromScreenBottom(paddingBottom)).toBe(92)
    expect(bottom).toBe(tabBarHeight - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_OUTER_GAP)
    expect(bottom - islandTopFromScreenBottom(paddingBottom)).toBe(BAR_OUTER_GAP)
  })

  test.each([0, BAR_BOTTOM_INSET_MIN, 44])(
    'expanded pill keeps exactly BAR_OUTER_GAP above the island top (bottom padding %i)',
    paddingBottom => {
      const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
      const { bottom } = geometryAt(tabBarHeight)

      expect(bottom - islandTopFromScreenBottom(paddingBottom)).toBe(BAR_OUTER_GAP)
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

  test('interpolates the bottom between the two resting forms', () => {
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN
    const expanded = geometryAt(tabBarHeight, 0)
    const collapsed = geometryAt(tabBarHeight, 1)
    const halfway = geometryAt(tabBarHeight, 0.5)

    expect(halfway.bottom).toBeCloseTo((expanded.bottom + collapsed.bottom) / 2)
    expect(halfway.top).toBe(SCREEN_HEIGHT - halfway.bottom - PLAYER_SIZES.miniPlayerHeight)
  })
})
