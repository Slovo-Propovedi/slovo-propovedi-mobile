import {
  type LayoutChangeEvent,
  type StyleProp,
  Text,
  type TextLayoutEvent,
  type TextStyle,
} from 'react-native'
import { NATIVE_MEASURER_STYLE, WEB_MEASURER_STYLE } from './marquee-styles'

interface MarqueeMeasurerProps {
  isWeb: boolean
  measurerOpacity?: number
  onLayout: (event: LayoutChangeEvent) => void
  onTextLayout: (event: TextLayoutEvent) => void
  text: string
  textStyle: StyleProp<TextStyle>
}

// Hidden full-width copy used to measure the natural text width: on web the
// width comes from `onLayout` (max-content), on native from the first rendered
// line (`onTextLayout`). On native the caller may nudge `opacity` above zero so
// a remounted measurer reliably gets a layout pass on OEM builds that skip
// fully transparent views.
export const MarqueeMeasurer = ({
  isWeb,
  measurerOpacity = 0,
  onLayout,
  onTextLayout,
  text,
  textStyle,
}: MarqueeMeasurerProps) => (
  <Text
    onLayout={isWeb ? onLayout : undefined}
    onTextLayout={isWeb ? undefined : onTextLayout}
    style={[
      textStyle,
      isWeb ? WEB_MEASURER_STYLE : NATIVE_MEASURER_STYLE,
      isWeb ? undefined : { opacity: measurerOpacity },
    ]}
  >
    {text}
  </Text>
)
