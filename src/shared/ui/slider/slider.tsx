import { type GestureResponderEvent, type StyleProp, View, type ViewStyle } from 'react-native'
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
  type SliderItemTextAlign,
  type SliderItemTextBackgroundStyle,
} from './slider-item-text/slider-item-text.types'
import { SliderSkeleton } from './slider-skeleton'
import { getMarginBottom } from './slider-skeleton.lib'
import { SliderTitle } from './slider-title'
import { createSliderStyles as styles } from './slider.styles'

type FontSizes = typeof FONT_SIZES

interface SliderProps<D extends object> {
  borderRadius?: boolean
  descriptionBackgroundStyle?: SliderItemTextBackgroundStyle
  isDescriptionTitleOnSlideLarge?: boolean
  items: SliderItemsElement<D>[]
  itemsRows?: number
  itemsSize?: SliderItemSize
  onPressItem?: (data: D, event: GestureResponderEvent) => void
  onPressTitle?: (event: GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
  title?: string
  titleFontSize?: FontSizes[keyof FontSizes]
  titleTextAlign?: SliderItemTextAlign
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

export const Slider = <D extends object>({
  borderRadius,
  descriptionBackgroundStyle,
  isDescriptionTitleOnSlideLarge,
  items,
  itemsRows = 1,
  itemsSize = SliderItemSize.Small,
  onPressItem,
  onPressTitle,
  style,
  title,
  titleFontSize = FONT_SIZES.h2,
  titleTextAlign,
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
          borderRadius={borderRadius}
          titleTextAlign={titleTextAlign}
          whereIsSlideTitleLocated={whereIsSlideTitleLocated}
          descriptionBackgroundStyle={descriptionBackgroundStyle}
          isDescriptionTitleOnSlideLarge={isDescriptionTitleOnSlideLarge}
        />
      </View>
    </View>
  )
}

Slider.Skeleton = SliderSkeleton
