import type { StyleProp, TextStyle } from 'react-native'
import { MarqueeText } from './marquee-text/marquee-text'
import { useTheme } from './theme/ThemeContext/useTheme'

interface MovingTextProps {
  style?: StyleProp<TextStyle>
  testID?: string
  text: string
}

export const MovingText = ({ style, testID, text }: MovingTextProps) => {
  const { currentTheme } = useTheme()

  return (
    <MarqueeText text={text} testID={testID} textStyle={[{ color: currentTheme.text }, style]} />
  )
}
