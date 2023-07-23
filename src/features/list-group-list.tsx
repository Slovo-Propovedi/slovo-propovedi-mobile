import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ListItemGroup, ListItemGroupProps, OnPressListItemGroup } from 'entities';

type GroupListProps<T extends { title: string }> = Omit<
  ListItemGroupProps<T>,
  'onPressListItemGroup' | 'style'
>;

interface ListGroupListProps<T extends { title: string }> {
  groupList: GroupListProps<T>[];
  onPressListItemGroup: OnPressListItemGroup<T>;
  style?: ViewStyle;
}

type ListGroupListComponent = <T extends { title: string }>(
  props: ListGroupListProps<T>,
) => JSX.Element;

export const ListGroupList: ListGroupListComponent = ({
  groupList,
  onPressListItemGroup,
  style,
}) => (
  <View style={[styles.container, style]}>
    {groupList.map(({ list, title }, index) => (
      <ListItemGroup
        key={`ListGroupListItem-${index}`}
        style={styles.listItem}
        title={title}
        list={list}
        onPressListItemGroup={onPressListItemGroup}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({ container: {}, listItem: {} });
