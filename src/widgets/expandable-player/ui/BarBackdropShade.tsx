import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { getMiniPlayerGeometry } from '../lib/getMiniPlayerGeometry'
import { useBarMorphProgress } from '../model/useBarMorphProgress'
import { useProgressAnimation } from '../model/useProgressAnimation'

// One subtle but perceptible depth cue behind the whole bottom-bar complex. The
// shade is edge to edge (no side insets, no radius) and anchors to the very
// screen bottom (the Android navbar is transparent, so the safe-area inset is
// deliberately ignored). Its top edge tracks the CURRENT mini-player top as the
// bar morphs, ending a few pixels above it so the ramp never lands a hard edge
// on the pill's glass rim.
const SHADE_TOP_OVERSCAN_PX = 10
// Full opacity from the screen bottom up to the pill's vertical middle; only
// the overscan above the pill top is a ramp. The shape is identical in both
// themes, but the ramp is white in the dark one: black-on-black would vanish,
// while the luminous white stop reads as a faint depth cue.
const SHADE_OPAQUE_LIGHT = 'rgba(0, 0, 0, 0.18)'
const SHADE_OPAQUE_DARK = 'rgba(255, 255, 255, 0.18)'
const SHADE_COLORS_LIGHT = ['rgba(0, 0, 0, 0)', SHADE_OPAQUE_LIGHT, SHADE_OPAQUE_LIGHT] as const
const SHADE_COLORS_DARK = ['rgba(255, 255, 255, 0)', SHADE_OPAQUE_DARK, SHADE_OPAQUE_DARK] as const

const getShadeColors = (isLight: boolean) => (isLight ? SHADE_COLORS_LIGHT : SHADE_COLORS_DARK)

const getShadeHeight = (bottom: number) => {
  'worklet'
  return bottom + PLAYER_SIZES.miniPlayerHeight + SHADE_TOP_OVERSCAN_PX
}

// Fraction of the resting shade taken by the overscan plus the pill's upper
// half, i.e. the line where the ramp reaches full opacity.
const getPillMiddleLocation = (shadeHeight: number) =>
  (SHADE_TOP_OVERSCAN_PX + PLAYER_SIZES.miniPlayerHeight / 2) / shadeHeight

/**
 * Single very subtle vertical gradient from the screen bottom up to the mini
 * player top, rendered as the first child of the tab bar's floating container so
 * it sits above the screens and behind the islands. Hidden in the same
 * conditions as the collapsed mini player: no audio, or fullscreen expansion
 * once its morph has settled. The container owns the keyboard lift.
 */
export const BarBackdropShade = () => {
  const { isLight } = useTheme()
  const [audio] = useAtom(currentAudioAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { progress, settledCollapsed } = useBarMorphProgress()
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

    return { height: getShadeHeight(bottom) }
  })

  if (!audio || (expanded && settledExpanded) || !isTabBarMeasured) return null

  // Gradient stops cannot animate with the shade, so they follow the geometry
  // the bar settles into: the fade completes on the pill midline in both rest
  // states.
  const restingBottom = getMiniPlayerGeometry({
    barProgress: settledCollapsed ? 1 : 0,
    fullScreenHeight: screenHeight,
    screenWidth,
    tabBarHeight,
  }).bottom
  const shadeLocations = [0, getPillMiddleLocation(getShadeHeight(restingBottom)), 1] as const

  return (
    <Animated.View pointerEvents='none' style={styles.layer}>
      <Animated.View style={[styles.shade, shadeStyle]}>
        <LinearGradient
          pointerEvents='none'
          locations={shadeLocations}
          style={StyleSheet.absoluteFill}
          colors={getShadeColors(isLight)}
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
