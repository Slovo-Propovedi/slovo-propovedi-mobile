import React, { ReactNode } from 'react';
import {
  GestureResponderEvent,
  ImageBackground,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface TouchableImageBackgroundProps {
  onPress?: (event: GestureResponderEvent) => void;
  previewSrc: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export const TouchableImageBackground = ({
  onPress,
  previewSrc,
  style,
  children,
}: TouchableImageBackgroundProps) => (
  <TouchableOpacity onPress={onPress}>
    <ImageBackground
      source={{ uri: previewSrc }}
      style={[styles.item, style]}
      imageStyle={styles.backgroundImage}
    >
      {children}
    </ImageBackground>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  item: { minHeight: 50, minWidth: 50 },
  backgroundImage: {
    resizeMode: 'contain',
  },
});
