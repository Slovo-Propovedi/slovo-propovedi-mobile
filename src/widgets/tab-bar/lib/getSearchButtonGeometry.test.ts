import {
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET_COLLAPSED,
  BAR_SIDE_INSET_EXPANDED,
  CONTENT_COLUMN_WIDTH,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'
import { getSearchButtonGeometry } from './getSearchButtonGeometry'

const PHONE_WIDTH = 400
const TAB_BAR_HEIGHT = BAR_ROW_MIN_HEIGHT + 12
const ROUTE_COUNT = 3
const LEFT_INSET = 0
const ROW_CONTENT_WIDTH = Math.min(PHONE_WIDTH, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET_EXPANDED * 2
const SLOT_WIDTH = (ROW_CONTENT_WIDTH - ISLAND_CONTENT_PADDING_HORIZONTAL * 2) / 4
const SLOT_LEFT =
  LEFT_INSET +
  BAR_SIDE_INSET_EXPANDED +
  ISLAND_CONTENT_PADDING_HORIZONTAL +
  ROUTE_COUNT * SLOT_WIDTH

const geometry = (separation: number, oneLineProgress: number) =>
  getSearchButtonGeometry({
    expandedSearchWidth: SLOT_WIDTH,
    expandedTabWidth: SLOT_WIDTH,
    oneLineProgress,
    routeCount: ROUTE_COUNT,
    screenWidth: PHONE_WIDTH,
    separation,
    tabBarHeight: TAB_BAR_HEIGHT,
  })

// Independent oracle for the separate-circle rect (same math as
// getSearchIslandGeometry at openProgress 0) so the test does not trust the
// production helper it is checking.
const circleRect = (oneLine: number) => {
  const sideInset =
    BAR_SIDE_INSET_EXPANDED + (BAR_SIDE_INSET_COLLAPSED - BAR_SIDE_INSET_EXPANDED) * oneLine
  const height =
    TAB_BAR_ISLAND_HEIGHT + (TAB_BAR_ISLAND_HEIGHT_EXPANDED - TAB_BAR_ISLAND_HEIGHT) * (1 - oneLine)

  return { height, left: sideInset + PHONE_WIDTH - sideInset * 2 - height, width: height }
}

describe('getSearchButtonGeometry', () => {
  test('rests exactly on the in-island search slot at separation 0', () => {
    const slot = geometry(0, 0)

    expect(slot.left).toBe(SLOT_LEFT)
    expect(slot.width).toBe(SLOT_WIDTH)
    expect(slot.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(slot.bottom).toBe(TAB_BAR_HEIGHT - BAR_ROW_MIN_HEIGHT)
  })

  test('rests exactly on the separate search circle at separation 1', () => {
    const circle = geometry(1, 1)
    const expected = circleRect(1)

    expect(circle.left).toBe(expected.left)
    expect(circle.width).toBe(expected.width)
    expect(circle.height).toBe(expected.height)
    expect(circle.bottom).toBe(TAB_BAR_HEIGHT - BAR_ROW_MIN_HEIGHT)
  })

  test('interpolates left/width/height between the slot and the circle', () => {
    const slot = geometry(0, 0)
    const midOneLine = 0.5
    const mid = geometry(0.5, midOneLine)
    const target = circleRect(midOneLine)

    expect(mid.left).toBe((slot.left + target.left) / 2)
    expect(mid.width).toBe((slot.width + target.width) / 2)
    // Both anchors share the island height at a given one-line progress, so the
    // height follows the height axis only and never pops on separation.
    expect(mid.height).toBe(target.height)
    // The button only ever travels rightwards and shrinks as it detaches.
    expect(mid.left).toBeGreaterThan(slot.left)
    expect(mid.left).toBeLessThan(target.left)
    expect(mid.width).toBeLessThan(slot.width)
  })

  test('clamps separation outside the 0..1 range', () => {
    expect(geometry(-1, 0)).toEqual(geometry(0, 0))
    expect(geometry(2, 1)).toEqual(geometry(1, 1))
  })
})
