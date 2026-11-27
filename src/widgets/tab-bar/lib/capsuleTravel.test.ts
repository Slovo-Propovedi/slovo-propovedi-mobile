import { getSlotEmphasis, getTravelScale } from './capsulePulse'
import {
  CAPSULE_TRAVEL_MAX_MS,
  getSlotOverlap,
  getSlotRects,
  getTravelDuration,
} from './capsuleTravel'

// Wide: three label tabs then the icon-only search slot.
const WIDE_WIDTHS = [88, 88, 88, 48]
// Compact expanded: one equal share for each tab and the folded-in search slot.
const COMPACT_WIDTHS = [92.5, 92.5, 92.5, 92.5]

describe('getSlotRects', () => {
  test('derives the wide slot centres from the per-kind slot widths', () => {
    expect(getSlotRects(WIDE_WIDTHS).map(rect => rect.center)).toEqual([44, 132, 220, 288])
  })

  test('gives every compact slot the same pitch and capsule width', () => {
    const rects = getSlotRects(COMPACT_WIDTHS)

    expect(rects.map(rect => rect.center)).toEqual([46.25, 138.75, 231.25, 323.75])
    expect(new Set(rects.map(rect => rect.capsuleWidth)).size).toBe(1)
  })

  test('bleeds the capsule past its slot like the static highlight did', () => {
    // Two 10dp overhangs minus the item's 4dp margin on each side.
    expect(getSlotRects([88])[0]?.capsuleWidth).toBe(100)
  })
})

describe('getSlotOverlap', () => {
  test('is full on the slot centre and empty half a slot away', () => {
    expect(getSlotOverlap(132, 132, 88)).toBe(1)
    expect(getSlotOverlap(176, 132, 88)).toBe(0)
    expect(getSlotOverlap(240, 132, 88)).toBe(0)
  })

  test('eases linearly between neighbouring slots', () => {
    expect(getSlotOverlap(154, 132, 88)).toBe(0.5)
  })
})

describe('getTravelScale', () => {
  test('rests at its natural size', () => {
    expect(getTravelScale(1, 0, 0)).toBe(1)
  })

  test('grows a slot the capsule crosses over and returns to rest', () => {
    expect(getTravelScale(1, 1, 0)).toBeCloseTo(1.04)
    expect(getTravelScale(0, 1, 0)).toBe(1)
  })

  test('the arrival pulse is stronger than the travel pulse', () => {
    const travelPeak = getTravelScale(1, 1, 0)
    const arrivalPeak = getTravelScale(0.44, 1, 1)

    expect(arrivalPeak).toBeGreaterThan(travelPeak)
    expect(arrivalPeak).toBeGreaterThan(1.08)
  })
})

describe('getSlotEmphasis', () => {
  test('follows the traveling capsule while expanded', () => {
    expect(getSlotEmphasis(1, 0, false)).toBe(1)
    expect(getSlotEmphasis(0.5, 0, false)).toBe(0.5)
    expect(getSlotEmphasis(0, 0, false)).toBe(0)
  })

  test('falls back to the active route inside the collapsed circle', () => {
    expect(getSlotEmphasis(0, 1, true)).toBe(1)
    expect(getSlotEmphasis(1, 1, false)).toBe(0)
  })
})

describe('getTravelDuration', () => {
  test('scales with the number of slots crossed and clamps at the ceiling', () => {
    expect(getTravelDuration(1)).toBe(210)
    expect(getTravelDuration(2)).toBe(CAPSULE_TRAVEL_MAX_MS)
    expect(getTravelDuration(5)).toBe(CAPSULE_TRAVEL_MAX_MS)
  })
})
