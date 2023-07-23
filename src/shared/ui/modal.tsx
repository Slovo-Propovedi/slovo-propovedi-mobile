import React from 'react';
import { Pressable, View } from 'react-native';

type Props = React.PropsWithChildren<{
  onBackdropPress: () => void;
}>;

export const Modal = ({ onBackdropPress, children }: Props) => (
  <View>
    <Pressable onPress={onBackdropPress} />
    <View>{children}</View>
  </View>
);
