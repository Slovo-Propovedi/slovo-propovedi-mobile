import TextTicker from 'react-native-text-ticker'
import type { StyleProp, TextStyle } from 'react-native'
import { useTheme } from './themed'

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
  const { currentTheme } = useTheme()
  const shouldAnimate = text.length > animationThreshold

  if (!shouldAnimate)
    return (
      <TextTicker
        duration={0}
        loop={false}
        bounce={false}
        marqueeDelay={0}
        style={[{ color: currentTheme.text }, style]}
      >
        {text}
      </TextTicker>
    )

  return (
    <TextTicker
      loop
      bounce={false}
      scrollSpeed={30}
      numberOfLines={1}
      repeatSpacer={50}
      marqueeDelay={2000}
      style={[{ color: currentTheme.text }, style]}
    >
      {text}
    </TextTicker>
  )
}
