import {
  computeBelowScreenOffset,
  computeFooterHeight,
  computeMaxListHeight,
  MIN_GUARANTEE,
} from './scrollGuaranteeMath'

describe('computeFooterHeight', () => {
  test('adds the guarantee to the raw overflow', () => {
    expect(computeFooterHeight(500, 300, 0)).toBe(284)
  })

  test('clamps to MIN_GUARANTEE when content fits the frame', () => {
    expect(computeFooterHeight(500, 1000, 0)).toBe(MIN_GUARANTEE)
  })

  test('returns exactly MIN_GUARANTEE when all terms collapse', () => {
    expect(computeFooterHeight(500, 500, 0)).toBe(MIN_GUARANTEE)
  })

  test('lets the below-screen clearance dominate when content is shorter than the frame', () => {
    expect(computeFooterHeight(500, 700, 100)).toBe(184)
  })

  test('ceils fractional measurements', () => {
    expect(computeFooterHeight(300, 100, 10.5)).toBe(295)
  })
})

describe('computeBelowScreenOffset', () => {
  test('returns 0 while chromeOffset is not measured', () => {
    expect(computeBelowScreenOffset(300, null, 800, 1000)).toBe(0)
  })

  test('returns 0 when the frame fits on screen', () => {
    expect(computeBelowScreenOffset(100, 50, 200, 1000)).toBe(0)
  })

  test('returns the exact overflow when the frame extends below the screen', () => {
    expect(computeBelowScreenOffset(300, 100, 800, 1000)).toBe(200)
  })

  test('returns 0 exactly at the screen edge', () => {
    expect(computeBelowScreenOffset(200, 100, 700, 1000)).toBe(0)
  })

  test('clamps a sub-pixel negative overflow to 0', () => {
    expect(computeBelowScreenOffset(267.4, 69, 555, 891.43)).toBe(0)
  })
})

describe('computeMaxListHeight', () => {
  test('returns the remaining screen height below the chrome', () => {
    expect(computeMaxListHeight(891.43, 267.4, 69)).toBeCloseTo(555.03)
  })

  test('clamps to 0 when sheet and chrome exceed the window', () => {
    expect(computeMaxListHeight(500, 400, 200)).toBe(0)
  })

  test('returns 0 for zero inputs', () => {
    expect(computeMaxListHeight(0, 0, 0)).toBe(0)
  })

  test('returns 0 exactly when sheet plus chrome fill the window', () => {
    expect(computeMaxListHeight(500, 300, 200)).toBe(0)
  })
})

describe('computeMaxListHeight frame-bounding invariant', () => {
  test.each([
    { chromeOffset: 69, sheetTop: 267.4, windowHeight: 891.43 },
    { chromeOffset: 100, sheetTop: 200, windowHeight: 800 },
    { chromeOffset: 69, sheetTop: 47, windowHeight: 1000 },
    { chromeOffset: 0, sheetTop: 0, windowHeight: 640 },
  ])(
    'keeps the wrapper bottom at the window bottom for $windowHeight/$sheetTop/$chromeOffset',
    ({ chromeOffset, sheetTop, windowHeight }) => {
      const maxListHeight = computeMaxListHeight(windowHeight, sheetTop, chromeOffset)

      expect(sheetTop + chromeOffset + maxListHeight).toBeCloseTo(windowHeight)
    },
  )
})
