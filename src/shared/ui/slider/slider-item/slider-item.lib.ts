import { match } from 'ts-pattern'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/config'
import { INDENTS } from '../../theme/themed'
import { SliderItemSize } from './slider-item.types'

export const getSliderItemWidth = (size: SliderItemSize): number =>
  match(size)
    .with(SliderItemSize.Large, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.62)
    .with(SliderItemSize.Middle, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.44)
    .with(SliderItemSize.Small, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.285)
    .with(SliderItemSize.XLarge, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.9)
    .exhaustive()

// Full horizontal step between two neighbouring items: the item width plus the
// inter-item gap. The virtualized slider uses it to lay every column out.
export const getSliderItemStride = (size: SliderItemSize): number =>
  getSliderItemWidth(size) + INDENTS.middle
