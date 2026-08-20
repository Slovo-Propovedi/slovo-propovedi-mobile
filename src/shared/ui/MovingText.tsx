import { type StyleProp, type TextStyle } from 'react-native'
import TextTicker from 'react-native-text-ticker'
import { useTheme } from './theme/ThemeContext/useTheme'

interface MovingTextProps {
  animationThreshold?: number
  containerWidth?: number
  style?: StyleProp<TextStyle>
  testID?: string
  text: string
}

const DEFAULT_THRESHOLD = 25

export const MovingText = ({
  animationThreshold = DEFAULT_THRESHOLD,
  style,
  testID,
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
        testID={testID}
        marqueeDelay={0}
        isInteraction={false}
        style={[{ color: currentTheme.text }, style]}
      >
        {text}
      </TextTicker>
    )

  return (
    <TextTicker
      loop
      bounce={false}
      testID={testID}
      scrollSpeed={30}
      numberOfLines={1}
      repeatSpacer={50}
      marqueeDelay={2000}
      isInteraction={false}
      style={[{ color: currentTheme.text }, style]}
    >
      {text}
    </TextTicker>
  )
}
