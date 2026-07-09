import { clampMarqueeOffset, shouldMarquee } from './marquee-utils'

describe('clampMarqueeOffset', () => {
  test('clamps to 0 at the top', () => {
    expect(clampMarqueeOffset(100, 50)).toBe(0)
  })

  test('clamps to -maxOffset at the bottom', () => {
    expect(clampMarqueeOffset(-100, 50)).toBe(-50)
  })

  test('passes through values in range', () => {
    expect(clampMarqueeOffset(-25, 50)).toBe(-25)
    expect(clampMarqueeOffset(0, 50)).toBe(0)
    expect(clampMarqueeOffset(-50, 50)).toBe(-50)
  })

  test('handles maxOffset of 0', () => {
    expect(clampMarqueeOffset(-10, 0)).toBe(0)
    expect(clampMarqueeOffset(10, 0)).toBe(0)
  })

  test('negative inputs beyond -maxOffset clamp to -maxOffset', () => {
    expect(clampMarqueeOffset(-30, 20)).toBe(-20)
  })

  test('positive inputs clamp to 0', () => {
    expect(clampMarqueeOffset(5, 10)).toBe(0)
    expect(clampMarqueeOffset(50, 10)).toBe(0)
  })
})

describe('shouldMarquee', () => {
  test('returns true when maxOffset > 0 and textLength > threshold', () => {
    expect(shouldMarquee(20, 10, 5)).toBe(true)
  })

  test('returns false when maxOffset is 0', () => {
    expect(shouldMarquee(20, 0, 5)).toBe(false)
  })

  test('returns false when textLength <= threshold', () => {
    expect(shouldMarquee(5, 10, 10)).toBe(false)
    expect(shouldMarquee(3, 10, 10)).toBe(false)
  })

  test('works with threshold of 0 (pure pixel gate)', () => {
    expect(shouldMarquee(10, 5, 0)).toBe(true)
    expect(shouldMarquee(0, 0, 0)).toBe(false)
  })
})
