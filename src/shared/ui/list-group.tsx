import React, { ReactElement } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ListGroupProps {
  title: string;
  style?: ViewStyle;
  children: ReactElement;
}

export const ListGroup = ({ title, style, children }: ListGroupProps) => (
  <View style={style ? { ...styles.group, ...style } : styles.group}>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.list}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  group: {},
  title: {},
  list: {},
});
