import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZES, INDENTS } from 'shared/themed';
import type { SliderItemSize } from './slider-item';
import { SliderItem } from './slider-item';

type SliderItemsElement<D extends object> = {
  data: D;
  description?: string;
  previewURL: string;
};

interface SliderProps<D extends object> {
  isShort?: boolean;
  items: SliderItemsElement<D>[];
  itemsRows?: number;
  itemsSize?: SliderItemSize;
  onPressItem?: (data: D, event: GestureResponderEvent) => void;
  onPressTitle?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  title?: string;
}

export const Slider = <D extends object>({
  isShort,
  items,
  itemsRows = 1,
  itemsSize,
  onPressItem,
  onPressTitle,
  style,
  title,
}: SliderProps<D>) => {
  if (!items || !items.length) {
    return null;
  }

  let rowIndex = 0;
  const itemsByRows = items.reduce<SliderItemsElement<D>[][]>((accumulator, currentItem) => {
    rowIndex++;

    if (rowIndex == itemsRows) {
      rowIndex = 0;
    }

    if (accumulator[rowIndex]) {
      accumulator[rowIndex].push(currentItem);

      return accumulator;
    }

    accumulator[rowIndex] = [currentItem];

    return accumulator;
  }, []);

  return (
    <View style={[styles.slider, style]}>
      <Text onPress={onPressTitle} style={styles.title} testID='title'>
        {title}
        <Text>{'>'}</Text>
      </Text>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {itemsByRows.map((row, index) => (
          <View key={`row-${index}`} style={styles.row} testID='slider-row'>
            {row.map(({ data, description, previewURL }, index) => (
              <SliderItem
                description={description}
                isShort={isShort}
                key={index}
                onPress={(event) => {
                  onPressItem?.(data, event);
                }}
                previewURL={previewURL}
                size={itemsSize}
                testID='slider-item'
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'column-reverse',
    gap: INDENTS.low,
  },
  row: {
    flexDirection: 'row',
    gap: INDENTS.low,
    maxWidth: '100%',
    width: '100%',
  },
  slider: { maxWidth: '100%' },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
  },
});
