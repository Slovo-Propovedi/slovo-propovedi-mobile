import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ListItemGroup, ListItemGroupProps } from 'entities';

interface ListGroupListProps {
  groupList: ListItemGroupProps[];
}

export const ListGroupList = ({ groupList }: ListGroupListProps) => (
  <View style={styles.container}>
    {groupList.map((props) => (
      <ListItemGroup {...props} />
    ))}
  </View>
);

const styles = StyleSheet.create({ container: {}, group: {} });
