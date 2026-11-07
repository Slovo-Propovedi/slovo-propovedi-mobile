import {
  getCapsuleOpacity,
  getCircleButtonStyle,
  getIslandStyle,
  getTabIconOffset,
  getTabItemHeight,
  getTabSlotStyle,
} from './getIslandStyle'

const LAYOUT = {
  collapsedHeight: 64,
  collapsedWidth: 64,
  expandedHeight: 76,
  expandedWidth: 584,
}
const EXPANDED_TAB_WIDTH = 146
const TAB_LAYOUT = { collapsedWidth: 64, expandedWidth: EXPANDED_TAB_WIDTH }

describe('getIslandStyle', () => {
  test('the expanded island spans the full row width and grows taller', () => {
    expect(getIslandStyle(0, LAYOUT)).toEqual({ height: 76, width: 584 })
  })

  test('the collapsed island shrinks to the circle size and height', () => {
    expect(getIslandStyle(1, LAYOUT)).toEqual({ height: 64, width: 64 })
  })

  test('width and height interpolate linearly between both states', () => {
    expect(getIslandStyle(0.5, LAYOUT)).toEqual({ height: 70, width: 324 })
  })

  test('progress outside 0..1 is clamped', () => {
    expect(getIslandStyle(-1, LAYOUT)).toEqual({ height: 76, width: 584 })
    expect(getIslandStyle(2, LAYOUT)).toEqual({ height: 64, width: 64 })
  })
})

describe('getTabSlotStyle', () => {
  test('expanded tabs share the full width and stay opaque', () => {
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: false })).toEqual({
      opacity: 1,
      width: EXPANDED_TAB_WIDTH,
    })
    expect(getTabSlotStyle(0, { ...TAB_LAYOUT, isActive: true })).toEqual({
      opacity: 1,
      width: EXPANDED_TAB_WIDTH,
    })
  })

  test('collapsed active tab fills the circle, hidden tabs fade out to zero width', () => {
    expect(getTabSlotStyle(1, { ...TAB_LAYOUT, isActive: true })).toEqual({
      opacity: 1,
      width: 64,
    })
    expect(getTabSlotStyle(1, { ...TAB_LAYOUT, isActive: false })).toEqual({
      opacity: 0,
      width: 0,
    })
  })

  test('hidden tab opacity crossfades with progress', () => {
    expect(getTabSlotStyle(0.5, { ...TAB_LAYOUT, isActive: false })).toEqual({
      opacity: 0.5,
      width: EXPANDED_TAB_WIDTH / 2,
    })
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
    expect(getTabItemHeight(0)).toBe(68)
  })

  test('collapsed item stays the circle item height', () => {
    expect(getTabItemHeight(1)).toBe(56)
  })

  test('height interpolates with the morph and clamps out-of-range progress', () => {
    expect(getTabItemHeight(0.5)).toBe(62)
    expect(getTabItemHeight(-1)).toBe(68)
    expect(getTabItemHeight(2)).toBe(56)
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

describe('getCircleButtonStyle', () => {
  test('expanded search circle grows to the expanded size and stays round', () => {
    expect(getCircleButtonStyle(0)).toEqual({ borderRadius: 38, height: 76, width: 76 })
  })

  test('collapsed search circle shrinks to the collapsed size and stays round', () => {
    expect(getCircleButtonStyle(1)).toEqual({ borderRadius: 32, height: 64, width: 64 })
  })

  test('diameter and radius interpolate together through the morph', () => {
    expect(getCircleButtonStyle(0.5)).toEqual({ borderRadius: 35, height: 70, width: 70 })
  })
})
