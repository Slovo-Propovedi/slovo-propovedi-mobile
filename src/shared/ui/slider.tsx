import { Entypo } from '@expo/vector-icons';
import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed';
import { SliderItem, SliderItemSize, WhereIsSlideTitleLocated } from './slider-item';
import type { SliderItemTransform } from './slider-item';
import type {
  SliderItemDescriptionBackgroundStyle,
  SliderItemDescriptionTextAlign,
} from './slider-item-description';

type SliderItemsElement<D extends object> = {
  data: D;
  description?: string;
  previewURL: string;
};

interface SliderProps<D extends object> {
  descriptionBackgroundStyle?: SliderItemDescriptionBackgroundStyle;
  descriptionSubTitleTextAlign?: SliderItemDescriptionTextAlign;
  descriptionTitleTextAlign?: SliderItemDescriptionTextAlign;
  isDescriptionTitleOnSlideLarge?: boolean;
  items: SliderItemsElement<D>[];
  itemsRows?: number;
  itemsSize?: SliderItemSize;
  onPressItem?: (data: D, event: GestureResponderEvent) => void;
  onPressTitle?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  title?: string;
  titleFontSize?: typeof FONT_SIZES;
  transform?: SliderItemTransform;
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated;
}

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
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SliderProps<D>) => {
  if (!items || !items.length) return null;

  let rowIndex = 0;
  const itemsByRows = items.reduce<SliderItemsElement<D>[][]>((accumulator, currentItem) => {
    rowIndex++;

    if (rowIndex == itemsRows) rowIndex = 0;

    if (accumulator[rowIndex]) {
      accumulator[rowIndex].push(currentItem);

      return accumulator;
    }

    accumulator[rowIndex] = [currentItem];

    return accumulator;
  }, []);

  const titleFontSize = FONT_SIZES.h2;

  const marginBottom = {
    [SliderItemSize.Large]: titleFontSize * 2,
    [SliderItemSize.Middle]: titleFontSize,
    [SliderItemSize.Small]: titleFontSize,
    [SliderItemSize.XLarge]: titleFontSize * 2,
  }[itemsSize];

  return (
    <View style={[styles.slider, { marginTop: titleFontSize / 2 }, { marginBottom }, style]}>
      <Text
        onPress={onPressTitle}
        style={[styles.title, { fontSize: titleFontSize }]}
        testID='title'
      >
        {`${title}`}
        <Entypo color={COLORS.black} name='chevron-right' size={titleFontSize} />
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
                descriptionBackgroundStyle={descriptionBackgroundStyle}
                descriptionSubTitleTextAlign={descriptionSubTitleTextAlign}
                descriptionTitle={description}
                descriptionTitleTextAlign={descriptionTitleTextAlign}
                isDescriptionTitleOnSlideLarge={isDescriptionTitleOnSlideLarge}
                key={index}
                onPress={event => {
                  onPressItem?.(data, event);
                }}
                previewURL={previewURL}
                size={itemsSize}
                testID='slider-item'
                transform={transform}
                whereIsSlideTitleLocated={whereIsSlideTitleLocated}
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
    gap: INDENTS.middle,
  },
  row: {
    flexDirection: 'row',
    gap: INDENTS.middle,
    maxWidth: '100%',
    width: '100%',
  },
  slider: { maxWidth: '100%' },
  title: {
    fontWeight: 'bold',
    paddingBottom: INDENTS.middle,
    paddingLeft: INDENTS.lowest,
  },
});
