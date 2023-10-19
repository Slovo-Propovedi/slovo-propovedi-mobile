import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { ListItem } from './list-item';
import { TouchableItem } from './touchable-item';

export type OnPressTouchableListItem<T> = (data: T, event: GestureResponderEvent) => void;

interface TouchableListItemProps<T> {
  data: T;
  onPress: OnPressTouchableListItem<T>;
  previewPlaceholderText?: string;
  style?: StyleProp<ViewStyle>;
}

type TouchableListItemComponent = <T extends { previewUrl?: string; title: string }>(
  props: TouchableListItemProps<T>,
) => JSX.Element;

export const TouchableListItem: TouchableListItemComponent = ({
  data,
  onPress,
  previewPlaceholderText,
  style,
}) => (
  <TouchableItem onPress={(event) => onPress(data, event)} testID='container'>
    <ListItem
      data={data}
      previewPlaceholderText={previewPlaceholderText}
      style={style}
      testID='list-item'
    />
  </TouchableItem>
);
