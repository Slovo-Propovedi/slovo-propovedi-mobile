import React from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS } from 'shared/themed';

export interface TouchableItemProps {
  children: React.ReactNode;
  disabled?: boolean;
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}

export const TouchableItem = ({
  children,
  disabled = false,
  style,
  onPress,
}: TouchableItemProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.item];

  if (disabled) {
    buttonStyles.push({ backgroundColor: COLORS.disabled });
  }

  buttonStyles.push(style);

  return (
    <TouchableOpacity style={buttonStyles} disabled={disabled} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    width: '100%',
  },
});
