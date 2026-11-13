import { getShadeHoles } from './getShadeHoles'

// Fixture: a 400dp phone with a 14dp bottom inset. The tab row is
// BAR_ROW_MIN_HEIGHT (84) plus that inset, so the measured row height is 98.
const SCREEN_WIDTH = 400
const TAB_BAR_HEIGHT = 98
const SHADE_HEIGHT = 200
// The centered content column is wider than the viewport, so its inset is 0;
// the row then pads by BAR_SIDE_INSET (16) on each side.
const ROW_INNER_LEFT = 16
const ROW_INNER_WIDTH = SCREEN_WIDTH - ROW_INNER_LEFT * 2

interface HoleRect {
  bottom: number
  height: number
  left: number
  width: number
}

// The shade box is bottom-anchored; SVG (and the mask) start at its top edge.
const bottomAnchoredHole = ({ bottom, height, left, width }: HoleRect) => ({
  height,
  width,
  x: left,
  y: SHADE_HEIGHT - (bottom + height),
})

// Islands are centered in the row's 84dp content box: the expanded 76dp island
// keeps 4dp above and below, the collapsed 64dp one keeps 10dp.
const EXPANDED_ISLAND_BOTTOM = 14 + 4
const COLLAPSED_ISLAND_BOTTOM = 14 + 10

const BASE_INPUT = {
  barCollapsed: false,
  fullScreenHeight: 800,
  hasClose: false,
  hasPill: false,
  hasSearch: true,
  isFocused: false,
  isSearchVisible: false,
  screenWidth: SCREEN_WIDTH,
  shadeHeight: SHADE_HEIGHT,
  tabBarHeight: TAB_BAR_HEIGHT,
} as const

describe('getShadeHoles', () => {
  test('cuts the expanded islands row and the resting search circle', () => {
    expect(getShadeHoles(BASE_INPUT)).toEqual([
      bottomAnchoredHole({
        bottom: EXPANDED_ISLAND_BOTTOM,
        height: 76,
        left: ROW_INNER_LEFT,
        // Row inner width minus the 76dp search circle and one outer gap.
        width: ROW_INNER_WIDTH - 76 - 6,
      }),
      bottomAnchoredHole({
        bottom: EXPANDED_ISLAND_BOTTOM,
        height: 76,
        left: ROW_INNER_LEFT + ROW_INNER_WIDTH - 76,
        width: 76,
      }),
    ])
  })

  test('follows the collapsed row, where both islands shrink to the circle size', () => {
    expect(getShadeHoles({ ...BASE_INPUT, barCollapsed: true })).toEqual([
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT,
        width: 64,
      }),
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT + ROW_INNER_WIDTH - 64,
        width: 64,
      }),
    ])
  })

  test('stretches the search hole into the slot right of the active-tab circle', () => {
    // A visible field forces the collapsed 64dp row even when the bar has not
    // collapsed: the row reads [active-tab circle][field].
    expect(getShadeHoles({ ...BASE_INPUT, isSearchVisible: true })).toEqual([
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT,
        width: 64,
      }),
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT + 64 + 6,
        width: ROW_INNER_WIDTH - 64 - 6,
      }),
    ])
  })

  test('reserves the close circle slot when the field is focused', () => {
    expect(
      getShadeHoles({ ...BASE_INPUT, hasClose: true, isFocused: true, isSearchVisible: true }),
    ).toEqual([
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT,
        width: ROW_INNER_WIDTH - 64 - 6,
      }),
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: SCREEN_WIDTH - ROW_INNER_LEFT - 64,
        width: 64,
      }),
    ])
  })

  test('cuts the detached mini pill out of the shade', () => {
    expect(getShadeHoles({ ...BASE_INPUT, hasPill: true })).toEqual([
      bottomAnchoredHole({
        bottom: EXPANDED_ISLAND_BOTTOM,
        height: 76,
        left: ROW_INNER_LEFT,
        width: ROW_INNER_WIDTH - 76 - 6,
      }),
      bottomAnchoredHole({
        bottom: EXPANDED_ISLAND_BOTTOM,
        height: 76,
        left: ROW_INNER_LEFT + ROW_INNER_WIDTH - 76,
        width: 76,
      }),
      bottomAnchoredHole({
        // One outer gap above the expanded island's top edge.
        bottom: TAB_BAR_HEIGHT - 4 + 6,
        height: 64,
        left: ROW_INNER_LEFT,
        width: ROW_INNER_WIDTH,
      }),
    ])
  })

  test('collapses the pill hole into the row line with the bar', () => {
    expect(getShadeHoles({ ...BASE_INPUT, barCollapsed: true, hasPill: true })).toEqual([
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT,
        width: 64,
      }),
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT + ROW_INNER_WIDTH - 64,
        width: 64,
      }),
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT + 64 + 6,
        // Collapsed pill mirrors its insets around the screen centre.
        width: SCREEN_WIDTH - (ROW_INNER_LEFT + 64 + 6) * 2,
      }),
    ])
  })

  test('drops the pill and tab-island holes while the field is focused', () => {
    // The pill tucks behind the focused search row and the tab island fades out.
    expect(
      getShadeHoles({
        ...BASE_INPUT,
        hasClose: true,
        hasPill: true,
        isFocused: true,
        isSearchVisible: true,
      }),
    ).toEqual([
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: ROW_INNER_LEFT,
        width: ROW_INNER_WIDTH - 64 - 6,
      }),
      bottomAnchoredHole({
        bottom: COLLAPSED_ISLAND_BOTTOM,
        height: 64,
        left: SCREEN_WIDTH - ROW_INNER_LEFT - 64,
        width: 64,
      }),
    ])
  })

  test('lets the admin row, which has no search chrome, span its inner width', () => {
    expect(getShadeHoles({ ...BASE_INPUT, hasSearch: false })).toEqual([
      bottomAnchoredHole({
        bottom: EXPANDED_ISLAND_BOTTOM,
        height: 76,
        left: ROW_INNER_LEFT,
        width: ROW_INNER_WIDTH,
      }),
    ])
  })
})
