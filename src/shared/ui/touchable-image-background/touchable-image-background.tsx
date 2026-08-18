import { type ReactNode } from 'react'
import {
  type GestureResponderEvent,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'
import { CoverImage } from '../cover-image'

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
  <TouchableOpacity
    testID={testID}
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityRole='button'
  >
    <CoverImage
      uri={previewSrc}
      imageStyle={imageStyle}
      testID='image-background'
      style={[styles.item, style]}
    >
      {children}
    </CoverImage>
  </TouchableOpacity>
)

const styles = StyleSheet.create({ item: { minHeight: 50, minWidth: 50 } })
