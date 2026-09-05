import type { SectionData } from 'shared/model'
import { getFirstSectionLayout } from './first-section-layout'

jest.mock('shared/config/screen-dimensions', () => ({
  SCREEN_HEIGHT: 640,
  SCREEN_WIDTH: 320,
  SIZE_OF_MINIMUM_SIDE_OF_SCREEN: 320,
}))

const mockScreenDimensions = jest.requireMock('shared/config/screen-dimensions') as {
  SCREEN_HEIGHT: number
  SCREEN_WIDTH: number
  SIZE_OF_MINIMUM_SIDE_OF_SCREEN: number
}

const makeSection = (itemsSize: SectionData['itemsSize']): SectionData => ({
  id: 'section-1',
  itemsSize,
  playlists: [],
  title: 'Section',
  transform: 'short',
})

describe('getFirstSectionLayout', () => {
  beforeEach(() => {
    mockScreenDimensions.SCREEN_WIDTH = 320
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 320
  })

  test('returns undefined section and full button for empty sections when not loading', () => {
    expect(getFirstSectionLayout([], false)).toEqual({
      buttonWidth: 224,
      sectionMinWidth: undefined,
      stacked: false,
    })
  })

  test('returns Small card + slider padding while loading skeleton', () => {
    // Small: 320 * 0.285 = 91.2; ideal = 91.2 + 24 = 115.2; round → 115
    expect(getFirstSectionLayout([], true)).toEqual({
      buttonWidth: 157,
      sectionMinWidth: 115,
      stacked: false,
    })
  })

  test('returns the mapped card width + padding for the first section', () => {
    // Middle: 320 * 0.44 = 140.8; ideal = 140.8 + 24 = 164.8; round → 165
    expect(getFirstSectionLayout([makeSection('middle')], false)).toEqual({
      buttonWidth: 107,
      sectionMinWidth: 165,
      stacked: false,
    })
  })

  test('keeps the loaded Middle width during a background refetch', () => {
    // Same as loaded Middle — refetch does not fall back to skeleton Small
    expect(getFirstSectionLayout([makeSection('middle')], true)).toEqual({
      buttonWidth: 107,
      sectionMinWidth: 165,
      stacked: false,
    })
  })

  test('keeps a narrow-but-sufficient row for Large sections on 320px', () => {
    // Large: 320 * 0.62 = 198.4; ideal = 222.4; round → 222; 222 + 44 = 266 ≤ 272 → row
    expect(getFirstSectionLayout([makeSection('large')], false)).toEqual({
      buttonWidth: 50,
      sectionMinWidth: 222,
      stacked: false,
    })
  })

  test('keeps the XLarge section in a row on 320px (320 ≥ 250)', () => {
    // XLarge: 320 * 0.9 = 288; ideal = 312; 320 ≥ 250 → not stacked (old <360 rule removed)
    // sectionMinWidth = min(312, 272 − 44) = 228; button = 272 − 228 = 44
    expect(getFirstSectionLayout([makeSection('xLarge')], false)).toEqual({
      buttonWidth: 44,
      sectionMinWidth: 228,
      stacked: false,
    })
  })

  test('keeps the cap + floor row behavior for XLarge on a 390px screen', () => {
    mockScreenDimensions.SCREEN_WIDTH = 390
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 390

    // XLarge: 390 * 0.9 = 351; ideal = 375; 390 ≥ 250 → not stacked
    // sectionMinWidth = min(375, 342 − 44) = 298; button = 44
    expect(getFirstSectionLayout([makeSection('xLarge')], false)).toEqual({
      buttonWidth: 44,
      sectionMinWidth: 298,
      stacked: false,
    })
  })

  test('stacks and lets the button shrink below 224 only on sub-250px screens', () => {
    mockScreenDimensions.SCREEN_WIDTH = 150
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 150

    // 150 < 250 → stacked; buttonWidth = min(224, 150 − 32) = 118
    expect(getFirstSectionLayout([makeSection('small')], false)).toEqual({
      buttonWidth: 118,
      sectionMinWidth: undefined,
      stacked: true,
    })
  })

  test('stacks on a 165px screen', () => {
    mockScreenDimensions.SCREEN_WIDTH = 165
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 165

    // 165 < 250 → stacked; buttonWidth = min(224, 165 − 32) = 133
    expect(getFirstSectionLayout([makeSection('small')], false)).toEqual({
      buttonWidth: 133,
      sectionMinWidth: undefined,
      stacked: true,
    })
  })

  test('stacks on a 240px screen (240 < 250 boundary)', () => {
    mockScreenDimensions.SCREEN_WIDTH = 240
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 240

    // 240 < 250 → stacked; buttonWidth = min(224, 240 − 32) = 208
    expect(getFirstSectionLayout([makeSection('small')], false)).toEqual({
      buttonWidth: 208,
      sectionMinWidth: undefined,
      stacked: true,
    })
  })

  test('keeps the row on a 250px screen (250 is NOT < 250 boundary)', () => {
    mockScreenDimensions.SCREEN_WIDTH = 250
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 250

    // Small: 250 * 0.285 = 71.25; ideal = 71.25 + 24 = 95.25; round → 95
    // 250 ≥ 250 → not stacked; available = 202; button = 202 − 95 = 107
    expect(getFirstSectionLayout([makeSection('small')], false)).toEqual({
      buttonWidth: 107,
      sectionMinWidth: 95,
      stacked: false,
    })
  })

  test('caps the button at TOTAL_SIZE on wide screens', () => {
    mockScreenDimensions.SCREEN_WIDTH = 800
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 320

    // Small: 320 * 0.285 = 91.2; ideal = 115.2; round → 115; button = 800−48−115 = 637 → cap 224
    expect(getFirstSectionLayout([makeSection('small')], false)).toEqual({
      buttonWidth: 224,
      sectionMinWidth: 115,
      stacked: false,
    })
  })

  test('caps the EmptyState button below TOTAL_SIZE on a sub-256px screen', () => {
    mockScreenDimensions.SCREEN_WIDTH = 165
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 165

    // EmptyState (не loading): buttonWidth = min(224, 165 − 32) = 133; stacked всегда false
    expect(getFirstSectionLayout([], false)).toEqual({
      buttonWidth: 133,
      sectionMinWidth: undefined,
      stacked: false,
    })
  })
})
