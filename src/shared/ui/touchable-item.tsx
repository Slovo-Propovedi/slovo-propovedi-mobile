import React from 'react';
import { GestureResponderEvent, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

interface TouchableItemProps {
  children: React.ReactElement;
  disabled?: boolean;
  onPress: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
}

export const TouchableItem = ({
  children,
  disabled = false,
  style,
  onPress,
}: TouchableItemProps) => (
  <TouchableOpacity
    style={{
      ...(disabled ? { ...styles.item, backgroundColor: 'gray' } : styles.item),
      ...style,
    }}
    disabled={disabled}
    onPress={onPress}
  >
    <View style={styles.children}>{children}</View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  item: {
    width: '100%',
  },
  children: {},
});
