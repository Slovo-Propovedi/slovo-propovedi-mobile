import React from 'react';
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { ListItem, TouchableItem } from 'shared';

export type OnPressTouchableListItem<T> = (data: T, event: GestureResponderEvent) => void;

interface TouchableListItemProps<T> {
  style?: StyleProp<ViewStyle>;
  previewPlaceholderText?: string;
  data: T;
  onPress: OnPressTouchableListItem<T>;
}

type TouchableListItemComponent = <T extends { title: string; previewUrl?: string }>(
  props: TouchableListItemProps<T>,
) => JSX.Element;

export const TouchableListItem: TouchableListItemComponent = ({
  style,
  previewPlaceholderText,
  data,
  onPress,
}) => (
  <TouchableItem onPress={(event) => onPress(data, event)}>
    <ListItem style={style} previewPlaceholderText={previewPlaceholderText} data={data} />
  </TouchableItem>
);
