import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SliderItem, SliderItemProps } from 'shared';

type SliderItemsElement<D extends object> = Omit<SliderItemProps, 'onPress'> & { data: D };

interface SliderProps<D extends object> {
  items: SliderItemsElement<D>[];
  onPressItem?: (data: D) => void;
}

export const Slider = <D extends object>({ items, onPressItem }: SliderProps<D>) => {
  if (!items || !items.length) {
    return null;
  }

  return (
    <ScrollView>
      {items.map(({ previewURL, description, size, data }, index) => (
        <SliderItem
          key={index}
          testID='slider-item'
          previewURL={previewURL}
          description={description}
          size={size}
          onPress={() => {
            onPressItem?.(data);
          }}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({});
