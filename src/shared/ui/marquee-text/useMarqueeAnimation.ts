import { useEffect } from 'react'
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import {
  MARQUEE_MS_PER_PX,
  MARQUEE_MS_PER_PX_NARROW,
  MARQUEE_PAUSE,
  NARROW_WIDTH_THRESHOLD,
  REPEAT_SPACER,
} from './marquee-utils'

export const useMarqueeAnimation = (
  containerWidth: SharedValue<number>,
  textWidth: SharedValue<number>,
  needsMarquee: SharedValue<boolean>,
  text: string,
  isWeb: boolean,
  centerWhenStatic: boolean,
) => {
  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)
  const marqueeArmed = useSharedValue(false)

  useEffect(() => {
    cancelAnimation(translateX)
    translateX.value = 0
    startX.value = 0
    marqueeArmed.value = false
  }, [text])

  const animatedStyle = useAnimatedStyle(() => {
    const staticWidth = isWeb ? '100%' : textWidth.value || undefined
    return {
      justifyContent: !needsMarquee.value && centerWhenStatic ? 'center' : 'flex-start',
      transform: [{ translateX: translateX.value }],
      width: needsMarquee.value ? textWidth.value * 2 + REPEAT_SPACER : staticWidth,
    }
  })

  const startIdleMarquee = () => {
    'worklet'
    if (!needsMarquee.value || !marqueeArmed.value) {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value reset in worklet to stop animation
      translateX.value = 0
      return
    }
    const loopDistance = textWidth.value + REPEAT_SPACER
    const msPerPx =
      containerWidth.value < NARROW_WIDTH_THRESHOLD ? MARQUEE_MS_PER_PX_NARROW : MARQUEE_MS_PER_PX
    translateX.value = 0
    translateX.value = withRepeat(
      withSequence(
        withDelay(
          MARQUEE_PAUSE,
          withTiming(-loopDistance, { duration: loopDistance * msPerPx, easing: Easing.linear }),
        ),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    )
  }

  return { animatedStyle, marqueeArmed, startIdleMarquee, startX, translateX }
}
