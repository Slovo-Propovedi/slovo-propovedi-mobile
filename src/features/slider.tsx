import React from 'react';
import { GestureResponderEvent, ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SliderItem, SliderItemSize } from 'shared';

type SliderItemsElement<D extends object> = {
  previewURL: string;
  description: string;
  data: D;
};

interface SliderProps<D extends object> {
  style?: StyleProp<ViewStyle>;
  items: SliderItemsElement<D>[];
  onPressItem?: (data: D, event: GestureResponderEvent) => void;
  itemsSize?: SliderItemSize;
}

export const Slider = <D extends object>({
  style,
  items,
  onPressItem,
  itemsSize,
}: SliderProps<D>) => {
  if (!items || !items.length) {
    return null;
  }

  return (
    <ScrollView
      style={style}
      contentContainerStyle={styles.contentContainer}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {items.map(({ previewURL, description, data }, index) => (
        <SliderItem
          key={index}
          testID='slider-item'
          previewURL={previewURL}
          description={description}
          size={itemsSize}
          onPress={(event) => {
            onPressItem?.(data, event);
          }}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    gap: 10,
  },
});
