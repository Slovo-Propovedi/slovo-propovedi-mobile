import { getFullscreenPlayerBottomPadding } from './getFullscreenPlayerBottomPadding'

describe('getFullscreenPlayerBottomPadding', () => {
  test('0 (web / no inset) → 30 (tab bar minimum)', () => {
    expect(getFullscreenPlayerBottomPadding(0)).toBe(30)
  })

  test('16 (gesture nav) → 30 (tab bar minimum)', () => {
    expect(getFullscreenPlayerBottomPadding(16)).toBe(30)
  })

  test('24 → 30 (below the crossover)', () => {
    expect(getFullscreenPlayerBottomPadding(24)).toBe(30)
  })

  test('30 → 30 (exact tie at the crossover)', () => {
    expect(getFullscreenPlayerBottomPadding(30)).toBe(30)
  })

  test('48 (3-button nav) → 48 (inset wins)', () => {
    expect(getFullscreenPlayerBottomPadding(48)).toBe(48)
  })

  test('100 (large inset) → 100 (inset wins when larger)', () => {
    expect(getFullscreenPlayerBottomPadding(100)).toBe(100)
  })
})
