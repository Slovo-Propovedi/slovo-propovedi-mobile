import React, { ReactNode } from 'react';
import {
  GestureResponderEvent,
  ImageBackground,
  ImageStyle,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface TouchableImageBackgroundProps {
  onPress?: (event: GestureResponderEvent) => void;
  previewSrc: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  children: ReactNode;
  testID?: string;
}

export const TouchableImageBackground = ({
  onPress,
  previewSrc,
  style,
  imageStyle,
  children,
  testID,
}: TouchableImageBackgroundProps) => (
  <TouchableOpacity onPress={onPress} testID={testID} activeOpacity={0.8}>
    <ImageBackground
      testID='image-background'
      source={{ uri: previewSrc }}
      style={[styles.item, style]}
      imageStyle={[styles.backgroundImage, imageStyle]}
    >
      {children}
    </ImageBackground>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  item: { minHeight: 50, minWidth: 50 },
  backgroundImage: {
    resizeMode: 'cover',
  },
});
