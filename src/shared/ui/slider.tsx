import { FontAwesome } from '@expo/vector-icons';
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
  items: SliderItemsElement<D>[];
  itemsSize?: SliderItemSize;
  onPressItem?: (data: D, event: GestureResponderEvent) => void;
  onPressTitle?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  title?: string;
}

export const Slider = <D extends object>({
  items,
  itemsSize,
  onPressItem,
  onPressTitle,
  style,
  title,
}: SliderProps<D>) => {
  if (!items || !items.length) {
    return null;
  }

  return (
    <View style={style}>
      <Text onPress={onPressTitle} style={styles.title} testID='title'>
        {title}
        <FontAwesome color='black' name='chevron-right' size={20} />
      </Text>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {items.map(({ data, description, previewURL }, index) => (
          <SliderItem
            description={description}
            key={index}
            onPress={(event) => {
              onPressItem?.(data, event);
            }}
            previewURL={previewURL}
            size={itemsSize}
            testID='slider-item'
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    gap: INDENTS.low,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
  },
});
