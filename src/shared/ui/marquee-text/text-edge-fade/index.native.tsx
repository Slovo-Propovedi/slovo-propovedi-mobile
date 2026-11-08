import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import { EDGE_FADE_GRADIENT_TEST_ID, EDGE_FADE_WIDTH } from '../marquee-styles'
import { type EdgeFadeContainerProps } from './types'

// Mask alpha decides visibility: opaque black keeps the row visible, transparent
// hides it. The stops therefore differ in ALPHA only — opaque RGB keeps Android's
// ARGB mask bitmap clean (a semi-opaque colour stop would tint the mask itself).
const FADE_COLORS = ['#000000', '#00000000'] as const

// Explicit horizontal ramp, left (visible) -> right (transparent). Without
// start/end expo-linear-gradient defaults to a TOP-TO-BOTTOM ramp, which faded
// the glyphs by line height and left the trailing strip looking like a
// translucent rectangle instead of a text-edge fade.
const FADE_START = { x: 0, y: 0 }
const FADE_END = { x: 1, y: 0 }

// `containerRef` is intentionally unused here: the container ref exists only for
// the web DOM guards (click/dragstart), and MaskedView does not forward it.
export const EdgeFadeContainer = ({
  children,
  enabled,
  fading,
  onLayout,
  style,
  testID,
}: EdgeFadeContainerProps) => {
  if (!enabled)
    return (
      <View style={style} testID={testID} onLayout={onLayout}>
        {children}
      </View>
    )

  // The ramp sits at the container's trailing edge as part of the mask, so it
  // stays pinned to the clip boundary while the text scrolls underneath and no
  // colour is ever painted over the content.
  const maskElement = fading ? (
    <View style={styles.row}>
      <View style={styles.opaque} />
      <LinearGradient
        end={FADE_END}
        start={FADE_START}
        colors={FADE_COLORS}
        style={styles.gradient}
        testID={EDGE_FADE_GRADIENT_TEST_ID}
      />
    </View>
  ) : (
    <View style={styles.full} />
  )

  return (
    <MaskedView style={style} testID={testID} onLayout={onLayout} maskElement={maskElement}>
      {children}
    </MaskedView>
  )
}

const styles = StyleSheet.create({
  full: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  gradient: {
    width: EDGE_FADE_WIDTH,
  },
  opaque: {
    backgroundColor: '#000',
    flex: 1,
  },
  row: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
})
