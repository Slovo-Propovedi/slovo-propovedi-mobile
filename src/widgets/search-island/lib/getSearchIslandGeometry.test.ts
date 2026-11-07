import {
  BAR_BOTTOM_INSET_MIN,
  BAR_CIRCLE_SIZE,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { getSearchIslandGeometry } from './getSearchIslandGeometry'

const TAB_BAR_HEIGHT = BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN

describe('getSearchIslandGeometry', () => {
  test('rests flush with the row inner edges once the bar is collapsed', () => {
    const geometry = getSearchIslandGeometry({
      barProgress: 1,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

    expect(geometry).toEqual({
      bottom: TAB_BAR_HEIGHT - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT) / 2,
      closeRight: BAR_SIDE_INSET,
      height: TAB_BAR_ISLAND_HEIGHT,
      left: BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP,
      radius: TAB_BAR_ISLAND_HEIGHT / 2,
      right: BAR_SIDE_INSET,
    })
  })

  test('spans the whole row and grows with the expanded island before the morph', () => {
    const geometry = getSearchIslandGeometry({
      barProgress: 0,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

    expect(geometry.left).toBe(BAR_SIDE_INSET)
    expect(geometry.right).toBe(BAR_SIDE_INSET)
    expect(geometry.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(geometry.radius).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED / 2)
    expect(geometry.bottom).toBe(
      TAB_BAR_HEIGHT - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2,
    )
  })

  test('interpolates the left edge with the morph progress', () => {
    const halfway = getSearchIslandGeometry({
      barProgress: 0.5,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

    expect(halfway.left).toBe(BAR_SIDE_INSET + (BAR_CIRCLE_SIZE + BAR_OUTER_GAP) / 2)
  })

  test('clamps progress outside the 0..1 range', () => {
    const below = getSearchIslandGeometry({
      barProgress: -2,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })
    const above = getSearchIslandGeometry({
      barProgress: 2,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

    expect(below.left).toBe(BAR_SIDE_INSET)
    expect(above.left).toBe(BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP)
  })

  test('centers the capped column on wide screens', () => {
    const geometry = getSearchIslandGeometry({
      barProgress: 1,
      screenWidth: 800,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

    // (800 - 600) / 2 = 100px centered column inset
    expect(geometry.left).toBe(100 + BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP)
    expect(geometry.right).toBe(100 + BAR_SIDE_INSET)
  })

  test('reserves a full close-circle slot on the right while the external ✕ is visible', () => {
    const geometry = getSearchIslandGeometry({
      barProgress: 1,
      closeProgress: 1,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

    expect(geometry.closeRight).toBe(BAR_SIDE_INSET)
    expect(geometry.right).toBe(BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP)
  })

  test('animates the reserved close slot with closeProgress', () => {
    const halfway = getSearchIslandGeometry({
      barProgress: 1,
      closeProgress: 0.5,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

    expect(halfway.right).toBe(BAR_SIDE_INSET + (BAR_CIRCLE_SIZE + BAR_OUTER_GAP) / 2)
  })

  test('clamps closeProgress outside the 0..1 range', () => {
    const below = getSearchIslandGeometry({
      barProgress: 1,
      closeProgress: -1,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })
    const above = getSearchIslandGeometry({
      barProgress: 1,
      closeProgress: 2,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

    expect(below.right).toBe(BAR_SIDE_INSET)
    expect(above.right).toBe(BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP)
  })
})
