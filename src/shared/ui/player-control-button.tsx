import { Entypo } from '@expo/vector-icons';
import React from 'react';
import {
  GestureResponderEvent,
  OpaqueColorValue,
  StyleProp,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface PlayerControlButtonProps {
  type: 'play' | 'pause' | 'next' | 'prev' | 'forward' | 'backward';
  onPress?: (event: GestureResponderEvent) => void;
  color?: string | OpaqueColorValue;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const PlayerControlButton = ({
  type,
  onPress,
  color = 'black',
  size = 24,
  style,
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
    <TouchableOpacity style={style} onPress={onPress}>
      <Text>{name && <Entypo name={name} size={size} color={color} />}</Text>
    </TouchableOpacity>
  );
};
