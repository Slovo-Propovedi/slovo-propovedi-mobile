import React from 'react';
import {
  GestureResponderEvent,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, TouchableItem } from 'shared';

export type OnPressTouchableListItem<T> = (data: T, event: GestureResponderEvent) => void;

interface TouchableListItemProps<T> {
  style?: StyleProp<ViewStyle>;
  index: number;
  data: T;
  onPress: OnPressTouchableListItem<T>;
}

type TouchableListItemComponent = <T extends { title: string; previewUrl?: string }>(
  props: TouchableListItemProps<T>,
) => JSX.Element;

export const TouchableListItem: TouchableListItemComponent = ({
  style,
  index,
  data,
  data: { title, previewUrl },
  onPress,
}) => (
  <TouchableItem style={[styles.listItem, style]} onPress={(event) => onPress(data, event)}>
    <View style={styles.previewOrCounter}>
      {previewUrl ? (
        <Image style={styles.preview} source={{ uri: previewUrl }} />
      ) : (
        <Text style={styles.counter}>{index + 1}</Text>
      )}
    </View>
    <Text style={styles.listItemTitle}>{title}</Text>
  </TouchableItem>
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
