import React from 'react';
import { GestureResponderEvent, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ListGroup, TouchableItem } from 'shared';

export interface ListItemGroupProps {
  title: string;
  list: { title: string }[];
  onPressListItemGroup: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
}

export const ListItemGroup = ({ title, list, onPressListItemGroup, style }: ListItemGroupProps) => (
  <ListGroup title={title} style={{ ...styles.group, ...style }}>
    <View style={styles.list}>
      {list.map((item, index) => (
        <TouchableItem
          key={`TouchableItem-${index}`}
          style={styles.listItem}
          onPress={onPressListItemGroup}
        >
          <Text>{item.title}</Text>
        </TouchableItem>
      ))}
    </View>
  </ListGroup>
);

const styles = StyleSheet.create({ group: {}, list: {}, listItem: {} });
