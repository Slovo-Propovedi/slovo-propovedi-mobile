import { Image, type ImageProps } from 'expo-image'
import { type ReactNode } from 'react'
import { type ImageStyle, type StyleProp, type ViewStyle } from 'react-native'
import { IMAGE_PLACEHOLDER } from '../images'
import { useTheme } from '../theme/ThemeContext/useTheme'

const ImageWithChildren = Image as React.ComponentType<{ children?: ReactNode } & ImageProps>

interface CoverImageProps {
  children?: ReactNode
  eager?: boolean
  imageStyle?: StyleProp<ImageStyle>
  style?: StyleProp<ViewStyle>
  testID?: string
  uri?: string
}

export const CoverImage = ({
  children,
  eager = false,
  imageStyle,
  style,
  testID,
  uri,
}: CoverImageProps) => {
  const { currentTheme } = useTheme()

  return (
    <ImageWithChildren
      testID={testID}
      transition={200}
      contentFit='cover'
      cachePolicy='memory-disk'
      recyclingKey={uri || undefined}
      loading={eager ? 'eager' : 'lazy'}
      priority={eager ? 'high' : 'normal'}
      source={{ uri: uri || IMAGE_PLACEHOLDER }}
      style={
        [{ backgroundColor: currentTheme.skeleton }, imageStyle, style] as StyleProp<ImageStyle>
      }
    >
      {children}
    </ImageWithChildren>
  )
}
