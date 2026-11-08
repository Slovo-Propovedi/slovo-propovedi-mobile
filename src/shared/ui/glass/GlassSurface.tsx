import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { type ComponentRef, type RefObject } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useGlassBlurTarget } from './blurTargetContext'
import { supportsAndroidBackdropBlur } from './blurTargets'
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
 * - Web: bypasses `BlurView` for a shallow `backdrop-filter` that keeps the
 *   background readable. A masked edge ring above it carries the strong SVG
 *   displacement, so only the rim bends like thick glass while the center stays
 *   clean. The two layers are independent progressive enhancements: an engine
 *   without `url()` keeps the plain blur, and one without mask support falls
 *   back to the previous full-surface refraction.
 * - Android 12+: real dimezis backdrop blur of the page target published by
 *   `BlurTargetProvider`; without a target (page not laid out, or Android
 *   11 and below) the surface keeps the tint plus the top-edge sheen.
 * @param root0 - Glass surface props.
 * @param root0.blurTarget - Explicit backdrop override; defaults to the provider's target.
 * @param root0.isLight - Active theme; selects the fill, rim and blur tint.
 * @param root0.radius - Corner radius of the hairline rim; matches the host shape.
 */
export const GlassSurface = ({
  blurTarget,
  isLight,
  radius,
}: {
  blurTarget?: null | RefObject<ComponentRef<typeof View> | null>
  isLight: boolean
  radius: number
}) => {
  const glass = createGlassStyles(isLight, radius)
  const isWeb = Platform.OS === 'web'
  const isAndroid = Platform.OS === 'android'
  const contextTarget = useGlassBlurTarget()
  const target = blurTarget ?? contextTarget
  // Never ask expo-blur for a native blur without a target: the native view
  // would silently fall back and log a warning on every mount.
  const realBlurTarget =
    isAndroid && supportsAndroidBackdropBlur() && target !== null ? target : null

  return (
    <View
      pointerEvents='none'
      style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}
    >
      {isWeb ? (
        <>
          <View style={[StyleSheet.absoluteFill, getWebGlassStyle(), glass.fill]} />
          <View style={[StyleSheet.absoluteFill, getWebRefractionStyle()]} />
        </>
      ) : (
        <BlurView
          tint={glass.blur.tint}
          intensity={glass.blur.intensity}
          blurTarget={realBlurTarget ?? undefined}
          blurMethod={realBlurTarget ? GLASS.blur.androidMethod : undefined}
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
