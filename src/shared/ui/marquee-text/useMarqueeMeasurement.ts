import { useState } from 'react'
import { useDerivedValue, useSharedValue } from 'react-native-reanimated'
import type { LayoutChangeEvent, TextLayoutEvent } from 'react-native'
import { shouldMarquee } from './marquee-utils'

export const useMarqueeMeasurement = () => {
  const [needsRepeat, setNeedsRepeat] = useState(false)

  const containerWidth = useSharedValue(0)
  const textWidth = useSharedValue(0)
  const maxOffset = useDerivedValue(() => Math.max(0, textWidth.value - containerWidth.value))
  const needsMarquee = useDerivedValue(() => shouldMarquee(maxOffset.value))

  const evaluateNeedsRepeat = (containerW: number, textW: number) => {
    const next = containerW > 0 && textW > 0 && shouldMarquee(Math.max(0, textW - containerW))
    setNeedsRepeat(next)
  }

  const applyTextWidth = (width: number) => {
    textWidth.value = width
    evaluateNeedsRepeat(containerWidth.value, textWidth.value)
  }

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    containerWidth.value = e.nativeEvent.layout.width
    evaluateNeedsRepeat(containerWidth.value, textWidth.value)
  }

  const handleTextLayout = (e: TextLayoutEvent) => {
    const lines = e.nativeEvent.lines
    applyTextWidth(lines.length > 0 ? lines[0].width : 0)
  }

  const handleMeasurerLayout = (e: LayoutChangeEvent) => {
    applyTextWidth(e.nativeEvent.layout.width)
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
