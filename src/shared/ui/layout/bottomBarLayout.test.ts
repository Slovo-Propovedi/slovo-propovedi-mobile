import { SLIDER_REST_INSET } from '../slider/slider-layout.lib'
import {
  BAR_BOTTOM_INSET_MIN,
  BAR_CIRCLE_SIZE_EXPANDED,
  BAR_PILL_ROW_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET_COLLAPSED,
  BAR_SIDE_INSET_EXPANDED,
  getBarBottomPadding,
  getBarSideInset,
  IOS_WEB_ISLANDS_GAP,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from './bottomBarLayout'

describe('bottom bar geometry', () => {
  test('the row and the expanded chrome share the slimmer 60dp silhouette', () => {
    expect(BAR_ROW_MIN_HEIGHT).toBe(68)
    expect(TAB_BAR_ISLAND_HEIGHT_EXPANDED).toBe(60)
    expect(BAR_CIRCLE_SIZE_EXPANDED).toBe(60)
    expect(BAR_CIRCLE_SIZE_EXPANDED).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(BAR_PILL_ROW_GAP).toBe(8)
  })

  test('the web bottom gap mirrors the expanded chrome side insets', () => {
    expect(getBarBottomPadding(0, true)).toBe(25)
    expect(getBarBottomPadding(0, true)).toBe(BAR_SIDE_INSET_EXPANDED)
    expect(getBarBottomPadding(0, true)).toBe(SLIDER_REST_INSET + 1)
  })

  test('pins the 21dp islands gap: 8px below the indicator + 8px above + the 5px bar', () => {
    expect(IOS_WEB_ISLANDS_GAP).toBe(8 + 5 + 8)
  })
})

describe('getBarBottomPadding', () => {
  test('native: a real inset wins and the inset-less floor stays 12', () => {
    expect(BAR_BOTTOM_INSET_MIN).toBe(12)
    expect(getBarBottomPadding(0, false)).toBe(12)
    expect(getBarBottomPadding(8, false)).toBe(8)
    expect(getBarBottomPadding(34, false)).toBe(34)
  })

  test('web: the visible gap cannot be smaller than the side insets', () => {
    expect(getBarBottomPadding(0, true)).toBe(25)
    expect(getBarBottomPadding(10, true)).toBe(25)
    expect(getBarBottomPadding(34, true)).toBe(34)
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
