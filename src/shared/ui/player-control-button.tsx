import { Entypo } from '@expo/vector-icons';
import React from 'react';
import {
  GestureResponderEvent,
  OpaqueColorValue,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS } from 'shared/themed';

interface PlayerControlButtonProps {
  type: 'play' | 'pause' | 'next' | 'prev' | 'forward' | 'backward';
  onPress?: (event: GestureResponderEvent) => void;
  color?: string | OpaqueColorValue;
  size?: number;
  style?: StyleProp<ViewStyle>;
  isDisabled?: boolean | null;
}

export const PlayerControlButton = ({
  type,
  onPress,
  color,
  size = 24,
  style,
  isDisabled,
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
    <TouchableOpacity style={style} onPress={onPress} disabled={Boolean(isDisabled)}>
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
