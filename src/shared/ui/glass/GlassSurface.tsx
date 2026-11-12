import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { type ComponentRef, type RefObject } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useGlassBlurTarget } from './blurTargetContext'
import { supportsAndroidBackdropBlur } from './blurTargets'
import { createGlassStyles, getGlassFill, GLASS } from './glass'
import { getWebGlassStyle } from './webGlass'

/**
 * Frosted-glass background for the floating bottom islands: a backdrop blur
 * under a translucent tinted fill, framed by a 1px hairline rim. Every surface
 * renders this same component, so blur intensity, fill, rim and radius
 * treatment stay identical. It clips its own layers, so a host with overflowing
 * children (the search dropdown) needs no `overflow: 'hidden'`.
 *
 * The live layers render on every platform and keep rendering through morphs —
 * there is no static fallback: a blurred backdrop that stops being blurred and
 * turns into a solid page-coloured slab reads as a hole in the UI.
 *
 * Platform treatment:
 * - iOS: native `BlurView` (tint light/dark), already refractive, under the
 *   shared top-edge sheen.
 * - Web: bypasses `BlurView` for classic glassmorphism — one translucent sheet
 *   that blurs and saturates the backdrop through `backdrop-filter` (standard
 *   and `-webkit-` forms for Safari), framed by a 1px translucent rim. No
 *   shadow, no refraction mask. Web is the reference: live blur always.
 * - Android 12+: real dimezis backdrop blur of the page target published by
 *   `BlurTargetProvider`; without a target (page not laid out, or Android
 *   11 and below) the surface keeps the tint plus the top-edge sheen.
 * @param root0 - Glass surface props.
 * @param root0.blurTarget - Explicit backdrop; `undefined` inherits the
 * provider's target and `null` opts out of it.
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
  // `undefined` inherits the provider; an explicit `null` opts out of it (a
  // surface floating over the page must not sample the chrome shade).
  const target = blurTarget === undefined ? contextTarget : blurTarget
  // Never ask expo-blur for a native blur without a target: the native view
  // would silently fall back and log a warning on every mount.
  const realBlurTarget =
    isAndroid && supportsAndroidBackdropBlur() && target !== null ? target : null
  const tint = isAndroid
    ? { backgroundColor: getGlassFill(isLight, GLASS.android.fillAlphaBoost) }
    : glass.fill

  return (
    <View
      pointerEvents='none'
      style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}
    >
      {isWeb ? (
        <View style={[StyleSheet.absoluteFill, getWebGlassStyle(isLight, radius)]} />
      ) : (
        <BlurView
          tint={glass.blur.tint}
          intensity={glass.blur.intensity}
          style={[StyleSheet.absoluteFill, tint]}
          blurTarget={realBlurTarget ?? undefined}
          blurMethod={realBlurTarget ? GLASS.blur.androidMethod : undefined}
        />
      )}
      <LinearGradient
        pointerEvents='none'
        colors={GLASS.android.sheen.colors}
        style={[styles.sheen, { height: GLASS.android.sheen.heightPercent }]}
      />
      {/* Web carries its rim on the glass sheet itself. */}
      {!isWeb && <View style={[StyleSheet.absoluteFill, glass.rim]} />}
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
