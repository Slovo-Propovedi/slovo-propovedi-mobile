import { Platform } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import type { SharedValue } from 'react-native-reanimated'
import { clampMarqueeOffset, HOLD_MS, isRealDrag } from './marquee-utils'

export const createMarqueeGesture = (
  translateX: SharedValue<number>,
  startX: SharedValue<number>,
  maxOffset: SharedValue<number>,
  startIdleMarquee: () => void,
  didDrag: SharedValue<boolean>,
  marqueeArmed: SharedValue<boolean>,
  clockPaused: SharedValue<boolean>,
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
      // Pause the frame clock: otherwise it would fight the scrub every frame.
      clockPaused.value = true
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
      const isArmed = isRealDrag(e.translationX)
      if (isArmed) {
        marqueeArmed.value = true
        startIdleMarquee()
        return
      }
      // A slow click (held ≥ HOLD_MS, zero movement) activates the pan but is
      // not a drag: keep the click alive so the parent pressable navigates.
      didDrag.value = false
      // Resume-on-jitter: an armed row (autoStart or a previous drag) must not
      // stay frozen by the onStart pause — restart its loop from phase 0. A
      // never-armed gated row stays paused at the scrub position (spec).
      if (marqueeArmed.value) startIdleMarquee()
    })
    .onFinalize((_e, success) => {
      'worklet'
      // A cancelled/failed gesture never ran the normal onEnd path, so didDrag
      // would stay armed and swallow the next legitimate click. Reset it only
      // on failure — a successful drag must keep didDrag armed until the
      // browser's post-drag `click` fires (the click guard reads it at click
      // time, which on web is after onFinalize).
      if (!success) {
        didDrag.value = false
        // Likewise resume an armed row: the onStart pause would otherwise
        // freeze the loop after an outer handler (e.g. miniPan) cancels.
        if (marqueeArmed.value) startIdleMarquee()
      }
    })
}
