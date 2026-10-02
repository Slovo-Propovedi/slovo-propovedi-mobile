import { match } from 'ts-pattern'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from '../../../config/screen-dimensions'
import { FONT_SIZES, INDENTS } from '../../theme/themed'
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

// Font size for the playlist description overlay on a card, scaled by item
// size. Kept below the card title size (FONT_SIZES.h3) so the description never
// outshouts the title.
export const getDescriptionOnCardFontSize = (size: SliderItemSize): number =>
  match(size)
    .with(SliderItemSize.Small, () => FONT_SIZES.xs)
    .with(SliderItemSize.Middle, () => FONT_SIZES.sm)
    .with(SliderItemSize.Large, () => FONT_SIZES.base)
    .with(SliderItemSize.XLarge, () => FONT_SIZES.md)
    .exhaustive()

// Larger cards get one more line: the description stays legible without
// covering the artwork.
export const getDescriptionOnCardNumberOfLines = (size: SliderItemSize): number =>
  match(size)
    .with(SliderItemSize.Small, () => 2)
    .with(SliderItemSize.Middle, () => 2)
    .with(SliderItemSize.Large, () => 3)
    .with(SliderItemSize.XLarge, () => 3)
    .exhaustive()
