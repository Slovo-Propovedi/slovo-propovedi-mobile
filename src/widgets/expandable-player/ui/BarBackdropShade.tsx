import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { BAR_BOTTOM_INSET_MIN, isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getBarShadeHeight, getShadeHeight, getShadeLocations } from '../lib/getBarShadeHeight'
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
// One continuous gradient: full opacity from the pill's vertical middle down,
// transparent above it. A single layer leaves no cap/fill junction that some
// panels (Xiaomi on Android 15) read as a hairline across the pill. The shape
// is identical in both themes, but the ramp is gray in the dark one:
// black-on-black would vanish, while the mid-gray stop reads as a faint depth
// cue rather than a white glow. The gray alpha is doubled versus the light stop
// (128/255 is roughly half the luminance of white), so both themes keep the
// same perceived density.
const SHADE_OPAQUE_LIGHT = 'rgba(0, 0, 0, 0.18)'
const SHADE_OPAQUE_DARK = 'rgba(128, 128, 128, 0.36)'
const SHADE_COLORS_LIGHT = ['rgba(0, 0, 0, 0)', SHADE_OPAQUE_LIGHT, SHADE_OPAQUE_LIGHT] as const
const SHADE_COLORS_DARK = ['rgba(128, 128, 128, 0)', SHADE_OPAQUE_DARK, SHADE_OPAQUE_DARK] as const

const getShadeColors = (isLight: boolean) => (isLight ? SHADE_COLORS_LIGHT : SHADE_COLORS_DARK)

/**
 * Single very subtle vertical gradient from the screen bottom up to the visible
 * bottom chrome, rendered as the first child of the tab bar's floating container
 * so it sits above the screens and behind the islands. With a mini pill it
 * anchors to the pill top; without one it anchors to the islands row top and
 * follows the bar collapse morph. Hidden only on fullscreen expansion once its
 * morph has settled, or before the tab bar has been measured. The container owns
 * the keyboard lift.
 */
export const BarBackdropShade = () => {
  const { isLight } = useTheme()
  const { bottom } = useSafeAreaInsets()
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
  const bottomPadding = Math.max(bottom, BAR_BOTTOM_INSET_MIN)
  // A boolean keeps the worklet closure free of the whole audio object.
  const hasAudio = !!audio

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

  // Gradient stops come from the SETTLED geometry (plain React props, recomputed
  // only on state commits), never per animation frame. During the 300 ms morph
  // the ramp endpoint drifts at most a few pixels. The expand morph only gates
  // unmount through `settledExpanded` — it does not change the shade geometry.
  const settledShadeHeight = hasAudio
    ? getShadeHeight(
        getMiniPlayerGeometry({
          barProgress: settledCollapsed ? 1 : 0,
          fullScreenHeight: screenHeight,
          screenWidth,
          tabBarHeight,
        }).bottom,
      )
    : getBarShadeHeight(settledCollapsed ? 1 : 0, bottomPadding)

  if ((expanded && settledExpanded) || !isTabBarMeasured) return null

  return (
    <Animated.View pointerEvents='none' style={styles.layer}>
      <Animated.View style={[styles.shade, shadeStyle]}>
        <LinearGradient
          pointerEvents='none'
          style={StyleSheet.absoluteFill}
          colors={getShadeColors(isLight)}
          locations={getShadeLocations(settledShadeHeight)}
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
