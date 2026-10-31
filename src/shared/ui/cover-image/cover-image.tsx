import { Image } from 'expo-image'
import { type ReactNode } from 'react'
import {
  type ImageStyle,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import { APP_ICON_URI as IMAGE_PLACEHOLDER } from '../../lib/app-icon'
import { useTheme } from '../theme/ThemeContext/useTheme'

// On web the startup splash hides #root while cached sections mount, so a lazy <img>
// defers indefinitely until an unrelated re-render — covers must load eagerly there.
// `loading='lazy'` is therefore only ever passed on native.
const getLoadingMode = (eager: boolean): 'eager' | 'lazy' =>
  Platform.OS === 'web' || eager ? 'eager' : 'lazy'

// expo-image `Image` does not support children: it warns, drops them on web and
// forwards them to the native image view on Android. Overlays are therefore rendered
// as siblings above an absolutely-positioned image inside a clipping container.
export const CoverImage = ({
  children,
  eager = false,
  imageStyle,
  style,
  testID,
  transition = 200,
  uri,
}: {
  children?: ReactNode
  eager?: boolean
  imageStyle?: StyleProp<ImageStyle>
  style?: StyleProp<ViewStyle>
  testID?: string
  transition?: number
  uri?: null | string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.skeleton }, style]}>
      <Image
        testID={testID}
        contentFit='cover'
        transition={transition}
        cachePolicy='memory-disk'
        recyclingKey={uri || undefined}
        loading={getLoadingMode(eager)}
        priority={eager ? 'high' : 'normal'}
        source={{ uri: uri || IMAGE_PLACEHOLDER }}
        style={[StyleSheet.absoluteFill, imageStyle]}
      />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
})
