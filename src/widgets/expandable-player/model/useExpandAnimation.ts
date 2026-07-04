import { useEffect } from 'react'
import { Dimensions, useWindowDimensions } from 'react-native'
import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/ui/themed'
import type { SharedValue } from 'react-native-reanimated'

const MINI_H = PLAYER_SIZES.miniPlayerHeight
const TAB_H = PLAYER_SIZES.tabBarHeight
const MINI_BOTTOM = TAB_H + INDENTS.low

interface UseExpandAnimationResult {
  backdropStyle: ReturnType<typeof useAnimatedStyle>
  backgroundImageStyle: ReturnType<typeof useAnimatedStyle>
  blurStyle: ReturnType<typeof useAnimatedStyle>
  containerStyle: ReturnType<typeof useAnimatedStyle>
  fullStyle: ReturnType<typeof useAnimatedStyle>
  miniOverlayStyle: ReturnType<typeof useAnimatedStyle>
  miniStyle: ReturnType<typeof useAnimatedStyle>
  progress: SharedValue<number>
  screenHeight: number
  screenWidth: number
}

export const useExpandAnimation = (expanded: boolean): UseExpandAnimationResult => {
  const progress = useSharedValue(0)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()
  const fullScreenHeight = Dimensions.get('screen').height

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, { duration: expanded ? 300 : 250 })
  }, [expanded])

  const containerStyle = useAnimatedStyle(() => ({
    borderBottomLeftRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
    borderBottomRightRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
    borderTopLeftRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
    borderTopRightRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
    bottom: interpolate(progress.value, [0, 1], [MINI_BOTTOM, 0]),
    left: interpolate(progress.value, [0, 1], [INDENTS.low, 0]),
    top: interpolate(progress.value, [0, 1], [fullScreenHeight - MINI_BOTTOM - MINI_H, 0]),
    width: interpolate(progress.value, [0, 1], [screenWidth - INDENTS.low * 2, screenWidth]),
  }))

  // Background image animation: fullscreen, just fades in/out
  const backgroundImageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [0, 1]),
  }))

  // Dark overlay for mini player - fades out as it expands
  const miniOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0]),
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [0, 0.5]),
  }))

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [0, 1]),
  }))

  const miniStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [1, 0]),
  }))

  const fullStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 0.8], [0, 1]),
  }))

  return {
    backdropStyle,
    backgroundImageStyle,
    blurStyle,
    containerStyle,
    fullStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
    screenHeight,
    screenWidth,
  }
}
