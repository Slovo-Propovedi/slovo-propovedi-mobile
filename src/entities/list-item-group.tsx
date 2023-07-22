import React from 'react';
import { GestureResponderEvent, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ListGroup, TouchableItem } from 'shared';

export type OnPressListItemGroup<T extends { title: string }> = (
  options: T,
  event: GestureResponderEvent,
) => void;

export interface ListItemGroupProps<T extends { title: string }> {
  title: string;
  list: T[];
  onPressListItemGroup: OnPressListItemGroup<T>;
  style?: ViewStyle;
}

type ListItemGroupComponent = <T extends { title: string }>({
  title,
  list,
  onPressListItemGroup,
  style,
}: ListItemGroupProps<T>) => JSX.Element;

export const ListItemGroup: ListItemGroupComponent = ({
  title,
  list,
  onPressListItemGroup,
  style,
}) => (
  <ListGroup title={title} style={{ ...styles.group, ...style }}>
    <View style={styles.list}>
      {list.map((item, index) => (
        <TouchableItem
          key={`TouchableItem-${index}`}
          style={styles.listItem}
          onPress={(event) => onPressListItemGroup(item, event)}
        >
          <Text>{item.title}</Text>
        </TouchableItem>
      ))}
    </View>
  </ListGroup>
);

const styles = StyleSheet.create({ group: {}, list: {}, listItem: {} });
