import { getIslandStyle, getTabIconOffset, getTabSlotStyle } from './getIslandStyle'

const LAYOUT = { collapsedWidth: 56, expandedWidth: 584 }
const EXPANDED_TAB_WIDTH = 146
const TAB_LAYOUT = { collapsedWidth: 56, expandedWidth: EXPANDED_TAB_WIDTH }

describe('getIslandStyle', () => {
  test('the expanded island spans the full row width', () => {
    expect(getIslandStyle(0, LAYOUT)).toEqual({ width: 584 })
  })

  test('the collapsed island shrinks to the circle size', () => {
    expect(getIslandStyle(1, LAYOUT)).toEqual({ width: 56 })
  })

  test('the width interpolates linearly between both states', () => {
    expect(getIslandStyle(0.5, LAYOUT)).toEqual({ width: 320 })
  })

  test('progress outside 0..1 is clamped', () => {
    expect(getIslandStyle(-1, LAYOUT)).toEqual({ width: 584 })
    expect(getIslandStyle(2, LAYOUT)).toEqual({ width: 56 })
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
      width: 56,
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
