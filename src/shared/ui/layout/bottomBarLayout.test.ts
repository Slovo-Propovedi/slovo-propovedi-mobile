import { BAR_BOTTOM_INSET_MIN, getBarBottomPadding } from './bottomBarLayout'

describe('getBarBottomPadding', () => {
  test('real inset wins: the islands sit flush on the safe-area line', () => {
    expect(getBarBottomPadding(34)).toBe(34)
    expect(getBarBottomPadding(8)).toBe(8)
  })

  test('inset-less screen keeps the desktop/web clearance floor', () => {
    expect(getBarBottomPadding(0)).toBe(BAR_BOTTOM_INSET_MIN)
  })

  test('floor opt-out flushes inset-less screens (mobile web viewport bottom)', () => {
    expect(getBarBottomPadding(0, false)).toBe(0)
    expect(getBarBottomPadding(8, false)).toBe(8)
  })
})
