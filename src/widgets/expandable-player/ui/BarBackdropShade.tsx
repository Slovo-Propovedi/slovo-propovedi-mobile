import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry } from '../lib/getMiniPlayerGeometry'
import { useBarMorphProgress } from '../model/useBarMorphProgress'
import { useProgressAnimation } from '../model/useProgressAnimation'

// One subtle but perceptible depth cue behind the whole bottom-bar complex. The
// shade is edge to edge (no side insets, no radius) and anchors to the very
// screen bottom (the Android navbar is transparent, so the safe-area inset is
// deliberately ignored). Its top edge tracks the CURRENT mini-player top as the
// bar morphs.
const SHADE_COLORS = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.30)'] as const
// Full-height ramp: transparent at the pill top, deepening all the way down.
const SHADE_LOCATIONS = [0, 1] as const

/**
 * Single very subtle vertical gradient from the screen bottom up to the mini
 * player top, rendered as the first child of the tab bar's floating container so
 * it sits above the screens and behind the islands. Hidden in the same
 * conditions as the collapsed mini player: no audio, or fullscreen expansion
 * once its morph has settled. The container owns the keyboard lift.
 */
export const BarBackdropShade = () => {
  const [audio] = useAtom(currentAudioAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { progress } = useBarMorphProgress()
  // The shade has no expand animation of its own: this shared value only drives
  // the pill's settle timing, so the shade stays behind the pill for the whole
  // expand morph instead of popping out on its first frame.
  const expandProgress = useSharedValue(expanded ? 1 : 0)
  const { settledExpanded } = useProgressAnimation(expanded, expandProgress)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()

  const shadeStyle = useAnimatedStyle(() => {
    const { bottom } = getMiniPlayerGeometry({
      barProgress: progress.value,
      fullScreenHeight: screenHeight,
      screenWidth,
      tabBarHeight,
    })

    return { height: bottom + PLAYER_SIZES.miniPlayerHeight }
  })

  if (!audio || (expanded && settledExpanded) || !isTabBarMeasured) return null

  return (
    <Animated.View pointerEvents='none' style={styles.layer}>
      <Animated.View style={[styles.shade, shadeStyle]}>
        <LinearGradient
          pointerEvents='none'
          colors={SHADE_COLORS}
          locations={SHADE_LOCATIONS}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // No zIndex: the tab-bar layer already paints above the screens. The islands
  // row is positioned with zIndex 1, so on web it beats this z-auto positioned
  // layer in the CSS step-8 paint order; on native the higher zIndex sorts it
  // above the shade too. Anchored to the container's bottom, so the taller
  // inner shade overflows upward out of the container box.
  layer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  shade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
})
