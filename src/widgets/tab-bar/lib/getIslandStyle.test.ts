import {
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
  WIDE_TAB_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { getIslandContentPadding, getIslandStyle, getTabSlotStyle } from './getIslandStyle'
import {
  getTabIconOffset,
  getTabItemHeight,
  getTabItemHorizontalMargin,
  getTabItemVerticalMargin,
} from './getTabItemStyle'

const LAYOUT = { expandedWidth: 584 }
const EXPANDED_TAB_WIDTH = 146
const TAB_LAYOUT = { expandedWidth: EXPANDED_TAB_WIDTH }

describe('getIslandStyle', () => {
  test('the expanded island spans the full row width at the expanded height', () => {
    expect(getIslandStyle(0, LAYOUT)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 1,
      width: 584,
    })
  })

  test('the one-line collapsed island is a 48x48 circle', () => {
    expect(getIslandStyle(1, LAYOUT, 0, 1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT,
    })
  })

  test('a collapsed shape on the expanded bar is a 68x68 circle', () => {
    // A visible search field forces the circle shape while the bar keeps its
    // expanded height, so the circle matches the 68 field beside it.
    expect(getIslandStyle(1, LAYOUT, 0, 0)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
    })
  })

  test('the open-field row grows the circle 48 -> 68 with the one-line axis', () => {
    // The field becomes visible in the one-line row: the shape stays collapsed
    // (axis A = 1) while the one-line axis drives the height back to expanded.
    expect(getIslandStyle(1, LAYOUT, 0, 0.5)).toEqual({
      height: (TAB_BAR_ISLAND_HEIGHT_EXPANDED + TAB_BAR_ISLAND_HEIGHT) / 2,
      opacity: 1,
      width: (TAB_BAR_ISLAND_HEIGHT_EXPANDED + TAB_BAR_ISLAND_HEIGHT) / 2,
    })
  })

  test('width interpolates from the expanded row to the current circle height', () => {
    expect(getIslandStyle(0.5, LAYOUT)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 1,
      width: (584 + TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2,
    })
    expect(getIslandStyle(0.5, LAYOUT, 0, 1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      opacity: 1,
      width: (584 + TAB_BAR_ISLAND_HEIGHT) / 2,
    })
  })

  test('progress outside 0..1 is clamped', () => {
    expect(getIslandStyle(-1, LAYOUT)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 1,
      width: 584,
    })
    expect(getIslandStyle(2, LAYOUT, 0, 1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT,
    })
  })

  test('one-line progress outside 0..1 is clamped', () => {
    expect(getIslandStyle(1, LAYOUT, 0, -1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
    })
    expect(getIslandStyle(1, LAYOUT, 0, 2)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT,
    })
  })

  test('focus fades the island out and collapses its width to nothing', () => {
    expect(getIslandStyle(0, LAYOUT, 1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 0,
      width: 0,
    })
    expect(getIslandStyle(0, LAYOUT, 0.5)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 0.5,
      width: 292,
    })
    expect(getIslandStyle(1, LAYOUT, 1, 1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      opacity: 0,
      width: 0,
    })
  })

  test('focus progress outside 0..1 is clamped', () => {
    expect(getIslandStyle(0, LAYOUT, -1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 1,
      width: 584,
    })
    expect(getIslandStyle(0, LAYOUT, 2)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      opacity: 0,
      width: 0,
    })
  })

  test('wide: the pinned expanded island rests at the slim wide height', () => {
    // Wide pins the shape axis to expanded but reads a dedicated 48dp height,
    // so the top island is slimmer than the compact expanded island (60).
    expect(WIDE_TAB_ISLAND_HEIGHT).toBe(48)
    expect(getIslandStyle(0, LAYOUT, 0, 0, true)).toEqual({
      height: WIDE_TAB_ISLAND_HEIGHT,
      opacity: 1,
      width: 584,
    })
  })
})

