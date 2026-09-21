import { View } from 'react-native'
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { FONT_SIZES } from '../theme/themed'
import { useMouseDragScroll } from './lib/useMouseDragScroll'
import { SliderFlatList } from './slider-flat-list'
import {
  type SliderItemsElement,
  SliderItemSize,
  type SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item/slider-item.types'
import {
  type SliderItemDescriptionBackgroundStyle,
  type SliderItemDescriptionTextAlign,
} from './slider-item-description/slider-item-description.types'
import { SliderSkeleton } from './slider-skeleton'
import { SliderTitle } from './slider-title'
import { createSliderStyles as styles } from './slider.styles'

type FontSizes = typeof FONT_SIZES

interface SliderProps<D extends object> {
  descriptionBackgroundStyle?: SliderItemDescriptionBackgroundStyle
  descriptionSubTitleTextAlign?: SliderItemDescriptionTextAlign
  descriptionTitleTextAlign?: SliderItemDescriptionTextAlign
  isDescriptionTitleOnSlideLarge?: boolean
  items: SliderItemsElement<D>[]
  itemsRows?: number
  itemsSize?: SliderItemSize
  onPressItem?: (data: D, event: GestureResponderEvent) => void
  onPressTitle?: (event: GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
  title?: string
  titleFontSize?: FontSizes[keyof FontSizes]
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

const getMarginBottom = (itemsSize: SliderItemSize, titleFontSize: number): number =>
  ({
    [SliderItemSize.Large]: titleFontSize * 2,
    [SliderItemSize.Middle]: titleFontSize,
    [SliderItemSize.Small]: titleFontSize,
    [SliderItemSize.XLarge]: titleFontSize * 2,
  })[itemsSize]

export const Slider = <D extends object>({
  descriptionBackgroundStyle,
  descriptionSubTitleTextAlign,
  descriptionTitleTextAlign,
  isDescriptionTitleOnSlideLarge,
  items,
  itemsRows = 1,
  itemsSize = SliderItemSize.Small,
  onPressItem,
  onPressTitle,
  style,
  title,
  titleFontSize = FONT_SIZES.h2,
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SliderProps<D>) => {
  const { currentTheme } = useTheme()
  const sliderStyles = styles(currentTheme)
  const wrapperRef = useMouseDragScroll()

  if (!items?.length) return null

  const marginBottom = getMarginBottom(itemsSize, titleFontSize)

  return (
    <View style={[sliderStyles.slider, { marginTop: titleFontSize / 2 }, { marginBottom }, style]}>
      <SliderTitle title={title} onPress={onPressTitle} fontSize={titleFontSize} />
      <View ref={wrapperRef} style={sliderStyles.flexFill}>
        <SliderFlatList
          items={items}
          itemsRows={itemsRows}
          itemsSize={itemsSize}
          transform={transform}
          onPressItem={onPressItem}
          whereIsSlideTitleLocated={whereIsSlideTitleLocated}
          descriptionTitleTextAlign={descriptionTitleTextAlign}
          descriptionBackgroundStyle={descriptionBackgroundStyle}
          descriptionSubTitleTextAlign={descriptionSubTitleTextAlign}
          isDescriptionTitleOnSlideLarge={isDescriptionTitleOnSlideLarge}
        />
      </View>
    </View>
  )
}

Slider.Skeleton = SliderSkeleton
