import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { isTabBarMeasuredAtom, tabBarHeightAtom, useKeyboardLiftStyle } from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry } from '../lib/getMiniPlayerGeometry'
import { useBarMorphProgress } from '../model/useBarMorphProgress'

// One whisper-quiet depth cue behind the whole bottom-bar complex. The shade is
// edge to edge (no side insets, no radius) and anchors to the very screen bottom
// (the Android navbar is transparent, so the safe-area inset is deliberately
// ignored). Its top edge tracks the CURRENT mini-player top as the bar morphs.
const SHADE_COLORS = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.10)'] as const
// Keep the upper 40% fully transparent: depth, never a grey wall.
const SHADE_LOCATIONS = [0.4, 1] as const

/**
 * Single very subtle vertical gradient from the screen bottom up to the mini
 * player top, rendered before the islands so it sits behind them. Hidden in the
 * same conditions as the collapsed mini player: no audio or fullscreen
 * expansion. It follows the keyboard lift exactly like the pill.
 */
export const BarBackdropShade = () => {
  const [audio] = useAtom(currentAudioAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { progress } = useBarMorphProgress()
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()
  const keyboardLiftStyle = useKeyboardLiftStyle()

  const shadeStyle = useAnimatedStyle(() => {
    const { bottom } = getMiniPlayerGeometry({
      barProgress: progress.value,
      fullScreenHeight: screenHeight,
      screenWidth,
      tabBarHeight,
    })

    return { height: bottom + PLAYER_SIZES.miniPlayerHeight }
  })

  if (!audio || expanded || !isTabBarMeasured) return null

  return (
    <Animated.View pointerEvents='none' style={styles.layer}>
      <Animated.View style={[styles.shade, keyboardLiftStyle, shadeStyle]}>
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
  layer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  shade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
})
