import { type ReactNode } from 'react'
import {
  type GestureResponderEvent,
  ImageBackground,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'
import { IMAGE_PLACEHOLDER } from './images'

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
      resizeMode='cover'
      imageStyle={imageStyle}
      testID='image-background'
      style={[styles.item, style]}
      source={{ uri: previewSrc || IMAGE_PLACEHOLDER }}
    >
      {children}
    </ImageBackground>
  </TouchableOpacity>
)

const styles = StyleSheet.create({ item: { minHeight: 50, minWidth: 50 } })
