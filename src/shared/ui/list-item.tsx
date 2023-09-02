import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed';

interface ListItemProps<T> {
  data: T;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  previewPlaceholderText?: string;
}

type ListItemComponent = <T extends { title: string; previewUrl?: string }>(
  props: ListItemProps<T>,
) => JSX.Element | null;

export const ListItem: ListItemComponent = ({
  data: { title, previewUrl },
  testID,
  style,
  previewPlaceholderText = '',
}) => (
  <View testID={testID} style={[styles.listItem, style]}>
    <View testID='preview-or-counter' style={styles.previewOrCounter}>
      {previewUrl ? (
        <Image testID='preview' style={styles.preview} source={{ uri: previewUrl }} />
      ) : (
        <Text style={styles.counter}>{previewPlaceholderText}</Text>
      )}
    </View>
    <Text testID='title' style={styles.listItemTitle}>
      {title}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  listItem: {
    minHeight: 60,
    maxHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: FONT_SIZES.h3,
    borderBottomWidth: 1,
    padding: INDENTS.low,
    borderBottomColor: COLORS.lightGray,
    flex: 1,
  },
  previewOrCounter: {
    height: 40,
    width: 40,
    borderRadius: RADIUSES.low,
  },
  counter: {
    backgroundColor: COLORS.lightGray,
    height: '100%',

    textAlign: 'center',
    textAlignVertical: 'center',

    borderRadius: RADIUSES.low,
  },
  preview: {
    height: '100%',
    borderRadius: RADIUSES.low,
  },
});
