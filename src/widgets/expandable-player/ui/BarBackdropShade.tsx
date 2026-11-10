import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { BAR_BOTTOM_INSET_MIN, isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { getBarShadeHeight, SHADE_TOP_OVERSCAN_PX } from '../lib/getBarShadeHeight'
import { getMiniPlayerGeometry } from '../lib/getMiniPlayerGeometry'
import { useBarMorphProgress } from '../model/useBarMorphProgress'
import { useProgressAnimation } from '../model/useProgressAnimation'

// One subtle but perceptible depth cue behind the whole bottom-bar complex. The
// shade is edge to edge (no side insets, no radius) and anchors to the very
// screen bottom (the Android navbar is transparent, so the safe-area inset is
// deliberately ignored). Its top edge tracks the current chrome top as the bar
// morphs — the mini-pill top when a pill is visible, the islands row top
// otherwise — ending a few pixels above it so the ramp never lands a hard edge
// on the glass rim.
// Full opacity from the screen bottom up to the chrome's vertical middle; only
// the overscan above the chrome top is a ramp. The shape is identical in both
// themes, but the ramp is gray in the dark one: black-on-black would vanish,
// while the mid-gray stop reads as a faint depth cue rather than a white glow.
// The gray alpha is doubled versus the light stop (128/255 is roughly half the
// luminance of white), so both themes keep the same perceived density.
const SHADE_OPAQUE_LIGHT = 'rgba(0, 0, 0, 0.18)'
const SHADE_OPAQUE_DARK = 'rgba(128, 128, 128, 0.36)'
const SHADE_COLORS_LIGHT = ['rgba(0, 0, 0, 0)', SHADE_OPAQUE_LIGHT] as const
const SHADE_COLORS_DARK = ['rgba(128, 128, 128, 0)', SHADE_OPAQUE_DARK] as const
const SHADE_CAP_LOCATIONS = [0, 1] as const

const getShadeColors = (isLight: boolean) => (isLight ? SHADE_COLORS_LIGHT : SHADE_COLORS_DARK)
const getShadeFill = (isLight: boolean) => (isLight ? SHADE_OPAQUE_LIGHT : SHADE_OPAQUE_DARK)

const getShadeHeight = (bottom: number) => {
  'worklet'
  return bottom + PLAYER_SIZES.miniPlayerHeight + SHADE_TOP_OVERSCAN_PX
}

/**
 * Ramp zone: the shade top down to the pill's vertical middle (overscan plus the
 * pill's upper half), so `locations={[0, 1]}` stay exact on every morph frame.
 */
const SHADE_CAP_HEIGHT_PX = SHADE_TOP_OVERSCAN_PX + PLAYER_SIZES.miniPlayerHeight / 2

/**
 * Single very subtle vertical gradient from the screen bottom up to the visible
 * bottom chrome, rendered as the first child of the tab bar's floating container
 * so it sits above the screens and behind the islands. Below the fixed cap the
 * rest of the shade is one solid opaque block. With a mini pill it anchors to
 * the pill top; without one it anchors to the islands row top and follows the
 * bar collapse morph. Hidden only on fullscreen expansion once its morph has
 * settled, or before the tab bar has been measured. The container owns the
 * keyboard lift.
 */
export const BarBackdropShade = () => {
  const { isLight } = useTheme()
  const { bottom } = useSafeAreaInsets()
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
  const bottomPadding = Math.max(bottom, BAR_BOTTOM_INSET_MIN)
  // A boolean keeps the worklet closure free of the whole audio object.
  const hasAudio = audio !== null

  const shadeStyle = useAnimatedStyle(() => {
    if (!hasAudio) return { height: getBarShadeHeight(progress.value, bottomPadding) }

    const { bottom: pillBottom } = getMiniPlayerGeometry({
      barProgress: progress.value,
      fullScreenHeight: screenHeight,
      screenWidth,
      tabBarHeight,
    })

    return { height: getShadeHeight(pillBottom) }
  })

  if ((expanded && settledExpanded) || !isTabBarMeasured) return null

  return (
    <Animated.View pointerEvents='none' style={styles.layer}>
      <Animated.View style={[styles.shade, shadeStyle]}>
        <LinearGradient
          style={styles.cap}
          pointerEvents='none'
          locations={SHADE_CAP_LOCATIONS}
          colors={getShadeColors(isLight)}
        />
        <View style={[styles.fill, { backgroundColor: getShadeFill(isLight) }]} />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  cap: {
    height: SHADE_CAP_HEIGHT_PX,
  },
  fill: {
    flex: 1,
  },
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
