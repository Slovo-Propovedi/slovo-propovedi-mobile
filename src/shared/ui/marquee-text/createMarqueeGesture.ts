import { Platform } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { cancelAnimation } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { clampMarqueeOffset, HOLD_MS, shouldArmMarquee } from './marquee-utils'

export const createMarqueeGesture = (
  translateX: SharedValue<number>,
  startX: SharedValue<number>,
  maxOffset: SharedValue<number>,
  startIdleMarquee: () => void,
  didDrag: SharedValue<boolean>,
  marqueeArmed: SharedValue<boolean>,
) => {
  const pan = Gesture.Pan().shouldCancelWhenOutside(false).activeCursor('grabbing')

  // Desktop users press-and-drag immediately; long-press activation loses the
  // race with touch-slop failure (PanGestureHandler.tryBegin cancels activation
  // when the pointer moves > touch slop within the hold window). minDistance(10)
  // activates on the first real movement — no 250ms wait before scrubbing.
  // Native keeps the long-press so a slow click still navigates.
  if (Platform.OS === 'web') pan.minDistance(10).failOffsetY([-14, 14])
  else pan.activateAfterLongPress(HOLD_MS)

  return pan
    .onBegin(() => {
      'worklet'
      didDrag.value = false
    })
    .onStart(() => {
      'worklet'
      didDrag.value = true
      cancelAnimation(translateX)
      startX.value = translateX.value
    })
    .onChange(e => {
      'worklet'
      const next = startX.value + e.translationX
      translateX.value = clampMarqueeOffset(next, maxOffset.value)
    })
    .onEnd(e => {
      'worklet'
      startX.value = translateX.value
      const isArmed = shouldArmMarquee(e.translationX)
      if (isArmed) {
        marqueeArmed.value = true
        startIdleMarquee()
      }
      // A slow click (held ≥ HOLD_MS, zero movement) activates the pan but is
      // not a drag: keep the click alive so the parent pressable navigates.
      if (!isArmed) didDrag.value = false
    })
}
