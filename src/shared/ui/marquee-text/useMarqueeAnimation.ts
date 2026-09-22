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

// Absorbs Yoga pixel-grid rounding when sizing a static centered row.
const STATIC_WIDTH_SAFETY_PX = 2

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

  useEffect(() => {
    cancelAnimation(translateX)
    translateX.value = 0
    startX.value = 0
  }, [text])

  const animatedStyle = useAnimatedStyle(() => {
    // The visible Text keeps numberOfLines={1} on native, so ANY width smaller
    // than the rendered text (pixel-grid rounding, epsilon-fitting titles) makes
    // Android word-wrap the last word onto a hidden second line — the word
    // vanishes leaving a blank gap. The static state therefore reuses the
    // marquee geometry: the row is always wide enough for the full single-line
    // text and the container's overflow: 'hidden' does the cutting, exactly
    // like the first frame of the loop.
    const marqueeWidth = textWidth.value ? textWidth.value * 2 + REPEAT_SPACER : undefined

    // centerWhenStatic needs the row ≈ text width for meaningful centering;
    // the safety margin absorbs Yoga pixel-grid rounding so it never wraps.
    const staticWidth = isWeb
      ? '100%'
      : textWidth.value
        ? textWidth.value + STATIC_WIDTH_SAFETY_PX
        : undefined

    return {
      justifyContent: !needsMarquee.value && centerWhenStatic ? 'center' : 'flex-start',
      transform: [{ translateX: translateX.value }],
      width: needsMarquee.value || !centerWhenStatic ? marqueeWidth : staticWidth,
    }
  })

  const startIdleMarquee = () => {
    'worklet'
    if (!needsMarquee.value) {
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

  return { animatedStyle, startIdleMarquee, startX, translateX }
}
