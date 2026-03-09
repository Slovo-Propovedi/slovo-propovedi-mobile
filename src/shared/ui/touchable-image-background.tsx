import React from 'react'
import { ImageBackground, StyleSheet, TouchableOpacity } from 'react-native'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import type { ReactNode } from 'react'
import type { GestureResponderEvent, ImageStyle, StyleProp, ViewStyle } from 'react-native'

interface TouchableImageBackgroundProps {
  children: ReactNode
  imageStyle?: StyleProp<ImageStyle>
  onPress?: (event: GestureResponderEvent) => void
  previewSrc: string
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const TouchableImageBackground = ({
  children,
  imageStyle,
  onPress,
  previewSrc,
  style,
  testID,
}: TouchableImageBackgroundProps) => (
  <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.8}>
    <ImageBackground
      testID='image-background'
      style={[styles.item, style]}
      imageStyle={[styles.backgroundImage, imageStyle]}
      source={{ uri: previewSrc || IMAGE_PLACEHOLDER }}
    >
      {children}
    </ImageBackground>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  backgroundImage: {
    resizeMode: 'cover',
  },
  item: { minHeight: 50, minWidth: 50 },
})
