import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ListGroup, ListItem } from 'shared';

export interface ListItemGroupProps {
  title: string;
  list: { title: string }[];
}

export const ListItemGroup = ({ title, list }: ListItemGroupProps) => (
  <ListGroup title={title} style={styles.group}>
    <View>
      {list.map((item) => (
        <ListItem title={item.title} style={styles.listItem} />
      ))}
    </View>
  </ListGroup>
);

const styles = StyleSheet.create({ group: {}, listItem: {} });
