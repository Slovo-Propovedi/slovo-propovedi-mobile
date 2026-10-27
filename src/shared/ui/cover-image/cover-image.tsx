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
import { useCoverLoadSlot } from './useCoverLoadSlot'
import { useNearViewport } from './useNearViewport'

// On web the startup splash hides #root while cached sections mount, so a lazy <img>
// defers indefinitely until an unrelated re-render. Viewport gating is done by
// `useNearViewport` instead, and the <img> itself always loads eagerly there.
// `loading='lazy'` is therefore only ever passed on native.
const getLoadingMode = (eager: boolean): 'eager' | 'lazy' =>
  Platform.OS === 'web' || eager ? 'eager' : 'lazy'

// Non-eager covers wait for a slot in the shared cover queue (at most 5 load at a
// time) and, on web, until they come near the viewport; the skeleton background
// shows meanwhile. Eager covers (player) skip both and load at high priority.
//
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
  const source = uri || IMAGE_PLACEHOLDER
  const { isNear, ref } = useNearViewport(!eager)
  const slot = useCoverLoadSlot(!eager && isNear, source)

  return (
    <View ref={ref} style={[styles.container, { backgroundColor: currentTheme.skeleton }, style]}>
      {(eager || slot.isGranted) && (
        <Image
          testID={testID}
          contentFit='cover'
          onLoad={slot.release}
          onError={slot.release}
          transition={transition}
          source={{ uri: source }}
          cachePolicy='memory-disk'
          recyclingKey={uri || undefined}
          loading={getLoadingMode(eager)}
          priority={eager ? 'high' : 'low'}
          style={[StyleSheet.absoluteFill, imageStyle]}
        />
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
})
