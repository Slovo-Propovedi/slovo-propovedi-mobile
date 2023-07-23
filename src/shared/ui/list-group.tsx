import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { INDENTS, FONT_SIZES, COLORS } from 'shared/themed';

interface ListGroupProps {
  title: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactElement;
}

export const ListGroup = ({ title, style, children }: ListGroupProps) => (
  <View style={[styles.group, style]}>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.list}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  group: {},
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h2,
    paddingVertical: INDENTS.main,
  },
  list: {},
});
