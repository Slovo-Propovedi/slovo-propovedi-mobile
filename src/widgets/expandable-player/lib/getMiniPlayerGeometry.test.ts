import {
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

const SCREEN_HEIGHT = 800
const SCREEN_WIDTH = 400
// Mirrors the bar's own minimum: the row adds max(insets.bottom, 30) below its
// BAR_ROW_MIN_HEIGHT content box (CustomTabBar), so the measured height is the
// content height plus that bottom padding.
const MIN_TAB_BAR_BOTTOM_PADDING = 30

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
  test('measured 114dp row with 30dp bottom padding: pill rests 12dp above the 110dp island top', () => {
    const paddingBottom = MIN_TAB_BAR_BOTTOM_PADDING
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
    const { bottom } = geometryAt(tabBarHeight)

    expect(islandTopFromScreenBottom(paddingBottom)).toBe(110)
    expect(bottom).toBe(122)
    expect(bottom - islandTopFromScreenBottom(paddingBottom)).toBe(BAR_OUTER_GAP)
  })

  test.each([0, MIN_TAB_BAR_BOTTOM_PADDING, 44])(
    'expanded pill keeps exactly BAR_OUTER_GAP above the island top (bottom padding %i)',
    paddingBottom => {
      const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
      const { bottom } = geometryAt(tabBarHeight)

      expect(bottom - islandTopFromScreenBottom(paddingBottom)).toBe(BAR_OUTER_GAP)
    },
  )

  test.each([0, MIN_TAB_BAR_BOTTOM_PADDING, 44])(
    'collapsed pill keeps its bottom aligned with the islands (bottom padding %i)',
    paddingBottom => {
      const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
      const { bottom } = geometryAt(tabBarHeight, 1)

      expect(bottom).toBe(islandBottomFromScreenBottom(paddingBottom))
    },
  )

  test('interpolates the bottom between the two resting forms', () => {
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + MIN_TAB_BAR_BOTTOM_PADDING
    const expanded = geometryAt(tabBarHeight, 0)
    const collapsed = geometryAt(tabBarHeight, 1)
    const halfway = geometryAt(tabBarHeight, 0.5)

    expect(halfway.bottom).toBeCloseTo((expanded.bottom + collapsed.bottom) / 2)
    expect(halfway.top).toBe(SCREEN_HEIGHT - halfway.bottom - PLAYER_SIZES.miniPlayerHeight)
  })
})
