import React from 'react';
import { GestureResponderEvent, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ListGroup, INDENTS, FONT_SIZES, TouchableItem } from 'shared';

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
  <ListGroup title={title} style={[styles.group, style]}>
    <View style={styles.list}>
      {list.map((item, index) => (
        <TouchableItem
          key={`TouchableItem-${index}`}
          style={styles.listItem}
          onPress={(event) => onPressListItemGroup(item, event)}
        >
          <Text style={styles.listItemTitle}>{item.title}</Text>
        </TouchableItem>
      ))}
    </View>
  </ListGroup>
);

const styles = StyleSheet.create({
  group: {},
  list: { paddingLeft: INDENTS.main },
  listItem: {
    minHeight: 50,
    marginBottom: INDENTS.main,
    alignItems: 'center',
    flexDirection: 'row',
  },
  listItemTitle: {
    fontSize: FONT_SIZES.h3,
  },
});
