import { Entypo } from '@expo/vector-icons'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { COLORS, FONT_SIZES } from 'shared/ui/themed'
import type { SliderItemTransform } from './slider-item/slider-item.types'
import type {
  SliderItemDescriptionBackgroundStyle,
  SliderItemDescriptionTextAlign,
} from './slider-item-description/slider-item-description.types'
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import { SliderItem } from './slider-item/slider-item'
import { SliderItemSize, WhereIsSlideTitleLocated } from './slider-item/slider-item.types'
import { sliderStyles as styles } from './slider.styles'

type FontSizes = typeof FONT_SIZES

interface SliderItemsElement<D extends object> {
  data: D
  description?: string
  previewURL: string
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
  if (!items?.length) return null

  const itemsByRows = getItemsByRows(items, itemsRows)
  const marginBottom = getMarginBottom(itemsSize, titleFontSize)

  return (
    <View style={[styles.slider, { marginTop: titleFontSize / 2 }, { marginBottom }, style]}>
      <Text
        testID='title'
        onPress={onPressTitle}
        style={[styles.title, { fontSize: titleFontSize }]}
      >
        {`${title}`}
        <Entypo color={COLORS.text} name='chevron-right' size={titleFontSize} />
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {itemsByRows.map((row, i) => (
          <View key={`row-${i}`} style={styles.row} testID='slider-row'>
            {row.map(({ data, description, previewURL }, index) => (
              <SliderItem
                key={index}
                size={itemsSize}
                testID='slider-item'
                transform={transform}
                previewURL={previewURL}
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
