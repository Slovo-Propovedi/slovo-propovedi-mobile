import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS } from '../themed';

interface ListItemProps {
  title: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ListItem = ({ title, disabled, style }: ListItemProps) => (
  <TouchableOpacity
    style={{
      ...(disabled ? { ...styles.item, backgroundColor: 'gray' } : styles.item),
      ...style,
    }}
    disabled={disabled}
  >
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  item: {
    width: '100%',
  },
  text: {
    color: COLORS.Gray,
  },
});
