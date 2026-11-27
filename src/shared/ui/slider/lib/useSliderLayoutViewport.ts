import { useState } from 'react'
import { type LayoutChangeEvent } from 'react-native'
import { useLayoutBaseWidth } from '../../layout/lib/useLayoutBaseWidth'
import { getSliderLayoutViewport } from '../slider-layout.lib'

/**
 * Viewport the slider cards are sized from.
 *
 * Sizes come from the frozen chrome base, never from the live list width, so a
 * rotation cannot resize the cards in a second commit after the native
 * relayout. The measured width is only an upper clamp for an embedded,
 * narrower list.
 */
export const useSliderLayoutViewport = () => {
  const baseWidth = useLayoutBaseWidth()
  const [measuredWidth, setMeasuredWidth] = useState<number>()
  const layoutViewport = getSliderLayoutViewport(baseWidth, measuredWidth)
  const onMeasuredWidthChange = (event: LayoutChangeEvent) =>
    setMeasuredWidth(event.nativeEvent.layout.width)

  return { layoutViewport, measuredWidth, onMeasuredWidthChange }
}
