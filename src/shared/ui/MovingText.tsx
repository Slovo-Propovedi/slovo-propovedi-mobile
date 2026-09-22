import { memo } from 'react'
import type { StyleProp, TextStyle } from 'react-native'
import { MarqueeText } from './marquee-text/marquee-text'
import { useTheme } from './theme/ThemeContext/useTheme'

interface MovingTextProps {
  autoStart?: boolean
  centerWhenStatic?: boolean
  style?: StyleProp<TextStyle>
  testID?: string
  text: string
}

const MovingTextComponent = ({
  autoStart,
  centerWhenStatic,
  style,
  testID,
  text,
}: MovingTextProps) => {
  const { currentTheme } = useTheme()

  return (
    <MarqueeText
      text={text}
      testID={testID}
      autoStart={autoStart}
      centerWhenStatic={centerWhenStatic}
      textStyle={[{ color: currentTheme.text }, style]}
    />
  )
}

// Player call sites pass stable StyleSheet styles; memo keeps audio-position
// ticks (~2/s) from re-running MarqueeText when the title/style are unchanged.
export const MovingText = memo(MovingTextComponent)
MovingText.displayName = 'MovingText'