describe('getTabSlotStyle', () => {
  test('expanded tabs share the full width and stay opaque', () => {
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: false })).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      minWidth: 48,
      opacity: 1,
      width: EXPANDED_TAB_WIDTH,
    })
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: true })).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      minWidth: 48,
      opacity: 1,
      width: EXPANDED_TAB_WIDTH,
    })
  })

  test('collapsed active tab fills the 48 circle in the one-line row', () => {
    expect(getTabSlotStyle(1, { ...TAB_LAYOUT, isActive: true }, 1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      minWidth: 0,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT,
    })
  })

  test('collapsed active tab follows the 68 island beside an open field', () => {
    expect(getTabSlotStyle(1, { ...TAB_LAYOUT, isActive: true }, 0)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      minWidth: 0,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
    })
  })

  test('slot height equals the island height in every morph state', () => {
    // Vertical geometry follows the one-line axis, never the shape axis: the
    // search-open island is a 68 circle on a collapsed shape, and a slot sized
    // from the 48 one-line row leaves the item resting above the circle centre.
    for (const progress of [0, 0.5, 1])
      for (const oneLine of [0, 0.5, 1])
        expect(getTabSlotStyle(progress, { ...TAB_LAYOUT, isActive: true }, oneLine).height).toBe(
          getIslandStyle(progress, TAB_LAYOUT, 0, oneLine).height,
        )
  })

  test('slot height interpolates 68 -> 48 with the one-line axis', () => {
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: true }, 0).height).toBe(
      TAB_BAR_ISLAND_HEIGHT_EXPANDED,
    )
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: true }, 1).height).toBe(
      TAB_BAR_ISLAND_HEIGHT,
    )
  })

  test('the collapsed slot width equals the island width (no oval)', () => {
    for (const oneLine of [0, 0.5, 1])
      expect(getTabSlotStyle(1, { ...TAB_LAYOUT, isActive: true }, oneLine).width).toBe(
        getIslandStyle(1, TAB_LAYOUT, 0, oneLine).width,
      )
  })

  test('collapsed hidden tabs fade out to zero width', () => {
    expect(getTabSlotStyle(1, { ...TAB_LAYOUT, isActive: false }, 1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      minWidth: 0,
      opacity: 0,
      width: 0,
    })
  })

  test('hidden tab opacity crossfades with progress', () => {
    expect(getTabSlotStyle(0.5, { ...TAB_LAYOUT, isActive: false })).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      minWidth: 24,
      opacity: 0.5,
      width: EXPANDED_TAB_WIDTH / 2,
    })
  })

  test('every expanded slot keeps at least the 48dp touch target', () => {
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: false }).minWidth).toBe(48)
  })

  test('wide: the slot height matches the slim wide island height', () => {
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: true }, 0, true).height).toBe(
      WIDE_TAB_ISLAND_HEIGHT,
    )
  })
})

describe('getIslandContentPadding', () => {
  test('expanded island insets its slots from the rounded edges', () => {
    expect(getIslandContentPadding(0)).toBe(10)
  })

  test('collapsed circle drops the inset so the active slot fills the circle', () => {
    // The island shrinks to the 48dp circle and the active slot to the same
    // width; any leftover padding would push the icon off-centre and clip it.
    expect(getIslandContentPadding(1)).toBe(0)
  })

  test('inset fades with the morph and clamps out-of-range progress', () => {
    expect(getIslandContentPadding(0.5)).toBe(5)
    expect(getIslandContentPadding(-1)).toBe(10)
    expect(getIslandContentPadding(2)).toBe(0)
  })
})

describe('getTabIconOffset', () => {
  test('collapsed island centers the icon with no offset', () => {
    expect(getTabIconOffset(1)).toBe(0)
  })

  test('expanded island lifts the icon to make room for the label', () => {
    expect(getTabIconOffset(0)).toBe(-8)
  })

  test('progress outside 0..1 is clamped in both morph directions', () => {
    expect(getTabIconOffset(-1)).toBe(-8)
    expect(getTabIconOffset(2)).toBe(0)
  })

  test('the offset eases linearly with the morph', () => {
    expect(getTabIconOffset(0.5)).toBe(-4)
  })
})

describe('getTabItemHeight', () => {
  test('expanded item grows with the island so the label keeps a gap below the icon', () => {
    expect(getTabItemHeight(0)).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED - 4 * 2)
  })

  test('collapsed item stays the circle item height', () => {
    // The uniform 48dp one-line row leaves the item 48 minus its two 4dp margins.
    expect(getTabItemHeight(1)).toBe(TAB_BAR_ISLAND_HEIGHT - 4 * 2)
  })

  test('height interpolates with the morph and clamps out-of-range progress', () => {
    expect(getTabItemHeight(0.5)).toBe(
      (TAB_BAR_ISLAND_HEIGHT_EXPANDED + TAB_BAR_ISLAND_HEIGHT) / 2 - 4 * 2,
    )
    expect(getTabItemHeight(-1)).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED - 4 * 2)
    expect(getTabItemHeight(2)).toBe(TAB_BAR_ISLAND_HEIGHT - 4 * 2)
  })

  test('wide: the item fills the slim wide island between its margins', () => {
    expect(getTabItemHeight(0, true)).toBe(WIDE_TAB_ISLAND_HEIGHT - 4 * 2)
  })
})

describe('getTabItemVerticalMargin', () => {
  test('expanded and collapsed items keep the same compact 4dp margin', () => {
    expect(getTabItemVerticalMargin(0)).toBe(4)
    expect(getTabItemVerticalMargin(1)).toBe(4)
  })

  test('margin stays 4dp through the morph and out-of-range progress', () => {
    expect(getTabItemVerticalMargin(0.5)).toBe(4)
    expect(getTabItemVerticalMargin(-1)).toBe(4)
    expect(getTabItemVerticalMargin(2)).toBe(4)
  })
})

describe('getTabItemHorizontalMargin', () => {
  test('expanded items split the 8dp gap between neighbours', () => {
    expect(getTabItemHorizontalMargin(0)).toBe(4)
  })

  test('collapsed active item drops the gap so its icon centres in the circle', () => {
    // The island padding is 0 at progress 1, so any leftover margin would
    // offset the item inside the 48dp circle.
    expect(getTabItemHorizontalMargin(1)).toBe(0)
  })

  test('margin eases with the morph and clamps out-of-range progress', () => {
    expect(getTabItemHorizontalMargin(0.5)).toBe(2)
    expect(getTabItemHorizontalMargin(-1)).toBe(4)
    expect(getTabItemHorizontalMargin(2)).toBe(0)
  })
})
