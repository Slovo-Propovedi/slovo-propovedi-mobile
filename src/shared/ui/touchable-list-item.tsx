import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import type { ListItemSize } from './list-item';
import { ListItem } from './list-item';
import { TouchableItem } from './touchable-item';

export type OnPressTouchableListItem<T> = (data: T, event: GestureResponderEvent) => void;

interface TouchableListItemProps<T> {
  data: T;
  onPress: OnPressTouchableListItem<T>;
  previewPlaceholderText?: string;
  size?: ListItemSize;
  style?: StyleProp<ViewStyle>;
}

type TouchableListItemComponent = <T extends { previewUrl?: string; title: string }>(
  props: TouchableListItemProps<T>,
) => JSX.Element;

export const TouchableListItem: TouchableListItemComponent = ({
  data,
  onPress,
  previewPlaceholderText,
  size,
  style,
}) => (
  <TouchableItem onPress={(event) => onPress(data, event)} testID='container'>
    <ListItem
      data={data}
      previewPlaceholderText={previewPlaceholderText}
      size={size}
      style={style}
      testID='list-item'
    />
  </TouchableItem>
);
