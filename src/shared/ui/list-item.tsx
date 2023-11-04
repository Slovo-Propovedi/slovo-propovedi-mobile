import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed';

interface ListItemProps<T> {
  data: T;
  previewPlaceholderText?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

type ListItemComponent = <T extends { previewUrl?: string; title: string }>(
  props: ListItemProps<T>,
) => JSX.Element | null;

export const ListItem: ListItemComponent = ({
  data: { previewUrl, title },
  previewPlaceholderText = '',
  style,
  testID,
}) => (
  <View style={[styles.listItem, style]} testID={testID}>
    <View style={styles.previewOrCounter} testID='preview-or-counter'>
      {previewUrl ? (
        <Image source={{ uri: previewUrl }} style={styles.preview} testID='preview' />
      ) : (
        <Text style={styles.counter}>{previewPlaceholderText}</Text>
      )}
    </View>
    <Text style={styles.listItemTitle} testID='title'>
      {title}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  counter: {
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUSES.low,

    height: '100%',
    textAlign: 'center',

    textAlignVertical: 'center',
  },
  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    maxHeight: 100,
    minHeight: 60,
  },
  listItemTitle: {
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
    flex: 1,
    fontSize: FONT_SIZES.h3,
    padding: INDENTS.middle,
  },
  preview: {
    borderRadius: RADIUSES.low,
    height: '100%',
  },
  previewOrCounter: {
    borderRadius: RADIUSES.low,
    height: 40,
    width: 40,
  },
});
