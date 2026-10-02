import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from '../../../config/screen-dimensions'
import { FONT_SIZES, INDENTS } from '../../../ui/theme/themed'
import {
  getDescriptionOnCardFontSize,
  getDescriptionOnCardNumberOfLines,
  getSliderItemStride,
  getSliderItemWidth,
} from './slider-item.lib'
import { SliderItemSize } from './slider-item.types'

describe('getSliderItemWidth', () => {
  test.each([
    [SliderItemSize.Large, 0.62],
    [SliderItemSize.Middle, 0.44],
    [SliderItemSize.Small, 0.285],
    [SliderItemSize.XLarge, 0.9],
  ])('applies the %s factor to the minimum side of the screen', (size, factor) => {
    expect(getSliderItemWidth(size)).toBe(SIZE_OF_MINIMUM_SIDE_OF_SCREEN * factor)
  })
})

describe('getSliderItemStride', () => {
  test('adds the middle indent to the item width', () => {
    expect(getSliderItemStride(SliderItemSize.Small)).toBe(
      getSliderItemWidth(SliderItemSize.Small) + INDENTS.middle,
    )
  })
})

describe('getDescriptionOnCardFontSize', () => {
  test('grows with the item size but stays below the card title size', () => {
    expect(getDescriptionOnCardFontSize(SliderItemSize.Small)).toBe(FONT_SIZES.xs)
    expect(getDescriptionOnCardFontSize(SliderItemSize.XLarge)).toBe(FONT_SIZES.md)
    expect(getDescriptionOnCardFontSize(SliderItemSize.XLarge)).toBeLessThan(FONT_SIZES.h3)
  })
})

describe('getDescriptionOnCardNumberOfLines', () => {
  test('allows more lines on larger cards', () => {
    expect(getDescriptionOnCardNumberOfLines(SliderItemSize.Small)).toBe(2)
    expect(getDescriptionOnCardNumberOfLines(SliderItemSize.XLarge)).toBe(3)
  })
})
