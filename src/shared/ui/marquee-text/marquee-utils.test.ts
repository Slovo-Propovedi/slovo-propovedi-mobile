import {
  clampMarqueeOffset,
  MARQUEE_EPSILON_PX,
  shouldArmMarquee,
  shouldMarquee,
  shouldSwallowClick,
} from './marquee-utils'

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
  test('returns true when the text overflows the container beyond the epsilon', () => {
    expect(shouldMarquee(10)).toBe(true)
  })

  test('returns false when the text fits (maxOffset is 0)', () => {
    expect(shouldMarquee(0)).toBe(false)
  })

  test('returns false for a negative maxOffset (defensive)', () => {
    expect(shouldMarquee(-5)).toBe(false)
  })

  test('treats sub-pixel overflow as fitting (epsilon guard)', () => {
    // The reported bug: a title that visually fits can measure a fraction of a
    // pixel wider than the container (font rounding between measurement and
    // render), which used to arm the marquee and scroll a fitting title.
    expect(shouldMarquee(MARQUEE_EPSILON_PX)).toBe(false)
    expect(shouldMarquee(MARQUEE_EPSILON_PX - 0.1)).toBe(false)
  })

  test('marquees overflow beyond the epsilon', () => {
    expect(shouldMarquee(MARQUEE_EPSILON_PX + 0.1)).toBe(true)
  })

  test('is a pure geometric gate: character length is irrelevant', () => {
    // The reported bug: a short-but-wide title (few characters, wide glyphs)
    // overflows geometrically yet never marqueed because its character length
    // was below the old animation threshold. Eligibility is overflow only.
    expect(shouldMarquee(2)).toBe(true)
  })
})

describe('shouldSwallowClick', () => {
  test('swallows the click that follows a pan drag', () => {
    expect(shouldSwallowClick(true)).toBe(true)
  })

  test('lets a plain click pass through', () => {
    expect(shouldSwallowClick(false)).toBe(false)
  })

  test('is a pure predicate: repeated calls do not change the outcome', () => {
    expect(shouldSwallowClick(true)).toBe(true)
    expect(shouldSwallowClick(true)).toBe(true)
    expect(shouldSwallowClick(false)).toBe(false)
  })
})

describe('shouldArmMarquee', () => {
  test('returns false below the activation threshold', () => {
    expect(shouldArmMarquee(0)).toBe(false)
    expect(shouldArmMarquee(2)).toBe(false)
    expect(shouldArmMarquee(-2)).toBe(false)
  })

  test('returns true at or above the activation threshold', () => {
    expect(shouldArmMarquee(3)).toBe(true)
    expect(shouldArmMarquee(50)).toBe(true)
    expect(shouldArmMarquee(-3)).toBe(true)
    expect(shouldArmMarquee(-50)).toBe(true)
  })

  test('is a pure predicate: repeated calls do not change the outcome', () => {
    expect(shouldArmMarquee(10)).toBe(true)
    expect(shouldArmMarquee(10)).toBe(true)
    expect(shouldArmMarquee(0)).toBe(false)
  })
})
