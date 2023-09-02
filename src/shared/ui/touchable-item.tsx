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
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const TouchableItem = ({
  children,
  onPress,
  disabled = false,
  testID,
  style,
}: TouchableItemProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.item];

  if (disabled) {
    buttonStyles.push({ backgroundColor: COLORS.disabled });
  }

  buttonStyles.push(style);

  return (
    <TouchableOpacity testID={testID} style={buttonStyles} disabled={disabled} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    width: '100%',
  },
});
