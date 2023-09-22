import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import {
  GestureResponderEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { FONT_SIZES, INDENTS } from 'shared/themed';
import { SliderItemSize, SliderItem } from './slider-item';

type SliderItemsElement<D extends object> = {
  previewURL: string;
  description?: string;
  data: D;
};

interface SliderProps<D extends object> {
  title?: string;
  items: SliderItemsElement<D>[];
  onPressTitle?: (event: GestureResponderEvent) => void;
  onPressItem?: (data: D, event: GestureResponderEvent) => void;
  itemsSize?: SliderItemSize;
  style?: StyleProp<ViewStyle>;
}

export const Slider = <D extends object>({
  title,
  items,
  onPressTitle,
  onPressItem,
  itemsSize,
  style,
}: SliderProps<D>) => {
  if (!items || !items.length) {
    return null;
  }

  return (
    <View style={style}>
      <Text testID='title' style={styles.title} onPress={onPressTitle}>
        {title}
        <FontAwesome name='chevron-right' size={20} color='black' />
      </Text>
      <ScrollView
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
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
  },
  contentContainer: {
    gap: INDENTS.low,
  },
});
