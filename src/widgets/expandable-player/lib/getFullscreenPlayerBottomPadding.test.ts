import { BAR_BOTTOM_INSET_MIN } from 'shared/ui/layout'
import { getFullscreenPlayerBottomPadding } from './getFullscreenPlayerBottomPadding'

describe('getFullscreenPlayerBottomPadding', () => {
  test('0 (web / no inset) → the tab bar bottom floor', () => {
    expect(getFullscreenPlayerBottomPadding(0)).toBe(BAR_BOTTOM_INSET_MIN)
  })

  test('8 (below the floor) → the tab bar bottom floor', () => {
    expect(getFullscreenPlayerBottomPadding(8)).toBe(BAR_BOTTOM_INSET_MIN)
  })

  test('12 (exact tie at the crossover) → 12', () => {
    expect(getFullscreenPlayerBottomPadding(12)).toBe(12)
  })

  test('16 (gesture nav inset) → 16 (inset wins)', () => {
    expect(getFullscreenPlayerBottomPadding(16)).toBe(16)
  })

  test('48 (3-button nav) → 48 (inset wins)', () => {
    expect(getFullscreenPlayerBottomPadding(48)).toBe(48)
  })

  test('100 (large inset) → 100 (inset wins when larger)', () => {
    expect(getFullscreenPlayerBottomPadding(100)).toBe(100)
  })
})
