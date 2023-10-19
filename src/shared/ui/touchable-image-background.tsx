import type { ReactNode } from 'react';
import React from 'react';
import type { GestureResponderEvent, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';

interface TouchableImageBackgroundProps {
  children: ReactNode;
  imageStyle?: StyleProp<ImageStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  previewSrc: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const TouchableImageBackground = ({
  children,
  imageStyle,
  onPress,
  previewSrc,
  style,
  testID,
}: TouchableImageBackgroundProps) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} testID={testID}>
    <ImageBackground
      imageStyle={[styles.backgroundImage, imageStyle]}
      source={{ uri: previewSrc }}
      style={[styles.item, style]}
      testID='image-background'
    >
      {children}
    </ImageBackground>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  backgroundImage: {
    resizeMode: 'cover',
  },
  item: { minHeight: 50, minWidth: 50 },
});
