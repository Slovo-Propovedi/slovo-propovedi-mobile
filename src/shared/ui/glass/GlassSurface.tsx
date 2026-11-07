import { BlurView } from 'expo-blur'
import { StyleSheet, View } from 'react-native'
import { createGlassStyles } from './glass'

/**
 * Frosted-glass background for the floating bottom islands: a backdrop blur
 * under a translucent tinted fill, framed by a 1px hairline rim. Every surface
 * renders this same component, so blur intensity, fill, rim and radius
 * treatment stay identical. The surface clips itself, so a host that must keep
 * overflowing children (for example the search dropdown) does not need
 * `overflow: 'hidden'`.
 * @param root0 - Glass surface props.
 * @param root0.isLight - Active theme; selects the fill, rim and blur tint.
 * @param root0.radius - Corner radius of the hairline rim; matches the host shape.
 */
export const GlassSurface = ({ isLight, radius }: { isLight: boolean; radius: number }) => {
  const glass = createGlassStyles(isLight, radius)

  return (
    <View
      pointerEvents='none'
      style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}
    >
      <BlurView
        tint={glass.blur.tint}
        intensity={glass.blur.intensity}
        style={[StyleSheet.absoluteFill, glass.fill]}
      />
      <View style={[StyleSheet.absoluteFill, glass.rim]} />
    </View>
  )
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
})
