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
  // The mapper clamps itemsRows, but a rogue value must never reach layout
  // arithmetic (Infinity/negative column counts would crash rendering).
  const rows = Number.isFinite(itemsRows) && itemsRows >= 1 ? itemsRows : 1
  const columnCount = Math.ceil(items.length / rows)
  const initialNumToRender = Math.ceil(SCREEN_WIDTH / stride) + 1

  // Contiguous slices keep the round-robin row order: column c holds items
  // c*rows..c*rows+rows-1, stacked bottom-up (column-reverse) like today.
  const columns = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, columnIndex) =>
        items.slice(columnIndex * rows, columnIndex * rows + rows),
      ),
    [columnCount, items, rows],
  )

  // The last column has no trailing gap, so its width differs from the stride.
  const getColumnWidth = (index: number) =>
    index === columnCount - 1 ? getSliderItemWidth(itemsSize) : stride

  return (
    <FlatList
      horizontal
      data={columns}
      windowSize={5}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={initialNumToRender}
      keyExtractor={(_, index) => String(index)}
      getItemLayout={(_, index) => ({
        index,
        length: getColumnWidth(index),
        offset: stride * index,
      })}
      renderItem={({ index, item: column }) => {
        const cellWidth = getColumnWidth(index)
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
