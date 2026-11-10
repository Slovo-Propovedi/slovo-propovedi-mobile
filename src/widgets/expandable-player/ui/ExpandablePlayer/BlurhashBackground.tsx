import { Image } from 'expo-image'
import { StyleSheet, type ViewStyle } from 'react-native'
import { isValidBlurhash } from './isValidBlurhash'

// Fullscreen background layer: a blurhash image when the sermon/playlist has
// one, otherwise (and while it is absent) the theme surface color. The hash is
// validated first — a foreign value degrades to the color, never to a native
// decoder error.
export const BlurhashBackground = ({
  blurhash,
  fallbackColor,
  style,
}: {
  blurhash: null | string | undefined
  fallbackColor: string
  style?: ViewStyle
}) => (
  <Image
    transition={0}
    contentFit='cover'
    style={[styles.fill, { backgroundColor: fallbackColor }, style]}
    source={isValidBlurhash(blurhash) ? { blurhash, height: 32, width: 32 } : null}
  />
)

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
})
