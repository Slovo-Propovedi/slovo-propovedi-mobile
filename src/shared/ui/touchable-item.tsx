import React from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from 'shared/themed';

export interface TouchableItemProps {
  children: React.ReactNode;
  disabled?: boolean;
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const TouchableItem = ({
  children,
  disabled = false,
  onPress,
  style,
  testID,
}: TouchableItemProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.item];

  if (disabled) buttonStyles.push({ backgroundColor: COLORS.disabled });

  buttonStyles.push(style);

  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={buttonStyles} testID={testID}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    width: '100%',
  },
});
