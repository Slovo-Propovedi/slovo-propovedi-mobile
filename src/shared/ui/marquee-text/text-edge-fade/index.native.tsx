import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import { EDGE_FADE_GRADIENT_TEST_ID, EDGE_FADE_WIDTH } from '../marquee-styles'
import { type EdgeFadeContainerProps } from './types'

// Mask alpha decides visibility: opaque black keeps the row visible, transparent
// hides it. The gradient is fixed-width at the container's trailing edge, so the
// fade stays pinned to the clip boundary while the text scrolls underneath.
const FADE_COLORS = ['#000000', '#00000000'] as const

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

  const maskElement = fading ? (
    <View style={styles.row}>
      <View style={styles.opaque} />
      <LinearGradient
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
