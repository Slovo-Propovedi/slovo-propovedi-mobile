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
const PHONE_WIDTH = 400
// 400 - two side insets: the row's inner width.
const PHONE_ROW_WIDTH = PHONE_WIDTH - BAR_SIDE_INSET * 2

const geometry = (input: {
  barProgress?: number
  closeProgress?: number
  openProgress: number
  screenWidth?: number
}) =>
  getSearchIslandGeometry({
    barProgress: input.barProgress ?? 1,
    closeProgress: input.closeProgress,
    openProgress: input.openProgress,
    screenWidth: input.screenWidth ?? PHONE_WIDTH,
    tabBarHeight: TAB_BAR_HEIGHT,
  })

describe('getSearchIslandGeometry', () => {
  test('openProgress 0 rests exactly on the search circle', () => {
    const collapsed = geometry({ openProgress: 0 })

    // Right-anchored on the search chip's spot: the pill is a click-equivalent
    // circle before it grows, so the first visible frame never spans the row.
    expect(collapsed.left).toBe(PHONE_WIDTH - BAR_SIDE_INSET - BAR_CIRCLE_SIZE)
    expect(collapsed.width).toBe(BAR_CIRCLE_SIZE)
    expect(collapsed.left + collapsed.width).toBe(PHONE_WIDTH - BAR_SIDE_INSET)
    expect(collapsed.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(collapsed.radius).toBe(TAB_BAR_ISLAND_HEIGHT / 2)
    expect(collapsed.bottom).toBe(TAB_BAR_HEIGHT - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT) / 2)
    expect(collapsed.closeRight).toBe(BAR_SIDE_INSET)
  })

  test('openProgress 1 fills the slot right of the active-tab circle', () => {
    const open = geometry({ openProgress: 1 })

    expect(open.left).toBe(BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP)
    expect(open.width).toBe(PHONE_ROW_WIDTH - BAR_CIRCLE_SIZE - BAR_OUTER_GAP)
    expect(open.left + open.width).toBe(PHONE_WIDTH - BAR_SIDE_INSET)
    expect(open.height).toBe(TAB_BAR_ISLAND_HEIGHT)
  })

  test('interpolates left and width together, keeping the right edge anchored', () => {
    const halfway = geometry({ openProgress: 0.5 })
    const collapsed = geometry({ openProgress: 0 })
    const open = geometry({ openProgress: 1 })

    expect(halfway.left).toBe((collapsed.left + open.left) / 2)
    expect(halfway.width).toBe((collapsed.width + open.width) / 2)
    expect(halfway.left + halfway.width).toBe(open.left + open.width)
  })

  test('left decreases monotonically as the pill opens (no reversed growth)', () => {
    const frames = [0, 0.25, 0.5, 0.75, 1].map(openProgress => geometry({ openProgress }))

    for (let i = 1; i < frames.length; i++) expect(frames[i].left).toBeLessThan(frames[i - 1].left)
  })

  test('collapsed pill matches the search chip diameter in either bar state', () => {
    const expandedBar = geometry({ barProgress: 0, openProgress: 0 })

    // The search chip is 76 while the bar is expanded; a 64-wide pill would
    // leave a visible oval "last frame" instead of a circle.
    expect(expandedBar.width).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(expandedBar.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(expandedBar.radius).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED / 2)
    expect(expandedBar.left).toBe(PHONE_WIDTH - BAR_SIDE_INSET - TAB_BAR_ISLAND_HEIGHT_EXPANDED)
  })

  test('height and radius follow the island morph, not the open progress', () => {
    const expandedBar = geometry({ barProgress: 0, openProgress: 1 })
    const halfwayBar = geometry({ barProgress: 0.5, openProgress: 1 })

    expect(expandedBar.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(expandedBar.radius).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED / 2)
    expect(expandedBar.bottom).toBe(
      TAB_BAR_HEIGHT - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2,
    )
    expect(halfwayBar.height).toBe(70)
    expect(halfwayBar.radius).toBe(35)
  })

  test('clamps open and bar progress outside the 0..1 range', () => {
    const below = geometry({ openProgress: -2 })
    const above = geometry({ openProgress: 2 })
    const belowBar = geometry({ barProgress: -2, openProgress: 1 })
    const aboveBar = geometry({ barProgress: 2, openProgress: 1 })

    expect(below).toEqual(geometry({ openProgress: 0 }))
    expect(above).toEqual(geometry({ openProgress: 1 }))
    expect(belowBar.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(aboveBar.height).toBe(TAB_BAR_ISLAND_HEIGHT)
  })

  test('reserves the close-circle slot only while the pill is open', () => {
    const open = geometry({ closeProgress: 1, openProgress: 1 })
    const closed = geometry({ closeProgress: 1, openProgress: 0 })

    expect(open.left).toBe(BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP)
    expect(open.width).toBe(PHONE_ROW_WIDTH - (BAR_CIRCLE_SIZE + BAR_OUTER_GAP) * 2)
    expect(closed.width).toBe(BAR_CIRCLE_SIZE)
    expect(closed.left).toBe(PHONE_WIDTH - BAR_SIDE_INSET - BAR_CIRCLE_SIZE)
  })

  test('animates the reserved close slot with closeProgress', () => {
    const halfway = geometry({ closeProgress: 0.5, openProgress: 1 })

    expect(halfway.width).toBe(PHONE_ROW_WIDTH - (BAR_CIRCLE_SIZE + BAR_OUTER_GAP) * 1.5)
  })

  test('centers the capped column on wide screens', () => {
    const collapsed = geometry({ openProgress: 0, screenWidth: 800 })
    const open = geometry({ openProgress: 1, screenWidth: 800 })

    // (800 - 600) / 2 = 100px centered column inset.
    expect(collapsed.left).toBe(800 - (100 + BAR_SIDE_INSET) - BAR_CIRCLE_SIZE)
    expect(collapsed.width).toBe(BAR_CIRCLE_SIZE)
    expect(open.left).toBe(100 + BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP)
    expect(open.width).toBe(600 - BAR_SIDE_INSET * 2 - BAR_CIRCLE_SIZE - BAR_OUTER_GAP)
  })
})
