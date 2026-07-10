import { Entypo } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { FONT_SIZES, useTheme } from '../themed'
import { SliderItem } from './slider-item/slider-item'
import {
  SliderItemSize,
  type SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item/slider-item.types'
import {
  type SliderItemDescriptionBackgroundStyle,
  type SliderItemDescriptionTextAlign,
} from './slider-item-description/slider-item-description.types'
import { SliderSkeleton } from './slider-skeleton'
import { createSliderStyles as styles } from './slider.styles'

type FontSizes = typeof FONT_SIZES

interface SliderItemsElement<D extends object> {
  artwork: string | undefined
  data: D
  description?: string
}

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

const getItemsByRows = <D extends object>(items: SliderItemsElement<D>[], itemsRows: number) => {
  let rowIndex = 0
  return items.reduce<SliderItemsElement<D>[][]>((acc, item) => {
    if (!acc[rowIndex]) acc[rowIndex] = []
    acc[rowIndex].push(item)
    rowIndex++
    if (rowIndex >= itemsRows) rowIndex = 0
    return acc
  }, [])
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

  if (!items?.length) return null

  const itemsByRows = getItemsByRows(items, itemsRows)
  const marginBottom = getMarginBottom(itemsSize, titleFontSize)

  return (
    <View style={[sliderStyles.slider, { marginTop: titleFontSize / 2 }, { marginBottom }, style]}>
      <Text
        testID='title'
        onPress={onPressTitle}
        style={[sliderStyles.title, { fontSize: titleFontSize }]}
      >
        {`${title}`}
        <Entypo name='chevron-right' size={titleFontSize} color={currentTheme.text} />
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sliderStyles.contentContainer}
      >
        {itemsByRows.map((row, i) => (
          <View key={`row-${i}`} testID='slider-row' style={sliderStyles.row}>
            {row.map(({ artwork, data, description }, index) => (
              <SliderItem
                key={index}
                size={itemsSize}
                artwork={artwork}
                testID='slider-item'
                transform={transform}
                descriptionTitle={description}
                onPress={event => onPressItem?.(data, event)}
                whereIsSlideTitleLocated={whereIsSlideTitleLocated}
                descriptionTitleTextAlign={descriptionTitleTextAlign}
                descriptionBackgroundStyle={descriptionBackgroundStyle}
                descriptionSubTitleTextAlign={descriptionSubTitleTextAlign}
                isDescriptionTitleOnSlideLarge={isDescriptionTitleOnSlideLarge}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

Slider.Skeleton = SliderSkeleton
