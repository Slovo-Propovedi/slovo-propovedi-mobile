import React from 'react';
import { GestureResponderEvent, StyleSheet, View, ViewStyle } from 'react-native';
import { ListItemGroup, ListItemGroupProps } from 'entities';

type GroupListProps = Omit<ListItemGroupProps, 'onPressListItemGroup'>;

interface ListGroupListProps {
  groupList: GroupListProps[];
  onPressListItemGroup: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
}

export const ListGroupList = ({ groupList, onPressListItemGroup, style }: ListGroupListProps) => (
  <View style={{ ...styles.container, ...style }}>
    {groupList.map((props, index) => (
      <ListItemGroup
        key={`ListGroupListItem-${index}`}
        style={styles.listItem}
        {...props}
        onPressListItemGroup={onPressListItemGroup}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({ container: {}, listItem: {} });
