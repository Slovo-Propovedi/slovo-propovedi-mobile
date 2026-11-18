import {
  getCapsuleOpacity,
  getIslandContentPadding,
  getIslandStyle,
  getTabIconOffset,
  getTabItemHeight,
  getTabItemHorizontalMargin,
  getTabItemVerticalMargin,
  getTabSlotStyle,
} from './getIslandStyle'

const LAYOUT = {
  collapsedHeight: 56,
  collapsedWidth: 56,
  expandedHeight: 68,
  expandedWidth: 584,
}
const EXPANDED_TAB_WIDTH = 146
const TAB_LAYOUT = { collapsedWidth: 56, expandedWidth: EXPANDED_TAB_WIDTH }

describe('getIslandStyle', () => {
  test('the expanded island spans the full row width and grows taller', () => {
    expect(getIslandStyle(0, LAYOUT)).toEqual({ height: 68, opacity: 1, width: 584 })
  })

  test('the collapsed island shrinks to the circle size and height', () => {
    expect(getIslandStyle(1, LAYOUT)).toEqual({ height: 56, opacity: 1, width: 56 })
  })

  test('width and height interpolate linearly between both states', () => {
    expect(getIslandStyle(0.5, LAYOUT)).toEqual({ height: 62, opacity: 1, width: 320 })
  })

  test('progress outside 0..1 is clamped', () => {
    expect(getIslandStyle(-1, LAYOUT)).toEqual({ height: 68, opacity: 1, width: 584 })
    expect(getIslandStyle(2, LAYOUT)).toEqual({ height: 56, opacity: 1, width: 56 })
  })

  test('focus fades the island out and collapses its width to nothing', () => {
    expect(getIslandStyle(0, LAYOUT, 1)).toEqual({ height: 68, opacity: 0, width: 0 })
    expect(getIslandStyle(0, LAYOUT, 0.5)).toEqual({ height: 68, opacity: 0.5, width: 292 })
    expect(getIslandStyle(1, LAYOUT, 1)).toEqual({ height: 56, opacity: 0, width: 0 })
  })

  test('focus progress outside 0..1 is clamped', () => {
    expect(getIslandStyle(0, LAYOUT, -1)).toEqual({ height: 68, opacity: 1, width: 584 })
    expect(getIslandStyle(0, LAYOUT, 2)).toEqual({ height: 68, opacity: 0, width: 0 })
  })
})

describe('getTabSlotStyle', () => {
  test('expanded tabs share the full width and stay opaque', () => {
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: false })).toEqual({
      minWidth: 48,
      opacity: 1,
      width: EXPANDED_TAB_WIDTH,
    })
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: true })).toEqual({
      minWidth: 48,
      opacity: 1,
      width: EXPANDED_TAB_WIDTH,
    })
  })

  test('collapsed active tab fills the circle, hidden tabs fade out to zero width', () => {
    expect(getTabSlotStyle(1, { ...TAB_LAYOUT, isActive: true })).toEqual({
      minWidth: 0,
      opacity: 1,
      width: 56,
    })
    expect(getTabSlotStyle(1, { ...TAB_LAYOUT, isActive: false })).toEqual({
      minWidth: 0,
      opacity: 0,
      width: 0,
    })
  })

  test('hidden tab opacity crossfades with progress', () => {
    expect(getTabSlotStyle(0.5, { ...TAB_LAYOUT, isActive: false })).toEqual({
      minWidth: 24,
      opacity: 0.5,
      width: EXPANDED_TAB_WIDTH / 2,
    })
  })

  test('every expanded slot keeps at least the 48dp touch target', () => {
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: false }).minWidth).toBe(48)
  })
})

describe('getIslandContentPadding', () => {
  test('expanded island insets its slots from the rounded edges', () => {
    expect(getIslandContentPadding(0)).toBe(10)
  })

  test('collapsed circle drops the inset so the active slot fills the circle', () => {
    // The island shrinks to the 56dp circle and the active slot to the same
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
    expect(getTabItemHeight(0)).toBe(60)
  })

  test('collapsed item stays the circle item height', () => {
    expect(getTabItemHeight(1)).toBe(48)
  })

  test('height interpolates with the morph and clamps out-of-range progress', () => {
    expect(getTabItemHeight(0.5)).toBe(54)
    expect(getTabItemHeight(-1)).toBe(60)
    expect(getTabItemHeight(2)).toBe(48)
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
    // offset the item inside the 56dp circle.
    expect(getTabItemHorizontalMargin(1)).toBe(0)
  })

  test('margin eases with the morph and clamps out-of-range progress', () => {
    expect(getTabItemHorizontalMargin(0.5)).toBe(2)
    expect(getTabItemHorizontalMargin(-1)).toBe(4)
    expect(getTabItemHorizontalMargin(2)).toBe(0)
  })
})

describe('getCapsuleOpacity', () => {
  test('expanded active tab shows the capsule highlight', () => {
    expect(getCapsuleOpacity(0, true)).toBe(1)
  })

  test('collapsed active tab hides the capsule highlight inside the circle', () => {
    expect(getCapsuleOpacity(1, true)).toBe(0)
  })

  test('inactive tabs never show the capsule', () => {
    expect(getCapsuleOpacity(0, false)).toBe(0)
    expect(getCapsuleOpacity(1, false)).toBe(0)
  })

  test('opacity crossfades with progress', () => {
    expect(getCapsuleOpacity(0.5, true)).toBe(0.5)
  })
})
