import {
  type LayoutChangeEvent,
  type StyleProp,
  type TextLayoutEvent,
  type TextStyle,
} from 'react-native'
import { MarqueeMeasurer } from './marquee-measurer'

// A fully transparent Text is exactly what OEM builds skip measuring, so the
// first retry de-hides the measurer to a barely-visible ghost at left:0/top:0.
const RETRY_MEASURER_OPACITY = 0.02

interface MarqueeMeasurerSlotProps {
  attempt: number
  isWeb: boolean
  onTextWidth: (width: number) => void
  text: string
  textStyle: StyleProp<TextStyle>
}

// Owns the hidden measurer and its retry wiring: `key` remounts the Text on
// every attempt, `measurerOpacity` de-hides it from the first retry.
export const MarqueeMeasurerSlot = ({
  attempt,
  isWeb,
  onTextWidth,
  text,
  textStyle,
}: MarqueeMeasurerSlotProps) => {
  const handleTextLayout = (event: TextLayoutEvent) => {
    const lines = event.nativeEvent.lines
    onTextWidth(lines.length > 0 ? lines[0].width : 0)
  }

  const handleMeasurerLayout = (event: LayoutChangeEvent) => {
    onTextWidth(event.nativeEvent.layout.width)
  }

  return (
    <MarqueeMeasurer
      text={text}
      isWeb={isWeb}
      key={attempt}
      textStyle={textStyle}
      onLayout={handleMeasurerLayout}
      onTextLayout={handleTextLayout}
      measurerOpacity={isWeb || attempt === 0 ? undefined : RETRY_MEASURER_OPACITY}
    />
  )
}
