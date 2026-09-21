import { useMemo } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { type GestureResponderEvent } from 'react-native'
import { SCREEN_WIDTH } from 'shared/config'
import { INDENTS } from '../theme/themed'
import { SliderItem } from './slider-item/slider-item'
import { getSliderItemStride, getSliderItemWidth } from './slider-item/slider-item.lib'
import {
  type SliderItemsElement,
  type SliderItemSize,
  type SliderItemTransform,
  type WhereIsSlideTitleLocated,
} from './slider-item/slider-item.types'
import {
  type SliderItemDescriptionBackgroundStyle,
  type SliderItemDescriptionTextAlign,
} from './slider-item-description/slider-item-description.types'

interface SliderFlatListProps<D extends object> {
  descriptionBackgroundStyle?: SliderItemDescriptionBackgroundStyle
  descriptionSubTitleTextAlign?: SliderItemDescriptionTextAlign
  descriptionTitleTextAlign?: SliderItemDescriptionTextAlign
  isDescriptionTitleOnSlideLarge?: boolean
  items: SliderItemsElement<D>[]
  itemsRows: number
  itemsSize: SliderItemSize
  onPressItem?: (data: D, event: GestureResponderEvent) => void
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

const SLIDER_ITEM_ID = 'slider-item'

export const SliderFlatList = <D extends object>({
  descriptionBackgroundStyle,
  descriptionSubTitleTextAlign,
  descriptionTitleTextAlign,
  isDescriptionTitleOnSlideLarge,
  items,
  itemsRows,
  itemsSize,
  onPressItem,
  transform,
  whereIsSlideTitleLocated,
}: SliderFlatListProps<D>) => {
  const stride = getSliderItemStride(itemsSize)
  const columnCount = Math.ceil(items.length / itemsRows)
  const initialNumToRender = Math.ceil(SCREEN_WIDTH / stride) + 1

  // Contiguous slices keep the round-robin row order: column c holds items
  // c*rows..c*rows+rows-1, stacked bottom-up (column-reverse) like today.
  const columns = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, columnIndex) =>
        items.slice(columnIndex * itemsRows, columnIndex * itemsRows + itemsRows),
      ),
    [columnCount, items, itemsRows],
  )

  return (
    <FlatList
      horizontal
      data={columns}
      windowSize={5}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={initialNumToRender}
      keyExtractor={(_, index) => String(index)}
      getItemLayout={(_, index) => {
        const isLastColumn = index === columnCount - 1
        return {
          index,
          length: isLastColumn ? getSliderItemWidth(itemsSize) : stride,
          offset: stride * index,
        }
      }}
      renderItem={({ index, item: column }) => {
        const cellWidth = index === columnCount - 1 ? getSliderItemWidth(itemsSize) : stride
        return (
          <View style={{ width: cellWidth }}>
            <View style={styles.column}>
              {column.map(({ artwork, data, description }, itemIndex) => (
                <SliderItem
                  key={itemIndex}
                  size={itemsSize}
                  artwork={artwork}
                  transform={transform}
                  testID={SLIDER_ITEM_ID}
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
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column-reverse',
    gap: INDENTS.middle,
  },
})
