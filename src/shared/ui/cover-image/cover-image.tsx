import { Image, type ImageProps } from 'expo-image'
import { type ReactNode } from 'react'
import { type ImageStyle, Platform, type StyleProp, type ViewStyle } from 'react-native'
import { APP_ICON_URI as IMAGE_PLACEHOLDER } from '../../lib/app-icon'
import { useTheme } from '../theme/ThemeContext/useTheme'

const ImageWithChildren = Image as React.ComponentType<{ children?: ReactNode } & ImageProps>

// On web the startup splash hides #root while cached sections mount, so a lazy <img>
// defers indefinitely until an unrelated re-render — covers must load eagerly there.
// `loading='lazy'` is therefore only ever passed on native.
const getLoadingMode = (eager: boolean): 'eager' | 'lazy' =>
  Platform.OS === 'web' || eager ? 'eager' : 'lazy'

export const CoverImage = ({
  children,
  eager = false,
  imageStyle,
  style,
  testID,
  uri,
}: {
  children?: ReactNode
  eager?: boolean
  imageStyle?: StyleProp<ImageStyle>
  style?: StyleProp<ViewStyle>
  testID?: string
  uri?: null | string
}) => {
  const { currentTheme } = useTheme()

  return (
    <ImageWithChildren
      testID={testID}
      transition={200}
      contentFit='cover'
      cachePolicy='memory-disk'
      recyclingKey={uri || undefined}
      loading={getLoadingMode(eager)}
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
