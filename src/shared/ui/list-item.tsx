import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/constants';
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed';

export enum ListItemSize {
  Middle = 'middle',
  Small = 'small',
}

interface ListItemProps<T> {
  data: T;
  previewPlaceholderText?: string;
  size?: ListItemSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

type ListItemComponent = <T extends { previewUrl?: string; title: string }>(
  props: ListItemProps<T>,
) => JSX.Element | null;

export const ListItem: ListItemComponent = ({
  data: { previewUrl, title },
  previewPlaceholderText = '',
  size = ListItemSize.Small,
  style,
  testID,
}) => (
  <View style={[styles.component, style]} testID={testID}>
    <View
      style={[
        styles.previewOrCounter,
        {
          [ListItemSize.Middle]: styles.previewOrCounterMiddle,
          [ListItemSize.Small]: styles.previewOrCounterSmall,
        }[size],
      ]}
      testID='preview-or-counter'
    >
      {previewUrl ? (
        <Image source={{ uri: previewUrl }} style={styles.preview} testID='preview' />
      ) : (
        <Text style={styles.counter}>{previewPlaceholderText}</Text>
      )}
    </View>
    <View style={styles.textsContainer}>
      <Text style={styles.listItemTitle} testID='title'>
        {title}
      </Text>
    </View>
  </View>
);

const previewOrCounterSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.25; /* 25% */

const styles = StyleSheet.create({
  component: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 'auto',
    justifyContent: 'center',
    minHeight: 60,
  },
  counter: {
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUSES.low,

    height: '100%',
    textAlign: 'center',

    textAlignVertical: 'center',
  },
  listItemTitle: {
    fontSize: FONT_SIZES.h2,
  },
  preview: {
    borderRadius: RADIUSES.low,
    height: '100%',
  },
  previewOrCounter: {
    borderRadius: RADIUSES.low,
    marginVertical: INDENTS.middle,
  },
  previewOrCounterMiddle: {
    height: previewOrCounterSize,
    width: previewOrCounterSize,
  },
  previewOrCounterSmall: {
    height: 40,
    width: 40,
  },
  textsContainer: {
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
    flex: 1,
    height: '100%',
    marginHorizontal: INDENTS.high,
    paddingVertical: INDENTS.high,
  },
});
