import { Gesture } from 'react-native-gesture-handler'
import { cancelAnimation } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { clampMarqueeOffset, HOLD_MS } from './marquee-utils'

export const createMarqueeGesture = (
  translateX: SharedValue<number>,
  startX: SharedValue<number>,
  maxOffset: SharedValue<number>,
  startIdleMarquee: () => void,
) =>
  Gesture.Pan()
    .activateAfterLongPress(HOLD_MS)
    .shouldCancelWhenOutside(false)
    .onStart(() => {
      'worklet'
      cancelAnimation(translateX)
      startX.value = translateX.value
    })
    .onChange(e => {
      'worklet'
      const next = startX.value + e.translationX
      translateX.value = clampMarqueeOffset(next, maxOffset.value)
    })
    .onEnd(() => {
      'worklet'
      startX.value = translateX.value
      startIdleMarquee()
    })
