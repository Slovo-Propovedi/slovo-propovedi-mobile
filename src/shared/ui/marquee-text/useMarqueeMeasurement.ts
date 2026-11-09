/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated in layout handlers and worklets */
import { useCallback, useState } from 'react'
import { type LayoutChangeEvent, Platform, type TextLayoutEvent } from 'react-native'
import {
  type ReanimatedEvent,
  useDerivedValue,
  useEvent,
  useSharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { shouldMarquee } from './marquee-utils'

export const useMarqueeMeasurement = () => {
  const isWeb = Platform.OS === 'web'
  const [needsRepeat, setNeedsRepeat] = useState(false)

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

  const applyTextWidth = (width: number) => {
    textWidth.value = width
    applyNeedsRepeat(containerWidth.value, width)
  }

  // Web has no worklets: the plain handler runs on the JS thread synchronously.
  const handleContainerLayout = isWeb
    ? (event: LayoutChangeEvent) => {
        containerWidth.value = event.nativeEvent.layout.width
        applyNeedsRepeat(containerWidth.value, textWidth.value)
      }
    : handleWorkletLayout

  const handleTextLayout = (event: TextLayoutEvent) => {
    const lines = event.nativeEvent.lines
    applyTextWidth(lines.length > 0 ? lines[0].width : 0)
  }

  const handleMeasurerLayout = (event: LayoutChangeEvent) => {
    applyTextWidth(event.nativeEvent.layout.width)
  }

  return {
    containerWidth,
    handleContainerLayout,
    handleMeasurerLayout,
    handleTextLayout,
    maxOffset,
    needsMarquee,
    needsRepeat,
    textWidth,
  }
}
