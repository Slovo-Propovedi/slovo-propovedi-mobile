import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from 'shared/config'

interface PlayerAnimationValues {
  animValue: Animated.Value
  contentOpacity: Animated.AnimatedInterpolation<number>
  fullscreenBorderRadius: Animated.AnimatedInterpolation<number>
  fullscreenBottom: Animated.AnimatedInterpolation<number>
  fullscreenHeight: Animated.AnimatedInterpolation<number>
  fullscreenLeft: Animated.AnimatedInterpolation<number>
  fullscreenRight: Animated.AnimatedInterpolation<number>
  fullscreenWidth: Animated.AnimatedInterpolation<number>
  miniContentOpacity: Animated.AnimatedInterpolation<number>
  miniPlayerOpacity: Animated.AnimatedInterpolation<number>
  shouldRenderFullscreen: boolean
}

interface UsePlayerAnimation {
  isFullscreen: boolean
}

export const usePlayerAnimation = ({ isFullscreen }: UsePlayerAnimation): PlayerAnimationValues => {
  const [shouldRenderFullscreen, setShouldRenderFullscreen] = useState(false)
  const animValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isFullscreen) setShouldRenderFullscreen(true)

    Animated.timing(animValue, {
      duration: 400,
      toValue: isFullscreen ? 1 : 0,
      useNativeDriver: false,
    }).start(() => {
      if (!isFullscreen) setShouldRenderFullscreen(false)
    })
  }, [isFullscreen])

  const miniPlayerOpacity = animValue.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 0.3],
    outputRange: [1, 0],
  })

  const fullscreenWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH - 20, SCREEN_WIDTH],
  })

  const fullscreenHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [110, SCREEN_HEIGHT],
  })

  const fullscreenBorderRadius = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 0],
  })

  const fullscreenBottom = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  })

  const fullscreenLeft = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  })

  const fullscreenRight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  })

  const contentOpacity = animValue.interpolate({
    extrapolate: 'clamp',
    inputRange: [0.5, 1],
    outputRange: [0, 1],
  })

  const miniContentOpacity = animValue.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 0.5],
    outputRange: [1, 0],
  })

  return {
    animValue,
    contentOpacity,
    fullscreenBorderRadius,
    fullscreenBottom,
    fullscreenHeight,
    fullscreenLeft,
    fullscreenRight,
    fullscreenWidth,
    miniContentOpacity,
    miniPlayerOpacity,
    shouldRenderFullscreen,
  }
}
