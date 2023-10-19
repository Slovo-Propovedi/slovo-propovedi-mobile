import { Entypo } from '@expo/vector-icons';
import React from 'react';
import type { GestureResponderEvent, OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS } from 'shared/themed';

interface PlayerControlButtonProps {
  color?: OpaqueColorValue | string;
  isDisabled?: boolean | null;
  onLongPress?: (event: GestureResponderEvent) => void;
  onPress?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  type: 'backward' | 'forward' | 'next' | 'pause' | 'play' | 'prev';
}

export const PlayerControlButton = ({
  color,
  isDisabled,
  onLongPress,
  onPress,
  onPressOut,
  size = 24,
  style,
  testID,
  type,
}: PlayerControlButtonProps) => {
  const name = (() => {
    if (type === 'play') {
      return 'controller-play';
    }

    if (type === 'pause') {
      return 'controller-paus';
    }

    if (type === 'next') {
      return 'controller-next';
    }

    if (type === 'prev') {
      return 'controller-jump-to-start';
    }

    if (type === 'forward') {
      return 'controller-fast-forward';
    }

    if (type === 'backward') {
      return 'controller-fast-backward';
    }

    return '';
  })();

  return (
    <TouchableOpacity
      disabled={Boolean(isDisabled)}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressOut={onPressOut}
      style={style}
      testID={testID}
    >
      <Text>
        {name && (
          <Entypo
            name={name}
            size={size}
            style={[styles.icon, color ? { color } : null, isDisabled && styles.iconDisabled]}
          />
        )}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  icon: {
    color: COLORS.black,
  },
  iconDisabled: {
    color: COLORS.lightGray,
  },
});
