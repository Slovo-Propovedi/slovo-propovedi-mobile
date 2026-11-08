import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Platform, StyleSheet, View } from 'react-native'
import {
  createGlassStyles,
  getGlassFill,
  getWebGlassStyle,
  getWebRefractionStyle,
  GLASS,
} from './glass'

/**
 * Frosted-glass background for the floating bottom islands: a backdrop blur
 * under a translucent tinted fill, framed by a 1px hairline rim. Every surface
 * renders this same component, so blur intensity, fill, rim and radius
 * treatment stay identical. The surface clips itself, so a host that must keep
 * overflowing children (for example the search dropdown) does not need
 * `overflow: 'hidden'`.
 *
 * Platform treatment:
 * - iOS: native `BlurView` (tint light/dark), already refractive.
 * - Web: bypasses `BlurView` for a moderate `backdrop-filter` the background
 *   stays readable through. An SVG refraction sits in its own layer beneath
 *   the blur as progressive enhancement: engines without `url()` support in
 *   `backdrop-filter` drop only that layer and keep the plain blur.
 * - Android: real backdrop blur is impossible here (see docs/debt.md); the
 *   surface gains depth from a top-edge sheen plus a slightly denser fill.
 * @param root0 - Glass surface props.
 * @param root0.isLight - Active theme; selects the fill, rim and blur tint.
 * @param root0.radius - Corner radius of the hairline rim; matches the host shape.
 */
export const GlassSurface = ({ isLight, radius }: { isLight: boolean; radius: number }) => {
  const glass = createGlassStyles(isLight, radius)
  const isWeb = Platform.OS === 'web'
  const isAndroid = Platform.OS === 'android'

  return (
    <View
      pointerEvents='none'
      style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}
    >
      {isWeb ? (
        <>
          <View style={[StyleSheet.absoluteFill, getWebRefractionStyle()]} />
          <View style={[StyleSheet.absoluteFill, getWebGlassStyle(), glass.fill]} />
        </>
      ) : (
        <BlurView
          tint={glass.blur.tint}
          intensity={glass.blur.intensity}
          style={[
            StyleSheet.absoluteFill,
            isAndroid
              ? { backgroundColor: getGlassFill(isLight, GLASS.android.fillAlphaBoost) }
              : glass.fill,
          ]}
        />
      )}
      {isAndroid && (
        <LinearGradient
          pointerEvents='none'
          colors={GLASS.android.sheen.colors}
          style={[styles.sheen, { height: GLASS.android.sheen.heightPercent }]}
        />
      )}
      <View style={[StyleSheet.absoluteFill, glass.rim]} />
    </View>
  )
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  sheen: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
