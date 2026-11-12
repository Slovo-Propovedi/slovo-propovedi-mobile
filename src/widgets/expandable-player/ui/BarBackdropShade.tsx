import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import {
  BAR_BOTTOM_INSET_MIN,
  BAR_MORPH_DURATION_MS,
  isTabBarMeasuredAtom,
  tabBarHeightAtom,
} from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { getBarShadeHeight, getPillShadeHeight, getShadeLocations } from '../lib/getBarShadeHeight'
import { useBarMorphProgress } from '../model/useBarMorphProgress'
import { useProgressAnimation } from '../model/useProgressAnimation'

// One subtle depth cue behind the bottom-bar complex: edge to edge, anchored to
// the screen bottom (the transparent Android navbar means the inset is ignored).
// Its top tracks the current chrome top with overscan, and one continuous
// gradient leaves no cap/fill junction; the dark ramp is gray with doubled alpha.
const SHADE_OPAQUE_LIGHT = 'rgba(0, 0, 0, 0.18)'
const SHADE_OPAQUE_DARK = 'rgba(128, 128, 128, 0.36)'
const SHADE_COLORS_LIGHT = ['rgba(0, 0, 0, 0)', SHADE_OPAQUE_LIGHT, SHADE_OPAQUE_LIGHT] as const
const SHADE_COLORS_DARK = ['rgba(128, 128, 128, 0)', SHADE_OPAQUE_DARK, SHADE_OPAQUE_DARK] as const

const getShadeColors = (isLight: boolean) => (isLight ? SHADE_COLORS_LIGHT : SHADE_COLORS_DARK)

/**
 * Vertical gradient behind the bottom chrome, rendered as the first child of the
 * tab-bar floating container. It is pill-anchored only where this zone mounts
 * the mini player (`hasMiniPlayer`) and retracts to the islands row while the
 * search field is focused. Hidden on settled fullscreen expansion in the player
 * zone, or before the tab bar has been measured.
 * @param root0 - Component props.
 * @param root0.hasMiniPlayer - Whether this zone mounts the mini-player pill.
 */
export const BarBackdropShade = ({ hasMiniPlayer }: { hasMiniPlayer: boolean }) => {
  const { isLight } = useTheme()
  const { bottom } = useSafeAreaInsets()
  const [audio] = useAtom(currentAudioAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { progress, settledCollapsed } = useBarMorphProgress()
  const [isFocused] = useAtom(isSearchFieldFocusedAtom)
  const focusProgress = useSharedValue(isFocused ? 1 : 0)
  // Starts after the tuck's zIndex commit; the pill uses the same post-commit
  // timing, so the shade and the sliding pill stay in step.
  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [focusProgress, isFocused])
  // The shade has no expand animation of its own: this shared value only drives
  // the pill's settle timing, so the shade stays behind the pill for the whole
  // expand morph instead of popping out on its first frame.
  const expandProgress = useSharedValue(expanded ? 1 : 0)
  const { settledExpanded } = useProgressAnimation(expanded, expandProgress)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()
  const bottomPadding = Math.max(bottom, BAR_BOTTOM_INSET_MIN)
  // A boolean keeps the worklet closure free of the whole audio object.
  const hasAudio = !!audio
  // Pill geometry is only real in zones that mount the mini player.
  const hasPill = hasAudio && hasMiniPlayer

  const shadeStyle = useAnimatedStyle(() => {
    if (!hasPill) return { height: getBarShadeHeight(progress.value, bottomPadding) }

    return {
      height: getPillShadeHeight({
        barProgress: progress.value,
        bottomPadding,
        focusProgress: focusProgress.value,
        fullScreenHeight: screenHeight,
        screenWidth,
        tabBarHeight,
      }),
    }
  })

  // Gradient stops come from the SETTLED geometry (plain React props, recomputed
  // on state commits, never per frame); the expand morph only gates unmount.
  const settledBarProgress = settledCollapsed ? 1 : 0
  const settledShadeHeight = hasPill
    ? getPillShadeHeight({
        barProgress: settledBarProgress,
        bottomPadding,
        focusProgress: isFocused ? 1 : 0,
        fullScreenHeight: screenHeight,
        screenWidth,
        tabBarHeight,
      })
    : getBarShadeHeight(settledBarProgress, bottomPadding)

  if ((hasPill && expanded && settledExpanded) || !isTabBarMeasured) return null

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
  // No zIndex: the tab-bar layer already paints above the screens, and the
  // zIndex-1 islands row beats this z-auto layer in the CSS step-8 paint order.
  // The taller inner shade overflows upward out of the container box.
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
