/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated in layout handlers and worklets */
import { useCallback, useEffect, useRef, useState } from 'react'
import { type LayoutChangeEvent, Platform } from 'react-native'
import {
  type ReanimatedEvent,
  useDerivedValue,
  useEvent,
  useSharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { shouldMarquee } from './marquee-utils'

// If a device never reports the hidden measurer's `onTextLayout`, `textWidth`
// stays 0 and the title never marquees. Remount the measurer with a growing
// delay and a barely-visible opacity until a layout pass lands.
const MEASURER_RETRY_MAX_ATTEMPTS = 5
const MEASURER_RETRY_BASE_MS = 400

export const useMarqueeMeasurement = (text: string) => {
  const isWeb = Platform.OS === 'web'
  const [needsRepeat, setNeedsRepeat] = useState(false)
  // The attempt is tied to its text so a new title derives attempt 0 without
  // resetting state from an effect.
  const [attemptState, setAttemptState] = useState({ count: 0, text })
  const measuredRef = useRef(false)

  const containerWidth = useSharedValue(0)
  const textWidth = useSharedValue(0)
  const maxOffset = useDerivedValue(() => Math.max(0, textWidth.value - containerWidth.value))
  const needsMarquee = useDerivedValue(() => shouldMarquee(maxOffset.value))

  const applyNeedsRepeat = useCallback((containerW: number, textW: number) => {
    setNeedsRepeat(containerW > 0 && textW > 0 && shouldMarquee(Math.max(0, textW - containerW)))
  }, [])

  // The pill width animates on the UI thread while `onLayout` reaches JS late on
  // a busy device. Updating the shared value inside the worklet keeps the
  // overflow geometry (and the duplicate-copy gate) in step with the animation.
  const handleWorkletLayout = useEvent((event: ReanimatedEvent<LayoutChangeEvent>) => {
    'worklet'
    containerWidth.value = event.layout.width
    scheduleOnRN(applyNeedsRepeat, containerWidth.value, textWidth.value)
  })

  const applyTextWidth = useCallback(
    (width: number) => {
      textWidth.value = width
      if (width > 0) measuredRef.current = true
      applyNeedsRepeat(containerWidth.value, width)
    },
    [applyNeedsRepeat, containerWidth, textWidth],
  )

  // Plain-JS fallback for the same box: some OEM builds (Xiaomi/Android 15
  // confirmed) never dispatch the Reanimated worklet onLayout above, so a plain
  // View probe measures the container through the standard RN pipeline. Both
  // paths may report; they set the same shared value.
  const handleContainerFallbackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      containerWidth.value = event.nativeEvent.layout.width
      applyNeedsRepeat(containerWidth.value, textWidth.value)
    },
    [applyNeedsRepeat, containerWidth, textWidth],
  )

  // Web has no worklets: the plain handler runs on the JS thread synchronously.
  const handleContainerLayout = isWeb ? handleContainerFallbackLayout : handleWorkletLayout

  // A new title starts a fresh measurement episode: one busted title must not
  // disable marquee for every later one.
  useEffect(() => {
    measuredRef.current = false
  }, [text])

  const measurerAttempt = attemptState.text === text ? attemptState.count : 0

  // Native-only self-heal: remount the measurer until a width lands. A landed
  // width stops the loop; the pending timer is cleared on re-run/unmount.
  useEffect(() => {
    if (isWeb || !text) return
    if (measuredRef.current) return

    if (measurerAttempt >= MEASURER_RETRY_MAX_ATTEMPTS) {
      console.warn(
        `MarqueeText: text width measurement failed after ${MEASURER_RETRY_MAX_ATTEMPTS} attempts`,
      )
      return
    }

    const timer = setTimeout(
      () => {
        if (measuredRef.current) return
        setAttemptState(current =>
          current.text === text ? { count: current.count + 1, text } : { count: 1, text },
        )
      },
      MEASURER_RETRY_BASE_MS * (measurerAttempt + 1),
    )

    return () => clearTimeout(timer)
  }, [isWeb, measurerAttempt, text])

  return {
    applyTextWidth,
    containerWidth,
    handleContainerFallbackLayout,
    handleContainerLayout,
    maxOffset,
    measurerAttempt,
    needsMarquee,
    needsRepeat,
    textWidth,
  }
}
