import { useMemo } from 'react'
import { FlatList, type GestureResponderEvent, StyleSheet, View } from 'react-native'
import { SCREEN_WIDTH } from '../../config/screen-dimensions'
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
  type SliderItemTextAlign,
  type SliderItemTextBackgroundStyle,
} from './slider-item-text/slider-item-text.types'

interface SliderFlatListProps<D extends object> {
  borderRadius?: boolean
  descriptionBackgroundStyle?: SliderItemTextBackgroundStyle
  isDescriptionTitleOnSlideLarge?: boolean
  items: SliderItemsElement<D>[]
  itemsRows: number
  itemsSize: SliderItemSize
  onPressItem?: (data: D, event: GestureResponderEvent) => void
  titleTextAlign?: SliderItemTextAlign
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

const SLIDER_ITEM_ID = 'slider-item'

export const SliderFlatList = <D extends object>({
  borderRadius,
  descriptionBackgroundStyle,
  isDescriptionTitleOnSlideLarge,
  items,
  itemsRows,
  itemsSize,
  onPressItem,
  titleTextAlign,
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
              {column.map(({ artwork, artworkIcon, data, description, title }, itemIndex) => (
                <SliderItem
                  title={title}
                  key={itemIndex}
                  size={itemsSize}
                  artwork={artwork}
                  transform={transform}
                  testID={SLIDER_ITEM_ID}
                  artworkIcon={artworkIcon}
                  description={description}
                  borderRadius={borderRadius}
                  titleTextAlign={titleTextAlign}
                  onPress={event => onPressItem?.(data, event)}
                  whereIsSlideTitleLocated={whereIsSlideTitleLocated}
                  descriptionBackgroundStyle={descriptionBackgroundStyle}
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
