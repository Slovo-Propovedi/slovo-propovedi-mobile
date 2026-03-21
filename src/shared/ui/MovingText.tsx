import { StyleSheet } from 'react-native'
import TextTicker from 'react-native-text-ticker'
import type { StyleProp, TextStyle } from 'react-native'
import { COLORS } from './themed'

interface MovingTextProps {
  animationThreshold?: number
  containerWidth?: number
  style?: StyleProp<TextStyle>
  text: string
}

const DEFAULT_THRESHOLD = 25

export const MovingText = ({
  animationThreshold = DEFAULT_THRESHOLD,
  style,
  text,
}: MovingTextProps) => {
  const shouldAnimate = text.length > animationThreshold

  if (!shouldAnimate)
    return (
      <TextTicker
        duration={0}
        loop={false}
        bounce={false}
        marqueeDelay={0}
        style={[styles.text, style]}
      >
        {text}
      </TextTicker>
    )

  return (
    <TextTicker
      loop
      bounce={false}
      scrollSpeed={8}
      numberOfLines={1}
      repeatSpacer={50}
      marqueeDelay={2000}
      style={[styles.text, style]}
    >
      {text}
    </TextTicker>
  )
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.text,
  },
})
