import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from '../../../config/screen-dimensions'
import { getSliderItemWidth } from './slider-item.lib'
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
