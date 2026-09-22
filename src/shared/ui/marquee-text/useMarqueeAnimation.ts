import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { REPEAT_SPACER } from './marquee-utils'
import { useMarqueeFrameClock } from './useMarqueeFrameClock'

// Absorbs Yoga pixel-grid rounding when sizing a static centered row.
const STATIC_WIDTH_SAFETY_PX = 2

export const useMarqueeAnimation = (
  containerWidth: SharedValue<number>,
  textWidth: SharedValue<number>,
  needsMarquee: SharedValue<boolean>,
  text: string,
  isWeb: boolean,
  centerWhenStatic: boolean,
  autoStart: boolean,
  needsRepeat: boolean,
) => {
  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)
  // Gated consumers (sliders, track lists) start disarmed and only arm the
  // loop after a real drag; autoStart consumers (player titles) arm upfront.
  const marqueeArmed = useSharedValue(autoStart)

  const { clockPaused, frameCallback, startIdleMarquee } = useMarqueeFrameClock({
    autoStart,
    containerWidth,
    marqueeArmed,
    needsMarquee,
    needsRepeat,
    startX,
    text,
    textWidth,
    translateX,
  })

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

  return {
    animatedStyle,
    clockPaused,
    frameCallback,
    marqueeArmed,
    startIdleMarquee,
    startX,
    translateX,
  }
}
