import { SLIDER_REST_INSET } from '../slider/slider-layout.lib'
import {
  BAR_BOTTOM_INSET_MIN,
  BAR_SIDE_INSET_COLLAPSED,
  BAR_SIDE_INSET_EXPANDED,
  getBarBottomPadding,
  getBarSideInset,
} from './bottomBarLayout'

describe('getBarBottomPadding', () => {
  test('real inset wins: the islands sit flush on the safe-area line', () => {
    expect(getBarBottomPadding(34)).toBe(34)
    expect(getBarBottomPadding(8)).toBe(8)
  })

  test('inset-less screen keeps the desktop/web clearance floor', () => {
    expect(getBarBottomPadding(0)).toBe(BAR_BOTTOM_INSET_MIN)
  })

  test('real inset wins even below the floor', () => {
    expect(getBarBottomPadding(8)).toBe(8)
  })

  test('browser clearance keeps the floor above a real inset', () => {
    expect(getBarBottomPadding(34, true)).toBe(34 + BAR_BOTTOM_INSET_MIN)
  })

  test('browser clearance keeps the floor on inset-less screens', () => {
    expect(getBarBottomPadding(0, true)).toBe(BAR_BOTTOM_INSET_MIN)
  })
})

describe('getBarSideInset', () => {
  test('expanded bar sits 1 px right of the sliders rest inset', () => {
    expect(BAR_SIDE_INSET_EXPANDED).toBe(SLIDER_REST_INSET + 1)
    expect(getBarSideInset(0)).toBe(SLIDER_REST_INSET + 1)
  })

  test('one-line bar keeps its original 1.5x the sliders rest inset', () => {
    expect(BAR_SIDE_INSET_COLLAPSED).toBe(SLIDER_REST_INSET * 1.5)
    expect(getBarSideInset(1)).toBe(SLIDER_REST_INSET * 1.5)
  })

  test('interpolates and clamps the progress', () => {
    expect(getBarSideInset(0.5)).toBe(SLIDER_REST_INSET * 1.25 + 0.5)
    expect(getBarSideInset(0.5)).toBe((BAR_SIDE_INSET_EXPANDED + BAR_SIDE_INSET_COLLAPSED) / 2)
    expect(getBarSideInset(-1)).toBe(BAR_SIDE_INSET_EXPANDED)
    expect(getBarSideInset(2)).toBe(BAR_SIDE_INSET_COLLAPSED)
  })
})
